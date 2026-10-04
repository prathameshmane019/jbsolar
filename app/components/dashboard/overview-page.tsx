"use client";

import { useMemo } from "react";
import { DataTable, Metric } from "./ui";
import { formatCurrency, type ResourceData, type Row } from "./types";
import { columnsFor } from "./directory-page";

export function OverviewPage({
  data,
  onViewPolicies,
  onViewRecord,
}: {
  data: ResourceData;
  onViewPolicies: () => void;
  onViewRecord: (row: Row) => void;
}) {
  const monthlyPolicies = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - 5 + index, 1);
      const count = data.policies.filter(policy => {
        const startDate = new Date(policy.startDate);
        return startDate.getFullYear() === monthDate.getFullYear() && startDate.getMonth() === monthDate.getMonth();
      }).length;
      return { month: monthDate.toLocaleDateString("en-IN", { month: "short" }), count };
    });
  }, [data.policies]);
  const monthlyPeak = Math.max(...monthlyPolicies.map(item => item.count), 1);
  const activePolicies = data.policies.filter(row => row.status === "ACTIVE").length;
  const pendingPolicies = data.policies.filter(row => row.status === "PENDING").length;
  const otherPolicies = Math.max(0, data.policies.length - activePolicies - pendingPolicies);
  const activeShare = data.policies.length ? activePolicies / data.policies.length * 100 : 0;
  const pendingShareEnd = data.policies.length ? activeShare + pendingPolicies / data.policies.length * 100 : 0;
  const activePremiums = data.policies.filter(item => item.status === "ACTIVE").reduce((sum, item) => sum + Number(item.totalAmount), 0);

  return <>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Total policies" value={data.policies.length.toLocaleString("en-IN")} note="All policies on record" icon="file" tint="green" />
      <Metric label="Registered farmers" value={data.farmers.length.toLocaleString("en-IN")} note="Profiles on record" icon="users" tint="yellow" />
      <Metric label="Active vendors" value={String(data.vendors.filter(item => item.status === "ACTIVE").length)} note="Partner accounts" icon="building" tint="blue" />
      <Metric label="Active premiums" value={formatCurrency(activePremiums)} note="Active policy premiums" icon="layers" tint="coral" />
    </div>

    <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(310px,0.85fr)]">
      <section aria-labelledby="activity-title" className="rounded-[8px] border border-[#e8eae3] bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="activity-title" className="text-[14px] font-semibold">Policy activity</h2><p className="mt-1 text-[11px] text-[#687266]">Policies by start date · last 6 months</p></div><span className="rounded-[5px] border border-[#e6e8e2] px-2.5 py-1.5 text-[10px] font-medium text-[#697267]">6 months</span></div>
        <div className="mt-5 flex items-center gap-4 text-[10px] text-[#687266]"><span className="flex items-center gap-1.5"><i aria-hidden="true" className="h-2 w-2 rounded-sm bg-[#477e50]" />Policies started</span><span className="ml-auto font-semibold text-[#26382a]">{data.policies.length.toLocaleString("en-IN")} <span className="font-normal text-[#687266]">total</span></span></div>
        <div role="img" aria-label={`Monthly policy starts: ${monthlyPolicies.map(item => `${item.month}: ${item.count}`).join(", ")}`} className="mt-4 grid h-[195px] grid-cols-6 items-end gap-3 border-b border-[#eceee9] px-1 sm:gap-6">
          {monthlyPolicies.map(item => <div key={`${item.month}-${item.count}`} className="flex h-full flex-col items-center justify-end gap-2"><div className="flex h-[165px] w-full items-end justify-center"><div title={`${item.count} policies`} style={{ height: `${item.count === 0 ? 3 : Math.max(8, item.count / monthlyPeak * 100)}%` }} className="w-[min(22px,55%)] rounded-t-[3px] bg-[#477e50] transition-all hover:bg-[#285c3b]" /></div><span aria-hidden="true" className="pb-2 text-[10px] text-[#626c60]">{item.month}</span></div>)}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] text-[#687266]"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#58a16a]" />Monthly counts are based on policy start dates</div>
      </section>

      <section aria-labelledby="portfolio-title" className="rounded-[8px] border border-[#e8eae3] bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between"><div><h2 id="portfolio-title" className="text-[14px] font-semibold">Portfolio health</h2><p className="mt-1 text-[11px] text-[#687266]">Policy status distribution</p></div><button type="button" aria-label="View policies" title="View policies" onClick={onViewPolicies} className="rounded p-1.5 text-[#788276] hover:bg-[#f3f5f0]"><span aria-hidden="true">→</span></button></div>
        <div className="mt-5 flex items-center gap-5">
          <div role="img" aria-label={`${activePolicies} active, ${pendingPolicies} pending, ${otherPolicies} other policies`} className="relative grid h-[142px] w-[142px] shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#4c8959 0 ${activeShare}%, #eac45d ${activeShare}% ${pendingShareEnd}%, #e5e9e0 ${pendingShareEnd}% 100%)` }}><div aria-hidden="true" className="grid h-[104px] w-[104px] place-items-center rounded-full bg-white text-center"><div><p className="text-[25px] font-semibold leading-none">{data.policies.length}</p><p className="mt-1 text-[9px] text-[#626c60]">policies</p></div></div></div>
          <div className="min-w-0 flex-1 space-y-4">{[{ label: "Active", value: activePolicies, color: "bg-[#4c8959]" }, { label: "Pending", value: pendingPolicies, color: "bg-[#eac45d]" }, { label: "Other", value: otherPolicies, color: "bg-[#e5e9e0]" }].map(item => <div key={item.label} className="flex items-center justify-between gap-3 text-[11px]"><span className="flex items-center gap-2 text-[#687266]"><i aria-hidden="true" className={`h-2 w-2 rounded-full ${item.color}`} />{item.label}</span><strong className="font-semibold">{item.value}</strong></div>)}</div>
        </div>
        <div className="mt-5 rounded-[6px] bg-[#f4f7f0] px-3.5 py-3"><p className="text-[11px] font-semibold text-[#466444]">Portfolio at a glance</p><p className="mt-1 text-[10px] leading-4 text-[#626c60]">{activePolicies} active · {pendingPolicies} pending · {otherPolicies} other policies</p></div>
      </section>
    </div>

    <section aria-labelledby="recent-policies-title" className="mt-4 overflow-hidden rounded-[8px] border border-[#e8eae3] bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"><div><h2 id="recent-policies-title" className="text-[14px] font-semibold">Recent policies</h2><p className="mt-1 text-[11px] text-[#687266]">Latest activity across your portfolio</p></div><button type="button" onClick={onViewPolicies} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#477e50] hover:text-[#285c3b]">View all <span aria-hidden="true">→</span></button></div>
      <DataTable caption="Recent policies" rows={data.policies.slice(0, 5)} columns={columnsFor("Policies")} loading={false} onViewRecord={onViewRecord} />
    </section>
  </>;
}
