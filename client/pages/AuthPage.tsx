"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FormField } from "@/client/components/FormField";
import { PasswordInput } from "@/client/components/PasswordInput";

type Tab = "login" | "signup";

const LABEL_CLASS = "text-slate-200";
// Inputs stay white-background regardless of theme, so their text must be forced
// dark here — otherwise it inherits this page's ambient text-white and becomes
// invisible against the white input field.
const INPUT_CLASS = "text-slate-900";
const SUBMIT_BUTTON_CLASS =
  "w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-base-dark transition-all duration-150 hover:-translate-y-0.5 hover:bg-accent-light hover:shadow-md active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0";

function LoginForm() {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        labelClassName={LABEL_CLASS}
        className={INPUT_CLASS}
      />
      <PasswordInput
        label="Password"
        name="password"
        value={password}
        onChange={setPassword}
        labelClassName={LABEL_CLASS}
        className={INPUT_CLASS}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button type="submit" disabled={submitting} className={SUBMIT_BUTTON_CLASS}>
        Log in
      </button>
    </form>
  );
}

const PASSWORD_RULES = [
  { label: "At least 10 characters", test: (v: string) => v.length >= 10 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
  { label: "One symbol", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
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
      body: JSON.stringify({ email, username, password, confirmPassword }),
    });

    if (!response.ok) {
      const data = await response.json();
      setError(data.error ?? "Something went wrong.");
      setSubmitting(false);
      return;
    }

    setNotice("Account created. Please log in.");
    setSubmitting(false);
    setTimeout(onSuccess, 1200);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
        labelClassName={LABEL_CLASS}
        className={INPUT_CLASS}
      />
      <FormField
        label="Username"
        name="username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        autoComplete="username"
        labelClassName={LABEL_CLASS}
        className={INPUT_CLASS}
      />
      <PasswordInput
        label="Password"
        name="password"
        value={password}
        onChange={setPassword}
        labelClassName={LABEL_CLASS}
        className={INPUT_CLASS}
      />
      <ul className="space-y-1 text-xs text-slate-400">
        {PASSWORD_RULES.map((rule) => (
          <li key={rule.label} className={rule.test(password) ? "text-accent-light" : ""}>
            {rule.test(password) ? "✓" : "•"} {rule.label}
          </li>
        ))}
      </ul>
      <PasswordInput
        label="Confirm password"
        name="confirmPassword"
        value={confirmPassword}
        onChange={setConfirmPassword}
        labelClassName={LABEL_CLASS}
        className={INPUT_CLASS}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      {notice && <p className="text-sm text-accent-light">{notice}</p>}
      <button type="submit" disabled={submitting} className={SUBMIT_BUTTON_CLASS}>
        Sign up
      </button>
    </form>
  );
}

export function AuthPage({ defaultTab = "login" }: { defaultTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(defaultTab);

  return (
    <div className="flex min-h-screen flex-col bg-base-dark text-white">
      {/* Top: two crest logos flanking the app heading */}
      <div className="flex items-center justify-between px-6 pt-8 sm:px-12">
        <Image src="/images/logo-left.png" alt="" width={160} height={160} className="h-32 w-32 shrink-0 sm:h-40 sm:w-40" />
        <div className="flex-1 px-2 text-center">
          <div className="my-2 sm:my-4">
            <p className="text-5xl font-extrabold uppercase leading-[1.05] tracking-tight text-accent sm:text-7xl">
              Station
            </p>
            <p className="text-5xl font-extrabold uppercase leading-[1.05] tracking-tight text-accent sm:text-7xl">
              Headquarters
            </p>
            <p className="text-5xl font-extrabold uppercase leading-[1.05] tracking-tight text-accent sm:text-7xl">
              Dimapur
            </p>
          </div>
          <p className="mt-6 text-2xl font-bold tracking-wide sm:mt-8 sm:text-3xl">
            MIL-HOME <span className="font-normal text-slate-300">: Station Housing</span>
          </p>
        </div>
        <Image src="/images/logo-right.png" alt="" width={160} height={160} className="h-32 w-32 shrink-0 sm:h-40 sm:w-40" />
      </div>

      {/* Center: glass panel with Login/Signup tabs */}
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm rounded-card border border-white/10 bg-[rgba(11,61,52,0.6)] p-8 shadow-lg backdrop-blur-md [-webkit-backdrop-filter:blur(12px)]">
          <div className="mb-6 flex rounded-md bg-black/20 p-1">
            <button
              onClick={() => setTab("login")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors duration-150 ${
                tab === "login" ? "bg-accent text-base-dark" : "text-slate-300 hover:text-white"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setTab("signup")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors duration-150 ${
                tab === "signup" ? "bg-accent text-base-dark" : "text-slate-300 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {tab === "login" ? <LoginForm /> : <SignupForm onSuccess={() => setTab("login")} />}
        </div>
      </div>

      {/* Bottom: thin tagline banner */}
      <div className="border-t border-white/10 bg-sidebar-base px-4 py-3 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent sm:text-sm">
          Serving Together, Securing Tomorrow
        </p>
      </div>
    </div>
  );
}
