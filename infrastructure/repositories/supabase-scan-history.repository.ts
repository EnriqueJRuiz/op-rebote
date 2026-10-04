// infrastructure/repositories/supabase-scan-history.repository.ts
import { createClient } from "@supabase/supabase-js";
import { ScanHistoryRepositoryPort } from "@/application/ports/scan-history-repository.port";
import { CompanyRecord, CompanyScanQuote, StockCandidate } from "@/domain/models/trading";
import { CompanyHistoryPoint } from "@/domain/models/company-history";
import { BacktestGroup } from "@/domain/models/backtest";
import { isScanHistorySchemaUnavailable, isTransientSupabaseError } from "@/infrastructure/repositories/supabase-error-utils";

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
        rsi_anterior: stock.rsiAnterior ?? null,
        capitalizacion: stock.capitalizacion ?? null,
        minimo_reciente: stock.minimoReciente ?? null,
        es_valido: stock.esValido,
        tier: stock.tier ?? "NULL",
        regla_salida: stock.reglaSalida ?? null,
        precio_anterior: stock.precioAnterior ?? null,
        sma200: stock.sma200 ?? null,
        dist_sma200_pct: stock.distSma200Pct ?? null,
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
          volumen_relativo: stock.volumenRelativo ?? null,
          rsi: stock.rsi,
          rsi_anterior: stock.rsiAnterior ?? null,
          capitalizacion: stock.capitalizacion ?? null,
          minimo_reciente: stock.minimoReciente ?? null,
          es_valido: stock.esValido,
          tier: stock.tier ?? "NULL",
          regla_salida: stock.reglaSalida ?? null,
          precio_anterior: stock.precioAnterior ?? null,
          sma200: stock.sma200 ?? null,
          dist_sma200_pct: stock.distSma200Pct ?? null,
        }))
      );

    if (error) {
      throw new Error(`No se pudo guardar el lote de escaneos: ${error.message}`);
    }
  }

  async getLatestScanQuotes(): Promise<CompanyScanQuote[]> {
    type ScanBatchReference = { lote_id: string };
    type ScanPriceRow = { empresa_id: number; precio: number; precio_anterior: number | null };

    const { data: latestRows, error: latestError } = await this.supabase
      .from("historico_escaneos")
      .select("lote_id")
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

    const { data: currentRows, error: currentError } = await this.supabase
      .from("historico_escaneos")
      .select("empresa_id, precio, precio_anterior")
      .eq("lote_id", latestBatch.lote_id);

    if (currentError) {
      if (isScanHistorySchemaUnavailable(currentError.code) || isTransientSupabaseError(currentError)) {
        return [];
      }
      throw new Error(`No se pudieron recuperar los precios del último escaneo: ${currentError.message}`);
    }

    // La variación diaria usa el cierre de la sesión anterior que guarda cada escaneo.
    // Si falta (escaneos antiguos), no se muestra variación en vez de mostrar un 0.00% engañoso.
    return ((currentRows as ScanPriceRow[] | null) ?? []).map((row) => ({
      companyId: row.empresa_id,
      price: Number(row.precio),
      previousDayPrice:
        row.precio_anterior === null || row.precio_anterior === undefined
          ? undefined
          : Number(row.precio_anterior),
    }));
  }

  async getRecentCompanyHistory(companyId: number): Promise<CompanyHistoryPoint[]> {
    type HistoryRow = Omit<CompanyHistoryPoint, "timestamp"> & { escaneado_en: string };
    const { data, error } = await this.supabase
      .from("historico_escaneos")
      .select("escaneado_en, precio, rsi, volumen, volumen_relativo, rsi_anterior, capitalizacion, minimo_reciente, sma200, dist_sma200_pct, precio_anterior")
      .eq("empresa_id", companyId)
      .order("escaneado_en", { ascending: false })
      .limit(1000);

    if (error) {
      throw new Error(`No se pudo recuperar el historial de la empresa: ${error.message}`);
    }

    const recentSessions = new Set<string>();
    const recentRows: HistoryRow[] = [];
    for (const row of (data as HistoryRow[] | null) ?? []) {
      const sessionDate = row.escaneado_en.slice(0, 10);
      const weekday = new Date(`${sessionDate}T00:00:00Z`).getUTCDay();
      if (weekday === 0 || weekday === 6) continue;

      recentSessions.add(sessionDate);
      if (recentSessions.size > 5) break;
      recentRows.push(row);
    }

    return recentRows
      .map((row) => ({
        timestamp: row.escaneado_en,
        precio: row.precio === null ? null : Number(row.precio),
        rsi: row.rsi === null ? null : Number(row.rsi),
        volumen: row.volumen === null ? null : Number(row.volumen),
        volumen_relativo: row.volumen_relativo === null ? null : Number(row.volumen_relativo),
        rsi_anterior: row.rsi_anterior === null ? null : Number(row.rsi_anterior),
        capitalizacion: row.capitalizacion === null ? null : Number(row.capitalizacion),
        minimo_reciente: row.minimo_reciente === null ? null : Number(row.minimo_reciente),
        sma200: row.sma200 === null ? null : Number(row.sma200),
        dist_sma200_pct: row.dist_sma200_pct === null ? null : Number(row.dist_sma200_pct),
        precio_anterior: row.precio_anterior === null ? null : Number(row.precio_anterior),
      }))
      .reverse();
  }

  async getLatestOpportunities(): Promise<StockCandidate[]> {
    return this.fetchScanBatchCandidates({ filterOnlyValid: true });
  }

  async getAllLatestScanCandidates(): Promise<StockCandidate[]> {
    return this.fetchScanBatchCandidates({ filterOnlyValid: false });
  }

  private async fetchScanBatchCandidates({ filterOnlyValid }: { filterOnlyValid: boolean }): Promise<StockCandidate[]> {
    const { data: latestRows, error: latestError } = await this.supabase
      .from("historico_escaneos")
      .select("lote_id, escaneado_en")
      .order("escaneado_en", { ascending: false })
      .limit(1);

    if (latestError) {
      if (isScanHistorySchemaUnavailable(latestError.code) || isTransientSupabaseError(latestError)) {
        console.warn("No se pudo consultar temporalmente el último lote:", {
          code: latestError.code,
          message: latestError.message,
        });
        return [];
      }
      throw new Error(`No se pudo localizar el último escaneo: ${latestError.message}`);
    }

    const latest = (latestRows as Array<{ lote_id: string; escaneado_en: string }> | null)?.[0];
    if (!latest) return [];

    let query = this.supabase
      .from("historico_escaneos")
      .select("precio, volumen, volumen_relativo, rsi, rsi_anterior, capitalizacion, minimo_reciente, es_valido, tier, regla_salida, sma200, dist_sma200_pct, precio_anterior, empresas(id, ticker, nombre, categoria, sector, moneda, bolsa, current_ratio, debt_to_equity, return_on_equity)")
      .eq("lote_id", latest.lote_id);

    if (filterOnlyValid) {
      query = query.eq("es_valido", true);
    }

    const { data: rows, error } = await query;

    if (error) {
      if (isScanHistorySchemaUnavailable(error.code) || isTransientSupabaseError(error)) {
        console.warn("No se pudieron consultar temporalmente los candidatos del último lote:", {
          code: error.code,
          message: error.message,
        });
        return [];
      }
      throw new Error(`No se pudieron recuperar los candidatos del último escaneo: ${error.message}`);
    }

    type StoredCandidate = {
      precio: number;
      volumen: number;
      volumen_relativo?: number | null;
      rsi: number;
      rsi_anterior?: number | null;
      capitalizacion?: number;
      minimo_reciente?: number | null;
      sma200?: number | null;
      dist_sma200_pct?: number | null;
      precio_anterior?: number | null;
      es_valido?: boolean;
      tier?: StockCandidate["tier"] | "NULL";
      regla_salida?: StockCandidate["reglaSalida"] | null;
      empresas: Pick<CompanyRecord, "id" | "ticker" | "nombre"> &
        Partial<Pick<CompanyRecord, "categoria" | "sector" | "moneda" | "bolsa" | "current_ratio" | "debt_to_equity" | "return_on_equity">> |
        Array<Pick<CompanyRecord, "id" | "ticker" | "nombre"> &
          Partial<Pick<CompanyRecord, "categoria" | "sector" | "moneda" | "bolsa" | "current_ratio" | "debt_to_equity" | "return_on_equity">>> |
        null;
    };

    const candidates = ((rows as StoredCandidate[] | null) ?? [])
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
        rsiAnterior: row.rsi_anterior ?? undefined,
        capitalizacion: row.capitalizacion,
        minimoReciente: row.minimo_reciente ?? undefined,
        precioAnterior: row.precio_anterior === null || row.precio_anterior === undefined ? undefined : Number(row.precio_anterior),
        sma200: row.sma200 === null || row.sma200 === undefined ? undefined : Number(row.sma200),
        distSma200Pct: row.dist_sma200_pct === null || row.dist_sma200_pct === undefined ? undefined : Number(row.dist_sma200_pct),
        categoria: company!.categoria,
        sector: company!.sector,
        moneda: company!.moneda,
        bolsa: company!.bolsa,
        currentRatio: company!.current_ratio,
        debtToEquity: company!.debt_to_equity,
        returnOnEquity: company!.return_on_equity,
        esValido: row.es_valido ?? false,
        tier: row.tier === "NULL" ? undefined : row.tier,
        reglaSalida: row.regla_salida ?? undefined,
      }));

    const previousFloorDistanceByCompanyId = new Map<number, number>();
    const { data: previousBatchRows, error: previousBatchError } = await this.supabase
      .from("historico_escaneos")
      .select("lote_id")
      .neq("lote_id", latest.lote_id)
      .lt("escaneado_en", latest.escaneado_en)
      .order("escaneado_en", { ascending: false })
      .limit(1);

    if (previousBatchError) {
      console.warn("No se pudo consultar el lote anterior para comparar la distancia al mínimo:", {
        code: previousBatchError.code,
        message: previousBatchError.message,
      });
    } else {
      const previousBatch = (previousBatchRows as Array<{ lote_id: string }> | null)?.[0];
      if (previousBatch) {
        const { data: previousRows, error: previousRowsError } = await this.supabase
          .from("historico_escaneos")
          .select("empresa_id, precio, minimo_reciente")
          .eq("lote_id", previousBatch.lote_id);

        if (previousRowsError) {
          console.warn("No se pudieron recuperar los datos del lote anterior para comparar el mínimo:", {
            code: previousRowsError.code,
            message: previousRowsError.message,
          });
        } else {
          for (const row of (previousRows as Array<{
            empresa_id: number;
            precio: number | null;
            minimo_reciente: number | null;
          }> | null) ?? []) {
            if (
              row.precio !== null && row.precio > 0 &&
              row.minimo_reciente !== null && row.minimo_reciente > 0
            ) {
              previousFloorDistanceByCompanyId.set(
                row.empresa_id,
                ((Number(row.precio) - Number(row.minimo_reciente)) / Number(row.precio)) * 100
              );
            }
          }
        }
      }
    }

    const idsParaBacktest = candidates.map((o) => o.idEmpresa);

    let backtestPorEmpresa = new Map<number, {
      casos_totales: number;
      ganados: number;
      perdidos: number;
      estancados: number;
      dias_suma: number;
      sobre_sma200?: BacktestGroup | null;
      bajo_sma200?: BacktestGroup | null;
    }>();

    if (idsParaBacktest.length > 0) {
      const { data: backtestRows } = await this.supabase
        .from("backtest")
        .select("id_empresa, casos_totales, ganados, perdidos, estancados, dias_suma, sobre_sma200, bajo_sma200")
        .in("id_empresa", idsParaBacktest);

      backtestPorEmpresa = new Map(
        (backtestRows ?? []).map((b) => [b.id_empresa, b])
      );
    }

    const statsGrupo = (g?: BacktestGroup | null) =>
      g && g.casos > 0 ? { casos: g.casos, exitoPct: Math.round((g.ganados / g.casos) * 100) } : undefined;

    return candidates.map(({ idEmpresa, ...candidate }) => {
      const bt = backtestPorEmpresa.get(idEmpresa);
      const distSueloAnteriorPct = previousFloorDistanceByCompanyId.get(idEmpresa);
      if (!bt || bt.casos_totales === 0) return { idEmpresa, ...candidate, distSueloAnteriorPct };

      return {
        idEmpresa,
        ...candidate,
        distSueloAnteriorPct,
        backtestCasos: bt.casos_totales,
        backtestExitoPct: Math.round((bt.ganados / bt.casos_totales) * 100),
        backtestPerdidoPct: Math.round((bt.perdidos / bt.casos_totales) * 100),
        backtestEstancadoPct: Math.round((bt.estancados / bt.casos_totales) * 100),
        backtestDiasMedios: Math.round(bt.dias_suma / bt.casos_totales),
        backtestSobreSma: statsGrupo(bt.sobre_sma200),
        backtestBajoSma: statsGrupo(bt.bajo_sma200),
      };
    });
  }

}