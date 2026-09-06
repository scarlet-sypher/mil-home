"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { TopNav } from "@/client/components/TopNav";
import { Button } from "@/client/components/Button";
import { FormField } from "@/client/components/FormField";
import { DataTable } from "@/client/components/DataTable";
import { StatusBadge } from "@/client/components/StatusBadge";
import { Modal } from "@/client/components/Modal";
import { RemarkCell } from "@/client/components/RemarkCell";
import { formatDate } from "@/client/lib/format-date";
import { safeParseJson } from "@/client/lib/safe-json";

type Quarter = { colony: string; quarterNo: string };
type Allotment = { quarter: Quarter };
type Applicant = {
  id: number;
  serviceNo: string;
  name: string;
  rank: string;
  unit: string;
  seniorityDate: Date;
  remarks: string | null;
  status: string;
  allotments: Allotment[];
};

const EMPTY_FORM = {
  serviceNo: "",
  name: "",
  rank: "",
  unit: "",
  seniorityDate: "",
  remarks: "",
};

export function ApplicantsPage({ applicants }: { applicants: Applicant[] }) {
  const router = useRouter();
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [serviceNoError, setServiceNoError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function openAddModal() {
    setForm(EMPTY_FORM);
    setError("");
    setServiceNoError("");
    setShowAddModal(true);
  }

  function closeAddModal() {
    setShowAddModal(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setServiceNoError("");

    const response = await fetch("/api/applicants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const data = await safeParseJson<{ error?: string; field?: string }>(response, {});
      if (data.field === "serviceNo") {
        setServiceNoError(data.error ?? "This army number is already in use.");
      } else {
        setError(data.error ?? "Something went wrong.");
      }
      setSubmitting(false);
      return;
    }

    setForm(EMPTY_FORM);
    setSubmitting(false);
    setShowAddModal(false);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-page-bg">
      <TopNav />
      <main className="w-full space-y-6 px-3 py-8 sm:px-4 lg:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Applicants</h1>
            <p className="text-sm text-slate-500">Applicants/Waiting</p>
          </div>
          <Button onClick={openAddModal}>
            <Plus size={16} />
            Add Applicant
          </Button>
        </div>

        <DataTable
          columns={[
            { header: "S/No.", render: (_a: Applicant, i: number) => i + 1, exportValue: (_a, i) => i + 1 },
            {
              header: "Qtr Loc",
              render: (a: Applicant) => (a.status === "ALLOTTED" ? a.allotments[0]?.quarter.colony ?? "—" : "—"),
              sortValue: (a) => (a.status === "ALLOTTED" ? a.allotments[0]?.quarter.colony : undefined),
            },
            {
              header: "Qtr No.",
              render: (a: Applicant) => (a.status === "ALLOTTED" ? a.allotments[0]?.quarter.quarterNo ?? "—" : "—"),
              sortValue: (a) => (a.status === "ALLOTTED" ? a.allotments[0]?.quarter.quarterNo : undefined),
            },
            { header: "Army No.", render: (a: Applicant) => a.serviceNo, sortValue: (a) => a.serviceNo },
            { header: "Rank", render: (a: Applicant) => a.rank, sortValue: (a) => a.rank },
            { header: "Name", render: (a: Applicant) => a.name, sortValue: (a) => a.name },
            { header: "Unit", render: (a: Applicant) => a.unit, sortValue: (a) => a.unit },
            { header: "Seniority", render: (a: Applicant) => formatDate(a.seniorityDate), sortValue: (a) => a.seniorityDate },
            { header: "Status", render: (a: Applicant) => <StatusBadge status={a.status} />, sortValue: (a) => a.status },
            { header: "Remarks", render: (a: Applicant) => <RemarkCell text={a.remarks} label="Remarks" />, sortValue: (a) => a.remarks },
          ]}
          rows={applicants}
          rowKey={(a) => a.id}
          title="Applicants"
        />
      </main>

      {showAddModal && (
        <Modal title="Add Applicant" onClose={closeAddModal}>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Army No."
              name="serviceNo"
              value={form.serviceNo}
              onChange={(e) => {
                setForm({ ...form, serviceNo: e.target.value });
                setServiceNoError("");
              }}
              error={serviceNoError}
              required
            />
            <FormField label="Name" name="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <FormField label="Rank" name="rank" value={form.rank} onChange={(e) => setForm({ ...form, rank: e.target.value })} required />
            <FormField label="Unit" name="unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required />
            <FormField
              label="Seniority Date"
              name="seniorityDate"
              type="date"
              value={form.seniorityDate}
              onChange={(e) => setForm({ ...form, seniorityDate: e.target.value })}
              required
            />
            <FormField label="Remarks" name="remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
            {error && <p className="text-sm text-red-700 sm:col-span-2">{error}</p>}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="secondary" onClick={closeAddModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                <Plus size={16} />
                Add Applicant
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
