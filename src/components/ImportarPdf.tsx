import { useAction } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import { clp, mensajeError } from "../lib/datos";
import { parsearTurbus, type CuponeraParseada } from "../lib/parseTurbus";
import { extraerTextoPdf } from "../lib/pdfTexto";
import { IconoFlecha, IconoMas } from "./Iconos";

/** Botón flotante + hoja inferior con la vista previa antes de guardar. */
export function ImportarPdf() {
  const importar = useAction(api.secretos.importar);
  const input = useRef<HTMLInputElement>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [previa, setPrevia] = useState<CuponeraParseada | null>(null);

  async function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    setLeyendo(true);
    try {
      const texto = await extraerTextoPdf(archivo);
      setPrevia(parsearTurbus(texto));
    } catch (err) {
      toast.error("No se pudo leer el PDF", { description: mensajeError(err) });
    } finally {
      setLeyendo(false);
    }
  }

  async function onGuardar() {
    if (!previa) return;
    setGuardando(true);
    try {
      await importar(previa);
      toast.success(`Cuponera importada: ${previa.pasajes.length} pasajes`);
      setPrevia(null);
    } catch (err) {
      toast.error(mensajeError(err));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={onArchivo}
      />
      <button
        onClick={() => input.current?.click()}
        disabled={leyendo}
        className="fixed right-4 bottom-[max(env(safe-area-inset-bottom),1rem)] z-10 flex h-14 items-center gap-2 rounded-2xl bg-acento pr-5 pl-4 font-semibold text-sobre-acento shadow-lg shadow-black/20 transition active:scale-95 disabled:opacity-70"
      >
        <IconoMas />
        {leyendo ? "Leyendo PDF…" : "Importar PDF"}
      </button>

      {previa && (
        <HojaPrevia
          previa={previa}
          guardando={guardando}
          onCancelar={() => setPrevia(null)}
          onGuardar={onGuardar}
        />
      )}
    </>
  );
}

function HojaPrevia({
  previa,
  guardando,
  onCancelar,
  onGuardar,
}: {
  previa: CuponeraParseada;
  guardando: boolean;
  onCancelar: () => void;
  onGuardar: () => void;
}) {
  const tramos = new Map<string, number>();
  for (const p of previa.pasajes) {
    const k = `${p.origen}\u0000${p.destino}`;
    tramos.set(k, (tramos.get(k) ?? 0) + 1);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !guardando && onCancelar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guardando, onCancelar]);

  return (
    <div className="fixed inset-0 z-20 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => !guardando && onCancelar()} />
      <div
        role="dialog"
        aria-modal
        aria-labelledby="previa-titulo"
        className="relative w-full max-w-md rounded-t-3xl border border-borde bg-superficie p-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] shadow-2xl sm:rounded-3xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-borde sm:hidden" />
        <h2 id="previa-titulo" className="text-lg font-bold">
          Importar cuponera {previa.empresa}
        </h2>
        <p className="mt-1 text-sm text-tenue">
          Reserva {previa.reserva}
          {previa.montoTotal !== undefined && ` · ${clp(previa.montoTotal)}`}
        </p>

        <ul className="mt-5 flex flex-col gap-2">
          {[...tramos].map(([k, n]) => {
            const [origen, destino] = k.split("\u0000");
            return (
              <li
                key={k}
                className="flex items-center justify-between rounded-xl bg-superficie-2 px-4 py-3"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  {origen}
                  <IconoFlecha className="size-4 text-acento" />
                  {destino}
                </span>
                <span className="font-semibold tabular-nums">{n}</span>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 text-xs text-tenue">
          Se guardarán {previa.pasajes.length} pasajes con código y clave cifrados. El PDF no se
          sube ni se guarda.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            onClick={onCancelar}
            disabled={guardando}
            className="h-12 rounded-xl border border-borde font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={onGuardar}
            disabled={guardando}
            className="h-12 rounded-xl bg-acento font-semibold text-sobre-acento disabled:opacity-60"
          >
            {guardando ? "Guardando…" : "Importar"}
          </button>
        </div>
      </div>
    </div>
  );
}
