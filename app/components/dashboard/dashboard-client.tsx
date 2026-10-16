"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { DashboardShell } from "./dashboard-shell";
import { DirectoryPage } from "./directory-page";
import { OverviewPage } from "./overview-page";
import { CreateForm, type EditableSection } from "./record-forms";
import { RecordDeleteDialog, RecordDetailsDialog, RecordEditDialog, RecycleBinPurgeDialog } from "./record-dialogs";
import { Field, Icon, Modal } from "./ui";
import { apiDownload, apiRequest, ApiError, normalizePageResponse, serializeDirectoryQuery } from "./api";
import {
  API_URL,
  apiResourceBySection,
  dataKeyByApiResource,
  emptyData,
  endpointBySection,
  getRows,
  initialDirectoryQueries,
  initialRecycleBinQuery,
  sectionByApiResource,
  type DirectoryQuery,
  type DirectorySection,
  type AuthState,
  type ListSection,
  type NormalizedPageResponse,
  type PageMetadata,
  type PageResponse,
  type ReferenceData,
  type ResourceData,
  type Row,
  type RecordSelection,
  type Section,
  recordLabel,
} from "./types";

async function fetchPage<T extends Row>(
  path: string,
  token: string,
  query: DirectoryQuery,
  suffix = "",
): Promise<NormalizedPageResponse<T>> {
  const queryString = serializeDirectoryQuery(query);
  const response = await apiRequest<PageResponse<T>>(`${path}?${queryString}${suffix}`, token);
  return normalizePageResponse(response, query.page, query.size);
}

function pageInfo<T extends Row>(page: NormalizedPageResponse<T>): PageMetadata {
  return {
    page: page.page,
    size: page.size,
    totalElements: page.totalElements,
    totalPages: page.totalPages,
  };
}

