-- =============================================================================
-- 004_categories.sql  (REESCRITA — reemplaza la versión anterior)
--
-- Esquema de categorías con dos tipos:
--   · Globales (user_id IS NULL, created_by = 'system'):
--       16 categorías de gastos mexicanos, iguales para todos los usuarios.
--       No se crean, editan ni borran desde el cliente.
--   · Custom (user_id = uuid, created_by = 'ai' | 'user'):
--       Creadas por la IA al analizar un estado de cuenta, o por el usuario.
--       Pertenecen a un solo usuario; renombrables, recoloreables, archivables.
--
-- transactions.categoria sigue siendo TEXT (slug). No hay FK directa a
-- categories.id — el vínculo es lógico por slug.
-- =============================================================================


-- ----------------------------------------------------------------------------
-- 1. Tabla
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users (id) on delete cascade,  -- NULL = global
  slug            text not null,
  label           text not null,
  emoji           text,
  color           text,
  badge_classes   text,
  description     text,
  examples        jsonb not null default '[]',
  created_by      text not null default 'system'
                    check (created_by in ('system', 'ai', 'user')),
  source_context  text,          -- merchant/contexto que disparó la creación por IA
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- Slug único entre las categorías globales (user_id IS NULL).
create unique index if not exists categories_global_slug_idx
  on public.categories (slug) where user_id is null;

-- Slug único por usuario para las categorías custom.
create unique index if not exists categories_user_slug_idx
  on public.categories (user_id, slug) where user_id is not null;

create index if not exists categories_user_idx
  on public.categories (user_id);

alter table public.categories enable row level security;


-- ----------------------------------------------------------------------------
-- 2. Políticas RLS
-- ----------------------------------------------------------------------------

-- SELECT: el usuario ve las globales + las suyas.
create policy "Users can read global and own categories"
  on public.categories for select
  using (user_id is null or auth.uid() = user_id);

-- INSERT: solo categorías propias (user_id = auth.uid()). Las globales
-- (user_id IS NULL) solo se insertan desde la migración o con service role.
create policy "Users can insert own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

-- UPDATE: solo categorías propias.
create policy "Users can update own categories"
  on public.categories for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: solo categorías propias.
create policy "Users can delete own categories"
  on public.categories for delete
  using (auth.uid() = user_id);


-- ----------------------------------------------------------------------------
-- 3. Seed de categorías globales (se ejecuta una sola vez en la migración)
-- ----------------------------------------------------------------------------
insert into public.categories
  (user_id, slug, label, emoji, color, badge_classes, description, examples, created_by)
