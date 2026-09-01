"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Header } from "@/client/components/Header";
import { Button } from "@/client/components/Button";
import { FormField } from "@/client/components/FormField";
import { DataTable } from "@/client/components/DataTable";
import { StatusBadge } from "@/client/components/StatusBadge";

type Applicant = { serviceNo: string; rank: string; name: string; unit: string };
type Allotment = { applicant: Applicant };
type Quarter = {
  id: number;
  quarterNo: string;
  colony: string;
  status: string;
  condition: string;
  allotments: Allotment[];
};

export function QuartersPage({ quarters }: { quarters: Quarter[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ quarterNo: "", colony: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/quarters", {
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

    setForm({ quarterNo: "", colony: "" });
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Quarters</h1>
          <p className="text-sm text-slate-500">Quarters Vacant/Occupied</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3"
        >
          <FormField
            label="Qtr Loc"
            name="colony"
            value={form.colony}
            onChange={(e) => setForm({ ...form, colony: e.target.value })}
            required
          />
          <FormField
            label="Qtr No."
            name="quarterNo"
            value={form.quarterNo}
            onChange={(e) => setForm({ ...form, quarterNo: e.target.value })}
            required
          />
          <div className="flex items-end">
            <Button type="submit" disabled={submitting}>
              <Plus size={16} />
              Add Quarter
            </Button>
          </div>
          {error && <p className="text-sm text-red-700 sm:col-span-3">{error}</p>}
        </form>

        <DataTable
          columns={[
            { header: "S/No.", render: (_q: Quarter, i: number) => i + 1 },
            {
              header: "Army No.",
              render: (q: Quarter) => (q.status === "OCCUPIED" ? q.allotments[0]?.applicant.serviceNo ?? "—" : "—"),
            },
            {
              header: "Rank",
              render: (q: Quarter) => (q.status === "OCCUPIED" ? q.allotments[0]?.applicant.rank ?? "—" : "—"),
            },
            {
              header: "Name",
              render: (q: Quarter) => (q.status === "OCCUPIED" ? q.allotments[0]?.applicant.name ?? "—" : "—"),
            },
            {
              header: "Unit",
              render: (q: Quarter) => (q.status === "OCCUPIED" ? q.allotments[0]?.applicant.unit ?? "—" : "—"),
            },
            { header: "Qtr Loc", render: (q: Quarter) => q.colony },
            { header: "Qtr No.", render: (q: Quarter) => q.quarterNo },
            { header: "Status", render: (q: Quarter) => <StatusBadge status={q.status} /> },
            { header: "Condition", render: (q: Quarter) => <StatusBadge status={q.condition} /> },
          ]}
          rows={quarters}
          rowKey={(q) => q.id}
        />
      </main>
    </div>
  );
}
