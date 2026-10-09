"use client";

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode, useState } from "react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";

export interface Column<T> {
  header: string;
  render: (item: T) => ReactNode;
  sortValue?: (item: T) => string | number | null | undefined;
  // Nombre con el que se anuncia el orden si no coincide con la cabecera (p. ej. precio ordenado por %).
  sortLabel?: string;
  // Dirección del primer clic en la cabecera (por defecto ascendente). Útil para %: mayores primero.
  firstSortDirection?: "asc" | "desc";
  cellClassName?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  title?: string;
  subtitle?: string;
  data: T[];
  columns: Column<T>[];
  rowKey: (item: T) => string | number;
  pageSizeOptions?: number[];
  initialPageSize?: number;
  initialSortIndex?: number | null;
  recordsLabel?: string;
  emptyMessage?: string;
  containerClassName?: string;
  mobileRow?: (item: T, expanded: boolean, toggle: () => void) => ReactNode;
  // En móvil las cabeceras no se ven: muestra un selector para ordenar por las columnas ordenables.
  showMobileSort?: boolean;
  rowClassName?: (item: T) => string;
}

type SortDirection = "asc" | "desc";

function compareValues(first: string | number | null | undefined, second: string | number | null | undefined) {
  if (first == null && second == null) return 0;
  if (first == null) return 1;
  if (second == null) return -1;
  if (typeof first === "number" && typeof second === "number") return first - second;
  return String(first).localeCompare(String(second), "es", { sensitivity: "base", numeric: true });
}

