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
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function normalizeAnswer(ans: string): string {
  return ans.trim().toLowerCase();
}

async function hashString(value: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = new Uint8Array(
    saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? [],
  );

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(value),
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

    if (walletError || !wallet) {
      return errorResponse("Wallet not found for this account", 404);
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
      const { data: rec, error: recError } = await adminClient
        .from("wallet_pin_recovery")
        .select("id, question_one, question_two, failed_attempts, locked_until")
        .eq("user_id", user.id)
        .maybeSingle();

      if (recError && recError.code !== "PGRST116") {
        console.error("Recovery lookup error:", recError);
        return errorResponse("Could not check recovery status", 500);
      }

      const isLocked =
        rec?.locked_until && new Date(rec.locked_until).getTime() > Date.now();

      return jsonResponse({
        configured: Boolean(rec),
        questions: rec ? [rec.question_one, rec.question_two] : [],
        locked: Boolean(isLocked),
        lockedUntil: isLocked ? rec?.locked_until : null,
      });
    }

    // 2. SETUP (Initial or Update)
    if (action === "setup") {
      const { questionOne, questionTwo, answerOne, answerTwo, pin } = body;

      if (
        typeof questionOne !== "string" ||
        typeof questionTwo !== "string" ||
        typeof answerOne !== "string" ||
        typeof answerTwo !== "string"
      ) {
        return errorResponse("Two questions and two answers are required", 400);
      }

      if (!questionOne.trim() || !questionTwo.trim()) {
        return errorResponse("Questions cannot be empty", 400);
      }

      if (questionOne.trim() === questionTwo.trim()) {
        return errorResponse("Please choose two different questions", 400);
      }

      if (answerOne.trim().length < 2 || answerTwo.trim().length < 2) {
        return errorResponse("Answers must each be at least 2 characters long", 400);
      }

      // Check if recovery is already configured
      const { data: existingRec } = await adminClient
        .from("wallet_pin_recovery")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      // If updating existing questions, require step-up verification via current PIN
      if (existingRec) {
        if (typeof pin !== "string" || !/^\d{6}$/.test(pin)) {
          return errorResponse(
            "Your current six-digit wallet PIN is required to update recovery questions",
            403,
          );
        }

        const { data: cred } = await adminClient
          .from("wallet_pin_credentials")
          .select("id, pin_hash, pin_salt, locked_until")
          .eq("wallet_id", wallet.id)
          .maybeSingle();

        if (!cred) {
          return errorResponse("Wallet PIN is not configured", 404);
        }

        if (cred.locked_until && new Date(cred.locked_until).getTime() > Date.now()) {
          return errorResponse("Wallet PIN is currently locked", 423);
        }

        const currentPinHash = await hashString(pin, cred.pin_salt);
        if (!timingSafeEqual(currentPinHash, cred.pin_hash)) {
          return errorResponse("Current wallet PIN is incorrect", 401);
        }
      }

      const saltOne = generateSalt();
      const hashOne = await hashString(normalizeAnswer(answerOne), saltOne);

      const saltTwo = generateSalt();
      const hashTwo = await hashString(normalizeAnswer(answerTwo), saltTwo);

      if (existingRec) {
        const { error: updateError } = await adminClient
          .from("wallet_pin_recovery")
          .update({
            question_one: questionOne.trim(),
            answer_one_hash: hashOne,
            answer_one_salt: saltOne,
            question_two: questionTwo.trim(),
            answer_two_hash: hashTwo,
            answer_two_salt: saltTwo,
            failed_attempts: 0,
            locked_until: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingRec.id);

        if (updateError) {
          console.error("Recovery update error:", updateError);
          return errorResponse("Failed to update recovery settings", 500);
        }
      } else {
        const { error: insertError } = await adminClient
          .from("wallet_pin_recovery")
          .insert({
            user_id: user.id,
            wallet_id: wallet.id,
            question_one: questionOne.trim(),
            answer_one_hash: hashOne,
            answer_one_salt: saltOne,
            question_two: questionTwo.trim(),
            answer_two_hash: hashTwo,
            answer_two_salt: saltTwo,
            hash_iterations: HASH_ITERATIONS,
            failed_attempts: 0,
            locked_until: null,
          });

        if (insertError) {
          console.error("Recovery insert error:", insertError);
          return errorResponse("Failed to save recovery settings", 500);
        }
      }

      return jsonResponse({
        success: true,
        message: "Wallet PIN recovery questions saved successfully",
      });
    }

    // 3. RECOVER (Answer questions to reset PIN)
    if (action === "recover") {
      const { answerOne, answerTwo, newPin } = body;

      if (
        typeof answerOne !== "string" ||
        typeof answerTwo !== "string" ||
        typeof newPin !== "string" ||
        !/^\d{6}$/.test(newPin)
      ) {
        return errorResponse("Both answers and a new 6-digit PIN are required", 400);
      }

      const { data: rec, error: recError } = await adminClient
        .from("wallet_pin_recovery")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (recError || !rec) {
        return errorResponse("Recovery questions are not configured for this account", 404);
      }

      if (rec.locked_until && new Date(rec.locked_until).getTime() > Date.now()) {
        const mins = Math.ceil(
          (new Date(rec.locked_until).getTime() - Date.now()) / 60000,
        );
        return errorResponse(
          `PIN recovery is locked due to too many failed attempts. Try again in ${mins} minute(s).`,
          423,
        );
      }

      const computedOne = await hashString(normalizeAnswer(answerOne), rec.answer_one_salt);
      const computedTwo = await hashString(normalizeAnswer(answerTwo), rec.answer_two_salt);

      const matchOne = timingSafeEqual(computedOne, rec.answer_one_hash);
      const matchTwo = timingSafeEqual(computedTwo, rec.answer_two_hash);

      if (!matchOne || !matchTwo) {
        const nextFailed = (rec.failed_attempts || 0) + 1;
        const lockTime =
          nextFailed >= MAX_FAILED_ATTEMPTS
            ? new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString()
            : null;

        await adminClient
          .from("wallet_pin_recovery")
          .update({
            failed_attempts: nextFailed,
            locked_until: lockTime,
            updated_at: new Date().toISOString(),
          })
          .eq("id", rec.id);

        if (lockTime) {
          return errorResponse(
            `Incorrect answers. Too many failed attempts. Recovery is now locked for ${LOCKOUT_MINUTES} minutes.`,
            423,
          );
        }

        const remaining = MAX_FAILED_ATTEMPTS - nextFailed;
        return errorResponse(
          `Incorrect answers. ${remaining} attempt(s) remaining before temporary lockout.`,
          401,
        );
      }

      // Valid answers: Reset PIN
      const pinSalt = generateSalt();
      const pinHash = await hashString(newPin, pinSalt);

      const { error: pinUpdateError } = await adminClient
        .from("wallet_pin_credentials")
        .upsert(
          {
            wallet_id: wallet.id,
            user_id: user.id,
            pin_hash: pinHash,
            pin_salt: pinSalt,
            hash_iterations: HASH_ITERATIONS,
            failed_attempts: 0,
            locked_until: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "wallet_id" },
        );

      if (pinUpdateError) {
        console.error("PIN reset error:", pinUpdateError);
        return errorResponse("Failed to update wallet PIN", 500);
      }

      // Reset recovery failed attempts
      await adminClient
        .from("wallet_pin_recovery")
        .update({
          failed_attempts: 0,
          locked_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rec.id);

      return jsonResponse({
        success: true,
        message: "Your wallet PIN has been reset successfully. You can now unlock with your new PIN.",
      });
    }

    return errorResponse(`Unknown action: ${String(action)}`, 400);
  } catch (err) {
    console.error("Unhandled error in wallet-pin-recovery:", err);
    return errorResponse("An unexpected server error occurred", 500);
  }
});
