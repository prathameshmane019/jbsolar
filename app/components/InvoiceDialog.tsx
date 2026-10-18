"use client";

import { useState, type ReactNode } from "react";
 
import { formatCurrency, type Row } from "./dashboard/types";
import { formatDate, type InvoiceData } from "./../InvoicePDF";
import { Icon, Modal } from "./dashboard/ui";

function Pair({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0">
    <dt className="text-[10px] font-medium text-[#788276]">{label}</dt>
    <dd className="mt-0.5 break-words text-[12px] font-medium text-[#20261f]">{children || "-"}</dd>
  </div>;
}

export function InvoiceDialog({ row, onClose, onDownload }: {
  row: Row;
  onClose: () => void;
  onDownload: (row: Row) => Promise<void>;
}) {
  const inv = row as unknown as InvoiceData;
  const [busy, setBusy] = useState(false);

  async function download() {
    if (busy) return;
    setBusy(true);
    try { await onDownload(row); } finally { setBusy(false); }
  }

  const paid = Boolean(inv.paidAt);

  return <Modal title={`Invoice ${inv.invoiceNumber}`} onClose={onClose}>
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-[6px] bg-[#163b2d] px-4 py-3 text-white">
        <div>
          <p className="text-[10px] text-white/60">Total</p>
          <p className="text-[20px] font-semibold text-[#c5e86c]">{formatCurrency(Number(inv.totalAmount))}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${paid ? "bg-[#e2f1d6] text-[#285c3b]" : "bg-white/15 text-white"}`}>{paid ? "Paid" : "Pending"}</span>
      </div>

      <dl className="grid grid-cols-2 gap-x-5 gap-y-3 rounded-[6px] border border-[#e8eae3] p-4">
        <Pair label="Invoice date">{formatDate(inv.invoiceDate)}</Pair>
        <Pair label="Policy number">{inv.policyNumber}</Pair>
        <Pair label="Billed to">{inv.farmerName}</Pair>
        <Pair label="Farmer mobile">{inv.farmerMobile}</Pair>
        <Pair label="Issued by">{inv.vendorName}</Pair>
        <Pair label="Plan">{inv.planName}</Pair>
        <Pair label="Policy period">{`${formatDate(inv.policyStartDate)} to ${formatDate(inv.policyEndDate)}`}</Pair>
        <Pair label="Payment number">{inv.paymentNumber}</Pair>
        <Pair label="Payment method">{inv.paymentMethod}</Pair>
        <Pair label="Paid on">{formatDate(inv.paidAt)}</Pair>
      </dl>

      <div className="space-y-1.5 rounded-[6px] bg-[#f4f7f0] px-4 py-3 text-[12px]">
        <div className="flex justify-between text-[#626c60]"><span>Subtotal</span><span>{formatCurrency(Number(inv.amount))}</span></div>
        <div className="flex justify-between text-[#626c60]"><span>GST{inv.gstPercentage != null ? ` (${Number(inv.gstPercentage)}%)` : ""}</span><span>{formatCurrency(Number(inv.gstAmount))}</span></div>
        <div className="flex justify-between border-t border-[#dfe5d8] pt-1.5 font-semibold text-[#20261f]"><span>Total</span><span>{formatCurrency(Number(inv.totalAmount))}</span></div>
      </div>

      <div className="flex justify-end gap-2 border-t border-[#edf0e9] pt-4">
        <button type="button" onClick={onClose} className="h-9 rounded-[5px] px-3 text-[11px] font-semibold text-[#626b60] hover:bg-[#f1f3ee]">Close</button>
        <button type="button" onClick={() => void download()} disabled={busy} aria-busy={busy} className="inline-flex h-9 items-center gap-2 rounded-[5px] bg-[#285c3b] px-4 text-[11px] font-semibold text-white hover:bg-[#1f4d31] disabled:cursor-wait disabled:opacity-60">
          {busy ? <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Icon name="download" size={14} />}
          {busy ? "Preparing PDF..." : "Download PDF"}
        </button>
      </div>
    </div>
  </Modal>;
}