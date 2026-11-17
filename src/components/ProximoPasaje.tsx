import { useEffect, useRef, useState } from "react";
import type { Secreto, Tramo } from "../lib/datos";
import { fecha } from "../lib/datos";
import { useMarcarUsado } from "../lib/useMarcarUsado";
import { BotonesCopiar } from "./BotonesCopiar";
import { IconoCheck } from "./Iconos";
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
      <header className="letrero flex items-end justify-between gap-4 px-5 pt-4 pb-5">
        <div className="min-w-0">
          <p className="text-sm text-tenue">Desde {tramo.origen}</p>
          <h3 className="letrero-texto font-display text-[2.5rem] leading-[0.95] font-semibold break-words">
            {tramo.destino}
          </h3>
        </div>
        <div className="shrink-0 overflow-hidden text-right">
          <p
            key={quedan}
            className={`font-display text-[2.5rem] leading-[0.95] font-semibold tabular-nums ${
              quedan === 0 ? "text-peligro" : "text-texto"
            } ${animar ? "animate-cifra" : ""}`}
          >
            {quedan}
          </p>
          <p className="text-sm text-tenue">{quedan === 1 ? "queda" : "quedan"}</p>
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
                <p className="mt-1 text-xs text-tenue">
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
