import { useState } from "react";
import { useOauth, useSignInWithGoogle } from "@convex-dev/auth/methods/google/react";
import { api } from "../../convex/_generated/api";
import { Logo } from "./Logo";

const MENSAJES: Record<string, string> = {
  ACCESS_DENIED: "Cancelaste el inicio de sesión.",
  EXPIRED: "El inicio de sesión expiró. Intenta de nuevo.",
  INVALID_FLOW: "No se pudo completar el inicio de sesión. Intenta de nuevo.",
  OTHER_ERROR: "Ocurrió un error al iniciar sesión.",
};

export function Login() {
  const { signIn } = useSignInWithGoogle(api.auth);
  const { flowError } = useOauth();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function entrar() {
    setCargando(true);
    setError(null);
    const r = await signIn();
    // Si todo va bien el navegador ya se fue a Google; solo llegamos aquí con error.
    if (r.status === "error") {
      setError(MENSAJES[r.userError.error] ?? MENSAJES.OTHER_ERROR);
      setCargando(false);
    }
  }

  const mensaje = error ?? (flowError ? MENSAJES[flowError.error] : null);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-10 px-6 pb-[env(safe-area-inset-bottom)]">
      <div className="flex flex-col items-center gap-4 text-center">
        <Logo className="size-20" />
        <div>
          <h1 className="letrero-texto font-display text-6xl leading-none font-semibold">
            Cuponera
          </h1>
          <p className="mt-2 text-tenue">
            Tus pasajes a mano: copia código y clave, y marca los que ya usaste.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={entrar}
          disabled={cargando}
          className="flex h-14 items-center justify-center gap-3 rounded-2xl border border-borde bg-superficie text-base font-semibold shadow-sm transition active:scale-[0.98] disabled:opacity-60"
        >
          <GoogleIcon />
          {cargando ? "Redirigiendo…" : "Continuar con Google"}
        </button>
        {mensaje && (
          <p role="alert" className="text-center text-sm text-peligro">
            {mensaje}
          </p>
        )}
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
