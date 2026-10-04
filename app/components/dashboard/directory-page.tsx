"use client";

import { useEffect, useMemo, useState } from "react";
import { DataTable, Icon, Pagination, StatusPill } from "./ui";
import { formatCurrency, type DirectoryQuery, type DirectorySection, type PageMetadata, type RecordAction, type Row, type Section } from "./types";

export function DirectoryPage({
  section,
  rows,
  loading,
  query,
  pageMetadata,
  vendorOptions,
  onQueryChange,
  onExport,
  onToggleStatus,
  onEditRecord,
  onViewRecord,
  onDeleteRecord,
  onRestoreRecord,
  onPurgeRecord,
}: {
  section: DirectorySection;
  rows: Row[];
  loading: boolean;
  query: DirectoryQuery;
  pageMetadata?: PageMetadata;
  vendorOptions: Row[];
  onQueryChange: (query: DirectoryQuery) => void;
  onExport?: (query: DirectoryQuery) => void;
  onToggleStatus?: RecordAction;
  onEditRecord?: RecordAction;
  onViewRecord?: RecordAction;
  onDeleteRecord?: RecordAction;
  onRestoreRecord?: RecordAction;
  onPurgeRecord?: RecordAction;
}) {
  const [searchDraft, setSearchDraft] = useState(query.search);
  const columns = useMemo(() => columnsFor(section), [section]);
  const isServerPaged = section !== "Recycle Bin";
  const statusOptions = section === "Policies"
    ? ["PENDING", "ACTIVE", "EXPIRED", "CANCELLED"]
    : section === "Vendors" || section === "Agents" || section === "Plans"
      ? ["ACTIVE", "INACTIVE"]
      : [];
  const supportsVendorFilter = section === "Policies" || section === "Agents";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (searchDraft !== query.search) onQueryChange({ ...query, page: 0, search: searchDraft });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [onQueryChange, query, searchDraft]);

  const filteredRows = useMemo(() => {
    if (isServerPaged) return rows;
    const text = query.search.trim().toLowerCase();
    const filtered = rows.filter(row => {
      const matchesText = !text || Object.values(row).some(value => String(value ?? "").toLowerCase().includes(text));
      const date = String(row.deletedAt ?? "").slice(0, 10);
      const matchesFrom = !query.createdFrom || date >= query.createdFrom;
      const matchesTo = !query.createdTo || date <= query.createdTo;
      return matchesText && matchesFrom && matchesTo;
    });
    return filtered.sort((left, right) => {
      const a = left[query.sort];
      const b = right[query.sort];
      const result = String(a ?? "").localeCompare(String(b ?? ""), undefined, { numeric: true, sensitivity: "base" });
      return query.direction === "ASC" ? result : -result;
    });
  }, [isServerPaged, query.createdFrom, query.createdTo, query.direction, query.search, query.sort, rows]);
  const totalItems = isServerPaged ? pageMetadata?.totalElements ?? 0 : filteredRows.length;
  const pageCount = isServerPaged ? pageMetadata?.totalPages ?? 0 : Math.ceil(filteredRows.length / query.size);
  const page = Math.min(query.page + 1, Math.max(pageCount, 1));
  const pageRows = isServerPaged ? rows : filteredRows.slice((page - 1) * query.size, page * query.size);

  function updateQuery(changes: Partial<DirectoryQuery>) {
    onQueryChange({ ...query, ...changes, page: changes.page ?? 0 });
  }

  function clearFilters() {
    setSearchDraft("");
    onQueryChange({
      ...query,
      page: 0,
      search: "",
      status: "",
      createdFrom: "",
      createdTo: "",
      vendorId: "",
    });
  }

  return (
    <section aria-labelledby="directory-title" className="overflow-hidden rounded-[8px] border border-[#e8eae3] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0e9] px-5 py-4 sm:px-6">
        <div><h2 id="directory-title" className="text-[13px] font-semibold">{section} directory</h2><p className="mt-1 text-[11px] text-[#687266]" aria-live="polite">{totalItems} {totalItems === 1 ? "record" : "records"}</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-9 w-[min(260px,55vw)] items-center gap-2 rounded-[5px] border border-[#e5e8e0] px-2.5 text-[#92988e]">
            <Icon name="search" size={15} />
            <span className="sr-only">Search {section.toLowerCase()}</span>
            <input value={searchDraft} onChange={event => setSearchDraft(event.target.value)} placeholder={`Search ${section.toLowerCase()}...`} className="w-full min-w-0 bg-transparent text-[11px] text-[#354034] outline-none placeholder:text-[#a0a59d]" />
          </label>
          <label className="flex h-9 items-center gap-2 rounded-[5px] border border-[#e5e8e0] px-2.5 text-[10px] text-[#838a7f]">
            <span>Sort</span>
            <select aria-label={`Sort ${section.toLowerCase()} by`} value={query.sort} onChange={event => updateQuery({ sort: event.target.value })} className="max-w-[130px] bg-transparent text-[11px] text-[#354034] outline-none">
              {columns.map(column => <option key={column.key} value={column.key}>{column.label}</option>)}
            </select>
          </label>
          <label className="sr-only" htmlFor="directory-sort-direction">Sort direction</label>
          <select id="directory-sort-direction" aria-label="Sort direction" value={query.direction} onChange={event => updateQuery({ direction: event.target.value as DirectoryQuery["direction"] })} className="h-9 rounded-[5px] border border-[#e5e8e0] bg-white px-2 text-[11px] text-[#354034]">
            <option value="ASC">Ascending</option><option value="DESC">Descending</option>
          </select>
          {statusOptions.length > 0 && <label className="flex h-9 items-center gap-1.5 rounded-[5px] border border-[#e5e8e0] px-2 text-[10px] text-[#838a7f]">
            <span>Status</span>
            <select aria-label={`Filter ${section.toLowerCase()} by status`} value={query.status} onChange={event => updateQuery({ status: event.target.value })} className="bg-transparent text-[11px] text-[#354034] outline-none">
              <option value="">All</option>{statusOptions.map(status => <option key={status} value={status}>{status.toLowerCase()}</option>)}
            </select>
          </label>}
          <label className="flex h-9 items-center gap-1.5 rounded-[5px] border border-[#e5e8e0] px-2 text-[10px] text-[#838a7f]">
            <span>{section === "Recycle Bin" ? "Deleted from" : "Created from"}</span>
            <input aria-label={section === "Recycle Bin" ? "Deleted from date" : "Created from date"} type="date" max={query.createdTo || undefined} value={query.createdFrom} onChange={event => updateQuery({ createdFrom: event.target.value })} className="w-[112px] bg-transparent text-[10px] text-[#354034] outline-none" />
          </label>
          <label className="flex h-9 items-center gap-1.5 rounded-[5px] border border-[#e5e8e0] px-2 text-[10px] text-[#838a7f]">
            <span>To</span>
            <input aria-label={section === "Recycle Bin" ? "Deleted to date" : "Created to date"} type="date" min={query.createdFrom || undefined} value={query.createdTo} onChange={event => updateQuery({ createdTo: event.target.value })} className="w-[112px] bg-transparent text-[10px] text-[#354034] outline-none" />
          </label>
          {supportsVendorFilter && <label className="flex h-9 items-center gap-1.5 rounded-[5px] border border-[#e5e8e0] px-2 text-[10px] text-[#838a7f]">
            <span>Vendor</span>
            <select aria-label="Filter by vendor" value={query.vendorId} onChange={event => updateQuery({ vendorId: event.target.value })} className="max-w-[140px] bg-transparent text-[11px] text-[#354034] outline-none">
              <option value="">All vendors</option>{vendorOptions.map(vendor => <option key={String(vendor.id)} value={String(vendor.id)}>{String(vendor.name ?? vendor.fullName ?? vendor.id)}</option>)}
            </select>
          </label>}
          {(query.search || query.status || query.createdFrom || query.createdTo || query.vendorId) && <button type="button" onClick={clearFilters} className="h-9 rounded-[5px] px-2 text-[10px] font-semibold text-[#477e50] hover:bg-[#f3f5f0]">Clear filters</button>}
          {onExport && <button type="button" onClick={() => onExport({ ...query, search: searchDraft })} aria-label={`Export filtered ${section.toLowerCase()}`} title={`Export filtered ${section.toLowerCase()}`} className="grid h-9 w-9 place-items-center rounded-[5px] border border-[#e5e8e0] text-[#667162] transition hover:bg-[#f5f7f1]"><Icon name="download" size={15} /></button>}
        </div>
      </div>
      <DataTable caption={`${section} directory`} rows={pageRows} columns={columns} loading={loading} onToggleStatus={onToggleStatus} onEditRecord={onEditRecord} onViewRecord={onViewRecord} onDeleteRecord={onDeleteRecord} onRestoreRecord={onRestoreRecord} onPurgeRecord={onPurgeRecord} />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0e9] px-5 py-3.5 sm:px-6">
        <Pagination
          currentPage={page}
          pageSize={query.size}
          totalItems={totalItems}
          totalPages={pageCount}
          onPageChange={nextPage => onQueryChange({ ...query, page: Math.min(Math.max(nextPage, 1), Math.max(pageCount, 1)) - 1 })}
          onPageSizeChange={size => onQueryChange({ ...query, size, page: 0 })}
        />
        <span className="text-[10px] text-[#838a7f]">Synced with JB Solar API</span>
      </div>
    </section>
  );
}

