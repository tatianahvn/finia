-- =============================================================================
-- 004_concepto_normalizado.sql
-- Persiste el nombre de concepto normalizado por la IA en cada transacción.
--
-- Antes, la página de Análisis llamaba al LLM (normalize-concepts) cada vez que
-- se cambiaba de mes para agrupar los gastos por concepto. Ahora la
-- normalización se ejecuta UNA sola vez, al guardar el estado de cuenta, y el
-- resultado se almacena aquí. La UI solo lee esta columna.
-- =============================================================================


-- ----------------------------------------------------------------------------
-- 1. Nueva columna en transactions
-- ----------------------------------------------------------------------------
alter table public.transactions
  add column if not exists concepto_normalizado text;


-- ----------------------------------------------------------------------------
-- 2. insert_statement_with_transactions(...) — ahora guarda concepto_normalizado
--    Se mantiene la misma firma; el campo viaja dentro de cada objeto de
--    p_transacciones como "concepto_normalizado".
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
      categoria, confianza, concepto_normalizado
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
      nullif(v_tx->>'concepto_normalizado', '')
    );
  end loop;

  return v_statement_id;
end;
$$;
