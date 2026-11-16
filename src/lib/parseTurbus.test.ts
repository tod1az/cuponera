import { describe, expect, it } from "vitest";
import { ErrorParseo, parsearTurbus } from "./parseTurbus";

// Mismo formato que produce pdf.js con el comprobante real (datos ficticios).
// El PDF tiene dos columnas, por eso los cupones salen 1,3,5,… y luego 2,4,6,…
function cupon(i: number, tramo: string) {
  return `${i}. CUPÓN ${i}:\n${tramo}\nNº de cupón: ${1000000000 + i}\nClave: ${String(100000 + i)}\n`;
}
const IDA = "Santiago - Villa Alemana";
const VUELTA = "Villa Alemana - Santiago";
const tramo = (i: number) => (i <= 5 ? IDA : VUELTA);

function comprobante(indices = [1, 3, 5, 7, 9, 2, 4, 6, 8, 10], total = 10) {
  return [
    "EMPRESA: Turbus\nN° TRANSACCIÓN: 12345678901\nN° DE RESERVA: TBC000000000000aa\n",
    "Origen: Santiago\nDestino: Villa Alemana\n",
    ...indices.map((i) => cupon(i, tramo(i))),
    "PASAJERO: Persona Ficticia\nRUT / Pasaporte / DNI: 11.111.111-1\n",
    `Cuponera: ${total} pasajes\nPRECIO NORMAL: CLP$ 50.000\nDESCUENTO: CLP$ 0\nMONTO TOTAL: CLP$ 50.000\n`,
  ].join("");
}

describe("parsearTurbus", () => {
  it("extrae todos los datos de la cuponera en orden", () => {
    const r = parsearTurbus(comprobante());
    expect(r).toMatchObject({
      empresa: "Turbus",
      transaccion: "12345678901",
      reserva: "TBC000000000000aa",
      origen: "Santiago",
      destino: "Villa Alemana",
      totalPasajes: 10,
      montoTotal: 50000,
    });
    expect(r.pasajes.map((p) => p.indice)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(r.pasajes[0]).toEqual({
      indice: 1,
      origen: "Santiago",
      destino: "Villa Alemana",
      codigo: "1000000001",
      clave: "100001",
    });
    expect(r.pasajes[9]).toMatchObject({ origen: "Villa Alemana", destino: "Santiago" });
  });

  it("no incluye nombre ni RUT del pasajero", () => {
    const json = JSON.stringify(parsearTurbus(comprobante()));
    expect(json).not.toContain("11.111.111-1");
    expect(json).not.toContain("Ficticia");
  });

  it("falla si faltan cupones", () => {
    expect(() => parsearTurbus(comprobante([1, 2, 3]))).toThrow(ErrorParseo);
  });

  it("falla si no es un comprobante Turbus", () => {
    expect(() => parsearTurbus("hola mundo")).toThrow(/Turbus/);
  });
});
