/** Duración del timbre + salida (ver --animate-sello y --animate-boleto-sale en index.css). */
export const DURACION_TIMBRE_MS = 560;

export const sinMovimiento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Espera a que termine la animación de timbrado (nada si se pidió reducir movimiento). */
export function esperarTimbre(ms = DURACION_TIMBRE_MS) {
  return sinMovimiento() ? Promise.resolve() : new Promise((r) => setTimeout(r, ms));
}

/**
 * Timbre que cae sobre un boleto. El contenedor debe ser `relative`.
 * Es decorativo: el cambio se anuncia con un aviso.
 */
export function Sello({ texto }: { texto: string }) {
  return (
    <span
      aria-hidden
      className="animate-sello pointer-events-none absolute top-1/2 left-1/2 z-10 rounded-xl border-4 border-acento bg-superficie/85 px-5 py-1 font-display text-5xl font-semibold whitespace-nowrap text-acento uppercase"
    >
      {texto}
    </span>
  );
}
