import { useAction } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { aviso } from "../lib/avisos";
import { clp, mensajeError } from "../lib/datos";
import { parsearTurbus, type CuponeraParseada } from "../lib/parseTurbus";
import { extraerTextoPdf } from "../lib/pdfTexto";
import { Alerta } from "./Alerta";
import { IconoFlecha, IconoMas, IconoSubir } from "./Iconos";

const esPdf = (f: File) => f.type === "application/pdf" || /\.pdf$/i.test(f.name);

/**
 * Importa el comprobante PDF y muestra una vista previa antes de guardar.
 * - "boton": botón flotante (mobile, o desktop con cuponeras).
 * - "dropzone": zona para arrastrar el PDF (desktop sin cuponeras).
 */
export function ImportarPdf({ modo = "boton" }: { modo?: "boton" | "dropzone" }) {
  const importar = useAction(api.secretos.importar);
  const input = useRef<HTMLInputElement>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [previa, setPrevia] = useState<CuponeraParseada | null>(null);
  const [errorLectura, setErrorLectura] = useState<string | null>(null);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);

  function onArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (archivo) void procesar(archivo);
  }

  async function procesar(archivo: File) {
    if (!esPdf(archivo)) {
      setErrorLectura(
        "El archivo que elegiste no es un PDF. Elige el comprobante de compra de Turbus.",
      );
      return;
    }
    setLeyendo(true);
    try {
      const texto = await extraerTextoPdf(archivo);
      setPrevia(parsearTurbus(texto));
    } catch (err) {
      setErrorLectura(mensajeError(err));
    } finally {
      setLeyendo(false);
    }
  }

  async function onGuardar() {
    if (!previa) return;
    setGuardando(true);
    setErrorGuardado(null);
    try {
      await importar(previa);
      aviso({
        texto: "Cuponera importada",
        detalle: `${previa.pasajes.length} pasajes listos para usar`,
      });
      setPrevia(null);
    } catch (err) {
      setErrorGuardado(mensajeError(err));
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
      {modo === "dropzone" ? (
        <Dropzone leyendo={leyendo} onArchivo={procesar} onClick={() => input.current?.click()} />
      ) : (
        <button
          onClick={() => input.current?.click()}
          disabled={leyendo}
          className="fixed right-4 bottom-[max(env(safe-area-inset-bottom),1rem)] z-10 flex h-14 items-center gap-2 rounded-2xl bg-acento pr-5 pl-4 font-semibold text-sobre-acento shadow-lg shadow-black/20 transition active:scale-95 disabled:opacity-70"
        >
          <IconoMas />
          {leyendo ? "Leyendo PDF…" : "Importar PDF"}
        </button>
      )}

      {previa && (
        <HojaPrevia
          previa={previa}
          guardando={guardando}
          error={errorGuardado}
          onCancelar={() => {
            setPrevia(null);
            setErrorGuardado(null);
          }}
          onGuardar={onGuardar}
        />
      )}

      <Alerta
        abierta={errorLectura !== null}
        icono={<IconoSubir className="size-6" />}
        titulo="No se pudo leer el PDF"
        descripcion={<p>{errorLectura}</p>}
        textoConfirmar="Elegir otro PDF"
        textoCancelar="Cerrar"
        onConfirmar={() => {
          setErrorLectura(null);
          input.current?.click();
        }}
        onCancelar={() => setErrorLectura(null)}
      />
    </>
  );
}

function Dropzone({
  leyendo,
  onArchivo,
  onClick,
}: {
  leyendo: boolean;
  onArchivo: (f: File) => void;
  onClick: () => void;
}) {
  const [encima, setEncima] = useState(false);
  // Contador: dragenter/dragleave también se disparan al pasar sobre los hijos.
  const profundidad = useRef(0);

  // Evita que el navegador abra el PDF si se suelta fuera de la zona.
  useEffect(() => {
    const evitar = (e: DragEvent) => e.preventDefault();
    window.addEventListener("dragover", evitar);
    window.addEventListener("drop", evitar);
    return () => {
      window.removeEventListener("dragover", evitar);
      window.removeEventListener("drop", evitar);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={leyendo}
      onDragEnter={(e) => {
        e.preventDefault();
        profundidad.current++;
        setEncima(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={() => {
        profundidad.current--;
        if (profundidad.current <= 0) setEncima(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        profundidad.current = 0;
        setEncima(false);
        const archivo = e.dataTransfer.files[0];
        if (archivo) onArchivo(archivo);
      }}
      className={`mt-8 flex w-full flex-col items-center gap-4 rounded-3xl border-2 border-dashed px-8 py-16 text-center transition ${
        encima ? "border-acento bg-acento/10" : "border-borde bg-superficie hover:border-tenue"
      } disabled:opacity-70`}
    >
      <span className="grid size-14 place-items-center rounded-2xl bg-acento/15 text-acento">
        <IconoSubir />
      </span>
      <span>
        <span className="block text-lg font-semibold">
          {leyendo
            ? "Leyendo PDF…"
            : encima
              ? "Suelta el PDF aquí"
              : "Arrastra el comprobante PDF de Turbus"}
        </span>
        <span className="mt-1 block text-sm text-tenue">
          o haz clic para elegir el archivo. El PDF se lee en tu navegador y no se sube.
        </span>
      </span>
    </button>
  );
}

function HojaPrevia({
  previa,
  guardando,
  error,
  onCancelar,
  onGuardar,
}: {
  previa: CuponeraParseada;
  guardando: boolean;
  error: string | null;
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

        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-peligro">
            {error}
          </p>
        )}

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
