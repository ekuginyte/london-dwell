import { jsPDF } from "jspdf";
import type { Pin } from "./pins.store";

export function exportShortlistPDF(pins: Pin[], filterSummary: string[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  let y = M;

  // Header
  doc.setFillColor(8, 82, 255); // Coinbase blue
  doc.rect(0, 0, W, 80, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("London House Shortlist", M, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(new Date().toLocaleDateString("en-GB", { dateStyle: "long" }), M, 68);

  y = 110;
  doc.setTextColor(30, 30, 40);

  // Filter summary
  if (filterSummary.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Active filters", M, y);
    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    for (const line of filterSummary) {
      doc.text("• " + line, M + 6, y);
      y += 14;
    }
    y += 10;
  }

  // Pins
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`Saved properties (${pins.length})`, M, y);
  y += 18;

  doc.setFontSize(10);
  if (pins.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 130);
    doc.text("No pins saved yet.", M, y);
  }

  for (const p of pins) {
    if (y > 760) {
      doc.addPage();
      y = M;
    }
    // Card
    doc.setDrawColor(225, 228, 235);
    doc.setFillColor(250, 251, 253);
    doc.roundedRect(M, y, W - M * 2, 78, 10, 10, "FD");

    doc.setTextColor(20, 22, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(p.label, M + 14, y + 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(95, 100, 115);
    doc.text(`${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`, M + 14, y + 38);

    if (p.url) {
      doc.setTextColor(8, 82, 255);
      doc.textWithLink(truncate(p.url, 80), M + 14, y + 54, { url: p.url });
    }
    if (p.notes) {
      doc.setTextColor(60, 65, 80);
      doc.text(truncate(p.notes, 95), M + 14, y + 70);
    }
    y += 92;
  }

  // Footer page numbers
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(160, 165, 175);
    doc.text(`Page ${i} / ${total}  ·  Generated with London House Map`, M, 820);
  }

  doc.save(`london-shortlist-${Date.now()}.pdf`);
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
