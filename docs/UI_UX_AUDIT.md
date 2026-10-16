# AdaptAI UI/UX Audit and Delivery Plan

## Audit snapshot — 2026-10-16

### Existing structure
- Public routes: home, features, how it works, industries, pricing.
- Authentication routes: register, login, email verification, password recovery, password reset. These use Supabase Auth; the OTP screen is a single labeled numeric input that supports native code entry and paste.
- Setup route: four-stage wizard; calls the configured generation API and offers an industry template when AI is unavailable. Confirmation persists configuration before entering the app.
- Protected workspace routes: dashboard, records, import, activity, inventory, contacts, analytics, settings. `ProtectedRoute` requires an authenticated Supabase user.
- Most page components and business-flow markup live in `src/App.tsx`. Visual rules are split across a minified `src/styles.css`, `src/redesign.css`, `src/import.css`, and the dark-mode overrides. Tailwind is installed, but most product styling is custom CSS.

### What already works and must be retained
- Supabase registration/login, email OTP, password reset, workspace configuration, and record persistence.
- Configuration-driven forms/navigation, record CRUD, dashboard/analytics calculations, spreadsheet preview/mapping/validation/confirmation, and AI template fallback.
- Responsive sidebar behavior, installable PWA shell, and a persisted dark-mode preference.

### Main UX issues to address
- The global design tokens exist but are duplicated/overridden across stylesheets; many controls and surfaces still use hard-coded colors. Dark mode therefore needs broader and consistent coverage.
- The single large `App.tsx` makes interaction boundaries and styling reuse hard to maintain. Shared visual patterns exist as CSS classes but are not consistently represented by reusable React primitives.
- The public home has a dashboard preview but lacks the requested concise capability strip and product workflow previews. Some footer “Privacy” and “Terms” labels are plain text because those routes do not exist; do not imply those pages are available.
- The app shell is responsive but has no collapsed desktop sidebar. The dashboard has little distinction between loading, empty, and populated states, and its primary route from overview is export rather than a task action.
- Spreadsheet import is functionally strong but uses a basic file picker and dense, long review area; it needs a clearer upload/mapping hierarchy without weakening validation or confirmation.
- Existing demo chart data and pricing are illustrative; keep these clearly labeled and do not present them as customer or business facts.

## Implementation plan

1. **Foundation:** consolidate semantic color/type/spacing/radius/motion tokens; establish consistent focus, control, surface, and status styles. Keep the existing fonts and dependencies.
2. **Public experience:** clarify the hero and CTAs, add a restrained capability strip and realistic workflow previews, strengthen industry/how-it-works sections, and remove dead footer affordances.
3. **Auth and onboarding:** preserve Supabase flows and template fallback while improving layout, validation hierarchy, OTP usability, progress, and errors.
4. **Workspace shell and dashboard:** refine page headers, navigation, overview actions, and meaningful loading/empty/error states; improve contrast in light and dark modes.
5. **Data and import:** polish records/forms, tables, and import upload/review/results while retaining real mappings, row validation, duplicate detection, and explicit confirmation.
6. **Quality pass:** check desktop/mobile layouts, focus/contrast/reduced-motion behavior, run production build and requested tests, and report any environment-limited journeys.

## Scope guard

This is a visual/interaction redesign. It does not add AI spreadsheet mapping, team invitations, billing, automation, legal policies, customer claims, or synthetic business results beyond explicitly labeled demo content.
