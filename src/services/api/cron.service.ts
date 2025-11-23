import { apiClient } from '../apiClient';
import type {
  CronStatus,
  CronLog,
  CronLogQueryParams,
  CronStatistics,
  CronStatisticsQueryParams,
  TriggerJobResponse,
  RunningJob,
  CronJobInfo,
  CronJobsResponse,
  CronSchedule,
  CreateCronScheduleDto,
  UpdateCronScheduleDto,
} from '../../types/cron.types';

class CronService {
  // Get list of all available cron jobs
  async getCronJobs(): Promise<CronJobsResponse> {
    const response = await apiClient.getClient().get<CronJobsResponse>('/api/admin/cron/jobs');
    // Normalize the response - ensure jobs array exists and map endpoint to triggerEndpoint if needed
    const data = response.data;
    if (data.jobs && Array.isArray(data.jobs)) {
      // Map legacy 'endpoint' field to 'triggerEndpoint' if needed
      data.jobs = data.jobs.map(job => ({
        ...job,
        triggerEndpoint: job.triggerEndpoint || job.endpoint,
      }));
    }
    return {
      jobs: data.jobs || [],
      count: data.count,
      enabledJobs: data.enabledJobs,
      disabledJobs: data.disabledJobs,
    };
  }

  // Get cron logs (with pagination support)
  async getLogs(params?: CronLogQueryParams): Promise<CronLog[] | { logs: CronLog[]; count: number; filters: unknown }> {
    const response = await apiClient.getClient().get<{ logs: CronLog[]; count: number; filters: unknown } | CronLog[]>(
      '/api/admin/cron/logs',
      { params }
    );
    return response.data;
  }

  // Get cron statistics
  async getStatistics(params?: CronStatisticsQueryParams): Promise<CronStatistics[] | { statistics: CronStatistics[]; period: unknown }> {
    const response = await apiClient.getClient().get<{ statistics: CronStatistics[]; period: unknown } | CronStatistics[]>(
      '/api/admin/cron/statistics',
      { params }
    );
    return response.data;
  }

  // Get currently running jobs
  async getRunningJobs(): Promise<RunningJob[] | { runningJobs: RunningJob[]; count: number }> {
    const response = await apiClient.getClient().get<{ runningJobs: RunningJob[]; count: number } | RunningJob[]>(
      '/api/admin/cron/running'
    );
    return response.data;
  }

  // Trigger individual cron jobs
  async triggerBillReminders(): Promise<TriggerJobResponse> {
    const response = await apiClient.getClient().post<TriggerJobResponse>('/api/admin/cron/jobs/bill-reminders/trigger');
    return response.data;
  }

  async triggerReminderChecks(): Promise<TriggerJobResponse> {
    const response = await apiClient.getClient().post<TriggerJobResponse>('/api/admin/cron/jobs/reminder-checks/trigger');
    return response.data;
  }

  async triggerBudgetAlerts(): Promise<TriggerJobResponse> {
    const response = await apiClient.getClient().post<TriggerJobResponse>('/api/admin/cron/jobs/budget-alerts/trigger');
    return response.data;
  }

  async triggerSavingsGoalsRecalculation(): Promise<TriggerJobResponse> {
    const response = await apiClient.getClient().post<TriggerJobResponse>('/api/admin/cron/jobs/savings-goals-recalculate/trigger');
    return response.data;
  }

  async triggerRecurringTransactionDetection(): Promise<TriggerJobResponse> {
    const response = await apiClient.getClient().post<TriggerJobResponse>('/api/admin/cron/jobs/recurring-transaction-detection/trigger');
    return response.data;
  }

  async triggerBillCategorization(): Promise<TriggerJobResponse> {
    const response = await apiClient.getClient().post<TriggerJobResponse>('/api/admin/cron/jobs/bills-categorize/trigger');
    return response.data;
  }

  async triggerTestDataGeneration(): Promise<TriggerJobResponse> {
    const response = await apiClient.getClient().post<TriggerJobResponse>('/api/admin/cron/jobs/test-data-generation/trigger');
    return response.data;
  }

  async triggerComprehensiveNotifications(): Promise<TriggerJobResponse> {
    const response = await apiClient.getClient().post<TriggerJobResponse>('/api/admin/cron/jobs/comprehensive-notifications/trigger');
    return response.data;
  }

  // Generic trigger method - accepts job ID and uses the trigger endpoint
  async triggerJob(jobId: string, triggerEndpoint?: string): Promise<TriggerJobResponse> {
    // If triggerEndpoint is provided, use it directly
    if (triggerEndpoint) {
      // Extract the endpoint path if it's a full URL
      const endpoint = triggerEndpoint.startsWith('http') 
        ? new URL(triggerEndpoint).pathname 
        : triggerEndpoint.startsWith('/') 
          ? triggerEndpoint 
          : `/api/admin/cron/jobs/${triggerEndpoint}`;
      const response = await apiClient.getClient().post<TriggerJobResponse>(endpoint);
      return response.data;
    }
    // Otherwise, construct the endpoint from jobId
    const endpoint = `/api/admin/cron/jobs/${jobId}/trigger`;
    const response = await apiClient.getClient().post<TriggerJobResponse>(endpoint);
    return response.data;
  }

  // Legacy methods for backward compatibility
  async triggerRecurringTransactionsAnalysis(): Promise<TriggerJobResponse> {
    return this.triggerRecurringTransactionDetection();
  }

  async triggerAutomatedChecks(): Promise<TriggerJobResponse> {
    return this.triggerComprehensiveNotifications();
  }

  // Legacy status endpoint - deprecated, use getCronJobs() instead
  // Kept for backward compatibility but returns empty object
  async getStatus(): Promise<CronStatus> {
    // This endpoint is deprecated - the new admin API uses getCronJobs() instead
    // Return empty status to avoid errors
    return {};
  }

  // Cron Schedule Management
  async getSchedules(): Promise<CronSchedule[]> {
    const response = await apiClient.getClient().get<{ success: boolean; schedules: CronSchedule[]; count: number } | CronSchedule[]>('/api/admin/cron/schedules');
    // Handle both response formats: direct array or { success, schedules, count }
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && typeof response.data === 'object' && 'schedules' in response.data) {
      return Array.isArray((response.data as any).schedules) ? (response.data as any).schedules : [];
    }
    return [];
  }

  async getScheduleByJobName(jobName: string): Promise<CronSchedule> {
    const response = await apiClient.getClient().get<CronSchedule>(`/api/admin/cron/schedules/${jobName}`);
    return response.data;
  }

  async createOrUpdateSchedule(data: CreateCronScheduleDto): Promise<CronSchedule> {
    const response = await apiClient.getClient().post<CronSchedule>('/api/admin/cron/schedules', data);
    return response.data;
  }

  async updateSchedule(jobName: string, data: UpdateCronScheduleDto): Promise<CronSchedule> {
    const response = await apiClient.getClient().put<CronSchedule>(`/api/admin/cron/schedules/${jobName}`, data);
    return response.data;
  }

  async deleteSchedule(jobName: string): Promise<{ message: string }> {
    const response = await apiClient.getClient().delete<{ message: string }>(`/api/admin/cron/schedules/${jobName}`);
    return response.data;
  }

  async initializeSchedules(): Promise<{ message: string }> {
    const response = await apiClient.getClient().post<{ message: string }>('/api/admin/cron/schedules/initialize');
    return response.data;
  }
}

export const cronService = new CronService();

