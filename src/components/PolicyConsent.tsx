
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  createPolicyAcceptanceEvidence,
  getPoliciesForContext,
  type PolicyAcceptanceEvidence,
  type PolicyContext,
  type PolicyId,
} from "@/lib/policies";

type PolicyConsentProps = {
  context: PolicyContext;
  onChange: (evidence: PolicyAcceptanceEvidence[] | null) => void;
  disabled?: boolean;
};

export function PolicyConsent({
  context,
  onChange,
  disabled = false,
}: PolicyConsentProps) {
  const policies = getPoliciesForContext(context);
  const [checkedPolicies, setCheckedPolicies] = useState<PolicyId[]>([]);

  function handlePolicyChange(policyId: PolicyId, checked: boolean) {
    const nextCheckedPolicies = checked
      ? checkedPolicies.includes(policyId)
        ? checkedPolicies
        : [...checkedPolicies, policyId]
      : checkedPolicies.filter((id) => id !== policyId);

    setCheckedPolicies(nextCheckedPolicies);

    const allPoliciesChecked = policies.every((policy) =>
      nextCheckedPolicies.includes(policy.id),
    );

    if (allPoliciesChecked) {
      onChange(createPolicyAcceptanceEvidence(context));
    } else {
      onChange(null);
    }
  }

  return (
    <fieldset
      disabled={disabled}
      className="space-y-3 rounded-xl border p-4"
    >
      <legend className="px-1 text-sm font-semibold">
        Review and acknowledge the policies
      </legend>

      <p className="text-xs leading-5 text-muted-foreground">
        Open and review each required policy before checking its box.
        Policy documents currently marked as drafts still require legal
        and business review.
      </p>

      {policies.map((policy) => {
        const isPrivacyPolicy = policy.id === "privacy";
        const isChecked = checkedPolicies.includes(policy.id);

        return (
          <label
            key={policy.id}
            className="flex cursor-pointer items-start gap-3 rounded-lg p-2 text-sm leading-6 hover:bg-muted/50"
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 accent-current"
              checked={isChecked}
              disabled={disabled}
              onChange={(event) =>
                handlePolicyChange(policy.id, event.target.checked)
              }
            />

            <span>
              {isPrivacyPolicy
                ? "I acknowledge that I have read the "
                : "I have read and agree to the "}

              <Link
                to="/policies"
                hash={policy.id}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-gold underline underline-offset-4"
                onClick={(event) => event.stopPropagation()}
              >
                {policy.title}
              </Link>
              .

              <span className="mt-1 block text-xs text-muted-foreground">
                Version {policy.version} · Draft / review required
              </span>
            </span>
          </label>
        );
      })}

      <p className="text-xs leading-5 text-muted-foreground">
        Checking these boxes records the selection in the registration
        request. It does not independently establish a tamper-proof
        legal audit record.
      </p>
    </fieldset>
  );
}
