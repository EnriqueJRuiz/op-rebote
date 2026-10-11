"use client";

import { memo, useEffect, useRef } from "react";
import { toTradingViewSymbol } from "./tradingview-symbol";

// Widget público "Advanced Real-Time Chart" de TradingView (iframe alojado por TradingView, con sus propios datos).
const WIDGET_SCRIPT_SRC = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";

type TradingViewStudy = string | { id: string; inputs?: Record<string, string | number | boolean> };

// EMA 20 y EMA 50 sobre el indicador público "Moving Average Exponential".
// El volumen no se añade como estudio: el widget lo muestra por defecto (hide_volume no está activado).
const EMA_STUDIES: TradingViewStudy[] = [
  { id: "MAExp@tv-basicstudies", inputs: { length: 20 } },
  { id: "MAExp@tv-basicstudies", inputs: { length: 50 } },
];

// Máximos/mínimos de sesión actual, sesión anterior y 5 días: ver nota de entrega.
// No se ha podido verificar ningún indicador público compatible con el widget gratuito que los dibuje,
// así que no se inventan ids: cuando se confirme uno, se añade aquí y se carga junto a las EMA.
const LEVEL_STUDIES: TradingViewStudy[] = [];

interface TradingViewChartProps {
  ticker: string;
  className?: string;
}

function TradingViewChartComponent({ ticker, className }: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const symbol = toTradingViewSymbol(ticker);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement("script");
    script.src = WIDGET_SCRIPT_SRC;
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval: "30",
      range: "5D",
      timezone: "Europe/Madrid",
      locale: "es",
      theme: "light",
      style: "1", // velas japonesas
      backgroundColor: "rgba(255, 255, 255, 1)",
      gridColor: "rgba(240, 243, 250, 0.9)",
      studies: [...EMA_STUDIES, ...LEVEL_STUDIES],
      // Modo solo consulta
      hide_top_toolbar: true, // sin botón de indicadores ni cambio de tipo de gráfico
      hide_side_toolbar: true, // sin herramientas de dibujo
      allow_symbol_change: false,
      save_image: false,
      show_popup_button: false,
      withdateranges: true,
      details: false,
      hotlist: false,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });
    container.appendChild(script);

    return () => {
      script.remove();
      container.querySelector(".tradingview-widget-container__widget")?.replaceChildren();
    };
  }, [symbol]);

  return (
    <div className={`relative ${className ?? ""}`}>
      <div ref={containerRef} className="tradingview-widget-container h-full w-full">
        <div className="tradingview-widget-container__widget h-[calc(100%-32px)] w-full" />
        <div className="tradingview-widget-copyright h-8 text-[11px] leading-8 text-slate-500">
          <a
            href={`https://www.tradingview.com/symbols/${symbol.replace(":", "-")}/`}
            rel="noopener nofollow"
            target="_blank"
            className="text-sky-600"
          >
            {symbol}
          </a>
          <span> · gráfico de TradingView</span>
        </div>
      </div>
      {/* Capa transparente sobre la leyenda del widget: impide abrir los ajustes o quitar los indicadores. */}
      <div aria-hidden="true" className="absolute left-0 top-0 z-10 h-28 w-[min(100%,22rem)]" />
    </div>
  );
}

export const TradingViewChart = memo(TradingViewChartComponent);
