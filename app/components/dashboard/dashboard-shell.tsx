"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "./ui";
import { navigation, sectionDescriptions, type Section } from "./types";

export function DashboardShell({
  section,
  loading,
  policyCount,
  recycleBinCount,
  children,
  onOpenSection,
  onAdd,
  onRefresh,
  onExport,
  onSignOut,
}: {
  section: Section;
  loading: boolean;
  policyCount: number;
  recycleBinCount: number;
  children: ReactNode;
  onOpenSection: (section: Section) => void;
  onAdd: () => void;
  onRefresh: () => void;
  onExport: () => void;
  onSignOut: () => void;
}) {
  const [mobileNav, setMobileNav] = useState(false);
  const addLabel = section === "Policies" ? "New policy" : section === "Farmers" ? "Add farmer" : section === "Vendors" ? "Add vendor" : section === "Agents" ? "Add agent" : "New plan";

  function navigateTo(nextSection: Section) {
    onOpenSection(nextSection);
    setMobileNav(false);
  }

  return (
    <div className="min-h-dvh bg-[#f6f7f3] text-[#20261f]">
      <a href="#main-content" className="sr-only z-[100] rounded bg-white p-3 text-[#20261f] focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to main content</a>
      <div className="flex min-h-screen">
        {mobileNav && <button type="button" aria-label="Close menu" onClick={() => setMobileNav(false)} className="fixed inset-0 z-30 bg-black/35 lg:hidden" />}
        <aside id="workspace-navigation" aria-label="Workspace navigation" className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-[250px] shrink-0 flex-col bg-[#163b2d] text-white transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-white/10 px-6">
            <div className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#c5e86c] text-[#163b2d]"><Icon name="sun" size={21} /></div>
            <div><p className="text-[15px] font-bold tracking-[0.2px]">JB Solar</p><p className="mt-0.5 text-[10px] font-medium uppercase tracking-[1.5px] text-white/55">Operations</p></div>
          </div>
          <div className="flex-1 px-4 pb-4 pt-7">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[1.6px] text-white/40">Workspace</p>
            <nav className="space-y-1" aria-label="Main navigation">
              {navigation.map(item => <button type="button" key={item.label} onClick={() => navigateTo(item.label)} aria-current={section === item.label ? "page" : undefined} className={`flex h-11 w-full items-center gap-3 rounded-[7px] px-3 text-left text-[13px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c5e86c] ${section === item.label ? "bg-white/12 text-white" : "text-white/65 hover:bg-white/[0.07] hover:text-white"}`}><Icon name={item.icon} size={17} /><span>{item.label}</span>{item.label === "Policies" && <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px]">{policyCount}</span>}{item.label === "Recycle Bin" && recycleBinCount > 0 && <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px]">{recycleBinCount}</span>}</button>)}
            </nav>
          </div>
        </aside>

        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
          <header className="flex h-[76px] items-center justify-between border-b border-[#e8eae3] bg-white px-5 sm:px-8">
            <div className="flex items-center gap-3"><button type="button" aria-label="Open navigation" aria-controls="workspace-navigation" aria-expanded={mobileNav} onClick={() => setMobileNav(true)} className="rounded p-2 text-[#526052] hover:bg-[#f1f3ee] lg:hidden"><Icon name="grid" size={19} /></button><div className="text-[12px] text-[#687266]">Workspace <span aria-hidden="true" className="px-1.5 text-[#c0c4bc]">/</span><span className="font-semibold text-[#3d483d]">{section}</span></div></div>
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                aria-label={loading ? "Refreshing data" : "Refresh data"}
                title={loading ? "Refreshing data..." : "Refresh data"}
                className="grid h-9 w-9 place-items-center rounded-[6px] text-[#687266] transition hover:bg-[#f3f4f0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#477e50] disabled:cursor-wait disabled:opacity-60"
              >
                <span className={loading ? "animate-spin" : ""}><Icon name="refresh" size={18} /></span>
              </button>
              {section === "Overview" && <button type="button" onClick={onExport} aria-label="Export all data" title="Export all data" className="grid h-9 w-9 place-items-center rounded-[6px] text-[#687266] transition hover:bg-[#f3f4f0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#477e50]"><Icon name="download" size={18} /></button>}
              <div aria-hidden="true" className="hidden h-7 w-px bg-[#e6e8e2] sm:block" />
              <div className="flex items-center gap-2.5 rounded-[6px] p-1.5" title="Administrator">
                <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full bg-[#e8eee2] text-[11px] font-bold text-[#42603f]">AD</span>
                <span className="hidden text-left sm:block"><span className="block text-[12px] font-semibold">Admin workspace</span><span className="mt-0.5 block text-[10px] text-[#687266]">Administrator</span></span>
                <button type="button" aria-label="Sign out" title="Sign out" onClick={onSignOut} className="rounded p-1.5 text-[#687266] hover:bg-[#f3f4f0] hover:text-[#20261f]"><Icon name="arrow" size={15} /></button>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1440px] px-5 pb-10 pt-7 sm:px-8 lg:px-10">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div><p className="mb-2 text-[11px] font-semibold uppercase tracking-[1.6px] text-[#456443]">{section === "Overview" ? new Intl.DateTimeFormat("en-IN", { dateStyle: "full", timeZone: "Asia/Kolkata" }).format(new Date()) : "Workspace / Management"}</p><h1 className="text-[27px] font-semibold leading-tight tracking-[-0.5px] text-[#202820]">{section === "Overview" ? "Good morning, Admin" : section}</h1><p className="mt-2 text-[13px] text-[#687266]">{sectionDescriptions[section]}</p></div>
              {section !== "Recycle Bin" && <div>{section === "Overview" ? <button type="button" onClick={onAdd} className="inline-flex h-10 items-center gap-2 rounded-[6px] bg-[#285c3b] px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#1f4d31]"><Icon name="plus" size={16} />Create policy</button> : <button type="button" onClick={onAdd} className="inline-flex h-10 items-center gap-2 rounded-[6px] bg-[#285c3b] px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#1f4d31]"><Icon name="plus" size={16} />{addLabel}</button>}</div>}
            </div>
            {children}
            <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#687266]"><span>JB Solar Operations</span></footer>
          </div>
        </main>
      </div>
    </div>
  );
}
