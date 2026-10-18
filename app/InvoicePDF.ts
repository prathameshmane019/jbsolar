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
const DARK: RGB = [22, 59, 45];
const GREEN: RGB = [40, 92, 59];
const LIME: RGB = [197, 232, 108];
const INK: RGB = [32, 38, 31];
const MUTED: RGB = [104, 114, 102];
const RULE: RGB = [228, 232, 223];
const TINT: RGB = [244, 247, 240];
const PAID_BG: RGB = [226, 241, 214];
const SOFT: RGB = [176, 196, 184];
const WHITE: RGB = [255, 255, 255];

const clean = (v: unknown) => (v === null || v === undefined ? "" : String(v).trim());
const num = (v: unknown) => Number(v ?? 0) || 0;

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
  const PW = 210, PH = 297, M = 16, CW = PW - M * 2, R = PW - M;

  const fill = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
  const font = (style: "normal" | "bold", size: number, color: RGB) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  };
  const wrap = (text: string, width: number) => doc.splitTextToSize(text, width) as string[];

  doc.setProperties({ title: `Invoice ${inv.invoiceNumber}`, author: "JB Solar" });

  /* ---------- Header band ---------- */
  fill(DARK);
  doc.rect(0, 0, PW, 40, "F");
  fill(LIME);
  doc.rect(0, 40, PW, 1.4, "F");
  doc.roundedRect(M, 12, 14, 14, 3, 3, "F");
  font("bold", 11, DARK);
  doc.text("JB", M + 7, 21, { align: "center" });
  font("bold", 16, WHITE);
  doc.text("JB Solar", M + 19, 18.5);
  font("normal", 8.5, SOFT);
  doc.text("Operations", M + 19, 24.5);
  font("bold", 24, WHITE);
  doc.text("Invoice", R, 20, { align: "right" });
  font("normal", 9.5, LIME);
  doc.text(inv.invoiceNumber, R, 28, { align: "right" });
  font("normal", 8.5, SOFT);
  doc.text(`Issued ${formatDate(inv.invoiceDate)}`, R, 34, { align: "right" });

  /* ---------- Billed to / Issued by ---------- */
  const colW = 82;
  const party = (x: number, y: number, label: string, name: string, lines: string[]) => {
    font("bold", 8, MUTED);
    doc.text(label, x, y);
    font("bold", 11, INK);
    let cy = y + 6.5;
    for (const part of wrap(name || "-", colW)) {
      doc.text(part, x, cy);
      cy += 5.2;
    }
    font("normal", 9, MUTED);
    for (const line of lines.filter(Boolean)) {
      for (const part of wrap(line, colW)) {
        doc.text(part, x, cy);
        cy += 4.6;
      }
    }
    return cy;
  };
  const top = 54;
  const endA = party(M, top, "Billed to", clean(inv.farmerName), [
    clean(inv.farmerCode) ? `Customer ID: ${clean(inv.farmerCode)}` : "",
    clean(inv.farmerMobile) ? `Mobile: ${clean(inv.farmerMobile)}` : "",
    clean(inv.farmerAddress),
  ]);
  const endB = party(M + 96, top, "Issued by", clean(inv.vendorName), [
    clean(inv.vendorCode) ? `Vendor ID: ${clean(inv.vendorCode)}` : "",
    clean(inv.vendorMobile) ? `Mobile: ${clean(inv.vendorMobile)}` : "",
    clean(inv.vendorEmail),
  ]);

  /* ---------- Reference strip ---------- */
  let y = Math.max(endA, endB) + 6;
  fill(TINT);
  doc.roundedRect(M, y, CW, 17, 2, 2, "F");
  const cells: [string, string][] = [
    ["Invoice number", inv.invoiceNumber],
    ["Invoice date", formatDate(inv.invoiceDate)],
    ["Policy number", inv.policyNumber],
    ["Payment number", clean(inv.paymentNumber) || "-"],
  ];
  const cw = CW / 4;
  cells.forEach(([label, value], i) => {
    const x = M + i * cw + 5;
    font("normal", 7.5, MUTED);
    doc.text(label, x, y + 6.5);
    font("bold", 9.5, INK);
    doc.text(value, x, y + 12.5);
  });

  /* ---------- Line item ---------- */
  y += 27;
  fill(GREEN);
  doc.roundedRect(M, y, CW, 9, 1.5, 1.5, "F");
  font("bold", 8.5, WHITE);
  doc.text("Description", M + 5, y + 6);
  doc.text("Policy period", M + 112, y + 6);
  doc.text("Amount", R - 5, y + 6, { align: "right" });
  y += 9;

  const nameLines = wrap(clean(inv.planName) || "Policy plan", 98);
  const details = [
    [clean(inv.planCode), inv.durationMonths ? `${inv.durationMonths} months cover` : ""].filter(Boolean).join(" · "),
    inv.pumpPowerHp ? `Pump ${num(inv.pumpPowerHp)} HP${inv.motorHeadMeters ? ` · Motor head ${num(inv.motorHeadMeters)} m` : ""}` : "",
  ].filter(Boolean);
  const rowH = Math.max(20, 7 + nameLines.length * 5 + details.length * 4.4 + 4);

  font("bold", 10, INK);
  let ry = y + 8;
  for (const part of nameLines) {
    doc.text(part, M + 5, ry);
    ry += 5;
  }
  font("normal", 8.5, MUTED);
  for (const line of details) {
    doc.text(line, M + 5, ry);
    ry += 4.4;
  }
  font("normal", 9, INK);
  doc.text(formatDate(inv.policyStartDate), M + 112, y + 8);
  font("normal", 8.5, MUTED);
  doc.text(`to ${formatDate(inv.policyEndDate)}`, M + 112, y + 13);
  font("bold", 10, INK);
  doc.text(formatInr(inv.amount), R - 5, y + 8, { align: "right" });
  doc.setDrawColor(RULE[0], RULE[1], RULE[2]);
  doc.setLineWidth(0.3);
  doc.line(M, y + rowH, R, y + rowH);

  /* ---------- Payment (left) and totals (right) ---------- */
  y += rowH + 10;
  const blockTop = y;

  font("bold", 8, MUTED);
  doc.text("Payment", M, y);
  const paid = Boolean(inv.paidAt);
  fill(paid ? PAID_BG : TINT);
  doc.roundedRect(M, y + 3, 18, 6, 3, 3, "F");
  font("bold", 8, GREEN);
  doc.text(paid ? "Paid" : "Pending", M + 9, y + 7.2, { align: "center" });
  let py = y + 16;
  const payRows: [string, string][] = [
    ["Method", clean(inv.paymentMethod) || "-"],
    ["Gateway", clean(inv.gateway) || "-"],
    ["Reference", clean(inv.gatewayPaymentId) || "-"],
    ["Paid on", formatDate(inv.paidAt)],
  ];
  for (const [label, value] of payRows) {
    font("normal", 8.5, MUTED);
    doc.text(label, M, py);
    font("normal", 8.5, INK);
    doc.text(wrap(value, 62)[0] ?? "-", M + 22, py);
    py += 5.4;
  }

  const tx = R - 82;
  let ty = blockTop + 2;
  const gstLabel = inv.gstPercentage !== null && inv.gstPercentage !== undefined ? `GST (${num(inv.gstPercentage)}%)` : "GST";
  for (const [label, value] of [["Subtotal", formatInr(inv.amount)], [gstLabel, formatInr(inv.gstAmount)]]) {
    font("normal", 9.5, MUTED);
    doc.text(label, tx + 5, ty + 4);
    font("normal", 9.5, INK);
    doc.text(value, R - 5, ty + 4, { align: "right" });
    ty += 8;
  }
  doc.line(tx, ty + 1, R, ty + 1);
  fill(DARK);
  doc.roundedRect(tx, ty + 4, 82, 13, 2, 2, "F");
  font("bold", 10, WHITE);
  doc.text("Total", tx + 5, ty + 12.3);
  font("bold", 12, LIME);
  doc.text(formatInr(inv.totalAmount), R - 5, ty + 12.6, { align: "right" });

  /* ---------- Footer ---------- */
  doc.line(M, PH - 22, R, PH - 22);
  font("normal", 8, MUTED);
  doc.text("This is a computer-generated invoice and does not require a signature.", M, PH - 15);
  doc.text("JB Solar Operations", R, PH - 15, { align: "right" });

  doc.save(`${inv.invoiceNumber}.pdf`);
}