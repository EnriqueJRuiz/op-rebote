"use client";

import { Column } from "@/components/tables/core/DataTable";
import { FollowButton } from "@/components/buttons/follow-button";
import { DividendBadge } from "@/components/tables/common/trading-cells";
import { CompanyRecord, CompanyScanQuote } from "@/domain/models/trading";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";

export function formatScannedPrice(value: number, currency?: string) {
  const formatted = value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return currency ? `${formatted} ${currency}` : formatted;
}

export function renderCompanyScannedPrice(empresa: CompanyRecord, scanQuoteByCompanyId: Map<number, CompanyScanQuote>) {
  const quote = scanQuoteByCompanyId.get(empresa.id);
  if (!quote || !Number.isFinite(quote.price) || quote.price <= 0) {
    return <span className={UI_STYLES.text.secondary}>{UI_TEXT.table.values.notAvailable}</span>;
  }

  const changePercent =
    quote.previousDayPrice && quote.previousDayPrice > 0
      ? ((quote.price - quote.previousDayPrice) / quote.previousDayPrice) * 100
      : undefined;

  const changeStyle =
    changePercent === undefined
      ? ""
      : changePercent > 0
        ? UI_STYLES.badge.success
        : changePercent < 0
          ? UI_STYLES.badge.danger
          : "text-slate-500";

  return (
    <span className="inline-flex items-center whitespace-nowrap">
      <span className="inline-block w-22.5 text-right font-medium text-slate-800">
        {formatScannedPrice(quote.price, empresa.moneda)}
      </span>

      {changePercent !== undefined && (
        <span
          className={`ml-2 inline-flex w-14.5 items-center gap-0.5 text-xs font-medium ${changeStyle}`}
          title={UI_TEXT.table.columns.previousDayChange}
          aria-label={`${UI_TEXT.table.columns.previousDayChange}: ${changePercent.toFixed(2)}%`}
        >
          <span aria-hidden="true">{changePercent >= 0 ? "▲" : "▼"}</span>
          {Math.abs(changePercent).toFixed(2)}%
        </span>
      )}
    </span>
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
