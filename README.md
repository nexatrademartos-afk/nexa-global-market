# Nexa Global Market

Create the first project: NEXA TRADE MART. Build a premium, mobile-first African-rooted global commerce storefront designed for later multi-vendor and B2B expansion. Brand black/white with restrained gold; slogan “Shop More. Save More. Get Rewarded.” Customer Dashboard is the FIRST and most complete priority.

Exactly eight core dashboards: (1) Customer, (2) Business Partner (shops, brands and businesses applying to sell under NEXA; NEXA approves business accounts and product listings; partners choose eligible own-fulfilment, NEXA pickup/delivery, NEXA warehouse, or approved third-party courier options), (3) Delivery, (4) Commission Partner, (5) Administration, (6) CEO, (7) Finance, (8) Security. No extra dashboards: warehouse, suppliers, marketing, support, legal, AI assistants, analytics and integrations are modules inside Administration/CEO.

Create the public storefront, customer account and shopping routes, reusable design system, compact role/workspace switcher, and shells/routes for all eight dashboards. Features not implemented must be clearly Planned/Coming Soon; never fake balances, orders, approvals, payments, commissions, deliveries or AI success. Public sign-up creates customer role only; applications do not grant access before approval. The Customer Dashboard should include profile, addresses, cart, wishlist, orders, returns/support, rewards/referrals where safely represented, notifications, settings/privacy, and role applications.

Performance: Android/mobile-first; lazy-load modules, paginate lists, fetch only needed fields, optimize/lazy-load images, accessible touch-friendly controls, loading/empty/error/retry/permission-denied states, no endless spinners. Use mock/preview data only if clearly isolated and labeled; do not seed a production database.

CRITICAL OWNER CONTROL: Frontend/UI only for this first generation. Do NOT enable/provision Lovable Cloud or a Lovable-managed database. Do NOT connect Supabase yet, ask for credentials in chat, create schema/migrations, modify production data/RLS/auth/storage, or deploy/publish. The owner's existing Supabase is the intended backend later; it contains real retail data and must be preserved. Wait for the owner to connect it through the official secure flow and separately approve integration. The GitHub B2B repo is reference only; do not copy its incompatible schema or run its migrations against Supabase. Keep architecture portable. Owner-controlled GitHub sync/export, code ownership and independent hosting must be configured/verified separately; do not claim these are already done. Generate UI foundation only, then report routes, components, placeholders and decisions needed.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nexa-global-market.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/435cdc7f-7a12-4f6f-a4f6-a0fa5481bfbe).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
