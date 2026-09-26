'use client';

import { Building2, ChartNoAxesCombined, ChevronLeft, ChevronRight, Home, Target } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { APP_ROUTES } from "@/domain/constants";
import { UI_TEXT } from "@/domain/literales.constantes";

const NAVIGATION_LINKS = [
  { href: APP_ROUTES.HOME, label: UI_TEXT.navigation.home, icon: Home },
  { href: APP_ROUTES.OPORTUNIDADES, label: UI_TEXT.navigation.opportunities, icon: Target },
  { href: APP_ROUTES.EMPRESAS_RADAR, label: UI_TEXT.navigation.companies, icon: Building2 },
] as const;

const STYLES = {
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
} as const;

interface NavigationProps {
  pathname: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobileNavigation = () => setMobileOpen(false);

  return (
    <>
      <div className={`${STYLES.mobileTrigger} transition-opacity duration-200 ${mobileOpen ? "pointer-events-none opacity-0" : "opacity-100 delay-200"}`}>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="group flex h-full w-full cursor-pointer items-center justify-center"
          aria-label={UI_TEXT.navigation.open}
          title={UI_TEXT.navigation.open}
        >
          <span className="rounded-md p-1 transition-colors duration-200 group-hover:bg-blue-50 group-hover:text-blue-700">
            <ChevronRight size={16} />
          </span>
        </button>
      </div>

      {mobileOpen && (
        <button
          type="button"
          onClick={closeMobileNavigation}
          className={STYLES.mobileBackdrop}
          aria-label={UI_TEXT.navigation.close}
        />
      )}

      <aside className={`${STYLES.mobilePanel} ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarHeader onClose={closeMobileNavigation} />
        <Navigation pathname={pathname} onNavigate={closeMobileNavigation} />
      </aside>

      <div className="relative hidden min-h-screen self-stretch md:block">
        <aside className={`${STYLES.desktopPanel} h-full ${collapsed ? "w-20" : "w-45"}`}>
          <div className={STYLES.header}>
            <span className={`flex min-w-0 items-center gap-2 transition-transform duration-300 ease-out ${collapsed ? "translate-x-[5px]" : "translate-x-0"}`}>
              <ChartNoAxesCombined size={18} className="shrink-0 text-slate-800" aria-hidden="true" />
              <span className={`${STYLES.brand} overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ${collapsed ? "max-w-0 opacity-0" : "max-w-32 opacity-100"}`}>
                {UI_TEXT.brand}
              </span>
            </span>
          </div>

          <div className="flex-1">
            <Navigation pathname={pathname} collapsed={collapsed} />
          </div>
        </aside>

        <button
          type="button"
          onClick={() => setCollapsed((isCollapsed) => !isCollapsed)}
          aria-label={collapsed ? UI_TEXT.navigation.expand : UI_TEXT.navigation.collapse}
          title={collapsed ? UI_TEXT.navigation.expand : UI_TEXT.navigation.collapse}
          className={`group absolute -right-8.5 top-5 z-20 flex h-11 w-9 cursor-pointer items-center justify-center border-y border-r border-slate-200 border-l-0 bg-white text-slate-600 shadow-none ${collapsed ? "translate-x-[-3px] scale-[0.97]" : "translate-x-0 scale-100"} rounded-l-none rounded-r-md`}
        >
          <span className="rounded-md p-1 transition-colors duration-200 group-hover:bg-blue-50 group-hover:text-blue-700">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </span>
        </button>
      </div>
    </>
  );
}

function SidebarHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className={STYLES.header}>
      <span className="flex items-center gap-2">
        <ChartNoAxesCombined size={18} className="shrink-0 text-slate-800" aria-hidden="true" />
        <span className={STYLES.brand}>{UI_TEXT.brand}</span>
      </span>
      <button
        type="button"
        onClick={onClose}
        className="group absolute -right-8.5 top-5 z-20 flex h-11 w-9 cursor-pointer items-center justify-center rounded-l-none rounded-r-md border-y border-r border-slate-200 border-l-0 bg-white text-slate-600 shadow-none"
        aria-label={UI_TEXT.navigation.close}
        title={UI_TEXT.navigation.close}
      >
        <span className="rounded-md p-1 transition-colors duration-200 group-hover:bg-blue-50 group-hover:text-blue-700">
          <ChevronLeft size={16} />
        </span>
      </button>
    </div>
  );
}

function Navigation({ pathname, collapsed = false, onNavigate }: NavigationProps) {
  return (
    <nav className={STYLES.navigation} aria-label={UI_TEXT.navigation.main}>
      {NAVIGATION_LINKS.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        const linkClassName = `${STYLES.link} ${isActive ? STYLES.activeLink : STYLES.inactiveLink}`;

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={linkClassName}
            title={collapsed ? label : undefined}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              <Icon size={18} aria-hidden="true" />
            </span>
            <span className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ${collapsed ? "max-w-0 opacity-0" : "max-w-40 opacity-100"}`}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
