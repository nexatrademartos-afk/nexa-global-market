<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Architecture rules
- Frontend only: never enable Lovable Cloud, connect a backend, or write migrations without explicit owner approval — owner's existing database holds real retail data.
- Exactly eight workspaces are defined in `src/lib/workspaces.ts`; new areas become modules there, never new dashboards — keeps the role model fixed.
- Customer dashboard lives under `/account/*`; the other seven render via `/workspace/$role` — one shell keeps shells consistent and lazy-split.
- All sample catalogue data lives only in `src/lib/preview-data.ts` and is labeled PREVIEW in UI — prevents fake data leaking into real flows.
- Cart/wishlist use device-local storage via `useLocalList` until a backend is approved — portable swap point.
- Never display balances, orders, payments, commissions or approvals without real records; use `NotConnected`/`PlannedBadge` states instead.
