function copiarConExecCommand(texto: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = texto;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try {
    return document.execCommand("copy");
  } finally {
    ta.remove();
  }
}

export async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return copiarConExecCommand(texto);
  }
}

/** Pausa para que el teclado (Gboard, Samsung…) registre cada copia por separado en su historial. */
const PAUSA_HISTORIAL_MS = 700;

/**
 * Copia el código y luego la clave, para que ambos queden en el historial del
 * portapapeles (la clave queda arriba). Si el navegador bloquea la segunda copia
 * (p. ej. Safari, por pasar mucho tiempo desde el toque) devuelve "solo-codigo"
 * para que la UI ofrezca copiar la clave con otro toque.
 */
export async function copiarSecuencial(
  codigo: string,
  clave: string,
): Promise<"ambos" | "solo-codigo" | "error"> {
  if (!(await copiar(codigo))) return "error";
  await new Promise((r) => setTimeout(r, PAUSA_HISTORIAL_MS));
  try {
    await navigator.clipboard.writeText(clave);
    return "ambos";
  } catch {
    return "solo-codigo";
  }
}
