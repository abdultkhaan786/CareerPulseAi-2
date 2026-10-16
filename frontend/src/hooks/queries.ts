import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { JobInput, ProfileInput, SearchParams } from "@/lib/types";

const LIVE = 30_000; // refresh market data every 30s while the tab is visible

export const keys = {
  me: ["me"] as const,
  jobs: ["jobs"] as const,
  jobList: ["jobs", "list"] as const,
  jobSearch: (p: SearchParams) => ["jobs", "search", p] as const,
  job: (id: string) => ["jobs", "detail", id] as const,
  skills: ["skills"] as const,
  recommendations: (id: string) => ["recommendations", id] as const
};

export function useJobs() {
  return useQuery({
    queryKey: keys.jobList,
    queryFn: ({ signal }) => api.jobs.list(signal),
    select: d => d.jobs,
    refetchInterval: LIVE
  });
}

export function useJobSearch(params: SearchParams, enabled = true) {
  return useQuery({
    queryKey: keys.jobSearch(params),
    queryFn: ({ signal }) => api.jobs.search(params, signal),
    placeholderData: keepPreviousData,
    refetchInterval: LIVE,
    enabled
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: keys.job(id),
    queryFn: ({ signal }) => api.jobs.get(id, signal),
    select: d => d.job,
    retry: (count, err) => (err as { status?: number }).status !== 404 && count < 2
  });
}

export function useSkillDemand() {
  return useQuery({
    queryKey: keys.skills,
    queryFn: ({ signal }) => api.analytics.skills(signal),
    select: d => d.skills,
    refetchInterval: LIVE
  });
}

export function useRecommendations(userId?: string) {
  return useQuery({
    queryKey: keys.recommendations(userId || ""),
    queryFn: ({ signal }) => api.recommendations.forUser(userId!, signal),
    enabled: Boolean(userId)
  });
}

/** Any change to jobs also changes skill demand and recommendations. */
function useInvalidateMarket() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: keys.jobs }),
      qc.invalidateQueries({ queryKey: keys.skills }),
      qc.invalidateQueries({ queryKey: ["recommendations"] })
    ]);
}

export function useCreateJob() {
  const invalidate = useInvalidateMarket();
  return useMutation({
    mutationFn: (input: JobInput) => api.jobs.create(input),
    onSuccess: () => invalidate()
  });
}

export function useUpdateJob(id: string) {
  const invalidate = useInvalidateMarket();
  return useMutation({
    mutationFn: (input: Partial<JobInput>) => api.jobs.update(id, input),
    onSuccess: () => invalidate()
  });
}

export function useDeleteJob() {
  const qc = useQueryClient();
  const invalidate = useInvalidateMarket();
  return useMutation({
    mutationFn: (id: string) => api.jobs.remove(id),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: keys.job(id) });
      return invalidate();
    }
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => api.auth.updateProfile(input),
    onSuccess: data => {
      qc.setQueryData(keys.me, { user: data.user });
      return qc.invalidateQueries({ queryKey: ["recommendations"] });
    }
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) => api.auth.changePassword(input)
  });
}
