"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

// A dedicated, fully distinct color per status (unlike StatusBadge's shared
// 4-tone system) so every option in the open dropdown is visually unique.
export const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  WAITING: "bg-purple-100 text-purple-800",
  BLOCKED: "bg-red-100 text-red-800",
  CLOSED: "bg-emerald-100 text-emerald-800",
};
const FALLBACK_COLOR = "bg-slate-100 text-slate-700";

export function StatusSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) setMenuPos({ top: rect.bottom + 4, left: rect.left });
    setOpen(true);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const triggerColor = STATUS_COLORS[value] ?? FALLBACK_COLOR;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-accent ${triggerColor}`}
      >
        {value.replace("_", " ")}
        <ChevronDown size={14} />
      </button>
      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: menuPos.top, left: menuPos.left }}
            className="z-50 w-40 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg animate-[fade-in-scale_120ms_ease-out]"
          >
            {options.map((status) => {
              const optionColor = STATUS_COLORS[status] ?? FALLBACK_COLOR;
              const isSelected = status === value;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    onChange(status);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide hover:brightness-95 ${optionColor}`}
                >
                  {status.replace("_", " ")}
                  {isSelected && <Check size={14} />}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
