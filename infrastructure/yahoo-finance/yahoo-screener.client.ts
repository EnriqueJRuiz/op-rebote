// infrastructure/yahoo-finance/yahoo-screener.client.ts

import YahooFinance from "yahoo-finance2";
import getCrumb from "yahoo-finance2/lib/getCrumb";

import {
  YahooScreenerQuote,
  YahooScreenerRequest,
  YahooScreenerResponse,
} from "./yahoo-finance.types";

const MAX_ATTEMPTS = 3;
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429, 500, 502, 503, 504]);

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export class YahooScreenerClient {

  constructor(private readonly yf: InstanceType<typeof YahooFinance>) {}

  async search(request: YahooScreenerRequest): Promise<YahooScreenerQuote[]> {
    const cookieJar = this.yf._opts.cookieJar;
    const logger = this.yf._opts.logger;

    if (!cookieJar) {
      throw new Error("Yahoo Finance no tiene cookieJar disponible");
    }

    if (!logger) {
      throw new Error("Yahoo Finance no tiene logger disponible");
    }

    const fetchFunc = this.yf._env.fetch || globalThis.fetch;

    const fetchOptionsBase = {
      ...(this.yf._opts.fetchOptions || {}),
      headers: {
        ...(this.yf._opts.fetchOptions?.headers || {}),
      },
    };

    const crumb = await getCrumb(
      cookieJar,
      fetchFunc,
      fetchOptionsBase,
      logger,
      this.yf._notices
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

    const fetchOptions = {
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
    };

    let response: Response | undefined;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      let attemptResponse: Response;
      try {
        attemptResponse = await fetchFunc(url, fetchOptions);
      } catch (error) {
        if (attempt === MAX_ATTEMPTS) {
          throw new Error(
            `No se pudo conectar con Yahoo Screener tras ${MAX_ATTEMPTS} intentos`,
            { cause: error }
          );
        }

        console.warn(
          `Error de conexión con Yahoo Screener; reintento ${attempt + 1}/${MAX_ATTEMPTS}`
        );
        await delay(500 * 2 ** (attempt - 1));
        continue;
      }

      response = attemptResponse;
      if (attemptResponse.ok || !RETRYABLE_STATUS_CODES.has(attemptResponse.status)) break;

      if (attempt === MAX_ATTEMPTS) {
        throw new Error(
          `Yahoo Screener respondió ${attemptResponse.status} tras ${MAX_ATTEMPTS} intentos`
        );
      }

      console.warn(
        `Yahoo Screener respondió ${attemptResponse.status}; reintento ${attempt + 1}/${MAX_ATTEMPTS}`
      );
      await delay(500 * 2 ** (attempt - 1));
    }

    const finalResponse = response;
    if (!finalResponse) {
      throw new Error("Yahoo Screener no devolvió respuesta");
    }

    const responseText = await finalResponse.text();

    if (!finalResponse.ok) {
      console.error("Yahoo Screener HTTP error:", finalResponse.status);
      throw new Error(`Yahoo Screener respondió ${finalResponse.status}`);
    }

    let data: YahooScreenerResponse;

    try {
      data = JSON.parse(responseText) as YahooScreenerResponse;
    } catch {
      console.error("Yahoo devolvió una respuesta no JSON");
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