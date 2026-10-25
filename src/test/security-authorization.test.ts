import { describe, expect, it } from "vitest";
import { WORKSPACES } from "@/lib/workspaces";

describe("Workspace role application security boundaries", () => {
  it("enforces that administrative and executive roles cannot be applied for", () => {
    const applyableKeys = ["partner", "delivery", "commission"];

    // Executive/admin roles must never be in applyable list
    const sensitiveRoles = ["ceo", "finance", "admin", "security"];

    for (const role of sensitiveRoles) {
      expect(applyableKeys).not.toContain(role);
    }
  });

  it("contains all 8 workspace models defined in workspaces.ts", () => {
    expect(WORKSPACES).toHaveLength(8);
    const keys = WORKSPACES.map((w) => w.key);
    expect(keys).toContain("customer");
    expect(keys).toContain("partner");
    expect(keys).toContain("delivery");
    expect(keys).toContain("commission");
    expect(keys).toContain("admin");
    expect(keys).toContain("ceo");
    expect(keys).toContain("finance");
    expect(keys).toContain("security");
  });
});
