import { createClient } from "@supabase/supabase-js";
import { BacktestRecord, BacktestRepositoryPort } from "@/application/ports/backtest-repository.port";
import { BacktestSummary } from "@/domain/models/backtest";

export class SupabaseBacktestRepository implements BacktestRepositoryPort {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  async saveInitialBacktest(idEmpresa: number, summary: BacktestSummary): Promise<void> {
    const { error } = await this.supabase
      .from("backtest")
      .upsert({
        id_empresa: idEmpresa,
        fecha_actualizacion: new Date().toISOString().split("T")[0],
        metodologia_version: summary.metodologiaVersion,
        comparativas_filtros: summary.comparativasFiltros,
        casos_totales: summary.casosTotales,
        ganados: summary.ganados,
        perdidos: summary.perdidos,
        estancados: summary.estancados,
        dias_suma: summary.diasSuma,
        pendientes: summary.pendientes,
        sobre_sma200: summary.sobreSma,
        bajo_sma200: summary.bajoSma,
      }, { onConflict: "id_empresa" });

    if (error) {
      throw new Error(`No se pudo guardar el backtest de la empresa ${idEmpresa}: ${error.message}`);
    }
  }

  async getBacktest(idEmpresa: number): Promise<BacktestRecord | null> {
    const { data, error } = await this.supabase
        .from("backtest")
        .select("fecha_actualizacion, metodologia_version, comparativas_filtros, casos_totales, ganados, perdidos, estancados, dias_suma, pendientes, sobre_sma200, bajo_sma200")
        .eq("id_empresa", idEmpresa)
        .order("fecha_actualizacion", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        throw new Error(`No se pudo consultar el backtest de la empresa ${idEmpresa}: ${error.message}`);
    }
    if (!data) return null;

    return {
        fechaActualizacion: data.fecha_actualizacion,
        metodologiaVersion: data.metodologia_version ?? 1,
        comparativasFiltros: data.comparativas_filtros ?? undefined,
        casosTotales: data.casos_totales,
        ganados: data.ganados,
        perdidos: data.perdidos,
        estancados: data.estancados,
        diasSuma: data.dias_suma,
        pendientes: data.pendientes,
        sobreSma: data.sobre_sma200 ?? undefined,
        bajoSma: data.bajo_sma200 ?? undefined,
    };
  }

}