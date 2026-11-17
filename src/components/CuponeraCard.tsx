import { useMutation } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Cuponera, Pasaje, Secreto } from "../lib/datos";
import { aviso } from "../lib/avisos";
import { fecha, fechaHora, mensajeError } from "../lib/datos";
import { useMarcarUsado } from "../lib/useMarcarUsado";
import { Alerta } from "./Alerta";
import { NumeroCupon } from "./NumeroCupon";
import { BotonesCopiar } from "./BotonesCopiar";
import { IconoBasura, IconoCheck, IconoChevron, IconoDeshacer, IconoFlecha } from "./Iconos";

type Props = { cuponera: Cuponera; secretos: ReadonlyMap<string, Secreto> };

export function CuponeraCard({ cuponera, secretos }: Props) {
  const eliminar = useMutation(api.pasajes.eliminarCuponera);
  const usados = cuponera.pasajes.filter((p) => p.usadoEn !== null).length;
  const total = cuponera.pasajes.length;
  const terminada = usados === total;

  const sinUsar = total - usados;
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  async function onEliminar() {
    setEliminando(true);
    try {
      await eliminar({ cuponeraId: cuponera._id });
      aviso({
        texto: "Cuponera eliminada",
        detalle: `${cuponera.origen} ⇄ ${cuponera.destino}, comprada el ${fecha(cuponera.creadaEn)}`,
      });
    } catch (e) {
      aviso.error("No se pudo eliminar la cuponera", mensajeError(e));
      setEliminando(false);
      setConfirmando(false);
    }
  }

  return (
    <div className="relative">
      <details className="group rounded-2xl border border-borde bg-superficie">
        <summary className="flex cursor-pointer items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            {/* pr-12: espacio para el botón de eliminar, que va encima de la cabecera. */}
            <p className="pr-12 font-display text-xl leading-tight font-semibold">
              {cuponera.origen} ⇄ {cuponera.destino}
            </p>
            <p className="mt-0.5 text-sm text-tenue">
              Comprada el {fecha(cuponera.creadaEn)}.{" "}
              {terminada ? "Todos usados" : `${usados} de ${total} usados`}
            </p>
            {/* Un segmento por pasaje, en orden: ámbar disponible, apagado usado. */}
            <div className="mt-2.5 flex gap-1" aria-hidden>
              {cuponera.pasajes.map((p) => (
                <span
                  key={p._id}
                  className={`h-1.5 flex-1 rounded-full ${
                    p.usadoEn === null ? "bg-acento" : "bg-superficie-2"
                  }`}
                />
              ))}
            </div>
          </div>
          <IconoChevron className="size-5 shrink-0 text-tenue transition group-open:rotate-180" />
        </summary>

        <ul className="divide-y divide-borde border-t border-borde">
          {cuponera.pasajes.map((p) => (
            <FilaPasaje key={p._id} pasaje={p} secreto={secretos.get(p._id)} />
          ))}
        </ul>
      </details>

      {/* Fuera del <details> para verse aunque esté cerrado, alineado con la cabecera. */}
      <button
        onClick={() => setConfirmando(true)}
        aria-label={`Eliminar cuponera ${cuponera.origen} ⇄ ${cuponera.destino} del ${fecha(cuponera.creadaEn)}`}
        className="absolute top-2.5 right-11 grid size-10 place-items-center rounded-xl text-tenue transition hover:bg-peligro/10 hover:text-peligro active:scale-95"
      >
        <IconoBasura className="size-5" />
      </button>

      <Alerta
        abierta={confirmando}
        peligro
        icono={<IconoBasura className="size-6" />}
        titulo="¿Eliminar esta cuponera?"
        descripcion={
          <>
            <p>
              {cuponera.empresa} · {cuponera.origen} ⇄ {cuponera.destino}, comprada el{" "}
              {fecha(cuponera.creadaEn)}.
            </p>
            {sinUsar > 0 && (
              <p className="mt-2 font-semibold text-peligro">
                Aún tiene {sinUsar} {sinUsar === 1 ? "pasaje sin usar" : "pasajes sin usar"}.
              </p>
            )}
            <p className="mt-2">
              Se borrarán todos sus pasajes con sus códigos y claves. Esta acción no se puede
              deshacer.
            </p>
          </>
        }
        textoConfirmar="Eliminar"
        textoCargando="Eliminando…"
        cargando={eliminando}
        onConfirmar={onEliminar}
        onCancelar={() => setConfirmando(false)}
      />
    </div>
  );
}

function FilaPasaje({ pasaje, secreto }: { pasaje: Pasaje; secreto: Secreto | undefined }) {
  const marcar = useMarcarUsado();
  const usado = pasaje.usadoEn !== null;

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
          onClick={() => void marcar(pasaje._id, !usado, pasaje.indice)}
          className="flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-borde px-3 text-xs font-semibold"
        >
          {usado ? <IconoDeshacer /> : <IconoCheck className="size-4" />}
          {usado ? "Desmarcar" : "Usado"}
        </button>
      </div>
      {usado ? (
        <p className="mt-1 pl-7.5 text-xs text-tenue">Usado el {fechaHora(pasaje.usadoEn!)}</p>
      ) : (
        <div className="mt-2 pl-7.5">
          <NumeroCupon codigo={secreto?.codigo} className="mb-2.5" />
          <BotonesCopiar secreto={secreto} />
        </div>
      )}
    </li>
  );
}
