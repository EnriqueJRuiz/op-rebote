// infrastructure/yahoo-finance/yahoo-finance.types.ts

export interface YahooFormattedNumber {
  raw?: number;
  fmt?: string;
  longFmt?: string;
}

export type YahooNumericValue = number | YahooFormattedNumber;

export interface YahooScreenerQuote {
  symbol: string;
  quoteType?: string;
  shortName?: string;
  longName?: string;
  region?: string;
  currency?: string;
  fullExchangeName?: string;
  exchange?: string;
  marketCap?: YahooFormattedNumber;
  regularMarketPrice?: YahooFormattedNumber;
  regularMarketVolume?: YahooFormattedNumber;
  averageDailyVolume3Month?: YahooFormattedNumber;
}

export interface YahooScreenerResponse {
  finance?: {
    result?: Array<{
      quotes?: YahooScreenerQuote[];
      total?: number;
    }>;
    error?: {
      code?: string;
      description?: string;
    };
  };
}

export type YahooScreenerOperator =
  | "AND"
  | "OR"
  | "EQ"
  | "GTE"
  | "LTE"
  | "GT"
  | "LT";

export interface YahooScreenerQuery {
  operator: YahooScreenerOperator;
  operands: unknown[];
}

export interface YahooScreenerRequest {
  offset: number;
  size: number;
  sortType: "ASC" | "DESC";
  sortField: string;
  quoteType: "EQUITY";
  topOperator: "AND" | "OR";
  query: YahooScreenerQuery;
  userId: string;
  userIdType: "guid";
}

export interface YahooCompanyQuote {
  quoteType?: string;
  currency?: string;
  exchange?: string;
  fullExchangeName?: string;
  regularMarketPrice?: YahooNumericValue;
  regularMarketVolume?: YahooNumericValue;
  marketCap?: YahooNumericValue;
  dividendRate?: YahooNumericValue;
  dividendYield?: YahooNumericValue;
  trailingAnnualDividendRate?: YahooNumericValue;
  trailingAnnualDividendYield?: YahooNumericValue;
}

export interface YahooCompanySummary {
  assetProfile?: {
    sector?: string;
    industry?: string;
    country?: string;
    website?: string;
  };
  summaryDetail?: {
    dividendRate?: YahooNumericValue;
    dividendYield?: YahooNumericValue;
    trailingAnnualDividendRate?: YahooNumericValue;
    trailingAnnualDividendYield?: YahooNumericValue;
  };
  price?: {
    marketCap?: YahooNumericValue;
    currency?: string;
    exchangeName?: string;
  };
  financialData?: {
    currentRatio?: YahooNumericValue;
    debtToEquity?: YahooNumericValue;
    returnOnEquity?: YahooNumericValue;
    profitMargins?: YahooNumericValue;
    freeCashflow?: YahooNumericValue;
    totalCash?: YahooNumericValue;
    totalDebt?: YahooNumericValue;
  };
}