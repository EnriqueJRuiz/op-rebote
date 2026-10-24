"use client";

import { useEffect } from "react";

export function OrientationLock() {
  useEffect(() => {
    const lockOrientation = async () => {
      if (window.matchMedia("(max-width: 767px)").matches) {
        try {
          await screen.orientation.lock("portrait");
        } catch {
          // El navegador puede impedir el bloqueo.
        }
      }
    };

    void lockOrientation();
  }, []);

  return null;
}