"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Header } from "@/client/components/Header";
import { Button } from "@/client/components/Button";
import { FormField } from "@/client/components/FormField";
import { DataTable } from "@/client/components/DataTable";
import { StatusBadge } from "@/client/components/StatusBadge";

type Quarter = {
  id: number;
  quarterNo: string;
  colony: string;
  qtype: string;
  entitlement: string | null;
  status: string;
  condition: string;
};

export function QuartersPage({ quarters }: { quarters: Quarter[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ quarterNo: "", colony: "", qtype: "", entitlement: "" });
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

    setForm({ quarterNo: "", colony: "", qtype: "", entitlement: "" });
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">Quarters</h1>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <FormField
            label="Quarter No."
            name="quarterNo"
            value={form.quarterNo}
            onChange={(e) => setForm({ ...form, quarterNo: e.target.value })}
            required
          />
          <FormField
            label="Colony"
            name="colony"
            value={form.colony}
            onChange={(e) => setForm({ ...form, colony: e.target.value })}
            required
          />
          <FormField
            label="Type"
            name="qtype"
            value={form.qtype}
            onChange={(e) => setForm({ ...form, qtype: e.target.value })}
            required
          />
          <FormField
            label="Entitlement"
            name="entitlement"
            value={form.entitlement}
            onChange={(e) => setForm({ ...form, entitlement: e.target.value })}
          />
          <div className="flex items-end">
            <Button type="submit" disabled={submitting}>
              <Plus size={16} />
              Add Quarter
            </Button>
          </div>
          {error && <p className="text-sm text-red-700 sm:col-span-2 lg:col-span-5">{error}</p>}
        </form>

        <DataTable
          columns={[
            { header: "Quarter No.", render: (q: Quarter) => q.quarterNo },
            { header: "Colony", render: (q: Quarter) => q.colony },
            { header: "Type", render: (q: Quarter) => q.qtype },
            { header: "Entitlement", render: (q: Quarter) => q.entitlement ?? "—" },
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
