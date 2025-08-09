import PDFDocument from "pdfkit";
import getStream from "get-stream";

export async function generateCertificatePDF(userName: string, level: string) {
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.registerFont("Helvetica", "Helvetica");
  doc.fontSize(20).text("Test_School Certificate", { align: "center" });
  doc.moveDown(1);
  doc.fontSize(14).text(`This certifies that`, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(18).text(`${userName}`, { align: "center", underline: true });
  doc.moveDown(0.5);
  doc
    .fontSize(14)
    .text(`has achieved the competency level`, { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(22).text(level, { align: "center", bold: true } as any);
  doc.moveDown(2);
  doc
    .fontSize(10)
    .text(`Issued at: ${new Date().toLocaleDateString()}`, { align: "right" });
  doc.end();

  // return buffer
  const buffer = await getStream.buffer(doc as any);
  return buffer;
}
