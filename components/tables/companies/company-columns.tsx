"use client";

import { Column } from "@/components/tables/core/DataTable";
import { FollowButton } from "@/components/buttons/follow-button";
import { DividendBadge, PriceChange } from "@/components/tables/common/trading-cells";
import { CompanyRecord, CompanyScanQuote } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";
import { CompanyHistoryTrigger } from "@/components/tables/common/company-history-trigger";

export function formatScannedPrice(value: number, currency?: string) {
  const formatted = value.toLocaleString("es-ES", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

  return currency ? `${formatted} ${currency}` : formatted;
}

export function renderCompanyScannedPrice(empresa: CompanyRecord, scanQuoteByCompanyId: Map<number, CompanyScanQuote>) {
  const quote = scanQuoteByCompanyId.get(empresa.id);
  if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) {
    return (
      <CompanyHistoryTrigger companyId={empresa.id} ticker={empresa.ticker} companyName={empresa.nombre} currency={empresa.moneda} metric="precio">
        <span className={UI_STYLES.text.secondary}>{UI_TEXT.table.values.notAvailable}</span>
      </CompanyHistoryTrigger>
    );
  }

  return (
    <CompanyHistoryTrigger companyId={empresa.id} ticker={empresa.ticker} companyName={empresa.nombre} currency={empresa.moneda} metric="precio">
      <span className="inline-flex flex-col items-end whitespace-nowrap">
        <span className="inline-block w-22.5 text-right font-medium text-slate-800">
          {formatScannedPrice(quote.price, empresa.moneda)}
        </span>
        <PriceChange
          price={quote.price}
          previousPrice={quote.previousDayPrice}
          className="mt-0.5 justify-end"
        />
      </span>
    </CompanyHistoryTrigger>
  );
}

export function getCompanyColumns(scanQuoteByCompanyId: Map<number, CompanyScanQuote>): Column<CompanyRecord>[] {
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
      render: (empresa) => <span className="font-bold text-slate-900">{empresa.nombre}</span>,
    },
    {
      header: UI_TEXT.table.columns.ticker,
      sortValue: (empresa) => empresa.ticker,
      render: (empresa) => <span className={UI_STYLES.badge.ticker}>{empresa.ticker}</span>,
    },
    {
      header: UI_TEXT.table.columns.lastPrice,
      sortValue: (empresa) => scanQuoteByCompanyId.get(empresa.id)?.price,
      render: (empresa) => renderCompanyScannedPrice(empresa, scanQuoteByCompanyId),
    },
    {
      header: UI_TEXT.table.columns.sector,
      render: (empresa) => empresa.sector || UI_TEXT.table.values.unknownSector,
      cellClassName: UI_STYLES.text.secondary,
    },
    {
      header: UI_TEXT.table.columns.dividend,
      render: (empresa) => <DividendBadge empresa={empresa} />,
    },
  ];
}
