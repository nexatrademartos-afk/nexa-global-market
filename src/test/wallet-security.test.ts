import { describe, expect, it } from "vitest";

describe("Wallet Security & PIN Logic", () => {
  it("enforces strict six-digit numeric PIN format", () => {
    const isValidPin = (pin: string) => /^\d{6}$/.test(pin);

    expect(isValidPin("123456")).toBe(true);
    expect(isValidPin("000000")).toBe(true);
    expect(isValidPin("999999")).toBe(true);

    expect(isValidPin("12345")).toBe(false); // too short
    expect(isValidPin("1234567")).toBe(false); // too long
    expect(isValidPin("12345a")).toBe(false); // non-digit
    expect(isValidPin(" 123456")).toBe(false); // leading space
    expect(isValidPin("12 345")).toBe(false); // inner space
    expect(isValidPin("")).toBe(false);
  });

  it("normalizes recovery answers safely without changing semantic meaning", () => {
    const normalizeAnswer = (ans: string) => ans.trim().toLowerCase();

    expect(normalizeAnswer("  Johannesburg  ")).toBe("johannesburg");
    expect(normalizeAnswer("JOHANNESBURG")).toBe("johannesburg");
    expect(normalizeAnswer("St. Mary's Primary")).toBe("st. mary's primary");
  });

  it("requires step-up PIN verification when updating existing recovery questions", () => {
    function validateRecoveryUpdate({
      recoverySet,
      pin,
      q1,
      q2,
      a1,
      a2,
    }: {
      recoverySet: boolean;
      pin?: string;
      q1: string;
      q2: string;
      a1: string;
      a2: string;
    }) {
      if (!q1.trim() || !q2.trim()) return { valid: false, error: "Choose both questions." };
      if (q1 === q2) return { valid: false, error: "Questions must be different." };
      if (a1.trim().length < 2 || a2.trim().length < 2)
        return { valid: false, error: "Answers must be at least 2 chars." };
      if (recoverySet && (!pin || !/^\d{6}$/.test(pin))) {
        return {
          valid: false,
          error: "Enter your current six-digit wallet PIN to update recovery questions.",
        };
      }
      return { valid: true };
    }

    // Initial setup does not require prior PIN step-up
    expect(
      validateRecoveryUpdate({
        recoverySet: false,
        q1: "What city were you born in?",
        q2: "What was the name of your first school?",
        a1: "Cape Town",
        a2: "Bishops",
      }).valid,
    ).toBe(true);

    // Updating existing setup requires valid 6-digit PIN
    expect(
      validateRecoveryUpdate({
        recoverySet: true,
        pin: "",
        q1: "What city were you born in?",
        q2: "What was the name of your first school?",
        a1: "Cape Town",
        a2: "Bishops",
      }),
    ).toEqual({
      valid: false,
      error: "Enter your current six-digit wallet PIN to update recovery questions.",
    });

    expect(
      validateRecoveryUpdate({
        recoverySet: true,
        pin: "12345",
        q1: "What city were you born in?",
        q2: "What was the name of your first school?",
        a1: "Cape Town",
        a2: "Bishops",
      }),
    ).toEqual({
      valid: false,
      error: "Enter your current six-digit wallet PIN to update recovery questions.",
    });

    expect(
      validateRecoveryUpdate({
        recoverySet: true,
        pin: "654321",
        q1: "What city were you born in?",
        q2: "What was the name of your first school?",
        a1: "Cape Town",
        a2: "Bishops",
      }).valid,
    ).toBe(true);
  });

  it("calculates lockout intervals and remaining attempts correctly", () => {
    const MAX_ATTEMPTS = 5;
    const computeLockout = (failures: number) => {
      const next = failures + 1;
      const locked = next >= MAX_ATTEMPTS;
      const remaining = Math.max(0, MAX_ATTEMPTS - next);
      return { locked, remaining, next };
    };

    expect(computeLockout(0)).toEqual({ locked: false, remaining: 4, next: 1 });
    expect(computeLockout(3)).toEqual({ locked: false, remaining: 1, next: 4 });
    expect(computeLockout(4)).toEqual({ locked: true, remaining: 0, next: 5 });
  });
});
