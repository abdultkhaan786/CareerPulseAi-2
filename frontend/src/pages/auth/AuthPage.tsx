import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useSkillDemand } from "@/hooks/queries";
import { Logo } from "@/components/layout/Logo";
import { PulseTrace } from "@/components/charts/PulseTrace";
import { Button } from "@/components/ui/Button";
import { PasswordField, TextField } from "@/components/ui/Field";
import { cx } from "@/lib/format";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0..4
}
const STRENGTH = ["Too short", "Weak", "Fair", "Good", "Strong"];

export function PasswordMeter({ password }: { password: string }) {
  const s = strength(password);
  if (!password) return null;
  return (
    <div className="mt-2 flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1" aria-hidden>
        {[0, 1, 2, 3].map(i => (
          <span
            key={i}
            className={cx("h-1.5 flex-1 rounded-full transition", i < s ? (s <= 1 ? "bg-danger" : s === 2 ? "bg-ember" : "bg-signal") : "bg-line")}
          />
        ))}
      </div>
      <span className="w-16 text-right text-xs text-muted">{STRENGTH[s]}</span>
    </div>
  );
}

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const { user, login, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const skills = useSkillDemand();

  const [values, setValues] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from || "/app"} replace />;

  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues(v => ({ ...v, [k]: e.target.value }));
    if (errors[k]) setErrors(er => ({ ...er, [k]: "" }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (isRegister && !values.name.trim()) e.name = "Enter your name.";
    if (!values.email.trim()) e.email = "Enter your email address.";
    else if (!EMAIL_RE.test(values.email.trim())) e.email = "Enter a valid email address, like name@example.com.";
    if (!values.password) e.password = "Enter your password.";
    else if (isRegister && values.password.length < 6) e.password = "Use at least 6 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setServerError("");
    if (!validate()) return;
    setBusy(true);
    try {
      if (isRegister) {
        const u = await register(values.name.trim(), values.email.trim(), values.password);
        toast({ title: `Welcome, ${u.name.split(" ")[0]}`, description: "Add your skills to see match scores." });
        navigate("/app/profile?tab=skills", { replace: true });
      } else {
        const u = await login(values.email.trim(), values.password);
        toast({ title: `Welcome back, ${u.name.split(" ")[0]}` });
        navigate(from || "/app", { replace: true });
      }
    } catch (err) {
      setServerError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-night p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{ background: "radial-gradient(700px 400px at 70% 75%, rgba(44,211,201,.12), transparent 70%)" }}
        />
        <Logo light className="relative" />
        <div className="relative">
          <h1 className="max-w-md font-display text-[44px] font-extrabold leading-[1.05] tracking-tight text-white">
            {isRegister ? "Find out how close you are to the jobs you want." : "The market moved while you were away."}
          </h1>
          <p className="mt-4 max-w-md text-night-ink">
            {isRegister
              ? "Your skills are compared against every open listing, so you know exactly what to learn next."
              : "Here's what employers are asking for most right now."}
          </p>
          <div className="mt-10">
            <PulseTrace skills={skills.data || []} tone="dark" maxBeats={6} height={200} />
          </div>
        </div>
        <p className="relative text-sm text-night-ink">Data comes straight from the listings posted on CareerPulse.</p>
      </section>

      <section className="flex flex-col px-5 py-8 sm:px-10">
        <div className="lg:hidden">
          <Logo />
        </div>
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
          <h2 className="text-[30px] font-extrabold">{isRegister ? "Create your account" : "Log in"}</h2>
          <p className="mt-1.5 text-muted">
            {isRegister ? (
              <>
                Already have an account?{" "}
                <Link to="/login" state={location.state} className="font-medium text-signal hover:underline">
                  Log in
                </Link>
              </>
            ) : (
              <>
                New to CareerPulse?{" "}
                <Link to="/register" state={location.state} className="font-medium text-signal hover:underline">
                  Create an account
                </Link>
              </>
            )}
          </p>

          <form onSubmit={submit} noValidate className="mt-8 space-y-5">
            {isRegister && (
              <TextField label="Full name" name="name" autoComplete="name" value={values.name} onChange={set("name")} error={errors.name} autoFocus />
            )}
            <TextField
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={values.email}
              onChange={set("email")}
              error={errors.email}
              autoFocus={!isRegister}
            />
            <div>
              <PasswordField
                label="Password"
                name="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                value={values.password}
                onChange={set("password")}
                error={errors.password}
                hint={isRegister ? "At least 6 characters." : undefined}
              />
              {isRegister && <PasswordMeter password={values.password} />}
            </div>

            {serverError && (
              <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
                {serverError}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full" loading={busy}>
              {isRegister ? "Create account" : "Log in"}
            </Button>
            {!isRegister && (
              <p className="text-center text-sm text-muted">
                Forgot your password? Reset by email isn't available yet, so contact the site administrator.
              </p>
            )}
          </form>
        </div>
        <Link to="/" className="text-center text-sm text-muted hover:text-ink">
          Back to home
        </Link>
      </section>
    </div>
  );
}
