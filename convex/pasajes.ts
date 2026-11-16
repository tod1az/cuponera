import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internalMutation, internalQuery, mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import { vCifrado } from "./schema";

async function requerirUsuario(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new ConvexError("No autenticado");
  return userId;
}

/** Cuponeras del usuario con sus pasajes. Nunca incluye datos cifrados. */
export const listar = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return [];
    const cuponeras = await ctx.db
      .query("cuponeras")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    cuponeras.sort((a, b) => a.creadaEn - b.creadaEn);
    return Promise.all(
      cuponeras.map(async (c) => {
        const pasajes = await ctx.db
          .query("pasajes")
          .withIndex("by_cuponera", (q) => q.eq("cuponeraId", c._id))
          .collect();
        return {
          _id: c._id,
          empresa: c.empresa,
          origen: c.origen,
          destino: c.destino,
          totalPasajes: c.totalPasajes,
          montoTotal: c.montoTotal ?? null,
          creadaEn: c.creadaEn,
          pasajes: pasajes.map((p) => ({
            _id: p._id,
            indice: p.indice,
            origen: p.origen,
            destino: p.destino,
            usadoEn: p.usadoEn ?? null,
          })),
        };
      }),
    );
  },
});

export const marcarUsado = mutation({
  args: { pasajeId: v.id("pasajes"), usado: v.boolean() },
  handler: async (ctx, { pasajeId, usado }) => {
    const userId = await requerirUsuario(ctx);
    const pasaje = await ctx.db.get("pasajes", pasajeId);
    if (!pasaje || pasaje.userId !== userId) throw new ConvexError("Pasaje no encontrado");
    await ctx.db.patch("pasajes", pasajeId, { usadoEn: usado ? Date.now() : undefined });
  },
});

export const eliminarCuponera = mutation({
  args: { cuponeraId: v.id("cuponeras") },
  handler: async (ctx, { cuponeraId }) => {
    const userId = await requerirUsuario(ctx);
    const cuponera = await ctx.db.get("cuponeras", cuponeraId);
    if (!cuponera || cuponera.userId !== userId) {
      throw new ConvexError("Cuponera no encontrada");
    }
    const pasajes = await ctx.db
      .query("pasajes")
      .withIndex("by_cuponera", (q) => q.eq("cuponeraId", cuponeraId))
      .collect();
    for (const p of pasajes) await ctx.db.delete("pasajes", p._id);
    await ctx.db.delete("cuponeras", cuponeraId);
  },
});

// ---- Internas, usadas por las actions de secretos.ts ----

export const _pasajesSinUsar = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const pasajes = await ctx.db
      .query("pasajes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    const hmacPorCuponera = new Map<string, string>();
    const out = [];
    for (const p of pasajes) {
      if (p.usadoEn !== undefined) continue;
      let hmac = hmacPorCuponera.get(p.cuponeraId);
      if (hmac === undefined) {
        const c = await ctx.db.get("cuponeras", p.cuponeraId);
        if (!c) continue;
        hmac = c.reservaHmac;
        hmacPorCuponera.set(p.cuponeraId, hmac);
      }
      out.push({ _id: p._id, indice: p.indice, reservaHmac: hmac, secretoEnc: p.secretoEnc });
    }
    return out;
  },
});

export const _insertarCuponera = internalMutation({
  args: {
    userId: v.id("users"),
    empresa: v.string(),
    origen: v.string(),
    destino: v.string(),
    totalPasajes: v.number(),
    montoTotal: v.optional(v.number()),
    reservaEnc: vCifrado,
    transaccionEnc: v.optional(vCifrado),
    reservaHmac: v.string(),
    pasajes: v.array(
      v.object({
        indice: v.number(),
        origen: v.string(),
        destino: v.string(),
        secretoEnc: vCifrado,
      }),
    ),
  },
  handler: async (ctx, { pasajes, ...cuponera }) => {
    const existente = await ctx.db
      .query("cuponeras")
      .withIndex("by_user_reservaHmac", (q) =>
        q.eq("userId", cuponera.userId).eq("reservaHmac", cuponera.reservaHmac),
      )
      .first();
    if (existente) throw new ConvexError("Esta cuponera ya fue importada");

    const cuponeraId = await ctx.db.insert("cuponeras", {
      ...cuponera,
      creadaEn: Date.now(),
    });
    for (const p of pasajes) {
      await ctx.db.insert("pasajes", { ...p, userId: cuponera.userId, cuponeraId });
    }
    return cuponeraId;
  },
});
