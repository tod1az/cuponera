import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useMemo } from "react";
import { api } from "../../convex/_generated/api";
import { agruparPorTramo } from "../lib/datos";
import { useSecretos } from "../lib/useSecretos";
import { CuponeraCard } from "./CuponeraCard";
import { ImportarPdf } from "./ImportarPdf";
import { Logo } from "./Logo";
import { ProximoPasaje } from "./ProximoPasaje";

export function Inicio() {
  const cuponeras = useQuery(api.pasajes.listar);
  const yo = useQuery(api.users.yo);
  const { signOut } = useAuthActions();

  const tramos = useMemo(() => agruparPorTramo(cuponeras ?? []), [cuponeras]);
  const idsSinUsar = useMemo(
    () =>
      cuponeras?.flatMap((c) => c.pasajes.filter((p) => p.usadoEn === null).map((p) => p._id)),
    [cuponeras],
  );
  const { secretos, error, reintentar } = useSecretos(idsSinUsar);

  return (
    <div className="mx-auto min-h-dvh max-w-xl px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-32">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Logo className="size-9" />
          <h1 className="text-xl font-bold tracking-tight">Cuponera</h1>
        </div>
        <button
          onClick={() => {
            if (confirm("¿Cerrar sesión?")) void signOut();
          }}
          className="flex items-center gap-2 rounded-full border border-borde bg-superficie py-1 pr-3 pl-1 text-sm text-tenue"
          aria-label="Cerrar sesión"
        >
          {yo?.image ? (
            <img src={yo.image} alt="" className="size-7 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <span className="grid size-7 place-items-center rounded-full bg-superficie-2 font-semibold">
              {yo?.name?.[0] ?? "?"}
            </span>
          )}
          Salir
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-peligro/40 bg-peligro/10 px-4 py-3 text-sm text-peligro"
        >
          No se pudieron descifrar los pasajes.
          <button onClick={reintentar} className="font-semibold underline">
            Reintentar
          </button>
        </div>
      )}

      {cuponeras === undefined ? (
        <Esqueleto />
      ) : cuponeras.length === 0 ? (
        <Vacio />
      ) : (
        <>
          <section aria-labelledby="proximos" className="flex flex-col gap-4">
            <h2 id="proximos" className="text-sm font-semibold tracking-wide text-tenue uppercase">
              Próximo pasaje
            </h2>
            {tramos.map((t) => (
              <ProximoPasaje key={t.clave} tramo={t} secretos={secretos} />
            ))}
          </section>

          <section aria-labelledby="cuponeras" className="mt-10 flex flex-col gap-3">
            <h2 id="cuponeras" className="text-sm font-semibold tracking-wide text-tenue uppercase">
              Mis cuponeras
            </h2>
            {[...cuponeras].reverse().map((c) => (
              <CuponeraCard key={c._id} cuponera={c} secretos={secretos} />
            ))}
          </section>
        </>
      )}

      <ImportarPdf />
    </div>
  );
}

function Esqueleto() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      {[0, 1].map((i) => (
        <div key={i} className="h-48 animate-pulse rounded-3xl bg-superficie" />
      ))}
    </div>
  );
}

function Vacio() {
  return (
    <div className="mt-16 flex flex-col items-center gap-3 px-6 text-center">
      <Logo className="size-16 opacity-80" />
      <h2 className="text-lg font-semibold">Aún no tienes cuponeras</h2>
      <p className="text-tenue">
        Importa el PDF del comprobante de compra de Turbus y tus pasajes aparecerán aquí.
      </p>
    </div>
  );
}
