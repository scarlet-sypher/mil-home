"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Header } from "@/client/components/Header";
import { Button } from "@/client/components/Button";
import { DataTable } from "@/client/components/DataTable";
import { StatusBadge } from "@/client/components/StatusBadge";

type Applicant = { id: number; name: string; serviceNo: string };
type Quarter = { id: number; quarterNo: string };
type AllotmentApplicant = { serviceNo: string; rank: string; name: string; unit: string };
type AllotmentQuarter = { colony: string; quarterNo: string };
type Allotment = {
  id: number;
  authorityStatus: string;
  orderRef: string | null;
  applicant: AllotmentApplicant;
  quarter: AllotmentQuarter;
};

export function AllotmentsPage({
  allotments,
  applicants,
  quarters,
}: {
  allotments: Allotment[];
  applicants: Applicant[];
  quarters: Quarter[];
}) {
  const router = useRouter();
  const [applicantId, setApplicantId] = useState("");
  const [quarterId, setQuarterId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/allotments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicantId: Number(applicantId), quarterId: Number(quarterId) }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    setApplicantId("");
    setQuarterId("");
    setSubmitting(false);
    router.refresh();
  }

  async function handleApprove(id: number) {
    const response = await fetch(`/api/allotments/${id}/approve`, { method: "POST" });
    if (response.ok) router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-screen-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-10">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Allotments</h1>
          <p className="text-sm text-slate-500">Allotment Workflow</p>
        </div>

        <form onSubmit={handleCreate} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Applicant</label>
            <select
              value={applicantId}
              onChange={(e) => setApplicantId(e.target.value)}
              required
              className="rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Select applicant</option>
              {applicants.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.serviceNo})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Quarter</label>
            <select
              value={quarterId}
              onChange={(e) => setQuarterId(e.target.value)}
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
          <div className="flex items-end">
            <Button type="submit" disabled={submitting}>
              Create Allotment
            </Button>
          </div>
          {error && <p className="text-sm text-red-700 sm:col-span-3">{error}</p>}
        </form>

        <DataTable
          columns={[
            { header: "S/No.", render: (_a: Allotment, i: number) => i + 1 },
            { header: "Army No.", render: (a: Allotment) => a.applicant.serviceNo },
            { header: "Rank", render: (a: Allotment) => a.applicant.rank },
            { header: "Name", render: (a: Allotment) => a.applicant.name },
            { header: "Unit", render: (a: Allotment) => a.applicant.unit },
            { header: "Qtr Loc", render: (a: Allotment) => a.quarter.colony },
            { header: "Qtr No.", render: (a: Allotment) => a.quarter.quarterNo },
            { header: "Authority", render: (a: Allotment) => <StatusBadge status={a.authorityStatus} /> },
            { header: "Order", render: (a: Allotment) => a.orderRef ?? "—" },
            {
              header: "Action",
              render: (a: Allotment) =>
                a.authorityStatus !== "APPROVED" ? (
                  <Button variant="secondary" onClick={() => handleApprove(a.id)}>
                    <CheckCircle2 size={16} />
                    Approve
                  </Button>
                ) : null,
            },
          ]}
          rows={allotments}
          rowKey={(a) => a.id}
        />
      </main>
    </div>
  );
}
