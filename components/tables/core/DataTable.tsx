"use client";

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { ReactNode, useState } from "react";

export interface Column<T> {
  header: string;
  render: (item: T) => ReactNode;
  sortValue?: (item: T) => string | number | null | undefined;
  cellClassName?: string;
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
  recordsLabel = "registros", emptyMessage = "No hay registros para mostrar.", containerClassName = "", mobileRow,
}: DataTableProps<T>) {
  const availablePageSizes = pageSizeOptions.length > 0 ? pageSizeOptions : [10, 25, 50, 100];
  const defaultPageSize = availablePageSizes.includes(initialPageSize) ? initialPageSize : availablePageSizes[0];
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [sortIndex, setSortIndex] = useState<number | null>(initialSortIndex);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [expandedKey, setExpandedKey] = useState<string | number | null>(null);
  const sortedData = sortIndex === null ? data : [...data].sort((first, second) => {
    const comparison = compareValues(columns[sortIndex].sortValue?.(first), columns[sortIndex].sortValue?.(second));
    return sortDirection === "asc" ? comparison : -comparison;
  });
  const pageCount = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const firstRecord = sortedData.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const lastRecord = Math.min(safePage * pageSize, sortedData.length);
  const visibleData = sortedData.slice((safePage - 1) * pageSize, safePage * pageSize);

  const changeSort = (index: number) => {
    if (!columns[index].sortValue) return;
    setSortDirection((direction) => sortIndex === index ? (direction === "asc" ? "desc" : "asc") : "asc");
    setSortIndex(index);
    setCurrentPage(1);
    setExpandedKey(null);
  };
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, pageCount)));
    setExpandedKey(null);
  };

  return (
    <section className={`text-white ${containerClassName}`}>
      {title && <h2 className="mb-2 text-2xl font-bold">{title}</h2>}
      {subtitle && <p className="mb-6 text-gray-400">{subtitle}</p>}
      <div className={`${mobileRow ? "hidden md:block" : "block"} overflow-x-auto rounded-lg border border-gray-800 bg-gray-900 shadow-lg`}>
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900/50 text-sm text-gray-400">
              {columns.map((column, index) => (
                <th key={column.header} className="p-4">
                  {column.sortValue ? <button type="button" onClick={() => changeSort(index)} className="inline-flex items-center gap-2 hover:text-white" title={`Ordenar por ${column.header.toLowerCase()}`}>
                    {column.header}{sortIndex === index && (sortDirection === "asc" ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                  </button> : column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 text-sm">
            {visibleData.map((item) => (
              <tr key={rowKey(item)} className="hover:bg-gray-850">
                {columns.map((column) => <td key={column.header} className={`p-4 ${column.cellClassName ?? ""}`}>{column.render(item)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {mobileRow && <div className="space-y-2 md:hidden">{visibleData.map((item) => {
        const key = rowKey(item);
        const expanded = expandedKey === key;
        return <div key={key}>{mobileRow(item, expanded, () => setExpandedKey(expanded ? null : key))}</div>;
      })}</div>}
      {data.length === 0 && <p className="rounded-lg border border-dashed border-gray-700 px-4 py-8 text-center text-sm text-gray-500">{emptyMessage}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-400">
        <span>{firstRecord}-{lastRecord} de {data.length} {recordsLabel}</span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2" htmlFor={`${title ?? "data-table"}-page-size`}>Ver
            <select id={`${title ?? "data-table"}-page-size`} value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setCurrentPage(1); setExpandedKey(null); }} className="rounded border border-gray-700 bg-gray-900 px-2 py-1 text-gray-200">
              {availablePageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => goToPage(safePage - 1)} disabled={safePage === 1} className="rounded border border-gray-700 p-2 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Página anterior" title="Página anterior"><ChevronLeft size={16} /></button>
          <span>Página {safePage} de {pageCount}</span>
          <button type="button" onClick={() => goToPage(safePage + 1)} disabled={safePage === pageCount} className="rounded border border-gray-700 p-2 hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Página siguiente" title="Página siguiente"><ChevronRight size={16} /></button>
        </div>
      </div>
    </section>
  );
}
