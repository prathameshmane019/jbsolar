"use client";

import { useState, type ReactNode } from "react";
 
import { formatCurrency, type Row } from "./dashboard/types";
import { formatDate, type InvoiceData } from "./../InvoicePDF";
import { Icon, Modal } from "./dashboard/ui";

function Pair({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0">
    <dt className="text-[9px] font-semibold uppercase tracking-[0.7px] text-[#879188]">{label}</dt>
    <dd className="mt-1 break-words text-[11px] font-medium leading-4 text-[#26362e]">{children || "-"}</dd>
  </div>;
}

export function InvoiceDialog({ row, loading = false, onClose, onDownload }: {
  row: Row;
  loading?: boolean;
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

  return <Modal title="Invoice details" onClose={onClose} wide>
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-[8px] bg-[#142d26] px-5 py-5 text-white sm:px-6">
        <div aria-hidden="true" className="absolute -right-8 -top-12 h-40 w-40 rounded-full border-[22px] border-white/[0.04]" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[1.5px] text-[#c0d3c8]">JB Solar · Policy Services</p>
            <h2 className="mt-2 text-[19px] font-semibold tracking-[0.2px]">Invoice {inv.invoiceNumber}</h2>
            <p className="mt-1 text-[10px] text-white/65">Issued {formatDate(inv.invoiceDate)}</p>
          </div>
          <div className="min-w-[140px] text-left sm:text-right">
            <p className="text-[9px] font-semibold uppercase tracking-[1px] text-white/60">{paid ? "Total paid" : "Total due"}</p>
            <p className="mt-1 text-[23px] font-semibold tracking-[-0.4px] text-[#c0de7b]">{formatCurrency(Number(inv.totalAmount))}</p>
            <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.5px] ${paid ? "bg-[#e5f3eb] text-[#27694c]" : "bg-white/15 text-white"}`}>
              {paid ? "Paid" : "Payment pending"}
            </span>
          </div>
        </div>
      </header>

      {loading && <p role="status" className="text-[11px] text-[#687266]">Loading invoice details...</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        <section aria-labelledby="invoice-billed-to" className="rounded-[7px] border border-[#e4eae5] bg-[#f7f9f7] p-4">
          <h3 id="invoice-billed-to" className="text-[9px] font-semibold uppercase tracking-[1px] text-[#56806a]">Billed to</h3>
          <p className="mt-2 text-[13px] font-semibold text-[#26362e]">{inv.farmerName || "—"}</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
            <Pair label="Customer ID">{inv.farmerCode}</Pair>
            <Pair label="Mobile">{inv.farmerMobile}</Pair>
            <div className="col-span-2"><Pair label="Address">{inv.farmerAddress}</Pair></div>
          </dl>
        </section>
        <section aria-labelledby="invoice-issued-by" className="rounded-[7px] border border-[#e4eae5] bg-[#f7f9f7] p-4">
          <h3 id="invoice-issued-by" className="text-[9px] font-semibold uppercase tracking-[1px] text-[#56806a]">Issued by</h3>
          <p className="mt-2 text-[13px] font-semibold text-[#26362e]">{inv.vendorName || "—"}</p>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
            <Pair label="Vendor ID">{inv.vendorCode}</Pair>
            <Pair label="Mobile">{inv.vendorMobile}</Pair>
            <div className="col-span-2"><Pair label="Email">{inv.vendorEmail}</Pair></div>
          </dl>
        </section>
      </div>

      <section aria-labelledby="invoice-coverage" className="overflow-hidden rounded-[7px] border border-[#e4eae5]">
        <div className="flex items-center justify-between gap-3 border-b border-[#e4eae5] bg-[#f7f9f7] px-4 py-3">
          <h3 id="invoice-coverage" className="text-[9px] font-semibold uppercase tracking-[1px] text-[#56806a]">Policy coverage</h3>
          <span className={`rounded-full px-2 py-1 text-[9px] font-semibold uppercase ${paid ? "bg-[#e5f3eb] text-[#27694c]" : "bg-[#f1f2ef] text-[#69746d]"}`}>{paid ? "Payment received" : "Awaiting payment"}</span>
        </div>
        <dl className="grid grid-cols-2 gap-x-5 gap-y-4 p-4 sm:grid-cols-3">
          <Pair label="Policy number">{inv.policyNumber}</Pair>
          <Pair label="Plan">{inv.planName}</Pair>
          <Pair label="Plan code">{inv.planCode}</Pair>
          <Pair label="Coverage period">{`${formatDate(inv.policyStartDate)} – ${formatDate(inv.policyEndDate)}`}</Pair>
          <Pair label="Duration">{inv.durationMonths ? `${inv.durationMonths} months` : undefined}</Pair>
          <Pair label="Pump configuration">
            {inv.pumpPowerHp ? `${inv.pumpPowerHp} HP${inv.motorHeadMeters ? ` · ${inv.motorHeadMeters} m head` : ""}` : undefined}
          </Pair>
        </dl>
      </section>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(230px,0.8fr)]">
        <section aria-labelledby="invoice-payment" className="rounded-[7px] border border-[#e4eae5] p-4">
          <h3 id="invoice-payment" className="text-[9px] font-semibold uppercase tracking-[1px] text-[#56806a]">Payment information</h3>
          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4">
            <Pair label="Payment number">{inv.paymentNumber}</Pair>
            <Pair label="Method">{inv.paymentMethod}</Pair>
            <Pair label="Gateway">{inv.gateway}</Pair>
            <Pair label="Transaction reference">{inv.gatewayPaymentId}</Pair>
            <Pair label="Paid on">{formatDate(inv.paidAt)}</Pair>
          </dl>
        </section>
        <section aria-label="Invoice totals" className="rounded-[7px] bg-[#f2f6f2] p-4">
          <h3 className="text-[9px] font-semibold uppercase tracking-[1px] text-[#56806a]">Amount summary</h3>
          <div className="mt-4 space-y-3 text-[11px]">
            <div className="flex justify-between gap-3 text-[#68766e]"><span>Subtotal</span><span className="font-medium text-[#26362e]">{formatCurrency(Number(inv.amount))}</span></div>
            <div className="flex justify-between gap-3 text-[#68766e]"><span>GST{inv.gstPercentage != null ? ` (${Number(inv.gstPercentage)}%)` : ""}</span><span className="font-medium text-[#26362e]">{formatCurrency(Number(inv.gstAmount))}</span></div>
            <div className="flex justify-between gap-3 border-t border-[#d9e2da] pt-3 text-[12px] font-semibold text-[#203d2d]"><span>Total</span><span>{formatCurrency(Number(inv.totalAmount))}</span></div>
          </div>
        </section>
      </div>

      <div className="flex justify-end gap-2 border-t border-[#edf0e9] pt-4">
        <button type="button" onClick={onClose} className="h-9 rounded-[5px] px-3 text-[11px] font-semibold text-[#626b60] hover:bg-[#f1f3ee]">Close</button>
        <button type="button" onClick={() => void download()} disabled={busy || loading} aria-busy={busy || loading} className="inline-flex h-9 items-center gap-2 rounded-[5px] bg-[#27694c] px-4 text-[11px] font-semibold text-white hover:bg-[#20593f] disabled:cursor-wait disabled:opacity-60">
          {busy ? <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Icon name="download" size={14} />}
          {busy ? "Preparing PDF..." : "Download PDF"}
        </button>
      </div>
    </div>
  </Modal>;
}