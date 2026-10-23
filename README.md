# SpendWise

SpendWise is a payday-to-payday personal finance tracker. It is designed for mobile first, with an installable web app and desktop layout. There is no paid account, payment processor, bank connection, or subscription billing.

## Current implementation

- Public landing page and responsive app shell.
- SvelteKit 3, Svelte 5, and TypeScript.
- PostgreSQL schema managed with Drizzle ORM and versioned migrations.
- Email/password account flows with Better Auth and server-side sessions.
- User ownership on profile, salary cycle, transaction, allocation, and bill records.
- Money stored as integer minor units (paise for INR), not floating-point amounts.
- Local PostgreSQL available through Docker Compose.
- PWA manifest and static-asset service worker for installable mobile use.
- Salary-cycle budgeting with take-home pay, payday, rent/living and savings allocations, and a recalculating personal daily spending guide.
- Manual expense logging by date, description, amount, and category; online records are private to the signed-in account.
- A separate device-only offline budget and spending log backed by IndexedDB, with CSV export and an offline navigation fallback.
- Vercel adapter for server-rendered deployment, with a free-tier PostgreSQL option through Neon.

Salary-cycle summaries use the plan and expenses entered by the user; SpendWise does not connect to bank accounts or verify balances. The offline budget is separate from the signed-in account: it does not sync automatically, so export its CSV before clearing browser data or switching devices. Recurring bills, reports, email-based password recovery, and native notification delivery are not implemented yet.

## Run locally

Requirements: Node.js 22.17 or later, npm, and Docker with Compose.

```sh
npm install
cp .env.example .env
docker compose up -d database
npm run db:generate
npm run db:migrate
npm run dev
```

Open <http://localhost:3000>. The local database credentials in `.env.example` are only for development. Set a unique `BETTER_AUTH_SECRET` (for example, `openssl rand -base64 32`) before using the app outside local development. Set `BETTER_AUTH_URL` to the exact deployed origin and `DATABASE_URL` to your PostgreSQL connection string in the host's secret settings.

For offline use, first open SpendWise once while online so the service worker can cache the static app shell. Then choose **Continue offline** on the sign-in screen or **Need to go offline?** from the dashboard. The offline page supports a local salary plan and spending log in that browser's IndexedDB and can export the purchases as CSV; it is not uploaded to or merged with an account.

Until `DATABASE_URL` and a 32-character `BETTER_AUTH_SECRET` are set, the landing page remains available and account endpoints return a configuration message.

## Data and privacy notes

SpendWise is a manual tracker and does not represent its calculations as a verified bank balance. Salary is expected income until the user records actual income. Keep the database private, use TLS for deployed connections, and never commit `.env` or database credentials. Each domain table is keyed to its account owner; server routes must derive the owner from the authenticated session rather than accept a client-supplied user ID.

## Deployment

### Deploy to Vercel with Neon Postgres

1. Push this repository to GitHub and import `sharjicodes/SpendWise` into your Vercel Hobby account. Hobby is intended for personal, non-commercial projects.
2. In Vercel **Storage**, create a Neon Serverless Postgres database and connect it to the SpendWise Vercel project. Use the pooled connection string provided by Neon as `DATABASE_URL`.
3. Add `BETTER_AUTH_URL` using the exact production origin Vercel assigns (for example, `https://spendwise-yourname.vercel.app`) and set `BETTER_AUTH_SECRET` to a unique random value of at least 32 characters. Keep these values in Vercel's encrypted environment-variable settings; never commit them.
4. Set the Vercel Production Build Command to `npm run build:deploy`. This applies the checked-in Drizzle migrations before building the app. Configure the database and auth variables for Production before the first deployment.
5. Deploy, then open the assigned URL and create an account. Verify sign-up, sign-in, and a saved expense before sharing it.

The app has no payment processor or in-app billing. Vercel Hobby and Neon Free have provider usage limits and may change their free-tier terms; check their current plan details before relying on them for important records. Export offline data as CSV for a backup, and do not store bank credentials or payment-card details in SpendWise.
