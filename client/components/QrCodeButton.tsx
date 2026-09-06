"use client";

import { useState } from "react";
import Image from "next/image";
import { QrCode } from "lucide-react";
import { Modal } from "@/client/components/Modal";

export function QrCodeButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm shadow-cyan-500/40 transition-colors duration-150 hover:bg-cyan-400"
      >
        <QrCode size={14} />
        RMS On-Line MES Service Request QR
      </button>
      {open && (
        <Modal title="RMS On-Line MES Service Request QR" onClose={() => setOpen(false)}>
          <div className="flex justify-center">
            <Image
              src="/images/qr.png"
              alt="RMS On-Line MES Service Request QR"
              width={400}
              height={400}
              className="h-auto w-full max-w-sm"
            />
          </div>
        </Modal>
      )}
    </>
  );
}
