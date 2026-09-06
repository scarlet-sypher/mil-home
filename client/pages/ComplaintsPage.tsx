"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "@/client/components/TopNav";
import { Button } from "@/client/components/Button";
import { FormField } from "@/client/components/FormField";
import { DataTable } from "@/client/components/DataTable";
import { RemarkCell } from "@/client/components/RemarkCell";
import { SearchableSelect } from "@/client/components/SearchableSelect";
import { StatusSelect, STATUS_COLORS } from "@/client/components/StatusSelect";
import { readErrorMessage } from "@/client/lib/safe-json";

const COMPLAINT_STATUSES = ["OPEN", "IN_PROGRESS", "WAITING", "BLOCKED", "CLOSED"];

type OccupancyPair = { quarterId: number; quarterNo: string; colony: string; applicantId: number; name: string; serviceNo: string };
type ComplaintApplicant = { serviceNo: string; rank: string; name: string; unit: string };
type ComplaintQuarter = { colony: string; quarterNo: string };
type Complaint = {
  id: number;
  description: string;
  status: string;
  remark: string | null;
  applicant: ComplaintApplicant;
  quarter: ComplaintQuarter;
};

export function ComplaintsPage({
  complaints,
  occupancy,
}: {
  complaints: Complaint[];
  occupancy: OccupancyPair[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({ quarterId: "", applicantId: "", description: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [remarkDrafts, setRemarkDrafts] = useState<Record<number, string>>({});
  const [pageError, setPageError] = useState("");

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
      setError("Select a quarter and a resident.");
      setSubmitting(false);
      return;
    }

    const response = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quarterId: Number(form.quarterId),
        applicantId: Number(form.applicantId),
      }),
    });

    if (!response.ok) {
      setError(await readErrorMessage(response));
      setSubmitting(false);
      return;
    }

    setForm({ quarterId: "", applicantId: "", description: "" });
    setSubmitting(false);
    router.refresh();
  }

  async function handleStatusChange(id: number, status: string) {
    setPageError("");
    const response = await fetch(`/api/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      setPageError(await readErrorMessage(response, "Could not update this complaint's status."));
      return;
    }
    router.refresh();
  }

  async function handleRemarkSave(id: number) {
    setPageError("");
    const response = await fetch(`/api/complaints/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remark: remarkDrafts[id] ?? "" }),
    });
    if (!response.ok) {
      setPageError(await readErrorMessage(response, "Could not save this remark."));
      return;
    }
    router.refresh();
  }

  const quarterOptions = occupancy.map((p) => ({ value: String(p.quarterId), label: `${p.colony} (${p.quarterNo})` }));
  const applicantOptions = occupancy.map((p) => ({ value: String(p.applicantId), label: `${p.name} (${p.serviceNo})` }));

  return (
    <div className="min-h-screen bg-page-bg">
      <TopNav />
      <main className="w-full space-y-6 px-3 py-8 sm:px-4 lg:px-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Complaints</h1>
          <p className="text-sm text-slate-500">Maintenance Report</p>
        </div>

        {pageError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{pageError}</p>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-card border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
        >
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Quarter</label>
            <SearchableSelect options={quarterOptions} value={form.quarterId} onChange={handleQuarterChange} placeholder="Select quarter" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Resident</label>
            <SearchableSelect options={applicantOptions} value={form.applicantId} onChange={handleApplicantChange} placeholder="Select resident" />
          </div>
          <FormField label="Description" name="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          <div className="flex items-end">
            <Button type="submit" disabled={submitting}>
              File Complaint
            </Button>
          </div>
          {error && <p className="text-sm text-red-700 sm:col-span-2 lg:col-span-5">{error}</p>}
        </form>

        <DataTable
          columns={[
            { header: "S/No.", render: (_c: Complaint, i: number) => i + 1, exportValue: (_c, i) => i + 1 },
            { header: "Qtr Loc", render: (c: Complaint) => c.quarter.colony, sortValue: (c) => c.quarter.colony },
            { header: "Qtr No.", render: (c: Complaint) => c.quarter.quarterNo, sortValue: (c) => c.quarter.quarterNo },
            { header: "Army No.", render: (c: Complaint) => c.applicant.serviceNo, sortValue: (c) => c.applicant.serviceNo },
            { header: "Rank", render: (c: Complaint) => c.applicant.rank, sortValue: (c) => c.applicant.rank },
            { header: "Name", render: (c: Complaint) => c.applicant.name, sortValue: (c) => c.applicant.name },
            { header: "Unit", render: (c: Complaint) => c.applicant.unit, sortValue: (c) => c.applicant.unit },
            {
              header: "Description",
              render: (c: Complaint) => <RemarkCell text={c.description} label="Complaint Description" />,
              sortValue: (c) => c.description,
            },
            {
              header: "Status",
              render: (c: Complaint) => (
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${STATUS_COLORS[c.status] ?? "bg-slate-100 text-slate-700"}`}
                >
                  {c.status.replace("_", " ")}
                </span>
              ),
              sortValue: (c) => c.status,
            },
            {
              header: "Remark",
              sortValue: (c) => c.remark,
              render: (c: Complaint) => {
                const locked = c.status === "CLOSED";
                return (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={remarkDrafts[c.id] ?? c.remark ?? ""}
                      onChange={(e) => setRemarkDrafts({ ...remarkDrafts, [c.id]: e.target.value })}
                      disabled={locked}
                      placeholder="Add a remark"
                      className="w-40 rounded-md border border-slate-300 px-2 py-1 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                    />
                    {!locked && (
                      <Button variant="secondary" onClick={() => handleRemarkSave(c.id)}>
                        Save
                      </Button>
                    )}
                  </div>
                );
              },
            },
            {
              header: "Action",
              render: (c: Complaint) => (
                <StatusSelect value={c.status} options={COMPLAINT_STATUSES} onChange={(status) => handleStatusChange(c.id, status)} />
              ),
            },
          ]}
          rows={complaints}
          rowKey={(c) => c.id}
          title="Complaints"
        />
      </main>
    </div>
  );
}
