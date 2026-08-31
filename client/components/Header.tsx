"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, LogOut } from "lucide-react";

const NAV_LINKS = [
  { href: "/home", label: "Dashboard" },
  { href: "/quarters", label: "Quarters" },
  { href: "/applicants", label: "Applicants" },
  { href: "/allotments", label: "Allotments" },
  { href: "/complaints", label: "Complaints" },
  { href: "/vacations", label: "Vacations" },
  { href: "/audit", label: "Audit Log" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="bg-navy-900 text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 font-semibold tracking-wide">
          <Shield size={22} />
          MIL-HOME
        </div>
        <nav className="hidden gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-1.5 text-sm ${
                pathname.startsWith(link.href) ? "bg-navy-700 text-white" : "text-navy-100 hover:bg-navy-800"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-navy-100 hover:bg-navy-800"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  );
}
