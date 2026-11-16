/**
 * Extrae el texto de un PDF en el navegador con pdf.js (carga diferida).
 * El archivo nunca se sube al servidor.
 */
export async function extraerTextoPdf(archivo: File): Promise<string> {
  const [pdfjs, { default: workerUrl }] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const data = new Uint8Array(await archivo.arrayBuffer());
  const tarea = pdfjs.getDocument({ data });
  const doc = await tarea.promise;
  try {
    let texto = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const contenido = await page.getTextContent();
      for (const item of contenido.items) {
        if ("str" in item) texto += item.str + (item.hasEOL ? "\n" : "");
      }
      texto += "\n";
    }
    return texto;
  } finally {
    await tarea.destroy();
  }
}
