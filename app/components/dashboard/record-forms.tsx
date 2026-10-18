"use client";

import { useRef, useState, type FormEvent } from "react";
import { Field } from "./ui";
import type { ReferenceData, Row, Section } from "./types";
import VendorAgentFields from "./VendorAgentFields";
import { SearchSelect, type Choice } from "../search-select";

export type EditableSection = Exclude<Section, "Overview" | "Recycle Bin">;

/* ------------------------------------------------------------------ */
/* Validation messages                                                 */
/* ------------------------------------------------------------------ */

type FormEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const FIELD_LABELS: Record<string, string> = {
  fullName: "full name",
  mobile: "mobile number",
  aadhaar: "Aadhaar number",
  aadhaarNumber: "Aadhaar number",
  district: "district",
  taluka: "taluka",
  village: "village",
  address: "address",
  name: "name",
  contactPerson: "contact person",
  email: "email address",
  vendorId: "vendor",
  farmerId: "farmer",
  policyPlanId: "policy plan",
  agentId: "agent",
  status: "status",
  initialPassword: "password",
  description: "description",
  durationMonths: "duration",
  price: "base price",
  gstPercentage: "GST percentage",
  termsAndConditions: "terms and conditions",
  startDate: "start date",
};

const PATTERN_MESSAGES: Record<string, string> = {
  mobile: "Enter a valid mobile number, e.g. +91 98765 43210.",
  aadhaar: "Aadhaar number must be exactly 12 digits and cannot start with 0 or 1.",
  aadhaarNumber: "Aadhaar number must be exactly 12 digits and cannot start with 0 or 1.",
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function messageFor(el: FormEl): string {
  const v = el.validity;
  const label = FIELD_LABELS[el.name] ?? "this field";

  if (v.valueMissing) {
    if (el instanceof HTMLSelectElement) return `Please select a ${label}.`;
    if (el.type === "date") return `Please choose the ${label}.`;
    return `Please enter the ${label}.`;
  }
  if (v.typeMismatch) {
    return el.type === "email"
      ? "Enter a valid email address, e.g. name@company.in."
      : `Enter a valid ${label}.`;
  }
  if (v.patternMismatch) return PATTERN_MESSAGES[el.name] ?? `Enter a valid ${label}.`;
  // maxLength/minLength only exist on text-like elements, not <select>
  if (v.tooLong) return `${capitalize(label)} must be at most ${(el as HTMLInputElement | HTMLTextAreaElement).maxLength} characters.`;
  if (v.tooShort) return `${capitalize(label)} must be at least ${(el as HTMLInputElement | HTMLTextAreaElement).minLength} characters.`;
  if (v.rangeUnderflow) return `${capitalize(label)} must be at least ${(el as HTMLInputElement).min}.`;
  if (v.rangeOverflow) return `${capitalize(label)} must be at most ${(el as HTMLInputElement).max}.`;
  if (v.stepMismatch) {
    return (el as HTMLInputElement).step === "1"
      ? `${capitalize(label)} must be a whole number.`
      : `${capitalize(label)} has too many decimal places.`;
  }
  return el.validationMessage;
}

/** Spread on <form>: shows friendly messages and clears them as soon as the user edits the field. */
const validationProps = {
  onInvalidCapture: (e: FormEvent<HTMLFormElement>) => {
    const el = e.target as FormEl;
    if (typeof el.setCustomValidity !== "function") return;
    el.setCustomValidity(""); // reset so native flags are accurate
    el.setCustomValidity(messageFor(el));
  },
  onInput: (e: FormEvent<HTMLFormElement>) => {
    const el = e.target as FormEl;
    if (typeof el.setCustomValidity === "function") el.setCustomValidity("");
  },
};

/* ------------------------------------------------------------------ */
/* Submit handling + loader                                            */
/* ------------------------------------------------------------------ */

type SubmitHandler = (event: FormEvent<HTMLFormElement>) => void | Promise<void>;

/**
 * Blocks repeat submits. If onSubmit returns a promise, the form stays locked until it settles.
 * If it doesn't, pass the `saving` prop from the parent instead.
 */
function useGuardedSubmit(onSubmit: SubmitHandler, saving: boolean) {
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const busy = saving || pending;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (lock.current || saving) {
      event.preventDefault();
      return;
    }
    const result = onSubmit(event);
    if (result instanceof Promise) {
      lock.current = true;
      setPending(true);
      result.finally(() => {
        lock.current = false;
        setPending(false);
      });
    }
  };

  return { busy, handleSubmit };
}

