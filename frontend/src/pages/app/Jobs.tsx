import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Briefcase, MapPin, Plus, Search, SearchX, Wrench, X } from "lucide-react";
import { useAuth, canManageJob } from "@/context/AuthContext";
import { useJobSearch, useSkillDemand } from "@/hooks/queries";
import { useDebounced } from "@/hooks/useDebounced";
import { PageHeader } from "@/components/layout/AppShell";
import { JobCard } from "@/components/jobs/JobCard";
import { useDeleteJobFlow } from "@/components/jobs/useDeleteJobFlow";
import { ButtonLink, Button } from "@/components/ui/Button";
import { Pagination, Segmented } from "@/components/ui/Controls";
import { LiveIndicator } from "@/components/ui/LiveIndicator";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { EXPERIENCE_LEVELS, JOB_TYPES, type SearchParams } from "@/lib/types";
import { matchScore, skillSet } from "@/lib/skills";
import { cx } from "@/lib/format";

const PAGE_SIZE = 10;
type Sort = "newest" | "oldest" | "company" | "title" | "match";
type Scope = "all" | "mine";

function SearchInput({ icon, label, value, onChange, placeholder, list }: { icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; placeholder: string; list?: string }) {
  return (
    <label className="relative block min-w-0 flex-1">
      <span className="sr-only">{label}</span>
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">{icon}</span>
      <input type="search" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} list={list} className="input pl-10" />
    </label>
  );
}

