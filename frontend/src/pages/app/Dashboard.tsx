import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Briefcase, Layers, Plus, Sparkles, Target } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useJobs, useSkillDemand, useUpdateProfile } from "@/hooks/queries";
import { PageHeader } from "@/components/layout/AppShell";
import { PulseTrace } from "@/components/charts/PulseTrace";
import { JobCard } from "@/components/jobs/JobCard";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { demandCoverage, matchScore, norm, skillSet, STRONG_MATCH, unlocksBySkill } from "@/lib/skills";
import { greeting, pct, plural } from "@/lib/format";

function Kpi({ label, value, hint, children }: { label: string; value: string | number; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="min-w-0 bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="num mt-1 font-display text-[32px] font-bold leading-none">{value}</p>
      {children}
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const jobs = useJobs();
  const skills = useSkillDemand();
  const updateProfile = useUpdateProfile();
  const [adding, setAdding] = useState<string | null>(null);

  const userSkills = useMemo(() => user?.skills ?? [], [user?.skills]);
  const jobList = useMemo(() => jobs.data ?? [], [jobs.data]);
  const skillList = useMemo(() => skills.data ?? [], [skills.data]);

  const stats = useMemo(() => {
    const have = skillSet(userSkills);
    const scored = jobList
      .map(job => ({ job, score: matchScore(job.skills, have) }))
      .sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || +new Date(b.job.createdAt) - +new Date(a.job.createdAt));
    const strong = scored.filter(s => s.score !== null && s.score >= STRONG_MATCH).length;
    const unlocks = unlocksBySkill(jobList, userSkills);
    const learnNext = skillList
      .filter(s => !have.has(norm(s.skill)))
      .map(s => ({ ...s, unlocks: unlocks.get(norm(s.skill)) || 0 }))
      .sort((a, b) => b.unlocks - a.unlocks || b.demand - a.demand)
      .slice(0, 5);
    return { scored, strong, learnNext, coverage: demandCoverage(skillList, userSkills) };
  }, [jobList, skillList, userSkills]);

  const addSkill = (skill: string) => {
    setAdding(skill);
    updateProfile.mutate(
      { skills: [...userSkills, skill] },
      {
        onSuccess: () => toast({ title: `Added ${skill}`, description: "Match scores updated." }),
        onError: err => toast({ tone: "error", title: "Couldn't add skill", description: (err as Error).message }),
        onSettled: () => setAdding(null)
      }
    );
  };

  const refresh = () => {
    jobs.refetch();
    skills.refetch();
  };

  const loading = jobs.isPending || skills.isPending;
  const error = jobs.error || skills.error;

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${user?.name.split(" ")[0] ?? ""}`}
        description={user?.preferredRole ? `Tracking the market for ${user.preferredRole} roles.` : "Here's how the job market looks right now."}
        actions={<LiveIndicator updatedAt={Math.max(jobs.dataUpdatedAt, skills.dataUpdatedAt)} fetching={jobs.isFetching || skills.isFetching} onRefresh={refresh} />}
      />

      {error && !jobs.data ? (
        <div className="card">
          <ErrorState error={error} onRetry={refresh} />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="card overflow-hidden p-5 sm:p-6" aria-labelledby="pulse-title">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <h2 id="pulse-title" className="text-lg font-bold">
                  Market pulse
                </h2>
                <p className="text-sm text-muted">Each beat is a skill; taller beats appear in more listings. Select one to explore it.</p>
              </div>
              <p className="flex items-center gap-4 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-signal" /> On your profile
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-ember" /> Missing
                </span>
              </p>
            </div>
            <div className="mt-4">
              {loading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : skillList.length ? (
                <PulseTrace skills={skillList} userSkills={userSkills} onSelect={s => navigate(`/app/market?skill=${encodeURIComponent(s)}`)} />
              ) : (
                <EmptyState
                  icon={<Layers className="h-6 w-6" />}
                  title="No listings yet"
                  description="Skill demand appears here once jobs are posted."
                  action={<ButtonLink to="/app/jobs/new" icon={<Plus className="h-4 w-4" />}>Post the first job</ButtonLink>}
                />
              )}
            </div>
          </section>

          <section aria-label="Key numbers" className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-card lg:grid-cols-4">
            <Kpi label="Open listings" value={loading ? "–" : jobList.length} hint={loading ? undefined : `${plural(new Set(jobList.map(j => j.company)).size, "company", "companies")} hiring`} />
            <Kpi label="Skills in demand" value={loading ? "–" : skillList.length} hint="Distinct skills across listings" />
            <Kpi label="Demand you cover" value={loading ? "–" : pct(stats.coverage.ratio)}>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
                <div className="h-full rounded-full bg-signal transition-all duration-700" style={{ width: pct(stats.coverage.ratio) }} />
              </div>
            </Kpi>
            <Kpi label="Strong matches" value={loading ? "–" : stats.strong} hint="Jobs where you have 70%+ of the skills" />
          </section>

          {!userSkills.length && !loading && (
            <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-signal/30 bg-signal-soft p-5 sm:flex-row sm:items-center">
              <div className="flex gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-signal" aria-hidden />
                <div>
                  <p className="font-medium">Add your skills to unlock match scores</p>
                  <p className="text-sm text-muted">Every listing will show how much of it you already cover.</p>
                </div>
              </div>
              <ButtonLink to="/app/profile?tab=skills">Add skills</ButtonLink>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <section className="card p-5 sm:p-6" aria-labelledby="matches-title">
              <div className="flex items-center justify-between">
                <h2 id="matches-title" className="text-lg font-bold">
                  Best matches for you
                </h2>
                <Link to="/app/jobs?sort=match" className="inline-flex items-center gap-1 text-sm font-medium text-signal hover:underline">
                  All jobs <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="mt-2 divide-y divide-line">
                {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="my-4 h-12 w-full" />)}
                {!loading && !jobList.length && <EmptyState icon={<Briefcase className="h-6 w-6" />} title="No jobs posted yet" className="py-8" />}
                {stats.scored.slice(0, 5).map(({ job }) => (
                  <JobCard key={job._id} job={job} user={user} compact />
                ))}
              </div>
            </section>

            <section className="card p-5 sm:p-6" aria-labelledby="learn-title">
              <div className="flex items-center justify-between">
                <h2 id="learn-title" className="text-lg font-bold">
                  Learn next
                </h2>
                <Link to="/app/skill-gap" className="inline-flex items-center gap-1 text-sm font-medium text-signal hover:underline">
                  Skill gap <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <p className="mt-1 text-sm text-muted">Ranked by how many jobs each skill would turn into strong matches.</p>
              <ul className="mt-3 divide-y divide-line">
                {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="my-3 h-10 w-full" />)}
                {!loading && !stats.learnNext.length && (
                  <li className="py-6 text-center text-muted">
                    <Target className="mx-auto mb-2 h-6 w-6 text-signal" />
                    You already have every skill listed.
                  </li>
                )}
                {stats.learnNext.map(s => (
                  <li key={s.skill} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.skill}</p>
                      <p className="text-xs text-muted">
                        In {plural(s.demand, "listing")}
                        {s.unlocks > 0 && <span className="font-medium text-signal"> · unlocks {plural(s.unlocks, "strong match", "strong matches")}</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => addSkill(s.skill)}
                      disabled={adding !== null}
                      className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium transition hover:border-signal hover:bg-signal-soft disabled:opacity-50"
                      aria-label={`Add ${s.skill} to my skills`}
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                      {adding === s.skill ? "Adding…" : "I know this"}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