values
  (null, 'alimentacion', 'Alimentación', '🍽️', '#E05A2B', 'bg-ambar-light text-ambar',
   'Supermercados, tiendas de conveniencia, restaurantes, cafeterías y comida a domicilio.',
   '["OXXO","Walmart","Soriana","Chedraui","La Comer","Rappi","Uber Eats","Starbucks","7-Eleven","Costco"]'::jsonb, 'system'),
  (null, 'transporte', 'Transporte', '🚗', '#0D9488', 'bg-celeste-light text-celeste',
   'Gasolina, transporte por aplicación, taxis, transporte público, casetas y estacionamientos.',
   '["Uber","Didi","Pemex","BP","Mobil","Metro CDMX","Cabify","IAVE","TAG","estacionamiento"]'::jsonb, 'system'),
  (null, 'entretenimiento', 'Ocio', '🎬', '#D97706', 'bg-ambar-light text-ambar',
   'Streaming, cines, videojuegos, conciertos, bares y suscripciones de entretenimiento.',
   '["Netflix","Spotify","Cinepolis","Cinemex","Disney Plus","HBO Max","Steam","PlayStation","YouTube Premium","Apple Music"]'::jsonb, 'system'),
  (null, 'salud', 'Salud', '🩺', '#DC2626', 'bg-durazno-light text-durazno',
   'Farmacias, consultas médicas, hospitales, laboratorios, dentistas y ópticas.',
   '["Farmacias Guadalajara","Farmacias del Ahorro","Farmacias Benavides","Hospital Angeles","Salud Digna","Doctor Simi","Chedraui Farmacia","laboratorio"]'::jsonb, 'system'),
  (null, 'educacion', 'Educación', '📚', '#7C3AED', 'bg-lavanda-light text-lavanda',
   'Colegiaturas, cursos, libros, plataformas educativas y material escolar.',
   '["UNAM","Tec de Monterrey","Coursera","Udemy","Platzi","colegiatura","Gandhi","Office Depot"]'::jsonb, 'system'),
  (null, 'servicios', 'Servicios', '💻', '#4F46E5', 'bg-celeste-light text-celeste',
   'Luz, agua, gas, internet, telefonía y servicios digitales/software.',
   '["CFE","Telmex","Telcel","AT&T","Movistar","Izzi","Totalplay","Google","Microsoft","Adobe"]'::jsonb, 'system'),
  (null, 'vestimenta', 'Vestimenta', '👕', '#BE185D', 'bg-rosa-light text-rosa',
   'Ropa, calzado, accesorios y tiendas departamentales de moda.',
   '["Liverpool","Coppel","Zara","H&M","Nike","Adidas","Bershka","Pull&Bear","Shein","C&A"]'::jsonb, 'system'),
  (null, 'hogar', 'Hogar', '🏠', '#2563EB', 'bg-celeste-light text-celeste',
   'Muebles, artículos para el hogar, ferretería, renta y mantenimiento.',
   '["Home Depot","IKEA","Liverpool Hogar","Coppel Muebles","Truper","renta","mantenimiento"]'::jsonb, 'system'),
  (null, 'viajes', 'Viajes', '✈️', '#0891B2', 'bg-celeste-light text-celeste',
   'Vuelos, hoteles, agencias de viaje y hospedaje.',
   '["Aeromexico","Volaris","VivaAerobus","Booking","Airbnb","Despegar","Expedia","hotel"]'::jsonb, 'system'),
  (null, 'nomina', 'Nómina', '💵', '#059669', 'bg-menta-light text-menta',
   'Ingresos por sueldo, salario o nómina depositada.',
   '["nomina","pago de nomina","sueldo","deposito nomina","salario"]'::jsonb, 'system'),
  (null, 'transferencia', 'Transferencia', '🔄', '#7C3AED', 'bg-lavanda-light text-lavanda',
   'Transferencias SPEI/CoDi enviadas o recibidas y traspasos entre cuentas.',
   '["SPEI","CoDi","transferencia","traspaso","envio de dinero","deposito"]'::jsonb, 'system'),
  (null, 'inversiones', 'Ahorro', '💰', '#059669', 'bg-menta-light text-menta',
   'Aportaciones a ahorro, inversiones, fondos y plataformas de inversión.',
   '["GBM","Cetesdirecto","Kuspit","Bitso","Fintual","fondo de inversion","aportacion"]'::jsonb, 'system'),
  (null, 'impuestos', 'Impuestos', '🧾', '#E05A2B', 'bg-durazno-light text-durazno',
   'Pagos al SAT, predial, tenencia y derechos gubernamentales.',
   '["SAT","predial","tenencia","ISR","IVA","gobierno","derechos"]'::jsonb, 'system'),
  (null, 'seguros', 'Seguros', '🛡️', '#2563EB', 'bg-celeste-light text-celeste',
   'Seguros de auto, vida, gastos médicos y daños.',
   '["GNP","AXA","Qualitas","MetLife","Seguros Monterrey","HDI","poliza","seguro"]'::jsonb, 'system'),
  (null, 'comisiones', 'Comisiones', '💳', '#E05A2B', 'bg-durazno-light text-durazno',
   'Comisiones bancarias, intereses, anualidades y cargos por servicio.',
   '["comision","anualidad","interes","manejo de cuenta","sobregiro","comision SPEI"]'::jsonb, 'system'),
  (null, 'otros', 'Otros', '📦', '#78716C', 'bg-neutral-100 text-neutral-400',
   'Cualquier transacción que no encaje claramente en otra categoría.',
   '[]'::jsonb, 'system')
on conflict do nothing;


-- ----------------------------------------------------------------------------
-- 4. upsert_user_categories(p_user_id, p_categories)
--    Inserta categorías descubiertas por la IA al guardar un estado de cuenta.
--    No sobrescribe las existentes. created_by = 'ai'.
--    p_categories: [{ "slug","label","emoji","color","description","examples","source_context" }]
--
--    SECURITY DEFINER: se invoca desde la API (server-side con service role o
--    desde un RPC autenticado). El cliente NO llama esta función directamente.
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
      (user_id, slug, label, emoji, color, description, examples, created_by, source_context)
    values (
      p_user_id,
      v_slug,
      coalesce(nullif(trim(v_cat->>'label'), ''), v_slug),
      nullif(v_cat->>'emoji', ''),
      nullif(v_cat->>'color', ''),
      nullif(v_cat->>'description', ''),
      coalesce(v_cat->'examples', '[]'::jsonb),
      'ai',
      nullif(v_cat->>'source_context', '')
    )
    on conflict (user_id, slug) where user_id is not null
    do nothing;
  end loop;
end;
$$;


-- handle_new_user() ya no necesita sembrar categorías (las defaults son
-- globales). La función de 002_credits.sql (solo créditos) es la correcta;
-- no se redefine aquí.


-- ----------------------------------------------------------------------------
-- 5. Query de lectura para el frontend (referencia / se puede usar como RPC)
-- ----------------------------------------------------------------------------
-- SELECT * FROM categories
-- WHERE user_id IS NULL OR user_id = auth.uid()
-- ORDER BY (user_id IS NULL) DESC, label;
--
-- Esto devuelve primero las globales (default) y después las custom del
-- usuario, ambas ordenadas alfabéticamente por label.
-- ----------------------------------------------------------------------------
