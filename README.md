# Finial

Asistente financiero personal que extrae, categoriza y analiza transacciones a partir de PDFs de estados de cuenta bancarios. Cada análisis se procesa con un modelo LLM y se guarda en Supabase para que el usuario pueda consultar tendencias, descargar reportes y recibir recomendaciones personalizadas.

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Lenguaje | TypeScript 5 |
| UI | Tailwind CSS 4, lucide-react, next-themes |
| Charts | Recharts 3 |
| Auth + DB | Supabase (Postgres + Auth + RLS) vía `@supabase/ssr` |
| LLM | Groq SDK (Llama 4 Scout para análisis, Llama 3.3 70B para consejos) |
| PDF | `pdf-parse` (extracción) + `@react-pdf/renderer` (descarga de reportes) |
| Excel | `xlsx` (export de transacciones) |

---

## Funcionalidades

### Carga de estados de cuenta
- Drag & drop de uno o varios PDFs.
- Extracción de texto con `pdf-parse`.
- Análisis con Groq que devuelve un objeto estructurado: `resumen` (banco, titular, periodo, saldos, totales) + `transacciones` (fecha, descripción, monto, tipo, categoría, confianza) + `advertencias`.
- Consume 1 crédito por archivo analizado.

### Historial de análisis
- Listado de todos los estados de cuenta cargados, agrupados por archivo, con banco, rango de fechas y total de transacciones.
- Expandible: muestra todas las transacciones del estado de cuenta con `select` para **ajustar manualmente la categoría** (persiste vía `PATCH`).
- Eliminación completa de un estado de cuenta con confirmación; refresca el contexto y recalcula totales del dashboard.

### Resumen
- Cards con ingresos, egresos, balance y total de transacciones agregando todos los estados de cuenta.
- Lista de transacciones recientes.

### Transacciones
- Tabla mes a mes con navegación entre periodos.
- Export a Excel del mes seleccionado.

### Análisis
- Charts: distribución de gasto por categoría, ranking de comercios/conceptos, tendencia mensual.
- **Descarga de reporte mensual en PDF** (lazy-load de `@react-pdf/renderer`).
- **Generador de consejos financieros**: el LLM devuelve resumen + 4 tips contextuales basados en los gastos del mes.

### Consejos
- Historial accordion-style de los consejos generados, mes por mes (persistido en `localStorage`).

### Sistema de créditos
- Cada usuario nuevo recibe 2 créditos gratuitos (trigger en `auth.users`).
- 1 crédito = 1 análisis de estado de cuenta.
- RPC atómico `consume_credit` con guard contra concurrencia.
- Empty states del dashboard muestran balance disponible y CTA a `/upgrade` cuando se agotan.

### Auth
- Login con Supabase Auth.
- Middleware refresca la sesión y protege rutas bajo `/dashboard`.
- RLS en todas las tablas: cada usuario sólo puede leer/escribir sus propios registros.

---

## Estructura del proyecto

```
app/
├── api/statements/
│   ├── parse-pdf/        # POST: extrae texto de PDFs
│   ├── analyze/          # POST: analiza texto, guarda en DB, consume crédito
│   ├── advice/           # POST: genera consejos con LLM
│   ├── normalize-concepts/ # POST: normaliza descripciones de comercios
│   └── [id]/
│       ├── route.ts                 # DELETE: elimina un análisis completo
│       └── transaction/route.ts     # PATCH: actualiza la categoría de una transacción
├── auth/callback/        # OAuth callback
├── dashboard/
│   ├── _components/      # FileUpload, AnalysisHistory, StatCards, charts, modales…
│   ├── estados-de-cuenta/ # carga + administración
│   ├── transacciones/
│   ├── analisis/         # desglose analítico + descargas
│   ├── consejos/
│   ├── perfil/
│   └── layout.tsx        # AnalysisProvider + Sidebar/Header/Footer
├── login/
└── upgrade/

lib/
├── context/analysis.tsx  # estado global del statement activo
├── hooks/                # useCredits, useAdviceHistory, useCategoryColor
├── services/             # groq.ts, pdf.ts
├── supabase/             # client.ts, server.ts
└── categories.ts         # metadata de categorías (label, emoji, colores)

supabase/migrations/
├── 001_analyses.sql      # tabla analyses + RLS
└── 002_credits.sql       # tabla credits + RPCs + trigger de signup

types/statements.ts        # ParsedStatement, Transaction, StatementSummary, Category
```

---

## Instalación

### Requisitos
- Node.js 20+
- npm (o pnpm/yarn/bun)
- Cuenta de Supabase
- API key de Groq (https://console.groq.com)

### Pasos

```bash
# 1. Clona el repo e instala dependencias
git clone <repo-url> finial
cd finial
npm install

# 2. Configura las variables de entorno
cp .env.example .env.local   # (créalo si no existe)
```

Agrega en `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
GROQ_API_KEY=<groq-api-key>
```

### Configuración de la base de datos

Ejecuta las migraciones contra tu proyecto Supabase, en orden:

```bash
# Opción A — Supabase CLI
supabase db push

# Opción B — manual desde el SQL Editor del dashboard
# Pega y ejecuta supabase/migrations/001_analyses.sql
# Pega y ejecuta supabase/migrations/002_credits.sql
```

Esto crea las tablas `analyses` y `credits`, las políticas RLS, las funciones RPC `consume_credit` y `add_credits`, y el trigger que otorga 2 créditos a cada nuevo usuario.

---

## Ejecución

```bash
npm run dev      # arranca en http://localhost:3000
npm run build    # build de producción
npm run start    # sirve el build
npm run lint     # ESLint
```

---

## Notas de desarrollo

- **Next.js 16 con App Router**: los `params` de los route handlers son `Promise` (`{ params: Promise<{ id: string }> }`) y deben aguardarse.
- **Categorías**: se editan vía `<select>` en `AnalysisHistory`; el cambio se persiste reescribiendo el JSONB `transacciones` en la fila del análisis y recargando el `AnalysisContext`.
- **Lazy loading** de `@react-pdf/renderer` (~1MB) en la página de Análisis para mantener el bundle inicial liviano.
- **AGENTS.md / CLAUDE.md** documentan reglas internas del proyecto (incluida la nota de que esta versión de Next.js trae cambios respecto a la documentación pública previa).
