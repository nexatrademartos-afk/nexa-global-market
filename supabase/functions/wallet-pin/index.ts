
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const ITERATIONS = 310000;

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

async function hashPin(pin: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: ITERATIONS,
    },
    key,
    256,
  );

  return toBase64(new Uint8Array(bits));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return respond({ error: "Method not allowed." }, 405);
  }

  const authorization = req.headers.get("Authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();

  if (!token || token === authorization) {
    return respond({ error: "Please sign in again." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Wallet PIN function secrets are incomplete.");
    return respond({ error: "Wallet security is temporarily unavailable." }, 500);
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } =
    await authClient.auth.getUser(token);

  if (authError || !authData.user) {
    return respond({ error: "Your session is invalid. Please sign in again." }, 401);
  }

  let input: { action?: string; pin?: string };

  try {
    input = await req.json();
  } catch {
    return respond({ error: "Invalid request." }, 400);
  }

  if (input.action !== "status" && input.action !== "set") {
    return respond({ error: "Unsupported action." }, 400);
  }

  const userId = authData.user.id;
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: wallet, error: walletError } = await admin
    .from("wallets")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (walletError) {
    console.error("Wallet lookup failed:", walletError.message);
    return respond({ error: "Could not check your wallet." }, 500);
  }

  if (!wallet) {
    return respond({ error: "Register your wallet before setting a PIN." }, 409);
  }

  const { data: existing, error: existingError } = await admin
    .from("wallet_pin_credentials")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) {
    console.error("PIN status lookup failed:", existingError.message);
    return respond({ error: "Could not check PIN status." }, 500);
  }

  if (input.action === "status") {
    return respond({ pinSet: Boolean(existing) });
  }

  if (existing) {
    return respond({
      error: "A wallet PIN is already set. Secure recovery is not available yet.",
    }, 409);
  }

  if (typeof input.pin !== "string" || !/^\d{6}$/.test(input.pin)) {
    return respond({ error: "Your PIN must contain exactly six digits." }, 400);
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltText = toBase64(salt);
  const pinHash = await hashPin(input.pin, salt);

  const { error: insertError } = await admin
    .from("wallet_pin_credentials")
    .insert({
      user_id: userId,
      wallet_id: wallet.id,
      pin_hash: pinHash,
      pin_salt: saltText,
      hash_iterations: ITERATIONS,
    });

  if (insertError) {
    console.error("PIN setup insert failed:", insertError.message);

    if (insertError.code === "23505") {
      return respond({ error: "A wallet PIN is already set." }, 409);
    }

    return respond({ error: "Could not save your PIN. Please try again." }, 500);
  }

  return respond({ success: true, pinSet: true });
});
    
