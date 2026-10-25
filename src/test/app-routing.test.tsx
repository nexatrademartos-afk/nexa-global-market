import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

describe("App routing", () => {
  const router = createRouter({
    routeTree,
    context: { queryClient: new QueryClient() },
  });

  it("matches a page for / instead of falling back to not found", () => {
    const matches = router.matchRoutes("/");
    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("matches customer account root and child routes", () => {
    const routesToTest = [
      "/account",
      "/account/profile",
      "/account/addresses",
      "/account/orders",
      "/account/cart",
      "/account/wishlist",
      "/account/rewards",
      "/account/notifications",
      "/account/returns",
      "/account/settings",
      "/account/applications",
      "/cart",
      "/wishlist",
      "/shop",
      "/sign-in",
      "/sign-up",
      "/forgot-password",
    ];

    for (const path of routesToTest) {
      const matches = router.matchRoutes(path);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
    }
  });
});
