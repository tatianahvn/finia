-- =============================================================================
-- 003_restructure_statements.sql
-- Rediseño del almacenamiento de estados de cuenta en dos capas:
--
--   · statements    → capa CRUDA, fiel al PDF (inmutable). Una fila por archivo.
--                     Conserva el resumen, metadatos y las transacciones en crudo.
--   · transactions  → capa UNIFICADA y editable. Una fila por transacción, con FK
--                     al estado de cuenta. Aquí vive la categoría (asignada por el
--                     LLM y editable por el usuario). Es la tabla que se consulta
--                     para ver "todas las transacciones del mes X" sin importar
--                     banco ni archivo.
--
-- Se elimina la tabla `analyses` (datos dummy, no se conserva nada).
-- =============================================================================


-- ----------------------------------------------------------------------------
-- 0. Limpieza del esquema anterior
-- ----------------------------------------------------------------------------
drop table if exists public.analyses cascade;


-- ----------------------------------------------------------------------------
-- 1. statements — capa cruda (lo que dice el PDF)
-- ----------------------------------------------------------------------------
create table if not exists public.statements (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  filename            text not null default 'sin_nombre',
  banco               text,
  periodo_inicio      date,
  periodo_fin         date,
  resumen             jsonb not null default '{}',
  total_transacciones integer not null default 0,
  transacciones_raw   jsonb not null default '[]',  -- transacciones tal cual del PDF
  advertencias        jsonb not null default '[]',
  created_at          timestamptz not null default now()  -- fecha de carga
);

create index if not exists statements_user_created_idx
  on public.statements (user_id, created_at desc);

alter table public.statements enable row level security;

create policy "Users can read own statements"
  on public.statements for select
  using (auth.uid() = user_id);

create policy "Users can insert own statements"
  on public.statements for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own statements"
  on public.statements for delete
  using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 2. transactions — capa unificada y editable
-- ----------------------------------------------------------------------------
create table if not exists public.transactions (
  id           uuid primary key default gen_random_uuid(),
  statement_id uuid not null references public.statements (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  fecha        date not null,
  descripcion  text not null default '',
  comercio     text,
  monto        numeric not null default 0,
  tipo         text not null default 'desconocido',
  categoria    text not null default 'otros',
  confianza    numeric not null default 0,
  categorized_by text not null default 'ai'
                   check (categorized_by in ('ai', 'user')),
  created_at   timestamptz not null default now()
);

-- Índice principal: transacciones de un usuario filtradas/ordenadas por fecha
-- (para la vista mensual cross-statement).
create index if not exists transactions_user_fecha_idx
  on public.transactions (user_id, fecha desc);

create index if not exists transactions_statement_idx
  on public.transactions (statement_id);

alter table public.transactions enable row level security;

create policy "Users can read own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

-- Política clave que faltaba antes: permitir EDITAR la categoría.
create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 3. insert_statement_with_transactions(...)
--    Ingesta atómica: inserta el estado de cuenta + sus N transacciones en una
--    sola transacción de BD. SECURITY INVOKER (default) → respeta RLS; el
--    user_id se toma de auth.uid() para que nadie inserte a nombre de otro.
--    Devuelve el id del estado de cuenta creado.
-- ----------------------------------------------------------------------------
create or replace function public.insert_statement_with_transactions(
  p_filename       text,
  p_banco          text,
  p_periodo_inicio date,
  p_periodo_fin    date,
  p_resumen        jsonb,
  p_advertencias   jsonb,
  p_transacciones  jsonb
)
returns uuid
language plpgsql
as $$
declare
  v_user_id      uuid := auth.uid();
  v_statement_id uuid;
  v_tx           jsonb;
  v_transacciones jsonb := coalesce(p_transacciones, '[]'::jsonb);
begin
  if v_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  insert into public.statements (
    user_id, filename, banco, periodo_inicio, periodo_fin,
    resumen, advertencias, total_transacciones, transacciones_raw
  ) values (
    v_user_id,
    coalesce(p_filename, 'sin_nombre'),
    p_banco,
    p_periodo_inicio,
    p_periodo_fin,
    coalesce(p_resumen, '{}'::jsonb),
    coalesce(p_advertencias, '[]'::jsonb),
    jsonb_array_length(v_transacciones),
    v_transacciones
  )
  returning id into v_statement_id;

  for v_tx in select * from jsonb_array_elements(v_transacciones)
  loop
    insert into public.transactions (
      statement_id, user_id, fecha, descripcion, comercio, monto, tipo,
      categoria, confianza, categorized_by
    ) values (
      v_statement_id,
      v_user_id,
      (v_tx->>'fecha')::date,
      coalesce(v_tx->>'descripcion', ''),
      nullif(v_tx->>'comercio', ''),
      coalesce((v_tx->>'monto')::numeric, 0),
      coalesce(v_tx->>'tipo', 'desconocido'),
      coalesce(v_tx->>'categoria', 'otros'),
      coalesce((v_tx->>'confianza')::numeric, 0),
      coalesce(v_tx->>'categorized_by', 'ai')
    );
  end loop;

  return v_statement_id;
end;
$$;
