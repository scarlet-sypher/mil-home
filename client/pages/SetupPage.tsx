"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { AdminCredentialsForm } from "@/client/components/AdminCredentialsForm";

export function SetupPage({ email, username }: { email: string; username: string }) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-dark px-4">
      <div className="w-full max-w-sm space-y-4 rounded-card bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center gap-2 text-center">
          <ShieldAlert size={32} className="text-accent-dark" />
          <h1 className="text-xl font-semibold text-slate-900">Complete Admin Setup</h1>
          <p className="text-sm text-slate-500">
            For security, set a new password before continuing. You can keep this email or change it.
          </p>
        </div>
        <AdminCredentialsForm
          mode="setup"
          initialEmail={email}
          initialUsername={username}
          onSuccess={() => router.push("/home")}
        />
      </div>
    </div>
  );
}
