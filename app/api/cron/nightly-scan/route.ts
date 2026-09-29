import { NextResponse } from 'next/server';
import { handleSyncMarketAction } from '@/app/actions/sync-market';
import { handleSearchReboundsAction } from '@/app/actions/search-rebounds';

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

    console.log("Tarea nocturna completada con éxito.");

    return NextResponse.json({ 
      success: true, 
      sync: syncResult, 
      scan: scanResult,
      timestamp: new Date().toISOString() 
    });

  } catch (error: any) {
    console.error("Error en la ejecución del cron nocturno:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}