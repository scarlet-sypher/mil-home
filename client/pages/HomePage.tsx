import Image from "next/image";
import Link from "next/link";
import {
  Building2,
  Users,
  ClipboardCheck,
  MessageSquareWarning,
  DoorOpen,
  Wrench,
  Calendar,
  Clock,
  ShieldCheck,
  FileText,
  TrendingUp,
  UserPlus,
  MessageSquarePlus,
  ChevronRight,
} from "lucide-react";
import { TopNav } from "@/client/components/TopNav";
import { Sparkline } from "@/client/components/Sparkline";
import { DonutChart } from "@/client/components/DonutChart";
import { formatDateTime } from "@/client/lib/format-date";
import { capitalizeWords } from "@/client/lib/format-text";
import type { DashboardStats } from "@/server/services/dashboard.service";

type Trend = { percent: number; sparkline: number[] };

type StatCardDef = {
  label: string;
  value: number;
  trend: Trend;
  icon: typeof Building2;
  badgeColor: string;
  sparklineColor: string;
};

function StatCard({ label, value, trend, icon: Icon, badgeColor, sparklineColor }: StatCardDef) {
  const isUp = trend.percent >= 0;
  return (
    <div className="rounded-card border border-[rgba(255,255,255,0.12)] bg-[rgba(11,61,52,0.6)] px-4 py-5 shadow-lg backdrop-blur-md [-webkit-backdrop-filter:blur(12px)] first:ml-3 last:mr-3 sm:first:ml-4 sm:last:mr-4 lg:first:ml-6 lg:last:mr-6">
      <div className="flex items-center gap-2">
        <div className={`inline-flex shrink-0 rounded-md p-2 ${badgeColor}`}>
          <Icon size={16} className="text-white" />
        </div>
        <p className="text-base font-semibold text-slate-300">{label}</p>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-3xl font-bold text-white">{value}</p>
        <span className={`text-sm font-medium ${isUp ? "text-emerald-400" : "text-red-400"}`}>
          {isUp ? "↑" : "↓"}
          {Math.abs(trend.percent)}% vs last month
        </span>
      </div>
      <div className="mt-3">
        <Sparkline data={trend.sparkline} color={sparklineColor} />
      </div>
    </div>
  );
}

const STAT_CARDS = (stats: DashboardStats): StatCardDef[] => [
  {
    label: "Quarters",
    value: stats.quarters.total,
    trend: stats.quarters.trend,
    icon: Building2,
    badgeColor: "bg-emerald-500",
    sparklineColor: "#10b981",
  },
  {
    label: "Applicants",
    value: stats.applicants.total,
    trend: stats.applicants.trend,
    icon: Users,
    badgeColor: "bg-blue-500",
    sparklineColor: "#3b82f6",
  },
  {
    label: "Allotments",
    value: stats.allotments.total,
    trend: stats.allotments.trend,
    icon: ClipboardCheck,
    badgeColor: "bg-purple-500",
    sparklineColor: "#a855f7",
  },
  {
    label: "Complaints",
    value: stats.complaints.total,
    trend: stats.complaints.trend,
    icon: MessageSquareWarning,
    badgeColor: "bg-orange-500",
    sparklineColor: "#f97316",
  },
  {
    label: "Vacations",
    value: stats.vacations.total,
    trend: stats.vacations.trend,
    icon: DoorOpen,
    badgeColor: "bg-indigo-500",
    sparklineColor: "#6366f1",
  },
  {
    label: "Maintenance",
    value: stats.maintenance.total,
    trend: stats.maintenance.trend,
    icon: Wrench,
    badgeColor: "bg-accent",
    sparklineColor: "#14b8a6",
  },
];

const CHART_COLORS = {
  emerald: "#059669",
  slate: "#64748b",
  amber: "#d97706",
  blue: "#2563eb",
  rose: "#e11d48",
  violet: "#7c3aed",
};

type Segment = { label: string; value: number; color: string };

