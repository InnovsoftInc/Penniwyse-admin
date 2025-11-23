export interface CronJob {
  name: string;
  enabled: boolean;
  schedule: string;
  timeZone: string;
  lastRun?: string;
  nextRun?: string;
}

export interface CronStatus {
  automatedChecks?: {
    enabled: boolean;
    schedule: string;
    timeZone: string;
  };
  recurringTransactions?: {
    dailyAnalysis?: {
      schedule: string;
      timeZone: string;
    };
    weeklyCleanup?: {
      schedule: string;
      timeZone: string;
    };
  };
  [key: string]: CronJob | { enabled: boolean; schedule: string; timeZone: string } | { dailyAnalysis?: { schedule: string; timeZone: string }; weeklyCleanup?: { schedule: string; timeZone: string } } | undefined;
}

export interface CronLog {
  id: number;
  jobName: string;
  status: 'running' | 'completed' | 'failed' | 'skipped';
  startedAt: string;
  completedAt?: string | null;
  duration?: number | null;
  error?: string;
  errorMessage?: string | null;
  errorStack?: string | null;
  metadata?: Record<string, unknown>;
  summary?: Record<string, unknown>;
  result?: Record<string, unknown>; // Legacy field
}

export interface CronLogQueryParams {
  jobName?: string;
  page?: number;
  limit?: number;
  status?: 'running' | 'completed' | 'failed' | 'skipped';
}

export interface CronStatistics {
  jobName: string;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  averageDuration: number;
  lastRun?: string;
}

export interface CronStatisticsQueryParams {
  jobName?: string;
  days?: number;
}

export interface TriggerJobResponse {
  success: boolean;
  message: string;
  timestamp: string;
  summary?: Record<string, unknown>;
  duration?: number;
}

export interface RunningJob {
  jobName: string;
  startedAt: string;
  pid?: number;
}

export interface CronJobInfo {
  id: string;
  name: string;
  description: string;
  schedule: string;
  triggerEndpoint?: string; // Manual trigger endpoint URL
  endpoint?: string; // Legacy field, use triggerEndpoint
  status?: {
    enabled?: boolean;
    environment?: string;
    [key: string]: unknown;
  };
}

export interface CronJobsResponse {
  jobs: CronJobInfo[];
  count?: number;
  enabledJobs?: number;
  disabledJobs?: number;
}

export interface CronSchedule {
  id: number;
  jobName: string;
  cronExpression: string;
  timeZone: string;
  isActive: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCronScheduleDto {
  jobName: string;
  cronExpression: string;
  timeZone?: string;
  isActive?: boolean;
  description?: string;
}

export interface UpdateCronScheduleDto {
  cronExpression?: string;
  timeZone?: string;
  isActive?: boolean;
  description?: string;
}