export default function Jobs() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const skillDemand = useSkillDemand();

  // Inputs are local so typing stays instant; the URL (and the API request) updates after a short pause.
  const [title, setTitle] = useState(params.get("title") ?? "");
  const [skill, setSkill] = useState(params.get("skill") ?? "");
  const [location, setLocation] = useState(params.get("location") ?? "");
  const jobType = params.get("type") ?? "";
  const experience = params.get("experience") ?? "";
  const sort = (params.get("sort") as Sort) || "newest";
  const scope = (params.get("scope") as Scope) || "all";
  const page = Math.max(1, Number(params.get("page")) || 1);

  // Keep inputs in sync when the URL changes from elsewhere (e.g. top-bar search, "see jobs" links)
  useEffect(() => {
    setTitle(params.get("title") ?? "");
    setSkill(params.get("skill") ?? "");
    setLocation(params.get("location") ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.get("title"), params.get("skill"), params.get("location")]);

  const update = (changes: Record<string, string | number | null>, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v === null || v === "" || v === undefined ? next.delete(k) : next.set(k, String(v))));
    if (resetPage) next.delete("page");
    setParams(next, { replace: true });
  };

  const dTitle = useDebounced(title);
  const dSkill = useDebounced(skill);
  const dLocation = useDebounced(location);
  useEffect(() => {
    if (dTitle !== (params.get("title") ?? "") || dSkill !== (params.get("skill") ?? "") || dLocation !== (params.get("location") ?? "")) {
      update({ title: dTitle.trim(), skill: dSkill.trim(), location: dLocation.trim() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dTitle, dSkill, dLocation]);

  // "Best match" and "My postings" need every result to rank/filter, so those fetch all and paginate here.
  const clientSide = sort === "match" || scope === "mine";
  const query: SearchParams = {
    title: params.get("title") ?? undefined,
    skill: params.get("skill") ?? undefined,
    location: params.get("location") ?? undefined,
    jobType: jobType || undefined,
    experience: experience || undefined,
    sort: sort === "match" ? "newest" : sort,
    ...(clientSide ? {} : { page, limit: PAGE_SIZE })
  };
  const search = useJobSearch(query);

  const view = useMemo(() => {
    const data = search.data;
    if (!data) return null;
    if (!clientSide) return { jobs: data.jobs, total: data.total, pages: data.pages };
    let list = data.jobs;
    if (scope === "mine") list = list.filter(j => canManageJob(user && { ...user, isAdmin: false }, j.postedBy));
    if (sort === "match") {
      const have = skillSet(user?.skills ?? []);
      list = [...list].sort((a, b) => (matchScore(b.skills, have) ?? -1) - (matchScore(a.skills, have) ?? -1));
    }
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    return { jobs: list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total: list.length, pages };
  }, [search.data, clientSide, scope, sort, page, user]);

  // If filters shrink the result set, don't strand the user on an empty page
  useEffect(() => {
    if (view && page > view.pages) update({ page: view.pages > 1 ? view.pages : null }, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view?.pages, page]);

  const { requestDelete, dialog } = useDeleteJobFlow();

  const activeFilters = [
    params.get("title") && { key: "title", label: `Title: ${params.get("title")}` },
    params.get("skill") && { key: "skill", label: `Skill: ${params.get("skill")}` },
    params.get("location") && { key: "location", label: `Location: ${params.get("location")}` },
    jobType && { key: "type", label: jobType },
    experience && { key: "experience", label: experience }
  ].filter(Boolean) as { key: string; label: string }[];

  const clearAll = () => {
    setTitle("");
    setSkill("");
    setLocation("");
    const next = new URLSearchParams();
    if (sort !== "newest") next.set("sort", sort);
    if (scope !== "all") next.set("scope", scope);
    setParams(next, { replace: true });
  };

  const goToPage = (p: number) => {
    update({ page: p > 1 ? p : null }, false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const from = view && view.total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const to = view ? Math.min(page * PAGE_SIZE, view.total) : 0;

  return (
    <>
      <PageHeader
        title="Jobs"
        description="Search by role, skill or location. Results update as you type."
        actions={
          <>
            <LiveIndicator updatedAt={search.dataUpdatedAt} fetching={search.isFetching} onRefresh={() => search.refetch()} />
            <ButtonLink to="/app/jobs/new" icon={<Plus className="h-4 w-4" />}>
              Post a job
            </ButtonLink>
          </>
        }
      />

      <div className="card space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row">
          <SearchInput icon={<Search className="h-4 w-4" />} label="Job title" value={title} onChange={setTitle} placeholder="Role, e.g. developer" />
          <SearchInput icon={<Wrench className="h-4 w-4" />} label="Skill" value={skill} onChange={setSkill} placeholder="Skill, e.g. React" list="skill-options" />
          <SearchInput icon={<MapPin className="h-4 w-4" />} label="Location" value={location} onChange={setLocation} placeholder="City or Remote" />
          <datalist id="skill-options">
            {(skillDemand.data ?? []).map(s => (
              <option key={s.skill} value={s.skill} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Segmented
            label="Job type"
            value={jobType || "all"}
            onChange={v => update({ type: v === "all" ? null : v })}
            options={[{ value: "all", label: "All types" }, ...JOB_TYPES.map(t => ({ value: t, label: t }))]}
          />
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <label className="sr-only" htmlFor="exp">
              Experience level
            </label>
            <select id="exp" value={experience} onChange={e => update({ experience: e.target.value })} className="input h-10 py-0 sm:w-[170px]">
              <option value="">Any experience</option>
              {EXPERIENCE_LEVELS.map(l => (
                <option key={l}>{l}</option>
              ))}
            </select>
            <label className="sr-only" htmlFor="sort">
              Sort by
            </label>
            <select id="sort" value={sort} onChange={e => update({ sort: e.target.value === "newest" ? null : e.target.value })} className="input h-10 py-0 sm:w-[180px]">
              <option value="newest">Newest first</option>
              <option value="match">Best match for me</option>
              <option value="oldest">Oldest first</option>
              <option value="company">Company A–Z</option>
              <option value="title">Title A–Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-4 mt-6 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Show"
          value={scope}
          onChange={v => update({ scope: v === "all" ? null : v })}
          options={[
            { value: "all", label: "All jobs" },
            { value: "mine", label: "My postings" }
          ]}
        />
        <p className="num text-sm text-muted" aria-live="polite">
          {search.isPending ? "Loading jobs…" : view && view.total ? `Showing ${from}–${to} of ${view.total}` : ""}
        </p>
      </div>

      {activeFilters.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {activeFilters.map(f => (
            <button
              key={f.key}
              onClick={() => {
                if (f.key === "title") setTitle("");
                if (f.key === "skill") setSkill("");
                if (f.key === "location") setLocation("");
                update({ [f.key]: null });
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-iris-soft py-1 pl-3 pr-2 text-sm font-medium text-iris transition hover:brightness-95"
              aria-label={`Remove filter ${f.label}`}
            >
              {f.label}
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          ))}
          <button onClick={clearAll} className="text-sm font-medium text-muted hover:text-ink">
            Clear all
          </button>
        </div>
      )}

      <div className={cx("space-y-3 transition-opacity", search.isFetching && search.isPlaceholderData && "opacity-60")}>
        {search.isPending &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card flex gap-4 p-5">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2.5">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-2/3" />
              </div>
            </div>
          ))}

        {search.isError && !search.data && (
          <div className="card">
            <ErrorState error={search.error} onRetry={() => search.refetch()} />
          </div>
        )}

        {view?.jobs.map(job => (
          <JobCard key={job._id} job={job} user={user} onDelete={requestDelete} />
        ))}

        {view && view.total === 0 && (
          <div className="card">
            {activeFilters.length || scope === "mine" ? (
              <EmptyState
                icon={<SearchX className="h-6 w-6" />}
                title={scope === "mine" && !activeFilters.length ? "You haven't posted any jobs" : "No jobs match these filters"}
                description={scope === "mine" && !activeFilters.length ? "Jobs you post appear here so you can edit or remove them." : "Try a broader skill or location, or clear the filters."}
                action={
                  scope === "mine" && !activeFilters.length ? (
                    <ButtonLink to="/app/jobs/new" icon={<Plus className="h-4 w-4" />}>Post a job</ButtonLink>
                  ) : (
                    <Button variant="secondary" onClick={clearAll}>Clear filters</Button>
                  )
                }
              />
            ) : (
              <EmptyState
                icon={<Briefcase className="h-6 w-6" />}
                title="No jobs posted yet"
                description="Post the first listing to start measuring skill demand."
                action={<ButtonLink to="/app/jobs/new" icon={<Plus className="h-4 w-4" />}>Post a job</ButtonLink>}
              />
            )}
          </div>
        )}
      </div>

      {view && (
        <div className="mt-8">
          <Pagination page={page} pages={view.pages} onChange={goToPage} />
        </div>
      )}
      {dialog}
    </>
  );
}
