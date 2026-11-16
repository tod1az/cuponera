import type { Secreto, Tramo } from "../lib/datos";
import { fecha } from "../lib/datos";
import { useMarcarUsado } from "../lib/useMarcarUsado";
import { BotonesCopiar } from "./BotonesCopiar";
import { IconoCheck, IconoFlecha } from "./Iconos";
import { Secretos } from "./Secretos";

type Props = { tramo: Tramo; secretos: ReadonlyMap<string, Secreto> };

export function ProximoPasaje({ tramo, secretos }: Props) {
  const marcar = useMarcarUsado();
  const proximo = tramo.disponibles[0];
  const quedan = tramo.disponibles.length;

  return (
    <article className="rounded-3xl border border-borde bg-superficie p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="flex flex-wrap items-center gap-x-2 text-lg leading-tight font-bold">
          {tramo.origen}
          <IconoFlecha className="size-5 text-acento" />
          {tramo.destino}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
            quedan === 0
              ? "bg-peligro/15 text-peligro"
              : quedan <= 2
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : "bg-acento/15 text-acento"
          }`}
        >
          {quedan === 0 ? "Sin pasajes" : `Quedan ${quedan}`}
        </span>
      </div>

      {proximo ? (
        <>
          <p className="mt-1 text-sm text-tenue">
            Cupón {proximo.indice} · cuponera del {fecha(proximo.cuponera.creadaEn)}
          </p>
          <Secretos secreto={secretos.get(proximo._id)} className="mt-4" />
          <div className="mt-4 flex flex-col gap-2">
            <BotonesCopiar secreto={secretos.get(proximo._id)} grande />
            <button
              onClick={() => marcar(proximo._id, true, `Cupón ${proximo.indice}`)}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-borde font-semibold transition active:scale-[0.98]"
            >
              <IconoCheck />
              Marcar como usado
            </button>
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-tenue">
          Usaste todos los pasajes de este tramo. Importa una nueva cuponera para seguir.
        </p>
      )}
    </article>
  );
}
