import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useChangePassword, useSkillDemand, useUpdateProfile } from "@/hooks/queries";
import { PageHeader } from "@/components/layout/AppShell";
import { SkillInput } from "@/components/jobs/SkillInput";
import { PasswordMeter } from "@/pages/auth/AuthPage";
import { Button } from "@/components/ui/Button";
import { PasswordField, TextField } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Controls";
import { formatDate, initials } from "@/lib/format";
import type { User } from "@/lib/types";

type Tab = "details" | "skills" | "security";

function useUnsavedWarning(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);
}

function DetailsForm({ user }: { user: User }) {
  const toast = useToast();
  const save = useUpdateProfile();
  const initial = useMemo(
    () => ({ name: user.name, preferredRole: user.preferredRole, education: user.education, experience: String(user.experience ?? 0) }),
    [user]
  );
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => setV(initial), [initial]);
  const dirty = JSON.stringify(v) !== JSON.stringify(initial);
  useUnsavedWarning(dirty);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!v.name.trim()) er.name = "Enter your name.";
    const years = Number(v.experience);
    if (v.experience === "" || !Number.isFinite(years) || years < 0 || years > 60) er.experience = "Enter a number of years between 0 and 60.";
    setErrors(er);
    if (Object.keys(er).length) return;
    save.mutate(
      { name: v.name.trim(), preferredRole: v.preferredRole.trim(), education: v.education.trim(), experience: years },
      {
        onSuccess: () => toast({ title: "Profile saved" }),
        onError: err => toast({ tone: "error", title: "Couldn't save profile", description: (err as Error).message })
      }
    );
  };

  return (
    <form onSubmit={submit} noValidate className="card space-y-5 p-5 sm:p-7">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Full name" value={v.name} onChange={e => setV({ ...v, name: e.target.value })} error={errors.name} autoComplete="name" maxLength={80} />
        <TextField label="Email" value={user.email} disabled hint="Email can't be changed." />
        <TextField label="Role you're aiming for" value={v.preferredRole} onChange={e => setV({ ...v, preferredRole: e.target.value })} placeholder="e.g. Full-stack developer" maxLength={80} />
        <TextField
          label="Years of experience"
          type="number"
          inputMode="decimal"
          min={0}
          max={60}
          step={0.5}
          value={v.experience}
          onChange={e => setV({ ...v, experience: e.target.value })}
          error={errors.experience}
        />
      </div>
      <TextField label="Education" value={v.education} onChange={e => setV({ ...v, education: e.target.value })} placeholder="e.g. B.Tech, Computer Science" maxLength={120} />
      <div className="flex flex-col-reverse items-stretch gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-end">
        {dirty && <span className="text-sm text-muted">You have unsaved changes</span>}
        <Button variant="secondary" onClick={() => setV(initial)} disabled={!dirty || save.isPending}>
          Discard
        </Button>
        <Button type="submit" loading={save.isPending} disabled={!dirty}>
          Save profile
        </Button>
      </div>
    </form>
  );
}

function SkillsForm({ user }: { user: User }) {
  const toast = useToast();
  const save = useUpdateProfile();
  const demand = useSkillDemand();
  const [skills, setSkills] = useState(user.skills);
  useEffect(() => setSkills(user.skills), [user.skills]);
  const dirty = JSON.stringify(skills) !== JSON.stringify(user.skills);
  useUnsavedWarning(dirty);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(
      { skills },
      {
        onSuccess: d => toast({ title: "Skills saved", description: `${d.user.skills.length} skills on your profile. Match scores updated.` }),
        onError: err => toast({ tone: "error", title: "Couldn't save skills", description: (err as Error).message })
      }
    );
  };

  return (
    <form onSubmit={submit} className="card space-y-5 p-5 sm:p-7">
      <div className="flex gap-3 rounded-xl bg-signal-soft p-4 text-sm">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-signal" aria-hidden />
        <p>Your skills are compared against every listing to compute match scores and your skill gap. Use the names employers use for the best results.</p>
      </div>
      <SkillInput label="Your skills" value={skills} onChange={setSkills} suggestions={(demand.data ?? []).map(s => s.skill)} hint="Press Enter or comma to add. Backspace removes the last one." />
      <div className="flex flex-col-reverse items-stretch gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-end">
        {dirty && <span className="text-sm text-muted">You have unsaved changes</span>}
        <Button variant="secondary" onClick={() => setSkills(user.skills)} disabled={!dirty || save.isPending}>
          Discard
        </Button>
        <Button type="submit" loading={save.isPending} disabled={!dirty}>
          Save skills
        </Button>
      </div>
    </form>
  );
}