function OverviewCard({
  title,
  icon: Icon,
  total,
  segments,
}: {
  title: string;
  icon: typeof Building2;
  total: number;
  segments: Segment[];
}) {
  return (
    <div className="rounded-card border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-md bg-slate-100 p-1.5 text-slate-600">
          <Icon size={16} />
        </div>
        <p className="text-sm font-semibold text-slate-700">{title}</p>
      </div>
      <div className="flex justify-center">
        <DonutChart total={total} segments={segments} size={100} strokeWidth={13} />
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {segments.map((segment) => (
          <li key={segment.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
              {segment.label}
            </span>
            <span className="font-semibold text-slate-900">{segment.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const QUICK_ACTIONS = [
  {
    href: "/applicants",
    label: "Add Applicant",
    icon: UserPlus,
    badgeColor: "bg-blue-500",
    tint: "bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
  {
    href: "/allotments",
    label: "New Allotment",
    icon: ClipboardCheck,
    badgeColor: "bg-purple-500",
    tint: "bg-purple-50 text-purple-700 hover:bg-purple-100",
  },
  {
    href: "/complaints",
    label: "File Complaint",
    icon: MessageSquarePlus,
    badgeColor: "bg-orange-500",
    tint: "bg-orange-50 text-orange-700 hover:bg-orange-100",
  },
  {
    href: "/vacations",
    label: "Request Vacation",
    icon: DoorOpen,
    badgeColor: "bg-indigo-500",
    tint: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
  },
  {
    href: "/quarters?tab=MAINTENANCE",
    label: "New Maintenance",
    icon: Wrench,
    badgeColor: "bg-accent",
    tint: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
];

function greeting(hour: number) {
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function HomePage({ username, stats }: { username: string; stats: DashboardStats }) {
  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeLabel = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true });

  return (
    <div className="min-h-screen bg-white">
      <TopNav />
      <main className="w-full ">
        {/* Hero header + stat cards row: the cards float up over the hero's bottom edge, so
            this wrapper must stay overflow-visible (never overflow-hidden) or the overlap
            would get clipped by the hero's own rounded corners. */}
        <div className="relative mb-8">
          <div className="relative h-[23rem] overflow-hidden sm:h-[27rem]">
            <Image src="/images/main-office.png" alt="Station Headquarters" fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 to-black/10" />

            {/* Text stays anchored to the upper portion, above where the cards will overlap.
                pt bumped down slightly (was pt-8/pt-10) for better balance against the image. */}
            <div className="absolute inset-0 flex flex-col justify-start gap-3 px-6 pt-12 sm:px-10 sm:pt-14">
              <div>
                <p className="text-xl font-medium text-white [text-shadow:_0_2px_8px_rgb(0_0_0_/_45%)] sm:text-2xl">
                  {greeting(now.getHours())},
                </p>
                <p className="text-[3rem] font-bold leading-tight text-accent [text-shadow:_0_2px_10px_rgb(0_0_0_/_45%)]">
                  {capitalizeWords(username)}
                </p>
              </div>
              <p className="max-w-md text-base text-slate-100 [text-shadow:_0_1px_6px_rgb(0_0_0_/_45%)]">
                Here&apos;s what&apos;s happening across the system today.
              </p>
              <span className="flex w-fit items-center gap-2 rounded-full bg-black/30 px-4 py-2 text-base text-white backdrop-blur-sm">
                <Calendar size={16} />
                {dateLabel}
                <span className="mx-1 h-1 w-1 rounded-full bg-white/50" />
                <Clock size={16} />
                {timeLabel}
              </span>
            </div>
          </div>

          {/* Stat cards row: no overlap on mobile (stacked 2-up, too tall to float safely over
              the hero text), overlaps the hero's bottom edge from sm and up via z-10 + negative margin */}
          <div className="relative z-10 mt-4 grid grid-cols-2 gap-4 sm:-mt-16 sm:grid-cols-3 lg:-mt-20 lg:grid-cols-6">
            {STAT_CARDS(stats).map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          {/* Soft white cloud transition, fading the hero photo into the white Overview
              section below instead of a hard edge. Sits below the stat cards (z-0 vs
              their z-10) and bleeds slightly past the wrapper into the gap before Overview. */}
          <div className="pointer-events-none absolute inset-x-0 -bottom-6 z-0 h-24 sm:-bottom-8 sm:h-28">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/70 to-transparent blur-xl" />
            <div className="absolute bottom-0 left-[6%] h-16 w-52 rounded-full bg-white blur-2xl sm:h-20 sm:w-64" />
            <div className="absolute bottom-1 left-[30%] h-14 w-60 rounded-full bg-white blur-2xl sm:h-16 sm:w-72" />
            <div className="absolute bottom-0 left-[55%] h-16 w-52 rounded-full bg-white blur-2xl sm:h-20 sm:w-64" />
            <div className="absolute bottom-1 left-[78%] h-14 w-56 rounded-full bg-white blur-2xl sm:h-16 sm:w-64" />
          </div>
        </div>

        {/* Overview + Quick Actions */}
        <div className="mx-3 mb-8 grid gap-4 sm:mx-4 lg:mx-6 lg:grid-cols-[7fr_2fr]">
        <div className="rounded-card border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-accent" />
            <h2 className="text-base font-semibold text-slate-900">Overview</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <OverviewCard
                title="Quarters"
                icon={Building2}
                total={stats.quarters.total}
                segments={[
                  { label: "Vacant", value: stats.quarters.vacant, color: CHART_COLORS.emerald },
                  { label: "Occupied", value: stats.quarters.occupied, color: CHART_COLORS.slate },
                  { label: "Reserved", value: stats.quarters.reserved, color: CHART_COLORS.amber },
                  { label: "Under Maintenance", value: stats.quarters.underMaintenance, color: CHART_COLORS.blue },
                  { label: "Unfit", value: stats.quarters.unfit, color: CHART_COLORS.rose },
                ]}
              />
              <OverviewCard
                title="Applicants"
                icon={Users}
                total={stats.applicants.total}
                segments={[
                  { label: "Waiting", value: stats.applicants.waiting, color: CHART_COLORS.amber },
                  { label: "Allotted", value: stats.applicants.allotted, color: CHART_COLORS.emerald },
                ]}
              />
              <OverviewCard
                title="Allotments"
                icon={ClipboardCheck}
                total={stats.allotments.total}
                segments={[
                  { label: "Pending", value: stats.allotments.pending, color: CHART_COLORS.amber },
                  { label: "Approved", value: stats.allotments.approved, color: CHART_COLORS.emerald },
                  { label: "Rejected", value: stats.allotments.rejected, color: CHART_COLORS.rose },
                  { label: "Unallocated", value: stats.allotments.unallocated, color: CHART_COLORS.slate },
                ]}
              />
              <OverviewCard
                title="Complaints"
                icon={MessageSquareWarning}
                total={stats.complaints.total}
                segments={[
                  { label: "Open", value: stats.complaints.open, color: CHART_COLORS.amber },
                  { label: "In Progress", value: stats.complaints.inProgress, color: CHART_COLORS.blue },
                  { label: "Waiting", value: stats.complaints.waiting, color: CHART_COLORS.violet },
                  { label: "Blocked", value: stats.complaints.blocked, color: CHART_COLORS.rose },
                  { label: "Closed", value: stats.complaints.closed, color: CHART_COLORS.emerald },
                ]}
              />
              <OverviewCard
                title="Vacations"
                icon={DoorOpen}
                total={stats.vacations.total}
                segments={[
                  { label: "Pending Insp.", value: stats.vacations.pendingInspection, color: CHART_COLORS.amber },
                  { label: "Cleared", value: stats.vacations.cleared, color: CHART_COLORS.emerald },
                  { label: "Defects Found", value: stats.vacations.defects, color: CHART_COLORS.rose },
                ]}
              />
              <OverviewCard
                title="Maintenance"
                icon={Wrench}
                total={stats.maintenance.total}
                segments={[
                  { label: "In Progress", value: stats.maintenance.inProgress, color: CHART_COLORS.amber },
                  { label: "Completed", value: stats.maintenance.completed, color: CHART_COLORS.emerald },
                ]}
              />
          </div>
        </div>

        <div className="rounded-card border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Quick Actions</h2>
          <div className="flex flex-col gap-2">
            {QUICK_ACTIONS.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-sm ${action.tint}`}
              >
                <span className="flex items-center gap-2.5">
                  <span className={`inline-flex shrink-0 rounded-md p-1.5 text-white ${action.badgeColor}`}>
                    <action.icon size={14} />
                  </span>
                  {action.label}
                </span>
                <ChevronRight size={16} />
              </Link>
            ))}
          </div>
        </div>
        </div>

        {/* Bottom status bar */}
        <div className="relative overflow-hidden">
          <Image src="/images/forest.png" alt="" fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-[rgba(6,20,17,0.85)]" />
          <div className="relative flex flex-wrap items-center justify-center gap-14 px-6 py-2.5 text-sm">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={26} className="text-accent" />
              <div>
                <p className="font-medium text-white">System Status</p>
                <p className="text-xs text-slate-300">All systems operational</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Users size={26} className="text-accent" />
              <div>
                <p className="font-medium text-white">
                  Active Users <span className="ml-1 font-semibold">{stats.totalUsers}</span>
                </p>
                <p className="text-xs text-slate-300">Registered users</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <FileText size={26} className="text-accent" />
              <div>
                <p className="font-medium text-white">
                  Audit Logs Today <span className="ml-1 font-semibold">{stats.auditLogsToday}</span>
                </p>
                <Link href="/audit" className="text-xs text-accent hover:underline">
                  View logs
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Clock size={26} className="text-accent" />
              <div>
                <p className="font-medium text-white">Last Updated</p>
                <p className="text-xs text-slate-300">
                  {stats.lastUpdated ? formatDateTime(stats.lastUpdated) : "No activity yet"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
