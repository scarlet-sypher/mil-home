"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Building2,
  Users,
  ClipboardCheck,
  MessageSquareWarning,
  DoorOpen,
  Wrench,
  FileText,
  LogOut,
  UserCircle,
} from "lucide-react";
import { capitalizeWords } from "@/client/lib/format-text";

const NAV_LINKS = [
  { href: "/home", label: "Dashboard", icon: LayoutDashboard },
  { href: "/quarters", label: "Quarters", icon: Building2 },
  { href: "/applicants", label: "Applicants", icon: Users },
  { href: "/allotments", label: "Allotments", icon: ClipboardCheck },
  { href: "/complaints", label: "Complaints", icon: MessageSquareWarning },
  { href: "/vacations", label: "Vacations", icon: DoorOpen },
  { href: "/quarters?tab=MAINTENANCE", label: "Maintenance", icon: Wrench },
  { href: "/audit", label: "Audit Log", icon: FileText },
];

function isLinkActive(pathname: string, tabParam: string | null, href: string) {
  const [path, query] = href.split("?");
  if (!pathname.startsWith(path)) return false;
  if (path !== "/quarters") return true;
  const wantsMaintenance = query === "tab=MAINTENANCE";
  return wantsMaintenance === (tabParam === "MAINTENANCE");
}

export function TopNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        setEmail(data.user?.email ?? "");
        setUsername(data.user?.username ?? "");
      })
      .catch(() => {
        setEmail("");
        setUsername("");
      });
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-20 grid grid-cols-[auto_1fr_auto] items-center gap-4 bg-base-dark px-4 py-2 text-white sm:px-6">
      <Link href="/account" className="flex shrink-0 items-center gap-2 justify-self-start">
        <Shield size={20} className="text-accent" />
        <span className="font-bold tracking-wide">MIL-HOME</span>
      </Link>

      <nav className="flex items-center justify-center gap-1 overflow-x-auto">
        {NAV_LINKS.map((link) => {
          const active = isLinkActive(pathname, searchParams.get("tab"), link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors duration-150 ${
                active ? "bg-accent font-medium text-base-dark" : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <Icon size={14} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div ref={profileRef} className="relative shrink-0 justify-self-end">
        <button
          onClick={() => setProfileOpen((open) => !open)}
          aria-label="Profile menu"
          className="flex items-center justify-center rounded-full p-1 text-slate-300 transition-colors duration-150 hover:bg-white/10 hover:text-white"
        >
          <UserCircle size={26} />
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-md border border-white/10 bg-base-dark py-2 text-white shadow-lg">
            <div className="border-b border-white/10 px-4 pb-2">
              <p className="truncate text-sm font-medium">{username ? capitalizeWords(username) : "—"}</p>
              <p className="truncate text-xs text-slate-300">{email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-1.5 px-4 py-2 text-sm text-slate-300 transition-colors duration-150 hover:bg-white/10 hover:text-white"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
