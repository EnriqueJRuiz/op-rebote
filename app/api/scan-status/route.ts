import { NextResponse } from "next/server";
import { createApplicationDependencies } from "@/infrastructure/composition";

// Endpoint ligero para que la pantalla compruebe si el escaneo ha escrito datos nuevos.
// Queda protegido por el login de proxy.ts (solo /api/cron está exento).
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { scanHistoryRepository } = createApplicationDependencies();
    const status = await scanHistoryRepository.getLatestScanStatus();

    return NextResponse.json(
      { scannedAt: status?.scannedAt ?? null },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.warn("No se pudo consultar el estado del escaneo:", error);
    return NextResponse.json({ scannedAt: null }, { status: 500 });
  }
}
