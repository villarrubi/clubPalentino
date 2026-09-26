import { useEffect, useLayoutEffect, useState } from "react";

type Choice = "full" | "reduced" | null;

export function useMotionPreference() {
  const [choice, setChoice] = useState<Choice>(() => {
    try {
      const saved = localStorage.getItem("palentino-motion");
      return saved === "full" || saved === "reduced" ? saved : null;
    } catch {
      return null;
    }
  });
  const [systemReduced, setSystemReduced] = useState(
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReduced(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const enabled = choice ? choice === "full" : !systemReduced;
  useLayoutEffect(() => {
    document.documentElement.dataset.motion = enabled ? "full" : "reduced";
  }, [enabled]);
  const toggle = () => {
    const next = enabled ? "reduced" : "full";
    setChoice(next);
    try {
      localStorage.setItem("palentino-motion", next);
    } catch {
      /* Works for this visit when storage is unavailable. */
    }
  };
  return { enabled, toggle };
}
