"use client";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { DashboardShell } from "./dashboard-shell";
import type { EditableSection } from "./record-forms";
import { Field, Icon, Modal } from "./ui";
import { apiDownload, apiRequest, ApiError, normalizePageResponse, serializeDirectoryQuery } from "./api";
import { downloadInvoicePdf, type InvoiceData } from "@/app/InvoicePDF";
import {
  clearWorkspaceCache,
  readWorkspaceCache,
  WORKSPACE_CACHE_TTL_MS,
  writeWorkspaceCache,
  type WorkspaceCache,
} from "./workspace-cache";
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
  type PolicyFileMetadata,
  type ReferenceData,
  type ResourceData,
  type Row,
  type RecordSelection,
  type Section,
  recordLabel,
} from "./types";

const DirectoryPage = dynamic(() => import("./directory-page").then(module => module.DirectoryPage), {
  loading: () => <div role="status" className="rounded-[8px] border border-[#e8eae3] bg-white px-5 py-12 text-center text-[12px] text-[#687266]">Loading directory…</div>,
});
const OverviewPage = dynamic(() => import("./overview-page").then(module => module.OverviewPage), {
  loading: () => <div role="status" className="rounded-[8px] border border-[#e8eae3] bg-white px-5 py-12 text-center text-[12px] text-[#687266]">Loading overview…</div>,
});
const CreateForm = dynamic(() => import("./record-forms").then(module => module.CreateForm), {
  loading: () => <p role="status" className="py-6 text-center text-[12px] text-[#687266]">Loading form…</p>,
});
const RecordEditDialog = dynamic(() => import("./record-dialogs").then(module => module.RecordEditDialog));
const RecordDeleteDialog = dynamic(() => import("./record-dialogs").then(module => module.RecordDeleteDialog));
const RecordDetailsDialog = dynamic(() => import("./record-dialogs").then(module => module.RecordDetailsDialog));
const RecycleBinPurgeDialog = dynamic(() => import("./record-dialogs").then(module => module.RecycleBinPurgeDialog));
const InvoiceDialog = dynamic(() => import("../InvoiceDialog").then(module => module.InvoiceDialog));

async function fetchPage<T extends Row>(
  path: string,
  token: string,
  query: DirectoryQuery,
  suffix = "",
  signal?: AbortSignal,
): Promise<NormalizedPageResponse<T>> {
  const queryString = serializeDirectoryQuery(query);
  const response = await apiRequest<PageResponse<T>>(`${path}?${queryString}${suffix}`, token, { signal });
  return normalizePageResponse(response, query.page, query.size);
}

function isPolicyFileMetadata(value: unknown): value is PolicyFileMetadata {
  if (!value || typeof value !== "object") return false;
  const file = value as Record<string, unknown>;
  return typeof file.id === "string"
    && typeof file.resourceType === "string"
    && typeof file.resourceId === "string"
    && typeof file.purpose === "string"
    && typeof file.originalFilename === "string"
    && typeof file.contentType === "string"
    && typeof file.fileSize === "number"
    && typeof file.uploadedAt === "string"
    && typeof file.viewUrl === "string"
    && typeof file.viewUrlExpiresAt === "string";
}

function pageInfo<T extends Row>(page: NormalizedPageResponse<T>): PageMetadata {
  return {
    page: page.page,
    size: page.size,
    totalElements: page.totalElements,
    totalPages: page.totalPages,
  };
}

