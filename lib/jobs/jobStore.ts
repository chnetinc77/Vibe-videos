export type JobStatus =
  | "QUEUED"
  | "WRITING_SCRIPT"
  | "SCRIPT_READY"
  | "PLANNING_SCENES"
  | "COLLECTING_VISUALS"
  | "GENERATING_VOICE"
  | "RENDERING"
  | "COMPLETED"
  | "FAILED";

export interface JobRecord {
  jobId: string;
  status: JobStatus;
  title?: string;
  script?: string;
  durationSeconds?: number;
  error?: string;
  createdAt: number;
  updatedAt: number;
}

const jobs = new Map<string, JobRecord>();

export function createJob(jobId: string): JobRecord {
  const record: JobRecord = {
    jobId,
    status: "QUEUED",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  jobs.set(jobId, record);
  return record;
}

export function updateJob(jobId: string, patch: Partial<JobRecord>): void {
  const existing = jobs.get(jobId);
  if (!existing) return;
  jobs.set(jobId, { ...existing, ...patch, updatedAt: Date.now() });
}

export function getJob(jobId: string): JobRecord | undefined {
  return jobs.get(jobId);
}
