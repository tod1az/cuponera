import type { FunctionReturnType } from "convex/server";
import { ConvexError } from "convex/values";
import type { api } from "../../convex/_generated/api";

export type Cuponera = FunctionReturnType<typeof api.pasajes.listar>[number];
export type Pasaje = Cuponera["pasajes"][number];
export type Secreto = { codigo: string; clave: string };

export type Tramo = {
  clave: string;
  origen: string;
  destino: string;
  disponibles: Array<Pasaje & { cuponera: Cuponera }>;
  total: number;
};

/**
 * Agrupa los pasajes por tramo (origen → destino). Los disponibles quedan
 * ordenados para usar primero los de la cuponera más antigua.
 */
export function agruparPorTramo(cuponeras: Cuponera[]): Tramo[] {
  const tramos = new Map<string, Tramo>();
  for (const c of cuponeras) {
    for (const p of c.pasajes) {
      const clave = `${p.origen}→${p.destino}`;
      let t = tramos.get(clave);
      if (!t) {
        t = { clave, origen: p.origen, destino: p.destino, disponibles: [], total: 0 };
        tramos.set(clave, t);
      }
      t.total++;
      if (p.usadoEn === null) t.disponibles.push({ ...p, cuponera: c });
    }
  }
  for (const t of tramos.values()) {
    t.disponibles.sort(
      (a, b) => a.cuponera.creadaEn - b.cuponera.creadaEn || a.indice - b.indice,
    );
  }
  return [...tramos.values()];
}

const fmtFecha = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short", year: "numeric" });
const fmtFechaHora = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const fmtClp = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" });

export const fecha = (ms: number) => fmtFecha.format(ms);
export const fechaHora = (ms: number) => fmtFechaHora.format(ms);
export const clp = (n: number) => fmtClp.format(n);

export function mensajeError(e: unknown): string {
  if (e instanceof ConvexError && typeof e.data === "string") return e.data;
  if (e instanceof Error && e.name === "ErrorParseo") return e.message;
  return "Ocurrió un error inesperado. Intenta de nuevo.";
}
