"use server";

import { operacionesRepository } from "@/infrastructure/repositories/supabase-operaciones.repository"
import { revalidatePath } from "next/cache";

export async function obtenerOperacionesActivasAction() {
  try {
    return await operacionesRepository.getActive();
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

export async function cerrarOperacionAction(id: number, precioSalida: number) {
  try {
    const opCerrada = await operacionesRepository.close(id, precioSalida);
    revalidatePath("/"); // Refresca la vista
    return { success: true, data: opCerrada };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}