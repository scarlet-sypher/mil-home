"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Wrench, Pencil, Trash2, Check, X, Info, ArrowLeft } from "lucide-react";
import { TopNav } from "@/client/components/TopNav";
import { Button } from "@/client/components/Button";
import { FormField } from "@/client/components/FormField";
import { DataTable } from "@/client/components/DataTable";
import { StatusBadge } from "@/client/components/StatusBadge";
import { ConfirmDialog } from "@/client/components/ConfirmDialog";
import { RemarkCell } from "@/client/components/RemarkCell";
import { QrCodeButton } from "@/client/components/QrCodeButton";
import { formatDateTime } from "@/client/lib/format-date";
import { readErrorMessage, safeParseJson } from "@/client/lib/safe-json";

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
  underMaintenance: boolean;
  createdAt: Date;
};

type MaintenanceRecord = {
  id: number;
  quarterId: number;
  colony: string;
  quarterNo: string;
  statusBeforeMaintenance: string;
  condition: string;
  serviceNo: string | null;
  rank: string | null;
  name: string | null;
  unit: string | null;
  remark: string;
  status: string;
  completedRemark: string | null;
  startedAt: Date;
  endedAt: Date | null;
};

type Tab = "ALL" | "VACANT" | "OCCUPIED" | "MAINTENANCE";

const TAB_LABELS: Record<Tab, string> = {
  ALL: "Show All",
  VACANT: "Vacant",
  OCCUPIED: "Occupied",
  MAINTENANCE: "Under Maintenance",
};

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
  | { type: "maintenance-delete"; id: number }
  | null;

const EMPTY_VACANT_FORM = { quarterNo: "", colony: "", condition: "FIT" };
const EMPTY_OCCUPIED_FORM = { serviceNo: "", rank: "", name: "", unit: "", quarterNo: "", colony: "", condition: "FIT" };

