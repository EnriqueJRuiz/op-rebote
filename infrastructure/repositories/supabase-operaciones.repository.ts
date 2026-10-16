import { OperacionesRepository } from "@/application/ports/operaciones-repository.port";
import { Operacion, CreateOperacionInput } from "@/domain/models/operacion";
import { createClient } from "@supabase/supabase-js";
import { APP_CONFIG } from "@/domain/constants";
import { calcularResultadoOperacion } from "@/domain/rules/operacion.rules";

export class SupabaseOperacionesRepository implements OperacionesRepository {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  async getActive(): Promise<Operacion[]> {
    const { data, error } = await this.supabase
      .from("operaciones")
      .select(`
        *,
        empresas (
          ticker,
          nombre
        )
      `)
      .is("fecha_cierre", null)
      .order("fecha_apertura", { ascending: false });

    if (error) throw error;

      return data.map((row: any) => ({
    ...row,
    ticker: row.empresas?.ticker ?? "",
    nombre: row.empresas?.nombre ?? "",
  }));
  }

  async create(input: CreateOperacionInput): Promise<Operacion> {
    const precioEntrada = input.precio_entrada;
    const capital = input.capital_invertido;
    const cantidadAcciones = capital / precioEntrada;

    const nuevaOperacion = {
      empresa_id: input.empresa_id,
      tipo_operacion: "COMPRA",
      es_simulacion: true,
      precio_entrada: precioEntrada,
      precio_equilibrio_cero_perdidas: precioEntrada,
      capital_invertido: capital,
      cantidad_acciones: cantidadAcciones,
      comisiones_broker: 0,
      impuestos: 0,
      fecha_apertura: new Date().toISOString(),
      max_price: precioEntrada,
      trailing_stop_pct: input.trailing_stop_pct ?? 2.00,
      resultado_estado: "ACTIVA",
    };

    const { data, error } = await this.supabase
      .from(APP_CONFIG.DB.TABLES.OPERACIONES)
      .insert([nuevaOperacion])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear la operación: ${error.message}`);
    }

    return data;
  }

  async close(id: number, precioSalida: number, comisiones?: number): Promise<Operacion> {
    // El precio de salida y las comisiones los escribe el usuario: no se guarda nada que no sea válido.
    if (!Number.isFinite(precioSalida) || precioSalida <= 0) {
      throw new Error("El precio de salida no es válido");
    }
    if (comisiones !== undefined && (!Number.isFinite(comisiones) || comisiones < 0)) {
      throw new Error("Las comisiones no son válidas");
    }

    const { data: op, error: fetchError } = await await this.supabase
      .from(APP_CONFIG.DB.TABLES.OPERACIONES)
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !op) {
      throw new Error("Operación no encontrada");
    }

    const { beneficioNeto } = calcularResultadoOperacion(op, precioSalida, comisiones);
    const resultadoEstado = beneficioNeto >= 0 ? "BENEFICIO" : "PERDIDA";

    const { data, error } = await await this.supabase
      .from(APP_CONFIG.DB.TABLES.OPERACIONES)
      .update({
        precio_salida: precioSalida,
        ...(comisiones !== undefined && { comisiones_broker: comisiones }),
        fecha_cierre: new Date().toISOString(),
        beneficio_neto: beneficioNeto,
        resultado_estado: resultadoEstado,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al cerrar la operación: ${error.message}`);
    }

    return data;
  }

  async updateMaxPrice(id: number, currentPrice: number): Promise<void> {
    const { data: op } = await await this.supabase
      .from(APP_CONFIG.DB.TABLES.OPERACIONES)
      .select("max_price")
      .eq("id", id)
      .single();

    if (op && (op.max_price === null || currentPrice > op.max_price)) {
      await await this.supabase
        .from(APP_CONFIG.DB.TABLES.OPERACIONES)
        .update({ max_price: currentPrice })
        .eq("id", id);
    }
  }
}

// Instancia por defecto para inyectar en los adaptadores de entrada
export const operacionesRepository = new SupabaseOperacionesRepository();