
/**
 * NEXA GLOBAL MART — Central Brand Identity
 *
 * Shared public identity settings for the website.
 * Update these values when the brand changes.
 *
 * Powered by TJC-OS remains a separate identity.
 */

export const BRAND = {
  name: "NEXA GLOBAL MART",
  shortName: "NEXA",
  tagline: "Shop More. Save More. Get Rewarded.",

  poweredBy: "TJC-OS",

  contact: {
    phone: "+27 68 496 3972",
    whatsappDigits: "27684963972",
    whatsappUrl: "https://wa.me/27684963972",
  },

  logoPath: "/nexa-global-mart-logo.png",
  faviconPath: "/favicon.ico?v=2",

  description:
    "Shop More. Save More. Get Rewarded. Discover products and global shopping opportunities with NEXA GLOBAL MART.",
} as const;

/**
 * Builds consistent page titles using the central brand name.
 *
 * Example:
 * brandPageTitle("Shop") => "Shop — NEXA GLOBAL MART"
 */
export function brandPageTitle(pageTitle?: string): string {
  return pageTitle
    ? `${pageTitle} — ${BRAND.name}`
    : BRAND.name;
}
