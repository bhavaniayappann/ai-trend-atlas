-- Enable pgvector extension
create extension if not exists vector;

-- Content from all sources
create table if not exists content (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('reddit', 'hackernews', 'github', 'youtube', 'news', 'google_trends')),
  external_id text not null,
  url text not null,
  title text not null,
  body text,
  author text,
  score integer default 0,
  metadata jsonb default '{}',
  published_at timestamptz not null,
  ingested_at timestamptz default now(),
  unique (source, external_id)
);

create index idx_content_source on content (source);
create index idx_content_published_at on content (published_at desc);

-- LLM analysis per content item
create table if not exists content_analysis (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references content (id) on delete cascade,
  summary text not null,
  topics text[] not null default '{}',
  sentiment text not null check (sentiment in ('positive', 'neutral', 'negative')),
  importance real not null default 0.5,
  analyzed_at timestamptz default now(),
  unique (content_id)
);

-- Embeddings for semantic search
create table if not exists embeddings (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references content (id) on delete cascade,
  embedding vector(1536) not null,
  created_at timestamptz default now(),
  unique (content_id)
);

create index idx_embeddings_vector on embeddings using hnsw (embedding vector_cosine_ops);

-- Canonical topics
create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  description text,
  lifecycle text not null default 'emerging' check (lifecycle in ('emerging', 'growing', 'peak', 'declining', 'dormant')),
  created_at timestamptz default now()
);

-- Content-topic associations
create table if not exists topic_mentions (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references content (id) on delete cascade,
  topic_id uuid not null references topics (id) on delete cascade,
  confidence real not null default 1.0,
  unique (content_id, topic_id)
);

-- Topic clusters
create table if not exists clusters (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  topic_ids uuid[] not null default '{}',
  centroid vector(1536),
  updated_at timestamptz default now()
);

-- Daily trend scores
create table if not exists trend_scores (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics (id) on delete cascade,
  date date not null,
  velocity real not null default 0,
  momentum real not null default 0,
  persistence real not null default 0,
  reach real not null default 0,
  sentiment real not null default 0,
  mention_count integer not null default 0,
  unique (topic_id, date)
);

create index idx_trend_scores_date on trend_scores (date desc);

-- AI-generated insights
create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics (id) on delete cascade,
  text text not null,
  confidence real not null default 0.8,
  created_at timestamptz default now()
);

-- Semantic search function
create or replace function match_content(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 10
)
returns table (
  id uuid,
  content_id uuid,
  title text,
  url text,
  source text,
  summary text,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.id as content_id,
    c.title,
    c.url,
    c.source,
    ca.summary,
    1 - (e.embedding <=> query_embedding) as similarity
  from embeddings e
  join content c on c.id = e.content_id
  left join content_analysis ca on ca.content_id = c.id
  where 1 - (e.embedding <=> query_embedding) > match_threshold
  order by e.embedding <=> query_embedding
  limit match_count;
$$;
