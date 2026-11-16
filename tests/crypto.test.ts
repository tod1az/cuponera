import { describe, expect, it } from "vitest";
import { llavesUsuario } from "../convex/lib/crypto";

const master = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
const otraMaster = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));

describe("crypto por usuario", () => {
  it("cifra y descifra (ida y vuelta)", async () => {
    const k = await llavesUsuario("user1", master);
    const c = await k.cifrar("secreto", "aad");
    expect(c.ct).not.toContain("secreto");
    expect(await k.descifrar(c, "aad")).toBe("secreto");
  });

  it("usa un IV distinto en cada cifrado", async () => {
    const k = await llavesUsuario("user1", master);
    const [a, b] = await Promise.all([k.cifrar("x", "aad"), k.cifrar("x", "aad")]);
    expect(a.iv).not.toBe(b.iv);
    expect(a.ct).not.toBe(b.ct);
  });

  it("otro usuario no puede descifrar", async () => {
    const c = await (await llavesUsuario("user1", master)).cifrar("secreto", "aad");
    await expect((await llavesUsuario("user2", master)).descifrar(c, "aad")).rejects.toThrow();
  });

  it("falla con otra llave maestra o con otro AAD", async () => {
    const k = await llavesUsuario("user1", master);
    const c = await k.cifrar("secreto", "aad");
    await expect(k.descifrar(c, "otro-aad")).rejects.toThrow();
    await expect((await llavesUsuario("user1", otraMaster)).descifrar(c, "aad")).rejects.toThrow();
  });

  it("HMAC es determinista por usuario", async () => {
    const k1 = await llavesUsuario("user1", master);
    const k2 = await llavesUsuario("user2", master);
    expect(await k1.hmac("R")).toBe(await k1.hmac("R"));
    expect(await k1.hmac("R")).not.toBe(await k2.hmac("R"));
  });

  it("rechaza llaves maestras inválidas", async () => {
    await expect(llavesUsuario("u", undefined)).rejects.toThrow(/CUPONERA_MASTER_KEY/);
    await expect(llavesUsuario("u", btoa("corta"))).rejects.toThrow(/32 bytes/);
  });
});
