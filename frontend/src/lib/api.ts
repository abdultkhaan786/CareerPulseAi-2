import type {
  Job,
  JobInput,
  JobsResponse,
  ProfileInput,
  RecommendationsResponse,
  SearchParams,
  SearchResponse,
  SkillDemand,
  User
} from "./types";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

const TOKEN_KEY = "cp_token";

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string | null) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable (private mode) — session lasts until reload */
    }
  }
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
  get isNetwork() {
    return this.status === 0;
  }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler = () => {};
export const setUnauthorizedHandler = (fn: UnauthorizedHandler) => {
  onUnauthorized = fn;
};

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

async function request<T>(path: string, { method = "GET", body, auth = false, signal }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = tokenStore.get();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError(
      navigator.onLine ? "Can't reach the CareerPulse server. Check that the backend is running." : "You're offline. Reconnect to load the latest data.",
      0
    );
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (!res.ok) {
    if (res.status === 401 && auth && token) onUnauthorized();
    const message = (data as { message?: string } | null)?.message || `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

function toQuery(params: Record<string, unknown>) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

export const api = {
  auth: {
    register: (input: { name: string; email: string; password: string }) =>
      request<{ message: string; user: Pick<User, "id" | "name" | "email"> }>("/auth/register", { method: "POST", body: input }),
    login: (input: { email: string; password: string }) =>
      request<{ message: string; token: string; user: Partial<User> }>("/auth/login", { method: "POST", body: input }),
    me: () => request<{ user: User }>("/auth/me", { auth: true }),
    updateProfile: (input: ProfileInput) =>
      request<{ message: string; user: User }>("/auth/profile", { method: "PUT", body: input, auth: true }),
    changePassword: (input: { currentPassword: string; newPassword: string }) =>
      request<{ message: string }>("/auth/password", { method: "PUT", body: input, auth: true })
  },
  jobs: {
    list: (signal?: AbortSignal) => request<JobsResponse>("/jobs", { signal }),
    search: (params: SearchParams, signal?: AbortSignal) =>
      request<SearchResponse>(`/jobs/search${toQuery({ ...params })}`, { signal }),
    get: (id: string, signal?: AbortSignal) => request<{ job: Job }>(`/jobs/${encodeURIComponent(id)}`, { signal }),
    create: (input: JobInput) => request<{ message: string; job: Job }>("/jobs", { method: "POST", body: input, auth: true }),
    update: (id: string, input: Partial<JobInput>) =>
      request<{ message: string; job: Job }>(`/jobs/${encodeURIComponent(id)}`, { method: "PUT", body: input, auth: true }),
    remove: (id: string) => request<{ message: string }>(`/jobs/${encodeURIComponent(id)}`, { method: "DELETE", auth: true })
  },
  analytics: {
    skills: (signal?: AbortSignal) => request<{ count: number; skills: SkillDemand[] }>("/analytics/skills", { signal })
  },
  recommendations: {
    forUser: (userId: string, signal?: AbortSignal) =>
      request<RecommendationsResponse>(`/recommendations/${encodeURIComponent(userId)}`, { signal })
  }
};
