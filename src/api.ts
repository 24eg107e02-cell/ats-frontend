// Types and API client — mirrors the Spring Boot DTOs exactly.

export type Role = 'ADMIN' | 'RECRUITER' | 'CANDIDATE';
export type Stage = 'APPLIED' | 'SCREENING' | 'INTERVIEW' | 'OFFER' | 'HIRED';
export type AppStatus = 'ACTIVE' | 'REJECTED' | 'WITHDRAWN' | 'HIRED';
export type JobStatus = 'DRAFT' | 'OPEN' | 'CLOSED';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
export type InterviewMode = 'ONSITE' | 'VIDEO' | 'PHONE';

export const STAGES: Stage[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED'];

// Mirrors StageTransitionValidator on the backend (used only to show/hide buttons).
export const NEXT_STAGES: Record<Stage, Stage[]> = {
  APPLIED: ['SCREENING'],
  SCREENING: ['INTERVIEW', 'APPLIED'],
  INTERVIEW: ['OFFER', 'SCREENING'],
  OFFER: ['HIRED'],
  HIRED: [],
};

export interface AuthResponse { token: string | null; userId: number; email: string; fullName: string; role: Role }
export interface PageResponse<T> { content: T[]; page: number; size: number; totalElements: number; totalPages: number; last: boolean }

export interface Job {
  id: number; title: string; description: string; department: string | null; location: string | null;
  employmentType: EmploymentType; minExperience: number; maxExperience: number | null;
  minSalary: number | null; maxSalary: number | null; skills: string | null; status: JobStatus;
  openings: number; postedByName: string | null; closingDate: string | null; createdAt: string;
}
export interface JobRequest {
  title: string; description: string; department?: string; location?: string; employmentType: EmploymentType;
  minExperience: number; maxExperience?: number | null; minSalary?: number | null; maxSalary?: number | null;
  skills?: string; openings: number; closingDate?: string | null;
}
export interface Application {
  id: number; jobId: number; jobTitle: string; candidateId: number; candidateName: string;
  resumeId: number | null; coverLetter: string | null; currentStage: Stage; status: AppStatus;
  appliedAt: string; updatedAt: string;
}
export interface StageHistory { id: number; fromStage: Stage | null; toStage: Stage; changedByName: string; note: string | null; changedAt: string }
export interface Interview {
  id: number; applicationId: number; interviewerId: number; interviewerName: string;
  scheduledStart: string; scheduledEnd: string; mode: InterviewMode; locationOrLink: string | null;
  status: string; feedback: string | null; rating: number | null;
}
export interface InterviewRequest {
  interviewerId: number; scheduledStart: string; scheduledEnd: string; mode: InterviewMode; locationOrLink?: string;
}

// ---- chatbot ----
export interface ChatJobCard { id: number; title: string; location: string | null; employmentType: EmploymentType | null; minExperience: number; skills: string | null }
export interface ChatReply { reply: string; jobs: ChatJobCard[]; suggestions: string[] }
export interface JobMatch {
  jobId: number; title: string; location: string | null; employmentType: EmploymentType | null; minExperience: number;
  matchPercent: number; matchedSkills: string[]; missingSkills: string[]; note: string | null;
}
export interface ResumeMatchResponse { detectedSkills: string[]; estimatedYears: number | null; matches: JobMatch[]; message: string }

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
const TOKEN_KEY = 'ats_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = tokenStore.get();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  let res: Response;
  try {
    res = await fetch(BASE + path, { ...init, headers });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection or try again.');
  }
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }

  if (!res.ok) {
    // 401 on a protected call means the token is missing or expired.
    if (res.status === 401 && token && !path.startsWith('/api/auth/login')) onUnauthorized();
    const fields = data?.fieldErrors ? Object.values(data.fieldErrors).join('. ') : '';
    const msg = data?.message || fields || (res.status === 403 ? 'You do not have permission to do that.' : `Request failed (${res.status})`);
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

const qs = (params: Record<string, string | number | undefined | null>) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, String(v)); });
  const s = p.toString();
  return s ? `?${s}` : '';
};
const json = (body: unknown) => JSON.stringify(body);

