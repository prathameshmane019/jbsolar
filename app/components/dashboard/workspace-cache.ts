import type {
  DirectoryQuery,
  DirectorySection,
  ListSection,
  PageMetadata,
  ReferenceData,
  ResourceData,
  Row,
} from "./types";

const CACHE_KEY = "jbsolar_workspace_cache_v3";
export const WORKSPACE_CACHE_TTL_MS = 5 * 60 * 1000;

export type WorkspaceCache = {
  version: 3;
  apiBaseUrl: string;
  savedAt: number;
  data: ResourceData;
  invoiceDetails: Record<string, ResourceData["invoices"][number]>;
  directoryRows: Partial<Record<ListSection, Row[]>>;
  pageMetadata: Partial<Record<ListSection, PageMetadata>>;
  loadedDirectoryQueries: Partial<Record<ListSection, string>>;
  directoryQueries: Record<DirectorySection, DirectoryQuery>;
  formOptions: ReferenceData;
  formOptionsLoaded: boolean;
  vendorOptions: ResourceData["vendors"];
  vendorOptionsLoaded: boolean;
  recycleBinLoaded: boolean;
};

function isWorkspaceCache(value: unknown): value is WorkspaceCache {
  if (!value || typeof value !== "object") return false;
  const cache = value as Partial<WorkspaceCache>;
  return cache.version === 3
    && typeof cache.apiBaseUrl === "string"
    && typeof cache.savedAt === "number"
    && Number.isFinite(cache.savedAt)
    && Boolean(cache.data)
    && Boolean(cache.invoiceDetails)
    && Array.isArray(cache.data?.policies)
    && Array.isArray(cache.data?.farmers)
    && Array.isArray(cache.data?.vendors)
    && Array.isArray(cache.data?.agents)
    && Array.isArray(cache.data?.plans)
    && Array.isArray(cache.data?.recycleBin)
    && Array.isArray(cache.data?.invoices)
    && Boolean(cache.directoryRows)
    && Boolean(cache.pageMetadata)
    && Boolean(cache.loadedDirectoryQueries)
    && Boolean(cache.directoryQueries)
    && Boolean(cache.formOptions)
    && Array.isArray(cache.formOptions?.farmers)
    && Array.isArray(cache.formOptions?.vendors)
    && Array.isArray(cache.formOptions?.plans)
    && Array.isArray(cache.formOptions?.agents)
    && typeof cache.formOptionsLoaded === "boolean"
    && typeof cache.vendorOptionsLoaded === "boolean"
    && typeof cache.recycleBinLoaded === "boolean";
}

export function readWorkspaceCache(apiBaseUrl: string): WorkspaceCache | null {
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const cache: unknown = JSON.parse(raw);
    if (!isWorkspaceCache(cache) || cache.apiBaseUrl !== apiBaseUrl || cache.savedAt > Date.now()) {
      window.sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return cache;
  } catch (error) {
    console.warn("Could not read the session workspace cache.", error);
    return null;
  }
}

export function writeWorkspaceCache(cache: WorkspaceCache): void {
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn("Could not persist the session workspace cache.", error);
  }
}

export function clearWorkspaceCache(): void {
  try {
    window.sessionStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.warn("Could not clear the session workspace cache.", error);
  }
}
