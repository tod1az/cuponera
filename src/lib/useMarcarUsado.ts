import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { mensajeError } from "./datos";

/** Marca o desmarca un pasaje, con opción de deshacer en el aviso. */
export function useMarcarUsado() {
  const marcar = useMutation(api.pasajes.marcarUsado);

  return async (pasajeId: Id<"pasajes">, usado: boolean, etiqueta: string) => {
    try {
      await marcar({ pasajeId, usado });
      toast(usado ? `${etiqueta} marcado como usado` : `${etiqueta} disponible otra vez`, {
        action: {
          label: "Deshacer",
          onClick: () =>
            marcar({ pasajeId, usado: !usado }).catch((e) => toast.error(mensajeError(e))),
        },
      });
    } catch (e) {
      toast.error(mensajeError(e));
    }
  };
}
