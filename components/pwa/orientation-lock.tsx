"use client";

import { useEffect } from "react";

export function OrientationLock() {
  useEffect(() => {
    const handleOrientation = () => {
      // Detectamos si el dispositivo está en horizontal (landscape)
      const isLandscape = window.matchMedia("(orientation: landscape)").matches;
      
      // Apuntamos directamente a la etiqueta <html> para rotar toda la ventana
      const rootElement = document.documentElement;

      if (isLandscape && window.innerWidth <= 900) {
        // Forzamos la rotación inversa para que el contenido se quede en vertical (de lado)
        rootElement.style.transform = "rotate(-90deg)";
        rootElement.style.transformOrigin = "left top";
        rootElement.style.width = "100vh";
        rootElement.style.height = "100vw";
        rootElement.style.position = "fixed";
        rootElement.style.top = "100%";
        rootElement.style.left = "0";
        rootElement.style.overflowX = "auto";
        rootElement.style.zIndex = "99999";
      } else {
        // Restauramos los valores normales cuando se pone en vertical
        rootElement.style.transform = "none";
        rootElement.style.transformOrigin = "initial";
        rootElement.style.width = "100%";
        rootElement.style.height = "100%";
        rootElement.style.position = "static";
        rootElement.style.top = "initial";
        rootElement.style.left = "initial";
        rootElement.style.overflowX = "initial";
        rootElement.style.zIndex = "initial";
      }
    };

    // Comprobar al cargar
    handleOrientation();

    // Escuchar cambios de tamaño y rotación
    window.addEventListener("resize", handleOrientation);
    window.addEventListener("orientationchange", handleOrientation);

    return () => {
      window.removeEventListener("resize", handleOrientation);
      window.removeEventListener("orientationchange", handleOrientation);
    };
  }, []);

  return null;
}