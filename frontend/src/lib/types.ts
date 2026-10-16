// Shapes returned by the CareerPulse backend

export const JOB_TYPES = ["Full-time", "Part-time", "Internship", "Contract"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const EXPERIENCE_LEVELS = ["Entry Level", "Mid Level", "Senior Level", "Lead"] as const;

export interface User {
  id: string;
  name: string;
  email: string;
  skills: string[];
  education: string;
  experience: number;
  preferredRole: string;
  isAdmin: boolean;
  createdAt?: string;
}

export interface Job {
  _id: string;
  title: string;
  company: string;
  location: string;
  jobType: JobType;
  experience: string;
  salary: string;
  skills: string[];
  description: string;
  applyUrl: string;
  postedDate: string;
  /** An id string in lists; { _id, name } on GET /jobs/:id; null for jobs created before ownership existed */
  postedBy: string | { _id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export type JobInput = Pick<
  Job,
  "title" | "company" | "location" | "jobType" | "experience" | "salary" | "skills" | "description" | "applyUrl"
>;

export interface SkillDemand {
  skill: string;
  demand: number;
}

export interface JobsResponse {
  count: number;
  jobs: Job[];
}

export interface SearchResponse extends JobsResponse {
  total: number;
  page: number;
  pages: number;
}

export interface SearchParams {
  title?: string;
  skill?: string;
  location?: string;
  jobType?: string;
  experience?: string;
  sort?: "newest" | "oldest" | "title" | "company";
  page?: number;
  limit?: number;
}

export interface RecommendationsResponse {
  user: string;
  currentSkills: string[];
  recommendedSkills: string[];
}

export interface ProfileInput {
  name?: string;
  skills?: string[];
  education?: string;
  experience?: number;
  preferredRole?: string;
}
