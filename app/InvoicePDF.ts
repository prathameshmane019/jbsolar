// Client-side invoice PDF. Requires:  npm install jspdf
// jsPDF's built-in fonts have no ₹ glyph, so amounts are printed as "Rs. 1,234.00".

export type InvoiceData = {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  createdAt?: string;
  amount: number | string;
  gstAmount: number | string;
  totalAmount: number | string;
  gstPercentage?: number | string | null;
  policyNumber: string;
  policyStartDate: string;
  policyEndDate: string;
  pumpPowerHp?: number | string | null;
  motorHeadMeters?: number | string | null;
  planName: string;
  planCode?: string;
  durationMonths?: number | null;
  farmerName: string;
  farmerCode?: string;
  farmerMobile?: string;
  farmerAddress?: string;
  vendorName: string;
  vendorCode?: string;
  vendorMobile?: string;
  vendorEmail?: string;
  paymentNumber?: string;
  paymentMethod?: string;
  gateway?: string;
  gatewayPaymentId?: string;
  paidAt?: string | null;
};

type RGB = [number, number, number];
const DARK: RGB = [20, 45, 38];
const GREEN: RGB = [39, 105, 76];
const HEADING_GREEN: RGB = [118, 167, 126];
const LIME: RGB = [192, 222, 123];
const INK: RGB = [29, 39, 35];
const MUTED: RGB = [102, 115, 108];
const RULE: RGB = [222, 229, 224];
const TINT: RGB = [245, 248, 245];
const SOFT: RGB = [194, 211, 201];
const WHITE: RGB = [255, 255, 255];

const clean = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());
const num = (v: unknown) => {
  const value = Number(v ?? 0);
  return Number.isFinite(value) ? value : 0;
};

