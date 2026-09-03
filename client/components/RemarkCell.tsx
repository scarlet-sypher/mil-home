"use client";

import { useState } from "react";
import { Modal } from "@/client/components/Modal";

export function RemarkCell({ text, label = "Remark" }: { text: string | null | undefined; label?: string }) {
  const [open, setOpen] = useState(false);

  if (!text) return <span className="text-slate-400">—</span>;

  return (
    <>
      <button onClick={() => setOpen(true)} className="line-clamp-2 max-w-[160px] whitespace-normal text-left hover:underline">
        {text}
      </button>
      {open && (
        <Modal title={label} onClose={() => setOpen(false)}>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{text}</p>
        </Modal>
      )}
    </>
  );
}
