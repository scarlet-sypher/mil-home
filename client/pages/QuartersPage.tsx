"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Wrench, Pencil, Trash2, Check, X } from "lucide-react";
import { Header } from "@/client/components/Header";
import { Button } from "@/client/components/Button";
import { FormField } from "@/client/components/FormField";
import { DataTable } from "@/client/components/DataTable";
import { StatusBadge } from "@/client/components/StatusBadge";
import { ConfirmDialog } from "@/client/components/ConfirmDialog";

type Quarter = {
  id: number;
  quarterNo: string;
  colony: string;
  status: string;
  condition: string;
  serviceNo: string | null;
  rank: string | null;
  name: string | null;
  unit: string | null;
  statusBeforeMaintenance: string | null;
  maintenanceStatus: string | null;
  maintenanceRemark: string | null;
  maintenanceCompletedRemark: string | null;
  maintenanceStartedAt: Date | null;
  maintenanceEndedAt: Date | null;
};

type Tab = "ALL" | "VACANT" | "OCCUPIED" | "MAINTENANCE";

type EditDraft = {
  quarterNo: string;
  colony: string;
  condition: string;
  serviceNo: string;
  rank: string;
  name: string;
  unit: string;
};

type PendingAction =
  | { type: "delete"; id: number }
  | { type: "maintenance-start"; id: number }
  | { type: "maintenance-complete"; id: number }
  | null;

const EMPTY_VACANT_FORM = { quarterNo: "", colony: "", condition: "FIT" };
const EMPTY_OCCUPIED_FORM = { serviceNo: "", rank: "", name: "", unit: "", quarterNo: "", colony: "", condition: "FIT" };

function formatDateTime(value: Date | null) {
  return value ? new Date(value).toLocaleString() : "—";
}

function ConditionSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
    >
      <option value="FIT">Fit</option>
      <option value="UNFIT">Unfit</option>
    </select>
  );
}

