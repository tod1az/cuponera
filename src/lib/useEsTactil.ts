import { useSyncExternalStore } from "react";

const QUERY = "(pointer: coarse)";

function suscribir(cb: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

/** true en pantallas táctiles (mobile/tablet). */
export function useEsTactil(): boolean {
  return useSyncExternalStore(suscribir, () => window.matchMedia(QUERY).matches);
}
