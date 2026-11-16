import type { Secreto } from "../lib/datos";

/** Muestra N° de cupón y clave (para leerlos si hay que dictarlos o escribirlos). */
export function Secretos({
  secreto,
  className = "",
  compacto = false,
}: {
  secreto: Secreto | undefined;
  className?: string;
  compacto?: boolean;
}) {
  const valor = compacto ? "text-sm" : "text-xl";
  return (
    <dl className={`grid grid-cols-[3fr_2fr] gap-2 ${className}`}>
      <div className="rounded-xl bg-superficie-2 px-3 py-2">
        <dt className="text-[11px] font-medium tracking-wide text-tenue uppercase">N° cupón</dt>
        <dd className={`font-mono font-semibold tabular-nums ${valor}`}>
          {secreto?.codigo ?? <Cargando />}
        </dd>
      </div>
      <div className="rounded-xl bg-superficie-2 px-3 py-2">
        <dt className="text-[11px] font-medium tracking-wide text-tenue uppercase">Clave</dt>
        <dd className={`font-mono font-semibold tabular-nums ${valor}`}>
          {secreto?.clave ?? <Cargando />}
        </dd>
      </div>
    </dl>
  );
}

function Cargando() {
  return <span className="inline-block h-[1em] w-20 animate-pulse rounded bg-borde align-middle" />;
}
