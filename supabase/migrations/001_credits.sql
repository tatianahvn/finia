-- =============================================================================
-- 001_credits.sql
-- Sistema de créditos por usuario.
--   · Una fila por usuario (PK = user_id)
--   · Trigger en auth.users → 2 créditos gratuitos al registrarse
--   · consume_credit()  → descuenta 1, atómico, rechaza si saldo = 0
--   · add_credits()     → suma N créditos (para usar cuando se integren pagos)
-- =============================================================================


-- ----------------------------------------------------------------------------
-- 1. Tabla
-- ----------------------------------------------------------------------------
create table if not exists public.credits (
  user_id    uuid        primary key references auth.users (id) on delete cascade,
  balance    integer     not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.credits enable row level security;

create policy "Users can read own credits"
  on public.credits for select
  using (auth.uid() = user_id);

-- No se permite UPDATE directo; toda modificación pasa por las funciones RPC.


-- ----------------------------------------------------------------------------
-- 2. consume_credit(p_user_id)
--    Descuenta 1 crédito de forma atómica. Lanza excepción si saldo = 0.
--    La API route verifica el saldo antes de llamar esta función, pero la
--    restricción check(balance >= 0) y el guard "where balance > 0" garantizan
--    que nunca se llegue a negativo aunque haya concurrencia.
-- ----------------------------------------------------------------------------
create or replace function public.consume_credit(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.credits
  set    balance    = balance - 1,
         updated_at = now()
  where  user_id   = p_user_id
    and  balance   > 0;

  if not found then
    raise exception 'NO_CREDITS'
      using hint = 'El usuario no tiene créditos disponibles.';
  end if;
end;
$$;


-- ----------------------------------------------------------------------------
-- 3. add_credits(p_user_id, p_amount)
--    Suma N créditos. Se usará desde el webhook de pagos cuando se integre
--    Stripe / MercadoPago. También sirve para grants manuales.
-- ----------------------------------------------------------------------------
create or replace function public.add_credits(p_user_id uuid, p_amount integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount <= 0 then
    raise exception 'INVALID_AMOUNT'
      using hint = 'p_amount debe ser un entero positivo.';
  end if;

  insert into public.credits (user_id, balance)
  values (p_user_id, p_amount)
  on conflict (user_id) do update
    set balance    = public.credits.balance + excluded.balance,
        updated_at = now();
end;
$$;


-- ----------------------------------------------------------------------------
-- 4. handle_new_user()  +  trigger on_auth_user_created
--    Cuando Supabase Auth inserta un nuevo usuario se otorgan 2 créditos
--    gratuitos. "on conflict do nothing" protege frente a re-ejecuciones de
--    la migración o inserciones duplicadas.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.credits (user_id, balance)
  values (new.id, 2)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- Drop primero por si existe de una versión anterior
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ----------------------------------------------------------------------------
-- 5. Seed: 99 créditos para tatyshvn@gmail.com
-- ----------------------------------------------------------------------------
insert into public.credits (user_id, balance)
select id, 99
from auth.users
where email = 'tatyshvn@gmail.com'
on conflict (user_id) do update
  set balance = 99, updated_at = now();
