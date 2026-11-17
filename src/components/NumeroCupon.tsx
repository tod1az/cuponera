/** N° de cupón (el código impreso en el comprobante). La clave nunca se muestra. */
export function NumeroCupon({ codigo, className = "" }: { codigo?: string; className?: string }) {
  return (
    <p className={`text-sm tabular-nums ${className}`}>
      <span className="text-tenue">N° de cupón </span>
      {codigo ? (
        <span className="font-semibold tracking-wide">{codigo}</span>
      ) : (
        <span
          aria-label="Descifrando"
          className="inline-block h-[1em] w-24 animate-pulse rounded bg-borde align-middle"
        />
      )}
    </p>
  );
}
