export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'permanently_failed';

export interface S3FileInfo {
  fileId: string;
  filename: string;
  contentType: string;
  s3Key: string;
  storedAt: string;
  ttlSeconds?: number;
  ttlRemainingSeconds?: number;
}

export interface ProcessingJobInfo {
  jobId: string;
  userId: number;
  profileType: string;
  status: JobStatus;
  progress: number;
  currency?: string;
  filesData?: any[];
  filesStatus?: Record<string, any>;
  results?: any;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
}

export interface FilesAndJobsResponse {
  userId?: number | null; // Optional - null when returning all users' jobs
  files: S3FileInfo[];
  filesCount: number;
  jobs: ProcessingJobInfo[];
  jobsCount: number;
  timestamp: string;
  // Pagination metadata (optional, for when pagination is enabled)
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export interface FilesAndJobsQueryParams {
  userId?: number;
  page?: number;
  limit?: number;
}

