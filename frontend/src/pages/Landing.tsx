import { Link, Navigate } from "react-router-dom";
import { ArrowUpRight, Briefcase, MapPin, Moon, Sun } from "lucide-react";
import { useJobs, useSkillDemand } from "@/hooks/queries";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Logo } from "@/components/layout/Logo";
import { PulseTrace } from "@/components/charts/PulseTrace";
import { ButtonLink, IconButton } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/States";
import { countBy } from "@/lib/skills";
import { plural, timeAgo } from "@/lib/format";

const STEPS = [
  { title: "Add the skills you have", body: "Pick from the skills employers actually list, or type your own." },
  { title: "See your match on every job", body: "Each listing shows what share of its required skills you already cover." },
  { title: "Learn what unlocks the most roles", body: "Your skill gap is ranked by how many listings ask for each missing skill." }
];

export default function Landing() {
  const { user, checking } = useAuth();
  const { theme, toggle } = useTheme();
  const jobs = useJobs();
  const skills = useSkillDemand();

  if (user) return <Navigate to="/app" replace />;

  const jobList = jobs.data || [];
  const skillList = skills.data || [];
  const companies = countBy(jobList, j => j.company).length;
  const remote = jobList.filter(j => /remote/i.test(j.location)).length;
  const maxDemand = Math.max(1, ...skillList.slice(0, 8).map(s => s.demand));
  const loading = jobs.isPending || skills.isPending;
  const failed = jobs.isError || skills.isError;

  return (
    <div className="min-h-screen bg-paper">
      <section className="relative overflow-hidden bg-night text-white">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(900px 420px at 78% 62%, rgba(44,211,201,.13), transparent 70%), radial-gradient(700px 380px at 8% 0%, rgba(84,98,214,.18), transparent 70%)"
          }}
        />
        <header className="relative mx-auto flex h-20 max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Logo light />
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Account">
            <IconButton label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"} onClick={toggle} className="text-night-ink hover:bg-white/10 hover:text-white">
              {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </IconButton>
            <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-night-ink hover:text-white">
              Log in
            </Link>
            <ButtonLink to="/register" variant="signal" size="sm">
              Get started
            </ButtonLink>
          </nav>
        </header>

        <div className="relative mx-auto max-w-[1200px] px-5 pb-10 pt-10 sm:px-8 sm:pt-16">
          <div className="max-w-3xl">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-night-ink">
              <span className="h-2 w-2 animate-beat rounded-full bg-signal-bright" aria-hidden />
              {loading ? "Reading live listings…" : failed ? "Live data unavailable right now" : `Live from ${plural(jobList.length, "open listing")}`}
            </p>
            <h1 className="font-display text-[40px] font-extrabold leading-[1.02] tracking-[-0.025em] text-white sm:text-[64px]">
              Know what the job market wants before you apply.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-night-ink">
              CareerPulse measures how often each skill appears in open listings, scores every job against your profile,
              and ranks the skills that would open the most doors for you.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink to="/register" variant="signal" size="lg">
                Create your free account
              </ButtonLink>
              <ButtonLink to="/login" size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                I have an account
              </ButtonLink>
            </div>
          </div>

          <div className="mt-14">
            {loading ? (
              <Skeleton className="h-[200px] w-full bg-white/5" />
            ) : (
              <PulseTrace skills={skillList} tone="dark" maxBeats={9} height={230} />
            )}
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4">
            {[
              ["Open listings", jobList.length],
              ["Skills tracked", skillList.length],
              ["Companies hiring", companies],
              ["Remote roles", remote]
            ].map(([label, value]) => (
              <div key={label as string} className="bg-night px-5 py-4">
                <dt className="text-sm text-night-ink">{label}</dt>
                <dd className="num mt-1 font-display text-3xl font-bold text-white">{loading ? "–" : value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8" aria-labelledby="how">
        <h2 id="how" className="max-w-xl text-3xl font-extrabold sm:text-4xl">
          From "am I ready?" to a short list of what to learn.
        </h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-t-2 border-ink pt-5 dark:border-signal">
              <span className="num font-display text-sm font-bold text-signal">Step {i + 1}</span>
              <h3 className="mt-2 text-xl font-bold">{s.title}</h3>
              <p className="mt-2 text-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-line bg-surface" aria-label="Live market">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-20 sm:px-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold">Most requested skills</h2>
            <p className="mt-1.5 text-muted">Share of open listings that ask for each skill.</p>
            <ul className="mt-6 space-y-3">
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <li key={i}>
                    <Skeleton className="h-6 w-full" />
                  </li>
                ))}
              {skillList.slice(0, 8).map(s => (
                <li key={s.skill} className="grid grid-cols-[120px_1fr_48px] items-center gap-3 text-sm sm:grid-cols-[150px_1fr_56px]">
                  <span className="truncate font-medium">{s.skill}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-line/70">
                    <span className="block h-full rounded-full bg-signal" style={{ width: `${(s.demand / maxDemand) * 100}%` }} />
                  </span>
                  <span className="num text-right text-muted">{jobList.length ? Math.round((s.demand / jobList.length) * 100) : 0}%</span>
                </li>
              ))}
              {!loading && !skillList.length && <li className="text-muted">No listings have been posted yet.</li>}
            </ul>
          </div>
          <div>
            <h2 className="text-2xl font-extrabold">Hiring now</h2>
            <p className="mt-1.5 text-muted">The latest listings. Log in to see your match on each.</p>
            <ul className="mt-6 divide-y divide-line">
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="py-3">
                    <Skeleton className="h-10 w-full" />
                  </li>
                ))}
              {jobList.slice(0, 5).map(j => (
                <li key={j._id}>
                  <Link to={`/app/jobs/${j._id}`} className="group flex items-center gap-4 rounded-lg py-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-iris-soft font-display font-bold text-iris">
                      {j.company[0]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium group-hover:text-signal">{j.title}</span>
                      <span className="flex flex-wrap gap-x-3 text-sm text-muted">
                        <span>{j.company}</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" aria-hidden />
                          {j.location}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Briefcase className="h-3.5 w-3.5" aria-hidden />
                          {j.jobType}
                        </span>
                      </span>
                    </span>
                    <span className="hidden text-xs text-muted sm:block">{timeAgo(j.createdAt)}</span>
                    <ArrowUpRight className="h-4 w-4 text-muted transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-signal" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 py-20 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-night p-8 text-white sm:flex-row sm:items-center sm:p-12">
          <div>
            <h2 className="text-2xl font-extrabold text-white sm:text-3xl">See your match score on every listing.</h2>
            <p className="mt-2 text-night-ink">It takes a minute: create an account and add your skills.</p>
          </div>
          <ButtonLink to="/register" variant="signal" size="lg" className="shrink-0">
            {checking ? "Loading…" : "Get started"}
          </ButtonLink>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted sm:px-8">
          <Logo />
          <p>Market data updates as listings are posted.</p>
        </div>
      </footer>
    </div>
  );
}
