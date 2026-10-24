
"use client";

import { useEffect } from "react";

type OrientationLock = ScreenOrientation & {
  lock: (orientation: "portrait") => Promise<void>;
};

export function OrientationLock() {
  useEffect(() => {
    const lockOrientation = async () => {
      if (
        window.matchMedia("(max-width: 767px)").matches &&
        "orientation" in screen
      ) {
        try {
          await (screen.orientation as OrientationLock).lock("portrait");
        } catch {
          // Chrome puede exigir pantalla completa para bloquear la orientación.
        }
      }
    };

    void lockOrientation();
  }, []);

  return null;
}