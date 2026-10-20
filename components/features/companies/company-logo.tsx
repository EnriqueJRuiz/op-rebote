import { useState } from "react";
import { Building2 } from "lucide-react";

interface CompanyLogoProps {
  name: string;
  website?: string | null;
  ticker?: string;
  size?: number;
}

/**
 * Usa el favicon del sitio oficial de la empresa como logotipo.
 * No descarga ni almacena imágenes en Supabase; el navegador las carga bajo demanda.
 */
export function CompanyLogo({
  name,
  website,
  ticker,
  size = 32,
}: CompanyLogoProps) {
  const [failed, setFailed] = useState(false);
  const normalizedWebsite = website?.trim()
    ? (/^https?:\/\//i.test(website.trim())
        ? website.trim()
        : `https://${website.trim()}`)
    : null;

  const logoUrl = normalizedWebsite
    ? `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(normalizedWebsite)}&sz=64`
    : null;

  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white"
      style={{ width: size, height: size }}
      title={name}
      aria-label={ticker ? `${name} (${ticker})` : name}
    >
      {logoUrl && !failed ? (
        <img
          src={logoUrl}
          alt=""
          width={size - 8}
          height={size - 8}
          loading="lazy"
          decoding="async"
          className="max-h-full max-w-full object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <Building2 size={Math.max(14, size * 0.55)} className="text-slate-400" aria-hidden="true" />
      )}
    </span>
  );
}