export function columnsFor(section: Section) {
  if (section === "Recycle Bin") return [
    { key: "label", label: "RECORD" },
    { key: "resource", label: "RESOURCE" },
    { key: "deletedAt", label: "DELETED", render: (row: Row) => row.deletedAt ? new Date(String(row.deletedAt)).toLocaleString("en-IN") : "—" },
  ];
  if (section === "Policies") return [
    { key: "policyNumber", label: "POLICY" }, { key: "farmerName", label: "FARMER" }, { key: "planName", label: "PLAN" },
    { key: "startDate", label: "START DATE", render: (row: Row) => new Date(String(row.startDate)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
    { key: "totalAmount", label: "PREMIUM", render: (row: Row) => formatCurrency(Number(row.totalAmount)) },
    { key: "status", label: "STATUS", render: (row: Row) => <StatusPill status={String(row.status)} /> },
  ];
  if (section === "Farmers") return [
    { key: "customerCode", label: "CUSTOMER ID" }, { key: "fullName", label: "FARMER" }, { key: "mobile", label: "MOBILE" }, { key: "district", label: "DISTRICT" },
    { key: "createdAt", label: "JOINED", render: (row: Row) => row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString("en-IN") : "Recently" },
  ];
  if (section === "Vendors") return [
    { key: "name", label: "VENDOR" }, { key: "contactPerson", label: "CONTACT PERSON" }, { key: "mobile", label: "MOBILE" }, { key: "email", label: "EMAIL" },
    { key: "status", label: "STATUS", render: (row: Row) => <StatusPill status={String(row.status)} /> },
  ];
  if (section === "Agents") return [
    { key: "fullName", label: "AGENT" }, { key: "vendorName", label: "VENDOR" }, { key: "mobile", label: "MOBILE" },
    { key: "status", label: "STATUS", render: (row: Row) => <StatusPill status={String(row.status)} /> },
  ];
  return [
    { key: "name", label: "PLAN" }, { key: "durationMonths", label: "DURATION", render: (row: Row) => `${row.durationMonths} months` },
    { key: "price", label: "BASE PRICE", render: (row: Row) => formatCurrency(Number(row.price)) }, { key: "gstPercentage", label: "GST", render: (row: Row) => `${row.gstPercentage}%` },
    { key: "status", label: "STATUS", render: (row: Row) => <StatusPill status={String(row.status)} /> },
  ];
}
