import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { aviso } from "./avisos";
import { mensajeError } from "./datos";

/**
 * Marca o desmarca un pasaje y lo avisa (con "Deshacer").
 * Devuelve true si salió bien.
 */
export function useMarcarUsado() {
  const marcar = useMutation(api.pasajes.marcarUsado);

  async function cambiar(pasajeId: Id<"pasajes">, usado: boolean, indice: number) {
    try {
      await marcar({ pasajeId, usado });
      return true;
    } catch (e) {
      aviso.error(`No se pudo actualizar el cupón ${indice}`, mensajeError(e));
      return false;
    }
  }

  return async (pasajeId: Id<"pasajes">, usado: boolean, indice: number) => {
    const ok = await cambiar(pasajeId, usado, indice);
    if (ok) {
      aviso({
        texto: usado ? `Cupón ${indice} marcado como usado` : `Cupón ${indice} disponible otra vez`,
        accion: { texto: "Deshacer", onClick: () => void cambiar(pasajeId, !usado, indice) },
      });
    }
    return ok;
  };
}
