"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { Button } from "@/client/components/Button";
import { FormField } from "@/client/components/FormField";
import { PasswordInput } from "@/client/components/PasswordInput";

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    router.push("/home");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-navy-900">
          <Shield size={32} />
          <h1 className="text-xl font-semibold">Sign in</h1>
          <p className="text-center text-sm text-slate-500">MIL-HOME Station Housing</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <PasswordInput label="Password" name="password" value={password} onChange={setPassword} />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            Log in
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-navy-700 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
