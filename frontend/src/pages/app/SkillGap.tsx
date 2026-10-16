import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Sparkles, Target, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useJobs, useRecommendations, useSkillDemand, useUpdateProfile } from "@/hooks/queries";
import { PageHeader } from "@/components/layout/AppShell";
import { MatchRing } from "@/components/jobs/MatchRing";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState, Skeleton, Tooltip } from "@/components/ui/States";
import { demandCoverage, matchScore, norm, skillSet, splitSkills, unlocksBySkill } from "@/lib/skills";
import { pct, plural } from "@/lib/format";

function CoverageDial({ ratio }: { ratio: number }) {
  const size = 132;
  const r = 56;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`You cover ${pct(ratio)} of skill demand`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={12} className="stroke-ember-soft" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={12} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - ratio)} className="stroke-signal transition-[stroke-dashoffset] duration-700" />
      </svg>
      <span className="num absolute inset-0 flex items-center justify-center font-display text-[30px] font-extrabold">{pct(ratio)}</span>
    </div>
  );
}

export default function SkillGap() {
  const { user } = useAuth();
  const toast = useToast();
  const recs = useRecommendations(user?.id);
  const skills = useSkillDemand();
  const jobs = useJobs();
  const updateProfile = useUpdateProfile();
  const [busy, setBusy] = useState<string | null>(null);

  const userSkills = useMemo(() => user?.skills ?? [], [user?.skills]);
  const jobList = useMemo(() => jobs.data ?? [], [jobs.data]);

  const model = useMemo(() => {
    const demand = new Map((skills.data ?? []).map(s => [norm(s.skill), s.demand]));
    const unlocks = unlocksBySkill(jobList, userSkills);
    // The backend decides which skills are missing; demand/unlocks only rank them.
    const path = (recs.data?.recommendedSkills ?? [])
      .map(skill => ({ skill, demand: demand.get(norm(skill)) ?? 0, unlocks: unlocks.get(norm(skill)) ?? 0 }))
      .sort((a, b) => b.unlocks - a.unlocks || b.demand - a.demand || a.skill.localeCompare(b.skill));
    const coverage = demandCoverage(skills.data ?? [], userSkills);
    const top3 = path.slice(0, 3).reduce((a, s) => a + s.demand, 0);
    const projected = coverage.total ? Math.min(1, (coverage.covered + top3) / coverage.total) : 0;
    const have = skillSet(userSkills);
    const oneAway = jobList
      .map(job => ({ job, score: matchScore(job.skills, have), ...splitSkills(job.skills, userSkills) }))
      .filter(x => x.missing.length === 1)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 5);
    return { path, coverage, projected, demand, oneAway, maxDemand: Math.max(1, ...path.map(p => p.demand)) };
  }, [recs.data, skills.data, jobList, userSkills]);

  const change = (next: string[], skill: string, added: boolean) => {
    setBusy(skill);
    updateProfile.mutate(
      { skills: next },
      {
        onSuccess: () => toast({ title: added ? `Added ${skill}` : `Removed ${skill}`, description: "Your skill gap has been recalculated." }),
        onError: err => toast({ tone: "error", title: "Couldn't update skills", description: (err as Error).message }),
        onSettled: () => setBusy(null)
      }
    );
  };

  const loading = recs.isPending || skills.isPending || jobs.isPending;
  const error = recs.error || skills.error || jobs.error;

  return (
    <>
      <PageHeader title="Skill gap" description="Skills that listings ask for and your profile doesn't have yet, ranked by how many roles they would open up." />

      {error && !recs.data ? (
        <div className="card">
          <ErrorState
            error={error}
            onRetry={() => {
              recs.refetch();
              skills.refetch();
              jobs.refetch();
            }}
          />
        </div>
      ) : loading ? (
        <div className="space-y-6">
          <Skeleton className="h-[180px] rounded-2xl" />
          <Skeleton className="h-[420px] rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-6">
          <section className="card flex flex-col gap-6 p-5 sm:flex-row sm:items-center sm:p-7">
            <CoverageDial ratio={model.coverage.ratio} />
            <div className="min-w-0">
              <h2 className="text-xl font-bold">
                {userSkills.length ? `Your ${plural(userSkills.length, "skill")} cover ${pct(model.coverage.ratio)} of demand` : "Your profile has no skills yet"}
              </h2>
              <p className="mt-1.5 max-w-xl text-muted">
                Across all listings there are {plural(model.coverage.total, "skill request")}. Your skills appear in {model.coverage.covered} of them.
                {model.path.length > 0 && (
                  <>
                    {" "}
                    Learning the top three below would take you to <strong className="text-ink">{pct(model.projected)}</strong>.
                  </>
                )}
              </p>
              {!userSkills.length && (
                <ButtonLink to="/app/profile?tab=skills" className="mt-4">
                  Add your skills
                </ButtonLink>
              )}
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <section className="card min-w-0 p-5 sm:p-6" aria-labelledby="path-title">
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="path-title" className="text-lg font-bold">
                  Learning path
                </h2>
                <span className="text-sm text-muted">{plural(model.path.length, "skill")}</span>
              </div>
              {model.path.length === 0 ? (
                <EmptyState icon={<Target className="h-6 w-6" />} title="No gaps" description="You have every skill that open listings ask for." className="py-8" />
              ) : (
                <ol className="mt-4 divide-y divide-line">
                  {model.path.map((p, i) => (
                    <li key={p.skill} className="flex items-center gap-3 py-3.5 sm:gap-4">
                      <span className="num w-6 shrink-0 text-right font-display text-sm font-bold text-muted">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="font-medium">{p.skill}</span>
                          {p.unlocks > 0 && (
                            <Tooltip content={`Adding ${p.skill} would raise ${plural(p.unlocks, "job")} to a 70%+ match.`}>
                              <span tabIndex={0} className="inline-flex items-center gap-1 rounded-full bg-signal-soft px-2 py-0.5 text-xs font-medium text-signal">
                                <Sparkles className="h-3 w-3" aria-hidden /> +{plural(p.unlocks, "strong match", "strong matches")}
                              </span>
                            </Tooltip>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center gap-3">
                          <span className="h-1.5 max-w-[240px] flex-1 overflow-hidden rounded-full bg-line/70" aria-hidden>
                            <span className="block h-full rounded-full bg-ember" style={{ width: `${(p.demand / model.maxDemand) * 100}%` }} />
                          </span>
                          <Link to={`/app/jobs?skill=${encodeURIComponent(p.skill)}`} className="shrink-0 text-xs text-muted hover:text-signal hover:underline">
                            {plural(p.demand, "listing")}
                          </Link>
                        </div>
                      </div>
                      <button
                        onClick={() => change([...userSkills, p.skill], p.skill, true)}
                        disabled={busy !== null}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium transition hover:border-signal hover:bg-signal-soft disabled:opacity-50"
                        aria-label={`I know ${p.skill}, add it to my skills`}
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden /> {busy === p.skill ? "Adding…" : "I know this"}
                      </button>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <div className="space-y-6">
              <section className="card p-5 sm:p-6" aria-labelledby="one-away">
                <h2 id="one-away" className="text-lg font-bold">
                  One skill away
                </h2>
                <p className="mt-0.5 text-sm text-muted">Jobs where a single missing skill stands between you and a full match.</p>
                {model.oneAway.length ? (
                  <ul className="mt-3 divide-y divide-line">
                    {model.oneAway.map(({ job, score, missing }) => (
                      <li key={job._id}>
                        <Link to={`/app/jobs/${job._id}`} className="group flex items-center gap-3 py-3">
                          <MatchRing score={score} size={40} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium group-hover:text-signal">{job.title}</span>
                            <span className="block text-xs text-muted">
                              {job.company} · needs <span className="font-medium text-ember">{missing[0]}</span>
                            </span>
                          </span>
                          <ArrowRight className="h-4 w-4 shrink-0 text-muted group-hover:text-signal" aria-hidden />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-muted">No jobs are exactly one skill away right now.</p>
                )}
              </section>

              <section className="card p-5 sm:p-6" aria-labelledby="your-skills">
                <div className="flex items-baseline justify-between">
                  <h2 id="your-skills" className="text-lg font-bold">
                    Your skills
                  </h2>
                  <Link to="/app/profile?tab=skills" className="text-sm font-medium text-signal hover:underline">
                    Edit
                  </Link>
                </div>
                {userSkills.length ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {userSkills.map(s => {
                      const d = model.demand.get(norm(s)) ?? 0;
                      return (
                        <li key={s} className={`inline-flex items-center gap-1 rounded-lg py-1 pl-2.5 pr-1 text-sm ${d ? "bg-signal-soft" : "bg-line/60"}`} title={d ? `In ${plural(d, "listing")}` : "Not asked for in current listings"}>
                          {s}
                          <span className="num text-xs text-muted">{d}</span>
                          <button onClick={() => change(userSkills.filter(x => x !== s), s, false)} disabled={busy !== null} className="rounded p-0.5 text-muted hover:text-danger disabled:opacity-50" aria-label={`Remove ${s}`}>
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-muted">No skills yet.</p>
                )}
                <p className="mt-3 text-xs text-muted">Numbers show how many listings ask for each skill.</p>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
