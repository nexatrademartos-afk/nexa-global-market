# Account overview page: diagnostic findings and proposed fixes

## Findings (checked, nothing changed)
- Build: latest build passed with no errors.
- Typecheck: no errors.
- Runtime errors: none recorded.
- Lint: 1 formatting error. Line 11 is too long for the project's formatting rules, so it fails the lint check (`prettier/prettier` rule). This doesn't affect how the page works.
- Welcome message: the heading is the fixed text "Welcome to NEXA". It doesn't show the user's name, including the first name they registered with.
- Coming-soon tiles: the page doesn't label any tiles "Coming soon". All 10 tiles are normal links and can be tapped. Pages that aren't built yet show their "Planned" notice only after you open them.

## Proposed fixes (after approval)
1. Reformat line 11 so the lint check passes.
2. Once sign-in is connected, change the welcome to "Welcome, {first name}", using the first word of the name they registered with. If no name is saved, show "Welcome to NEXA".
3. Label unbuilt tiles "Coming soon" and make them non-clickable, so people can't tap into placeholder pages.
