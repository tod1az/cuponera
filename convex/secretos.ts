import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { action, type ActionCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { aad, llavesUsuario } from "./lib/crypto";

/**
 * getAuthUserId tipa ctx.runQuery como el de una query; el de una action es
 * compatible en ejecución pero no en tipos (auth 2.0 + convex 1.50).
 */
function userIdDeAccion(ctx: ActionCtx) {
  return getAuthUserId(ctx as unknown as Parameters<typeof getAuthUserId>[0]);
}

const DIGITOS = /^\d{1,20}$/;
const RESERVA = /^[A-Za-z0-9]{4,40}$/;
const esTexto = (s: string) => s.trim().length > 0 && s.length <= 60;

/**
 * Recibe los datos ya extraídos del PDF (el PDF nunca llega al servidor),
 * cifra códigos, claves y reserva con la llave del usuario y los guarda.
 */
export const importar = action({
  args: {
    empresa: v.string(),
    reserva: v.string(),
    transaccion: v.optional(v.string()),
    origen: v.string(),
    destino: v.string(),
    totalPasajes: v.number(),
    montoTotal: v.optional(v.number()),
    pasajes: v.array(
      v.object({
        indice: v.number(),
        origen: v.string(),
        destino: v.string(),
        codigo: v.string(),
        clave: v.string(),
      }),
    ),
  },
  handler: async (ctx, args): Promise<Id<"cuponeras">> => {
    const userId = await userIdDeAccion(ctx);
    if (userId === null) throw new ConvexError("No autenticado");

    // Validación defensiva: no confiar en el parser del cliente.
    if (!RESERVA.test(args.reserva)) throw new ConvexError("N° de reserva inválido");
    if (args.transaccion !== undefined && !DIGITOS.test(args.transaccion)) {
      throw new ConvexError("N° de transacción inválido");
    }
    if (![args.empresa, args.origen, args.destino].every(esTexto)) {
      throw new ConvexError("Datos de cuponera inválidos");
    }
    const n = args.pasajes.length;
    if (n === 0 || n > 50 || n !== args.totalPasajes) {
      throw new ConvexError("Cantidad de pasajes inválida");
    }
    if (new Set(args.pasajes.map((p) => p.indice)).size !== n) {
      throw new ConvexError("Pasajes duplicados");
    }
    for (const p of args.pasajes) {
      if (!DIGITOS.test(p.codigo) || !DIGITOS.test(p.clave)) {
        throw new ConvexError(`Pasaje ${p.indice}: código o clave inválidos`);
      }
      if (!esTexto(p.origen) || !esTexto(p.destino)) {
        throw new ConvexError(`Pasaje ${p.indice}: tramo inválido`);
      }
    }

    const llaves = await llavesUsuario(userId);
    const reservaHmac = await llaves.hmac(args.reserva.toUpperCase());

    const pasajes = await Promise.all(
      args.pasajes.map(async (p) => ({
        indice: p.indice,
        origen: p.origen.trim(),
        destino: p.destino.trim(),
        secretoEnc: await llaves.cifrar(
          JSON.stringify({ codigo: p.codigo, clave: p.clave }),
          aad.pasaje(userId, reservaHmac, p.indice),
        ),
      })),
    );

    return await ctx.runMutation(internal.pasajes._insertarCuponera, {
      userId,
      empresa: args.empresa.trim(),
      origen: args.origen.trim(),
      destino: args.destino.trim(),
      totalPasajes: args.totalPasajes,
      montoTotal: args.montoTotal,
      reservaHmac,
      reservaEnc: await llaves.cifrar(args.reserva, aad.reserva(userId, reservaHmac)),
      transaccionEnc:
        args.transaccion === undefined
          ? undefined
          : await llaves.cifrar(args.transaccion, aad.transaccion(userId, reservaHmac)),
      pasajes,
    });
  },
});

export type PasajeRevelado = { pasajeId: Id<"pasajes">; codigo: string; clave: string };

/** Descifra código y clave de los pasajes sin usar del usuario autenticado. */
export const revelar = action({
  args: {},
  handler: async (ctx): Promise<PasajeRevelado[]> => {
    const userId = await userIdDeAccion(ctx);
    if (userId === null) throw new ConvexError("No autenticado");

    const pasajes = await ctx.runQuery(internal.pasajes._pasajesSinUsar, { userId });
    if (pasajes.length === 0) return [];
    const llaves = await llavesUsuario(userId);
    return Promise.all(
      pasajes.map(async (p) => {
        const json = await llaves.descifrar(
          p.secretoEnc,
          aad.pasaje(userId, p.reservaHmac, p.indice),
        );
        const { codigo, clave } = JSON.parse(json) as { codigo: string; clave: string };
        return { pasajeId: p._id, codigo, clave };
      }),
    );
  },
});
