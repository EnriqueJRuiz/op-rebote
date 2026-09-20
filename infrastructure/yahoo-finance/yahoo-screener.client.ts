// infrastructure/yahoo-finance/yahoo-screener.client.ts

import YahooFinance from "yahoo-finance2";
import getCrumb from "yahoo-finance2/lib/getCrumb";

import {
  YahooScreenerQuote,
  YahooScreenerRequest,
  YahooScreenerResponse,
} from "./yahoo-finance.types";

export class YahooScreenerClient {

  constructor(private readonly yf: InstanceType<typeof YahooFinance>) {}

  async search(request: YahooScreenerRequest): Promise<YahooScreenerQuote[]> {
    const internals = this.yf as any;

    const cookieJar = internals._opts?.cookieJar;
    const logger = internals._opts?.logger;

    if (!cookieJar) {
      throw new Error("Yahoo Finance no tiene cookieJar disponible");
    }

    if (!logger) {
      throw new Error("Yahoo Finance no tiene logger disponible");
    }

    const fetchFunc =
      internals._env?.fetch ||
      internals._opts?.fetch ||
      globalThis.fetch;

    const fetchOptionsBase = {
      ...(internals._opts.fetchOptions || {}),
      headers: {
        ...(internals._opts.fetchOptions?.headers || {}),
      },
    };

    const crumb = await getCrumb(
      cookieJar,
      fetchFunc,
      fetchOptionsBase,
      logger,
      internals._notices
    );

    if (!crumb) {
      throw new Error("Yahoo Finance no devolvió un crumb válido");
    }

    const params = new URLSearchParams({
      crumb,
      lang: "en-US",
      region: "US",
      formatted: "true",
      corsDomain: "finance.yahoo.com",
    });

    const url =
      `https://query1.finance.yahoo.com/v1/finance/screener?${params.toString()}`;

    const cookie = await cookieJar.getCookieString(url, {
      allPaths: true,
    });

    const response = await fetchFunc(url, {
      ...fetchOptionsBase,
      method: "POST",
      headers: {
        ...(fetchOptionsBase.headers || {}),
        Accept: "application/json",
        "Content-Type": "application/json",
        cookie,
        origin: "https://finance.yahoo.com",
        referer: "https://finance.yahoo.com/screener/equity/new",
      },
      body: JSON.stringify(request),
    });

    const responseText = await response.text();

    if (!response.ok) {
      console.error(
        "Yahoo Screener HTTP error:",
        response.status,
        responseText
      );

      throw new Error(`Yahoo Screener respondió ${response.status}`);
    }

    let data: YahooScreenerResponse;

    try {
      data = JSON.parse(responseText) as YahooScreenerResponse;
    } catch {
      console.error("Yahoo devolvió una respuesta no JSON:", responseText);
      throw new Error("Yahoo Screener devolvió una respuesta inválida");
    }

    if (data.finance?.error) {
      console.error("Yahoo Screener error:", data.finance.error);

      throw new Error(
        data.finance.error.description ||
        "Yahoo Screener devolvió un error"
      );
    }

    const result = data.finance?.result?.[0];

    if (!result) {
      console.error("Respuesta inesperada de Yahoo:", data);
      throw new Error("Yahoo Screener no devolvió resultados");
    }

    console.log("Yahoo Screener total:", result.total);
    console.log("Yahoo Screener recibidos:", result.quotes?.length ?? 0);

    return result.quotes ?? [];
  }
}