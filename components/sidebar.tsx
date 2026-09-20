'use client';

import { Building2, ChevronLeft, ChevronRight, Home, Target } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/oportunidades", label: "Oportunidades", icon: Target },
  { href: "/empresas-radar", label: "Empresas radar", icon: Building2 },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`${collapsed ? "w-16" : "w-64"} flex min-h-screen shrink-0 flex-col border-r border-gray-800 bg-gray-900 p-3 transition-[width] duration-200`}
    >
      <div className="mb-8 flex items-center justify-between gap-2 px-2 py-2">
        {!collapsed && <span className="font-semibold tracking-wide text-white">Op Rebote</span>}
        <button
          type="button"
          onClick={() => setCollapsed((current) => !current)}
          className="rounded p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
          aria-label={collapsed ? "Expandir navegación" : "Encoger navegación"}
          title={collapsed ? "Expandir navegación" : "Encoger navegación"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="space-y-2" aria-label="Navegación principal">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-blue-950/60 text-blue-300"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} aria-hidden="true" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}