export const api = {
  // auth
  login: (email: string, password: string) => request<AuthResponse>('/api/auth/login', { method: 'POST', body: json({ email, password }) }),
  register: (b: { email: string; password: string; fullName: string; phone?: string; role: Role }) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: json(b) }),
  me: () => request<AuthResponse>('/api/auth/me'),

  // jobs
  searchJobs: (p: { q?: string; location?: string; type?: string; maxExperience?: number | ''; status?: JobStatus; page?: number; size?: number }) =>
    request<PageResponse<Job>>('/api/jobs' + qs({ ...p, sort: 'createdAt,desc' })),
  getJob: (id: number | string) => request<Job>(`/api/jobs/${id}`),
  createJob: (b: JobRequest) => request<Job>('/api/jobs', { method: 'POST', body: json(b) }),
  updateJob: (id: number, b: JobRequest) => request<Job>(`/api/jobs/${id}`, { method: 'PUT', body: json(b) }),
  setJobStatus: (id: number, status: JobStatus) => request<Job>(`/api/jobs/${id}/status?status=${status}`, { method: 'PATCH' }),
  deleteJob: (id: number) => request<void>(`/api/jobs/${id}`, { method: 'DELETE' }),

  // applications
  apply: (jobId: number, b: { resumeId?: number | null; coverLetter?: string }) =>
    request<Application>(`/api/jobs/${jobId}/applications`, { method: 'POST', body: json(b) }),
  myApplications: (page = 0) => request<PageResponse<Application>>('/api/applications/mine' + qs({ page, size: 20, sort: 'appliedAt,desc' })),
  jobApplications: (jobId: number | string, p: { stage?: Stage; status?: AppStatus; page?: number; size?: number } = {}) =>
    request<PageResponse<Application>>(`/api/jobs/${jobId}/applications` + qs({ size: 100, sort: 'appliedAt,desc', ...p })),
  getApplication: (id: number | string) => request<Application>(`/api/applications/${id}`),
  history: (id: number | string) => request<StageHistory[]>(`/api/applications/${id}/history`),
  changeStage: (id: number, toStage: Stage, note?: string) =>
    request<Application>(`/api/applications/${id}/stage`, { method: 'PATCH', body: json({ toStage, note }) }),
  reject: (id: number, reason: string) => request<Application>(`/api/applications/${id}/reject`, { method: 'PATCH', body: json({ reason }) }),
  withdraw: (id: number) => request<Application>(`/api/applications/${id}/withdraw`, { method: 'PATCH' }),
  reopen: (id: number) => request<Application>(`/api/applications/${id}/reopen`, { method: 'PATCH' }),

  // resumes
  uploadResume: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<{ id: number; fileName: string }>('/api/resumes', { method: 'POST', body: fd });
  },
  downloadResume: async (id: number) => {
    const res = await fetch(`${BASE}/api/resumes/${id}/download`, { headers: { Authorization: `Bearer ${tokenStore.get()}` } });
    if (!res.ok) throw new ApiError(res.status, res.status === 403 ? 'You cannot download this resume.' : 'Could not download the resume.');
    const cd = res.headers.get('Content-Disposition') || '';
    const name = /filename="?([^"]+)"?/.exec(cd)?.[1] || `resume-${id}.pdf`;
    const url = URL.createObjectURL(await res.blob());
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  },

  // chatbot
  chatMessage: (message: string) => request<ChatReply>('/api/chat/message', { method: 'POST', body: json({ message }) }),
  chatResumeMatch: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<ResumeMatchResponse>('/api/chat/resume-match', { method: 'POST', body: fd });
  },

  // interviews
  schedule: (applicationId: number, b: InterviewRequest) =>
    request<Interview>(`/api/applications/${applicationId}/interviews`, { method: 'POST', body: json(b) }),
  reschedule: (id: number, b: InterviewRequest) => request<Interview>(`/api/interviews/${id}`, { method: 'PATCH', body: json(b) }),
  feedback: (id: number, feedback: string, rating?: number) =>
    request<Interview>(`/api/interviews/${id}/feedback`, { method: 'PATCH', body: json({ feedback, rating }) }),
  cancelInterview: (id: number) => request<void>(`/api/interviews/${id}`, { method: 'DELETE' }),
};

// ---- formatting helpers ----
export const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
export const fmtSalary = (min: number | null, max: number | null) => {
  const f = (n: number) => (n >= 100000 ? `${(n / 100000).toFixed(n % 100000 ? 1 : 0)}L` : n.toLocaleString());
  if (min && max) return `₹${f(min)} – ₹${f(max)}`;
  if (min) return `from ₹${f(min)}`;
  if (max) return `up to ₹${f(max)}`;
  return null;
};

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');
