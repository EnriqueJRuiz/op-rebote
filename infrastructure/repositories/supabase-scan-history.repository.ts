// infrastructure/repositories/supabase-scan-history.repository.ts
import { createClient } from "@supabase/supabase-js";
import { ScanHistoryRepositoryPort } from "@/application/ports/scan-history-repository.port";
import { CompanyScanQuote, StockCandidate } from "@/domain/models/trading";
import { RsiSeriesPoint } from "@/domain/models/backtest";
import { isScanHistorySchemaUnavailable, isTransientSupabaseError } from "@/infrastructure/repositories/supabase-error-utils";
import { APP_CONFIG } from "@/domain/constants";

export class SupabaseScanHistoryRepository implements ScanHistoryRepositoryPort {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  async saveScanResult(companyId: number, stock: StockCandidate, loteId: string): Promise<void> {
    const { error } = await this.supabase
      .from("historico_escaneos")
      .insert({
        empresa_id: companyId,
        lote_id: loteId,
        precio: stock.precio,
        volumen: Math.round(stock.volumen),
        volumen_relativo: stock.volumenRelativo ?? null,
        rsi: stock.rsi,
        capitalizacion: stock.capitalizacion ?? null,
        minimo_reciente: stock.minimoReciente ?? null,
        es_valido: stock.esValido,
        tier: stock.tier ?? "NULL",
        regla_salida: stock.reglaSalida ?? null,
      });

    if (error) {
      throw new Error(`No se pudo guardar el escaneo de ${stock.ticker}: ${error.message}`);
    }
  }

  async saveScanResults(rows: { companyId: number; stock: StockCandidate; loteId: string }[]): Promise<void> {
    if (rows.length === 0) return;

    const { error } = await this.supabase
      .from("historico_escaneos")
      .insert(
        rows.map(({ companyId, stock, loteId }) => ({
          empresa_id: companyId,
          lote_id: loteId,
          precio: stock.precio,
          volumen: Math.round(stock.volumen),
          rsi: stock.rsi,
          capitalizacion: stock.capitalizacion ?? null,
          minimo_reciente: stock.minimoReciente ?? null,
          es_valido: stock.esValido,
          tier: stock.tier ?? "NULL",
          regla_salida: stock.reglaSalida ?? null,
        }))
      );

    if (error) {
      throw new Error(`No se pudo guardar el lote de escaneos: ${error.message}`);
    }
  }

  async getLatestScanQuotes(): Promise<CompanyScanQuote[]> {
    type ScanBatchReference = { lote_id: string; fecha: string };
    type ScanPriceRow = { empresa_id: number; precio: number };

    const { data: latestRows, error: latestError } = await this.supabase
      .from("historico_escaneos")
      .select("lote_id, fecha")
      .order("escaneado_en", { ascending: false })
      .limit(1);

    if (latestError) {
      if (isScanHistorySchemaUnavailable(latestError.code) || isTransientSupabaseError(latestError)) {
        return [];
      }
      throw new Error(`No se pudo localizar el último escaneo: ${latestError.message}`);
    }

    const latestBatch = (latestRows as ScanBatchReference[] | null)?.[0];
    if (!latestBatch) return [];

    const previousDate = new Date(`${latestBatch.fecha}T00:00:00.000Z`);
    if (Number.isNaN(previousDate.getTime())) return [];
    previousDate.setUTCDate(previousDate.getUTCDate() - 1);
    const previousDateString = previousDate.toISOString().slice(0, 10);

    const { data: previousBatchRows, error: previousBatchError } = await this.supabase
      .from("historico_escaneos")
      .select("lote_id, fecha")
      .eq("fecha", previousDateString)
      .order("escaneado_en", { ascending: false })
      .limit(1);

    if (previousBatchError && !isScanHistorySchemaUnavailable(previousBatchError.code) && !isTransientSupabaseError(previousBatchError)) {
      throw new Error(`No se pudo localizar el escaneo del día anterior: ${previousBatchError.message}`);
    }

    const previousBatch = (previousBatchRows as ScanBatchReference[] | null)?.[0];
    const { data: currentRows, error: currentError } = await this.supabase
      .from("historico_escaneos")
      .select("empresa_id, precio")
      .eq("lote_id", latestBatch.lote_id);

    if (currentError) {
      if (isScanHistorySchemaUnavailable(currentError.code) || isTransientSupabaseError(currentError)) {
        return [];
      }
      throw new Error(`No se pudieron recuperar los precios del último escaneo: ${currentError.message}`);
    }

    let previousRows: ScanPriceRow[] = [];
    if (previousBatch) {
      const { data, error } = await this.supabase
        .from("historico_escaneos")
        .select("empresa_id, precio")
        .eq("lote_id", previousBatch.lote_id);

      if (error && !isScanHistorySchemaUnavailable(error.code) && !isTransientSupabaseError(error)) {
        throw new Error(`No se pudieron recuperar los precios del día anterior: ${error.message}`);
      }
      previousRows = (data as ScanPriceRow[] | null) ?? [];
    }

    const previousPrices = new Map(previousRows.map((row) => [row.empresa_id, Number(row.precio)]));

    return ((currentRows as ScanPriceRow[] | null) ?? []).map((row) => ({
      companyId: row.empresa_id,
      price: Number(row.precio),
      previousDayPrice: previousPrices.get(row.empresa_id),
    }));
  }

