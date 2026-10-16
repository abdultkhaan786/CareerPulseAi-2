import { memo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Clock, MapPin, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import type { Job, User } from "@/lib/types";
import { matchScore, norm } from "@/lib/skills";
import { cx, timeAgo } from "@/lib/format";
import { canManageJob } from "@/context/AuthContext";
import { MatchRing } from "./MatchRing";
import { Menu } from "../ui/Menu";

export function SkillChips({ skills, userSkills, limit }: { skills: string[]; userSkills?: string[]; limit?: number }) {
  const have = new Set((userSkills || []).map(norm));
  const shown = limit ? skills.slice(0, limit) : skills;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Skills">
      {shown.map(s => {
        const mine = userSkills && have.has(norm(s));
        return (
          <li
            key={s}
            className={cx(
              "rounded-md px-2 py-0.5 text-xs font-medium",
              !userSkills ? "bg-line/60 text-ink" : mine ? "bg-signal-soft text-ink" : "bg-ember-soft text-ink"
            )}
            title={userSkills ? (mine ? "On your profile" : "Not on your profile yet") : undefined}
          >
            {s}
          </li>
        );
      })}
      {limit && skills.length > limit && <li className="px-1 text-xs text-muted">+{skills.length - limit} more</li>}
    </ul>
  );
}

interface Props {
  job: Job;
  user: User | null;
  onDelete?: (job: Job) => void;
  compact?: boolean;
}

export const JobCard = memo(function JobCard({ job, user, onDelete, compact }: Props) {
  const navigate = useNavigate();
  // No ring/colouring until the user has added skills; a 0 on every card is noise
  const userSkills = user?.skills.length ? user.skills : undefined;
  const score = userSkills ? matchScore(job.skills, userSkills) : null;
  const manage = canManageJob(user, job.postedBy);
  const salary = job.salary && job.salary !== "Not specified" ? job.salary : null;

  return (
    <article
      className={cx(
        "group relative flex gap-4 transition",
        compact ? "py-3.5" : "card p-4 hover:-translate-y-0.5 hover:shadow-lift sm:p-5"
      )}
    >
      {userSkills && <MatchRing score={score} size={compact ? 42 : 52} />}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-[17px] font-bold leading-snug">
              <Link to={`/app/jobs/${job._id}`} className="outline-none after:absolute after:inset-0 after:rounded-2xl hover:text-signal focus-visible:underline">
                {job.title}
              </Link>
            </h3>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span className="font-medium text-ink">{job.company}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                {job.location}
              </span>
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" aria-hidden />
                {job.jobType}
              </span>
              {!compact && <span>{job.experience}</span>}
            </p>
          </div>
          <div className="flex shrink-0 items-start gap-1">
            <div className="hidden text-right sm:block">
              {salary && <p className="num text-sm font-semibold">{salary}</p>}
              <p className="inline-flex items-center gap-1 text-xs text-muted">
                <Clock className="h-3 w-3" aria-hidden />
                {timeAgo(job.createdAt || job.postedDate)}
              </p>
            </div>
            {manage && !compact && onDelete && (
              <div className="relative z-10 -mr-2 -mt-1">
                <Menu
                  label={`Actions for ${job.title}`}
                  trigger={
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-line/50 hover:text-ink">
                      <MoreHorizontal className="h-5 w-5" />
                    </span>
                  }
                  items={[
                    { label: "Edit job", icon: <Pencil className="h-4 w-4" />, onSelect: () => navigate(`/app/jobs/${job._id}/edit`) },
                    { label: "Delete job", icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => onDelete(job) }
                  ]}
                />
              </div>
            )}
          </div>
        </div>
        {!compact && job.skills.length > 0 && (
          <div className="mt-3">
            <SkillChips skills={job.skills} userSkills={userSkills} limit={8} />
          </div>
        )}
        <p className="mt-2 flex gap-3 text-xs text-muted sm:hidden">
          {salary && <span className="font-semibold text-ink">{salary}</span>}
          <span>{timeAgo(job.createdAt || job.postedDate)}</span>
        </p>
      </div>
    </article>
  );
});
