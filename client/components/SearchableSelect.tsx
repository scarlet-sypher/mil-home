"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type Option = { value: string; label: string };

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={open ? query : (selected?.label ?? "")}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        placeholder={placeholder}
        className={`w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${value ? "pr-8" : ""}`}
      />
      {value && !open && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onChange("");
            setQuery("");
          }}
          aria-label="Clear"
          className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
        >
          <X size={16} />
        </button>
      )}
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg animate-[fade-in-scale_120ms_ease-out]">
          {filtered.length === 0 && <p className="px-3 py-2 text-sm text-slate-400">No matches</p>}
          {filtered.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
                setQuery("");
              }}
              className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
