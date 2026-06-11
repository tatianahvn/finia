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

export interface Transaction {
  id?: string;             // uuid en la tabla `transactions`; ausente en datos crudos
  fecha: string;           // "YYYY-MM-DD"
  descripcion: string;
  comercio: string | null;
  monto: number;           // siempre positivo
  tipo: TransactionType;
  categoria: Category;
  confianza: number;       // 0 a 1
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