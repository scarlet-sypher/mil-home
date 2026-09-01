"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { Button } from "@/client/components/Button";
import { FormField } from "@/client/components/FormField";
import { PasswordInput } from "@/client/components/PasswordInput";

const PASSWORD_RULES = [
  { label: "At least 10 characters", test: (v: string) => v.length >= 10 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
  { label: "One symbol", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

export function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, confirmPassword }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    setNotice("Account created. Please log in.");
    setSubmitting(false);
    setTimeout(() => router.push("/login"), 1200);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-navy-900">
          <Shield size={32} />
          <h1 className="text-xl font-semibold">Create an account</h1>
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
          <ul className="space-y-1 text-xs text-slate-500">
            {PASSWORD_RULES.map((rule) => (
              <li key={rule.label} className={rule.test(password) ? "text-emerald-600" : ""}>
                {rule.test(password) ? "✓" : "•"} {rule.label}
              </li>
            ))}
          </ul>
          <PasswordInput label="Confirm password" name="confirmPassword" value={confirmPassword} onChange={setConfirmPassword} />
          {error && <p className="text-sm text-red-700">{error}</p>}
          {notice && <p className="text-sm text-emerald-700">{notice}</p>}
          <Button type="submit" disabled={submitting} className="w-full">
            Sign up
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-navy-700 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
