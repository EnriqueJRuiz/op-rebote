"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Refresco de seguridad: recarga los datos de la pantalla cada 15 minutos.
const FULL_REFRESH_INTERVAL_MS = 15 * 60_000;
// Cada cuánto se pregunta si el escaneo ha escrito datos nuevos (consulta muy ligera).
const SCAN_CHECK_INTERVAL_MS = 60_000;

interface AutoRefreshProps {
  // `scannedAt` del último escaneo que ya muestra la pantalla (null si aún no hay ninguno).
  renderedScannedAt: string | null;
}

/**
 * Mantiene la pantalla al día sin recargar a mano, solo mientras la pestaña está visible:
 *  1. Cada 15 minutos hace router.refresh().
 *  2. Cada minuto comprueba si hay un escaneo más reciente que el mostrado y, cuando
 *     ha terminado de escribir, refresca. El escaneo guarda los datos por trozos, así que
 *     se espera a que la marca de tiempo no cambie entre dos comprobaciones seguidas;
 *     de lo contrario se mostrarían datos a medias.
 *
 * router.refresh() conserva el estado del cliente (filtros, orden y página de la tabla).
 * Al volver a la pestaña tras un rato oculta, RefreshOnResume ya se encarga de refrescar.
 */
export function AutoRefresh({ renderedScannedAt }: AutoRefreshProps) {
  const router = useRouter();
  const renderedScannedAtRef = useRef(renderedScannedAt);

  useEffect(() => {
    renderedScannedAtRef.current = renderedScannedAt;
  }, [renderedScannedAt]);

  useEffect(() => {
    let previousScannedAt: string | null = null;
    let checking = false;

    const isVisible = () => document.visibilityState === "visible";

    const refreshOnSchedule = () => {
      if (isVisible()) router.refresh();
    };

    const refreshWhenScanFinished = async () => {
      if (!isVisible() || checking) return;
      checking = true;

      try {
        const response = await fetch("/api/scan-status", { cache: "no-store" });
        if (!response.ok) return;

        const { scannedAt } = (await response.json()) as { scannedAt: string | null };
        const hasNewData = scannedAt !== null && scannedAt !== renderedScannedAtRef.current;
        const scanIsIdle = scannedAt === previousScannedAt;

        if (hasNewData && scanIsIdle) router.refresh();
        previousScannedAt = scannedAt;
      } catch {
        // Sin red o error puntual: se reintenta en la siguiente comprobación.
      } finally {
        checking = false;
      }
    };

    const fullRefreshTimer = window.setInterval(refreshOnSchedule, FULL_REFRESH_INTERVAL_MS);
    const scanCheckTimer = window.setInterval(refreshWhenScanFinished, SCAN_CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(fullRefreshTimer);
      window.clearInterval(scanCheckTimer);
    };
  }, [router]);

  return null;
}
