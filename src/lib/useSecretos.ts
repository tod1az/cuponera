import { useAction } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Secreto } from "./datos";

/**
 * Pide al servidor descifrar los pasajes sin usar y los mantiene solo en
 * memoria (nunca en localStorage). Se vuelve a pedir cuando aparecen pasajes
 * sin usar que aún no tenemos (una importación nueva o un pasaje desmarcado).
 */
export function useSecretos(idsSinUsar: string[] | undefined) {
  const revelar = useAction(api.secretos.revelar);
  const [secretos, setSecretos] = useState<ReadonlyMap<string, Secreto>>(new Map());
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);
  const pedidos = useRef(new Set<string>());

  const faltantes = (idsSinUsar ?? [])
    .filter((id) => !secretos.has(id) && !pedidos.current.has(id))
    .sort()
    .join(",");

  useEffect(() => {
    if (!faltantes) return;
    const ids = faltantes.split(",");
    ids.forEach((id) => pedidos.current.add(id));
    setError(false);
    revelar({})
      .then((res) =>
        setSecretos((prev) => {
          const m = new Map(prev);
          for (const r of res) m.set(r.pasajeId, { codigo: r.codigo, clave: r.clave });
          return m;
        }),
      )
      .catch(() => {
        ids.forEach((id) => pedidos.current.delete(id));
        setError(true);
      });
  }, [faltantes, revelar, intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  return { secretos, error, reintentar };
}
