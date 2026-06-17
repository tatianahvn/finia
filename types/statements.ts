export type TransactionType =
  | "cargo"
  | "abono"
  | "transferencia_enviada"
  | "transferencia_recibida"
  | "retiro"
  | "deposito"
  | "comision"
  | "interes"
  | "desconocido";

// Slugs de las categorías por defecto. La taxonomía real es dinámica (vive en la
// BD, por usuario, y la IA puede añadir nuevas), por eso `Transaction.categoria`
// es `string`. Esta unión queda solo como referencia de los defaults.
export type Category =
  | "alimentacion"
  | "transporte"
  | "entretenimiento"
  | "salud"
  | "educacion"
  | "servicios"
  | "vestimenta"
  | "hogar"
  | "viajes"
  | "nomina"
  | "transferencia"
  | "inversiones"
  | "impuestos"
  | "seguros"
  | "comisiones"
  | "otros";

// Categoría nueva propuesta por la IA cuando ninguna existente encaja.
export interface CategorySuggestion {
  slug: string;
  label: string;
  emoji?: string;
  description?: string;
  examples?: string[];
}

// Categoría tal cual vive en la BD (incluye metadata visual).
export interface CategoryRecord extends CategorySuggestion {
  color?: string;
  badge_classes?: string;
  origin: "default" | "ai";
}

export interface Transaction {
  id?: string;             // uuid en la tabla `transactions`; ausente en datos crudos
  statement_id?: string;   // FK al estado de cuenta; presente en datos de la BD
  fecha: string;           // "YYYY-MM-DD"
  descripcion: string;
  comercio: string | null;
  monto: number;           // siempre positivo
  tipo: TransactionType;
  categoria: string;       // slug de categoría (default o creada por IA)
  confianza: number;       // 0 a 1
  concepto_normalizado?: string | null;  // nombre de concepto normalizado por IA (persistido al guardar)
}

export interface StatementSummary {
  banco: string;
  titular: string | null;
  numero_cuenta: string | null;
  periodo_inicio: string;
  periodo_fin: string;
  saldo_inicial: number | null;
  saldo_final: number | null;
  total_cargos: number;
  total_abonos: number;
  moneda: string;
}

export interface ParsedStatement {
  resumen: StatementSummary;
  transacciones: Transaction[];
  advertencias: string[];
  // Categorías nuevas que la IA propuso porque ninguna existente encajaba.
  // Se persisten al guardar el estado de cuenta.
  nuevas_categorias?: CategorySuggestion[];
}

export interface ParseResponse {
  success: boolean;
  metadata: {
    paginas: number;
    caracteres_extraidos: number;
    transacciones_encontradas: number;
  };
  data: ParsedStatement;
}