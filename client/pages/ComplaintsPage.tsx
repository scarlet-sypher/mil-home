"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/client/components/Header";
import { Button } from "@/client/components/Button";
import { FormField } from "@/client/components/FormField";
import { DataTable } from "@/client/components/DataTable";
import { StatusBadge } from "@/client/components/StatusBadge";

type Quarter = { id: number; quarterNo: string };
type Complaint = {
  id: number;
  resident: string;
  category: string;
  description: string;
  status: string;
  quarter: Quarter;
};

export function ComplaintsPage({ complaints, quarters }: { complaints: Complaint[]; quarters: Quarter[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ quarterId: "", resident: "", category: "", description: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/complaints", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, quarterId: Number(form.quarterId) }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    setForm({ quarterId: "", resident: "", category: "", description: "" });
    setSubmitting(false);
    router.refresh();
  }

  async function handleClose(id: number) {
    const response = await fetch(`/api/complaints/${id}/close`, { method: "POST" });
    if (response.ok) router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-semibold text-slate-900">Complaints</h1>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
        >
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
          <FormField label="Resident" name="resident" value={form.resident} onChange={(e) => setForm({ ...form, resident: e.target.value })} required />
          <FormField label="Category" name="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
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
            { header: "Quarter", render: (c: Complaint) => c.quarter.quarterNo },
            { header: "Resident", render: (c: Complaint) => c.resident },
            { header: "Category", render: (c: Complaint) => c.category },
            { header: "Description", render: (c: Complaint) => c.description },
            { header: "Status", render: (c: Complaint) => <StatusBadge status={c.status} /> },
            {
              header: "",
              render: (c: Complaint) =>
                c.status === "OPEN" ? (
                  <Button variant="secondary" onClick={() => handleClose(c.id)}>
                    Close
                  </Button>
                ) : null,
            },
          ]}
          rows={complaints}
          rowKey={(c) => c.id}
        />
      </main>
    </div>
  );
}
