"use client";

import { useState } from "react";
import { Icon} from "./dashboard/ui";

import { downloadInvoicePdf, type InvoiceData } from "./../InvoicePDF";
import { Row } from "./dashboard/types";

/** Row-level "download PDF" button used by the Invoices table. Keeps its own loading and error state. */
export function InvoiceDownloadButton({ row }: { row: Row }) {
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const invoiceNumber = String(row.invoiceNumber ?? "invoice");

  async function download() {
    if (state === "busy") return;
    setState("busy");
    try {
      await downloadInvoicePdf(row as unknown as InvoiceData);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return <button
    type="button"
    onClick={() => void download()}
    disabled={state === "busy"}
    aria-busy={state === "busy"}
    aria-label={`Download PDF for ${invoiceNumber}`}
    title={state === "error" ? "Could not create the PDF. Click to try again." : "Download PDF"}
    className={`grid h-8 w-8 place-items-center rounded-[5px] transition hover:bg-[#f1f5ee] disabled:cursor-wait disabled:opacity-60 ${state === "error" ? "text-[#a44c3a]" : "text-[#477e50]"}`}
  >
    {state === "busy"
      ? <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#cfe0cb] border-t-[#285c3b]" />
      : <Icon name="download" size={15} />}
  </button>;
}