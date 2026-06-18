-- Run this ONLY if you already ran 001_initial.sql without RLS.
-- Safe to run on a fresh project that already has the tables.

alter table content enable row level security;
alter table content_analysis enable row level security;
alter table embeddings enable row level security;
alter table topics enable row level security;
alter table topic_mentions enable row level security;
alter table clusters enable row level security;
alter table trend_scores enable row level security;
alter table insights enable row level security;

revoke all on function match_content(vector, float, int) from public;
revoke all on function match_content(vector, float, int) from anon;
revoke all on function match_content(vector, float, int) from authenticated;
