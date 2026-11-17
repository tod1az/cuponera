/**
 * Avisos efímeros (toasts) sin dependencias. `aviso()` se puede llamar desde
 * cualquier parte; <Avisos /> los muestra.
 */

export type Aviso = {
  id: number;
  texto: string;
  detalle?: string;
  tono: "ok" | "error";
  accion?: { texto: string; onClick: () => void };
  saliendo?: boolean;
};

type NuevoAviso = Omit<Aviso, "id" | "tono" | "saliendo"> & { tono?: Aviso["tono"] };

const DURACION_MS = 4500;
const SALIDA_MS = 200;
const MAXIMO = 3;

let avisos: Aviso[] = [];
let siguienteId = 1;
const oyentes = new Set<() => void>();

function emitir(nuevos: Aviso[]) {
  avisos = nuevos;
  oyentes.forEach((o) => o());
}

export function suscribir(oyente: () => void) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

export const obtenerAvisos = () => avisos;

export function cerrarAviso(id: number) {
  if (!avisos.some((a) => a.id === id && !a.saliendo)) return;
  emitir(avisos.map((a) => (a.id === id ? { ...a, saliendo: true } : a)));
  setTimeout(() => emitir(avisos.filter((a) => a.id !== id)), SALIDA_MS);
}

export function aviso(nuevo: NuevoAviso) {
  const id = siguienteId++;
  const completo: Aviso = { ...nuevo, tono: nuevo.tono ?? "ok", id };
  emitir([...avisos, completo].slice(-MAXIMO));
  setTimeout(() => cerrarAviso(id), nuevo.accion ? DURACION_MS + 2000 : DURACION_MS);
  return id;
}

aviso.error = (texto: string, detalle?: string) => aviso({ texto, detalle, tono: "error" });
