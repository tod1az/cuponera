import { useEffect, useId, useRef, type ReactNode } from "react";

type Props = {
  abierta: boolean;
  titulo: string;
  descripcion: ReactNode;
  textoConfirmar: string;
  textoCancelar?: string;
  /** Acción destructiva: el botón de confirmar se muestra en rojo. */
  peligro?: boolean;
  /** Mientras es true no se puede cerrar y el botón muestra el estado de carga. */
  cargando?: boolean;
  textoCargando?: string;
  icono?: ReactNode;
  onConfirmar: () => void;
  onCancelar: () => void;
};

/**
 * Diálogo de confirmación modal sobre <dialog> nativo (foco atrapado, Esc,
 * accesible). En mobile aparece como hoja inferior y en desktop centrado.
 */
export function Alerta({
  abierta,
  titulo,
  descripcion,
  textoConfirmar,
  textoCancelar = "Cancelar",
  peligro = false,
  cargando = false,
  textoCargando,
  icono,
  onConfirmar,
  onCancelar,
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const idDescripcion = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierta && !d.open) d.showModal();
    if (!abierta && d.open) d.close();
  }, [abierta]);

  const cancelar = () => {
    if (!cargando) onCancelar();
  };

  return (
    <dialog
      ref={ref}
      role="alertdialog"
      aria-labelledby={idTitulo}
      aria-describedby={idDescripcion}
      onCancel={(e) => {
        // Esc: lo maneja React para mantener el estado sincronizado.
        e.preventDefault();
        cancelar();
      }}
      className="m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 text-texto backdrop:bg-black/50 backdrop:backdrop-blur-[2px]"
    >
      <div
        className="flex h-full items-end justify-center sm:items-center sm:p-4"
        onClick={(e) => e.target === e.currentTarget && cancelar()}
      >
        <div className="w-full max-w-sm rounded-t-3xl border border-borde bg-superficie p-6 pb-[max(env(safe-area-inset-bottom),1.5rem)] shadow-2xl sm:rounded-3xl sm:pb-6">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-borde sm:hidden" />
          {icono && (
            <div
              className={`mb-4 grid size-12 place-items-center rounded-2xl ${
                peligro ? "bg-peligro/15 text-peligro" : "bg-acento/15 text-acento"
              }`}
            >
              {icono}
            </div>
          )}
          <h2 id={idTitulo} className="text-lg font-bold">
            {titulo}
          </h2>
          <div id={idDescripcion} className="mt-2 text-sm text-tenue">
            {descripcion}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              autoFocus
              onClick={cancelar}
              disabled={cargando}
              className="h-12 rounded-xl border border-borde font-semibold transition active:scale-[0.98] disabled:opacity-60"
            >
              {textoCancelar}
            </button>
            <button
              type="button"
              onClick={onConfirmar}
              disabled={cargando}
              className={`h-12 rounded-xl font-semibold transition active:scale-[0.98] disabled:opacity-60 ${
                peligro ? "bg-peligro text-white" : "bg-acento text-sobre-acento"
              }`}
            >
              {cargando ? (textoCargando ?? `${textoConfirmar}…`) : textoConfirmar}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
