"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/client/components/Header";
import { Button } from "@/client/components/Button";
import { DataTable } from "@/client/components/DataTable";
import { StatusBadge } from "@/client/components/StatusBadge";

type Quarter = { id: number; quarterNo: string };
type PickerApplicant = { id: number; name: string; serviceNo: string };
type VacationApplicant = { serviceNo: string; rank: string; name: string; unit: string };
type VacationQuarter = { colony: string; quarterNo: string };
type Vacation = {
  id: number;
  inspectionStatus: string;
  clearanceStatus: string;
  defects: string | null;
  applicant: VacationApplicant;
  quarter: VacationQuarter;
};

export function VacationsPage({
  vacations,
  quarters,
  applicants,
}: {
  vacations: Vacation[];
  quarters: Quarter[];
  applicants: PickerApplicant[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({ quarterId: "", applicantId: "" });
  const [defectsDraft, setDefectsDraft] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/vacations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quarterId: Number(form.quarterId), applicantId: Number(form.applicantId) }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    setForm({ quarterId: "", applicantId: "" });
    setSubmitting(false);
    router.refresh();
  }

  async function handleInspect(id: number) {
    const response = await fetch(`/api/vacations/${id}/inspect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defects: defectsDraft[id] ?? "" }),
    });
    if (response.ok) router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Vacations</h1>
          <p className="text-sm text-slate-500">Quarter Vacations &amp; Clearance</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Quarter</label>
            <select
              value={form.quarterId}
              onChange={(e) => setForm({ ...form, quarterId: e.target.value })}
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select quarter</option>
              {quarters.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.quarterNo}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Occupant</label>
            <select
              value={form.applicantId}
              onChange={(e) => setForm({ ...form, applicantId: e.target.value })}
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select occupant</option>
              {applicants.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.serviceNo})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={submitting}>
              Request Vacation
            </Button>
          </div>
          {error && <p className="text-sm text-red-700 sm:col-span-3">{error}</p>}
        </form>

        <DataTable
          columns={[
            { header: "S/No.", render: (_v: Vacation, i: number) => i + 1 },
            { header: "Army No.", render: (v: Vacation) => v.applicant.serviceNo },
            { header: "Rank", render: (v: Vacation) => v.applicant.rank },
            { header: "Name", render: (v: Vacation) => v.applicant.name },
            { header: "Unit", render: (v: Vacation) => v.applicant.unit },
            { header: "Qtr Loc", render: (v: Vacation) => v.quarter.colony },
            { header: "Qtr No.", render: (v: Vacation) => v.quarter.quarterNo },
            { header: "Inspection", render: (v: Vacation) => <StatusBadge status={v.inspectionStatus} /> },
            { header: "Defects", render: (v: Vacation) => (v.inspectionStatus === "PENDING" ? "—" : v.defects ?? "None") },
            { header: "Clearance", render: (v: Vacation) => <StatusBadge status={v.clearanceStatus} /> },
            {
              header: "Action",
              render: (v: Vacation) =>
                v.inspectionStatus === "PENDING" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Defects, if any"
                      value={defectsDraft[v.id] ?? ""}
                      onChange={(e) => setDefectsDraft({ ...defectsDraft, [v.id]: e.target.value })}
                      className="w-40 rounded-md border border-slate-300 px-2 py-1 text-sm"
                    />
                    <Button variant="secondary" onClick={() => handleInspect(v.id)}>
                      Submit
                    </Button>
                  </div>
                ) : null,
            },
          ]}
          rows={vacations}
          rowKey={(v) => v.id}
        />
      </main>
    </div>
  );
}