  async getLatestOpportunities(): Promise<StockCandidate[]> {
    const { data: latestRows, error: latestError } = await this.supabase
      .from("historico_escaneos")
      .select("lote_id, escaneado_en")
      .order("escaneado_en", { ascending: false })
      .limit(1);

    if (latestError) {
      if (isScanHistorySchemaUnavailable(latestError.code) || isTransientSupabaseError(latestError)) {
        console.warn("No se pudo consultar temporalmente el último lote; se muestran oportunidades vacías.", {
          code: latestError.code,
          message: latestError.message,
        });
        return [];
      }
      throw new Error(`No se pudo localizar el último escaneo: ${latestError.message}`);
    }

    const latest = (latestRows as Array<{ lote_id: string }> | null)?.[0];
    if (!latest) return [];

    const { data: rows, error } = await this.supabase
      .from("historico_escaneos")
      .select("precio, volumen, volumen_relativo, rsi, capitalizacion, minimo_reciente, es_valido, tier, regla_salida, empresas(id, ticker, nombre, categoria)")
      .eq("lote_id", latest.lote_id)
      .eq("es_valido", true);

    if (error) {
      if (isScanHistorySchemaUnavailable(error.code) || isTransientSupabaseError(error)) {
        console.warn("No se pudo consultar temporalmente el último lote; se muestran oportunidades vacías.", {
          code: error.code,
          message: error.message,
        });
        return [];
      }
      throw new Error(`No se pudieron recuperar las oportunidades: ${error.message}`);
    }

    type StoredOpportunity = {
      precio: number;
      volumen: number;
      volumen_relativo?: number | null;
      rsi: number;
      capitalizacion?: number;
      minimo_reciente?: number | null;
      tier?: any;
      regla_salida?: any;
      empresas: { id: number; ticker: string; nombre: string; categoria?: any } | Array<{ id: number; ticker: string; nombre: string; categoria?: any }> | null;
    };

    const opportunities = ((rows as StoredOpportunity[] | null) ?? [])
      .map((row) => ({ row, company: Array.isArray(row.empresas) ? row.empresas[0] : row.empresas }))
      .filter((item) => item.company !== null && item.company !== undefined)
      .map(({ row, company }) => ({
        idEmpresa: company!.id,
        ticker: company!.ticker,
        nombre: company!.nombre,
        precio: row.precio,
        volumen: row.volumen,
        volumenRelativo: row.volumen_relativo ?? undefined,
        rsi: row.rsi,
        capitalizacion: row.capitalizacion,
        minimoReciente: row.minimo_reciente ?? undefined,
        categoria: company!.categoria,
        esValido: true,
        tier: row.tier,
        reglaSalida: row.regla_salida,
      }));

    const idsParaBacktest = opportunities
      .filter((o) => 
        o.tier === APP_CONFIG.CATEGORIES.TIER_0 ||
        o.tier === APP_CONFIG.CATEGORIES.TIER_1 ||
        o.tier === APP_CONFIG.CATEGORIES.TOP ||
        o.tier === APP_CONFIG.CATEGORIES.MID
      )
      .map((o) => o.idEmpresa);

    let backtestPorEmpresa = new Map<number, { casos_totales: number; ganados: number; perdidos: number; estancados: number; dias_suma: number }>();

    if (idsParaBacktest.length > 0) {
      const { data: backtestRows } = await this.supabase
        .from("backtest")
        .select("id_empresa, casos_totales, ganados, perdidos, estancados, dias_suma")
        .in("id_empresa", idsParaBacktest);

      backtestPorEmpresa = new Map(
        (backtestRows ?? []).map((b) => [b.id_empresa, b])
      );
    }

    return opportunities.map(({ idEmpresa, ...opportunity }) => {
      const bt = backtestPorEmpresa.get(idEmpresa);
      if (!bt || bt.casos_totales === 0) return opportunity;

      return {
        ...opportunity,
        backtestCasos: bt.casos_totales,
        backtestExitoPct: Math.round((bt.ganados / bt.casos_totales) * 100),
        backtestPerdidoPct: Math.round((bt.perdidos / bt.casos_totales) * 100),
        backtestEstancadoPct: Math.round((bt.estancados / bt.casos_totales) * 100),
        backtestDiasMedios: Math.round(bt.dias_suma / bt.casos_totales),
      };
    });
  }

  async getScanHistorySince(companyId: number, sinceFecha: string): Promise<RsiSeriesPoint[]> {
    const { data, error } = await this.supabase
      .from("historico_escaneos")
      .select("fecha, precio, rsi, volumen")
      .eq("empresa_id", companyId)
      .gt("fecha", sinceFecha)
      .order("fecha", { ascending: true });

    if (error) {
      throw new Error(`No se pudo leer el histórico de escaneos de la empresa ${companyId}: ${error.message}`);
    }

    return ((data as { fecha: string; precio: number; rsi: number; volumen: number }[] | null) ?? [])
      .map((row) => ({ fecha: row.fecha, precio: row.precio, rsi: row.rsi, volumen: row.volumen }));
  }
}