export type BullishSignalType = "TEMPRANA" | "CONFIRMADA";

export interface BullishSignal {
  companyId: number;
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
  volume: number | null;
}

export interface BullishImpulseSample {
  companyId: number;
  ticker: string;
  nombre: string;
  timestamp: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  intervalVolume: number | null;
  intervalSeconds: number | null;
}
