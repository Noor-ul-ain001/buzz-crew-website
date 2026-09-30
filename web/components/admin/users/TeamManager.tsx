"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import FormField, { ariaFor, inputClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/auth/errors";
import type { Role, TeamUser } from "@/lib/auth/types";
import { formatDateTime } from "@/lib/format";

const inviteSchema = z.object({
  email: z.email("Enter their email address.").max(254),
  name: z.string().trim().min(1, "Enter their name.").max(100),
  role: z.enum(["admin", "editor"]),
});
type InviteValues = z.infer<typeof inviteSchema>;

const STATUS_STYLES = {
  invited: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  active: "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  deactivated: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
} as const;

const buttonClass = "rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface disabled:opacity-50";

export default function TeamManager({ users, currentUserId }: { users: TeamUser[]; currentUserId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteValues>({ resolver: zodResolver(inviteSchema), defaultValues: { role: "editor" } });

  const invite = handleSubmit(async (values) => {
    const { data, error } = await api.POST("/api/v1/invitations", { body: values });
    if (!data) {
      toast(errorMessage(error), "error");
      return;
    }
    toast(`Invitation sent to ${data.email}. The link works for 72 hours.`);
    reset({ email: "", name: "", role: "editor" });
    router.refresh();
  });

  async function run(userId: string, action: () => Promise<{ error?: unknown; response: Response }>, done: string) {
    setBusyId(userId);
    const { error, response } = await action();
    setBusyId(null);
    setConfirmingId(null);
    if (!response.ok) {
      toast(errorMessage(error), "error");
      return;
    }
    toast(done);
    router.refresh();
  }

  const path = (userId: string) => ({ params: { path: { user_id: userId } } });

  const changeRole = (user: TeamUser, role: Role) =>
    run(user.id, () => api.PATCH("/api/v1/users/{user_id}", { ...path(user.id), body: { role } }), `${user.name} is now ${role === "admin" ? "an admin" : "an editor"}.`);

  const setStatus = (user: TeamUser, status: "active" | "deactivated") =>
    run(
      user.id,
      () => api.PATCH("/api/v1/users/{user_id}", { ...path(user.id), body: { status } }),
      status === "deactivated" ? `${user.name} was deactivated and signed out everywhere.` : `${user.name} can sign in again.`,
    );

  const resend = (user: TeamUser) =>
    run(user.id, () => api.POST("/api/v1/users/{user_id}/invitation", path(user.id)), `A new link was sent to ${user.email}.`);

  const cancel = (user: TeamUser) =>
    run(user.id, () => api.DELETE("/api/v1/users/{user_id}/invitation", path(user.id)), `Invitation for ${user.email} cancelled.`);

  return (
    <div className="mt-8 flex flex-col gap-10">
      <section aria-labelledby="invite-heading" className="rounded-2xl border border-border p-5 sm:p-6">
        <h2 id="invite-heading" className="text-lg font-bold">
          Invite a team member
        </h2>
        <form onSubmit={invite} noValidate className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_10rem_auto] sm:items-end">
          <FormField id="invite-name" label="Name" required error={errors.name}>
            <input id="invite-name" className={inputClass} {...ariaFor("invite-name", errors.name)} {...register("name")} />
          </FormField>
          <FormField id="invite-email" label="Email" required error={errors.email}>
            <input
              id="invite-email"
              type="email"
              className={inputClass}
              {...ariaFor("invite-email", errors.email)}
              {...register("email")}
            />
          </FormField>
          <FormField id="invite-role" label="Role" required error={errors.role}>
            <select id="invite-role" className={inputClass} {...register("role")}>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </FormField>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background disabled:opacity-60"
          >
            {isSubmitting ? "Sending…" : "Send invite"}
          </button>
        </form>
      </section>

      <section aria-labelledby="team-heading">
        <h2 id="team-heading" className="sr-only">
          Team members
        </h2>
        <ul className="flex flex-col gap-3">
          {users.map((user) => {
            const busy = busyId === user.id;
            const isMe = user.id === currentUserId;
            return (
              <li key={user.id} className="flex flex-col gap-3 rounded-2xl border border-border p-4 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {user.name} {isMe && <span className="text-sm font-normal text-muted">(you)</span>}
                  </p>
                  <p className="truncate text-sm text-muted">{user.email}</p>
                  <p className="mt-1 text-xs text-muted">
                    {user.status === "invited" && user.invitation_expires_at
                      ? `Invite expires ${formatDateTime(user.invitation_expires_at)}`
                      : user.last_login_at
                        ? `Last signed in ${formatDateTime(user.last_login_at)}`
                        : "Never signed in"}
                  </p>
                </div>
                <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[user.status]}`}>
                  {user.status}
                </span>
                <label className="flex items-center gap-2 text-sm">
                  <span className="sr-only">Role for {user.name}</span>
                  <select
                    value={user.role}
                    disabled={busy || user.status === "deactivated"}
                    onChange={(event) => changeRole(user, event.target.value as Role)}
                    className={`${inputClass} w-auto py-1.5`}
                  >
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </label>
                <div className="flex flex-wrap gap-2">
                  {user.status === "invited" && (
                    <>
                      <button type="button" disabled={busy} onClick={() => resend(user)} className={buttonClass}>
                        Resend invite
                      </button>
                      <button type="button" disabled={busy} onClick={() => cancel(user)} className={buttonClass}>
                        Cancel invite
                      </button>
                    </>
                  )}
                  {user.status === "active" &&
                    !isMe &&
                    (confirmingId === user.id ? (
                      <>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setStatus(user, "deactivated")}
                          className="rounded-full bg-danger px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        >
                          Confirm deactivate
                        </button>
                        <button type="button" onClick={() => setConfirmingId(null)} className={buttonClass}>
                          Keep
                        </button>
                      </>
                    ) : (
                      <button type="button" disabled={busy} onClick={() => setConfirmingId(user.id)} className={buttonClass}>
                        Deactivate
                      </button>
                    ))}
                  {user.status === "deactivated" && (
                    <button type="button" disabled={busy} onClick={() => setStatus(user, "active")} className={buttonClass}>
                      Reactivate
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
