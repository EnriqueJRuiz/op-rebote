/**
 * Shared UI class patterns.
 *
 * Keep reusable Tailwind class groups here so components don't repeat long
 * className strings. This file is for visual composition only; domain
 * constants and UI text stay in domain/.
 */
export const UI_STYLES = {
  button: {
    primary: "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 shadow-sm transition-all hover:border-teal-400 hover:bg-teal-600 hover:text-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50",
    primaryFull: "inline-flex w-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-700 shadow-sm transition-all hover:border-teal-400 hover:bg-teal-600 hover:text-white hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50",
    icon: "cursor-pointer rounded-lg border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40",
  },

  table: {
    container: "overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",
    header: "border-b border-slate-200 bg-slate-100/80 px-5 py-4",
    title: "text-lg font-bold tracking-tight text-slate-900",
    subtitle: "mt-1 text-sm text-slate-500",
    table: "w-full border-collapse text-left",
    thead: "bg-slate-50",
    headerRow: "border-b border-slate-200 text-sm text-slate-600",
    th: "p-4",
    sortableHeader: "inline-flex cursor-pointer items-center gap-2 transition-colors hover:text-slate-900",
    tbody: "divide-y divide-slate-100 text-sm",
    row: "transition-colors hover:bg-slate-50",
    td: "p-4",
    emptyState: "border-t border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500",
    footer: "flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-100/80 px-4 py-3 text-sm text-slate-500 sm:px-5 sm:py-4",
    footerControls: "flex items-center gap-2 sm:gap-3",
    pageSizeLabel: "flex items-center gap-2",
    pageSizeSelect: "cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1 text-slate-700 shadow-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
    pageNumber: "whitespace-nowrap",
    mobileList: "divide-y divide-slate-100 px-4 md:hidden",
    mobileRow: "overflow-hidden last:border-b-0",
    mobileRowButton: "flex w-full cursor-pointer items-center justify-between gap-3 py-4 text-left transition-colors hover:bg-slate-50",
    mobileRowTitle: "truncate font-semibold text-slate-800",
    mobileRowIcon: "shrink-0 text-slate-500 transition-transform",
    mobileDetails: "grid grid-cols-2 gap-3 border-t border-slate-200 bg-slate-50/70 px-4 py-4 text-sm",
    mobileLabel: "text-slate-500",
    mobileValue: "text-slate-700",
  },

  filter: {
    select: "h-10 w-full appearance-none rounded-md border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm text-slate-700 shadow-sm outline-none transition-colors hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
    input: "w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100",
    icon: "pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400",
  },

  badge: {
    ticker: "inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-semibold text-indigo-700",
    tickerLarge: "inline-flex rounded-lg bg-indigo-50 px-2 py-1 font-mono text-xs font-bold text-indigo-700",
    success: "text-emerald-700",
    warning: "text-amber-600",
    danger: "text-rose-700",
    muted: "text-slate-400",
  },

  text: {
    primary: "text-slate-900",
    secondary: "text-slate-600",
    muted: "text-slate-500",
    disabled: "text-slate-400",
  },

  ticket: {
    cell: "rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
    header: "flex items-center justify-between gap-3 border-b border-slate-200 pb-3",
    title: "font-semibold text-slate-800",
    label: "text-xs font-medium uppercase tracking-wide text-slate-500",
    value: "text-sm text-slate-700",
    body: "space-y-3 pt-3",
    footer: "mt-4 border-t border-slate-200 pt-3 text-sm text-slate-500",
  },

  sidebar: {
    mobileTrigger: "fixed left-0 top-5 z-40 flex h-11 w-9 items-center justify-center rounded-r-md border-y border-r border-slate-200 bg-white text-slate-600 shadow-none md:hidden",
    mobileBackdrop: "fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-[1px] md:hidden",
    mobilePanel: "fixed left-0 top-0 z-30 flex h-full w-72 flex-col overflow-visible border-r border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80 transition-transform duration-200 md:hidden",
    desktopPanel: "relative hidden min-h-screen shrink-0 flex-col overflow-visible border-r border-slate-200 bg-white p-3 shadow-sm shadow-slate-200/80 transition-[width] duration-300 ease-out md:flex",
    header: "mb-8 flex items-center justify-between gap-2 border-b border-slate-200/80 px-2 py-2 pb-4",
    brand: "font-semibold tracking-wide text-slate-800",
    navigation: "space-y-2",
    link: "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200",
    activeLink: "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100",
    inactiveLink: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  },
} as const;
