-- =============================================================================
-- 006_categories.sql
-- Taxonomía de categorías POR USUARIO. Es el core de la categorización:
--
--   · Cada usuario tiene su propio set de categorías (RLS por user_id).
--   · Se siembra un set por defecto con descripción + ejemplos de comercios
--     mexicanos reales. Esos ejemplos alimentan el prompt del LLM (few-shot).
--   · La IA puede DESCUBRIR categorías nuevas al categorizar; se persisten al
--     guardar el estado de cuenta (origin = 'ai') y mejoran futuras corridas
--     del mismo usuario.
--   · No se crean/editan categorías desde la UI: toda escritura pasa por
--     funciones SECURITY DEFINER. El cliente solo hace SELECT (RLS).
-- =============================================================================


-- ----------------------------------------------------------------------------
-- 1. Tabla
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  slug          text not null,                              -- "alimentacion"
  label         text not null,                              -- "Alimentación"
  emoji         text,
  color         text,                                       -- hex "#E05A2B"
  badge_classes text,                                       -- clases Tailwind (defaults)
  description   text,                                       -- qué pertenece aquí (guía al LLM)
  examples      jsonb not null default '[]',                -- ["OXXO","WALMART",...]
  origin        text not null default 'ai' check (origin in ('default', 'ai')),
  created_at    timestamptz not null default now(),
  unique (user_id, slug)
);

create index if not exists categories_user_idx
  on public.categories (user_id);

alter table public.categories enable row level security;

-- El cliente solo lee sus propias categorías. No hay políticas de INSERT/UPDATE:
-- toda escritura ocurre vía funciones SECURITY DEFINER de abajo.
create policy "Users can read own categories"
  on public.categories for select
  using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 2. seed_default_categories(p_user_id)
