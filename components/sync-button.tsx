// components/sync-button.tsx
"use client"; // <-- ¡Esta línea debe estar obligatoriamente en la parte más alta del archivo!

import { useState } from "react";
import { handleSyncMarketAction } from "@/app/actions/sync-market";
import { useRouter } from "next/navigation";

export function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const handleClick = async () => {
  setLoading(true);
  setMessage(null);
  try {
    const result = await handleSyncMarketAction();
    setMessage(result.message);
    
    if (result.success) {
      router.refresh(); // 2. Refresca los datos y la vista de la tabla automáticamente
    }
  } catch (error) {
    setMessage("Error al sincronizar con el mercado.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="mb-6 flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded transition-colors w-fit"
      >
        {loading ? "Buscando en Yahoo y guardando..." : "Sincronizar Universo en Supabase"}
      </button>
      {message && <p className="text-sm text-gray-300">{message}</p>}
    </div>
  );
}