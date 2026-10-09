export type BullishSignalType = "TEMPRANA" | "CONFIRMADA";

export interface BullishSignal {
  ticker: string;
  nombre: string;
  tipo: BullishSignalType;
  precio: number;
  variacionBarraPct: number;
  volumenRelativo: number | null;
  detectadaEn: string;
  motivo: string;
}

export interface IntradayCandle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
