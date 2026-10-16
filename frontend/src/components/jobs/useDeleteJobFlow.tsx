import { useState } from "react";
import type { Job } from "@/lib/types";
import { useDeleteJob } from "@/hooks/queries";
import { useToast } from "@/context/ToastContext";
import { ConfirmDialog } from "../ui/Dialog";

/** Shared "delete a job" flow: confirm dialog → API → toast. */
export function useDeleteJobFlow(onDeleted?: (job: Job) => void) {
  const [target, setTarget] = useState<Job | null>(null);
  const del = useDeleteJob();
  const toast = useToast();

  const confirm = () => {
    if (!target) return;
    del.mutate(target._id, {
      onSuccess: () => {
        toast({ title: "Job deleted", description: `${target.title} at ${target.company} was removed.` });
        onDeleted?.(target);
        setTarget(null);
      },
      onError: err => {
        toast({ tone: "error", title: "Couldn't delete job", description: (err as Error).message });
        setTarget(null);
      }
    });
  };

  const dialog = (
    <ConfirmDialog
      open={Boolean(target)}
      onClose={() => setTarget(null)}
      onConfirm={confirm}
      loading={del.isPending}
      title="Delete this job?"
      description={
        <>
          <strong>{target?.title}</strong> at {target?.company} will be removed for everyone, and its skills will no longer count
          toward market demand. This can't be undone.
        </>
      }
      confirmLabel="Delete job"
    />
  );

  return { requestDelete: setTarget, dialog };
}
