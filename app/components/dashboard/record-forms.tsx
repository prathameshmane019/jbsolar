"use client";

import { useState, type FormEvent } from "react";
import { Field } from "./ui";
import type { ReferenceData, Row, Section } from "./types";
import VendorAgentFields from "./VendorAgentFields";
import { SearchSelect, type Choice } from "../search-select";

export type EditableSection = Exclude<Section, "Overview" | "Recycle Bin">;

export function CreateForm({ section, data, onSubmit, onCancel }: { section: Section; data: ReferenceData; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  const farmerOptions = data.farmers.map(item => <option key={item.id} value={item.id}>{item.fullName} · {item.mobile}</option>);
  const vendorOptions = data.vendors.map(item => <option key={item.id} value={item.id}>{item.name}</option>);
  const planOptions = data.plans.filter(item => item.status === "ACTIVE").map(item => <option key={item.id} value={item.id}>{item.name}</option>);
  const farmerChoices: Choice[] = data.farmers.map(f => ({ value: String(f.id), label: String(f.fullName), hint: String(f.mobile ?? "") }));
const planChoices: Choice[] = data.plans.filter(p => p.status === "ACTIVE").map(p => ({ value: String(p.id), label: String(p.name) }));
  return <form onSubmit={onSubmit} className="space-y-3.5">
    {section === "Farmers" && <><Field label="Full name"><input name="fullName" required maxLength={150} placeholder="Farmer name" /></Field>
    <Field label="Mobile number">
  <input type="tel" name="mobile" required pattern="^\+?[0-9]{1,4}[ \-]?[0-9]{6,12}$" placeholder="+91 98765 43210" />
</Field>


<Field label="Aadhaar number">
  <input type="text" name="aadhaarNumber" required pattern="^[2-9][0-9]{11}$" placeholder="12-digit Aadhaar Number" />
</Field>
<Field label="District"><input name="district" maxLength={100} placeholder="District" /></Field><Field label="Taluka"><input name="taluka" maxLength={100} placeholder="Taluka" /></Field><Field label="Village"><input name="village" maxLength={100} placeholder="Village" /></Field><Field label="Address"><input name="address" maxLength={2000} placeholder="Full address" /></Field></>}
    {section === "Vendors" && <><Field label="Vendor name"><input name="name" required maxLength={150} placeholder="Company name" /></Field><Field label="Contact person"><input name="contactPerson" maxLength={100} placeholder="Full name" /></Field><Field label="Mobile number"><input name="mobile" maxLength={20} placeholder="+91 98765 43210" /></Field><Field label="Email"><input name="email" type="email" maxLength={150} placeholder="name@company.in" /></Field></>}
    {section === "Agents" && <><Field label="Vendor"><select name="vendorId" required defaultValue=""><option value="" disabled>Select a vendor</option>{vendorOptions}</select></Field><Field label="Full name"><input name="fullName" required maxLength={150} placeholder="Agent name" /></Field><Field label="Mobile number"><input name="mobile" required pattern="[+0-9][0-9+ -]{7,19}" placeholder="+91 98765 43210" /></Field><Field label="Initial password"><input name="initialPassword" type="password" required minLength={4} maxLength={100} placeholder="At least 10 characters" /></Field></>}
    {section === "Plans" && <><Field label="Plan name"><input name="name" required maxLength={150} placeholder="e.g. Harvest Protect Plus" /></Field><Field label="Description"><input name="description" maxLength={2000} placeholder="Short plan description" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Duration (months)"><input name="durationMonths" type="number" min="1" step="1" required placeholder="12" /></Field><Field label="Base price (INR)"><input name="price" type="number" min="0.01" step="0.01" required placeholder="12000" /></Field></div><Field label="GST percentage"><input name="gstPercentage" type="number" min="0" step="0.01" required placeholder="18" /></Field><Field label="Terms and conditions"><input name="termsAndConditions" maxLength={5000} placeholder="Plan terms" /></Field></>}
   {section === "Policies" && <>
  <Field label="Farmer"><SearchSelect name="farmerId" required options={farmerChoices} placeholder="Search farmer by name or mobile" /></Field>
  <Field label="Policy plan"><SearchSelect name="policyPlanId" required options={planChoices} placeholder="Search active plan" /></Field>
  <Field label="Start date"><input name="startDate" type="date" required /></Field>
  <VendorAgentFields vendors={data.vendors} agents={data.agents} />
</>}
    <div className="flex justify-end gap-2 border-t border-[#edf0e9] pt-4"><button type="button" onClick={onCancel} className="h-9 rounded-[5px] px-3 text-[11px] font-semibold text-[#626b60] hover:bg-[#f1f3ee]">Cancel</button><button className="h-9 rounded-[5px] bg-[#285c3b] px-4 text-[11px] font-semibold text-white hover:bg-[#1f4d31]">Save {section.slice(0, -1).toLowerCase()}</button></div>
  </form>;
}

export function EditForm({ record, data, onSubmit, onCancel, saving = false }: { record: { section: EditableSection; row: Row }; data: ReferenceData; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void; saving?: boolean }) {
  const { section, row } = record;
  const farmerChoices: Choice[] = data.farmers.map(f => ({ value: String(f.id), label: String(f.fullName), hint: String(f.mobile ?? "") }));
const planChoices: Choice[] = data.plans.filter(p => p.status === "ACTIVE").map(p => ({ value: String(p.id), label: String(p.name) }));
  // const farmerOptions = data.farmers.map(item => <option key={item.id} value={item.id}>{item.fullName} · {item.mobile}</option>);
  const vendorOptions = data.vendors.map(item => <option key={item.id} value={item.id}>{item.name}</option>);
  // const planOptions = data.plans.map(item => <option key={item.id} value={item.id}>{item.name}</option>);
  return <form onSubmit={onSubmit} className="space-y-3.5">
    {section === "Farmers" && <><Field label="Full name"><input name="fullName" required maxLength={150} defaultValue={String(row.fullName ?? "")} /></Field>
    <Field label="Mobile number"><input name="mobile" required pattern="[+0-9][0-9+ -]{7,19}" defaultValue={String(row.mobile ?? "")} /></Field>
    <Field label="Aadhaar number"><input name="aadhaar" required pattern="[+0-12][0-9+ -]{7,19}" defaultValue={String(row.aadhaar ?? "")} /></Field><Field label="District"><input name="district" maxLength={100} defaultValue={String(row.district ?? "")} /></Field><Field label="Taluka"><input name="taluka" maxLength={100} defaultValue={String(row.taluka ?? "")} /></Field><Field label="Village"><input name="village" maxLength={100} defaultValue={String(row.village ?? "")} /></Field><Field label="Address"><input name="address" maxLength={2000} defaultValue={String(row.address ?? "")} /></Field></>}
    {section === "Vendors" && <><Field label="Vendor name"><input name="name" required maxLength={150} defaultValue={String(row.name ?? "")} /></Field><Field label="Contact person"><input name="contactPerson" maxLength={100} defaultValue={String(row.contactPerson ?? "")} /></Field><Field label="Mobile number"><input name="mobile" maxLength={20} defaultValue={String(row.mobile ?? "")} /></Field><Field label="Email"><input name="email" type="email" maxLength={150} defaultValue={String(row.email ?? "")} /></Field></>}
    {section === "Agents" && <><Field label="Vendor"><select name="vendorId" required defaultValue={String(row.vendorId ?? "")}><option value="" disabled>Select a vendor</option>{vendorOptions}</select></Field><Field label="Full name"><input name="fullName" required maxLength={150} defaultValue={String(row.fullName ?? "")} /></Field><Field label="Mobile number"><input name="mobile" required pattern="[+0-9][0-9+ -]{7,19}" defaultValue={String(row.mobile ?? "")} /></Field><Field label="Status"><select name="status" required defaultValue={String(row.status ?? "ACTIVE")}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></Field></>}
   {section === "Policies" && <>
  <Field label="Farmer"><SearchSelect name="farmerId" required options={farmerChoices}
    defaultValue={String(row.farmerId ?? "")} fallbackLabel={String(row.farmerName ?? row.farmerFullName ?? "")} /></Field>
  <Field label="Policy plan"><SearchSelect name="policyPlanId" required options={planChoices}
    defaultValue={String(row.policyPlanId ?? row.planId ?? "")} fallbackLabel={String(row.planName ?? "")} /></Field>
  <Field label="Start date"><input name="startDate" type="date" required defaultValue={String(row.startDate ?? "").slice(0, 10)} /></Field>
  <VendorAgentFields vendors={data.vendors} agents={data.agents}
    defaultVendorId={String(row.vendorId ?? "")} defaultAgentId={String(row.agentId ?? "")} agentFallback={String(row.agentName ?? "")} />
</>}
     {section === "Plans" && <><Field label="Plan name"><input name="name" required maxLength={150} defaultValue={String(row.name ?? "")} /></Field><Field label="Description"><input name="description" maxLength={2000} defaultValue={String(row.description ?? "")} /></Field><div className="grid grid-cols-2 gap-3"><Field label="Duration (months)"><input name="durationMonths" type="number" min="1" step="1" required defaultValue={Number(row.durationMonths)} /></Field><Field label="Base price (INR)"><input name="price" type="number" min="0.01" step="0.01" required defaultValue={Number(row.price)} /></Field></div><Field label="GST percentage"><input name="gstPercentage" type="number" min="0" step="0.01" required defaultValue={Number(row.gstPercentage)} /></Field><Field label="Terms and conditions"><input name="termsAndConditions" maxLength={5000} defaultValue={String(row.termsAndConditions ?? "")} /></Field></>}
    <div className="flex justify-end gap-2 border-t border-[#edf0e9] pt-4"><button type="button" disabled={saving} onClick={onCancel} className="h-9 rounded-[5px] px-3 text-[11px] font-semibold text-[#626b60] hover:bg-[#f1f3ee] disabled:cursor-wait disabled:opacity-60">Cancel</button><button type="submit" disabled={saving} className="h-9 rounded-[5px] bg-[#285c3b] px-4 text-[11px] font-semibold text-white hover:bg-[#1f4d31] disabled:cursor-wait disabled:opacity-60">{saving ? "Saving..." : "Save changes"}</button></div>
  </form>;
}
 
 