function Spinner() {
  return (
    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function FormActions({ busy, onCancel, label }: { busy: boolean; onCancel: () => void; label: string }) {
  return (
    <div className="flex justify-end gap-2 border-t border-[#edf0e9] pt-4">
      <button
        type="button"
        disabled={busy}
        onClick={onCancel}
        className="h-9 rounded-[5px] px-3 text-[11px] font-semibold text-[#626b60] hover:bg-[#f1f3ee] disabled:cursor-not-allowed disabled:opacity-60"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={busy}
        aria-busy={busy}
        className="inline-flex h-9 items-center justify-center gap-2 rounded-[5px] bg-[#285c3b] px-4 text-[11px] font-semibold text-white hover:bg-[#1f4d31] disabled:cursor-wait disabled:opacity-60"
      >
        {busy && <Spinner />}
        {busy ? "Saving..." : label}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Create                                                              */
/* ------------------------------------------------------------------ */

export function CreateForm({
  section,
  data,
  onSubmit,
  onCancel,
  saving = false,
}: {
  section: Section;
  data: ReferenceData;
  onSubmit: SubmitHandler;
  onCancel: () => void;
  saving?: boolean;
}) {
  const { busy, handleSubmit } = useGuardedSubmit(onSubmit, saving);

  const vendorOptions = data.vendors.map(item => <option key={item.id} value={item.id}>{item.name}</option>);
  const farmerChoices: Choice[] = data.farmers.map(f => ({ value: String(f.id), label: String(f.fullName), hint: String(f.mobile ?? "") }));
  const planChoices: Choice[] = data.plans.filter(p => p.status === "ACTIVE").map(p => ({ value: String(p.id), label: String(p.name) }));

  return (
    <form onSubmit={handleSubmit} {...validationProps} className="space-y-3.5">
      {section === "Farmers" && <>
        <Field label="Full name"><input name="fullName" required maxLength={150} placeholder="Farmer name" /></Field>
        <Field label="Mobile number">
          <input type="tel" name="mobile" required pattern="^\+?[0-9]{1,4}[ \-]?[0-9]{6,12}$" placeholder="+91 98765 43210" />
        </Field>
        <Field label="Aadhaar number">
          <input type="text" name="aadhaarNumber" required inputMode="numeric" pattern="^[2-9][0-9]{11}$" placeholder="12-digit Aadhaar Number" />
        </Field>
        <Field label="District"><input name="district" maxLength={100} placeholder="District" /></Field>
        <Field label="Taluka"><input name="taluka" maxLength={100} placeholder="Taluka" /></Field>
        <Field label="Village"><input name="village" maxLength={100} placeholder="Village" /></Field>
        <Field label="Address"><input name="address" maxLength={2000} placeholder="Full address" /></Field>
      </>}

      {section === "Vendors" && <>
        <Field label="Vendor name"><input name="name" required maxLength={150} placeholder="Company name" /></Field>
        <Field label="Contact person"><input name="contactPerson" maxLength={100} placeholder="Full name" /></Field>
        <Field label="Mobile number"><input name="mobile" maxLength={20} placeholder="+91 98765 43210" /></Field>
        <Field label="Email"><input name="email" type="email" maxLength={150} placeholder="name@company.in" /></Field>
      </>}

      {section === "Agents" && <>
        <Field label="Vendor">
          <select name="vendorId" required defaultValue=""><option value="" disabled>Select a vendor</option>{vendorOptions}</select>
        </Field>
        <Field label="Full name"><input name="fullName" required maxLength={150} placeholder="Agent name" /></Field>
        <Field label="Mobile number"><input name="mobile" required pattern="[+0-9][0-9+ -]{7,19}" placeholder="+91 98765 43210" /></Field>
        <Field label="Initial password"><input name="initialPassword" type="password" required maxLength={100} placeholder="Enter a password" /></Field>
      </>}

      {section === "Plans" && <>
        <Field label="Plan name"><input name="name" required maxLength={150} placeholder="e.g. Harvest Protect Plus" /></Field>
        <Field label="Description"><input name="description" maxLength={2000} placeholder="Short plan description" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duration (months)"><input name="durationMonths" type="number" min="1" step="1" required placeholder="12" /></Field>
          <Field label="Base price (INR)"><input name="price" type="number" min="0.01" step="0.01" required placeholder="12000" /></Field>
        </div>
        <Field label="GST percentage"><input name="gstPercentage" type="number" min="0" step="0.01" required placeholder="18" /></Field>
        <Field label="Terms and conditions"><input name="termsAndConditions" maxLength={5000} placeholder="Plan terms" /></Field>
      </>}

      {section === "Policies" && <>
        <Field label="Farmer"><SearchSelect name="farmerId" required options={farmerChoices} placeholder="Search farmer by name or mobile" /></Field>
        <Field label="Policy plan"><SearchSelect name="policyPlanId" required options={planChoices} placeholder="Search active plan" /></Field>
        <Field label="Start date"><input name="startDate" type="date" required /></Field>
        <VendorAgentFields vendors={data.vendors} agents={data.agents} />
      </>}

      <FormActions busy={busy} onCancel={onCancel} label={`Save ${section.slice(0, -1).toLowerCase()}`} />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Edit                                                                */
/* ------------------------------------------------------------------ */

export function EditForm({
  record,
  data,
  onSubmit,
  onCancel,
  saving = false,
}: {
  record: { section: EditableSection; row: Row };
  data: ReferenceData;
  onSubmit: SubmitHandler;
  onCancel: () => void;
  saving?: boolean;
}) {
  const { section, row } = record;
  const { busy, handleSubmit } = useGuardedSubmit(onSubmit, saving);

  const vendorOptions = data.vendors.map(item => <option key={item.id} value={item.id}>{item.name}</option>);
  const farmerChoices: Choice[] = data.farmers.map(f => ({ value: String(f.id), label: String(f.fullName), hint: String(f.mobile ?? "") }));
  const planChoices: Choice[] = data.plans.filter(p => p.status === "ACTIVE").map(p => ({ value: String(p.id), label: String(p.name) }));

  return (
    <form onSubmit={handleSubmit} {...validationProps} className="space-y-3.5">
      {section === "Farmers" && <>
        <Field label="Full name"><input name="fullName" required maxLength={150} defaultValue={String(row.fullName ?? "")} /></Field>
        <Field label="Mobile number"><input name="mobile" required pattern="[+0-9][0-9+ -]{7,19}" defaultValue={String(row.mobile ?? "")} /></Field>
        <Field label="Aadhaar number"><input name="aadhaar" required inputMode="numeric" pattern="^[2-9][0-9]{11}$" defaultValue={String(row.aadhaar ?? "")} /></Field>
        <Field label="District"><input name="district" maxLength={100} defaultValue={String(row.district ?? "")} /></Field>
        <Field label="Taluka"><input name="taluka" maxLength={100} defaultValue={String(row.taluka ?? "")} /></Field>
        <Field label="Village"><input name="village" maxLength={100} defaultValue={String(row.village ?? "")} /></Field>
        <Field label="Address"><input name="address" maxLength={2000} defaultValue={String(row.address ?? "")} /></Field>
      </>}

      {section === "Vendors" && <>
        <Field label="Vendor name"><input name="name" required maxLength={150} defaultValue={String(row.name ?? "")} /></Field>
        <Field label="Contact person"><input name="contactPerson" maxLength={100} defaultValue={String(row.contactPerson ?? "")} /></Field>
        <Field label="Mobile number"><input name="mobile" maxLength={20} defaultValue={String(row.mobile ?? "")} /></Field>
        <Field label="Email"><input name="email" type="email" maxLength={150} defaultValue={String(row.email ?? "")} /></Field>
      </>}

      {section === "Agents" && <>
        <Field label="Vendor">
          <select name="vendorId" required defaultValue={String(row.vendorId ?? "")}><option value="" disabled>Select a vendor</option>{vendorOptions}</select>
        </Field>
        <Field label="Full name"><input name="fullName" required maxLength={150} defaultValue={String(row.fullName ?? "")} /></Field>
        <Field label="Mobile number"><input name="mobile" required pattern="[+0-9][0-9+ -]{7,19}" defaultValue={String(row.mobile ?? "")} /></Field>
        <Field label="Status">
          <select name="status" required defaultValue={String(row.status ?? "ACTIVE")}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </Field>
      </>}

      {section === "Policies" && <>
        <Field label="Farmer">
          <SearchSelect name="farmerId" required options={farmerChoices} defaultValue={String(row.farmerId ?? "")} fallbackLabel={String(row.farmerName ?? row.farmerFullName ?? "")} />
        </Field>
        <Field label="Policy plan">
          <SearchSelect name="policyPlanId" required options={planChoices} defaultValue={String(row.policyPlanId ?? row.planId ?? "")} fallbackLabel={String(row.planName ?? "")} />
        </Field>
        <Field label="Start date"><input name="startDate" type="date" required defaultValue={String(row.startDate ?? "").slice(0, 10)} /></Field>
        <VendorAgentFields
          vendors={data.vendors}
          agents={data.agents}
          defaultVendorId={String(row.vendorId ?? "")}
          defaultAgentId={String(row.agentId ?? "")}
          agentFallback={String(row.agentName ?? "")}
        />
      </>}

      {section === "Plans" && <>
        <Field label="Plan name"><input name="name" required maxLength={150} defaultValue={String(row.name ?? "")} /></Field>
        <Field label="Description"><input name="description" maxLength={2000} defaultValue={String(row.description ?? "")} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duration (months)"><input name="durationMonths" type="number" min="1" step="1" required defaultValue={Number(row.durationMonths)} /></Field>
          <Field label="Base price (INR)"><input name="price" type="number" min="0.01" step="0.01" required defaultValue={Number(row.price)} /></Field>
        </div>
        <Field label="GST percentage"><input name="gstPercentage" type="number" min="0" step="0.01" required defaultValue={Number(row.gstPercentage)} /></Field>
        <Field label="Terms and conditions"><input name="termsAndConditions" maxLength={5000} defaultValue={String(row.termsAndConditions ?? "")} /></Field>
      </>}

      <FormActions busy={busy} onCancel={onCancel} label="Save changes" />
    </form>
  );
}