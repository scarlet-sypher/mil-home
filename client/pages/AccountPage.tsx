"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserCircle, LogOut, ArrowLeft } from "lucide-react";
import { capitalizeWords } from "@/client/lib/format-text";

export function AccountPage({ username, email }: { username: string; email: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-dark px-4">
      <div className="w-full max-w-sm space-y-6 rounded-card border border-white/10 bg-sidebar-base p-8 text-white">
        <div className="flex flex-col items-center gap-3">
          <UserCircle size={64} className="text-accent" />
          <div className="text-center">
            <p className="text-lg font-semibold">{capitalizeWords(username)}</p>
            <p className="text-sm text-slate-300">{email}</p>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-red-600/90 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-red-600"
          >
            <LogOut size={16} />
            Logout
          </button>
          <Link
            href="/home"
            className="flex w-full items-center justify-center gap-1.5 rounded-md border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-colors duration-150 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
