import { NextResponse } from 'next/server';
import { handleSyncMarketAction } from '@/app/actions/sync-market';
import { handleSearchReboundsAction } from '@/app/actions/search-rebounds';

export const maxDuration = 300;

export async function GET(request: Request) {
  try {
    // Verificación de seguridad mediante token secreto
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("Iniciando tarea automática nocturna del mercado...");

    // 1. Ejecuta la sincronización (equivalente al primer botón)
    const syncResult = await handleSyncMarketAction();
    
    // 2. Ejecuta el análisis de rebotes y guardado (equivalente al segundo botón)
    const scanResult = await handleSearchReboundsAction();

    if (!scanResult.success) {
      console.error("El escaneo terminó con error:", scanResult.message);
      return NextResponse.json(
        { success: false, error: "El escaneo ha fallado", timestamp: new Date().toISOString() },
        { status: 500 }
      );
    }

    if (!syncResult.success) {
      console.warn(
        "El escaneo se completó, pero falló la sincronización del universo:",
        syncResult.message
      );
      return NextResponse.json(
        {
          success: false,
          partial: true,
          sync: syncResult,
          scan: scanResult,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }

    console.log("Tarea nocturna completada con éxito.");

    return NextResponse.json({ 
      success: true, 
      sync: syncResult, 
      scan: scanResult,
      timestamp: new Date().toISOString() 
    });

  } catch (error: unknown) {
    console.error("Error en la ejecución del cron nocturno:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error inesperado",
      },
      { status: 500 }
    );
  }
}