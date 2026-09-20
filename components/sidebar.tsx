'use client';

import { Building2, ChevronLeft, ChevronRight, Home, Menu, Target, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { APP_ROUTES } from "@/domain/constants";

const NAVIGATION_LINKS = [
  { href: APP_ROUTES.HOME, label: "Inicio", icon: Home },
  { href: APP_ROUTES.OPORTUNIDADES, label: "Oportunidades", icon: Target },
  { href: APP_ROUTES.EMPRESAS_RADAR, label: "Empresas radar", icon: Building2 },
] as const;

const STYLES = {
  mobileTrigger: "fixed left-0 top-0 z-40 flex h-14 w-14 items-center justify-center border-b border-r border-gray-800 bg-gray-900 md:hidden",
  iconButton: "rounded p-2 text-gray-300 hover:bg-gray-800 hover:text-white",
  mobileBackdrop: "fixed inset-0 z-30 bg-black/70 md:hidden",
  mobilePanel: "fixed left-0 top-0 z-30 flex h-full w-72 flex-col border-r border-gray-800 bg-gray-900 p-4 shadow-2xl transition-transform duration-200 md:hidden",
  desktopPanel: "hidden min-h-screen shrink-0 flex-col border-r border-gray-800 bg-gray-900 p-3 transition-[width] duration-200 md:flex",
  header: "mb-8 flex items-center justify-between gap-2 px-2 py-2",
  brand: "font-semibold tracking-wide text-white",
  navigation: "space-y-2",
  link: "flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors",
  activeLink: "bg-blue-950/60 text-blue-300",
  inactiveLink: "text-gray-400 hover:bg-gray-800 hover:text-white",
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
      <div className={`${STYLES.mobileTrigger} ${mobileOpen ? "hidden" : ""}`}>
        <button
          type="button"
          onClick={() => setMobileOpen((isOpen) => !isOpen)}
          className={STYLES.iconButton}
          aria-label={mobileOpen ? "Cerrar navegación" : "Abrir navegación"}
          title={mobileOpen ? "Cerrar navegación" : "Abrir navegación"}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <button
          type="button"
          onClick={closeMobileNavigation}
          className={STYLES.mobileBackdrop}
          aria-label="Cerrar navegación"
        />
      )}

      <aside className={`${STYLES.mobilePanel} ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarHeader onClose={closeMobileNavigation} />
        <Navigation pathname={pathname} onNavigate={closeMobileNavigation} />
      </aside>

      <aside className={`${STYLES.desktopPanel} ${collapsed ? "w-16" : "w-64"}`}>
        <div className={STYLES.header}>
          {!collapsed && <span className={STYLES.brand}>Op Rebote</span>}
          <button
            type="button"
            onClick={() => setCollapsed((isCollapsed) => !isCollapsed)}
            className={STYLES.iconButton}
            aria-label={collapsed ? "Expandir navegación" : "Encoger navegación"}
            title={collapsed ? "Expandir navegación" : "Encoger navegación"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
        <Navigation pathname={pathname} collapsed={collapsed} />
      </aside>
    </>
  );
}

function SidebarHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className={STYLES.header}>
      <span className={STYLES.brand}>Op Rebote</span>
      <button
        type="button"
        onClick={onClose}
        className={STYLES.iconButton}
        aria-label="Cerrar navegación"
        title="Cerrar navegación"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function Navigation({ pathname, collapsed = false, onNavigate }: NavigationProps) {
  return (
    <nav className={STYLES.navigation} aria-label="Navegación principal">
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
            <Icon size={18} aria-hidden="true" />
            {!collapsed && <span>{label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