export function formatInr(value: unknown): string {
  return `Rs. ${num(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(value?: string | null): string {
  if (!value) return "-";
  const dateOnly = value.length === 10;
  const date = new Date(dateOnly ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: dateOnly ? undefined : "Asia/Kolkata",
  });
}

export async function downloadInvoicePdf(inv: InvoiceData): Promise<void> {
  const { jsPDF } = await import("jspdf"); // loaded on demand to keep the main bundle small
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PW = 210, PH = 297, M = 17, CW = PW - M * 2, R = PW - M;

  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
  const font = (style: "normal" | "bold", size: number, color: RGB) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  };
  const wrap = (text: string, width: number) => doc.splitTextToSize(text, width) as string[];
  let y = 57;

  doc.setProperties({ title: `Invoice ${inv.invoiceNumber}`, author: "JB Solar" });

  const drawHeader = () => {
    fill(DARK);
    doc.rect(0, 0, PW, 43, "F");
    fill(LIME);
    doc.rect(0, 0, 3, 43, "F");
    font("bold", 15, WHITE);
    doc.text("JB SOLAR", M, 17);
    font("normal", 8, SOFT);
    doc.text("POLICY SERVICES", M, 23);
    stroke([75, 101, 88]);
    doc.setLineWidth(0.25);
    doc.line(M, 28, M + 48, 28);
    font("normal", 7.5, SOFT);
    doc.text("Tax invoice", M, 34);
    font("bold", 21, WHITE);
    doc.text("INVOICE", R, 17, { align: "right" });
    font("bold", 10, LIME);
    doc.text(clean(inv.invoiceNumber) || "Invoice", R, 25, { align: "right" });
    font("normal", 8, SOFT);
    doc.text(`Issued ${formatDate(inv.invoiceDate)}`, R, 33, { align: "right" });
  };

  const sectionHeading = (title: string) => {
    if (y + 16 > PH - 22) {
      doc.addPage();
      drawHeader();
      y = 57;
    }
    font("bold", 8, HEADING_GREEN);
    doc.text(title.toUpperCase(), M, y);
    stroke(RULE);
    doc.setLineWidth(0.25);
    doc.line(M + 37, y - 0.8, R, y - 0.8);
    y += 7;
  };

  const partyData = [
    {
      title: "BILLED TO",
      name: clean(inv.farmerName) || "-",
      details: [
        clean(inv.farmerCode) ? `Customer ID  ${clean(inv.farmerCode)}` : "",
        clean(inv.farmerMobile) ? `Mobile  ${clean(inv.farmerMobile)}` : "",
        clean(inv.farmerAddress),
      ].filter(Boolean),
    },
    {
      title: "ISSUED BY",
      name: clean(inv.vendorName) || "-",
      details: [
        clean(inv.vendorCode) ? `Vendor ID  ${clean(inv.vendorCode)}` : "",
        clean(inv.vendorMobile) ? `Mobile  ${clean(inv.vendorMobile)}` : "",
        clean(inv.vendorEmail),
      ].filter(Boolean),
    },
  ];
  const partyWidth = (CW - 8) / 2;
  const partyLines = partyData.map(party => ({
    ...party,
    nameLines: wrap(party.name, partyWidth - 12),
    detailLines: party.details.flatMap(line => wrap(line, partyWidth - 12)),
  }));
  const partyHeight = Math.max(...partyLines.map(party => 19 + party.nameLines.length * 5 + party.detailLines.length * 4.5));

  drawHeader();
  if (y + partyHeight + 24 > PH - 22) {
    doc.addPage();
    drawHeader();
    y = 57;
  }
  sectionHeading("Invoice parties");
  partyLines.forEach((party, index) => {
    const x = M + index * (partyWidth + 8);
    fill(TINT);
    doc.roundedRect(x, y, partyWidth, partyHeight, 2, 2, "F");
    font("bold", 7, MUTED);
    doc.text(party.title, x + 6, y + 7);
    font("bold", 10, INK);
    let textY = y + 14;
    party.nameLines.forEach(line => {
      doc.text(line, x + 6, textY);
      textY += 5;
    });
    font("normal", 8, MUTED);
    party.detailLines.forEach(line => {
      doc.text(line, x + 6, textY);
      textY += 4.5;
    });
  });
  y += partyHeight + 12;

  sectionHeading("Invoice references");
  const references: [string, string][] = [
    ["INVOICE DATE", formatDate(inv.invoiceDate)],
    ["POLICY NUMBER", clean(inv.policyNumber) || "-"],
    ["PAYMENT NUMBER", clean(inv.paymentNumber) || "-"],
  ];
  const referenceWidth = CW / references.length;
  const referenceTextLines = references.map(([, value]) => wrap(value, referenceWidth - 10));
  const referenceHeight = Math.max(19, 11 + Math.max(...referenceTextLines.map(lines => lines.length)) * 4.2);
  fill(TINT);
  doc.roundedRect(M, y, CW, referenceHeight, 2, 2, "F");
  references.forEach(([label], index) => {
    const x = M + index * referenceWidth + 5;
    font("bold", 6.5, MUTED);
    doc.text(label, x, y + 6);
    font("bold", 8.5, INK);
    referenceTextLines[index].forEach((line, lineIndex) => doc.text(line, x, y + 12 + lineIndex * 4.2));
    if (index > 0) {
      stroke(RULE);
      doc.line(M + index * referenceWidth, y + 4, M + index * referenceWidth, y + referenceHeight - 4);
    }
  });
  y += referenceHeight + 12;

  sectionHeading("Coverage details");
  const tableHeaderHeight = 9;
  fill(GREEN);
  doc.roundedRect(M, y, CW, tableHeaderHeight, 1.5, 1.5, "F");
  font("bold", 7, WHITE);
  doc.text("DESCRIPTION", M + 5, y + 6);
  doc.text("POLICY PERIOD", M + 115, y + 6);
  doc.text("AMOUNT", R - 5, y + 6, { align: "right" });
  y += tableHeaderHeight + 6;

  const descriptionWidth = 103;
  const planLines = wrap(clean(inv.planName) || "Policy plan", descriptionWidth);
  const details = [
    [clean(inv.planCode), inv.durationMonths ? `${inv.durationMonths} months cover` : ""].filter(Boolean).join("  ·  "),
    inv.pumpPowerHp ? `Pump ${num(inv.pumpPowerHp)} HP${inv.motorHeadMeters ? `  ·  Motor head ${num(inv.motorHeadMeters)} m` : ""}` : "",
  ].filter(Boolean).flatMap(line => wrap(line, descriptionWidth));
  const descriptionTextY = y + 5;
  font("bold", 9.5, INK);
  planLines.forEach((line, index) => doc.text(line, M + 5, descriptionTextY + index * 5));
  font("normal", 7.5, MUTED);
  details.forEach((line, index) => doc.text(line, M + 5, descriptionTextY + planLines.length * 5 + index * 4.2));

  const periodLines = [
    ...wrap(formatDate(inv.policyStartDate), 30),
    ...wrap(`to ${formatDate(inv.policyEndDate)}`, 30),
  ];
  font("normal", 8, INK);
  periodLines.forEach((line, index) => doc.text(line, M + 115, descriptionTextY + index * 4.5));
  font("bold", 9, INK);
  doc.text(formatInr(inv.amount), R - 5, descriptionTextY, { align: "right" });
  const coverageHeight = Math.max(21, 9 + planLines.length * 5 + details.length * 4.2);
  y += coverageHeight;
  stroke(RULE);
  doc.setLineWidth(0.35);
  doc.line(M, y, R, y);
  y += 13;

  const paymentRows: [string, string][] = [
    ["Status", clean(inv.paidAt) ? "Paid" : "Pending"],
    ["Method", clean(inv.paymentMethod) || "-"],
    ["Gateway", clean(inv.gateway) || "-"],
    ["Reference", clean(inv.gatewayPaymentId) || "-"],
    ["Paid on", formatDate(inv.paidAt)],
  ];
  const paymentX = M;
  const paymentWidth = 83;
  const summaryX = M + 94;
  const summaryWidth = CW - 94;
  const paymentHeight = 12 + paymentRows.length * 8;
  const summaryHeight = 40;
  const summaryBoxHeight = Math.max(paymentHeight, summaryHeight);
  if (y + 7 + summaryBoxHeight > PH - 22) {
    doc.addPage();
    drawHeader();
    y = 57;
  }
  sectionHeading("Payment and total");
  fill(TINT);
  doc.roundedRect(paymentX, y, paymentWidth, summaryBoxHeight, 2, 2, "F");
  font("bold", 7, MUTED);
  doc.text("PAYMENT DETAILS", paymentX + 6, y + 7);
  let paymentY = y + 14;
  paymentRows.forEach(([label, value]) => {
    font("normal", 7.5, MUTED);
    doc.text(label, paymentX + 6, paymentY);
    font("bold", 7.5, INK);
    const valueLines = wrap(value, 45);
    doc.text(valueLines[0] || "-", paymentX + 30, paymentY);
    paymentY += 8;
  });

  fill(DARK);
  doc.roundedRect(summaryX, y, summaryWidth, summaryBoxHeight, 2, 2, "F");
  const summaryLabelX = summaryX + 6;
  const summaryValueX = R - 6;
  font("normal", 8, SOFT);
  doc.text("Subtotal", summaryLabelX, y + 11);
  doc.text(formatInr(inv.amount), summaryValueX, y + 11, { align: "right" });
  const gstLabel = inv.gstPercentage !== null && inv.gstPercentage !== undefined ? `GST (${num(inv.gstPercentage)}%)` : "GST";
  doc.text(gstLabel, summaryLabelX, y + 20);
  doc.text(formatInr(inv.gstAmount), summaryValueX, y + 20, { align: "right" });
  stroke([75, 101, 88]);
  doc.line(summaryLabelX, y + 25, summaryValueX, y + 25);
  font("bold", 9, WHITE);
  doc.text(clean(inv.paidAt) ? "TOTAL PAID" : "TOTAL DUE", summaryLabelX, y + 34);
  font("bold", 12, LIME);
  doc.text(formatInr(inv.totalAmount), summaryValueX, y + 34, { align: "right" });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page++) {
    doc.setPage(page);
    stroke(RULE);
    doc.setLineWidth(0.25);
    doc.line(M, PH - 17, R, PH - 17);
    font("normal", 7, MUTED);
    doc.text("Computer-generated invoice · No signature required", M, PH - 10);
    doc.text(`JB Solar  ·  ${page} / ${pageCount}`, R, PH - 10, { align: "right" });
  }

  const safeInvoiceNumber = clean(inv.invoiceNumber).replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").slice(0, 100) || "invoice";
  doc.save(`${safeInvoiceNumber}.pdf`);
}