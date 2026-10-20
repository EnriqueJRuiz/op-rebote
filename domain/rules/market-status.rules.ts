import { EXCHANGE_SCHEDULES, SessionWindow } from "@/domain/config/market-schedules";

export type MarketStatus = "REGULAR" | "PRE" | "POST" | "CLOSED";

const OPEN_WEEKDAYS = new Set(["Mon", "Tue", "Wed", "Thu", "Fri"]);

// Crear un Intl.DateTimeFormat es caro y esto se llama una vez por empresa y por minuto: uno por zona.
const formatters = new Map<string, Intl.DateTimeFormat>();

function getLocalTime(timeZone: string, now: Date): { weekday: string; minutes: number } {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
    formatters.set(timeZone, formatter);
  }

  const parts = formatter.formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  // % 24: algunos motores devuelven "24" a medianoche aunque se pida h23.
  return { weekday: part("weekday"), minutes: (Number(part("hour")) % 24) * 60 + Number(part("minute")) };
}

const isWithin = (minutes: number, window?: SessionWindow) =>
  window !== undefined && minutes >= window[0] && minutes < window[1];

/**
 * Estado de una bolsa en este momento. Se calcula con la hora y el día LOCALES de la bolsa (por eso el
 * cambio de hora y los fines de semana salen bien), sin consultar a nadie.
 * Devuelve null si la bolsa no está en la configuración (se muestra como "desconocido").
 * Todavía no conoce los festivos ni las medias sesiones: en un festivo entre semana dirá REGULAR.
 */
export function getMarketStatus(exchange: string | null | undefined, now: Date = new Date()): MarketStatus | null {
  const schedule = exchange ? EXCHANGE_SCHEDULES.get(exchange) : undefined;
  if (!schedule) return null;

  const { weekday, minutes } = getLocalTime(schedule.timeZone, now);
  if (!OPEN_WEEKDAYS.has(weekday)) return "CLOSED";
  if (isWithin(minutes, schedule.regular)) return "REGULAR";
  if (isWithin(minutes, schedule.pre)) return "PRE";
  if (isWithin(minutes, schedule.post)) return "POST";
  return "CLOSED";
}