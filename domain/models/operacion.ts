export interface Operacion {
  id: number;
  empresa_id: number | null;
  ticker?: string;
  nombre?: string;
  tipo_operacion: 'COMPRA' | 'VENTA';
  es_simulacion: boolean;
  precio_entrada: number;
  precio_equilibrio_cero_perdidas: number;
  precio_salida: number | null;
  cantidad_acciones: number | null;
  capital_invertido: number;
  comisiones_broker: number;
  impuestos: number;
  beneficio_neto: number | null;
  resultado_estado: string | null;
  fecha_apertura: string;
  fecha_cierre: string | null;
  max_price: number | null;
  trailing_stop_pct: number | null;
}

export interface CreateOperacionInput {
  empresa_id: number;
  precio_entrada: number;
  capital_invertido: number;
  trailing_stop_pct?: number;
}