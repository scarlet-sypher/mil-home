import { Home as HomeIcon, Building2, Users, MessageSquareWarning, ClipboardCheck } from "lucide-react";
import { Header } from "@/client/components/Header";
import { StatCard } from "@/client/components/StatCard";

type DashboardStats = {
  totalQuarters: number;
  vacantQuarters: number;
  occupiedQuarters: number;
  waitingApplicants: number;
  openComplaints: number;
  pendingVacations: number;
};

export function HomePage({ email, stats }: { email: string; stats: DashboardStats }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Signed in as {email}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="Total Quarters" value={stats.totalQuarters} icon={Building2} />
          <StatCard label="Vacant Quarters" value={stats.vacantQuarters} icon={HomeIcon} />
          <StatCard label="Occupied Quarters" value={stats.occupiedQuarters} icon={Building2} />
          <StatCard label="Applicants Waiting" value={stats.waitingApplicants} icon={Users} />
          <StatCard label="Open Complaints" value={stats.openComplaints} icon={MessageSquareWarning} />
          <StatCard label="Pending Vacations" value={stats.pendingVacations} icon={ClipboardCheck} />
        </div>
      </main>
    </div>
  );
}