function directoryQueryKey(query: DirectoryQuery, section: ListSection): string {
  return `${serializeDirectoryQuery(query)}${section === "Plans" ? "&activeOnly=false" : ""}`;
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
  const [formOptions, setFormOptions] = useState<ReferenceData>({ farmers: [], vendors: [], plans: [], agents: [] });
  const formOptionsLoadedRef = useRef(false);
  const [vendorOptions, setVendorOptions] = useState<ResourceData["vendors"]>([]);
  const vendorOptionsDataRef = useRef<ResourceData["vendors"]>([]);
  const vendorOptionsLoadedRef = useRef(false);
  const vendorOptionsRequestRef = useRef<Promise<ResourceData["vendors"]> | null>(null);
  const directoryRequestIds = useRef<Partial<Record<ListSection, number>>>({});
  const directoryControllersRef = useRef<Partial<Record<ListSection, AbortController>>>({});
  const loadedDirectoryQueriesRef = useRef<Partial<Record<ListSection, string>>>({});
  const recycleBinLoadedRef = useRef(false);
  const lastSyncedAtRef = useRef(0);
  const workspaceRequestIdRef = useRef(0);
  const refreshRequestIdRef = useRef(0);
  const refreshControllerRef = useRef<AbortController | null>(null);
  const [authState, setAuthState] = useState<AuthState>("signedOut");
  const [authMessage, setAuthMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editingRecord, setEditingRecord] = useState<{ section: EditableSection; row: Row } | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RecordSelection | null>(null);
  const [recordLoading, setRecordLoading] = useState(false);
  const recordRequestId = useRef(0);
  const [policyFiles, setPolicyFiles] = useState<{ policyId: string; items: PolicyFileMetadata[] } | null>(null);
  const [policyFilesLoading, setPolicyFilesLoading] = useState(false);
  const [policyFilesError, setPolicyFilesError] = useState("");
  const policyFilesRequestIdRef = useRef(0);
  const [recordToDelete, setRecordToDelete] = useState<RecordSelection | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [recordToPurge, setRecordToPurge] = useState<RecordSelection | null>(null);
  const [toast, setToast] = useState("");
  const editSavingRef = useRef(false);
  const [invoiceDetails, setInvoiceDetails] = useState<Record<string, ResourceData["invoices"][number]>>({});
  const [invoiceToView, setInvoiceToView] = useState<Row | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const invoiceRequestIdRef = useRef(0);

  const signOut = useCallback(() => {
    workspaceRequestIdRef.current += 1;
    recordRequestId.current += 1;
    policyFilesRequestIdRef.current += 1;
    refreshRequestIdRef.current += 1;
    refreshControllerRef.current?.abort();
    refreshControllerRef.current = null;
    for (const listSection of Object.keys(directoryRequestIds.current) as ListSection[]) {
      directoryRequestIds.current[listSection] = (directoryRequestIds.current[listSection] ?? 0) + 1;
      directoryControllersRef.current[listSection]?.abort();
      delete directoryControllersRef.current[listSection];
    }
    setLoading(false);
    editSavingRef.current = false;
    setEditSaving(false);
    window.localStorage.removeItem("jbsolar_access_token");
    clearWorkspaceCache();
    setData(emptyData);
    setDirectoryRows({});
    setPageMetadata({});
    setFormOptions({ farmers: [], vendors: [], plans: [], agents: [] });
    setVendorOptions([]);
    vendorOptionsDataRef.current = [];
    loadedDirectoryQueriesRef.current = {};
    recycleBinLoadedRef.current = false;
    formOptionsLoadedRef.current = false;
    vendorOptionsLoadedRef.current = false;
    vendorOptionsRequestRef.current = null;
    lastSyncedAtRef.current = 0;
    const freshQueries = {
      ...initialDirectoryQueries,
      "Recycle Bin": initialRecycleBinQuery,
    };
    directoryQueriesRef.current = freshQueries;
    setDirectoryQueries(freshQueries);
    setAuthMessage("");
    setModal(null);
    setEditingRecord(null);
    setSelectedRecord(null);
    setPolicyFiles(null);
    setPolicyFilesLoading(false);
    setPolicyFilesError("");
    setRecordToDelete(null);
    setRecordToPurge(null);
    setInvoiceToView(null);
    setInvoiceDetails({});
    setInvoiceLoading(false);
    invoiceRequestIdRef.current += 1;
    setAuthState("signedOut");
    setSection("Overview");
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (authState !== "authenticated" || !lastSyncedAtRef.current) return;
    const snapshot: WorkspaceCache = {
      version: 3,
      apiBaseUrl: API_URL,
      savedAt: lastSyncedAtRef.current,
      data,
      invoiceDetails,
      directoryRows,
      pageMetadata,
      loadedDirectoryQueries: loadedDirectoryQueriesRef.current,
      directoryQueries,
      formOptions,
      formOptionsLoaded: formOptionsLoadedRef.current,
      vendorOptions,
      vendorOptionsLoaded: vendorOptionsLoadedRef.current,
      recycleBinLoaded: recycleBinLoadedRef.current,
    };
    const timer = window.setTimeout(() => writeWorkspaceCache(snapshot), 250);
    return () => window.clearTimeout(timer);
  }, [authState, data, invoiceDetails, directoryRows, pageMetadata, directoryQueries, formOptions, vendorOptions]);

  const refreshData = useCallback(async (
    token = window.localStorage.getItem("jbsolar_access_token") ?? "",
    preserveWorkspace = false,
  ) => {
    if (!token) {
      setAuthState("signedOut");
      return;
    }
    const requestId = ++refreshRequestIdRef.current;
    refreshControllerRef.current?.abort();
    const controller = new AbortController();
    refreshControllerRef.current = controller;
    setLoading(true);
    if (!preserveWorkspace) setAuthState("loading");
    setAuthMessage("");
    try {
      const [policies, farmers, vendors] = await Promise.all([
        fetchPage<ResourceData["policies"][number]>("/api/v1/policies", token, directoryQueriesRef.current.Policies, "", controller.signal),
        fetchPage<ResourceData["farmers"][number]>("/api/v1/farmers", token, directoryQueriesRef.current.Farmers, "", controller.signal),
        fetchPage<ResourceData["vendors"][number]>("/api/v1/vendors", token, directoryQueriesRef.current.Vendors, "", controller.signal),
      ]);
      if (requestId !== refreshRequestIdRef.current) return;
      setData(current => ({
        ...current,
        policies: policies.content,
        farmers: farmers.content,
        vendors: vendors.content,
      }));
      setDirectoryRows(current => ({
        ...current,
        Policies: policies.content,
        Farmers: farmers.content,
        Vendors: vendors.content,
      }));
      setPageMetadata(current => ({
        ...current,
        Policies: pageInfo(policies),
        Farmers: pageInfo(farmers),
        Vendors: pageInfo(vendors),
      }));
      setVendorOptions(vendors.content);
      vendorOptionsDataRef.current = vendors.content;
      setFormOptions(current => ({ ...current, vendors: vendors.content }));
      vendorOptionsLoadedRef.current = vendors.totalElements <= vendors.content.length;
      loadedDirectoryQueriesRef.current = {
        ...loadedDirectoryQueriesRef.current,
        Policies: directoryQueryKey(directoryQueriesRef.current.Policies, "Policies"),
        Farmers: directoryQueryKey(directoryQueriesRef.current.Farmers, "Farmers"),
        Vendors: directoryQueryKey(directoryQueriesRef.current.Vendors, "Vendors"),
      };
      lastSyncedAtRef.current = Date.now();
      setAuthState("authenticated");
      setToast("Data synced");
    } catch (error) {
      if (requestId !== refreshRequestIdRef.current) return;
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        signOut();
        setAuthMessage("Your session has expired. Please sign in again.");
      } else if (preserveWorkspace) {
        setToast("Could not refresh data. Your current workspace is still available.");
      } else {
        setAuthMessage("Could not connect to the JB Solar API. Check the API URL and try again.");
        setAuthState("error");
      }
    } finally {
      if (requestId === refreshRequestIdRef.current) {
        refreshControllerRef.current = null;
        setLoading(false);
      }
    }
  }, [signOut]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const token = window.localStorage.getItem("jbsolar_access_token");
      if (!token) return;
      const cached = readWorkspaceCache(API_URL);
      if (cached) {
        setData(cached.data);
        setDirectoryRows(cached.directoryRows);
        setPageMetadata(cached.pageMetadata);
          setInvoiceDetails(cached.invoiceDetails);
        setFormOptions(cached.formOptions);
        setVendorOptions(cached.vendorOptions);
        vendorOptionsDataRef.current = cached.vendorOptions;
        directoryQueriesRef.current = cached.directoryQueries;
        setDirectoryQueries(cached.directoryQueries);
        loadedDirectoryQueriesRef.current = cached.loadedDirectoryQueries;
        formOptionsLoadedRef.current = cached.formOptionsLoaded;
        vendorOptionsLoadedRef.current = cached.vendorOptionsLoaded;
        recycleBinLoadedRef.current = cached.recycleBinLoaded;
        lastSyncedAtRef.current = cached.savedAt;
        setAuthState("authenticated");
        if (Date.now() - cached.savedAt < WORKSPACE_CACHE_TTL_MS) return;
      }
      void refreshData(token, Boolean(cached));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refreshData]);

  const handleRequestError = useCallback((error: unknown, message: string) => {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      clearWorkspaceCache();
      signOut();
      setAuthMessage("Your session has expired. Please sign in again.");
      return;
    }
    if (error instanceof ApiError && error.status === 429) {
      const retryMessage = error.retryAfterSeconds === undefined
        ? " Please wait before trying again."
        : ` Please try again in ${Math.ceil(error.retryAfterSeconds)} seconds.`;
      setToast(`${message}${retryMessage}`);
      return;
    }
    setToast(message);
  }, [signOut]);

  const ensureVendorOptions = useCallback(async (): Promise<ResourceData["vendors"]> => {
    if (vendorOptionsLoadedRef.current) return vendorOptionsDataRef.current;
    if (vendorOptionsRequestRef.current) return vendorOptionsRequestRef.current;
    const token = window.localStorage.getItem("jbsolar_access_token");
    if (!token) {
      setAuthState("signedOut");
      return [];
    }
    const requestId = workspaceRequestIdRef.current;
    const request = (async () => {
      try {
        const vendors = await fetchPage<ResourceData["vendors"][number]>(
          "/api/v1/vendors",
          token,
          { ...initialDirectoryQueries.Vendors, size: 100 },
        );
        if (requestId !== workspaceRequestIdRef.current) return [];
        vendorOptionsDataRef.current = vendors.content;
        setVendorOptions(vendors.content);
        setFormOptions(current => ({ ...current, vendors: vendors.content }));
        vendorOptionsLoadedRef.current = true;
        lastSyncedAtRef.current = Date.now();
        return vendors.content;
      } catch (error) {
        if (requestId !== workspaceRequestIdRef.current) return [];
        handleRequestError(error, "Could not load vendor filter options.");
        return [];
      } finally {
        if (requestId === workspaceRequestIdRef.current) vendorOptionsRequestRef.current = null;
      }
    })();
    vendorOptionsRequestRef.current = request;
    return request;
  }, [handleRequestError]);

  async function ensureFormOptions(target: Section): Promise<boolean> {
    const requestId = workspaceRequestIdRef.current;
    const vendors = await ensureVendorOptions();
    if (requestId !== workspaceRequestIdRef.current) return false;
    if (!vendorOptionsLoadedRef.current) return false;
    if (target === "Agents" || formOptionsLoadedRef.current) return true;
    if (target !== "Policies") return true;

    const token = window.localStorage.getItem("jbsolar_access_token");
    if (!token) {
      setAuthState("signedOut");
      return false;
    }
    setLoading(true);
    try {
      const [farmers, plans, agents] = await Promise.all([
        fetchPage<ResourceData["farmers"][number]>("/api/v1/farmers", token, { ...initialDirectoryQueries.Farmers, size: 100 }),
        fetchPage<ResourceData["plans"][number]>("/api/v1/policy-plans", token, { ...initialDirectoryQueries.Plans, size: 100 }, "&activeOnly=false"),
        fetchPage<ResourceData["agents"][number]>("/api/v1/agents", token, { ...initialDirectoryQueries.Agents, size: 100 }),
      ]);
      if (requestId !== workspaceRequestIdRef.current) return false;
      setFormOptions({ farmers: farmers.content, vendors, plans: plans.content, agents: agents.content });
      formOptionsLoadedRef.current = true;
      lastSyncedAtRef.current = Date.now();
      return true;
    } catch (error) {
      if (requestId !== workspaceRequestIdRef.current) return false;
      handleRequestError(error, "Could not load the form options. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authState !== "authenticated" || (section !== "Policies" && section !== "Agents")) return;
    const timer = window.setTimeout(() => void ensureVendorOptions(), 0);
    return () => window.clearTimeout(timer);
  }, [authState, ensureVendorOptions, section]);

  const updateDirectoryQuery = useCallback((target: DirectorySection, query: DirectoryQuery) => {
    const updated = { ...directoryQueriesRef.current, [target]: query };
    directoryQueriesRef.current = updated;
    setDirectoryQueries(updated);
  }, []);

  const loadDirectoryPage = useCallback(async (target: ListSection, query: DirectoryQuery, force = false): Promise<boolean> => {
    const token = window.localStorage.getItem("jbsolar_access_token");
    const resourcePath = apiResourceBySection[target];
    if (!token || !resourcePath) return false;
    const queryKey = directoryQueryKey(query, target);
    if (!force && loadedDirectoryQueriesRef.current[target] === queryKey) {
      directoryControllersRef.current[target]?.abort();
      delete directoryControllersRef.current[target];
      directoryRequestIds.current[target] = (directoryRequestIds.current[target] ?? 0) + 1;
      return true;
    }
    directoryControllersRef.current[target]?.abort();
    const controller = new AbortController();
    directoryControllersRef.current[target] = controller;
    const requestId = (directoryRequestIds.current[target] ?? 0) + 1;
    directoryRequestIds.current[target] = requestId;
    setLoading(true);
    try {
      const page = await fetchPage<Row>(
        `/api/v1/${resourcePath}`,
        token,
        query,
        target === "Plans" ? "&activeOnly=false" : "",
        controller.signal,
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
      loadedDirectoryQueriesRef.current[target] = queryKey;
      lastSyncedAtRef.current = Date.now();
      return true;
    } catch (error) {
      if (directoryRequestIds.current[target] !== requestId) return false;
      if (error instanceof DOMException && error.name === "AbortError") return false;
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        signOut();
        setAuthMessage("Your session has expired. Please sign in again.");
      } else {
        setToast(`Could not load ${target.toLowerCase()}.`);
      }
      return false;
    } finally {
      if (directoryRequestIds.current[target] === requestId) {
        delete directoryControllersRef.current[target];
        setLoading(false);
      }
    }
  }, [signOut]);

  useEffect(() => {
    if (authState !== "authenticated" || section === "Overview" || section === "Recycle Bin") return;
    const timer = window.setTimeout(() => void loadDirectoryPage(section, directoryQueries[section]), 0);
    return () => window.clearTimeout(timer);
  }, [authState, directoryQueries, loadDirectoryPage, section]);

  const loadRecycleBin = useCallback(async (force = false): Promise<boolean> => {
    if (!force && recycleBinLoadedRef.current) return true;
    const token = window.localStorage.getItem("jbsolar_access_token");
    if (!token) {
      setAuthState("signedOut");
      return false;
    }
    const requestId = workspaceRequestIdRef.current;
    setLoading(true);
    try {
      const recycleBin = await apiRequest<ResourceData["recycleBin"]>("/api/v1/recycle-bin", token);
      if (requestId !== workspaceRequestIdRef.current) return false;
      setData(current => ({ ...current, recycleBin }));
      recycleBinLoadedRef.current = true;
      lastSyncedAtRef.current = Date.now();
      return true;
    } catch (error) {
      if (requestId !== workspaceRequestIdRef.current) return false;
      handleRequestError(error, "Could not load the recycle bin.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleRequestError]);

  useEffect(() => {
    if (authState !== "authenticated" || section !== "Recycle Bin") return;
    const timer = window.setTimeout(() => void loadRecycleBin(), 0);
    return () => window.clearTimeout(timer);
  }, [authState, loadRecycleBin, section]);

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
      if (response.status === 429) {
        setAuthMessage("Too many sign-in attempts. Please wait before trying again.");
        setAuthState("signedOut");
        return;
      }
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
    if (section === "Overview" || section === "Recycle Bin" || section === "Invoices") return;
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
      formOptionsLoadedRef.current = false;
      if (section === "Vendors") vendorOptionsLoadedRef.current = false;
      void loadDirectoryPage(section, directoryQueriesRef.current[section], true);
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
      formOptionsLoadedRef.current = false;
      if (editingRecord.section === "Vendors") vendorOptionsLoadedRef.current = false;
      void loadDirectoryPage(editingRecord.section, directoryQueriesRef.current[editingRecord.section], true);
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
      formOptionsLoadedRef.current = false;
      if (recordSection === "Vendors") vendorOptionsLoadedRef.current = false;
      void loadDirectoryPage(recordSection, directoryQueriesRef.current[recordSection], true);
    } catch (error) {
      handleRequestError(error, `Could not update ${recordLabel(recordSection).toLowerCase()} status.`);
      return;
    }
    setToast(`${recordLabel(recordSection)} status updated`);
  }

  async function viewRecord(row: Row, recordSection: Section) {
    const requestId = ++recordRequestId.current;
    policyFilesRequestIdRef.current += 1;
    setPolicyFiles(null);
    setPolicyFilesLoading(false);
    setPolicyFilesError("");
    setSelectedRecord({ section: recordSection, row });
    const needsDetailRequest = recordSection === "Farmers";
    setRecordLoading(needsDetailRequest);
    if (!needsDetailRequest) return;
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

  async function loadPolicyFiles() {
    if (selectedRecord?.section !== "Policies") return;
    const policyId = String(selectedRecord.row.id ?? "");
    if (!policyId) {
      setPolicyFilesError("This policy is missing its ID.");
      return;
    }
    const token = window.localStorage.getItem("jbsolar_access_token");
    if (!token) {
      setAuthState("signedOut");
      return;
    }

    const requestId = ++policyFilesRequestIdRef.current;
    setPolicyFilesLoading(true);
    setPolicyFilesError("");
    try {
      const response = await apiRequest<unknown>(`/api/v1/policies/${encodeURIComponent(policyId)}/files`, token);
      if (requestId !== policyFilesRequestIdRef.current) return;
      if (!Array.isArray(response) || !response.every(isPolicyFileMetadata)) {
        throw new TypeError("The API returned an invalid policy file list.");
      }
      setPolicyFiles({ policyId, items: response });
    } catch (error) {
      if (requestId !== policyFilesRequestIdRef.current) return;
      if (error instanceof ApiError && error.status === 401) {
        handleRequestError(error, "Your session has expired. Please sign in again.");
      } else if (error instanceof ApiError && error.status === 403) {
        setPolicyFilesError("You do not have permission to view policy documents.");
      } else if (error instanceof ApiError && error.status === 429) {
        const retryMessage = error.retryAfterSeconds === undefined
          ? "Please wait before trying again."
          : `Try again in ${Math.ceil(error.retryAfterSeconds)} seconds.`;
        setPolicyFilesError(`The server is limiting requests. ${retryMessage}`);
      } else if (error instanceof ApiError) {
        setPolicyFilesError(`Could not load policy documents (HTTP ${error.status}). Please try again.`);
      } else {
        setPolicyFilesError("Could not load policy documents. Check the connection and try again.");
      }
    } finally {
      if (requestId === policyFilesRequestIdRef.current) setPolicyFilesLoading(false);
    }
  }

  async function viewInvoice(row: Row) {
    const invoiceId = String(row.id ?? "");
    if (!invoiceId) {
      setToast("This invoice is missing its ID.");
      return;
    }

    const requestId = ++invoiceRequestIdRef.current;
    const cached = invoiceDetails[invoiceId];
    if (cached) {
      setInvoiceToView(cached as unknown as Row);
      setInvoiceLoading(false);
      return;
    }

    const token = window.localStorage.getItem("jbsolar_access_token");
    if (!token) {
      setAuthState("signedOut");
      return;
    }

    setInvoiceToView(row);
    setInvoiceLoading(true);
    try {
      const detail = await apiRequest<InvoiceData>(`/api/v1/invoices/${encodeURIComponent(invoiceId)}`, token);
      if (requestId !== invoiceRequestIdRef.current) return;
      setInvoiceDetails(current => ({ ...current, [invoiceId]: detail }));
      setInvoiceToView(detail as unknown as Row);
      lastSyncedAtRef.current = Date.now();
    } catch (error) {
      if (requestId === invoiceRequestIdRef.current) {
        handleRequestError(error, "Could not load invoice details.");
      }
    } finally {
      if (requestId === invoiceRequestIdRef.current) setInvoiceLoading(false);
    }
  }

  function closeInvoiceDialog() {
    invoiceRequestIdRef.current += 1;
    setInvoiceToView(null);
    setInvoiceLoading(false);
  }

  async function downloadInvoice(row: Row) {
    try {
      await downloadInvoicePdf(row as unknown as InvoiceData);
      setToast("Invoice downloaded");
    } catch {
      setToast("Could not generate the invoice PDF.");
    }
  }

  function closeRecordDetails() {
    recordRequestId.current += 1;
    policyFilesRequestIdRef.current += 1;
    setSelectedRecord(null);
    setPolicyFiles(null);
    setPolicyFilesError("");
    setPolicyFilesLoading(false);
    setRecordLoading(false);
  }

  async function confirmDelete() {
    if (!recordToDelete) return;
    const deleteSection = recordToDelete.section;
    if (deleteSection === "Overview" || deleteSection === "Recycle Bin" || deleteSection === "Invoices") {
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
      formOptionsLoadedRef.current = false;
      if (deleteSection === "Vendors") vendorOptionsLoadedRef.current = false;
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
        true,
      );
      setRecordToDelete(null);
      try {
        const recycleBin = await apiRequest<ResourceData["recycleBin"]>("/api/v1/recycle-bin", token);
        setData(current => ({ ...current, recycleBin }));
        recycleBinLoadedRef.current = true;
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
        loadDirectoryPage(targetSection, directoryQueriesRef.current[targetSection], true),
      ]);
      setData(current => ({ ...current, recycleBin }));
      recycleBinLoadedRef.current = true;
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

  async function openCreate() {
    if (section === "Overview") setSection("Policies");
    if (section === "Recycle Bin" || section === "Invoices") return;
    const targetSection = section === "Overview" ? "Policies" : section;
    if ((targetSection === "Policies" || targetSection === "Agents") && !(await ensureFormOptions(targetSection))) return;
    setEditingRecord(null);
    setModal("create");
  }

  async function openEdit(row: Row) {
    if (section === "Overview" || section === "Recycle Bin" || section === "Invoices") return;
    if (section === "Policies" || section === "Agents") {
      if (!(await ensureFormOptions(section))) return;
    }
    setEditingRecord({ section: section as EditableSection, row });
    setModal("edit");
  }

  async function refreshCurrentSection() {
    if (section === "Overview") {
      await refreshData(undefined, true);
      return;
    }
    if (section === "Recycle Bin") {
      if (await loadRecycleBin(true)) setToast("Recycle bin refreshed");
      return;
    }
    if (await loadDirectoryPage(section, directoryQueries[section], true)) {
      setToast(`${section} refreshed`);
    }
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
      onRefresh={() => void refreshCurrentSection()}
      onExport={() => void exportData(section)}
      onSignOut={signOut}
    >
      {section === "Overview"
        ? <OverviewPage data={data} onViewPolicies={() => openSection("Policies")} onViewRecord={row => void viewRecord(row, "Policies")} />
        : <DirectoryPage
            key={section}
            section={section}
            rows={section === "Recycle Bin" ? data.recycleBin : directoryRows[section] ?? getRows(data, section) ?? []}
            loading={loading}
            query={directoryQueries[section]}
            pageMetadata={section === "Recycle Bin" ? undefined : pageMetadata[section]}
            vendorOptions={vendorOptions}
            onQueryChange={query => updateDirectoryQuery(section, query)}
            onExport={section === "Recycle Bin" || section === "Invoices" ? undefined : query => void exportData(section, query)}
            onToggleStatus={section === "Vendors" || section === "Plans" ? row => void toggleStatus(row, section) : undefined}
            onEditRecord={section !== "Recycle Bin" && section !== "Invoices" ? row => void openEdit(row) : undefined}
            onViewRecord={section === "Invoices" ? row => void viewInvoice(row) : section !== "Recycle Bin" ? row => void viewRecord(row, section) : undefined}
            onDeleteRecord={section !== "Recycle Bin" && section !== "Invoices" ? row => setRecordToDelete({ section, row }) : undefined}
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
    {invoiceToView && <InvoiceDialog row={invoiceToView} loading={invoiceLoading} onClose={closeInvoiceDialog} onDownload={downloadInvoice} />}
    {selectedRecord && <RecordDetailsDialog
      key={`${selectedRecord.section}-${selectedRecord.row.id ?? "record"}`}
      record={selectedRecord}
      loading={recordLoading}
      policyFiles={selectedRecord.section === "Policies" && policyFiles?.policyId === String(selectedRecord.row.id ?? "") ? policyFiles.items : null}
      policyFilesLoading={policyFilesLoading}
      policyFilesError={policyFilesError}
      onLoadPolicyFiles={() => void loadPolicyFiles()}
      onClose={closeRecordDetails}
    />}
    {recordToDelete && <RecordDeleteDialog record={recordToDelete} deleting={deleteLoading} onDelete={() => void confirmDelete()} onClose={() => { if (!deleteLoading) setRecordToDelete(null); }} />}
    {recordToPurge && <RecycleBinPurgeDialog record={recordToPurge} deleting={deleteLoading} onDelete={() => void confirmPurge()} onClose={() => { if (!deleteLoading) setRecordToPurge(null); }} />}
    {toast && <div role="status" aria-live="polite" className="fixed bottom-5 right-5 z-[70] max-w-[calc(100vw-40px)] rounded-[6px] bg-[#203d2d] px-4 py-3 text-[12px] font-medium text-white shadow-lg">{toast}</div>}
  </>;
}