// Vela intradía real de Yahoo Finance (incluye pre-market y after-hours).
export interface IntradayBar {
  time: number; // inicio de la vela, segundos desde epoch (UTC)
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  day: string; // fecha de la sesión en la zona horaria de la bolsa (YYYY-MM-DD)
  extended: boolean; // true si es pre-market o after-hours
}
