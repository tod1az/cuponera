import { useEffect, useRef, useState } from "react";
import { copiar, copiarSecuencial } from "../lib/clipboard";
import type { Secreto } from "../lib/datos";
import { useEsTactil } from "../lib/useEsTactil";
import { IconoCheck, IconoCopiar } from "./Iconos";

type Props = { secreto: Secreto | undefined; grande?: boolean };

/**
 * Mobile: un botón que copia código y luego clave (ambos quedan en el
 * historial del teclado), más los dos botones por separado para quien no
 * tiene historial de portapapeles (p. ej. iOS). Desktop: solo los dos botones.
 */
export function BotonesCopiar({ secreto, grande = false }: Props) {
  const tactil = useEsTactil();
  const separados = (
    <div className="grid grid-cols-2 gap-2">
      <CopiarUno etiqueta="código" valor={secreto?.codigo} grande={grande} secundario={tactil} />
      <CopiarUno etiqueta="clave" valor={secreto?.clave} grande={grande} secundario={tactil} />
    </div>
  );
  if (!tactil) return separados;
  return (
    <div className="flex flex-col gap-2">
      <CopiarAmbos secreto={secreto} grande={grande} />
      {separados}
    </div>
  );
}

function useTemporal<T>(inicial: T, ms = 2500) {
  const [valor, setValor] = useState(inicial);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const set = (v: T, temporal = true) => {
    clearTimeout(timer.current);
    setValor(v);
    if (temporal) timer.current = setTimeout(() => setValor(inicial), ms);
  };
  return [valor, set] as const;
}

const base =
  "flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:opacity-50";
const tam = (grande: boolean) => (grande ? "h-14 text-base" : "h-11 text-sm");

function CopiarAmbos({ secreto, grande }: { secreto: Secreto | undefined; grande: boolean }) {
  const [estado, setEstado] = useTemporal<"idle" | "copiando" | "ok" | "falta-clave" | "error">(
    "idle",
    4000,
  );

  async function onClick() {
    if (!secreto) return;
    if (estado === "falta-clave") {
      setEstado((await copiar(secreto.clave)) ? "ok" : "error");
      return;
    }
    setEstado("copiando", false);
    const r = await copiarSecuencial(secreto.codigo, secreto.clave);
    if (r === "ambos") setEstado("ok");
    else if (r === "solo-codigo") setEstado("falta-clave", false);
    else setEstado("error");
  }

  const textos = {
    idle: "Copiar código y clave",
    copiando: "Copiando…",
    ok: "¡Copiados!",
    "falta-clave": "Toca para copiar la clave",
    error: "No se pudo copiar",
  } as const;

  return (
    <button
      onClick={onClick}
      disabled={!secreto || estado === "copiando"}
      className={`${base} ${tam(grande)} w-full bg-acento text-sobre-acento`}
    >
      {estado === "ok" ? <IconoCheck /> : <IconoCopiar />}
      {secreto ? textos[estado] : "Descifrando…"}
    </button>
  );
}

function CopiarUno({
  etiqueta,
  valor,
  grande,
  secundario = false,
}: {
  etiqueta: string;
  valor: string | undefined;
  grande: boolean;
  /** En mobile van bajo el botón principal, con menos peso visual. */
  secundario?: boolean;
}) {
  const [estado, setEstado] = useTemporal<"idle" | "ok" | "error">("idle");
  return (
    <button
      onClick={async () => {
        if (!valor) return;
        setEstado((await copiar(valor)) ? "ok" : "error");
      }}
      disabled={!valor}
      className={`${base} ${secundario ? "h-11 text-sm" : tam(grande)} ${
        secundario ? "border border-borde bg-superficie-2" : "bg-acento text-sobre-acento"
      }`}
    >
      {estado === "ok" ? <IconoCheck className="size-4" /> : <IconoCopiar className="size-4" />}
      {estado === "ok"
        ? "Copiado"
        : estado === "error"
          ? "No se pudo copiar"
          : `Copiar ${etiqueta}`}
    </button>
  );
}
