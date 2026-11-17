import { useSyncExternalStore } from "react";
import { cerrarAviso, obtenerAvisos, suscribir, type Aviso } from "../lib/avisos";
import { IconoCheck } from "./Iconos";

/**
 * Avisos con forma de talón de boleto: el ícono va en el talón, separado del
 * mensaje por una perforación. Arriba en mobile (lejos del botón de importar),
 * abajo al centro en desktop.
 */
export function Avisos() {
  const avisos = useSyncExternalStore(suscribir, obtenerAvisos);

  return (
    <section
      aria-label="Avisos"
      className="pointer-events-none fixed inset-x-0 top-[max(env(safe-area-inset-top),0.75rem)] z-50 flex flex-col items-center gap-2 px-3 sm:top-auto sm:bottom-6"
    >
      {avisos.map((a) => (
        <TalonAviso key={a.id} aviso={a} />
      ))}
    </section>
  );
}

function TalonAviso({ aviso }: { aviso: Aviso }) {
  const error = aviso.tono === "error";
  return (
    <div
      role={error ? "alert" : "status"}
      className={`letrero pointer-events-auto flex w-full max-w-sm items-stretch overflow-hidden rounded-2xl border shadow-xl shadow-black/40 ${
        error ? "border-peligro/50" : "border-borde"
      } ${aviso.saliendo ? "animate-aviso-sale" : "animate-aviso-entra"}`}
    >
      <div
        className={`grid w-12 shrink-0 place-items-center border-r-2 border-dashed border-borde ${
          error ? "text-peligro" : "letrero-texto"
        }`}
        aria-hidden
      >
        {error ? <span className="font-display text-2xl font-semibold">!</span> : <IconoCheck />}
      </div>

      <div className="min-w-0 flex-1 px-3.5 py-3">
        <p className="leading-snug font-semibold">{aviso.texto}</p>
        {aviso.detalle && <p className="mt-0.5 text-sm text-tenue">{aviso.detalle}</p>}
      </div>

      {aviso.accion ? (
        <button
          onClick={() => {
            aviso.accion!.onClick();
            cerrarAviso(aviso.id);
          }}
          className="shrink-0 px-4 font-display text-lg font-semibold text-acento"
        >
          {aviso.accion.texto}
        </button>
      ) : (
        <button
          onClick={() => cerrarAviso(aviso.id)}
          aria-label="Cerrar aviso"
          className="shrink-0 px-3 text-xl leading-none text-tenue"
        >
          ×
        </button>
      )}
    </div>
  );
}
