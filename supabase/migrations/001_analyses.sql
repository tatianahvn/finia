create table if not exists public.analyses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  filename    text not null default 'sin_nombre',
  resumen     jsonb not null,
  transacciones jsonb not null default '[]',
  advertencias  jsonb not null default '[]',
  created_at  timestamptz not null default now()
);

-- Index for the common query: all analyses for a user ordered by date
create index if not exists analyses_user_created_idx
  on public.analyses (user_id, created_at desc);

-- RLS
alter table public.analyses enable row level security;

create policy "Users can read own analyses"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.analyses for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own analyses"
  on public.analyses for delete
  using (auth.uid() = user_id);
