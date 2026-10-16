# AdaptAI

A responsive React, TypeScript and Vite frontend with a small Node API for AI-assisted workspace configuration generation.

## Getting started

Install a current Node.js LTS release (which includes npm), then start the frontend and API in separate terminals:

```sh
npm install
npm run dev
```

```sh
npm run dev:api
```

Copy `.env.example` to `.env`. Set `GROQ_API_KEY` to enable AI-generated configurations. For real sign-up/login, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Supabase project's URL and anon/publishable key, then restart Vite. For a separately hosted API, set `VITE_API_BASE_URL` to its origin and configure `FRONTEND_ORIGIN` on the API to the frontend origin. The browser key is public by design; database tables must be protected by RLS. Never put a service-role key or AI key in a `VITE_` variable.

The API uses Groq's OpenAI-compatible chat completions endpoint and `GROQ_MODEL` (default `openai/gpt-oss-20b`); if Groq rejects structured output, it retries in JSON mode and validates the generated configuration before returning it. Business names must be 1–100 characters and descriptions 10–2,000 characters.

## Supabase setup

1. Create a Supabase project and copy its project URL and anon/publishable key into `.env` as the two `VITE_SUPABASE_*` variables.
2. In **Authentication → Providers → Email**, enable email confirmations. AdaptAI registration verifies a six-digit email token before protected workspace routes are available.
3. In **Authentication → URL Configuration**, add the local redirect URLs `http://localhost:5173/verify-email` and `http://localhost:5173/reset-password`; add the corresponding production URLs when deployed.
4. In the confirmation email template, include the OTP token (Supabase template variable `{{ .Token }}`) so users receive the code entered by `/verify-email`. Configure a recovery link template for password resets.
5. Apply [`supabase/migrations/202610160001_workspaces.sql`](supabase/migrations/202610160001_workspaces.sql) and then [`supabase/migrations/202610160002_spreadsheet_imports.sql`](supabase/migrations/202610160002_spreadsheet_imports.sql) in the Supabase SQL editor or with Supabase CLI. The first creates profiles, owned workspaces, memberships, configuration and record tables, an account bootstrap trigger, and RLS policies. The second adds import job tracking, idempotency and record provenance policies.

The migration should be reviewed and applied to the intended Supabase project. Do not expose a service-role key in this frontend.

Create a production build with `npm run build`.

## Workspace data and demo behavior

Retail, healthcare, warehouse and hospitality workspaces use shared configuration-driven forms, tables and navigation. The setup wizard sends generation requests to the Node API and validates the returned configuration in the browser before saving it.

With the Supabase environment variables configured and the migration applied:

- Registration, six-digit email verification/resend, login, session restoration, password recovery/reset, and logout use Supabase Auth.
- The app resolves the signed-in user’s workspace through Supabase and creates one if the user has none.
- Configurations and generic business records are read and written directly through the Supabase browser SDK. The database's row-level security policies are the authorization boundary; the client never uses a service-role key.
- Records created in the workspace are persisted, and the dashboard, activity and analytics summaries read those records. A new cloud workspace starts empty; built-in sample rows are not copied into it.
- Signed-in users can upload `.csv` and `.xlsx` files (max 5 MB, 500 rows, 50 columns). The API verifies the Supabase session, parses the upload, and returns the preview; `.xls` is not accepted. Users select a worksheet, map columns, review type/required-field errors and duplicates, and explicitly confirm before valid rows are written to Supabase.
- Import attempts have workspace-scoped status and idempotency keys. Invalid rows are skipped and their row numbers/errors are retained in the import job.
- If an AI-generated configuration is confirmed before registration, it is held in the current browser session and saved after verification/sign-in.

Without Supabase, the setup preview uses predefined templates and browser-local demo storage; protected workspace routes remain closed. Healthcare examples are synthetic and are not a clinically validated system. Pricing is illustrative, and workflow automation is not implemented.

## Backend integration

The existing backend is a small Node API, not FastAPI. It currently implements `POST /api/configurations/generate` and a health diagnostic; it does not handle user authentication or workspace CRUD. Persisted records and configurations use Supabase directly from the authenticated frontend, protected by the migration's RLS policies. The Vite development server proxies `/api` to `http://127.0.0.1:3001`.

For local diagnostics, open `http://127.0.0.1:3001/api/health`. The current API returns `apiVersion: 2`, `generator: "groq"`, and an `aiConfigured` boolean; it never returns the API key. Configure `FRONTEND_ORIGIN` to your deployed frontend's origin when hosting the API separately; the default is local Vite. If the health route is missing or the version differs, stop the old API process and restart it with `npm run dev:api`. Restart the Vite server too if the browser is still serving an old frontend bundle.

AI-assisted column mapping, team invitations, rate limiting for AI generation, and a FastAPI backend are not implemented. Spreadsheet import uses manual mapping and does not send workbook contents to an AI provider. Both Supabase migrations and RLS policies must be applied to the intended project before cloud persistence/import works. The repository tests cover the Node API and spreadsheet parsers; they do not test a live Supabase project or deployed authentication.

Run the checks with:

```sh
npm test
npm run build
```