--    Inserta el set por defecto si no existe (idempotente). Se llama desde el
--    trigger de alta y de forma perezosa desde la API (cubre usuarios viejos
--    que se registraron antes de esta migración).
-- ----------------------------------------------------------------------------
create or replace function public.seed_default_categories(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return;
  end if;

  insert into public.categories
    (user_id, slug, label, emoji, color, badge_classes, description, examples, origin)
  values
    (p_user_id, 'alimentacion', 'Alimentación', '🍽️', '#E05A2B', 'bg-ambar-light text-ambar',
     'Supermercados, tiendas de conveniencia, restaurantes, cafeterías y comida a domicilio.',
     '["OXXO","Walmart","Soriana","Chedraui","La Comer","Rappi","Uber Eats","Starbucks","7-Eleven","Costco"]'::jsonb, 'default'),
    (p_user_id, 'transporte', 'Transporte', '🚗', '#0D9488', 'bg-celeste-light text-celeste',
     'Gasolina, transporte por aplicación, taxis, transporte público, casetas y estacionamientos.',
     '["Uber","Didi","Pemex","BP","Mobil","Metro CDMX","Cabify","IAVE","TAG","estacionamiento"]'::jsonb, 'default'),
    (p_user_id, 'entretenimiento', 'Ocio', '🎬', '#D97706', 'bg-ambar-light text-ambar',
     'Streaming, cines, videojuegos, conciertos, bares y suscripciones de entretenimiento.',
     '["Netflix","Spotify","Cinepolis","Cinemex","Disney Plus","HBO Max","Steam","PlayStation","YouTube Premium","Apple Music"]'::jsonb, 'default'),
    (p_user_id, 'salud', 'Salud', '🩺', '#DC2626', 'bg-durazno-light text-durazno',
     'Farmacias, consultas médicas, hospitales, laboratorios, dentistas y ópticas.',
     '["Farmacias Guadalajara","Farmacias del Ahorro","Farmacias Benavides","Hospital Angeles","Salud Digna","Doctor Simi","Chedraui Farmacia","laboratorio"]'::jsonb, 'default'),
    (p_user_id, 'educacion', 'Educación', '📚', '#7C3AED', 'bg-lavanda-light text-lavanda',
     'Colegiaturas, cursos, libros, plataformas educativas y material escolar.',
     '["UNAM","Tec de Monterrey","Coursera","Udemy","Platzi","colegiatura","Gandhi","Office Depot"]'::jsonb, 'default'),
    (p_user_id, 'servicios', 'Servicios', '💻', '#4F46E5', 'bg-celeste-light text-celeste',
     'Luz, agua, gas, internet, telefonía y servicios digitales/software.',
     '["CFE","Telmex","Telcel","AT&T","Movistar","Izzi","Totalplay","Google","Microsoft","Adobe"]'::jsonb, 'default'),
    (p_user_id, 'vestimenta', 'Vestimenta', '👕', '#BE185D', 'bg-rosa-light text-rosa',
     'Ropa, calzado, accesorios y tiendas departamentales de moda.',
     '["Liverpool","Coppel","Zara","H&M","Nike","Adidas","Bershka","Pull&Bear","Shein","C&A"]'::jsonb, 'default'),
    (p_user_id, 'hogar', 'Hogar', '🏠', '#2563EB', 'bg-celeste-light text-celeste',
     'Muebles, artículos para el hogar, ferretería, renta y mantenimiento.',
     '["Home Depot","IKEA","Liverpool Hogar","Coppel Muebles","Truper","renta","mantenimiento"]'::jsonb, 'default'),
    (p_user_id, 'viajes', 'Viajes', '✈️', '#0891B2', 'bg-celeste-light text-celeste',
     'Vuelos, hoteles, agencias de viaje y hospedaje.',
     '["Aeromexico","Volaris","VivaAerobus","Booking","Airbnb","Despegar","Expedia","hotel"]'::jsonb, 'default'),
    (p_user_id, 'nomina', 'Nómina', '💵', '#059669', 'bg-menta-light text-menta',
     'Ingresos por sueldo, salario o nómina depositada.',
     '["nomina","pago de nomina","sueldo","deposito nomina","salario"]'::jsonb, 'default'),
    (p_user_id, 'transferencia', 'Transferencia', '🔄', '#7C3AED', 'bg-lavanda-light text-lavanda',
     'Transferencias SPEI/CoDi enviadas o recibidas y traspasos entre cuentas.',
     '["SPEI","CoDi","transferencia","traspaso","envio de dinero","deposito"]'::jsonb, 'default'),
    (p_user_id, 'inversiones', 'Ahorro', '💰', '#059669', 'bg-menta-light text-menta',
     'Aportaciones a ahorro, inversiones, fondos y plataformas de inversión.',
     '["GBM","Cetesdirecto","Kuspit","Bitso","Fintual","fondo de inversion","aportacion"]'::jsonb, 'default'),
    (p_user_id, 'impuestos', 'Impuestos', '🧾', '#E05A2B', 'bg-durazno-light text-durazno',
     'Pagos al SAT, predial, tenencia y derechos gubernamentales.',
     '["SAT","predial","tenencia","ISR","IVA","gobierno","derechos"]'::jsonb, 'default'),
    (p_user_id, 'seguros', 'Seguros', '🛡️', '#2563EB', 'bg-celeste-light text-celeste',
     'Seguros de auto, vida, gastos médicos y daños.',
     '["GNP","AXA","Qualitas","MetLife","Seguros Monterrey","HDI","poliza","seguro"]'::jsonb, 'default'),
    (p_user_id, 'comisiones', 'Comisiones', '💳', '#E05A2B', 'bg-durazno-light text-durazno',
     'Comisiones bancarias, intereses, anualidades y cargos por servicio.',
     '["comision","anualidad","interes","manejo de cuenta","sobregiro","comision SPEI"]'::jsonb, 'default'),
    (p_user_id, 'otros', 'Otros', '📦', '#78716C', 'bg-neutral-100 text-neutral-400',
     'Cualquier transacción que no encaje claramente en otra categoría.',
     '[]'::jsonb, 'default')
  on conflict (user_id, slug) do nothing;
end;
$$;


-- ----------------------------------------------------------------------------
-- 3. upsert_user_categories(p_user_id, p_categories)
--    Inserta categorías descubiertas por la IA al guardar un estado de cuenta.
--    No sobrescribe las existentes (on conflict do nothing) para no pisar los
--    defaults ni categorías ya creadas. Origin = 'ai'.
--    p_categories: [{ "slug","label","emoji","color","description","examples" }]
-- ----------------------------------------------------------------------------
create or replace function public.upsert_user_categories(
  p_user_id    uuid,
  p_categories jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cat   jsonb;
  v_cats  jsonb := coalesce(p_categories, '[]'::jsonb);
  v_slug  text;
begin
  if p_user_id is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  for v_cat in select * from jsonb_array_elements(v_cats)
  loop
    v_slug := nullif(trim(v_cat->>'slug'), '');
    if v_slug is null then
      continue;
    end if;

    insert into public.categories
      (user_id, slug, label, emoji, color, description, examples, origin)
    values (
      p_user_id,
      v_slug,
      coalesce(nullif(trim(v_cat->>'label'), ''), v_slug),
      nullif(v_cat->>'emoji', ''),
      nullif(v_cat->>'color', ''),
      nullif(v_cat->>'description', ''),
      coalesce(v_cat->'examples', '[]'::jsonb),
      'ai'
    )
    on conflict (user_id, slug) do nothing;
  end loop;
end;
$$;


-- ----------------------------------------------------------------------------
-- 4. handle_new_user() — ahora también siembra las categorías por defecto.
--    Se mantiene el otorgamiento de créditos de 002_credits.sql.
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

  perform public.seed_default_categories(new.id);

  return new;
end;
$$;
