import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowRight, BarChart3, Check, Minus, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useJobs, useSkillDemand, useUpdateProfile } from "@/hooks/queries";
import { useThemeColors } from "@/hooks/useThemeColors";
import { PageHeader } from "@/components/layout/AppShell";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { Segmented } from "@/components/ui/Controls";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { countBy, norm, relatedSkills, skillSet } from "@/lib/skills";
import { pct, plural } from "@/lib/format";

function ChartTooltip({ active, payload, label, unit = "listing" }: { active?: boolean; payload?: { value: number; payload: { name?: string; skill?: string } }[]; label?: string; unit?: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg bg-night px-3 py-2 text-sm text-white shadow-lift">
      <p className="font-medium">{label ?? p.payload.name ?? p.payload.skill}</p>
      <p className="text-night-ink">{plural(p.value, unit)}</p>
    </div>
  );
}

function Panel({ title, description, children, className = "" }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card min-w-0 p-5 sm:p-6 ${className}`}>
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function RankList({ items, total, color }: { items: { name: string; value: number }[]; total: number; color: string }) {
  const max = Math.max(1, ...items.map(i => i.value));
  return (
    <ul className="space-y-3">
      {items.map(i => (
        <li key={i.name} className="text-sm">
          <div className="mb-1 flex justify-between gap-3">
            <span className="truncate font-medium">{i.name}</span>
            <span className="num shrink-0 text-muted">
              {i.value} <span className="text-xs">({pct(i.value / total)})</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-line/70">
            <div className="h-full rounded-full" style={{ width: `${(i.value / max) * 100}%`, background: color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function Market() {
  const { user } = useAuth();
  const toast = useToast();
  const colors = useThemeColors();
  const [params, setParams] = useSearchParams();
  const [top, setTop] = useState<"10" | "20" | "all">("10");
  const jobs = useJobs();
  const skills = useSkillDemand();
  const updateProfile = useUpdateProfile();

  const jobList = useMemo(() => jobs.data ?? [], [jobs.data]);
  const skillList = useMemo(() => skills.data ?? [], [skills.data]);
  const userSkills = useMemo(() => user?.skills ?? [], [user?.skills]);
  const have = useMemo(() => skillSet(userSkills), [userSkills]);

  const selected = params.get("skill") || skillList[0]?.skill || "";
  const selectedDemand = skillList.find(s => norm(s.skill) === norm(selected));
  const spotlight = useMemo(() => relatedSkills(jobList, selected), [jobList, selected]);

  const chartData = top === "all" ? skillList : skillList.slice(0, Number(top));
  const types = useMemo(() => countBy(jobList, j => j.jobType), [jobList]);
  const locations = useMemo(() => countBy(jobList, j => j.location).slice(0, 6), [jobList]);
  const levels = useMemo(() => countBy(jobList, j => j.experience), [jobList]);
  const companies = useMemo(() => {
    const map = new Map<string, { company: string; roles: number; skills: Map<string, number> }>();
    jobList.forEach(j => {
      const c = map.get(j.company) || { company: j.company, roles: 0, skills: new Map() };
      c.roles++;
      j.skills.forEach(s => c.skills.set(s, (c.skills.get(s) || 0) + 1));
      map.set(j.company, c);
    });
    return [...map.values()]
      .sort((a, b) => b.roles - a.roles || a.company.localeCompare(b.company))
      .slice(0, 8)
      .map(c => ({ ...c, top: [...c.skills.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([s]) => s) }));
  }, [jobList]);

  const typeColors = [colors.signal, colors.iris, colors.ember, colors.muted];
  const loading = jobs.isPending || skills.isPending;
  const error = jobs.error || skills.error;
  const mine = have.has(norm(selected));

  const toggleSkill = () => {
    const next = mine ? userSkills.filter(s => norm(s) !== norm(selected)) : [...userSkills, selectedDemand?.skill || selected];
    updateProfile.mutate(
      { skills: next },
      {
        onSuccess: () => toast({ title: mine ? `Removed ${selected} from your skills` : `Added ${selected} to your skills` }),
        onError: err => toast({ tone: "error", title: "Couldn't update skills", description: (err as Error).message })
      }
    );
  };

  const refresh = () => {
    jobs.refetch();
    skills.refetch();
  };

  return (
    <>
      <PageHeader
        title="Market insights"
        description="What employers on CareerPulse are asking for, computed from every open listing."
        actions={<LiveIndicator updatedAt={Math.max(jobs.dataUpdatedAt, skills.dataUpdatedAt)} fetching={jobs.isFetching || skills.isFetching} onRefresh={refresh} />}
      />

      {error && !jobs.data ? (
        <div className="card">
          <ErrorState error={error} onRetry={refresh} />
        </div>
      ) : loading ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Skeleton className="h-[460px] rounded-2xl" />
          <Skeleton className="h-[460px] rounded-2xl" />
        </div>
      ) : !jobList.length ? (
        <div className="card">
          <EmptyState icon={<BarChart3 className="h-6 w-6" />} title="No listings to analyse yet" description="Charts appear as soon as jobs are posted." action={<ButtonLink to="/app/jobs/new">Post a job</ButtonLink>} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <section className="card min-w-0 p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">Skill demand</h2>
                  <p className="mt-0.5 text-sm text-muted">Listings that ask for each skill. Select a bar to explore it.</p>
                </div>
                <Segmented
                  label="How many skills"
                  value={top}
                  onChange={setTop}
                  options={[
                    { value: "10", label: "Top 10" },
                    { value: "20", label: "Top 20" },
                    { value: "all", label: `All ${skillList.length}` }
                  ]}
                />
              </div>
              <div className="mt-3 flex gap-4 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors.signal }} /> On your profile
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: colors.ember }} /> Missing
                </span>
              </div>
              <div style={{ height: Math.max(260, chartData.length * 30 + 20) }} className="mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }} barCategoryGap={6}>
                    <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="skill" width={110} axisLine={false} tickLine={false} interval={0} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: colors.line, opacity: 0.4 }} />
                    <Bar dataKey="demand" radius={[0, 6, 6, 0]} onClick={d => {
                        const skill = (d as unknown as { payload?: { skill?: string } }).payload?.skill;
                        if (skill) setParams({ skill }, { replace: true });
                      }} className="cursor-pointer">
                      {chartData.map(s => (
                        <Cell
                          key={s.skill}
                          fill={have.has(norm(s.skill)) ? colors.signal : colors.ember}
                          fillOpacity={norm(s.skill) === norm(selected) ? 1 : 0.75}
                          stroke={norm(s.skill) === norm(selected) ? colors.ink : "none"}
                          strokeWidth={1.5}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-muted">
                Explore a skill
                <select value={selected} onChange={e => setParams({ skill: e.target.value }, { replace: true })} className="input h-9 w-auto py-0">
                  {skillList.map(s => (
                    <option key={s.skill}>{s.skill}</option>
                  ))}
                </select>
              </label>
            </section>

            <section className="card min-w-0 p-5 sm:p-6" aria-live="polite">
              <p className="text-sm text-muted">Skill spotlight</p>
              <h2 className="mt-1 text-[28px] font-extrabold leading-tight">{selected}</h2>
              <p className="mt-2 text-muted">
                Asked for in <strong className="text-ink">{plural(spotlight.listings, "listing")}</strong>, which is{" "}
                <strong className="text-ink">{pct(spotlight.listings / jobList.length)}</strong> of all open roles.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant={mine ? "secondary" : "primary"} loading={updateProfile.isPending} icon={mine ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />} onClick={toggleSkill}>
                  {mine ? "Remove from my skills" : "Add to my skills"}
                </Button>
                <ButtonLink size="sm" variant="secondary" to={`/app/jobs?skill=${encodeURIComponent(selected)}`}>
                  See {plural(spotlight.listings, "job")} <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              </div>
              <h3 className="mt-7 text-sm font-semibold">Often asked for together</h3>
              {spotlight.related.length ? (
                <ul className="mt-3 space-y-2.5">
                  {spotlight.related.slice(0, 7).map(r => (
                    <li key={r.skill}>
                      <button onClick={() => setParams({ skill: r.skill }, { replace: true })} className="group w-full text-left text-sm">
                        <span className="mb-1 flex justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 font-medium group-hover:text-signal">
                            {have.has(norm(r.skill)) && <Check className="h-3.5 w-3.5 text-signal" aria-label="On your profile" />}
                            {r.skill}
                          </span>
                          <span className="num text-muted">{pct(r.count / spotlight.listings)}</span>
                        </span>
                        <span className="block h-1.5 overflow-hidden rounded-full bg-line/70">
                          <span className="block h-full rounded-full bg-iris" style={{ width: pct(r.count / spotlight.listings) }} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-muted">No other skills appear alongside this one yet.</p>
              )}
            </section>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <Panel title="Job types" description="How listings split by contract type.">
              <div className="flex items-center gap-5">
                <div className="h-[150px] w-[150px] shrink-0" aria-hidden="true">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={types} dataKey="value" nameKey="name" rootTabIndex={-1} innerRadius={44} outerRadius={70} paddingAngle={2} stroke="none">
                        {types.map((t, i) => (
                          <Cell key={t.name} fill={typeColors[i % typeColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<ChartTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="min-w-0 flex-1 space-y-2 text-sm">
                  {types.map((t, i) => (
                    <li key={t.name} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: typeColors[i % typeColors.length] }} />
                        <Link to={`/app/jobs?type=${encodeURIComponent(t.name)}`} className="hover:text-signal hover:underline">
                          {t.name}
                        </Link>
                      </span>
                      <span className="num text-muted">{t.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Panel>
            <Panel title="Top locations" description="Where roles are based.">
              <RankList items={locations} total={jobList.length} color={colors.iris} />
            </Panel>
            <Panel title="Experience levels" description="Seniority employers are hiring for." className="md:col-span-2 xl:col-span-1">
              <RankList items={levels} total={jobList.length} color={colors.signal} />
            </Panel>
          </div>

          <section className="card min-w-0 overflow-hidden">
            <div className="p-5 pb-3 sm:p-6 sm:pb-3">
              <h2 className="text-lg font-bold">Companies hiring</h2>
              <p className="mt-0.5 text-sm text-muted">Open roles per company and the skills they ask for most.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-y border-line bg-raised text-muted">
                  <tr>
                    <th scope="col" className="px-5 py-2.5 font-medium sm:px-6">Company</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Open roles</th>
                    <th scope="col" className="px-5 py-2.5 font-medium sm:px-6">Top skills</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {companies.map(c => (
                    <tr key={c.company} className="transition hover:bg-raised">
                      <td className="px-5 py-3 font-medium sm:px-6">{c.company}</td>
                      <td className="num px-3 py-3">{c.roles}</td>
                      <td className="px-5 py-3 sm:px-6">
                        <span className="flex flex-wrap gap-1.5">
                          {c.top.map(s => (
                            <span key={s} className={`rounded-md px-2 py-0.5 text-xs font-medium ${have.has(norm(s)) ? "bg-signal-soft" : "bg-line/60"}`}>
                              {s}
                            </span>
                          ))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
