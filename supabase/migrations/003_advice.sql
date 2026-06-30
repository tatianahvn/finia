-- =============================================================================
-- 003_advice.sql
-- Persiste los consejos financieros generados por la IA.
--
-- Antes vivían solo en localStorage (por navegador). Ahora se almacenan por
-- usuario en la BD, asociados al estado de cuenta y al mes analizado. Una fila
-- por (usuario, mes): regenerar reemplaza la fila existente de ese mes.
-- No se editan: solo se registran, consultan y eliminan.
-- =============================================================================

create table if not exists public.advice (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  statement_id  uuid references public.statements (id) on delete cascade,
  mes           text not null,                 -- "YYYY-MM"
  resumen       text not null default '',
  consejos      jsonb not null default '[]',
  generado      timestamptz not null default now(),  -- fecha de generación
  created_at    timestamptz not null default now()
);

-- Un consejo por usuario y mes (regenerar = reemplazar).
create unique index if not exists advice_user_mes_idx
  on public.advice (user_id, mes);

create index if not exists advice_user_generado_idx
  on public.advice (user_id, generado desc);

alter table public.advice enable row level security;

create policy "Users can read own advice"
  on public.advice for select
  using (auth.uid() = user_id);

create policy "Users can insert own advice"
  on public.advice for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own advice"
  on public.advice for delete
  using (auth.uid() = user_id);

-- Nota: a propósito NO se crea policy de UPDATE — los consejos no se editan.
