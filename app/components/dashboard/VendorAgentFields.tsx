import { useState } from "react";
import { Field } from "./ui";
import { Row } from "./types";

import { SearchSelect, type Choice } from "../search-select";

export default function VendorAgentFields({ vendors, agents, defaultVendorId = "", defaultAgentId = "", agentFallback = "" }: {
  vendors: Row[]; agents: Row[]; defaultVendorId?: string; defaultAgentId?: string; agentFallback?: string;
}) {
  const [vendorId, setVendorId] = useState(defaultVendorId);
  const [agentId, setAgentId] = useState(defaultAgentId);

  const vendorChoices: Choice[] = vendors.map(v => ({ value: String(v.id), label: String(v.name) }));
  const agentChoices: Choice[] = agents
    .filter(a => String(a.id) === agentId || (a.status !== "INACTIVE" && (!vendorId || String(a.vendorId) === vendorId)))
    .map(a => ({ value: String(a.id), label: String(a.fullName), hint: String(a.mobile ?? "") }));

  return <>
    <Field label="Vendor (optional)">
      <SearchSelect name="vendorId" options={vendorChoices} defaultValue={vendorId}
        emptyLabel="No vendor assigned" placeholder="Search vendor"
        onChange={v => { if (v !== vendorId) { setVendorId(v); setAgentId(""); } }} />
    </Field>
    <Field label="Agent (optional)">
      <SearchSelect key={vendorId} name="agentId" options={agentChoices} defaultValue={agentId}
        fallbackLabel={agentFallback} emptyLabel="No agent assigned"
        placeholder="Search agent by name or mobile" onChange={setAgentId} />
    </Field>
  </>;
}