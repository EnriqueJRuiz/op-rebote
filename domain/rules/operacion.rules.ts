import { Operacion } from "@/domain/models/operacion";

export interface ResultadoOperacion {
  acciones: number;
  // Lo que se recibiría por la venta, antes de comisiones e impuestos.
  importeSalida: number;
  beneficioBruto: number;
  // Comisiones del bróker + impuestos.
  costes: number;
  beneficioNeto: number;
  // Beneficio neto sobre el capital invertido (no sobre el precio de una acción).
  rentabilidadPct: number | null;
}

type OperacionParaResultado = Pick<
  Operacion,
  "precio_entrada" | "capital_invertido" | "cantidad_acciones" | "comisiones_broker" | "impuestos"
>;

/**
 * Resultado de cerrar una operación al precio de salida indicado.
 * Es la misma cuenta que se guarda al cerrar (beneficio_neto), para que la previsión del diálogo
 * y el dato registrado no puedan divergir.
 */
export function calcularResultadoOperacion(
  operacion: OperacionParaResultado,
  precioSalida: number,
  // Comisiones totales (entrada + salida). Si no se indican, se usan las guardadas en la operación.
  comisiones?: number
): ResultadoOperacion {
  const acciones =
    operacion.cantidad_acciones ??
    (operacion.precio_entrada > 0 ? operacion.capital_invertido / operacion.precio_entrada : 0);
  const importeSalida = acciones * precioSalida;
  const beneficioBruto = (precioSalida - operacion.precio_entrada) * acciones;
  const costes = (comisiones ?? (operacion.comisiones_broker || 0)) + (operacion.impuestos || 0);
  const beneficioNeto = beneficioBruto - costes;
  const rentabilidadPct =
    operacion.capital_invertido > 0 ? (beneficioNeto / operacion.capital_invertido) * 100 : null;

  return { acciones, importeSalida, beneficioBruto, costes, beneficioNeto, rentabilidadPct };
}
