import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const HASH_ITERATIONS = 310_000;
const HASH_ALGORITHM = "SHA-256";
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(error: string, status = 400, details?: Record<string, unknown>) {
  return jsonResponse({ error, ...details }, status);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function hashPin(pin: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = new Uint8Array(
    saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? [],
  );

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: HASH_ITERATIONS,
      hash: HASH_ALGORITHM,
    },
    keyMaterial,
    256,
  );

  return Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateSalt(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return errorResponse("Service configuration error", 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return errorResponse("Missing Authorization header", 401);
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return errorResponse("Missing bearer token", 401);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const {
      data: { user },
      error: authError,
    } = await adminClient.auth.getUser(token);

    if (authError || !user) {
      return errorResponse("Your session is invalid. Please sign in again.", 401);
    }

    const { data: wallet, error: walletError } = await adminClient
      .from("wallets")
      .select("id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (walletError) {
      console.error("Wallet lookup error:", walletError);
      return errorResponse("Could not retrieve wallet record", 500);
    }

    if (!wallet) {
      return errorResponse("No wallet registered for this user", 404);
    }

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      return errorResponse("Invalid JSON body", 400);
    }

    const action = body.action;

    // 1. STATUS
    if (action === "status") {
      const { data: cred, error: credError } = await adminClient
        .from("wallet_pin_credentials")
        .select("id, failed_attempts, locked_until")
        .eq("wallet_id", wallet.id)
        .maybeSingle();

      if (credError && credError.code !== "PGRST116") {
        console.error("Credential lookup error:", credError);
        return errorResponse("Could not check PIN status", 500);
      }

      const isLocked =
        cred?.locked_until && new Date(cred.locked_until).getTime() > Date.now();

      return jsonResponse({
        pinSet: Boolean(cred),
        locked: Boolean(isLocked),
        lockedUntil: isLocked ? cred?.locked_until : null,
      });
    }

    // 2. SET (Initial creation)
    if (action === "set") {
      const pin = body.pin;
      if (typeof pin !== "string" || !/^\d{6}$/.test(pin)) {
        return errorResponse("PIN must be exactly 6 numeric digits", 400);
      }

      const { data: existing } = await adminClient
        .from("wallet_pin_credentials")
        .select("id")
        .eq("wallet_id", wallet.id)
        .maybeSingle();

      if (existing) {
        return errorResponse(
          "Wallet PIN is already set. Use change or recovery instead.",
          409,
        );
      }

      const salt = generateSalt();
      const hash = await hashPin(pin, salt);

      const { error: insertError } = await adminClient
        .from("wallet_pin_credentials")
        .insert({
          wallet_id: wallet.id,
          user_id: user.id,
          pin_hash: hash,
          pin_salt: salt,
          hash_iterations: HASH_ITERATIONS,
          failed_attempts: 0,
          locked_until: null,
        });

      if (insertError) {
        console.error("PIN insertion error:", insertError);
        return errorResponse("Could not save wallet PIN", 500);
      }

      return jsonResponse({ success: true, message: "Wallet PIN set successfully" });
    }

    // 3. VERIFY (Unlock)
    if (action === "verify") {
      const pin = body.pin;
      if (typeof pin !== "string" || !/^\d{6}$/.test(pin)) {
        return errorResponse("PIN must be exactly 6 numeric digits", 400);
      }

      const { data: cred, error: credError } = await adminClient
        .from("wallet_pin_credentials")
        .select("id, pin_hash, pin_salt, failed_attempts, locked_until")
        .eq("wallet_id", wallet.id)
        .maybeSingle();

      if (credError || !cred) {
        return errorResponse("Wallet PIN is not configured yet.", 404);
      }

      // Check lockout
      if (cred.locked_until && new Date(cred.locked_until).getTime() > Date.now()) {
        const remainingMinutes = Math.ceil(
          (new Date(cred.locked_until).getTime() - Date.now()) / 60000,
        );
        return errorResponse(
          `Wallet PIN is temporarily locked due to too many failed attempts. Try again in ${remainingMinutes} minute(s).`,
          423,
          { locked: true, lockedUntil: cred.locked_until },
        );
      }

      const computedHash = await hashPin(pin, cred.pin_salt);
      const isMatch = timingSafeEqual(computedHash, cred.pin_hash);

      if (!isMatch) {
        const currentFailed = (cred.failed_attempts || 0) + 1;
        let lockTime: string | null = null;

        if (currentFailed >= MAX_FAILED_ATTEMPTS) {
          lockTime = new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString();
        }

        await adminClient
          .from("wallet_pin_credentials")
          .update({
            failed_attempts: currentFailed,
            locked_until: lockTime,
            updated_at: new Date().toISOString(),
          })
          .eq("id", cred.id);

        if (lockTime) {
          return errorResponse(
            `Incorrect PIN. Too many failed attempts. Wallet PIN is now locked for ${LOCKOUT_MINUTES} minutes.`,
            423,
            { locked: true, lockedUntil: lockTime },
          );
        }

        const remainingAttempts = MAX_FAILED_ATTEMPTS - currentFailed;
        return errorResponse(
          `Incorrect wallet PIN. ${remainingAttempts} attempt(s) remaining before temporary lockout.`,
          401,
          { remainingAttempts },
        );
      }

      // On successful verification, clear failed attempts and lockout
      await adminClient
        .from("wallet_pin_credentials")
        .update({
          failed_attempts: 0,
          locked_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cred.id);

      return jsonResponse({
        success: true,
        verified: true,
        message: "Wallet PIN verified successfully",
      });
    }

    // 4. CHANGE (Update PIN with current PIN)
    if (action === "change") {
      const currentPin = body.currentPin;
      const newPin = body.newPin;

      if (
        typeof currentPin !== "string" ||
        !/^\d{6}$/.test(currentPin) ||
        typeof newPin !== "string" ||
        !/^\d{6}$/.test(newPin)
      ) {
        return errorResponse("Both current and new PIN must be 6 numeric digits", 400);
      }

      if (currentPin === newPin) {
        return errorResponse("New PIN must be different from current PIN", 400);
      }

      const { data: cred, error: credError } = await adminClient
        .from("wallet_pin_credentials")
        .select("id, pin_hash, pin_salt, failed_attempts, locked_until")
        .eq("wallet_id", wallet.id)
        .maybeSingle();

      if (credError || !cred) {
        return errorResponse("Wallet PIN is not configured yet.", 404);
      }

      if (cred.locked_until && new Date(cred.locked_until).getTime() > Date.now()) {
        return errorResponse("Wallet PIN is currently locked.", 423);
      }

      const currentHash = await hashPin(currentPin, cred.pin_salt);
      if (!timingSafeEqual(currentHash, cred.pin_hash)) {
        const nextFailed = (cred.failed_attempts || 0) + 1;
        const lockTime =
          nextFailed >= MAX_FAILED_ATTEMPTS
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString()
            : null;

        await adminClient
          .from("wallet_pin_credentials")
          .update({
            failed_attempts: nextFailed,
            locked_until: lockTime,
            updated_at: new Date().toISOString(),
          })
          .eq("id", cred.id);

        return errorResponse("Current PIN is incorrect.", 401);
      }

      // Save new PIN
      const newSalt = generateSalt();
      const newHash = await hashPin(newPin, newSalt);

      const { error: updateError } = await adminClient
        .from("wallet_pin_credentials")
        .update({
          pin_hash: newHash,
          pin_salt: newSalt,
          failed_attempts: 0,
          locked_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", cred.id);

      if (updateError) {
        return errorResponse("Could not update wallet PIN", 500);
      }

      return jsonResponse({
        success: true,
        message: "Wallet PIN updated successfully",
      });
    }

    return errorResponse(`Unknown action: ${String(action)}`, 400);
  } catch (err) {
    console.error("Unhandled error in wallet-pin:", err);
    return errorResponse("An unexpected server error occurred", 500);
  }
});
