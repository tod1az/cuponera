/**
 * Parser del comprobante de compra de cuponeras Turbus.
 * Función pura sobre el texto ya extraído del PDF (ver pdfTexto.ts).
 * Nombre y RUT del pasajero se ignoran a propósito: no se guardan.
 */

export type PasajeParseado = {
  indice: number;
  origen: string;
  destino: string;
  codigo: string;
  clave: string;
};

export type CuponeraParseada = {
  empresa: string;
  transaccion?: string;
  reserva: string;
  origen: string;
  destino: string;
  totalPasajes: number;
  montoTotal?: number;
  pasajes: PasajeParseado[];
};

export class ErrorParseo extends Error {
  override name = "ErrorParseo";
}

const limpiar = (s: string) => s.replace(/\s+/g, " ").trim();

function campo(texto: string, re: RegExp): string | undefined {
  const m = texto.match(re);
  return m ? limpiar(m[1]) : undefined;
}

const RE_PASAJE =
  /CUP[ÓO]N\s+(\d+)\s*:\s*\n\s*([^\n]+?)\s+-\s+([^\n]+?)\s*\n\s*N\s*[º°o]\s*de\s+cup[óo]n\s*:\s*(\d+)\s*\n\s*Clave\s*:\s*(\d+)/gi;

export function parsearTurbus(texto: string): CuponeraParseada {
  const t = texto.replace(/\r\n?/g, "\n");

  const empresa = campo(t, /EMPRESA:\s*([^\n]+)/i);
  if (!empresa || !/turbus/i.test(empresa)) {
    throw new ErrorParseo("No parece un comprobante de cuponera Turbus.");
  }

  const reserva = campo(t, /N\s*[°º]\s*DE\s+RESERVA:\s*([A-Za-z0-9]+)/i);
  if (!reserva) throw new ErrorParseo("No se encontró el N° de reserva.");

  const transaccion = campo(t, /N\s*[°º]\s*TRANSACCI[ÓO]N:\s*(\d+)/i);
  const origen = campo(t, /Origen:\s*([^\n]+)/i);
  const destino = campo(t, /Destino:\s*([^\n]+)/i);
  if (!origen || !destino) throw new ErrorParseo("No se encontró origen o destino.");

  const totalTxt = campo(t, /Cuponera:\s*(\d+)\s*pasajes/i);
  if (!totalTxt) throw new ErrorParseo("No se encontró la cantidad de pasajes.");
  const totalPasajes = Number(totalTxt);

  const montoTxt = campo(t, /MONTO\s+TOTAL:\s*CLP\$?\s*([\d.]+)/i);
  const montoTotal = montoTxt ? Number(montoTxt.replace(/\./g, "")) : undefined;

  const pasajes: PasajeParseado[] = [];
  for (const m of t.matchAll(RE_PASAJE)) {
    pasajes.push({
      indice: Number(m[1]),
      origen: limpiar(m[2]),
      destino: limpiar(m[3]),
      codigo: m[4],
      clave: m[5],
    });
  }
  // El PDF está en dos columnas: el texto sale 1,3,5,…,2,4,6,…
  pasajes.sort((a, b) => a.indice - b.indice);

  if (pasajes.length !== totalPasajes) {
    throw new ErrorParseo(
      `Se esperaban ${totalPasajes} pasajes y se encontraron ${pasajes.length}.`,
    );
  }
  if (new Set(pasajes.map((p) => p.indice)).size !== pasajes.length) {
    throw new ErrorParseo("Hay cupones repetidos en el PDF.");
  }

  return {
    empresa,
    transaccion,
    reserva,
    origen,
    destino,
    totalPasajes,
    montoTotal: Number.isFinite(montoTotal) ? montoTotal : undefined,
    pasajes,
  };
}
