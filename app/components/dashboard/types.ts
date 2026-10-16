import type { FormEvent, ReactNode } from "react";

export type Section = "Overview" | "Policies" | "Farmers" | "Vendors" | "Agents" | "Plans" | "Recycle Bin";
export type ListSection = Exclude<Section, "Overview" | "Recycle Bin">;
export type DirectorySection = Exclude<Section, "Overview">;
export type Status = "ACTIVE" | "INACTIVE" | "PENDING" | "EXPIRED" | "CANCELLED";
export type Row = Record<string, string | number | null | undefined>;
export type DirectoryQuery = {
  page: number;
  size: number;
  sort: string;
  direction: "ASC" | "DESC";
  search: string;
  status: string;
  createdFrom: string;
  createdTo: string;
  vendorId: string;
};
export type PageResponse<T> = {
  content?: T[];
  page?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
};
export type NormalizedPageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
export type PageMetadata = Pick<NormalizedPageResponse<Row>, "page" | "size" | "totalElements" | "totalPages">;

export type Farmer = Row & { id: string; customerCode: string; fullName: string; aadhaar:string; mobile: string; district?: string };
export type Vendor = Row & { id: string; vendorCode:string; name: string; contactPerson?: string; mobile?: string; email?: string; status: Status };
export type Agent = Row & { id: string; fullName: string; mobile: string; vendorName?: string; status: Status };
export type Plan = Row & { id: string; name: string; durationMonths: number; price: number; gstPercentage: number; status: Status };
export type Policy = Row & { id: string; policyNumber: string; farmerName: string; planName: string; startDate: string; endDate: string; totalAmount: number; status: Status };
export type RecycleBinEntry = { resource: string; id: string; label: string; deletedAt: string };
export type ResourceData = { policies: Policy[]; farmers: Farmer[]; vendors: Vendor[]; agents: Agent[]; plans: Plan[]; recycleBin: RecycleBinEntry[] };
export type ReferenceData = Pick<ResourceData, "farmers" | "vendors" | "plans" | "agents">;
export type AuthState = "signedOut" | "loading" | "authenticated" | "error";
export type TableColumn = { key: string; label: string; render?: (row: Row) => ReactNode };
export type RecordAction = (row: Row) => void;
export type RecordStatusAction = (row: Row) => void;
export type RecordFormSubmit = (event: FormEvent<HTMLFormElement>) => void;
export type RecordSelection = { section: Section; row: Row };
export type IconName =
  | "grid" | "file" | "users" | "building" | "badge" | "layers" | "search"
  | "plus" | "arrow" | "download" | "bell" | "close" | "chevron" | "sun"
  | "refresh" | "eye" | "trash";

export const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
export const PAGE_SIZE_OPTIONS = [10, 25, 50];
export const initialDirectoryQueries: Record<ListSection, DirectoryQuery> = {
  Policies: { page: 0, size: 10, sort: "policyNumber", direction: "DESC", search: "", status: "", createdFrom: "", createdTo: "", vendorId: "" },
  Farmers: { page: 0, size: 10, sort: "fullName", direction: "ASC", search: "", status: "", createdFrom: "", createdTo: "", vendorId: "" },
  Vendors: { page: 0, size: 10, sort: "name", direction: "ASC", search: "", status: "", createdFrom: "", createdTo: "", vendorId: "" },
  Agents: { page: 0, size: 10, sort: "fullName", direction: "ASC", search: "", status: "", createdFrom: "", createdTo: "", vendorId: "" },
  Plans: { page: 0, size: 10, sort: "name", direction: "ASC", search: "", status: "", createdFrom: "", createdTo: "", vendorId: "" },
};
export const initialRecycleBinQuery: DirectoryQuery = {
  page: 0, size: 10, sort: "deletedAt", direction: "DESC", search: "", status: "", createdFrom: "", createdTo: "", vendorId: "",
};
export const emptyData: ResourceData = { policies: [], farmers: [], vendors: [], agents: [], plans: [], recycleBin: [] };

export const navigation: { label: Section; icon: IconName }[] = [
  { label: "Overview", icon: "grid" },
  { label: "Policies", icon: "file" },
  { label: "Farmers", icon: "users" },
  { label: "Vendors", icon: "building" },
  { label: "Agents", icon: "badge" },
  { label: "Plans", icon: "layers" },
  { label: "Recycle Bin", icon: "trash" },
];

export const endpointBySection: Partial<Record<Section, keyof ResourceData>> = {
  Policies: "policies",
  Farmers: "farmers",
  Vendors: "vendors",
  Agents: "agents",
  Plans: "plans",
};

export const apiResourceBySection: Partial<Record<Section, string>> = {
  Policies: "policies",
  Farmers: "farmers",
  Vendors: "vendors",
  Agents: "agents",
  Plans: "policy-plans",
};

export const dataKeyByApiResource: Record<string, Exclude<keyof ResourceData, "recycleBin">> = {
  policies: "policies",
  farmers: "farmers",
  vendors: "vendors",
  agents: "agents",
  "policy-plans": "plans",
};
export const sectionByApiResource: Record<string, ListSection> = {
  policies: "Policies",
  farmers: "Farmers",
  vendors: "Vendors",
  agents: "Agents",
  "policy-plans": "Plans",
};

export const sectionDescriptions: Record<Section, string> = {
  Overview: "A clear view of your solar protection portfolio.",
  Policies: "Track coverage, premiums, and policy lifecycle.",
  Farmers: "Manage your registered farmer community.",
  Vendors: "Keep your distribution partners organized.",
  Agents: "Manage the people growing your field network.",
  Plans: "Configure the protection products you offer.",
  "Recycle Bin": "Restore deleted records or permanently remove them.",
};

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

export function getRows(data: ResourceData, section: Section): Row[] {
  if (section === "Recycle Bin") return data.recycleBin;
  const key = endpointBySection[section];
  return key ? data[key] : [];
}

export function recordLabel(section: Section) {
  const labels: Partial<Record<Section, string>> = {
    Policies: "Policy",
    Farmers: "Farmer",
    Vendors: "Vendor",
    Agents: "Agent",
    Plans: "Plan",
    "Recycle Bin": "Deleted record",
  };
  return labels[section] ?? section;
}
