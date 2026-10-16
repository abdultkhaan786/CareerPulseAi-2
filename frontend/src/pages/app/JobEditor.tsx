import { useNavigate, useParams } from "react-router-dom";
import { Lock, SearchX } from "lucide-react";
import { useAuth, canManageJob } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useCreateJob, useJob, useSkillDemand, useUpdateJob } from "@/hooks/queries";
import { PageHeader } from "@/components/layout/AppShell";
import { JobForm } from "@/components/jobs/JobForm";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/States";
import { ApiError } from "@/lib/api";
import type { JobInput } from "@/lib/types";

function CreateJob() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const skills = useSkillDemand();
  const create = useCreateJob();

  const submit = (input: JobInput) =>
    create.mutate(input, {
      onSuccess: ({ job }) => {
        toast({ title: "Job posted", description: `${job.title} at ${job.company} is now live.` });
        navigate(`/app/jobs/${job._id}`);
      }
    });

  return (
    <>
      <PageHeader title="Post a job" description="Listings appear immediately and count toward skill-demand analytics." />
      <JobForm
        user={user}
        skillSuggestions={(skills.data ?? []).map(s => s.skill)}
        submitLabel="Post job"
        submitting={create.isPending}
        serverError={create.error?.message}
        onSubmit={submit}
        onCancel={() => navigate(-1)}
      />
    </>
  );
}

function EditJob({ id }: { id: string }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const skills = useSkillDemand();
  const job = useJob(id);
  const update = useUpdateJob(id);

  if (job.isPending) return <Skeleton className="h-[560px] w-full rounded-2xl" />;
  if (job.isError) {
    return (
      <div className="card">
        {job.error instanceof ApiError && job.error.status === 404 ? (
          <EmptyState icon={<SearchX className="h-6 w-6" />} title="This job isn't available" action={<ButtonLink to="/app/jobs">Browse jobs</ButtonLink>} />
        ) : (
          <ErrorState error={job.error} onRetry={() => job.refetch()} />
        )}
      </div>
    );
  }
  if (!canManageJob(user, job.data.postedBy)) {
    return (
      <div className="card">
        <EmptyState
          icon={<Lock className="h-6 w-6" />}
          title="You can't edit this job"
          description="Only the person who posted a job, or an admin, can change it."
          action={<ButtonLink to={`/app/jobs/${id}`} variant="secondary">View job</ButtonLink>}
        />
      </div>
    );
  }

  const submit = (input: JobInput) =>
    update.mutate(input, {
      onSuccess: ({ job: saved }) => {
        toast({ title: "Changes saved", description: `${saved.title} has been updated.` });
        navigate(`/app/jobs/${saved._id}`);
      }
    });

  return (
    <>
      <PageHeader title="Edit job" description={`${job.data.title} at ${job.data.company}`} />
      <JobForm
        key={job.data._id}
        initial={job.data}
        user={user}
        skillSuggestions={(skills.data ?? []).map(s => s.skill)}
        submitLabel="Save changes"
        submitting={update.isPending}
        serverError={update.error?.message}
        onSubmit={submit}
        onCancel={() => navigate(-1)}
      />
    </>
  );
}

export default function JobEditor() {
  const { id } = useParams();
  return id ? <EditJob id={id} /> : <CreateJob />;
}