function stackedDateTime(value: Date | null) {
  if (!value) return <span className="text-slate-400">—</span>;
  const [datePart, timePart] = formatDateTime(value).split(", ");
  return (
    <div className="leading-tight">
      <div>{datePart}</div>
      <div className="text-xs text-slate-500">{timePart}</div>
    </div>
  );
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

export function QuartersPage({
  quarters,
  maintenanceRecords,
  role,
}: {
  quarters: Quarter[];
  maintenanceRecords: MaintenanceRecord[];
  role: "ADMIN" | "USER";
}) {
  const isAdmin = role === "ADMIN";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(searchParams.get("tab") === "MAINTENANCE" ? "MAINTENANCE" : "ALL");
  const [cameFromTab, setCameFromTab] = useState<Tab | null>(null);
  const [highlightQuarterId, setHighlightQuarterId] = useState<number | null>(null);
  const [vacantForm, setVacantForm] = useState(EMPTY_VACANT_FORM);
  const [occupiedForm, setOccupiedForm] = useState(EMPTY_OCCUPIED_FORM);
  const [error, setError] = useState("");
  const [vacantQuarterNoError, setVacantQuarterNoError] = useState("");
  const [occupiedQuarterNoError, setOccupiedQuarterNoError] = useState("");
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
  const [editQuarterNoError, setEditQuarterNoError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [dialogRemark, setDialogRemark] = useState("");
  const [pageError, setPageError] = useState("");

  async function handleVacantSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setVacantQuarterNoError("");

    const response = await fetch("/api/quarters/vacant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vacantForm),
    });

    if (!response.ok) {
      const data = await safeParseJson<{ error?: string; field?: string }>(response, {});
      if (data.field === "quarterNo") {
        setVacantQuarterNoError(data.error ?? "This quarter number is already in use.");
      } else {
        setError(data.error ?? "Something went wrong.");
      }
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
    setOccupiedQuarterNoError("");

    const response = await fetch("/api/quarters/occupied", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(occupiedForm),
    });

    if (!response.ok) {
      const data = await safeParseJson<{ error?: string; field?: string }>(response, {});
      if (data.field === "quarterNo") {
        setOccupiedQuarterNoError(data.error ?? "This quarter number is already in use.");
      } else {
        setError(data.error ?? "Something went wrong.");
      }
      setSubmitting(false);
      return;
    }

    setOccupiedForm(EMPTY_OCCUPIED_FORM);
    setSubmitting(false);
    router.refresh();
  }

  function startEdit(q: Quarter) {
    setEditingId(q.id);
    setEditQuarterNoError("");
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
    setEditQuarterNoError("");
  }

  async function saveEdit(q: Quarter) {
    setEditQuarterNoError("");
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
      const data = await safeParseJson<{ error?: string; field?: string }>(response, {});
      if (data.field === "quarterNo") {
        setEditQuarterNoError(data.error ?? "This quarter number is already in use.");
      } else {
        setPageError(data.error ?? "Could not save changes.");
      }
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

  function requestDeleteMaintenanceRecord(id: number) {
    setPageError("");
    setPendingAction({ type: "maintenance-delete", id });
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
        setPageError(await readErrorMessage(response, "Could not delete this record."));
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
        setPageError(await readErrorMessage(response, "Could not start maintenance."));
        closeDialog();
        return;
      }
    } else if (pendingAction.type === "maintenance-complete") {
      const response = await fetch(`/api/maintenance/${pendingAction.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remark: dialogRemark }),
      });
      if (!response.ok) {
        setPageError(await readErrorMessage(response, "Could not complete maintenance."));
        closeDialog();
        return;
      }
    } else if (pendingAction.type === "maintenance-delete") {
      const response = await fetch(`/api/maintenance/${pendingAction.id}`, { method: "DELETE" });
      if (!response.ok) {
        setPageError(await readErrorMessage(response, "Could not delete this maintenance record."));
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

  function goToQuarter(quarterId: number) {
    const quarter = quarters.find((q) => q.id === quarterId);
    if (!quarter) return;
    setCameFromTab(tab);
    setHighlightQuarterId(quarterId);
    setTab(quarter.status === "OCCUPIED" ? "OCCUPIED" : "VACANT");
  }

  function clearNavigationBreadcrumb() {
    setCameFromTab(null);
    setHighlightQuarterId(null);
  }

  async function handleConditionChange(quarterId: number, condition: string) {
    setPageError("");
    const response = await fetch(`/api/quarters/${quarterId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ condition }),
    });
    if (!response.ok) {
      setPageError(await readErrorMessage(response, "Could not update condition."));
      return;
    }
    router.refresh();
  }

  function lastCompletedMaintenance(quarterId: number) {
    const completed = maintenanceRecords
      .filter((r) => r.quarterId === quarterId && r.status === "COMPLETED")
      .sort((a, b) => new Date(b.endedAt ?? 0).getTime() - new Date(a.endedAt ?? 0).getTime());
    return completed[0] ?? null;
  }

  function maintenanceTagCell(q: Quarter) {
    const last = lastCompletedMaintenance(q.id);
    return (
      <div className="flex items-center gap-1.5">
        {q.underMaintenance ? <StatusBadge status="UNDER_MAINTENANCE" /> : <span className="text-slate-400">—</span>}
        {last && (
          <span className="group relative inline-flex">
            <Info size={14} className="cursor-help text-slate-400" />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 w-max -translate-x-1/2 rounded bg-slate-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              Last maintenance on {formatDateTime(last.endedAt)}
            </span>
          </span>
        )}
      </div>
    );
  }

  function actionCell(q: Quarter, onEdit?: () => void) {
    if (q.underMaintenance) {
      return <span className="text-sm text-slate-400">—</span>;
    }

    // Editing and deleting a vacant quarter record is an admin-only action.
    const canEditOrDelete = q.status !== "VACANT" || isAdmin;

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
        {canEditOrDelete && (
          <>
            <Button variant="info" onClick={onEdit ?? (() => startEdit(q))}>
              <Pencil size={14} />
            </Button>
            <Button variant="danger" onClick={() => requestDelete(q.id)}>
              <Trash2 size={14} />
            </Button>
          </>
        )}
        <Button variant="warning" onClick={() => requestStartMaintenance(q.id)}>
          <Wrench size={14} />
          Maintenance
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page-bg">
      <TopNav />
      <main className="w-full space-y-6 px-3 py-8 sm:px-4 lg:px-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Quarters</h1>
          <p className="text-sm text-slate-500">Quarters Vacant/Occupied</p>
        </div>

        {pageError && (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{pageError}</p>
        )}

        <div className="mx-auto flex w-fit flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-md">
          {(Object.keys(TAB_LABELS) as Tab[]).map((value) => (
            <button
              key={value}
              onClick={() => {
                setTab(value);
                clearNavigationBreadcrumb();
              }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-accent ${
                tab === value ? "bg-accent-dark text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {TAB_LABELS[value]}
            </button>
          ))}
        </div>

        {tab === "ALL" && (
          <DataTable
            columns={[
              { header: "S/No.", render: (_q: Quarter, i: number) => i + 1, exportValue: (_q, i) => i + 1 },
              { header: "Qtr Loc", render: (q: Quarter) => q.colony, sortValue: (q) => q.colony },
              { header: "Qtr No.", render: (q: Quarter) => q.quarterNo, sortValue: (q) => q.quarterNo },
              { header: "Army No.", render: (q: Quarter) => q.serviceNo ?? "—", sortValue: (q) => q.serviceNo },
              { header: "Rank", render: (q: Quarter) => q.rank ?? "—", sortValue: (q) => q.rank },
              { header: "Name", render: (q: Quarter) => q.name ?? "—", sortValue: (q) => q.name },
              { header: "Unit", render: (q: Quarter) => q.unit ?? "—", sortValue: (q) => q.unit },
              { header: "Status", render: (q: Quarter) => <StatusBadge status={q.status} />, sortValue: (q) => q.status },
              { header: "Condition", render: (q: Quarter) => <StatusBadge status={q.condition} />, sortValue: (q) => q.condition },
              {
                header: "Under Maintenance",
                render: (q: Quarter) => (q.underMaintenance ? "Yes" : "No"),
                sortValue: (q) => (q.underMaintenance ? 1 : 0),
                exportValue: (q) => (q.underMaintenance ? "Yes" : "No"),
              },
            ]}
            rows={allQuarters}
            rowKey={(q) => q.id}
            title="Quarters - Show All"
          />
        )}

        {tab === "VACANT" && (
          <>
            {cameFromTab && (
              <Button
                variant="secondary"
                onClick={() => {
                  setTab(cameFromTab);
                  clearNavigationBreadcrumb();
                }}
              >
                <ArrowLeft size={16} />
                Back to {TAB_LABELS[cameFromTab]}
              </Button>
            )}
            <div className={isAdmin ? "grid gap-6 lg:grid-cols-[280px_1fr]" : ""}>
            {isAdmin && (
              <form onSubmit={handleVacantSubmit} className="flex flex-col gap-4 rounded-card border border-slate-200 bg-white p-5 shadow-sm">
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
                  onChange={(e) => {
                    setVacantForm({ ...vacantForm, quarterNo: e.target.value });
                    setVacantQuarterNoError("");
                  }}
                  error={vacantQuarterNoError}
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
            )}

            <DataTable
              columns={[
                { header: "S/No.", render: (_q: Quarter, i: number) => i + 1, exportValue: (_q, i) => i + 1 },
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
                  sortValue: (q) => q.colony,
                },
                {
                  header: "Qtr No.",
                  render: (q: Quarter) =>
                    editingId === q.id ? (
                      <div>
                        <input
                          value={editDraft.quarterNo}
                          onChange={(e) => {
                            setEditDraft({ ...editDraft, quarterNo: e.target.value });
                            setEditQuarterNoError("");
                          }}
                          className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                        />
                        {editQuarterNoError && <p className="mt-1 text-xs text-red-600">{editQuarterNoError}</p>}
                      </div>
                    ) : (
                      q.quarterNo
                    ),
                  sortValue: (q) => q.quarterNo,
                },
                {
                  header: "Condition",
                  render: (q: Quarter) =>
                    editingId === q.id ? (
                      <ConditionSelect value={editDraft.condition} onChange={(v) => setEditDraft({ ...editDraft, condition: v })} />
                    ) : (
                      <StatusBadge status={q.condition} />
                    ),
                  sortValue: (q) => q.condition,
                },
                {
                  header: "Maintenance",
                  render: (q: Quarter) => maintenanceTagCell(q),
                  sortValue: (q) => (q.underMaintenance ? 1 : 0),
                  exportValue: (q) => (q.underMaintenance ? "Yes" : "No"),
                },
                { header: "Action", render: (q: Quarter) => actionCell(q) },
              ]}
              rows={vacantQuarters}
              rowKey={(q) => q.id}
              rowClassName={(q) => (q.id === highlightQuarterId ? "bg-amber-50" : "")}
              title="Quarters - Vacant"
            />
            </div>
          </>
        )}

        {tab === "OCCUPIED" && (
          <>
            {cameFromTab && (
              <Button
                variant="secondary"
                onClick={() => {
                  setTab(cameFromTab);
                  clearNavigationBreadcrumb();
                }}
              >
                <ArrowLeft size={16} />
                Back to {TAB_LABELS[cameFromTab]}
              </Button>
            )}
            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <form onSubmit={handleOccupiedSubmit} className="flex flex-col gap-4 rounded-card border border-slate-200 bg-white p-5 shadow-sm">
              <FormField label="Army No." name="serviceNo" value={occupiedForm.serviceNo} onChange={(e) => setOccupiedForm({ ...occupiedForm, serviceNo: e.target.value })} required />
              <FormField label="Rank" name="rank" value={occupiedForm.rank} onChange={(e) => setOccupiedForm({ ...occupiedForm, rank: e.target.value })} required />
              <FormField label="Name" name="name" value={occupiedForm.name} onChange={(e) => setOccupiedForm({ ...occupiedForm, name: e.target.value })} required />
              <FormField label="Unit" name="unit" value={occupiedForm.unit} onChange={(e) => setOccupiedForm({ ...occupiedForm, unit: e.target.value })} required />
              <FormField label="Qtr Loc" name="colony" value={occupiedForm.colony} onChange={(e) => setOccupiedForm({ ...occupiedForm, colony: e.target.value })} required />
              <FormField
                label="Qtr No."
                name="quarterNo"
                value={occupiedForm.quarterNo}
                onChange={(e) => {
                  setOccupiedForm({ ...occupiedForm, quarterNo: e.target.value });
                  setOccupiedQuarterNoError("");
                }}
                error={occupiedQuarterNoError}
                required
              />
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
                { header: "S/No.", render: (_q: Quarter, i: number) => i + 1, exportValue: (_q, i) => i + 1 },
                {
                  header: "Qtr Loc",
                  render: (q: Quarter) =>
                    editingId === q.id ? (
                      <input value={editDraft.colony} onChange={(e) => setEditDraft({ ...editDraft, colony: e.target.value })} className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm" />
                    ) : (
                      q.colony
                    ),
                  sortValue: (q) => q.colony,
                },
                {
                  header: "Qtr No.",
                  render: (q: Quarter) =>
                    editingId === q.id ? (
                      <div>
                        <input
                          value={editDraft.quarterNo}
                          onChange={(e) => {
                            setEditDraft({ ...editDraft, quarterNo: e.target.value });
                            setEditQuarterNoError("");
                          }}
                          className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm"
                        />
                        {editQuarterNoError && <p className="mt-1 text-xs text-red-600">{editQuarterNoError}</p>}
                      </div>
                    ) : (
                      q.quarterNo
                    ),
                  sortValue: (q) => q.quarterNo,
                },
                {
                  header: "Army No.",
                  render: (q: Quarter) =>
                    editingId === q.id ? (
                      <input value={editDraft.serviceNo} onChange={(e) => setEditDraft({ ...editDraft, serviceNo: e.target.value })} className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm" />
                    ) : (
                      q.serviceNo
                    ),
                  sortValue: (q) => q.serviceNo,
                },
                {
                  header: "Rank",
                  render: (q: Quarter) =>
                    editingId === q.id ? (
                      <input value={editDraft.rank} onChange={(e) => setEditDraft({ ...editDraft, rank: e.target.value })} className="w-20 rounded-md border border-slate-300 px-2 py-1 text-sm" />
                    ) : (
                      q.rank
                    ),
                  sortValue: (q) => q.rank,
                },
                {
                  header: "Name",
                  render: (q: Quarter) =>
                    editingId === q.id ? (
                      <input value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm" />
                    ) : (
                      q.name
                    ),
                  sortValue: (q) => q.name,
                },
                {
                  header: "Unit",
                  render: (q: Quarter) =>
                    editingId === q.id ? (
                      <input value={editDraft.unit} onChange={(e) => setEditDraft({ ...editDraft, unit: e.target.value })} className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm" />
                    ) : (
                      q.unit
                    ),
                  sortValue: (q) => q.unit,
                },
                {
                  header: "Condition",
                  render: (q: Quarter) =>
                    editingId === q.id ? (
                      <ConditionSelect value={editDraft.condition} onChange={(v) => setEditDraft({ ...editDraft, condition: v })} />
                    ) : (
                      <StatusBadge status={q.condition} />
                    ),
                  sortValue: (q) => q.condition,
                },
                {
                  header: "Maintenance",
                  render: (q: Quarter) => maintenanceTagCell(q),
                  sortValue: (q) => (q.underMaintenance ? 1 : 0),
                  exportValue: (q) => (q.underMaintenance ? "Yes" : "No"),
                },
                {
                  header: "Date Added",
                  render: (q: Quarter) => stackedDateTime(q.createdAt),
                  sortValue: (q) => q.createdAt,
                },
                { header: "Action", render: (q: Quarter) => actionCell(q) },
              ]}
              rows={occupiedQuarters}
              rowKey={(q) => q.id}
              rowClassName={(q) => (q.id === highlightQuarterId ? "bg-amber-50" : "")}
              title="Quarters - Occupied"
            />
            </div>
          </>
        )}

        {tab === "MAINTENANCE" && (
          <DataTable
            toolbarExtra={<QrCodeButton />}
            columns={[
              { header: "S/No.", render: (_r: MaintenanceRecord, i: number) => i + 1, exportValue: (_r, i) => i + 1 },
              { header: "Qtr Loc", render: (r: MaintenanceRecord) => r.colony, sortValue: (r) => r.colony },
              {
                header: "Qtr No.",
                render: (r: MaintenanceRecord) => (
                  <button onClick={() => goToQuarter(r.quarterId)} className="text-blue-600 hover:text-blue-800 hover:underline">
                    {r.quarterNo}
                  </button>
                ),
                sortValue: (r) => r.quarterNo,
              },
              {
                header: "Army No.",
                render: (r: MaintenanceRecord) =>
                  r.serviceNo ? (
                    <button onClick={() => goToQuarter(r.quarterId)} className="text-blue-600 hover:text-blue-800 hover:underline">
                      {r.serviceNo}
                    </button>
                  ) : (
                    "—"
                  ),
                sortValue: (r) => r.serviceNo,
              },
              { header: "Name", render: (r: MaintenanceRecord) => r.name ?? "—", sortValue: (r) => r.name },
              { header: "Status (before)", render: (r: MaintenanceRecord) => <StatusBadge status={r.statusBeforeMaintenance} />, sortValue: (r) => r.statusBeforeMaintenance },
              {
                header: "Condition",
                render: (r: MaintenanceRecord) => {
                  const liveQuarter = quarters.find((q) => q.id === r.quarterId);
                  return (
                    <ConditionSelect
                      value={liveQuarter?.condition ?? r.condition}
                      onChange={(value) => handleConditionChange(r.quarterId, value)}
                    />
                  );
                },
                sortValue: (r) => quarters.find((q) => q.id === r.quarterId)?.condition ?? r.condition,
              },
              {
                header: "Maintenance Status",
                render: (r: MaintenanceRecord) =>
                  r.status === "IN_PROGRESS" ? (
                    <Button variant="warning" onClick={() => requestCompleteMaintenance(r.id)}>
                      In Progress
                    </Button>
                  ) : (
                    <StatusBadge status={r.status} />
                  ),
                sortValue: (r) => r.status,
              },
              { header: "Maintenance Remark", render: (r: MaintenanceRecord) => <RemarkCell text={r.remark} label="Maintenance Remark" />, sortValue: (r) => r.remark },
              { header: "Start Time", render: (r: MaintenanceRecord) => stackedDateTime(r.startedAt), sortValue: (r) => r.startedAt },
              { header: "End Time", render: (r: MaintenanceRecord) => stackedDateTime(r.endedAt), sortValue: (r) => r.endedAt },
              { header: "Completed Remarks", render: (r: MaintenanceRecord) => <RemarkCell text={r.completedRemark} label="Completed Remarks" />, sortValue: (r) => r.completedRemark },
              {
                header: "Action",
                render: (r: MaintenanceRecord) =>
                  r.status === "COMPLETED" ? (
                    <Button variant="danger" onClick={() => requestDeleteMaintenanceRecord(r.id)}>
                      <Trash2 size={14} />
                    </Button>
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  ),
              },
            ]}
            rows={maintenanceRecords}
            rowKey={(r) => r.id}
            title="Quarters - Under Maintenance"
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

      {pendingAction?.type === "maintenance-delete" && (
        <ConfirmDialog
          title="Delete Maintenance Record"
          message="Delete this maintenance history entry? This cannot be undone."
          confirmLabel="Delete"
          confirmVariant="danger"
          onConfirm={confirmPendingAction}
          onCancel={closeDialog}
        />
      )}
    </div>
  );
}
