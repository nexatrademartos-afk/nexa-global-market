-- ============================================================================
-- Migration: 20261028200000_wallet_ledger_and_security_parity.sql
-- Purpose:
--   1. Add lockout tracking to wallet_pin_credentials and wallet_pin_recovery.
--   2. Establish public.wallet_ledger_entries for auditable, immutable double-entry/ledger accounting.
--   3. Create security-definer RPCs for balance calculation and transaction history.
--   4. Enforce strict RLS (customers can SELECT only their own rows; zero direct client writes).
-- ============================================================================

-- 1. Ensure wallet_pin_credentials has lockout and update tracking
ALTER TABLE IF EXISTS public.wallet_pin_credentials
  ADD COLUMN IF NOT EXISTS failed_attempts INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. Ensure wallet_pin_recovery exists with security fields
CREATE TABLE IF NOT EXISTS public.wallet_pin_recovery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  question_one TEXT NOT NULL,
  answer_one_hash TEXT NOT NULL,
  answer_one_salt TEXT NOT NULL,
  question_two TEXT NOT NULL,
  answer_two_hash TEXT NOT NULL,
  answer_two_salt TEXT NOT NULL,
  hash_iterations INT NOT NULL DEFAULT 310000,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT wallet_pin_recovery_user_id_unique UNIQUE (user_id)
);

-- Secure wallet_pin_recovery via RLS (Edge Functions use service role)
ALTER TABLE public.wallet_pin_recovery ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny direct public access to wallet_pin_recovery" ON public.wallet_pin_recovery;
CREATE POLICY "Deny direct public access to wallet_pin_recovery"
  ON public.wallet_pin_recovery
  FOR ALL
  TO public
  USING (false);

-- 3. Create wallet_ledger_entries table
CREATE TABLE IF NOT EXISTS public.wallet_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  amount_cents BIGINT NOT NULL CHECK (amount_cents > 0),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('credit', 'debit')),
  category TEXT NOT NULL CHECK (category IN ('deposit', 'purchase', 'transfer', 'withdrawal', 'refund', 'adjustment')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'settled', 'reversed', 'failed')),
  idempotency_key TEXT NOT NULL UNIQUE,
  reference_id TEXT,
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance and isolation
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_entries_user_id ON public.wallet_ledger_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_entries_wallet_id ON public.wallet_ledger_entries(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_entries_created_at ON public.wallet_ledger_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_ledger_entries_idempotency ON public.wallet_ledger_entries(idempotency_key);

-- Enable RLS on ledger entries
ALTER TABLE public.wallet_ledger_entries ENABLE ROW LEVEL SECURITY;

-- Customers can view only their own ledger entries
DROP POLICY IF EXISTS "Customers can view own ledger entries" ON public.wallet_ledger_entries;
CREATE POLICY "Customers can view own ledger entries"
  ON public.wallet_ledger_entries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Disallow direct INSERT/UPDATE/DELETE from client roles
DROP POLICY IF EXISTS "Deny direct client inserts on ledger" ON public.wallet_ledger_entries;
CREATE POLICY "Deny direct client inserts on ledger"
  ON public.wallet_ledger_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

DROP POLICY IF EXISTS "Deny direct client updates on ledger" ON public.wallet_ledger_entries;
CREATE POLICY "Deny direct client updates on ledger"
  ON public.wallet_ledger_entries
  FOR UPDATE
  TO authenticated
  USING (false);

DROP POLICY IF EXISTS "Deny direct client deletes on ledger" ON public.wallet_ledger_entries;
CREATE POLICY "Deny direct client deletes on ledger"
  ON public.wallet_ledger_entries
  FOR DELETE
  TO authenticated
  USING (false);

-- 4. RPC: get_my_wallet_balance()
-- Returns verified, authoritative cash balance derived strictly from committed settled ledger entries
CREATE OR REPLACE FUNCTION public.get_my_wallet_balance()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_wallet_id UUID;
  v_currency TEXT;
  v_wallet_status TEXT;
  v_settled_credits BIGINT;
  v_settled_debits BIGINT;
  v_available_cents BIGINT;
  v_pending_credits BIGINT;
  v_reserved_debits BIGINT;
  v_entry_count BIGINT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  SELECT id, currency, status
  INTO v_wallet_id, v_currency, v_wallet_status
  FROM public.wallets
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_wallet_id IS NULL THEN
    RETURN jsonb_build_object(
      'registered', false,
      'error', 'Wallet not registered'
    );
  END IF;

  -- Count total entries
  SELECT count(*)
  INTO v_entry_count
  FROM public.wallet_ledger_entries
  WHERE wallet_id = v_wallet_id;

  -- Sum settled credits and debits
  SELECT
    COALESCE(SUM(CASE WHEN entry_type = 'credit' AND status = 'settled' THEN amount_cents ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN entry_type = 'debit' AND status = 'settled' THEN amount_cents ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN entry_type = 'credit' AND status = 'pending' THEN amount_cents ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN entry_type = 'debit' AND status = 'pending' THEN amount_cents ELSE 0 END), 0)
  INTO
    v_settled_credits,
    v_settled_debits,
    v_pending_credits,
    v_reserved_debits
  FROM public.wallet_ledger_entries
  WHERE wallet_id = v_wallet_id;

  v_available_cents := v_settled_credits - v_settled_debits;

  RETURN jsonb_build_object(
    'registered', true,
    'wallet_id', v_wallet_id,
    'currency', v_currency,
    'wallet_status', v_wallet_status,
    'has_ledger_records', (v_entry_count > 0),
    'available_cents', v_available_cents,
    'available_zar', ROUND((v_available_cents::NUMERIC / 100.0), 2),
    'pending_cents', v_pending_credits,
    'pending_zar', ROUND((v_pending_credits::NUMERIC / 100.0), 2),
    'reserved_cents', v_reserved_debits,
    'reserved_zar', ROUND((v_reserved_debits::NUMERIC / 100.0), 2),
    'refreshed_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_wallet_balance() TO authenticated;

-- 5. RPC: get_my_wallet_transactions()
-- Safe, paginated transaction retrieval isolated by authenticated user ID
CREATE OR REPLACE FUNCTION public.get_my_wallet_transactions(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  amount_cents BIGINT,
  amount_zar NUMERIC,
  entry_type TEXT,
  category TEXT,
  status TEXT,
  reference_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    wle.id,
    wle.amount_cents,
    ROUND((wle.amount_cents::NUMERIC / 100.0), 2) AS amount_zar,
    wle.entry_type,
    wle.category,
    wle.status,
    wle.reference_id,
    wle.description,
    wle.created_at,
    wle.metadata
  FROM public.wallet_ledger_entries wle
  WHERE wle.user_id = v_user_id
  ORDER BY wle.created_at DESC
  LIMIT LEAST(p_limit, 100)
  OFFSET GREATEST(p_offset, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_wallet_transactions(INT, INT) TO authenticated;
