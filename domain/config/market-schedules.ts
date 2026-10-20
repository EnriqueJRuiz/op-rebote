import {
  BOLSAS_AMERICANA,
  BOLSAS_CANADIENSE,
  BOLSAS_EUROPEA,
  BOLSAS_REINO_UNIDO,
} from "@/domain/constants";

/** Tramo del día en hora LOCAL de la bolsa, en minutos desde medianoche: [inicio, fin). */
export type SessionWindow = readonly [start: number, end: number];

export interface ExchangeSchedule {
  /** Zona horaria IANA: Intl resuelve solo el cambio de hora de cada país, sin tablas de horario de verano. */
  timeZone: string;
  pre?: SessionWindow;
  regular: SessionWindow;
  post?: SessionWindow;
}

const minutesOf = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};
const span = (start: string, end: string): SessionWindow => [minutesOf(start), minutesOf(end)];

// Las sesiones regulares son las oficiales de cada bolsa. Los tramos pre/post son aproximados (cambian
// según la bolsa y el bróker): si alguno no te cuadra, se ajusta aquí y se aplica a todas las pantallas.
const NUEVA_YORK: ExchangeSchedule = {
  timeZone: "America/New_York",
  pre: span("04:00", "09:30"),
  regular: span("09:30", "16:00"),
  post: span("16:00", "20:00"),
};

const TORONTO: ExchangeSchedule = {
  timeZone: "America/Toronto",
  pre: span("07:00", "09:30"),
  regular: span("09:30", "16:00"),
  post: span("16:00", "17:00"),
};

const LONDRES: ExchangeSchedule = {
  timeZone: "Europe/London",
  pre: span("07:00", "08:00"),
  regular: span("08:00", "16:30"),
  post: span("16:30", "17:00"),
};

// Europa continental: 09:00-17:30 hora de Centroeuropa. Lisboa o Helsinki abren a otra hora local pero en
// el mismo instante (y cambian de hora el mismo día), así que comparten zona y horario.
const EUROPA_CENTRAL: ExchangeSchedule = {
  timeZone: "Europe/Paris",
  pre: span("08:00", "09:00"),
  regular: span("09:00", "17:30"),
};

const COPENHAGUE: ExchangeSchedule = { ...EUROPA_CENTRAL, regular: span("09:00", "17:00") };
const OSLO: ExchangeSchedule = { ...EUROPA_CENTRAL, regular: span("09:00", "16:20") };

// Clave: el nombre de la bolsa tal y como se guarda en `empresas.bolsa` (las listas de domain/constants.ts).
export const EXCHANGE_SCHEDULES: ReadonlyMap<string, ExchangeSchedule> = new Map<string, ExchangeSchedule>([
  ...BOLSAS_AMERICANA.map((exchange): [string, ExchangeSchedule] => [exchange, NUEVA_YORK]),
  ...BOLSAS_CANADIENSE.map((exchange): [string, ExchangeSchedule] => [exchange, TORONTO]),
  ...BOLSAS_REINO_UNIDO.map((exchange): [string, ExchangeSchedule] => [exchange, LONDRES]),
  ...BOLSAS_EUROPEA.map((exchange): [string, ExchangeSchedule] => [exchange, EUROPA_CENTRAL]),
  // Excepciones dentro de un bloque (las posteriores sustituyen a las anteriores).
  ["Copenhagen", COPENHAGUE],
  ["Oslo", OSLO],
  ["IOB", LONDRES], // International Order Book: está en el bloque europeo pero cotiza con horario de Londres
]);