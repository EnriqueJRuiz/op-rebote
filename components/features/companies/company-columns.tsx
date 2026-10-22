"use client";

import { CompanyRecord, CompanyScanQuote } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";
import { DividendBadge, PriceChange } from "@/components/ui/core/trading-cells";
import { FollowButton } from "@/components/common/follow-button";
import { CompanyHistoryTrigger } from "@/components/common/history/company-history-trigger";
import { OpenOperationButton } from "@/components/common/open-operation";
import { CompanyCell } from "./company-cell";
import { Column } from "@/components/ui/core/data-table";

export function formatScannedPrice(value: number, currency?: string) {
  const formatted = value.toLocaleString("es-ES", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  return currency ? `${formatted} ${currency}` : formatted;
}

export function renderCompanyScannedPrice(empresa: CompanyRecord, scanQuoteByCompanyId: Map<number, CompanyScanQuote>, showEye = true) {
  const quote = scanQuoteByCompanyId.get(empresa.id);
  if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) {
    return (
      <CompanyHistoryTrigger companyId={empresa.id} ticker={empresa.ticker} companyName={empresa.nombre} currency={empresa.moneda} metric="precio" showEye={showEye}>
        <span className={UI_STYLES.text.secondary}>{UI_TEXT.table.values.notAvailable}</span>
      </CompanyHistoryTrigger>
    );
  }

  return (
    <CompanyHistoryTrigger companyId={empresa.id} ticker={empresa.ticker} companyName={empresa.nombre} currency={empresa.moneda} metric="precio" showEye={showEye}>
      <span className="inline-flex flex-col items-end whitespace-nowrap">
        <PriceChange
          price={quote.price}
          previousPrice={quote.previousDayPrice}
          className="mt-0.5 justify-end"
        />
        <span className="inline-block w-22.5 text-right font-medium text-slate-800">
          {formatScannedPrice(quote.price, empresa.moneda)}
        </span>
      </span>
    </CompanyHistoryTrigger>
  );
}

export function renderCompanyScannedPriceRow(empresa: CompanyRecord, scanQuoteByCompanyId: Map<number, CompanyScanQuote>, showEye = true) {
  const quote = scanQuoteByCompanyId.get(empresa.id);
  if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) {
    return (
      <CompanyHistoryTrigger companyId={empresa.id} ticker={empresa.ticker} companyName={empresa.nombre} currency={empresa.moneda} metric="precio" showEye={showEye}>
        <span className={UI_STYLES.text.secondary}>{UI_TEXT.table.values.notAvailable}</span>
      </CompanyHistoryTrigger>
    );
  }

  return (
    <CompanyHistoryTrigger companyId={empresa.id} ticker={empresa.ticker} companyName={empresa.nombre} currency={empresa.moneda} metric="precio" showEye={showEye}>
      <span className="inline-flex flex-col items-end whitespace-nowrap">
        <span className="inline-block w-22.5 text-right font-medium text-slate-800">
          {formatScannedPrice(quote.price, empresa.moneda)}
        </span>
      </span>
    </CompanyHistoryTrigger>
  );
}

export function getScanQuoteChangePercent(quote?: CompanyScanQuote): number | null {
  if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) return null;
  if (!quote.previousDayPrice || quote.previousDayPrice <= 0) return null;
  return ((quote.price - quote.previousDayPrice) / quote.previousDayPrice) * 100;
}

export function getCompanyColumns(
  scanQuoteByCompanyId: Map<number, CompanyScanQuote>,
  onOperationOpened: () => void
): Column<CompanyRecord>[] {
  return [
    {
      header: "",
      render: (empresa) => (
        <div className="flex items-center justify-center">
          <FollowButton ticker={empresa.ticker} />
        </div>
      ),
      cellClassName: "w-10 px-2 text-center",
    },
    {
      header: UI_TEXT.table.columns.name,
      sortValue: (empresa) => empresa.nombre,
      render: (empresa) => (
        <div className="flex min-w-0 items-center gap-2">
          <CompanyCell name={empresa.nombre} ticker={empresa.ticker} website={empresa.web} bolsa={empresa.bolsa} size={36} className="flex-1" />
          <DividendBadge empresa={empresa} hideYield={true} />
        </div>
      ),
    },
    {
      header: UI_TEXT.table.columns.lastPrice,
      sortValue: (empresa) => getScanQuoteChangePercent(scanQuoteByCompanyId.get(empresa.id)),
      sortLabel: UI_TEXT.table.columns.change,
      firstSortDirection: "desc",
      render: (empresa) => renderCompanyScannedPrice(empresa, scanQuoteByCompanyId),
    },
    {
      header: UI_TEXT.table.columns.sector,
      sortValue: (empresa) => empresa.sector || "", // Habilita la ordenación por sector
      render: (empresa) => empresa.sector || UI_TEXT.table.values.unknownSector,
      cellClassName: UI_STYLES.text.secondary,
    },
    {
      header: UI_TEXT.table.columns.dividend,
      sortValue: (empresa) => empresa.dividend_yield ?? empresa.dividend_rate ?? 0, // Habilita la ordenación numérica por dividendo
      render: (empresa) => {
        if (!empresa.es_dividendo) return <span className={UI_STYLES.text.secondary}>—</span>;
        
        const yieldValue = empresa.dividend_yield
          ? `${(empresa.dividend_yield * 100).toFixed(2)}%`
          : empresa.dividend_rate
          ? `${empresa.dividend_rate}%`
          : "Sí";

        return (
          <span className="inline-flex w-22.5 items-center justify-center">
            <span className="text-right text-sm tabular-nums text-slate-700" title={UI_TEXT.table.columns.dividendYield}>
              {yieldValue}
            </span>
          </span>
        );
      },
    },
    {
      header: UI_TEXT.table.columns.operate,
      render: (empresa) =>
        empresa.ticker === undefined ? null : (
          <OpenOperationButton
            companyId={empresa.id}
            ticker={empresa.ticker}
            companyName={empresa.nombre}
            precioActual={scanQuoteByCompanyId.get(empresa.id)?.price ?? empresa.precio}
            onSuccess={onOperationOpened}
          />
        ),
      headerClassName: "text-right",
      cellClassName: "text-right",
    },
  ];
}