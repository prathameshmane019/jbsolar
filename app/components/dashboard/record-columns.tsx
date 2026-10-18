"use client";

import dynamic from "next/dynamic";
import { StatusPill } from "./ui";
import { formatCurrency, type Row, type Section } from "./types";

const InvoiceDownloadButton = dynamic(() => import("../InvoiceDownloadButton").then(module => module.InvoiceDownloadButton), {
  loading: () => <span aria-label="Loading download action" className="inline-block h-3.5 w-3.5 animate-pulse rounded-full bg-[#e5e8e0]" />,
});

export function columnsFor(section: Section) {
  if (section === "Recycle Bin") return [
    { key: "label", label: "RECORD" },
    { key: "resource", label: "RESOURCE" },
    { key: "deletedAt", label: "DELETED", render: (row: Row) => row.deletedAt ? new Date(String(row.deletedAt)).toLocaleString("en-IN") : "—" },
  ];
  if (section === "Invoices") return [
    { key: "invoiceNumber", label: "INVOICE" },
    { key: "policyNumber", label: "POLICY" },
    { key: "farmerName", label: "FARMER" },
    { key: "invoiceDate", label: "DATE", render: (row: Row) => new Date(String(row.invoiceDate)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
    { key: "totalAmount", label: "TOTAL", render: (row: Row) => formatCurrency(Number(row.totalAmount)) },
    { key: "pdf", label: "PDF", render: (row: Row) => <InvoiceDownloadButton row={row} /> },
  ];
  if (section === "Policies") return [
    { key: "policyNumber", label: "POLICY" },
    { key: "farmerName", label: "FARMER" },
    { key: "planName", label: "PLAN" },
    { key: "startDate", label: "START DATE", render: (row: Row) => new Date(String(row.startDate)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) },
    { key: "totalAmount", label: "PREMIUM", render: (row: Row) => formatCurrency(Number(row.totalAmount)) },
    { key: "status", label: "STATUS", render: (row: Row) => <StatusPill status={String(row.status)} /> },
  ];
  if (section === "Farmers") return [
    { key: "customerCode", label: "CUSTOMER ID" },
    { key: "fullName", label: "FARMER" },
    { key: "mobile", label: "MOBILE" },
    { key: "district", label: "DISTRICT" },
    { key: "createdAt", label: "JOINED", render: (row: Row) => row.createdAt ? new Date(String(row.createdAt)).toLocaleDateString("en-IN") : "Recently" },
  ];
  if (section === "Vendors") return [
    { key: "vendorCode", label: "VENDOR CODE" },
    { key: "name", label: "VENDOR" },
    { key: "contactPerson", label: "CONTACT PERSON" },
    { key: "mobile", label: "MOBILE" },
    { key: "email", label: "EMAIL" },
    { key: "status", label: "STATUS", render: (row: Row) => <StatusPill status={String(row.status)} /> },
  ];
  if (section === "Agents") return [
    { key: "agentCode", label: "ID" },
    { key: "fullName", label: "AGENT" },
    { key: "vendorName", label: "VENDOR" },
    { key: "mobile", label: "MOBILE" },
    { key: "status", label: "STATUS", render: (row: Row) => <StatusPill status={String(row.status)} /> },
  ];
  return [
    { key: "planCode", label: "Plan Code" },
    { key: "name", label: "PLAN" },
    { key: "durationMonths", label: "DURATION", render: (row: Row) => `${row.durationMonths} months` },
    { key: "price", label: "BASE PRICE", render: (row: Row) => formatCurrency(Number(row.price)) },
    { key: "gstPercentage", label: "GST", render: (row: Row) => `${row.gstPercentage}%` },
    { key: "status", label: "STATUS", render: (row: Row) => <StatusPill status={String(row.status)} /> },
  ];
}
