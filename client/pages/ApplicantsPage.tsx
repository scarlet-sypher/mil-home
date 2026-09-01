"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Header } from "@/client/components/Header";
import { Button } from "@/client/components/Button";
import { FormField } from "@/client/components/FormField";
import { DataTable } from "@/client/components/DataTable";
import { StatusBadge } from "@/client/components/StatusBadge";

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
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/applicants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    setForm(EMPTY_FORM);
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Applicants</h1>
          <p className="text-sm text-slate-500">Applicants/Waiting</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <FormField label="Army No." name="serviceNo" value={form.serviceNo} onChange={(e) => setForm({ ...form, serviceNo: e.target.value })} required />
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
          <div className="flex items-end">
            <Button type="submit" disabled={submitting}>
              <Plus size={16} />
              Add Applicant
            </Button>
          </div>
          {error && <p className="text-sm text-red-700 sm:col-span-2 lg:col-span-4">{error}</p>}
        </form>

        <DataTable
          columns={[
            { header: "S/No.", render: (_a: Applicant, i: number) => i + 1 },
            { header: "Army No.", render: (a: Applicant) => a.serviceNo },
            { header: "Rank", render: (a: Applicant) => a.rank },
            { header: "Name", render: (a: Applicant) => a.name },
            { header: "Unit", render: (a: Applicant) => a.unit },
            { header: "Seniority", render: (a: Applicant) => new Date(a.seniorityDate).toLocaleDateString() },
            { header: "Qtr Loc", render: (a: Applicant) => (a.status === "ALLOTTED" ? a.allotments[0]?.quarter.colony ?? "—" : "—") },
            { header: "Qtr No.", render: (a: Applicant) => (a.status === "ALLOTTED" ? a.allotments[0]?.quarter.quarterNo ?? "—" : "—") },
            { header: "Status", render: (a: Applicant) => <StatusBadge status={a.status} /> },
            { header: "Remarks", render: (a: Applicant) => a.remarks ?? "—" },
          ]}
          rows={applicants}
          rowKey={(a) => a.id}
        />
      </main>
    </div>
  );
}
