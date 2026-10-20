"use client";

import { useEffect, useState } from "react";

/** Keep open activity lists current across a start time or midnight boundary. */
export function useScheduleClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  return now;
}
