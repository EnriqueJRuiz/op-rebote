"use server";

import { operacionesRepository } from "@/infrastructure/repositories/supabase-operaciones.repository"
import { revalidatePath } from "next/cache";
import { SupabaseScanHistoryRepository } from "@/infrastructure/repositories/supabase-scan-history.repository";

const scanHistoryRepository = new SupabaseScanHistoryRepository();

export async function obtenerOperacionesActivasAction() {
  try {
    const [operaciones, cotizaciones] = await Promise.all([
      operacionesRepository.getActive(),
      scanHistoryRepository.getLatestScanQuotes(),
    ]);
    const cotizacionPorEmpresa = new Map(cotizaciones.map((quote) => [quote.companyId, quote]));

    return await Promise.all(operaciones.map(async (operacion) => {
      const quote = operacion.empresa_id == null ? undefined : cotizacionPorEmpresa.get(operacion.empresa_id);
      if (!quote) return { ...operacion, precio_actual: null, precio_anterior_lote: null };
      // El máximo se actualiza con cada consulta del último lote; nunca cierra la operación automáticamente.
      await operacionesRepository.updateMaxPrice(operacion.id, quote.price);
      return {
        ...operacion,
        max_price: Math.max(operacion.max_price ?? operacion.precio_entrada, quote.price),
        precio_actual: quote.price,
        precio_anterior_lote: quote.previousDayPrice ?? null,
      };
    }));
  } catch (error) {
    console.error("Error al obtener operaciones activas:", error);
    return [];
  }
}

export async function abrirOperacionAction(formData: {
  empresa_id: number;
  precio_entrada: number;
  capital_invertido: number;
  trailing_stop_pct?: number;
}) {
  try {
    const nuevaOp = await operacionesRepository.create(formData);
    revalidatePath("/"); // Refresca la vista principal donde esté la tabla
    return { success: true, data: nuevaOp };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function cerrarOperacionAction(id: number, precioSalida: number, comisiones?: number) {
  try {
    const opCerrada = await operacionesRepository.close(id, precioSalida, comisiones);
    revalidatePath("/"); // Refresca la vista
    return { success: true, data: opCerrada };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}