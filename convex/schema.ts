import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/** Dato cifrado con AES-256-GCM (base64). `v` = versión de la llave maestra. */
export const vCifrado = v.object({
  ct: v.string(),
  iv: v.string(),
  v: v.number(),
});

export default defineSchema({
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
  }),

  cuponeras: defineTable({
    userId: v.id("users"),
    empresa: v.string(),
    origen: v.string(),
    destino: v.string(),
    totalPasajes: v.number(),
    montoTotal: v.optional(v.number()),
    reservaEnc: vCifrado,
    transaccionEnc: v.optional(vCifrado),
    /** HMAC(llave del usuario, reserva): detecta importaciones duplicadas sin revelar la reserva. */
    reservaHmac: v.string(),
    creadaEn: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_reservaHmac", ["userId", "reservaHmac"]),

  pasajes: defineTable({
    userId: v.id("users"),
    cuponeraId: v.id("cuponeras"),
    indice: v.number(),
    origen: v.string(),
    destino: v.string(),
    /** JSON {codigo, clave} cifrado. */
    secretoEnc: vCifrado,
    usadoEn: v.optional(v.number()),
  })
    .index("by_cuponera", ["cuponeraId", "indice"])
    .index("by_user", ["userId"]),
});
