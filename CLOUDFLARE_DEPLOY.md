# FishTournament Pro — Cloudflare + Supabase Deployment Guide

## What was changed from FigmaMake output

| File | Change |
|------|--------|
| `src/lib/supabase.ts` | **New** — Supabase REST client + all DB functions + type mappers |
| `src/lib/storage.ts` | **Replaced** — localStorage → Supabase via `supabase.ts` |
| `src/app/page.tsx` | **Updated** — uses new async storage functions, error state |
| `wrangler.toml` | **New** — Cloudflare Pages config |
| `.env.example` | **New** — environment variable template |
| `supabase/schema.sql` | **New** — full database schema to run in Supabase |

---

## Step 1 — Set up Supabase database

1. Go to: https://supabase.com/dashboard/project/iefjracmxpkpwndrksps
2. Click **SQL Editor** → **New query**
3. Paste the entire contents of `supabase/schema.sql`
4. Click **Run**
5. You should see tables created: `users`, `tournaments`, `series`, `registrations`, `submissions`

---

## Step 2 — Get your Supabase API keys

1. Go to: https://supabase.com/dashboard/project/iefjracmxpkpwndrksps/settings/api
2. Copy:
   - **Project URL**: `https://iefjracmxpkpwndrksps.supabase.co`
   - **anon / public** key (the long `eyJ...` string under "Project API keys")

---

## Step 3 — Set up local development (optional but recommended)

```bash
# In your project folder
cp .env.example .env.local

# Edit .env.local and fill in your anon key:
# NEXT_PUBLIC_SUPABASE_URL=https://iefjracmxpkpwndrksps.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your_anon_key...

# Install dependencies
npm install

# Run locally
npm run dev
# → Open http://localhost:3000
```

---

## Step 4 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - FishTournament Pro with Supabase"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fishtournament-pro.git
git push -u origin main
```

---

## Step 5 — Create Cloudflare Pages project

1. Go to: https://dash.cloudflare.com/
2. Click **Workers & Pages** → **Create application** → **Pages**
3. Click **Connect to Git** → select your GitHub repo
4. Set build settings:
   | Setting | Value |
   |---------|-------|
   | Framework preset | `Next.js (Static HTML Export)` |
   | Build command | `npx @cloudflare/next-on-pages` |
   | Build output directory | `.vercel/output/static` |
   | Root directory | `/` (leave blank) |

5. Click **Save and Deploy** — this first deploy will FAIL because env vars aren't set yet. That's OK.

---

## Step 6 — Add environment variables in Cloudflare

1. In your Cloudflare Pages project → **Settings** → **Environment variables**
2. Add these for **Production** (and optionally Preview):

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://iefjracmxpkpwndrksps.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...your_anon_key...` |
| `NEXT_PUBLIC_APP_NAME` | `FishTournament Pro` |
| `NEXT_PUBLIC_APP_FEE` | `6.50` |

3. Click **Save**

---

## Step 7 — Trigger a redeploy

1. Go to **Deployments** tab
2. Click **...** on the latest deployment → **Retry deployment**
3. Wait ~2 minutes for build to complete
4. Your site is live at `https://fishtournament-pro.pages.dev`

---

## Step 8 — Custom domain (optional)

1. In your Pages project → **Custom domains** → **Set up a custom domain**
2. Enter your domain (e.g., `app.fishtournament.pro`)
3. Add the CNAME record shown in your DNS settings

---

## Troubleshooting

### "Missing Supabase environment variables" error on site
→ Check that both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in Cloudflare Pages environment variables and redeploy.

### "Failed to connect to database" error
→ Verify the schema was run in Supabase SQL Editor. Check that your anon key is correct (no extra spaces).

### Build fails with "Cannot find module"
→ Run `npm install` locally first to ensure `package-lock.json` is up to date, then push again.

### Data not showing up
→ Check Supabase Table Editor to verify tables exist and have data. Check browser console for error messages.

### 404 on page refresh
→ Ensure `next.config.js` has `output: 'export'` and `trailingSlash: true` — both are set in this project.

---

## Architecture

```
Browser
  └── Next.js (static export on Cloudflare Pages CDN)
        └── src/lib/storage.ts (data access functions)
              └── src/lib/supabase.ts (fetch-based REST client)
                    └── Supabase REST API (iefjracmxpkpwndrksps)
                          └── PostgreSQL (users, tournaments, registrations, submissions, series)
```

No Node.js server needed. Everything runs at the edge.

---

## Adding new features later

When you want to add tournament creation forms, authentication, admin dashboards, etc:

- **Data operations**: Use the functions in `src/lib/storage.ts`  
- **Direct DB access**: Use functions in `src/lib/supabase.ts`
- **Auth**: Add Supabase Auth by installing `@supabase/supabase-js` and using the auth client
- **File uploads**: Use Supabase Storage bucket for fish photos

The schema and storage layer are ready — just build the UI.
