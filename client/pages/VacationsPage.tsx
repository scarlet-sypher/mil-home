"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/client/components/TopNav";
import { Button } from "@/client/components/Button";
import { DataTable } from "@/client/components/DataTable";
import { StatusBadge } from "@/client/components/StatusBadge";
import { RemarkCell } from "@/client/components/RemarkCell";
import { SearchableSelect } from "@/client/components/SearchableSelect";
import { readErrorMessage } from "@/client/lib/safe-json";

type OccupancyPair = { quarterId: number; quarterNo: string; colony: string; applicantId: number; name: string; serviceNo: string };
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
  occupancy,
}: {
  vacations: Vacation[];
  occupancy: OccupancyPair[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({ quarterId: "", applicantId: "" });
  const [defectsDraft, setDefectsDraft] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleQuarterChange(value: string) {
    const match = occupancy.find((p) => String(p.quarterId) === value);
    setForm({ ...form, quarterId: value, applicantId: match ? String(match.applicantId) : form.applicantId });
  }

  function handleApplicantChange(value: string) {
    const match = occupancy.find((p) => String(p.applicantId) === value);
    setForm({ ...form, applicantId: value, quarterId: match ? String(match.quarterId) : form.quarterId });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    if (!form.quarterId || !form.applicantId) {
      setError("Select a quarter and an occupant.");
      setSubmitting(false);
      return;
    }

    const response = await fetch("/api/vacations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quarterId: Number(form.quarterId), applicantId: Number(form.applicantId) }),
    });

    if (!response.ok) {
      setError(await readErrorMessage(response));
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

  const quarterOptions = occupancy.map((p) => ({ value: String(p.quarterId), label: `${p.colony} (${p.quarterNo})` }));
  const applicantOptions = occupancy.map((p) => ({ value: String(p.applicantId), label: `${p.name} (${p.serviceNo})` }));

  return (
    <div className="min-h-screen bg-page-bg">
      <TopNav />
      <main className="w-full space-y-6 px-3 py-8 sm:px-4 lg:px-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Vacations</h1>
          <p className="text-sm text-slate-500">Quarter Vacations &amp; Clearance</p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 rounded-card border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Quarter</label>
            <SearchableSelect options={quarterOptions} value={form.quarterId} onChange={handleQuarterChange} placeholder="Select quarter" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Occupant</label>
            <SearchableSelect options={applicantOptions} value={form.applicantId} onChange={handleApplicantChange} placeholder="Select occupant" />
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
            { header: "S/No.", render: (_v: Vacation, i: number) => i + 1, exportValue: (_v, i) => i + 1 },
            { header: "Qtr Loc", render: (v: Vacation) => v.quarter.colony, sortValue: (v) => v.quarter.colony },
            { header: "Qtr No.", render: (v: Vacation) => v.quarter.quarterNo, sortValue: (v) => v.quarter.quarterNo },
            { header: "Army No.", render: (v: Vacation) => v.applicant.serviceNo, sortValue: (v) => v.applicant.serviceNo },
            { header: "Rank", render: (v: Vacation) => v.applicant.rank, sortValue: (v) => v.applicant.rank },
            { header: "Name", render: (v: Vacation) => v.applicant.name, sortValue: (v) => v.applicant.name },
            { header: "Unit", render: (v: Vacation) => v.applicant.unit, sortValue: (v) => v.applicant.unit },
            { header: "Inspection", render: (v: Vacation) => <StatusBadge status={v.inspectionStatus} />, sortValue: (v) => v.inspectionStatus },
            {
              header: "Defects",
              render: (v: Vacation) =>
                v.inspectionStatus === "PENDING" ? "—" : <RemarkCell text={v.defects} label="Defects" />,
              sortValue: (v) => v.defects,
            },
            { header: "Clearance", render: (v: Vacation) => <StatusBadge status={v.clearanceStatus} />, sortValue: (v) => v.clearanceStatus },
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
          title="Vacations"
        />
      </main>
    </div>
  );
}
