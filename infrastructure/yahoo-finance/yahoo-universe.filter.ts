import { APP_CONFIG } from "@/domain/constants";
import { UniverseStock } from "@/domain/models/trading";
import { UNIVERSE_RULES } from "@/domain/rules/universe.rules";

export class YahooUniverseFilter {
  filterTop(stocks: UniverseStock[]): UniverseStock[] {
    const valid = this.filter(stocks, APP_CONFIG.CATEGORIES.TOP);
    return valid.map(stock => ({ ...stock, categoria: APP_CONFIG.CATEGORIES.TOP }));
  }

  filterMid(stocks: UniverseStock[]): UniverseStock[] {
    const valid = this.filter(stocks, APP_CONFIG.CATEGORIES.MID);
    return valid.map(stock => ({ ...stock, categoria: APP_CONFIG.CATEGORIES.MID }));
  }

  private filter(
    stocks: UniverseStock[],
    type: "TOP" | "MID"
  ): UniverseStock[] {
    const valid: UniverseStock[] = [];
    const reasons = new Map<string, number>();

    for (const stock of stocks) {
      const reason = this.getRejectionReason(stock, type);

      if (reason) {
        reasons.set(reason, (reasons.get(reason) ?? 0) + 1);
      } else {
        valid.push(stock);
      }
    }

    console.log(`\n${type}-CAPS FILTRO`);
    console.log("-----------------------------");
    console.log("Recibidas:", stocks.length);
    console.log("Válidas:", valid.length);
    console.log("Descartadas:", stocks.length - valid.length);

    if (reasons.size > 0) {
      console.log("\nMotivos de descarte:");

      for (const [reason, count] of reasons) {
        console.log(`- ${reason}: ${count}`);
      }
    }

    return valid;
  }

  private getRejectionReason(
    stock: UniverseStock,
    type: "TOP" | "MID"
  ): string | null {
    if (!stock.ticker || stock.marketCap <= 0 || stock.precio <= 0) {
      return "Datos inválidos";
    }

    const otcReason = this.getOtcRejectionReason(stock);
    if (otcReason) {
      return otcReason; // Devuelve directamente el desglose, ej: "OTC: OTCPK"
    }

    const volumenMedio = stock.volumenMedio ?? 0;

    if (type === "TOP") {
      if (stock.marketCap < UNIVERSE_RULES.TOP.MIN_MARKET_CAP) {
        return "Market cap insuficiente";
      }

      if (volumenMedio < UNIVERSE_RULES.TOP.MIN_DAILY_VOLUME) {
        return "Volumen insuficiente";
      }
    }

    if (type === "MID") {
      if (
        stock.marketCap < UNIVERSE_RULES.MID.MIN_MARKET_CAP ||
        stock.marketCap >= UNIVERSE_RULES.MID.MAX_MARKET_CAP
      ) {
        return "Market cap fuera de rango";
      }

      if (volumenMedio < UNIVERSE_RULES.MID.MIN_DAILY_VOLUME) {
        return "Volumen insuficiente";
      }
    }

    return null;
  }

  private isNonOtcListing(stock: UniverseStock): boolean {
    const exchange = stock.exchange ?? "";
    
    return !/OTC Markets/i.test(exchange);
  }

  private getOtcRejectionReason(stock: UniverseStock): string | null {
    const exchange = stock.exchange ?? "";

    if (/OTC Markets/i.test(exchange)) {
      // Extraemos la categoría específica (ej: OTCPK, OTCQX, OTCQB, OTCID) si existe, o dejamos el exchange entero
      const match = exchange.match(/(OTCPK|OTCQX|OTCQB|OTCID)/i);
      const subType = match ? match[1].toUpperCase() : exchange;
      
      return `OTC (${subType})`;
    }

    return null;
  }
}