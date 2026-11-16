/**
 * Cifrado por usuario con Web Crypto (disponible en el runtime de Convex).
 *
 * llaveUsuario = HKDF-SHA256(CUPONERA_MASTER_KEY, salt = userId, info = "cuponera:v1:<uso>")
 * Las llaves por usuario nunca se guardan: se derivan en cada uso.
 */

export const KEY_VERSION = 1;

export type Cifrado = { ct: string; iv: string; v: number };

const enc = new TextEncoder();
const dec = new TextDecoder();

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromB64(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

function leerMasterKey(raw: string | undefined, version: number): Uint8Array<ArrayBuffer> {
  if (version !== KEY_VERSION) {
    throw new Error(`Versión de llave no soportada: ${version}`);
  }
  if (!raw) throw new Error("Falta la variable de entorno CUPONERA_MASTER_KEY");
  const bytes = fromB64(raw);
  if (bytes.length !== 32) {
    throw new Error("CUPONERA_MASTER_KEY debe ser de 32 bytes en base64");
  }
  return bytes;
}

async function derivar(
  masterKey: Uint8Array<ArrayBuffer>,
  userId: string,
  uso: "aes" | "hmac",
): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey("raw", masterKey, "HKDF", false, [
    "deriveKey",
  ]);
  const params: HkdfParams = {
    name: "HKDF",
    hash: "SHA-256",
    salt: enc.encode(userId),
    info: enc.encode(`cuponera:v${KEY_VERSION}:${uso}`),
  };
  return uso === "aes"
    ? crypto.subtle.deriveKey(params, base, { name: "AES-GCM", length: 256 }, false, [
        "encrypt",
        "decrypt",
      ])
    : crypto.subtle.deriveKey(params, base, { name: "HMAC", hash: "SHA-256", length: 256 }, false, [
        "sign",
      ]);
}

export type LlavesUsuario = {
  cifrar(texto: string, aad: string): Promise<Cifrado>;
  descifrar(dato: Cifrado, aad: string): Promise<string>;
  hmac(texto: string): Promise<string>;
};

export async function llavesUsuario(
  userId: string,
  masterKeyB64: string | undefined = process.env.CUPONERA_MASTER_KEY,
): Promise<LlavesUsuario> {
  const master = leerMasterKey(masterKeyB64, KEY_VERSION);
  const [aes, mac] = await Promise.all([
    derivar(master, userId, "aes"),
    derivar(master, userId, "hmac"),
  ]);
  return {
    async cifrar(texto, aad) {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv, additionalData: enc.encode(aad) },
        aes,
        enc.encode(texto),
      );
      return { ct: toB64(new Uint8Array(ct)), iv: toB64(iv), v: KEY_VERSION };
    },
    async descifrar(dato, aad) {
      if (dato.v !== KEY_VERSION) {
        throw new Error(`Versión de llave no soportada: ${dato.v}`);
      }
      const pt = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: fromB64(dato.iv), additionalData: enc.encode(aad) },
        aes,
        fromB64(dato.ct),
      );
      return dec.decode(pt);
    },
    async hmac(texto) {
      const sig = await crypto.subtle.sign("HMAC", mac, enc.encode(texto));
      return toB64(new Uint8Array(sig));
    },
  };
}

/** AAD que ata cada dato cifrado a su dueño y a su posición. */
export const aad = {
  pasaje: (userId: string, reservaHmac: string, indice: number) =>
    `pasaje|${userId}|${reservaHmac}|${indice}`,
  reserva: (userId: string, reservaHmac: string) => `reserva|${userId}|${reservaHmac}`,
  transaccion: (userId: string, reservaHmac: string) =>
    `transaccion|${userId}|${reservaHmac}`,
};
