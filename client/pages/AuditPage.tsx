"use client";

import { TopNav } from "@/client/components/TopNav";
import { DataTable } from "@/client/components/DataTable";
import { RemarkCell } from "@/client/components/RemarkCell";
import { formatDateTime } from "@/client/lib/format-date";

type AuditEvent = {
  id: number;
  actor: string;
  actorDisplay: string;
  action: string;
  entity: string;
  entityId: number | null;
  details: string | null;
  createdAt: Date;
};

export function AuditPage({ events }: { events: AuditEvent[] }) {
  return (
    <div className="min-h-screen bg-page-bg">
      <TopNav />
      <main className="w-full space-y-6 px-3 py-8 sm:px-4 lg:px-6">
        <h1 className="text-3xl font-bold text-slate-900">Audit Log</h1>
        <DataTable
          columns={[
            { header: "S/No.", render: (_e: AuditEvent, i: number) => i + 1, exportValue: (_e, i) => i + 1 },
            { header: "When", render: (e: AuditEvent) => formatDateTime(e.createdAt), sortValue: (e) => e.createdAt },
            { header: "Actor", render: (e: AuditEvent) => e.actorDisplay, sortValue: (e) => e.actorDisplay },
            { header: "Action", render: (e: AuditEvent) => e.action, sortValue: (e) => e.action },
            {
              header: "Entity",
              render: (e: AuditEvent) => `${e.entity}${e.entityId ? ` #${e.entityId}` : ""}`,
              sortValue: (e) => `${e.entity}${e.entityId ? ` #${e.entityId}` : ""}`,
            },
            { header: "Details", render: (e: AuditEvent) => <RemarkCell text={e.details} label="Audit Details" />, sortValue: (e) => e.details },
          ]}
          rows={events}
          rowKey={(e) => e.id}
          title="Audit Log"
        />
      </main>
    </div>
  );
}
