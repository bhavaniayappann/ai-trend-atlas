# Setup Guide — AI Trend Atlas

## 1. Supabase Setup

### Step 1: Create a project
1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose an organization, name (e.g. `ai-trend-atlas`), database password, and region
4. Wait for the project to finish provisioning (~2 minutes)

### Step 2: Run the database migration
1. In your Supabase dashboard, open **SQL Editor**
2. Click **New query**
3. Copy the entire contents of `supabase/migrations/001_initial.sql` from this repo
4. Paste into the editor and click **Run**

This creates all tables (`content`, `topics`, `embeddings`, `trend_scores`, etc.) and enables **pgvector** for semantic search.

### Step 3: Get your API keys
1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** key (under "Project API keys") → `SUPABASE_SERVICE_ROLE_KEY`

> Use the **service_role** key, not the `anon` key. The server needs full DB access for ingestion.

### Step 4: Add to your env file
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 5: Verify
Restart the dev server, then trigger ingestion:
```bash
npm run dev
curl -X POST http://localhost:3000/api/ingest
```

Check the Supabase **Table Editor** — you should see rows appearing in `content`, `content_analysis`, and `topics`.

---

## 2. OpenAI API Key Setup

### Step 1: Create an API key
1. Go to [https://platform.openai.com](https://platform.openai.com) and sign in
2. Open **API keys**: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
3. Click **Create new secret key**
4. Name it (e.g. `ai-trend-atlas`) and copy the key — it starts with `sk-`

> You won't be able to see the full key again after closing the dialog.

### Step 2: Add billing (required)
1. Go to **Settings** → **Billing**: [https://platform.openai.com/settings/organization/billing](https://platform.openai.com/settings/organization/billing)
2. Add a payment method and credits (a few dollars is enough for development)

### Step 3: Add to your env file
In `.env.local`:
```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxx
```

### What it powers
| Feature | Model used |
|---|---|
| Topic extraction from articles | `gpt-4o-mini` |
| Embeddings for semantic search | `text-embedding-3-small` |
| AI Analyst chat | `gpt-4o-mini` |

### Step 4: Verify
Restart the dev server, then open **http://localhost:3000/analyst** and ask a question like "What is driving Claude Code adoption?"

---

## 3. Complete `.env.local` example

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Optional — higher GitHub API rate limits
GITHUB_TOKEN=ghp_your-github-token

# Optional — protect /api/ingest in production
CRON_SECRET=some-random-secret-string
```

---

## 4. Deploying to Vercel

When deploying, add the same env variables in **Vercel** → **Project Settings** → **Environment Variables**.

The `vercel.json` cron job will call `/api/ingest` every 6 hours once `CRON_SECRET` is set.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Ingestion returns "demo mode" | Check `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set, then restart dev server |
| AI chat doesn't respond | Verify `OPENAI_API_KEY` is set and billing is active |
| pgvector error on migration | Run `create extension if not exists vector;` first, then re-run the full migration |
| GitHub ingestion returns empty | Add `GITHUB_TOKEN` for higher rate limits |
