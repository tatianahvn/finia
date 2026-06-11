import type { ParsedStatement } from '@/types/statements'

// Estado de cuenta de prueba para previsualizar el modal de revisión sin gastar
// créditos ni tokens de IA. Solo se usa desde el botón de desarrollo en FileUpload.
export const DUMMY_FILENAME = 'estado-de-cuenta-demo.pdf'

export const DUMMY_STATEMENT: ParsedStatement = {
  resumen: {
    banco: 'BBVA México',
    titular: 'Juana Pérez López',
    numero_cuenta: '**** 4821',
    periodo_inicio: '2026-05-01',
    periodo_fin: '2026-05-31',
    saldo_inicial: 12850.4,
    saldo_final: 9432.15,
    total_cargos: 8217.25,
    total_abonos: 4799,
    moneda: 'MXN',
  },
  advertencias: [],
  transacciones: [
    { fecha: '2026-05-03', descripcion: 'OXXO TIENDA 8821 CDMX', comercio: 'Oxxo', monto: 184.5, tipo: 'cargo', categoria: 'alimentacion', confianza: 0.93 },
    { fecha: '2026-05-05', descripcion: 'UBER *TRIP HELP.UBER.COM', comercio: 'Uber', monto: 96, tipo: 'cargo', categoria: 'transporte', confianza: 0.88 },
    { fecha: '2026-05-07', descripcion: 'NETFLIX.COM', comercio: 'Netflix', monto: 219, tipo: 'cargo', categoria: 'entretenimiento', confianza: 0.95 },
    { fecha: '2026-05-09', descripcion: 'SPEI ENVIADO A CUENTA 0021', comercio: null, monto: 1500, tipo: 'transferencia_enviada', categoria: 'transferencia', confianza: 0.7 },
    { fecha: '2026-05-12', descripcion: 'FARMACIA GUADALAJARA 332', comercio: 'Farmacia Guadalajara', monto: 412.3, tipo: 'cargo', categoria: 'salud', confianza: 0.9 },
    { fecha: '2026-05-14', descripcion: 'CFE SUMINISTRO BASICO', comercio: 'CFE', monto: 538.7, tipo: 'cargo', categoria: 'servicios', confianza: 0.97 },
    { fecha: '2026-05-15', descripcion: 'DEPOSITO NOMINA QUINCENA', comercio: null, monto: 4799, tipo: 'deposito', categoria: 'nomina', confianza: 0.99 },
    { fecha: '2026-05-18', descripcion: 'AMAZON MX MARKETPLACE', comercio: 'Amazon', monto: 1289.99, tipo: 'cargo', categoria: 'hogar', confianza: 0.75 },
    { fecha: '2026-05-21', descripcion: 'STARBUCKS REFORMA', comercio: 'Starbucks', monto: 132, tipo: 'cargo', categoria: 'alimentacion', confianza: 0.85 },
    { fecha: '2026-05-24', descripcion: 'COMISION MANEJO DE CUENTA', comercio: null, monto: 120, tipo: 'comision', categoria: 'comisiones', confianza: 0.98 },
    { fecha: '2026-05-27', descripcion: 'AEROMEXICO BOLETO MEX-CUN', comercio: 'Aeroméxico', monto: 2845, tipo: 'cargo', categoria: 'viajes', confianza: 0.82 },
    { fecha: '2026-05-30', descripcion: 'LIVERPOOL CENTRO SANTA FE', comercio: 'Liverpool', monto: 899.5, tipo: 'cargo', categoria: 'vestimenta', confianza: 0.8 },
  ],
}