export function DataTable<T>({
  title, subtitle, data, columns, rowKey,
  pageSizeOptions = [10, 25, 50, 100], initialPageSize = 10, initialSortIndex = null,
  recordsLabel = UI_TEXT.table.pagination.defaultRecords, emptyMessage = UI_TEXT.table.emptyStates.default, containerClassName = "", mobileRow, showMobileSort = false, rowClassName,
}: DataTableProps<T>) {
  const availablePageSizes = pageSizeOptions.length > 0 ? pageSizeOptions : [10, 25, 50, 100];
  const defaultPageSize = availablePageSizes.includes(initialPageSize) ? initialPageSize : availablePageSizes[0];
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortIndex, setSortIndex] = useState<number | null>(initialSortIndex);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [expandedKey, setExpandedKey] = useState<string | number | null>(null);
  const sortedData = sortIndex === null ? data : [...data].sort((first, second) => {
    const firstValue = columns[sortIndex].sortValue?.(first);
    const secondValue = columns[sortIndex].sortValue?.(second);
    const comparison = compareValues(firstValue, secondValue);
    // Los registros sin dato van siempre al final, sea cual sea la dirección del orden.
    if (firstValue == null || secondValue == null) return comparison;
    return sortDirection === "asc" ? comparison : -comparison;
  });
  const pageCount = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const firstRecord = sortedData.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastRecord = Math.min(safePage * pageSize, sortedData.length);
  const visibleData = sortedData.slice((safePage - 1) * pageSize, safePage * pageSize);
  const changeSort = (index: number) => {
    if (!columns[index].sortValue) return;
    setSortDirection((direction) => sortIndex === index ? (direction === "asc" ? "desc" : "asc") : (columns[index].firstSortDirection ?? "asc"));
    setSortIndex(index);
    setCurrentPage(1);
    setExpandedKey(null);
  };
  const toggleSortDirection = () => {
    setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
    setCurrentPage(1);
    setExpandedKey(null);
  };
  const sortableColumns = columns.map((column, index) => ({ column, index })).filter(({ column }) => column.sortValue);
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, pageCount)));
    setExpandedKey(null);
  };

  return (
    <section className={`${UI_STYLES.table.container} ${containerClassName}`}>
      {(title || subtitle) && <header className="border-b border-slate-200 bg-slate-100/80 px-5 py-4">
        {title && <h2 className="text-lg font-bold tracking-tight text-slate-900">{title}</h2>}
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </header>}
      <div className={`${mobileRow ? "hidden md:block" : "block"} overflow-x-auto`}>
        <table className="w-full border-collapse text-left">
          <thead className={UI_STYLES.table.thead}>
            <tr className="border-b border-slate-200 text-sm text-slate-600">
              {columns.map((column, index) => (
                <th key={column.header} className={`p-4 ${column.headerClassName ?? ""}`}>
                  {column.sortValue ? <button type="button" onClick={() => changeSort(index)} className="inline-flex cursor-pointer items-center gap-2 transition-colors hover:text-slate-900" title={UI_TEXT.table.sorting.byColumn(column.sortLabel ?? column.header)}>
                    {column.header}{sortIndex === index && (sortDirection === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                  </button> : column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {visibleData.map((item) => (
              <tr key={rowKey(item)} className={`transition-colors ${rowClassName?.(item) ?? "hover:bg-slate-50"}`}>
                {columns.map((column) => <td key={column.header} className={`p-4 ${column.cellClassName ?? ""}`}>{column.render(item)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {mobileRow && showMobileSort && sortableColumns.length > 0 && <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 md:hidden">
        <label htmlFor={`${title ?? "data-table"}-mobile-sort`} className="sr-only">{UI_TEXT.table.sorting.sortBy}</label>
        <select id={`${title ?? "data-table"}-mobile-sort`} value={sortIndex ?? ""} onChange={(event) => { if (event.target.value !== "") changeSort(Number(event.target.value)); }} className="min-w-0 flex-1 cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
          {sortIndex === null && <option value="" disabled>{UI_TEXT.table.sorting.sortBy}…</option>}
          {sortableColumns.map(({ column, index }) => <option key={column.header} value={index}>{UI_TEXT.table.sorting.sortBy}: {(column.sortLabel ?? column.header).toLowerCase()}</option>)}
        </select>
        <button type="button" onClick={toggleSortDirection} disabled={sortIndex === null} className="cursor-pointer rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40" aria-label={UI_TEXT.table.sorting.reverse} title={UI_TEXT.table.sorting.reverse}>
          {sortDirection === "asc" ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
        </button>
      </div>}
      {mobileRow && <div className="divide-y divide-slate-100 px-4 md:hidden">{visibleData.map((item) => {
        const key = rowKey(item);
        const expanded = expandedKey === key;
        return <div key={key} className={rowClassName?.(item)}>{mobileRow(item, expanded, () => setExpandedKey(expanded ? null : key))}</div>;
      })}</div>}
      {data.length === 0 && <p className="border-t border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">{emptyMessage}</p>}
      <div className={UI_STYLES.table.footer}>
        <span className="whitespace-nowrap">{firstRecord}-{lastRecord} {UI_TEXT.table.pagination.pageOf} {data.length}<span className="hidden sm:inline"> {recordsLabel}</span></span>
        <div className="flex items-center gap-2 sm:gap-3">
          <label className="flex items-center gap-2" htmlFor={`${title ?? "data-table"}-page-size`}>{UI_TEXT.table.pagination.pageSize}
            <select id={`${title ?? "data-table"}-page-size`} value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setCurrentPage(1); setExpandedKey(null); }} className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
              {availablePageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => goToPage(safePage - 1)} disabled={safePage === 1} className="cursor-pointer rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40" aria-label={UI_TEXT.table.pagination.previousPage} title={UI_TEXT.table.pagination.previousPage}><ChevronLeft size={16} /></button>
          <span className="whitespace-nowrap"><span className="hidden sm:inline">{UI_TEXT.table.pagination.page} </span>{safePage} <span className="hidden sm:inline">{UI_TEXT.table.pagination.pageOf} </span><span className="sm:hidden">{UI_TEXT.table.pagination.mobilePageSeparator} </span>{pageCount}</span>
          <button type="button" onClick={() => goToPage(safePage + 1)} disabled={safePage === pageCount} className="cursor-pointer rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40" aria-label={UI_TEXT.table.pagination.nextPage} title={UI_TEXT.table.pagination.nextPage}><ChevronRight size={16} /></button>
        </div>
      </div>
    </section>
  );
}
