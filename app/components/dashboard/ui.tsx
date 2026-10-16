"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { PAGE_SIZE_OPTIONS, type IconName, type Row, type TableColumn } from "./types";

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  const paths: Record<IconName, ReactNode> = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    file: <><path d="M13 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V9z" /><path d="M13 3v6h6M8 14h8M8 17h8" /></>,
    users: <><path d="M16 21v-1.7a3.3 3.3 0 0 0-3.3-3.3H6.3A3.3 3.3 0 0 0 3 19.3V21" /><circle cx="9.5" cy="7" r="3.5" /><path d="M17 11a3.5 3.5 0 0 0 0-7M21 21v-1.7a3.3 3.3 0 0 0-2.5-3.2" /></>,
    building: <><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M9 21v-4h6v4M8 7h1m6 0h1M8 11h1m6 0h1" /></>,
    badge: <><circle cx="12" cy="8" r="5" /><path d="m8.5 12-1 9 4.5-2.5 4.5 2.5-1-9M10 8l1.3 1.3L14 6.8" /></>,
    layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 18v3h16v-3" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
    refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9A7 7 0 0 1 18 6.5L20 12M4 12l2 5.5A7 7 0 0 0 18.4 15" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    trash: <><path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" /></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

export function StatusPill({ status }: { status?: string }) {
  const style = status === "ACTIVE" ? "bg-[#e5f4eb] text-[#29764e]" : status === "PENDING" ? "bg-[#fff4db] text-[#a36c0b]" : status === "EXPIRED" || status === "INACTIVE" ? "bg-[#f0f1ee] text-[#73776f]" : "bg-[#fde9e7] text-[#b74b3d]";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${style}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{status?.toLowerCase()}</span>;
}

