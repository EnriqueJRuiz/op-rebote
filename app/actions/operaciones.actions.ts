"use server";

import { revalidatePath } from "next/cache";
import { CreateOperacionInput } from "@/domain/models/operacion";
import { createApplicationDependencies } from "@/infrastructure/composition";

export async function obtenerOperacionesActivasAction() {
  try {
    const { getActiveOperations } = createApplicationDependencies();
    return await getActiveOperations.execute();
  } catch (error) {
    console.error("Error al obtener operaciones activas:", error);
    return [];
  }
}

export async function abrirOperacionAction(formData: CreateOperacionInput) {
  try {
    const { openOperation } = createApplicationDependencies();
    const nuevaOp = await openOperation.execute(formData);
    revalidatePath("/");
    return { success: true, data: nuevaOp };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "No se pudo abrir la operación";
    return { success: false, error: message };
  }
}

export async function cerrarOperacionAction(id: number, precioSalida: number, comisiones?: number) {
  try {
    const { closeOperation } = createApplicationDependencies();
    const opCerrada = await closeOperation.execute(id, precioSalida, comisiones);
    revalidatePath("/");
    return { success: true, data: opCerrada };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "No se pudo cerrar la operación";
    return { success: false, error: message };
  }
}

export async function obtenerHistorialOperacionesAction() {
  try {
    const { getClosedOperations } = createApplicationDependencies();
    return await getClosedOperations.execute();
  } catch (error) {
    console.error("Error al obtener el historial de operaciones:", error);
    return [];
  }
}