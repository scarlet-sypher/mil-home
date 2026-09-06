"use client";

import { useState } from "react";
import { FormField } from "@/client/components/FormField";
import { PasswordInput } from "@/client/components/PasswordInput";
import { readErrorMessage } from "@/client/lib/safe-json";

const PASSWORD_RULES = [
  { label: "At least 10 characters", test: (v: string) => v.length >= 10 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
  { label: "One symbol", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

type Mode = "setup" | "change";

export function AdminCredentialsForm({
  mode,
  initialEmail,
  initialUsername,
  onSuccess,
}: {
  mode: Mode;
  initialEmail: string;
  initialUsername: string;
  onSuccess: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(initialEmail);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const endpoint = mode === "setup" ? "/api/auth/setup" : "/api/auth/change-credentials";
    const payload =
      mode === "setup"
        ? { username, email, newPassword, confirmNewPassword }
        : { currentPassword, username, email, newPassword, confirmNewPassword };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setError(await readErrorMessage(response));
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === "change" && (
        <PasswordInput label="Current password" name="currentPassword" value={currentPassword} onChange={setCurrentPassword} />
      )}
      <FormField
        label="Username"
        name="username"
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        autoComplete="username"
      />
      <FormField
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <PasswordInput label="New password" name="newPassword" value={newPassword} onChange={setNewPassword} />
      <ul className="space-y-1 text-xs text-slate-500">
        {PASSWORD_RULES.map((rule) => (
          <li key={rule.label} className={rule.test(newPassword) ? "text-emerald-600" : ""}>
            {rule.test(newPassword) ? "✓" : "•"} {rule.label}
          </li>
        ))}
      </ul>
      <PasswordInput
        label="Confirm new password"
        name="confirmNewPassword"
        value={confirmNewPassword}
        onChange={setConfirmNewPassword}
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {mode === "setup" ? "Complete Setup" : "Save Changes"}
      </button>
    </form>
  );
}
