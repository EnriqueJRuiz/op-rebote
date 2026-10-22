"use client";

import { useMemo, useSyncExternalStore } from "react";

const TICK_MS = 30_000;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;

// Un único temporizador para toda la pantalla: con una fila por empresa, un setInterval por círculo
// serían cientos. Se crea con el primer suscriptor y se para cuando no queda ninguno.
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) timer = setInterval(() => listeners.forEach((notify) => notify()), TICK_MS);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

// El estado de una bolsa solo cambia en minutos enteros: el valor cambia cada minuto, no a cada lectura.
const getSnapshot = (): number | null => Math.floor(Date.now() / 60_000);
// En el servidor (y en el primer pintado del cliente) no hay hora: así no hay diferencias al hidratar.
const getServerSnapshot = (): number | null => null;

/** Hora actual redondeada al minuto, o null hasta que la página está montada en el navegador. */
export function useMarketClock(): Date | null {
  const minute = useSyncExternalStore<number | null>(subscribe, getSnapshot, getServerSnapshot);
  return useMemo(() => (minute === null ? null : new Date(minute * 60_000)), [minute]);
}
