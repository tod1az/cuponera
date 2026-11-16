import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Cuponera, Pasaje, Secreto } from "../lib/datos";
import { clp, fecha, fechaHora, mensajeError } from "../lib/datos";
import { useMarcarUsado } from "../lib/useMarcarUsado";
import { BotonesCopiar } from "./BotonesCopiar";
import { IconoBasura, IconoCheck, IconoChevron, IconoDeshacer, IconoFlecha } from "./Iconos";
import { Secretos } from "./Secretos";

type Props = { cuponera: Cuponera; secretos: ReadonlyMap<string, Secreto> };

export function CuponeraCard({ cuponera, secretos }: Props) {
  const eliminar = useMutation(api.pasajes.eliminarCuponera);
  const usados = cuponera.pasajes.filter((p) => p.usadoEn !== null).length;
  const total = cuponera.pasajes.length;
  const terminada = usados === total;

  async function onEliminar() {
    const msg = terminada
      ? "¿Eliminar esta cuponera?"
      : `Esta cuponera aún tiene ${total - usados} pasajes sin usar. ¿Eliminarla de todas formas?`;
    if (!confirm(msg)) return;
    try {
      await eliminar({ cuponeraId: cuponera._id });
      toast.success("Cuponera eliminada");
    } catch (e) {
      toast.error(mensajeError(e));
    }
  }

  return (
    <details className="group rounded-2xl border border-borde bg-superficie open:shadow-sm">
      <summary className="flex cursor-pointer items-center gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 font-semibold">
            {cuponera.empresa} · {cuponera.origen}
            <span className="text-tenue">⇄</span>
            {cuponera.destino}
          </p>
          <p className="mt-0.5 text-sm text-tenue">
            {fecha(cuponera.creadaEn)} · {usados}/{total} usados
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-superficie-2">
            <div
              className={`h-full rounded-full ${terminada ? "bg-tenue" : "bg-acento"}`}
              style={{ width: `${(usados / total) * 100}%` }}
            />
          </div>
        </div>
        <IconoChevron className="size-5 shrink-0 text-tenue transition group-open:rotate-180" />
      </summary>

      <ul className="divide-y divide-borde border-t border-borde">
        {cuponera.pasajes.map((p) => (
          <FilaPasaje key={p._id} pasaje={p} secreto={secretos.get(p._id)} />
        ))}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-borde px-4 py-3 text-sm text-tenue">
        <span>{cuponera.montoTotal !== null && `Pagado ${clp(cuponera.montoTotal)}`}</span>
        <button
          onClick={onEliminar}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-medium text-peligro"
        >
          <IconoBasura />
          Eliminar
        </button>
      </div>
    </details>
  );
}

function FilaPasaje({ pasaje, secreto }: { pasaje: Pasaje; secreto: Secreto | undefined }) {
  const marcar = useMarcarUsado();
  const usado = pasaje.usadoEn !== null;
  const etiqueta = `Cupón ${pasaje.indice}`;

  return (
    <li className={`px-4 py-3 ${usado ? "opacity-60" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-1.5 text-sm">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-superficie-2 text-xs font-bold tabular-nums">
            {pasaje.indice}
          </span>
          <span className={`truncate ${usado ? "line-through" : ""}`}>{pasaje.origen}</span>
          <IconoFlecha className="size-3.5 shrink-0 text-tenue" />
          <span className={`truncate ${usado ? "line-through" : ""}`}>{pasaje.destino}</span>
        </p>
        <button
          onClick={() => marcar(pasaje._id, !usado, etiqueta)}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-borde px-3 text-xs font-semibold"
        >
          {usado ? <IconoDeshacer /> : <IconoCheck className="size-4" />}
          {usado ? "Desmarcar" : "Usado"}
        </button>
      </div>
      {usado ? (
        <p className="mt-1 pl-7.5 text-xs text-tenue">Usado el {fechaHora(pasaje.usadoEn!)}</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2 pl-7.5">
          <Secretos secreto={secreto} compacto />
          <BotonesCopiar secreto={secreto} />
        </div>
      )}
    </li>
  );
}
