"use client";

import { useEffect, useState } from "react";

export function OrientationLock() {
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Detectar si está en horizontal en pantallas de móvil
      const isLandscapeMode = window.matchMedia("(max-width: 767px) and (orientation: landscape)").matches;
      setIsLandscape(isLandscapeMode);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // Si está en horizontal, aplicamos el truco de rotación forzada al body o contenedor global
  useEffect(() => {
    const rootElement = document.getElementById("root") || document.body;
    
    if (isLandscape) {
      rootElement.style.transform = "rotate(-90deg)";
      rootElement.style.transformOrigin = "left top";
      rootElement.style.width = "100vh";
      rootElement.style.height = "100vw";
      rootElement.style.position = "absolute";
      rootElement.style.top = "100%";
      rootElement.style.left = "0";
      rootElement.style.overflowX = "auto";
    } else {
      rootElement.style.transform = "none";
      rootElement.style.width = "100%";
      rootElement.style.height = "100%";
      rootElement.style.position = "static";
    }
  }, [isLandscape]);

  return null;
}