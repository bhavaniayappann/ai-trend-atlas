# AI Trend Atlas

Real-time intelligence platform that discovers, tracks, and explains emerging technology trends across Reddit, Hacker News, GitHub, and more.

## Features

- **Multi-source ingestion** — Reddit, Hacker News, GitHub
- **AI topic extraction** — LLM-powered analysis with embeddings
- **Topic Galaxy** — Interactive force-directed graph (D3 + Canvas)
- **Trend River** — Flowing time-series visualization (D3)
- **AI Analyst** — RAG-powered chat for trend questions
- **Trend scoring** — Velocity, momentum, persistence, reach, sentiment

## Quick Start

```bash
cd ai-trend-atlas
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs in **demo mode** with rich seed data — no API keys required to explore visualizations.

## Configuration

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | For live AI | Topic extraction, embeddings, analyst chat |
| `NEXT_PUBLIC_SUPABASE_URL` | For persistence | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | For persistence | Server-side DB access |
| `GITHUB_TOKEN` | Optional | Higher GitHub API rate limits |
| `CRON_SECRET` | For production | Protects `/api/ingest` endpoint |

## Database Setup

1. Create a [Supabase](https://supabase.com) project
2. Run the migration in `supabase/migrations/001_initial.sql` via the SQL editor
3. Add your Supabase credentials to `.env.local`
4. Trigger ingestion: `curl -X POST http://localhost:3000/api/ingest`

## Architecture

```
Sources (HN, Reddit, GitHub)
  → Ingestion API (/api/ingest)
  → AI Processing (extraction + embeddings)
  → Supabase (Postgres + pgvector)
  → API Routes
  → Next.js Frontend (Galaxy, River, Analyst)
```

## Pages

| Route | Description |
|---|---|
| `/` | Dashboard with top trends and AI insights |
| `/galaxy` | Interactive topic relationship graph |
| `/river` | Time-series trend evolution |
| `/analyst` | AI chat for trend questions |

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS, D3
- **AI**: Vercel AI SDK, OpenAI GPT-4o-mini, text-embedding-3-small
- **Database**: Supabase, Postgres, pgvector
- **Deployment**: Vercel

## Portfolio Highlights

- Advanced React architecture with server components + client visualizations
- D3 force-directed graph with Canvas rendering
- RAG pipeline with semantic search via pgvector
- Real-time-ready architecture with WebSocket support via Supabase Realtime
- Bloomberg Terminal-inspired dark UI