export function Metric({ label, value, note, icon, tint }: { label: string; value: string; note: string; icon: IconName; tint: "green" | "yellow" | "blue" | "coral" }) {
  const tints: Record<typeof tint, string> = { green: "bg-[#e8f2e7] text-[#447c4d]", yellow: "bg-[#fbf1d9] text-[#9b7c2b]", blue: "bg-[#e5efed] text-[#4a7b72]", coral: "bg-[#f8e9e3] text-[#a96b4f]" };
  return <div className="rounded-[8px] border border-[#e8eae3] bg-white p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><p className="text-[11px] font-medium text-[#687266]">{label}</p><span className={`grid h-8 w-8 place-items-center rounded-[6px] ${tints[tint]}`}><Icon name={icon} size={16} /></span></div><p className="mt-3 text-[25px] font-semibold leading-none tracking-[-0.5px] text-[#202820]">{value}</p><div className="mt-3 flex min-h-[13px] flex-wrap items-center gap-1.5 text-[10px] text-[#626c60]">{note}</div></div>;
}

export function DataTable({ rows, columns, loading, caption = "Records", onToggleStatus, onEditRecord, onViewRecord, onDeleteRecord, onRestoreRecord, onPurgeRecord }: { rows: Row[]; columns: TableColumn[]; loading: boolean; caption?: string; onToggleStatus?: (row: Row) => void; onEditRecord?: (row: Row) => void; onViewRecord?: (row: Row) => void; onDeleteRecord?: (row: Row) => void; onRestoreRecord?: (row: Row) => void; onPurgeRecord?: (row: Row) => void }) {
  const hasActions = Boolean(onToggleStatus || onEditRecord || onViewRecord || onDeleteRecord || onRestoreRecord || onPurgeRecord);
  const columnCount = columns.length + Number(hasActions);
  return <div className="overflow-x-auto" tabIndex={0} aria-label="Scrollable records table">
    <table className="w-full min-w-[670px] border-collapse text-left">
      <caption className="sr-only">{caption}</caption>
      <thead>
        <tr className="border-y border-[#edf0e9] bg-[#fafbf8]">{columns.map(column =>
          <th scope="col" key={column.key} className="px-5 py-3 text-[9px] font-semibold tracking-[0.9px] text-[#626c60] sm:px-6">{column.label}</th>
        )}{hasActions && <th scope="col" className="px-5 py-3 text-[9px] font-semibold tracking-[0.9px] text-[#626c60]">ACTIONS</th>}</tr>
      </thead>
      <tbody>{loading && rows.length === 0 ? <tr>
        <td colSpan={columnCount} className="px-6 py-12 text-center text-[12px] text-[#687266]">Loading records...</td>
      </tr> : rows.length === 0 ? <tr>
        <td colSpan={columnCount} className="px-6 py-12 text-center text-[12px] text-[#687266]">No records found.</td>
      </tr> : rows.map((row, index) => <tr key={String(row.id ?? index)} className="border-b border-[#f0f1ed] last:border-0 transition-colors hover:bg-[#fbfcf9]">{columns.map((column, cellIndex) => <td key={column.key} className={`whitespace-nowrap px-5 py-3.5 text-[11px] sm:px-6 ${cellIndex === 0 ? "font-semibold text-[#313a30]" : "text-[#687266]"}`}>{column.render ? column.render(row) : String(row[column.key] ?? "—")}</td>)}{hasActions && <td className="px-5 py-3.5"><div className="flex items-center gap-3">{onViewRecord &&
        <button type="button" onClick={() => onViewRecord(row)} aria-label={`View ${String(row.fullName ?? row.name ?? row.policyNumber ?? row.label ?? "record")}`} className="rounded p-1 text-[#596959] hover:bg-[#edf2e9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#477e50]"><Icon name="eye" size={15} /></button>
      }{onToggleStatus && <button type="button" onClick={() => onToggleStatus(row)} aria-label={`${row.status === "ACTIVE" ? "Deactivate" : "Activate"} ${String(row.name ?? row.fullName ?? "record")}`} className="text-[10px] font-semibold text-[#477e50] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#477e50]">{row.status === "ACTIVE" ? "Deactivate" : "Activate"}</button>
        }{onEditRecord &&
          <button type="button" onClick={() => onEditRecord(row)} aria-label={`Edit ${String(row.fullName ?? row.name ?? row.policyNumber ?? "record")}`} className="text-[10px] font-semibold text-[#477e50] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#477e50]">Edit</button>
        }{onDeleteRecord &&
          <button type="button" onClick={() => onDeleteRecord(row)} aria-label={`Delete ${String(row.fullName ?? row.name ?? row.policyNumber ?? "record")}`} className="rounded p-1 text-[#a94335] hover:bg-[#fbefec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a94335]"><Icon name="trash" size={15} /></button>
        }{onRestoreRecord && <button type="button" onClick={() => onRestoreRecord(row)} aria-label={`Restore ${String(row.label ?? "record")}`} className="rounded p-1 text-[#477e50] hover:bg-[#edf2e9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#477e50]"><Icon name="refresh" size={15} /></button>}{onPurgeRecord &&
          <button type="button" onClick={() => onPurgeRecord(row)} aria-label={`Permanently delete ${String(row.label ?? "record")}`} className="rounded p-1 text-[#a94335] hover:bg-[#fbefec] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#a94335]"><Icon name="trash" size={15} /></button>
        }</div>
      </td>}
      </tr>)
      }</tbody>
    </table>
  </div>;
}

export function Pagination({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const firstItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);
  const pages: (number | "ellipsis")[] = totalPages <= 5
    ? Array.from({ length: totalPages }, (_, index) => index + 1)
    : currentPage <= 3
      ? [1, 2, 3, 4, "ellipsis", totalPages]
      : currentPage >= totalPages - 2
        ? [1, "ellipsis", totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
        : [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", totalPages];

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-[#838a7f]">
      <span aria-live="polite">Showing {firstItem}–{lastItem} of {totalItems}</span>
      <label className="flex items-center gap-1.5">
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={event => onPageSizeChange(Number(event.target.value))}
          className="rounded border border-[#e5e8e0] bg-white px-1.5 py-1 text-[10px] text-[#354034] outline-none focus:border-[#6e9b70]"
        >
          {PAGE_SIZE_OPTIONS.map(size => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} className="rounded px-2 py-1.5 font-medium text-[#596959] hover:bg-[#f3f5f0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#477e50] disabled:cursor-not-allowed disabled:text-[#b7bcb2] disabled:hover:bg-transparent">Previous</button>
        {pages.map((item, index) => item === "ellipsis"
          ? <span key={`ellipsis-${index}`} aria-hidden="true" className="px-1">…</span>
          : <button key={item} type="button" onClick={() => onPageChange(item)} aria-label={`Page ${item}`} aria-current={item === currentPage ? "page" : undefined} className={`grid h-7 min-w-7 place-items-center rounded px-1.5 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#477e50] ${item === currentPage ? "bg-[#e8f0e5] text-[#285c3b]" : "text-[#596959] hover:bg-[#f3f5f0]"}`}>{item}</button>)}
        <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= totalPages} className="rounded px-2 py-1.5 font-medium text-[#596959] hover:bg-[#f3f5f0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#477e50] disabled:cursor-not-allowed disabled:text-[#b7bcb2] disabled:hover:bg-transparent">Next</button>
      </nav>
    </div>
  );
}

const HIDDEN_KEYS = new Set(["id", "resource", "createdBy", "deletedAt"]);

const isInternalKey = (key: string) => HIDDEN_KEYS.has(key) || key.endsWith("Id");

// Order and labels for the fields you want to show first.
const LABELS: Record<string, string> = {
  policyNumber: "Policy number",
  farmerName: "Farmer",
  farmerCode: "Farmer ID",
  planName: "Plan",
  planCode: "Plan code",
  vendorName: "Vendor",
  vendorCode: "Vendor code",
  agentName: "Agent",
  agentCode: "Agent ID",
  startDate: "Start date",
  endDate: "End date",
  amount: "Base amount",
  gstAmount: "GST amount",
  totalAmount: "Total premium",
  pumpPowerHp: "Pump power (HP)",
  motorHeadMeters: "Motor head (m)",
};

const prettyKey = (key: string) =>
  LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/_/g, " ").replace(/^./, c => c.toUpperCase());

const DATE_KEYS = new Set(["startDate", "endDate"]);
const DATETIME_KEYS = new Set(["createdAt", "updatedAt", "purchasedAt", "deletedAt"]);

function formatValue(key: string, value: unknown): string {
  if (typeof value === "object") return JSON.stringify(value);
  const text = String(value);
  if (DATE_KEYS.has(key)) {
    return new Date(text + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }
  if (DATETIME_KEYS.has(key)) {
    return new Date(text).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  return text;
}
export function RecordDetails({ record, loading }: { record: Row; loading: boolean }) {
  const known = Object.keys(LABELS);
  const entries = Object.entries(record)
    .filter(([key, value]) => !isInternalKey(key) && value !== null && value !== undefined && value !== "")
    .sort(([a], [b]) => {
      const ia = known.indexOf(a), ib = known.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });

  return <div>
    {loading && <p role="status" className="mb-4 text-[11px] text-[#687266]">Loading full record...</p>}
    <dl className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
      {entries.map(([key, value]) => (
        <div key={key} className="min-w-0">
          <dt className="text-[9px] font-semibold uppercase tracking-[0.8px] text-[#92988e]">{prettyKey(key)}</dt>
          <dd className="mt-1 break-words text-[12px] font-medium text-[#354034]">
           {key === "status" ? <StatusPill status={String(value)} /> : formatValue(key, value)}
          </dd>
        </div>
      ))}
    </dl>
  </div>;
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return <dialog ref={dialogRef} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }} className="fixed inset-0 m-0 h-dvh w-dvw max-h-none max-w-none bg-transparent p-4 backdrop:bg-[#152016]/40">
    <div className="grid min-h-full place-items-center" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="max-h-[90vh] w-full max-w-[470px] overflow-y-auto rounded-[9px] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#edf0e9] px-5 py-4"><h2 id={titleId} className="text-[15px] font-semibold">{title}</h2><button type="button" aria-label="Close dialog" onClick={onClose} className="rounded p-1.5 text-[#798174] hover:bg-[#f2f4ef]"><Icon name="close" size={17} /></button></div>
        <div className="p-5">{children}</div>
      </section>
    </div>
  </dialog>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-[11px] font-semibold text-[#495248]">{label}</span><span className="block [&_input]:h-10 [&_input]:w-full [&_input]:rounded-[5px] [&_input]:border [&_input]:border-[#dfe3da] [&_input]:bg-white [&_input]:px-3 [&_input]:text-[12px] [&_input]:text-[#354034] [&_input]:outline-none [&_input]:placeholder:text-[#a0a59d] [&_input]:focus:border-[#6e9b70] [&_input]:focus:ring-2 [&_input]:focus:ring-[#6e9b70]/15 [&_select]:h-10 [&_select]:w-full [&_select]:rounded-[5px] [&_select]:border [&_select]:border-[#dfe3da] [&_select]:bg-white [&_select]:px-3 [&_select]:text-[12px] [&_select]:text-[#354034] [&_select]:outline-none">{children}</span></label>;
}