function SecurityForm() {
  const toast = useToast();
  const change = useChangePassword();
  const [v, setV] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (!v.current) er.current = "Enter your current password.";
    if (v.next.length < 6) er.next = "Use at least 6 characters.";
    else if (v.next === v.current) er.next = "Choose a password different from your current one.";
    if (v.confirm !== v.next) er.confirm = "Passwords don't match.";
    setErrors(er);
    if (Object.keys(er).length) return;
    change.mutate(
      { currentPassword: v.current, newPassword: v.next },
      {
        onSuccess: () => {
          toast({ title: "Password changed", description: "Use your new password next time you log in." });
          setV({ current: "", next: "", confirm: "" });
        },
        onError: err => setErrors({ current: (err as Error).message })
      }
    );
  };

  return (
    <form onSubmit={submit} noValidate className="card max-w-xl space-y-5 p-5 sm:p-7">
      <div>
        <h2 className="text-lg font-bold">Change password</h2>
        <p className="mt-0.5 text-sm text-muted">You'll stay logged in on this device.</p>
      </div>
      <PasswordField label="Current password" autoComplete="current-password" value={v.current} onChange={e => setV({ ...v, current: e.target.value })} error={errors.current} />
      <div>
        <PasswordField label="New password" autoComplete="new-password" value={v.next} onChange={e => setV({ ...v, next: e.target.value })} error={errors.next} />
        <PasswordMeter password={v.next} />
      </div>
      <PasswordField label="Confirm new password" autoComplete="new-password" value={v.confirm} onChange={e => setV({ ...v, confirm: e.target.value })} error={errors.confirm} />
      <div className="flex justify-end border-t border-line pt-5">
        <Button type="submit" loading={change.isPending} icon={<KeyRound className="h-4 w-4" />}>
          Change password
        </Button>
      </div>
    </form>
  );
}

export default function Profile() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = (["details", "skills", "security"].includes(params.get("tab") || "") ? params.get("tab") : "details") as Tab;

  if (!user) return null;

  return (
    <>
      <PageHeader title="Profile" description="Your details and skills power match scores across CareerPulse." />
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="card h-fit p-6 text-center">
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-signal-bright font-display text-2xl font-extrabold text-night">{initials(user.name)}</span>
          <h2 className="mt-4 text-xl font-bold">{user.name}</h2>
          <p className="truncate text-sm text-muted">{user.email}</p>
          {user.isAdmin && (
            <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-iris-soft px-2.5 py-0.5 text-xs font-medium text-iris">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin: can manage all jobs
            </p>
          )}
          <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-5 text-left text-sm">
            <div>
              <dt className="text-muted">Skills</dt>
              <dd className="num font-display text-xl font-bold">{user.skills.length}</dd>
            </div>
            <div>
              <dt className="text-muted">Experience</dt>
              <dd className="num font-display text-xl font-bold">{user.experience ?? 0} yrs</dd>
            </div>
            {user.createdAt && (
              <div className="col-span-2">
                <dt className="text-muted">Member since</dt>
                <dd className="font-medium">{formatDate(user.createdAt)}</dd>
              </div>
            )}
          </dl>
        </aside>
        <div className="min-w-0 space-y-5">
          <Segmented
            label="Profile section"
            value={tab}
            onChange={t => setParams(t === "details" ? {} : { tab: t }, { replace: true })}
            options={[
              { value: "details", label: "Details" },
              { value: "skills", label: `Skills (${user.skills.length})` },
              { value: "security", label: "Password" }
            ]}
            className="w-fit"
          />
          {tab === "details" && <DetailsForm user={user} />}
          {tab === "skills" && <SkillsForm user={user} />}
          {tab === "security" && <SecurityForm />}
        </div>
      </div>
    </>
  );
}
