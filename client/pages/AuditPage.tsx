import { Header } from "@/client/components/Header";
import { DataTable } from "@/client/components/DataTable";

type AuditEvent = {
  id: number;
  actor: string;
  action: string;
  entity: string;
  entityId: number | null;
  details: string | null;
  createdAt: Date;
};

export function AuditPage({ events }: { events: AuditEvent[] }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-screen-2xl space-y-6 px-4 py-8 sm:px-6 lg:px-10">
        <h1 className="text-2xl font-semibold text-slate-900">Audit Log</h1>
        <DataTable
          columns={[
            { header: "When", render: (e: AuditEvent) => new Date(e.createdAt).toLocaleString() },
            { header: "Actor", render: (e: AuditEvent) => e.actor },
            { header: "Action", render: (e: AuditEvent) => e.action },
            { header: "Entity", render: (e: AuditEvent) => `${e.entity}${e.entityId ? ` #${e.entityId}` : ""}` },
            { header: "Details", render: (e: AuditEvent) => e.details ?? "—" },
          ]}
          rows={events}
          rowKey={(e) => e.id}
        />
      </main>
    </div>
  );
}
