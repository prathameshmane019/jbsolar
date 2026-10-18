"use client";

import { useState, type FormEvent } from "react"; 
import { formatCurrency, type DirectoryQuery, type PageMetadata, type Row } from "./components/dashboard/types";
import { formatDate, type InvoiceData } from "./InvoicePDF";
import { Icon } from "./components/dashboard/ui";

function SortHead({ field, label, align = "left", query, onSort }: {
  field: string;
  label: string;
  align?: "left" | "right";
  query: DirectoryQuery;
  onSort: (field: string) => void;
}) {
  const active = query.sort === field;
  return <th scope="col" aria-sort={active ? (query.direction === "ASC" ? "ascending" : "descending") : "none"} className={`px-5 py-3 font-semibold ${align === "right" ? "text-right" : "text-left"}`}>
    <button type="button" onClick={() => onSort(field)} className={`inline-flex items-center gap-1 hover:text-[#20261f] ${active ? "text-[#20261f]" : ""}`}>
      {label}<span aria-hidden="true" className="text-[9px]">{active ? (query.direction === "ASC" ? "▲" : "▼") : ""}</span>
    </button>
  </th>;
}

export function InvoicesPage({ rows, loading, query, pageMetadata, onQueryChange, onView, onDownload }: {
  rows: Row[];
  loading: boolean;
  query: DirectoryQuery;
  pageMetadata?: PageMetadata;
  onQueryChange: (query: DirectoryQuery) => void;
  onView: (row: Row) => void;
  onDownload: (row: Row) => Promise<void>;
}) {
  const [search, setSearch] = useState(query.search ?? "");
  const [busyId, setBusyId] = useState<string | null>(null);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onQueryChange({ ...query, search: search.trim(), page: 0 });
  }

  function toggleSort(field: string) {
    const ascending = query.sort === field && query.direction === "ASC";
    onQueryChange({ ...query, sort: field, direction: ascending ? "DESC" : "ASC", page: 0 });
  }

  async function download(row: Row) {
    const id = String(row.id);
    if (busyId) return;
    setBusyId(id);
    try { await onDownload(row); } finally { setBusyId(null); }
  }

  const total = pageMetadata?.totalElements ?? rows.length;
  const size = pageMetadata?.size ?? query.size;
  const page = pageMetadata?.page ?? query.page;
  const totalPages = pageMetadata?.totalPages ?? 1;
  const from = total === 0 ? 0 : page * size + 1;
  const to = Math.min((page + 1) * size, total);

  return <section aria-label="Invoices" className="overflow-hidden rounded-[8px] border border-[#e8eae3] bg-white">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eceee9] px-5 py-4">
      <form onSubmit={submitSearch} role="search" className="flex w-full max-w-[420px] gap-2">
        <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by invoice, policy or farmer" aria-label="Search invoices" className="min-w-0 flex-1" />
        <button type="submit" className="h-9 shrink-0 rounded-[5px] bg-[#285c3b] px-4 text-[11px] font-semibold text-white hover:bg-[#1f4d31]">Search</button>
        {query.search && <button type="button" onClick={() => { setSearch(""); onQueryChange({ ...query, search: "", page: 0 }); }} className="h-9 shrink-0 rounded-[5px] px-3 text-[11px] font-semibold text-[#626b60] hover:bg-[#f1f3ee]">Clear</button>}
      </form>
      <p className="text-[11px] text-[#687266]">{total.toLocaleString("en-IN")} invoice{total === 1 ? "" : "s"}</p>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-[12px]">
        <caption className="sr-only">Invoices</caption>
        <thead className="bg-[#f7f8f4] text-[11px] text-[#687266]">
          <tr>
            <SortHead field="invoiceNumber" label="Invoice" query={query} onSort={toggleSort} />
            <th scope="col" className="px-5 py-3 text-left font-semibold">Farmer</th>
            <th scope="col" className="px-5 py-3 text-left font-semibold">Plan</th>
            <SortHead field="invoiceDate" label="Date" query={query} onSort={toggleSort} />
            <SortHead field="totalAmount" label="Total" align="right" query={query} onSort={toggleSort} />
            <th scope="col" className="px-5 py-3 text-right font-semibold"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eff1ec]">
          {rows.map(row => {
            const inv = row as unknown as InvoiceData;
            const busy = busyId === String(row.id);
            return <tr key={String(row.id)} className="hover:bg-[#fafbf8]">
              <td className="px-5 py-3.5"><p className="font-semibold text-[#20261f]">{inv.invoiceNumber}</p><p className="mt-0.5 text-[11px] text-[#788276]">{inv.policyNumber}</p></td>
              <td className="px-5 py-3.5"><p className="text-[#20261f]">{inv.farmerName}</p><p className="mt-0.5 text-[11px] text-[#788276]">{inv.vendorName}</p></td>
              <td className="px-5 py-3.5 text-[#435143]">{inv.planName}</td>
              <td className="whitespace-nowrap px-5 py-3.5 text-[#435143]">{formatDate(inv.invoiceDate)}</td>
              <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold text-[#20261f]">{formatCurrency(Number(inv.totalAmount))}</td>
              <td className="whitespace-nowrap px-5 py-3.5 text-right">
                <button type="button" onClick={() => onView(row)} className="rounded-[5px] px-2.5 py-1.5 text-[11px] font-semibold text-[#477e50] hover:bg-[#f1f5ee]">View</button>
                <button type="button" onClick={() => void download(row)} disabled={Boolean(busyId)} aria-busy={busy} aria-label={`Download PDF for ${inv.invoiceNumber}`} title="Download PDF" className="ml-1 inline-grid h-8 w-8 place-items-center rounded-[5px] text-[#477e50] hover:bg-[#f1f5ee] disabled:cursor-wait disabled:opacity-50">
                  {busy ? <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#cfe0cb] border-t-[#285c3b]" /> : <Icon name="download" size={15} />}
                </button>
              </td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>

    {rows.length === 0 && <div role="status" className="px-5 py-14 text-center">
      <p className="text-[13px] font-semibold text-[#20261f]">{loading ? "Loading invoices..." : query.search ? "No invoices match your search" : "No invoices yet"}</p>
      {!loading && <p className="mt-1.5 text-[12px] text-[#687266]">{query.search ? "Try a different invoice number, policy number or farmer name." : "An invoice appears here after a policy payment succeeds."}</p>}
    </div>}

    {rows.length > 0 && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#eceee9] px-5 py-3 text-[11px] text-[#687266]">
      <span>Showing {from}-{to} of {total.toLocaleString("en-IN")}</span>
      <div className="flex items-center gap-2">
        <button type="button" disabled={page <= 0 || loading} onClick={() => onQueryChange({ ...query, page: page - 1 })} className="h-8 rounded-[5px] border border-[#dfe3da] px-3 font-semibold text-[#435143] hover:bg-[#f5f7f1] disabled:opacity-50">Previous</button>
        <span>Page {page + 1} of {Math.max(1, totalPages)}</span>
        <button type="button" disabled={page + 1 >= totalPages || loading} onClick={() => onQueryChange({ ...query, page: page + 1 })} className="h-8 rounded-[5px] border border-[#dfe3da] px-3 font-semibold text-[#435143] hover:bg-[#f5f7f1] disabled:opacity-50">Next</button>
      </div>
    </div>}
  </section>;
}