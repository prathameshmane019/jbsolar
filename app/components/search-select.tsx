"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type Choice = { value: string; label: string; hint?: string };

export function SearchSelect({ name, options, defaultValue = "", fallbackLabel = "", placeholder = "Select", required = false, emptyLabel, onChange }: {
  name: string;
  options: Choice[];
  defaultValue?: string;
  fallbackLabel?: string;   // shown if the saved value isn't in `options`
  placeholder?: string;
  required?: boolean;
  emptyLabel?: string;      // adds a "none" row for optional fields
  onChange?: (value: string) => void;
}) {
  const [value, setValue] = useState(defaultValue);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipFocus = useRef(false);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const selectedLabel = options.find(o => o.value === value)?.label ?? (value ? fallbackLabel : "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter(o => !q || `${o.label} ${o.hint ?? ""}`.toLowerCase().includes(q));
  }, [options, query]);

  function pick(next: string) {
    skipFocus.current = true; // a wrapping <label> can re-focus the input after a click
    setTimeout(() => { skipFocus.current = false; }, 0);
    setValue(next);
    setQuery("");
    setOpen(false);
    inputRef.current?.blur();
    onChange?.(next);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault(); // don't submit the form
      if (open && filtered[active]) pick(filtered[active].value);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      {/* carries the value into FormData and makes `required` validate */}
      <input
        tabIndex={-1}
        aria-hidden="true"
        name={name}
        value={value}
        required={required}
        onChange={() => {}}
        className="pointer-events-none absolute bottom-0 left-0 h-px w-full opacity-0"
      />

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          placeholder={placeholder}
          value={open ? query : selectedLabel}
          onFocus={() => { if (skipFocus.current) return; setQuery(""); setActive(0); setOpen(true); }}
          onChange={e => { setQuery(e.target.value); setActive(0); setOpen(true); }}
          onKeyDown={onKeyDown}
          className="w-full pr-14"
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1 text-[#788276]">
          {value && !required && (
            <button type="button" aria-label="Clear" onMouseDown={e => e.preventDefault()} onClick={() => pick("")}
              className="px-1 text-[14px] leading-none hover:text-[#20261f]">×</button>
          )}
          <button type="button" tabIndex={-1} aria-label="Toggle options" onMouseDown={e => e.preventDefault()}
            onClick={() => { setOpen(o => !o); if (!open) inputRef.current?.focus(); }}
            className="px-1 text-[10px] hover:text-[#20261f]">▾</button>
        </div>
      </div>

      {open && (
        <ul role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-[6px] border border-[#e4e8df] bg-white py-1 shadow-lg">
          {emptyLabel && !required && (
            <li role="option" aria-selected={value === ""} onMouseDown={e => { e.preventDefault(); pick(""); }}
              className="cursor-pointer px-3 py-2 text-[12px] text-[#788276] hover:bg-[#f1f3ee]">
              {emptyLabel}
            </li>
          )}
          {filtered.map((o, i) => (
            <li key={o.value} role="option" aria-selected={o.value === value}
              onMouseDown={e => { e.preventDefault(); pick(o.value); }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-2 ${i === active ? "bg-[#f1f3ee]" : ""} ${o.value === value ? "font-semibold" : ""}`}>
              <div className="text-[12px] text-[#20261f]">{o.label}</div>
              {o.hint ? <div className="text-[10px] text-[#788276]">{o.hint}</div> : null}
            </li>
          ))}
          {filtered.length === 0 && <li className="px-3 py-3 text-[11px] text-[#788276]">No matches</li>}
        </ul>
      )}
    </div>
  );
}