export default function DashboardClient() {
  const [section, setSection] = useState<Section>("Overview");
  const [data, setData] = useState<ResourceData>(emptyData);
  const [directoryQueries, setDirectoryQueries] = useState<Record<DirectorySection, DirectoryQuery>>({
    ...initialDirectoryQueries,
    "Recycle Bin": initialRecycleBinQuery,
  });
  const directoryQueriesRef = useRef(directoryQueries);
  const [directoryRows, setDirectoryRows] = useState<Partial<Record<ListSection, Row[]>>>({});
  const [pageMetadata, setPageMetadata] = useState<Partial<Record<ListSection, PageMetadata>>>({});
  const [formOptions, setFormOptions] = useState<ReferenceData>({ farmers: [], vendors: [], plans: [],agents: [] });
  const [vendorOptions, setVendorOptions] = useState<Row[]>([]);
  const directoryRequestIds = useRef<Partial<Record<ListSection, number>>>({});
  const [authState, setAuthState] = useState<AuthState>("signedOut");
  const [authMessage, setAuthMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editingRecord, setEditingRecord] = useState<{ section: EditableSection; row: Row } | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RecordSelection | null>(null);
  const [recordLoading, setRecordLoading] = useState(false);
  const recordRequestId = useRef(0);
  const [recordToDelete, setRecordToDelete] = useState<RecordSelection | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [recordToPurge, setRecordToPurge] = useState<RecordSelection | null>(null);
  const [toast, setToast] = useState("");
  const editSavingRef = useRef(false);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const refreshData = useCallback(async (
    token = window.localStorage.getItem("jbsolar_access_token") ?? "",
    preserveWorkspace = false,
  ) => {
    if (!token) {
      setAuthState("signedOut");
      return;
    }
    setLoading(true);
    if (!preserveWorkspace) setAuthState("loading");
    setAuthMessage("");
    try {
      const [policies, farmers, vendors, agents, plans, recycleBin, allVendorOptions, allFarmerOptions, allPlanOptions,allAgentOptions] = await Promise.all([
        
        fetchPage<ResourceData["policies"][number]>("/api/v1/policies", token, directoryQueriesRef.current.Policies),
        fetchPage<ResourceData["farmers"][number]>("/api/v1/farmers", token, directoryQueriesRef.current.Farmers),
        fetchPage<ResourceData["vendors"][number]>("/api/v1/vendors", token, directoryQueriesRef.current.Vendors),
        fetchPage<ResourceData["agents"][number]>("/api/v1/agents", token, directoryQueriesRef.current.Agents),
        fetchPage<ResourceData["plans"][number]>("/api/v1/policy-plans", token, directoryQueriesRef.current.Plans, "&activeOnly=false"),
        apiRequest<ResourceData["recycleBin"]>("/api/v1/recycle-bin", token),
        fetchPage<ResourceData["vendors"][number]>("/api/v1/vendors", token, { ...directoryQueriesRef.current.Vendors, size: 100 }),
        fetchPage<ResourceData["farmers"][number]>("/api/v1/farmers", token, { ...directoryQueriesRef.current.Farmers, size: 100 }),
        fetchPage<ResourceData["plans"][number]>("/api/v1/policy-plans", token, { ...directoryQueriesRef.current.Plans, size: 100 }, "&activeOnly=false"),
        fetchPage<ResourceData["agents"][number]>("/api/v1/agents", token, { ...directoryQueriesRef.current.Agents, size: 100 }),
      ]);
      setData({
        policies: policies.content,
        farmers: farmers.content,
        vendors: vendors.content,
        agents: agents.content,
        plans: plans.content,
        recycleBin,
      });
      setDirectoryRows({
        Policies: policies.content,
        Farmers: farmers.content,
        Vendors: vendors.content,
        Agents: agents.content,
        Plans: plans.content,
      });
      setPageMetadata({
        Policies: pageInfo(policies),
        Farmers: pageInfo(farmers),
        Vendors: pageInfo(vendors),
        Agents: pageInfo(agents),
        Plans: pageInfo(plans),
      });
      setVendorOptions(allVendorOptions.content);
      setFormOptions({
        farmers: allFarmerOptions.content,
        vendors: allVendorOptions.content,
        plans: allPlanOptions.content,
         agents: allAgentOptions.content,
      });
      setAuthState("authenticated");
      setToast("Data synced");
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        window.localStorage.removeItem("jbsolar_access_token");
        setData(emptyData);
        setAuthMessage("Your session has expired. Please sign in again.");
        setAuthState("signedOut");
      } else if (preserveWorkspace) {
        setToast("Could not refresh data. Your current workspace is still available.");
      } else {
        setAuthMessage("Could not connect to the JB Solar API. Check the API URL and try again.");
        setAuthState("error");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = window.localStorage.getItem("jbsolar_access_token");
    if (!token) return;
    const timer = window.setTimeout(() => void refreshData(token), 0);
    return () => window.clearTimeout(timer);
  }, [refreshData]);

  function handleRequestError(error: unknown, message: string) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      signOut();
      setAuthMessage("Your session has expired. Please sign in again.");
      return;
    }
    setToast(message);
  }

  const updateDirectoryQuery = useCallback((target: DirectorySection, query: DirectoryQuery) => {
    const updated = { ...directoryQueriesRef.current, [target]: query };
    directoryQueriesRef.current = updated;
    setDirectoryQueries(updated);
  }, []);

  const loadDirectoryPage = useCallback(async (target: ListSection, query: DirectoryQuery): Promise<boolean> => {
    const token = window.localStorage.getItem("jbsolar_access_token");
    const resourcePath = apiResourceBySection[target];
    if (!token || !resourcePath) return false;
    const requestId = (directoryRequestIds.current[target] ?? 0) + 1;
    directoryRequestIds.current[target] = requestId;
    setLoading(true);
    try {
      const page = await fetchPage<Row>(
        `/api/v1/${resourcePath}`,
        token,
        query,
        target === "Plans" ? "&activeOnly=false" : "",
      );
      if (directoryRequestIds.current[target] !== requestId) return false;
      const lastPage = Math.max(0, page.totalPages - 1);
      if (query.page > lastPage) {
        const queries = {
          ...directoryQueriesRef.current,
          [target]: { ...query, page: lastPage },
        };
        directoryQueriesRef.current = queries;
        setDirectoryQueries(queries);
        return true;
      }
      setDirectoryRows(current => ({ ...current, [target]: page.content }));
      setPageMetadata(current => ({ ...current, [target]: pageInfo(page) }));
      const dataKey = endpointBySection[target];
      if (dataKey) setData(current => ({ ...current, [dataKey]: page.content }));
      return true;
    } catch (error) {
      if (directoryRequestIds.current[target] !== requestId) return false;
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        window.localStorage.removeItem("jbsolar_access_token");
        setData(emptyData);
        setAuthMessage("Your session has expired. Please sign in again.");
        setAuthState("signedOut");
      } else {
        setToast(`Could not load ${target.toLowerCase()}.`);
      }
      return false;
    } finally {
      if (directoryRequestIds.current[target] === requestId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authState !== "authenticated" || section === "Overview" || section === "Recycle Bin") return;
    const timer = window.setTimeout(() => void loadDirectoryPage(section, directoryQueries[section]), 0);
    return () => window.clearTimeout(timer);
  }, [authState, directoryQueries, loadDirectoryPage, section]);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setAuthMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: form.get("mobile"), password: form.get("password") }),
      });
      if (!response.ok) throw new Error("Login failed");
      const result = await response.json();
      window.localStorage.setItem("jbsolar_access_token", result.accessToken);
      await refreshData(result.accessToken);
    } catch {
      setAuthMessage("Sign in failed. Check your credentials and API connection.");
      setAuthState("signedOut");
    } finally {
      setLoading(false);
    }
  }

  async function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (section === "Overview" || section === "Recycle Bin") return;
    const form = new FormData(event.currentTarget);
    const payload: Record<string, string | number | null> = {};
    form.forEach((value, key) => { if (String(value).trim()) payload[key] = String(value); });
    if (section === "Plans") {
      payload.durationMonths = Number(payload.durationMonths);
      payload.price = Number(payload.price);
      payload.gstPercentage = Number(payload.gstPercentage);
    }
    if (!payload.agentId) payload.agentId = null;
    const endpoint = endpointBySection[section];
    if (!endpoint) return;
    const resourcePath = apiResourceBySection[section];
    if (!resourcePath) return;
    const token = window.localStorage.getItem("jbsolar_access_token");
    if (!token) {
      setAuthState("signedOut");
      return;
    }
    try {
      const created = await apiRequest<Row>(`/api/v1/${resourcePath}`, token, { method: "POST", body: JSON.stringify(payload) });
      setData(current => ({ ...current, [endpoint]: [created, ...current[endpoint]] }));
      void loadDirectoryPage(section, directoryQueriesRef.current[section]);
      setToast(`${recordLabel(section)} created`);
    } catch (error) {
      handleRequestError(error, "Could not save this record. Check the API connection.");
      return;
    }
    setModal(null);
  }

  async function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingRecord || editSavingRef.current) return;
    const form = new FormData(event.currentTarget);
    const payload: Record<string, string | number> = {};
    form.forEach((value, key) => { payload[key] = String(value).trim(); });
    if (editingRecord.section === "Plans") {
      payload.durationMonths = Number(payload.durationMonths);
      payload.price = Number(payload.price);
      payload.gstPercentage = Number(payload.gstPercentage);
    }
    const endpoint = endpointBySection[editingRecord.section];
    const resourcePath = apiResourceBySection[editingRecord.section];
    if (!endpoint || !resourcePath) return;
    const token = window.localStorage.getItem("jbsolar_access_token");
    if (!token) {
      setAuthState("signedOut");
      return;
    }
    editSavingRef.current = true;
    setEditSaving(true);
    try {
      const result = await apiRequest<Row>(`/api/v1/${resourcePath}/${editingRecord.row.id}`, token, { method: "PUT", body: JSON.stringify(payload) });
      const updated = { ...editingRecord.row, ...payload, ...result, id: result.id ?? editingRecord.row.id };
      setData(current => ({ ...current, [endpoint]: current[endpoint].map(row => row.id === editingRecord.row.id ? updated : row) }));
      void loadDirectoryPage(editingRecord.section, directoryQueriesRef.current[editingRecord.section]);
      setToast(`${recordLabel(editingRecord.section)} updated`);
      setEditingRecord(null);
      setModal(null);
    } catch (error) {
      handleRequestError(error, "Could not update this record. Check the API connection.");
    } finally {
      editSavingRef.current = false;
      setEditSaving(false);
    }
  }

  async function toggleStatus(row: Row, recordSection: "Vendors" | "Plans") {
    const nextStatus = row.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const resourcePath = apiResourceBySection[recordSection];
    if (!resourcePath) return;
    const token = window.localStorage.getItem("jbsolar_access_token");
    if (!token) {
      setAuthState("signedOut");
      return;
    }
    try {
      const updated = await apiRequest<Row | undefined>(`/api/v1/${resourcePath}/${row.id}/status?status=${nextStatus}`, token, { method: "PATCH" });
      const endpoint = endpointBySection[recordSection];
      if (!endpoint) return;
      setData(current => ({
        ...current,
        [endpoint]: current[endpoint].map(item => item.id === row.id ? { ...item, ...updated, status: updated?.status ?? nextStatus } : item),
      }));
      void loadDirectoryPage(recordSection, directoryQueriesRef.current[recordSection]);
    } catch (error) {
      handleRequestError(error, `Could not update ${recordLabel(recordSection).toLowerCase()} status.`);
      return;
    }
    setToast(`${recordLabel(recordSection)} status updated`);
  }

  async function viewRecord(row: Row, recordSection: Section) {
    const requestId = ++recordRequestId.current;
    setSelectedRecord({ section: recordSection, row });
    setRecordLoading(recordSection !== "Recycle Bin");
    const resourcePath = apiResourceBySection[recordSection];
    if (!resourcePath) {
      setRecordLoading(false);
      return;
    }
    const token = window.localStorage.getItem("jbsolar_access_token");
    if (!token) {
      setRecordLoading(false);
      return;
    }
    try {
      const detail = await apiRequest<Row>(`/api/v1/${resourcePath}/${row.id}`, token);
      if (requestId !== recordRequestId.current) return;
      if (requestId === recordRequestId.current) setSelectedRecord({ section: recordSection, row: detail });
    } catch (error) {
      if (requestId === recordRequestId.current) handleRequestError(error, `Could not load ${recordLabel(recordSection).toLowerCase()} details.`);
    } finally {
      if (requestId === recordRequestId.current) setRecordLoading(false);
    }
  }

  function closeRecordDetails() {
    recordRequestId.current += 1;
    setSelectedRecord(null);
    setRecordLoading(false);
  }

  async function confirmDelete() {
    if (!recordToDelete) return;
    const deleteSection = recordToDelete.section;
    if (deleteSection === "Overview" || deleteSection === "Recycle Bin") {
      setToast("This record cannot be deleted from the current section.");
      return;
    }
    const token = window.localStorage.getItem("jbsolar_access_token");
    const resource = endpointBySection[deleteSection];
    const resourcePath = apiResourceBySection[deleteSection];
    if (!token || !resource || !resourcePath) {
      signOut();
      return;
    }
    setDeleteLoading(true);
    try {
      await apiRequest<void>(`/api/v1/${resourcePath}/${recordToDelete.row.id}`, token, { method: "DELETE" });
      setData(current => ({ ...current, [resource]: current[resource].filter(item => item.id !== recordToDelete.row.id) }));
      setDirectoryRows(current => ({ ...current, [deleteSection]: current[deleteSection]?.filter(item => item.id !== recordToDelete.row.id) }));
      setPageMetadata(current => ({
        ...current,
        [deleteSection]: current[deleteSection]
          ? { ...current[deleteSection], totalElements: Math.max(0, current[deleteSection].totalElements - 1) }
          : undefined,
      }));
      const listRefreshed = await loadDirectoryPage(
        deleteSection,
        directoryQueriesRef.current[deleteSection],
      );
      setRecordToDelete(null);
      try {
        const recycleBin = await apiRequest<ResourceData["recycleBin"]>("/api/v1/recycle-bin", token);
        setData(current => ({ ...current, recycleBin }));
        setToast(listRefreshed
          ? `${recordLabel(deleteSection)} moved to recycle bin`
          : `${recordLabel(deleteSection)} deleted; the list could not be refreshed.`);
      } catch (error) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          signOut();
          setAuthMessage("Your session has expired. Please sign in again.");
        } else {
          setToast("Record deleted, but the recycle bin could not be refreshed.");
        }
      }
    } catch (error) {
      handleRequestError(error, `Could not delete this ${recordLabel(deleteSection).toLowerCase()}. No local data was changed.`);
    } finally {
      setDeleteLoading(false);
    }
  }

  async function restoreRecord(row: Row) {
    const token = window.localStorage.getItem("jbsolar_access_token");
    const resource = String(row.resource ?? "");
    if (!token || !resource || !row.id) {
      setToast("This recycle-bin entry is missing its resource or record ID.");
      return;
    }
    const dataKey = dataKeyByApiResource[resource];
    const targetSection = sectionByApiResource[resource];
    if (!dataKey || !targetSection) {
      setToast("This recycle-bin entry uses an unsupported resource.");
      return;
    }
    try {
      await apiRequest<void>(`/api/v1/recycle-bin/${encodeURIComponent(resource)}/${row.id}/restore`, token, { method: "POST" });
      setData(current => ({ ...current, recycleBin: current.recycleBin.filter(item => item.id !== row.id || item.resource !== resource) }));
      const [recycleBin, listRefreshed] = await Promise.all([
        apiRequest<ResourceData["recycleBin"]>("/api/v1/recycle-bin", token),
        loadDirectoryPage(targetSection, directoryQueriesRef.current[targetSection]),
      ]);
      setData(current => ({ ...current, recycleBin }));
      setToast(listRefreshed
        ? `${String(row.label ?? "Record")} restored`
        : `${String(row.label ?? "Record")} restored; the directory could not be refreshed.`);
    } catch (error) {
      handleRequestError(error, "Record was restored, but the lists could not be refreshed.");
    }
  }

  async function confirmPurge() {
    if (!recordToPurge) return;
    const token = window.localStorage.getItem("jbsolar_access_token");
    const resource = String(recordToPurge.row.resource ?? "");
    if (!token || !resource || !recordToPurge.row.id) {
      setToast("This recycle-bin entry is missing its resource or record ID.");
      return;
    }
    setDeleteLoading(true);
    try {
      await apiRequest<void>(`/api/v1/recycle-bin/${encodeURIComponent(resource)}/${recordToPurge.row.id}`, token, { method: "DELETE" });
      setData(current => ({ ...current, recycleBin: current.recycleBin.filter(item => item.id !== recordToPurge.row.id || item.resource !== resource) }));
      setRecordToPurge(null);
      setToast(`${String(recordToPurge.row.label ?? "Record")} permanently deleted`);
    } catch (error) {
      handleRequestError(error, "Could not permanently delete this record.");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function exportData(target: Section, directoryQuery?: DirectoryQuery) {
    const token = window.localStorage.getItem("jbsolar_access_token");
    if (!token) {
      setAuthState("signedOut");
      return;
    }
    const resource = apiResourceBySection[target];
    const exportQuery = target === "Overview"
      ? { ...initialDirectoryQueries.Policies, sort: "createdAt", direction: "DESC" as const }
      : directoryQuery ?? directoryQueriesRef.current[target];
    const basePath = target === "Overview" ? "/api/v1/exports" : resource ? `/api/v1/exports/${encodeURIComponent(resource)}` : null;
    if (!basePath || !exportQuery) return;
    const path = `${basePath}?${serializeDirectoryQuery(exportQuery, false)}`;
    try {
      const { blob, disposition, contentType } = await apiDownload(path, token);
      const filenameMatch = disposition?.match(/filename="?([^";]+)"?/i);
      const extension = contentType?.includes("json") ? "json" : contentType?.includes("zip") ? "zip" : "csv";
      const filename = filenameMatch?.[1] ?? `${target === "Overview" ? "jb-solar-export" : resource}-export.${extension}`;
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(objectUrl);
      setToast("Export downloaded");
    } catch (error) {
      handleRequestError(error, "Could not download the export.");
    }
  }

  function openSection(nextSection: Section) {
    setSection(nextSection);
  }

  function openCreate() {
    if (section === "Overview") setSection("Policies");
    if (section === "Recycle Bin") return;
    setEditingRecord(null);
    setModal("create");
  }

  function signOut() {
    recordRequestId.current += 1;
    editSavingRef.current = false;
    setEditSaving(false);
    window.localStorage.removeItem("jbsolar_access_token");
    setData(emptyData);
    setAuthMessage("");
    setModal(null);
    setEditingRecord(null);
    setSelectedRecord(null);
    setRecordToDelete(null);
    setRecordToPurge(null);
    setAuthState("signedOut");
    setSection("Overview");
  }

  if (authState !== "authenticated") {
    return <div className="grid min-h-dvh place-items-center bg-[#f3f5ef] px-5 py-10 text-[#20261f]">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#163b2d] text-[#c5e86c]"><Icon name="sun" size={22} /></div><div><p className="text-[16px] font-bold">JB Solar</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[1.5px] text-[#788276]">Operations</p></div></div>
        <section aria-labelledby="sign-in-title" className="rounded-[8px] border border-[#e4e8df] bg-white p-6 shadow-sm sm:p-8">
          {authState === "loading" ? <div role="status" className="py-8 text-center"><div aria-hidden="true" className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#dce6d9] border-t-[#285c3b]" /><h1 className="mt-5 text-[16px] font-semibold">Loading your workspace</h1><p className="mt-2 text-[12px] text-[#687266]">Connecting securely to JB Solar.</p></div> : <>
            <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#668263]">Secure workspace</p><h1 id="sign-in-title" className="mt-2 text-[22px] font-semibold">Sign in to continue</h1><p className="mt-2 text-[12px] leading-5 text-[#687266]">Use your administrator credentials to access operations data.</p>
            {authMessage && <div role="alert" className="mt-4 rounded-[5px] border border-[#f0d3ca] bg-[#fff5f1] px-3 py-2.5 text-[11px] leading-4 text-[#a44c3a]">{authMessage}</div>}
            {authState === "error" && <button type="button" onClick={() => void refreshData()} className="mt-4 h-9 w-full rounded-[5px] border border-[#dfe3da] text-[11px] font-semibold text-[#435143] hover:bg-[#f5f7f1]">Retry API connection</button>}
            <form onSubmit={submitLogin} className="mt-5 space-y-4"><Field label="Mobile number"><input name="mobile" required autoComplete="username" placeholder="+91 98765 43210" /></Field><Field label="Password"><input type="password" name="password" required autoComplete="current-password" placeholder="Enter your password" /></Field><button disabled={loading} className="mt-2 h-10 w-full rounded-[5px] bg-[#285c3b] text-[12px] font-semibold text-white transition hover:bg-[#1f4d31] disabled:cursor-wait disabled:opacity-60">{loading ? "Signing in..." : "Sign in"}</button></form>
          </>}
        </section>
        <p className="mt-5 text-center text-[10px] text-[#92998e]">API endpoint · {API_URL}</p>
      </div>
    </div>;
  }

  return <>
    <DashboardShell
      section={section}
      loading={loading}
      policyCount={data.policies.length}
      recycleBinCount={data.recycleBin.length}
      onOpenSection={openSection}
      onAdd={openCreate}
      onRefresh={() => void refreshData(undefined, true)}
      onExport={() => void exportData(section)}
      onSignOut={signOut}
    >
      {section === "Overview"
        ? <OverviewPage data={data} onViewPolicies={() => openSection("Policies")} onViewRecord={row => void viewRecord(row, "Policies")} />
        : <DirectoryPage
            key={section}
            section={section}
            rows={section === "Recycle Bin" ? data.recycleBin : directoryRows[section] ?? getRows(data, section)}
            loading={loading}
            query={directoryQueries[section]}
            pageMetadata={section === "Recycle Bin" ? undefined : pageMetadata[section]}
            vendorOptions={vendorOptions}
            onQueryChange={query => updateDirectoryQuery(section, query)}
            onExport={section === "Recycle Bin" ? undefined : query => void exportData(section, query)}
            onToggleStatus={section === "Vendors" || section === "Plans" ? row => void toggleStatus(row, section) : undefined}
            onEditRecord={section !== "Recycle Bin" ? row => { setEditingRecord({ section, row }); setModal("edit"); } : undefined}
            onViewRecord={section !== "Recycle Bin" ? row => void viewRecord(row, section) : undefined}
            onDeleteRecord={section !== "Recycle Bin" ? row => setRecordToDelete({ section, row }) : undefined}
            onRestoreRecord={section === "Recycle Bin" ? row => void restoreRecord(row) : undefined}
            onPurgeRecord={section === "Recycle Bin" ? row => setRecordToPurge({ section, row }) : undefined}
          />}
    </DashboardShell>

    {modal === "create" && <Modal title={`Add ${recordLabel(section).toLowerCase()}`} onClose={() => setModal(null)}>
      <CreateForm section={section} data={formOptions} onSubmit={submitCreate} onCancel={() => setModal(null)} />
    </Modal>}
    {modal === "edit" && editingRecord && <RecordEditDialog
      key={`${editingRecord.section}-${editingRecord.row.id}`}
      record={editingRecord}
      data={formOptions}
      saving={editSaving}
      onSubmit={submitEdit}
      onClose={() => { if (!editSaving) { setModal(null); setEditingRecord(null); } }}
    />}
    {selectedRecord && <RecordDetailsDialog record={selectedRecord} loading={recordLoading} onClose={closeRecordDetails} />}
    {recordToDelete && <RecordDeleteDialog record={recordToDelete} deleting={deleteLoading} onDelete={() => void confirmDelete()} onClose={() => { if (!deleteLoading) setRecordToDelete(null); }} />}
    {recordToPurge && <RecycleBinPurgeDialog record={recordToPurge} deleting={deleteLoading} onDelete={() => void confirmPurge()} onClose={() => { if (!deleteLoading) setRecordToPurge(null); }} />}
    {toast && <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-[70] max-w-[calc(100vw-40px)] rounded-[6px] bg-[#203d2d] px-4 py-3 text-[12px] font-medium text-white shadow-lg">{toast}</div>}
  </>;
}
