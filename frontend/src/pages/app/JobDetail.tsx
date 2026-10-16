import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Briefcase, CalendarDays, CheckCircle2, CircleDashed, ExternalLink, GraduationCap, MapPin, Pencil, Plus, SearchX, Trash2, UserRound, Wallet } from "lucide-react";
import { useAuth, canManageJob } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useJob, useJobs, useUpdateProfile } from "@/hooks/queries";
import { MatchRing } from "@/components/jobs/MatchRing";
import { useDeleteJobFlow } from "@/components/jobs/useDeleteJobFlow";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Badge, EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { matchScore, matchTone, norm, splitSkills } from "@/lib/skills";
import { formatDate, plural, timeAgo } from "@/lib/format";
import { ApiError } from "@/lib/api";

const TONE_COPY = {
  strong: "Strong match. You have most of what this role asks for.",
  partial: "Partial match. A few skills stand between you and this role.",
  low: "Stretch role. Most listed skills aren't on your profile yet.",
  none: "This listing doesn't list specific skills."
};

export default function JobDetail() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const job = useJob(id);
  const all = useJobs();
  const updateProfile = useUpdateProfile();
  const [adding, setAdding] = useState<string | null>(null);
  const { requestDelete, dialog } = useDeleteJobFlow(() => navigate("/app/jobs", { replace: true }));

  const userSkills = useMemo(() => user?.skills ?? [], [user?.skills]);

  const similar = useMemo(() => {
    if (!job.data || !all.data) return [];
    const mine = new Set(job.data.skills.map(norm));
    return all.data
      .filter(j => j._id !== job.data!._id)
      .map(j => ({ j, shared: j.skills.filter(s => mine.has(norm(s))).length }))
      .filter(x => x.shared > 0)
      .sort((a, b) => b.shared - a.shared)
      .slice(0, 3);
  }, [job.data, all.data]);

  if (job.isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-28" />
        <div className="card space-y-4 p-6">
          <Skeleton className="h-9 w-1/2" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (job.isError) {
    const notFound = job.error instanceof ApiError && job.error.status === 404;
    return (
      <div className="card">
        {notFound ? (
          <EmptyState
            icon={<SearchX className="h-6 w-6" />}
            title="This job isn't available"
            description="It may have been deleted, or the link is incorrect."
            action={<ButtonLink to="/app/jobs">Browse jobs</ButtonLink>}
          />
        ) : (
          <ErrorState error={job.error} onRetry={() => job.refetch()} />
        )}
      </div>
    );
  }

  const j = job.data;
  const score = matchScore(j.skills, userSkills);
  const tone = matchTone(score);
  const { matched, missing } = splitSkills(j.skills, userSkills);
  const manage = canManageJob(user, j.postedBy);
  const poster = j.postedBy && typeof j.postedBy === "object" ? j.postedBy.name : null;

  const addSkill = (skill: string) => {
    setAdding(skill);
    updateProfile.mutate(
      { skills: [...userSkills, skill] },
      {
        onSuccess: () => toast({ title: `Added ${skill} to your skills` }),
        onError: err => toast({ tone: "error", title: "Couldn't add skill", description: (err as Error).message }),
        onSettled: () => setAdding(null)
      }
    );
  };

  const facts = [
    { icon: Wallet, label: "Salary", value: j.salary },
    { icon: Briefcase, label: "Job type", value: j.jobType },
    { icon: GraduationCap, label: "Experience", value: j.experience },
    { icon: CalendarDays, label: "Posted", value: `${formatDate(j.createdAt || j.postedDate)} (${timeAgo(j.createdAt || j.postedDate)})` }
  ];

  return (
    <>
      <Link to="/app/jobs" className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All jobs
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <header className="card p-5 sm:p-7">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-iris-soft font-display text-2xl font-bold text-iris" aria-hidden>
                {j.company[0]}
              </span>
              <div className="min-w-0">
                <h1 className="text-[26px] font-extrabold leading-tight sm:text-[32px]">{j.title}</h1>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-muted">
                  <span className="font-medium text-ink">{j.company}</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-4 w-4" aria-hidden /> {j.location}
                  </span>
                  {poster && (
                    <span className="inline-flex items-center gap-1 text-sm">
                      <UserRound className="h-4 w-4" aria-hidden /> Posted by {poster}
                    </span>
                  )}
                </p>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-1 gap-4 border-t border-line pt-5 sm:grid-cols-2">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-hidden />
                  <div>
                    <dt className="text-sm text-muted">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
            <div className="mt-6 flex flex-wrap gap-2">
              {j.applyUrl ? (
                <a
                  href={j.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink px-4 font-medium text-paper transition hover:bg-ink/90 dark:bg-signal dark:text-night"
                >
                  Apply on company site <ExternalLink className="h-4 w-4" aria-hidden />
                </a>
              ) : (
                <Badge>No application link provided</Badge>
              )}
              {manage && (
                <>
                  <ButtonLink to={`/app/jobs/${j._id}/edit`} variant="secondary" icon={<Pencil className="h-4 w-4" />}>
                    Edit
                  </ButtonLink>
                  <Button variant="secondary" className="text-danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => requestDelete(j)}>
                    Delete
                  </Button>
                </>
              )}
            </div>
          </header>

          <section className="card p-5 sm:p-7" aria-labelledby="about">
            <h2 id="about" className="text-lg font-bold">
              About the role
            </h2>
            {j.description ? (
              <p className="mt-3 max-w-[70ch] whitespace-pre-line text-ink/90">{j.description}</p>
            ) : (
              <p className="mt-3 text-muted">The poster didn't add a description.</p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5 sm:p-6" aria-labelledby="match">
            <h2 id="match" className="text-lg font-bold">
              Your match
            </h2>
            <div className="mt-4 flex items-center gap-4">
              <MatchRing score={score} size={76} />
              <p className="text-sm text-muted">
                {userSkills.length ? TONE_COPY[tone] : "Add skills to your profile to see how you match."}
              </p>
            </div>
            {j.skills.length > 0 && (
              <div className="mt-5 space-y-4">
                <div>
                  <h3 className="mb-2 text-sm font-semibold">You have ({matched.length})</h3>
                  {matched.length ? (
                    <ul className="flex flex-wrap gap-1.5">
                      {matched.map(s => (
                        <li key={s} className="inline-flex items-center gap-1 rounded-md bg-signal-soft px-2 py-1 text-sm">
                          <CheckCircle2 className="h-3.5 w-3.5 text-signal" aria-hidden /> {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">None of the listed skills yet.</p>
                  )}
                </div>
                {missing.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold">To learn ({missing.length})</h3>
                    <ul className="space-y-1.5">
                      {missing.map(s => (
                        <li key={s} className="flex items-center justify-between gap-2 rounded-lg bg-ember-soft px-2.5 py-1.5 text-sm">
                          <span className="inline-flex items-center gap-1.5">
                            <CircleDashed className="h-3.5 w-3.5 text-ember" aria-hidden /> {s}
                          </span>
                          <button
                            onClick={() => addSkill(s)}
                            disabled={adding !== null}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
                            aria-label={`I know ${s}, add it to my skills`}
                          >
                            <Plus className="h-3 w-3" aria-hidden /> {adding === s ? "Adding…" : "I know this"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          {similar.length > 0 && (
            <section aria-labelledby="similar">
              <h2 id="similar" className="mb-3 text-lg font-bold">
                Similar roles
              </h2>
              <ul className="card divide-y divide-line px-4">
                {similar.map(({ j: s, shared }) => (
                  <li key={s._id}>
                    <Link to={`/app/jobs/${s._id}`} className="group flex items-center gap-3 py-3">
                      <MatchRing score={matchScore(s.skills, userSkills)} size={40} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium group-hover:text-signal">{s.title}</span>
                        <span className="block truncate text-xs text-muted">
                          {s.company} · {plural(shared, "skill")} in common
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
      {dialog}
    </>
  );
}
