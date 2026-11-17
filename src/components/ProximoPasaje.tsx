import { useEffect, useRef, useState } from "react";
import type { Secreto, Tramo } from "../lib/datos";
import { fecha } from "../lib/datos";
import { useMarcarUsado } from "../lib/useMarcarUsado";
import { BotonesCopiar } from "./BotonesCopiar";
import { IconoBus, IconoCheck } from "./Iconos";
import { NumeroCupon } from "./NumeroCupon";
import { Sello, esperarTimbre } from "./Sello";

type Props = { tramo: Tramo; secretos: ReadonlyMap<string, Secreto> };

/**
 * Boleto del próximo viaje de un tramo: arriba el letrero de destino (como el
 * del bus), y bajo la perforación el talón con el cupón y las acciones.
 */
export function ProximoPasaje({ tramo, secretos }: Props) {
  const marcar = useMarcarUsado();
  const proximo = tramo.disponibles[0];
  const quedan = tramo.disponibles.length;
  const usados = tramo.total - quedan;
  // Id del cupón que se está marcando: solo ese talón sale; el siguiente entra.
  const [saliendoId, setSaliendoId] = useState<string | null>(null);
  const saliendo = proximo !== undefined && saliendoId === proximo._id;

  // Solo se anima lo que cambia después de montar, no la carga inicial.
  const montado = useRef(false);
  useEffect(() => {
    montado.current = true;
  }, []);
  const animar = montado.current;

  async function onMarcar() {
    if (!proximo || saliendo) return;
    setSaliendoId(proximo._id);
    await esperarTimbre();
    // Al resolver, la query ya trae el siguiente cupón y el talón entra animado.
    // Si falla, el talón vuelve a entrar y se avisa el error.
    await marcar(proximo._id, true, proximo.indice);
    setSaliendoId(null);
  }

  return (
    <article className="overflow-hidden rounded-3xl border border-borde bg-superficie">
      <header className="letrero flex items-center justify-between gap-4 px-5 py-5">
        <Ruta origen={tramo.origen} destino={tramo.destino} />
        <div className="shrink-0 overflow-hidden text-right">
          <p
            key={quedan}
            className={`font-display text-[2.5rem] leading-[0.95] font-semibold tabular-nums ${
              quedan === 0 ? "text-peligro" : "text-texto"
            } ${animar ? "animate-cifra" : ""}`}
          >
            {quedan}
          </p>
          <p className="text-sm text-tenue">{quedan === 1 ? "Queda" : "Quedan"}</p>
        </div>
      </header>

      <div className="perforacion" aria-hidden />

      <div className="relative overflow-hidden p-5 pt-4">
        {proximo ? (
          <div
            key={proximo._id}
            className={saliendo ? "animate-boleto-sale" : animar ? "animate-boleto-entra" : ""}
          >
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="font-display text-3xl leading-none font-semibold">
                  Cupón {proximo.indice}
                  <span className="text-xl font-medium text-tenue">
                    {" "}
                    de {proximo.cuponera.totalPasajes}
                  </span>
                </p>
                <NumeroCupon codigo={secretos.get(proximo._id)?.codigo} className="mt-2" />
                <p className="mt-0.5 text-xs text-tenue">
                  Cuponera del {fecha(proximo.cuponera.creadaEn)}
                </p>
              </div>
              <Asientos usados={usados} total={tramo.total} />
            </div>

            <div className="flex flex-col gap-2">
              <BotonesCopiar secreto={secretos.get(proximo._id)} grande />
              <button
                onClick={onMarcar}
                disabled={saliendo}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-borde font-semibold transition active:scale-[0.98]"
              >
                <IconoCheck />
                Marcar como usado
              </button>
            </div>
          </div>
        ) : (
          <div className={animar ? "animate-boleto-entra" : ""}>
            <div className="mb-2 flex items-end justify-between gap-3">
              <p className="font-display text-3xl leading-none font-semibold text-tenue">
                Sin cupones
              </p>
              <Asientos usados={usados} total={tramo.total} />
            </div>
            <p className="text-sm text-tenue">
              Usaste todos los pasajes de este tramo. Importa una nueva cuponera para seguir
              viajando.
            </p>
          </div>
        )}

        {saliendo && <Sello texto="Usado" />}
      </div>
    </article>
  );
}

/** Un punto por pasaje del tramo: ámbar los disponibles, apagados los usados. */
function Asientos({ usados, total }: { usados: number; total: number }) {
  return (
    <div
      className="flex max-w-[45%] shrink-0 flex-wrap justify-end gap-1"
      role="img"
      aria-label={`${usados} de ${total} pasajes usados`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`size-2 rounded-full transition-colors duration-700 ${
            i < usados ? "bg-borde" : "bg-acento"
          }`}
        />
      ))}
    </div>
  );
}

/**
 * Tramo como ruta vertical de dos paradas (lenguaje de apps de transporte):
 * origen hueco arriba, destino ámbar abajo, unidos por una línea punteada con
 * el bus en medio. Ambos nombres al mismo tamaño: ninguno se lee como "el importante".
 */
function Ruta({ origen, destino }: { origen: string; destino: string }) {
  return (
    <h3 className="flex min-w-0 gap-3 font-display text-[1.75rem] leading-[1.05] font-semibold">
      <span className="sr-only">
        {origen} a {destino}
      </span>
      {/* Riel: los puntos quedan centrados en la primera línea de cada nombre. */}
      <span aria-hidden className="flex w-4 shrink-0 flex-col items-center py-[0.32em]">
        <span className="size-3 shrink-0 rounded-full border-2 border-tenue" />
        <span className="relative my-1 flex flex-1 justify-center border-l-2 border-dashed border-borde">
          <span className="absolute top-1/2 -translate-y-1/2 bg-letrero py-0.5 text-tenue">
            <IconoBus className="size-4" />
          </span>
        </span>
        <span className="size-3 shrink-0 rounded-full bg-acento shadow-[0_0_10px_rgb(244_176_74/0.6)]" />
      </span>
      <span aria-hidden className="letrero-texto flex min-w-0 flex-col gap-6 break-words">
        <span>{origen}</span>
        <span>{destino}</span>
      </span>
    </h3>
  );
}
