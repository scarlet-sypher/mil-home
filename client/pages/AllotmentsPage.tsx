"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Undo2, RotateCcw } from "lucide-react";
import { TopNav } from "@/client/components/TopNav";
import { Button } from "@/client/components/Button";
import { DataTable } from "@/client/components/DataTable";
import { StatusBadge } from "@/client/components/StatusBadge";
import { SearchableSelect } from "@/client/components/SearchableSelect";
import { ConfirmDialog } from "@/client/components/ConfirmDialog";
import { readErrorMessage } from "@/client/lib/safe-json";

type Applicant = { id: number; name: string; serviceNo: string };
type Quarter = { id: number; quarterNo: string; colony: string };
type AllotmentApplicant = { serviceNo: string; rank: string; name: string; unit: string };
type AllotmentQuarter = { colony: string; quarterNo: string };
type Allotment = {
  id: number;
  applicantId: number;
  quarterId: number;
  authorityStatus: string;
  orderRef: string | null;
  applicant: AllotmentApplicant;
  quarter: AllotmentQuarter;
};

type PendingAction = { type: "reject" | "unallocate"; id: number } | null;

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
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [pageError, setPageError] = useState("");

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!applicantId || !quarterId) {
      setError("Select both an applicant and a quarter.");
      return;
    }

    setSubmitting(true);
    const response = await fetch("/api/allotments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicantId: Number(applicantId), quarterId: Number(quarterId) }),
    });

    if (!response.ok) {
      setError(await readErrorMessage(response));
      setSubmitting(false);
      return;
    }

    setApplicantId("");
    setQuarterId("");
    setSubmitting(false);
    router.refresh();
  }

  async function handleApprove(id: number) {
    setPageError("");
    const response = await fetch(`/api/allotments/${id}/approve`, { method: "POST" });
    if (!response.ok) {
      setPageError(await readErrorMessage(response, "Could not approve this allotment."));
      return;
    }
    router.refresh();
  }

  async function handleReallocate(id: number) {
    setPageError("");
    const response = await fetch(`/api/allotments/${id}/reallocate`, { method: "POST" });
    if (!response.ok) {
      setPageError(await readErrorMessage(response, "Could not allocate this quarter."));
      return;
    }
    router.refresh();
  }

  function requestReject(id: number) {
    setPageError("");
    setPendingAction({ type: "reject", id });
  }

  function requestUnallocate(id: number) {
    setPageError("");
    setPendingAction({ type: "unallocate", id });
  }

  function closeDialog() {
    setPendingAction(null);
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;

    const endpoint = pendingAction.type === "reject" ? "reject" : "unallocate";
    const response = await fetch(`/api/allotments/${pendingAction.id}/${endpoint}`, { method: "POST" });
    if (!response.ok) {
      setPageError(await readErrorMessage(response, `Could not ${endpoint} this allotment.`));
      closeDialog();
      return;
    }

    closeDialog();
    router.refresh();
  }

  const applicantOptions = applicants.map((a) => ({ value: String(a.id), label: `${a.name} (${a.serviceNo})` }));
  const quarterOptions = quarters.map((q) => ({ value: String(q.id), label: `${q.colony} (${q.quarterNo})` }));

  return (
    <div className="min-h-screen bg-page-bg">
      <TopNav />
      <main className="w-full space-y-6 px-3 py-8 sm:px-4 lg:px-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Allotments</h1>
          <p className="text-sm text-slate-500">Allotment Workflow</p>
        </div>

        {pageError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{pageError}</p>
        )}

        <form onSubmit={handleCreate} className="grid gap-4 rounded-card border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Applicant</label>
            <SearchableSelect options={applicantOptions} value={applicantId} onChange={setApplicantId} placeholder="Select applicant" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Quarter</label>
            <SearchableSelect options={quarterOptions} value={quarterId} onChange={setQuarterId} placeholder="Select quarter" />
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
            { header: "S/No.", render: (_a: Allotment, i: number) => i + 1, exportValue: (_a, i) => i + 1 },
            { header: "Qtr Loc", render: (a: Allotment) => a.quarter.colony, sortValue: (a) => a.quarter.colony },
            { header: "Qtr No.", render: (a: Allotment) => a.quarter.quarterNo, sortValue: (a) => a.quarter.quarterNo },
            { header: "Army No.", render: (a: Allotment) => a.applicant.serviceNo, sortValue: (a) => a.applicant.serviceNo },
            { header: "Rank", render: (a: Allotment) => a.applicant.rank, sortValue: (a) => a.applicant.rank },
            { header: "Name", render: (a: Allotment) => a.applicant.name, sortValue: (a) => a.applicant.name },
            { header: "Unit", render: (a: Allotment) => a.applicant.unit, sortValue: (a) => a.applicant.unit },
            { header: "Authority", render: (a: Allotment) => <StatusBadge status={a.authorityStatus} />, sortValue: (a) => a.authorityStatus },
            { header: "Order", render: (a: Allotment) => a.orderRef ?? "—", sortValue: (a) => a.orderRef },
            {
              header: "Action",
              render: (a: Allotment) => {
                if (a.authorityStatus === "PENDING") {
                  return (
                    <div className="flex flex-wrap gap-1.5">
                      <Button variant="success" onClick={() => handleApprove(a.id)}>
                        <CheckCircle2 size={16} />
                        Approve
                      </Button>
                      <Button variant="danger" onClick={() => requestReject(a.id)}>
                        <XCircle size={16} />
                        Reject
                      </Button>
                    </div>
                  );
                }
                if (a.authorityStatus === "APPROVED") {
                  return (
                    <Button variant="warning" onClick={() => requestUnallocate(a.id)}>
                      <Undo2 size={16} />
                      Unallocate
                    </Button>
                  );
                }
                if (a.authorityStatus === "UNALLOCATED") {
                  return (
                    <Button variant="info" onClick={() => handleReallocate(a.id)}>
                      <RotateCcw size={16} />
                      Allocate
                    </Button>
                  );
                }
                return <span className="text-sm text-slate-400">—</span>;
              },
            },
          ]}
          rows={allotments}
          rowKey={(a) => a.id}
          title="Allotments"
        />
      </main>

      {pendingAction?.type === "reject" && (
        <ConfirmDialog
          title="Reject Allotment"
          message="Reject this allotment? The quarter will become vacant and available again."
          confirmLabel="Reject"
          confirmVariant="danger"
          onConfirm={confirmPendingAction}
          onCancel={closeDialog}
        />
      )}

      {pendingAction?.type === "unallocate" && (
        <ConfirmDialog
          title="Unallocate"
          message="Unallocate this quarter? The occupant will be removed, the applicant will go back to waiting, and the quarter will become vacant."
          confirmLabel="Unallocate"
          confirmVariant="danger"
          onConfirm={confirmPendingAction}
          onCancel={closeDialog}
        />
      )}
    </div>
  );
}
