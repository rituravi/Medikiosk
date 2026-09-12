"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import {
  adminFetchUsers,
  adminResetPassword,
  adminToggleActive,
  type AdminPatient,
} from "@/lib/api";

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetTargetId, setResetTargetId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function loadUsers() {
    setLoading(true);
    adminFetchUsers()
      .then(setUsers)
      .catch(() => {
        setError("You don't have access to this page.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(loadUsers, []);

  function openReset(userId: number) {
    setResetTargetId(userId);
    setNewPassword("");
    setResetError(null);
  }

  function closeReset() {
    setResetTargetId(null);
    setNewPassword("");
    setResetError(null);
  }

  async function submitReset(userId: number) {
    setResetError(null);
    setResetSubmitting(true);
    try {
      await adminResetPassword(userId, newPassword);
      setSuccessMessage("Password reset successfully.");
      closeReset();
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setResetSubmitting(false);
    }
  }

  async function handleToggleActive(user: AdminPatient) {
    try {
      const res = await adminToggleActive(user.id);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: res.is_active } : u)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update account status.");
    }
  }

  if (loading) {
    return <p className="p-8 text-sm text-[var(--muted)]">Loading...</p>;
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p>{error}</p>
        <button onClick={() => router.push("/login")} className="btn-primary">
          Go to login
        </button>
      </div>
    );
  }

  return (
    <AdminShell>
      <div className="flex flex-col gap-6 px-8 py-8">
        <header>
          <p className="text-sm text-[var(--muted)]">System Administration</p>
          <h1 className="text-2xl font-semibold">Manage Patients</h1>
        </header>

        {successMessage && (
          <div className="card p-4 text-sm" style={{ color: "var(--primary)" }}>
            {successMessage}
          </div>
        )}

        <section className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">
                    Username
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">
                    Full Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">
                    Phone
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--muted)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <Fragment key={user.id}>
                    <tr
                      className="border-b"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td className="px-4 py-3">{user.username}</td>
                      <td className="px-4 py-3">{user.full_name}</td>
                      <td className="px-4 py-3">{user.phone_number || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className="badge"
                          style={{
                            background: user.is_active ? "var(--background)" : "#fee2e2",
                            color: user.is_active ? "var(--primary)" : "#b91c1c",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {user.is_active ? "Active" : "Deactivated"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openReset(user.id)}
                            className="btn-secondary text-xs"
                          >
                            Reset Password
                          </button>
                          <button
                            onClick={() => handleToggleActive(user)}
                            className="btn-secondary text-xs"
                          >
                            {user.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {resetTargetId === user.id && (
                      <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                        <td colSpan={5} className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-3">
                            <input
                              type="password"
                              className="input"
                              placeholder="New password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <button
                              onClick={() => submitReset(user.id)}
                              disabled={resetSubmitting || !newPassword}
                              className="btn-primary text-xs"
                            >
                              {resetSubmitting ? "Saving..." : "Save"}
                            </button>
                            <button onClick={closeReset} className="text-xs underline">
                              Cancel
                            </button>
                            {resetError && (
                              <p className="text-sm text-[var(--danger)]">{resetError}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-[var(--muted)]">
                      No patients registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
