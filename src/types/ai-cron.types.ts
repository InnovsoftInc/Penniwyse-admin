export interface AiCronJob {
  service: string;
  jobId: string;
  name: string;
  schedule: string;
  enabled: boolean;
  nextRun?: string;
  lastRun?: string;
}

export interface AiCronStatus {
  services: {
    [serviceName: string]: {
      running: boolean;
      jobCount: number;
    };
  };
  totalServices: number;
  totalJobs: number;
}

export interface AiCronJobsResponse {
  jobs: AiCronJob[];
  services: {
    [serviceName: string]: {
      running: boolean;
      jobs: AiCronJob[];
    };
  };
}

export interface TriggerCronJobRequest {
  service: string;
  jobId: string;
}

export interface TriggerCronJobResponse {
  success: boolean;
  message: string;
  jobId: string;
  service: string;
  timestamp: string;
}

export interface TriggerAllCronJobsRequest {
  service: string;
}

export interface TriggerAllCronJobsResponse {
  success: boolean;
  message: string;
  service: string;
  timestamp: string;
  results: Array<{
    jobId: string;
    success: boolean;
    message?: string;
    error?: string;
  }>;
  totalTriggered: number;
  successful: number;
  failed: number;
}

export interface PauseResumeResponse {
  success: boolean;
  message: string;
  service: string;
  timestamp: string;
}

// Backend response format (snake_case)
export interface CronJobExecutionRaw {
  id: number;
  job_id: string;
  job_name: string;
  service_name: string;
  status: 'success' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string | null;
  duration_seconds?: number | null;
  error_message?: string | null;
  execution_details?: Record<string, unknown> | null;
  created_at?: string;
}

// Frontend format (camelCase)
export interface CronJobExecution {
  id: number;
  jobId: string;
  jobName: string;
  serviceName: string;
  status: 'success' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string | null;
  durationSeconds?: number | null;
  errorMessage?: string | null;
  executionDetails?: Record<string, unknown> | null;
  createdAt?: string;
}

export interface CronExecutionHistoryQueryParams {
  serviceName?: string;
  jobId?: string;
  status?: 'success' | 'failed' | 'cancelled';
  limit?: number;
  offset?: number;
  startDate?: string; // ISO format
  endDate?: string; // ISO format
}

// Backend response format
export interface CronExecutionHistoryResponseRaw {
  executions: CronJobExecutionRaw[];
  count: number;
  limit: number;
  offset: number;
  filters?: {
    service_name?: string | null;
    job_id?: string | null;
    status?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  };
}

// Frontend response format
export interface CronExecutionHistoryResponse {
  executions: CronJobExecution[];
  total: number;
  limit: number;
  offset: number;
}

