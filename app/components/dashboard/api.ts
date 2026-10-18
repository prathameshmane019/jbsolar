import { API_URL, type DirectoryQuery, type NormalizedPageResponse, type PageResponse, type Row } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  });
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || `Request failed (${response.status})`, response.status);
  }
  if (response.status === 204) return undefined as T;
  const body = await response.text();
  return body ? JSON.parse(body) as T : undefined as T;
}

export async function apiDownload(path: string, token: string) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!response.ok) {
    const message = await response.text();
    throw new ApiError(message || `Export failed (${response.status})`, response.status);
  }
  return {
    blob: await response.blob(),
    disposition: response.headers.get("content-disposition"),
    contentType: response.headers.get("content-type"),
  };
}

export function serializeDirectoryQuery(query: DirectoryQuery, includePagination = true) {
  const params = new URLSearchParams();
  if (includePagination) {
    params.set("page", String(query.page));
    params.set("size", String(query.size));
  }
  params.set("sort", query.sort);
  params.set("direction", query.direction);
  if (query.search.trim()) params.set("search", query.search.trim());
  if (query.status) params.set("status", query.status);
  if (query.createdFrom) params.set("createdFrom", query.createdFrom);
  if (query.createdTo) params.set("createdTo", query.createdTo);
  if (query.vendorId) params.set("vendorId", query.vendorId);
  return params.toString();
}

export function normalizePageResponse<T extends Row>(
  response: PageResponse<T>,
  page: number,
  size: number,
): NormalizedPageResponse<T> {
  const content = response?.content;
  if (!Array.isArray(content)) {
    throw new TypeError("The API returned an invalid paginated response.");
  }
  const responseSize = response.size ?? size;
  const totalElements = response.totalElements ?? content.length;
  return {
    ...response,
    content,
    page: response.page ?? page,
    size: responseSize,
    totalElements,
    totalPages: response.totalPages ?? (totalElements === 0 ? 0 : Math.ceil(totalElements / Math.max(responseSize, 1))),
  };
}
