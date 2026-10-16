import { useMemo, useState, type FormEvent } from "react";
import { Eye } from "lucide-react";
import { EXPERIENCE_LEVELS, JOB_TYPES, type Job, type JobInput, type User } from "@/lib/types";
import { Button } from "../ui/Button";
import { SelectField, TextAreaField, TextField } from "../ui/Field";
import { SkillInput } from "./SkillInput";
import { JobCard } from "./JobCard";

const EMPTY: JobInput = {
  title: "",
  company: "",
  location: "Remote",
  jobType: "Full-time",
  experience: "Entry Level",
  salary: "",
  skills: [],
  description: "",
  applyUrl: ""
};

type Errors = Partial<Record<keyof JobInput, string>>;

export function validateJob(v: JobInput): Errors {
  const e: Errors = {};
  if (!v.title.trim()) e.title = "Add a job title.";
  else if (v.title.trim().length > 100) e.title = "Keep the title under 100 characters.";
  if (!v.company.trim()) e.company = "Add the company name.";
  if (!v.skills.length) e.skills = "Add at least one skill so candidates can be matched.";
  if (v.applyUrl.trim() && !/^https?:\/\/\S+\.\S+/i.test(v.applyUrl.trim())) e.applyUrl = "Use a full link starting with https://";
  if (v.description.length > 4000) e.description = "Keep the description under 4,000 characters.";
  return e;
}

interface Props {
  initial?: Job;
  user: User | null;
  skillSuggestions: string[];
  submitLabel: string;
  submitting: boolean;
  serverError?: string | null;
  onSubmit: (input: JobInput) => void;
  onCancel: () => void;
}

export function JobForm({ initial, user, skillSuggestions, submitLabel, submitting, serverError, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<JobInput>(() =>
    initial
      ? {
          title: initial.title,
          company: initial.company,
          location: initial.location,
          jobType: initial.jobType,
          experience: initial.experience,
          salary: initial.salary === "Not specified" ? "" : initial.salary,
          skills: initial.skills,
          description: initial.description,
          applyUrl: initial.applyUrl
        }
      : EMPTY
  );
  const [touched, setTouched] = useState<Partial<Record<keyof JobInput, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => validateJob(values), [values]);
  const show = (k: keyof JobInput) => (submitted || touched[k] ? errors[k] : undefined);

  const set = <K extends keyof JobInput>(k: K, v: JobInput[K]) => setValues(prev => ({ ...prev, [k]: v }));
  const blur = (k: keyof JobInput) => () => setTouched(t => ({ ...t, [k]: true }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      const first = Object.keys(errors)[0];
      (document.querySelector<HTMLElement>(`[name="${first}"]`) || document.querySelector<HTMLElement>(`[data-name="${first}"] input`))?.focus();
      return;
    }
    onSubmit({
      ...values,
      title: values.title.trim(),
      company: values.company.trim(),
      location: values.location.trim() || "Remote",
      salary: values.salary.trim(),
      applyUrl: values.applyUrl.trim(),
      description: values.description.trim()
    });
  };

  const preview: Job = {
    _id: "preview",
    ...values,
    title: values.title || "Job title",
    company: values.company || "Company",
    salary: values.salary || "Not specified",
    location: values.location || "Remote",
    postedBy: null,
    postedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <form onSubmit={submit} noValidate className="card space-y-5 p-5 sm:p-7">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Job title" name="title" value={values.title} onChange={e => set("title", e.target.value)} onBlur={blur("title")} error={show("title")} placeholder="Frontend Developer" maxLength={100} required />
          <TextField label="Company" name="company" value={values.company} onChange={e => set("company", e.target.value)} onBlur={blur("company")} error={show("company")} placeholder="Acme Labs" required />
          <TextField label="Location" name="location" value={values.location} onChange={e => set("location", e.target.value)} placeholder="Bengaluru, or Remote" />
          <TextField label="Salary" name="salary" value={values.salary} onChange={e => set("salary", e.target.value)} placeholder="₹6–9 LPA" hint="Optional. Shown exactly as typed." />
          <SelectField label="Job type" name="jobType" value={values.jobType} onChange={e => set("jobType", e.target.value as JobInput["jobType"])}>
            {JOB_TYPES.map(t => (
              <option key={t}>{t}</option>
            ))}
          </SelectField>
          <SelectField label="Experience" name="experience" value={values.experience} onChange={e => set("experience", e.target.value)}>
            {[...new Set([...EXPERIENCE_LEVELS, values.experience])].map(t => (
              <option key={t}>{t}</option>
            ))}
          </SelectField>
        </div>

        <div data-name="skills">
          <SkillInput
            label="Required skills"
            value={values.skills}
            onChange={s => {
              set("skills", s);
              setTouched(t => ({ ...t, skills: true }));
            }}
            suggestions={skillSuggestions}
            error={show("skills")}
            hint="These drive skill-demand analytics and candidate matching."
          />
        </div>

        <TextAreaField
          label="Description"
          name="description"
          rows={6}
          value={values.description}
          onChange={e => set("description", e.target.value)}
          onBlur={blur("description")}
          error={show("description")}
          placeholder="What the role involves and who it's for"
          hint={`${values.description.length.toLocaleString()} / 4,000`}
        />

        <TextField
          label="Application link"
          name="applyUrl"
          type="url"
          inputMode="url"
          value={values.applyUrl}
          onChange={e => set("applyUrl", e.target.value)}
          onBlur={blur("applyUrl")}
          error={show("applyUrl")}
          placeholder="https://company.com/careers/role"
          hint="Optional. Where candidates apply."
        />

        {serverError && (
          <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
            {serverError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 border-t border-line pt-5 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {submitLabel}
          </Button>
        </div>
      </form>

      <aside className="lg:sticky lg:top-24 lg:self-start" aria-label="Preview">
        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-muted">
          <Eye className="h-4 w-4" aria-hidden /> How it will appear
        </p>
        <div className="pointer-events-none">
          <JobCard job={preview} user={user} />
        </div>
        {user && (
          <p className="mt-3 text-sm text-muted">
            The ring shows how well <em>your</em> profile matches this listing. Each candidate sees their own score.
          </p>
        )}
      </aside>
    </div>
  );
}