export function QuartersPage({ quarters }: { quarters: Quarter[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("ALL");
  const [vacantForm, setVacantForm] = useState(EMPTY_VACANT_FORM);
  const [occupiedForm, setOccupiedForm] = useState(EMPTY_OCCUPIED_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>({
    quarterNo: "",
    colony: "",
    condition: "FIT",
    serviceNo: "",
    rank: "",
    name: "",
    unit: "",
  });
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [dialogRemark, setDialogRemark] = useState("");
  const [pageError, setPageError] = useState("");

  async function handleVacantSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/quarters/vacant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vacantForm),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    setVacantForm(EMPTY_VACANT_FORM);
    setSubmitting(false);
    router.refresh();
  }

  async function handleOccupiedSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/quarters/occupied", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(occupiedForm),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    setOccupiedForm(EMPTY_OCCUPIED_FORM);
    setSubmitting(false);
    router.refresh();
  }

  function startEdit(q: Quarter) {
    setEditingId(q.id);
    setEditDraft({
      quarterNo: q.quarterNo,
      colony: q.colony,
      condition: q.condition,
      serviceNo: q.serviceNo ?? "",
      rank: q.rank ?? "",
      name: q.name ?? "",
      unit: q.unit ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(q: Quarter) {
    const payload =
      q.status === "OCCUPIED"
        ? editDraft
        : { quarterNo: editDraft.quarterNo, colony: editDraft.colony, condition: editDraft.condition };

    const response = await fetch(`/api/quarters/${q.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      setPageError(data.error ?? "Could not save changes.");
      return;
    }

    setEditingId(null);
    router.refresh();
  }

  function requestDelete(id: number) {
    setPageError("");
    setPendingAction({ type: "delete", id });
  }

  function requestStartMaintenance(id: number) {
    setPageError("");
    setDialogRemark("");
    setPendingAction({ type: "maintenance-start", id });
  }

  function requestCompleteMaintenance(id: number) {
    setPageError("");
    setDialogRemark("");
    setPendingAction({ type: "maintenance-complete", id });
  }

  function closeDialog() {
    setPendingAction(null);
    setDialogRemark("");
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;

    if (pendingAction.type === "delete") {
      const response = await fetch(`/api/quarters/${pendingAction.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json();
        setPageError(data.error ?? "Could not delete this record.");
        closeDialog();
        return;
      }
    } else if (pendingAction.type === "maintenance-start") {
      const response = await fetch(`/api/quarters/${pendingAction.id}/maintenance/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remark: dialogRemark }),
      });
      if (!response.ok) {
        const data = await response.json();
        setPageError(data.error ?? "Could not start maintenance.");
        closeDialog();
        return;
      }
    } else if (pendingAction.type === "maintenance-complete") {
      const response = await fetch(`/api/quarters/${pendingAction.id}/maintenance/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remark: dialogRemark }),
      });
      if (!response.ok) {
        const data = await response.json();
        setPageError(data.error ?? "Could not complete maintenance.");
        closeDialog();
        return;
      }
    }

    closeDialog();
    router.refresh();
  }

  const allQuarters = quarters;
  const vacantQuarters = quarters.filter((q) => q.status === "VACANT");
  const occupiedQuarters = quarters.filter((q) => q.status === "OCCUPIED");
  const maintenanceQuarters = quarters.filter((q) => q.status === "UNDER_MAINTENANCE");

  function actionCell(q: Quarter, onEdit?: () => void) {
    if (q.maintenanceStatus === "COMPLETED") {
      return (
        <Button variant="danger" onClick={() => requestDelete(q.id)}>
          <Trash2 size={14} />
          Delete
        </Button>
      );
    }

    if (editingId === q.id) {
      return (
        <div className="flex gap-1.5">
          <Button variant="secondary" onClick={() => saveEdit(q)}>
            <Check size={14} />
          </Button>
          <Button variant="secondary" onClick={cancelEdit}>
            <X size={14} />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-1.5">
        <Button variant="secondary" onClick={onEdit ?? (() => startEdit(q))}>
          <Pencil size={14} />
        </Button>
        <Button variant="danger" onClick={() => requestDelete(q.id)}>
          <Trash2 size={14} />
        </Button>
        <Button variant="secondary" onClick={() => requestStartMaintenance(q.id)}>
          <Wrench size={14} />
          Maintenance
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-screen-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-10">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Quarters</h1>
          <p className="text-sm text-slate-500">Quarters Vacant/Occupied</p>
        </div>

        {pageError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{pageError}</p>
        )}

        <div className="mx-auto flex w-fit flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
          {(
            [
              ["ALL", "Show All"],
              ["VACANT", "Vacant"],
              ["OCCUPIED", "Occupied"],
              ["MAINTENANCE", "Under Maintenance"],
            ] as [Tab, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tab === value ? "bg-navy-700 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "ALL" && (
          <DataTable
            columns={[
              { header: "S/No.", render: (_q: Quarter, i: number) => i + 1 },
              { header: "Army No.", render: (q: Quarter) => q.serviceNo ?? "—" },
              { header: "Rank", render: (q: Quarter) => q.rank ?? "—" },
              { header: "Name", render: (q: Quarter) => q.name ?? "—" },
              { header: "Unit", render: (q: Quarter) => q.unit ?? "—" },
              { header: "Qtr Loc", render: (q: Quarter) => q.colony },
              { header: "Qtr No.", render: (q: Quarter) => q.quarterNo },
              { header: "Status", render: (q: Quarter) => <StatusBadge status={q.status} /> },
              { header: "Condition", render: (q: Quarter) => <StatusBadge status={q.condition} /> },
              { header: "Under Maintenance", render: (q: Quarter) => (q.status === "UNDER_MAINTENANCE" ? "Yes" : "No") },
            ]}
            rows={allQuarters}
            rowKey={(q) => q.id}
          />
        )}

        {tab === "VACANT" && (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <form onSubmit={handleVacantSubmit} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4">
              <FormField
                label="Qtr Loc"
                name="colony"
                value={vacantForm.colony}
                onChange={(e) => setVacantForm({ ...vacantForm, colony: e.target.value })}
                required
              />
              <FormField
                label="Qtr No."
                name="quarterNo"
                value={vacantForm.quarterNo}
                onChange={(e) => setVacantForm({ ...vacantForm, quarterNo: e.target.value })}
                required
              />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Condition</label>
                <ConditionSelect value={vacantForm.condition} onChange={(v) => setVacantForm({ ...vacantForm, condition: v })} />
              </div>
              <Button type="submit" disabled={submitting}>
                <Plus size={16} />
                Add Quarter
              </Button>
              {error && <p className="text-sm text-red-700">{error}</p>}
            </form>

            <DataTable
              columns={[
                { header: "S/No.", render: (_q: Quarter, i: number) => i + 1 },
                {
                  header: "Qtr Loc",
                  render: (q: Quarter) =>
                    editingId === q.id ? (
                      <input
                        value={editDraft.colony}
                        onChange={(e) => setEditDraft({ ...editDraft, colony: e.target.value })}
                        className="w-28 rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    ) : (
                      q.colony
                    ),
                },
                {
                  header: "Qtr No.",
                  render: (q: Quarter) =>
                    editingId === q.id ? (
                      <input
                        value={editDraft.quarterNo}
                        onChange={(e) => setEditDraft({ ...editDraft, quarterNo: e.target.value })}
                        className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                      />
                    ) : (
                      q.quarterNo
                    ),
                },
                {
                  header: "Condition",
                  render: (q: Quarter) =>
                    editingId === q.id ? (
                      <ConditionSelect value={editDraft.condition} onChange={(v) => setEditDraft({ ...editDraft, condition: v })} />
                    ) : (
                      <StatusBadge status={q.condition} />
                    ),
                },
                { header: "Action", render: (q: Quarter) => actionCell(q) },
              ]}
              rows={vacantQuarters}
              rowKey={(q) => q.id}
            />
          </div>
        )}

        {tab === "OCCUPIED" && (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <form onSubmit={handleOccupiedSubmit} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4">
              <FormField label="Army No." name="serviceNo" value={occupiedForm.serviceNo} onChange={(e) => setOccupiedForm({ ...occupiedForm, serviceNo: e.target.value })} required />
              <FormField label="Rank" name="rank" value={occupiedForm.rank} onChange={(e) => setOccupiedForm({ ...occupiedForm, rank: e.target.value })} required />
              <FormField label="Name" name="name" value={occupiedForm.name} onChange={(e) => setOccupiedForm({ ...occupiedForm, name: e.target.value })} required />
              <FormField label="Unit" name="unit" value={occupiedForm.unit} onChange={(e) => setOccupiedForm({ ...occupiedForm, unit: e.target.value })} required />
              <FormField label="Qtr Loc" name="colony" value={occupiedForm.colony} onChange={(e) => setOccupiedForm({ ...occupiedForm, colony: e.target.value })} required />
              <FormField label="Qtr No." name="quarterNo" value={occupiedForm.quarterNo} onChange={(e) => setOccupiedForm({ ...occupiedForm, quarterNo: e.target.value })} required />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Condition</label>
                <ConditionSelect value={occupiedForm.condition} onChange={(v) => setOccupiedForm({ ...occupiedForm, condition: v })} />
              </div>
              <Button type="submit" disabled={submitting}>
                <Plus size={16} />
                Add Quarter
              </Button>
              {error && <p className="text-sm text-red-700">{error}</p>}
            </form>

            <DataTable
              columns={[
                { header: "S/No.", render: (_q: Quarter, i: number) => i + 1 },
                {
                  header: "Army No.",
                  render: (q: Quarter) =>
                    editingId === q.id ? (
                      <input value={editDraft.serviceNo} onChange={(e) => setEditDraft({ ...editDraft, serviceNo: e.target.value })} className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm" />
                    ) : (
                      q.serviceNo
                    ),
                },
                {
                  header: "Rank",
                  render: (q: Quarter) =>
                    editingId === q.id ? (
                      <input value={editDraft.rank} onChange={(e) => setEditDraft({ ...editDraft, rank: e.target.value })} className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm" />
                    ) : (
                      q.rank
                    ),
                },
                {
                  header: "Name",
                  render: (q: Quarter) =>
                    editingId === q.id ? (
                      <input value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm" />
                    ) : (
                      q.name
                    ),
                },
                {
                  header: "Unit",
                  render: (q: Quarter) =>
                    editingId === q.id ? (
                      <input value={editDraft.unit} onChange={(e) => setEditDraft({ ...editDraft, unit: e.target.value })} className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm" />
                    ) : (
                      q.unit
                    ),
                },
                {
                  header: "Qtr Loc",
                  render: (q: Quarter) =>
                    editingId === q.id ? (
                      <input value={editDraft.colony} onChange={(e) => setEditDraft({ ...editDraft, colony: e.target.value })} className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm" />
                    ) : (
                      q.colony
                    ),
                },
                {
                  header: "Qtr No.",
                  render: (q: Quarter) =>
                    editingId === q.id ? (
                      <input value={editDraft.quarterNo} onChange={(e) => setEditDraft({ ...editDraft, quarterNo: e.target.value })} className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm" />
                    ) : (
                      q.quarterNo
                    ),
                },
                {
                  header: "Condition",
                  render: (q: Quarter) =>
                    editingId === q.id ? (
                      <ConditionSelect value={editDraft.condition} onChange={(v) => setEditDraft({ ...editDraft, condition: v })} />
                    ) : (
                      <StatusBadge status={q.condition} />
                    ),
                },
                { header: "Action", render: (q: Quarter) => actionCell(q) },
              ]}
              rows={occupiedQuarters}
              rowKey={(q) => q.id}
            />
          </div>
        )}

        {tab === "MAINTENANCE" && (
          <DataTable
            columns={[
              { header: "S/No.", render: (_q: Quarter, i: number) => i + 1 },
              { header: "Army No.", render: (q: Quarter) => q.serviceNo ?? "—" },
              { header: "Rank", render: (q: Quarter) => q.rank ?? "—" },
              { header: "Name", render: (q: Quarter) => q.name ?? "—" },
              { header: "Unit", render: (q: Quarter) => q.unit ?? "—" },
              { header: "Qtr Loc", render: (q: Quarter) => q.colony },
              { header: "Qtr No.", render: (q: Quarter) => q.quarterNo },
              { header: "Status (before)", render: (q: Quarter) => <StatusBadge status={q.statusBeforeMaintenance ?? "—"} /> },
              { header: "Condition", render: (q: Quarter) => <StatusBadge status={q.condition} /> },
              {
                header: "Maintenance Status",
                render: (q: Quarter) =>
                  q.maintenanceStatus === "IN_PROGRESS" ? (
                    <Button variant="secondary" onClick={() => requestCompleteMaintenance(q.id)}>
                      In Progress
                    </Button>
                  ) : (
                    <StatusBadge status={q.maintenanceStatus ?? "—"} />
                  ),
              },
              { header: "Maintenance Remark", render: (q: Quarter) => q.maintenanceRemark ?? "—" },
              { header: "Start Time", render: (q: Quarter) => formatDateTime(q.maintenanceStartedAt) },
              { header: "End Time", render: (q: Quarter) => formatDateTime(q.maintenanceEndedAt) },
              { header: "Completed Remarks", render: (q: Quarter) => q.maintenanceCompletedRemark ?? "—" },
            ]}
            rows={maintenanceQuarters}
            rowKey={(q) => q.id}
          />
        )}
      </main>

      {pendingAction?.type === "delete" && (
        <ConfirmDialog
          title="Delete Quarter"
          message="Delete this quarter record? This cannot be undone."
          confirmLabel="Delete"
          confirmVariant="danger"
          onConfirm={confirmPendingAction}
          onCancel={closeDialog}
        />
      )}

      {pendingAction?.type === "maintenance-start" && (
        <ConfirmDialog
          title="Start Maintenance"
          message="What maintenance needs to be done for this quarter?"
          confirmLabel="Start Maintenance"
          showInput
          inputLabel="Maintenance remark"
          inputValue={dialogRemark}
          onInputChange={setDialogRemark}
          inputRequired
          onConfirm={confirmPendingAction}
          onCancel={closeDialog}
        />
      )}

      {pendingAction?.type === "maintenance-complete" && (
        <ConfirmDialog
          title="Complete Maintenance"
          message="Mark this maintenance as completed. Add a completion remark if you have one."
          confirmLabel="Mark Completed"
          showInput
          inputLabel="Completion remark (optional)"
          inputValue={dialogRemark}
          onInputChange={setDialogRemark}
          onConfirm={confirmPendingAction}
          onCancel={closeDialog}
        />
      )}
    </div>
  );
}
