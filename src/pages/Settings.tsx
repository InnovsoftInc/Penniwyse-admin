import { useState, useEffect } from 'react';
import { RefreshCw, Clock, Eye, Plus, Edit, Trash2, Play, Pause, PlayCircle, Bell } from 'lucide-react';
import { Card, Button, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination, Modal, Select } from '../components/ui';
import { cronService } from '../services/api/cron.service';
import { dashboardService } from '../services/api/dashboard.service';
import { filesJobsService } from '../services/api/files-jobs.service';
import { pushNotificationsService } from '../services/api/push-notifications.service';
import { ScheduleForm } from '../components/features/cron';
import type { CronStatus, CronLog, CronJobInfo, CronSchedule, CreateCronScheduleDto, UpdateCronScheduleDto } from '../types/cron.types';
import type { AiCronJobsResponse, AiCronStatus, CronJobExecution, CronExecutionHistoryQueryParams } from '../types/ai-cron.types';
import type { PushNotificationLog, PushNotificationStatus, PushLogsQueryParams } from '../types/push-notification.types';
import { formatDateTime } from '../utils/formatters';

export function Settings() {
  const [activeTab, setActiveTab] = useState<'general' | 'cron-schedules' | 'cron-jobs' | 'cron-logs' | 'ai-cron-jobs' | 'ai-logs' | 'push-logs'>('general');
  
  const [, setCronStatus] = useState<CronStatus | null>(null);
  const [recentLogs, setRecentLogs] = useState<CronLog[]>([]);
  const [cronJobs, setCronJobs] = useState<CronJobInfo[]>([]);
  const [cronJobsStats] = useState<{ count?: number; enabledJobs?: number; disabledJobs?: number }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serviceToken, setServiceToken] = useState<string>('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [selectedLog, setSelectedLog] = useState<CronLog | null>(null);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [triggeringJobId, setTriggeringJobId] = useState<string | null>(null);
  
  // Cron schedules state
  const [cronSchedules, setCronSchedules] = useState<CronSchedule[]>([]);
  const [isSchedulesLoading, setIsSchedulesLoading] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<CronSchedule | null>(null);
  const [isScheduleActionLoading, setIsScheduleActionLoading] = useState(false);

  // AI Cron Jobs state
  const [aiCronJobs, setAiCronJobs] = useState<AiCronJobsResponse | null>(null);
  const [aiCronStatus, setAiCronStatus] = useState<AiCronStatus | null>(null);
  const [isAiCronLoading, setIsAiCronLoading] = useState(false);
  const [triggeringAiJob, setTriggeringAiJob] = useState<{ service: string; jobId: string } | null>(null);
  const [triggeringAllAiJobs, setTriggeringAllAiJobs] = useState<string | null>(null);
  const [pausingService, setPausingService] = useState<string | null>(null);
  const [resumingService, setResumingService] = useState<string | null>(null);
  
  // AI Cron Execution History state
  const [executionHistory, setExecutionHistory] = useState<CronJobExecution[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState<CronExecutionHistoryQueryParams>({
    limit: 50,
    offset: 0,
  });
  const [historyPagination, setHistoryPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [selectedExecution, setSelectedExecution] = useState<CronJobExecution | null>(null);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);

  // Push Notification Logs state
  const [pushLogs, setPushLogs] = useState<PushNotificationLog[]>([]);
  const [isPushLogsLoading, setIsPushLogsLoading] = useState(false);
  const [pushLogsFilters, setPushLogsFilters] = useState<PushLogsQueryParams>({
    limit: 100,
    offset: 0,
  });
  const [pushLogsPagination, setPushLogsPagination] = useState({ total: 0, page: 1, limit: 100, totalPages: 1 });
  const [selectedPushLog, setSelectedPushLog] = useState<PushNotificationLog | null>(null);
  const [isPushLogModalOpen, setIsPushLogModalOpen] = useState(false);

  useEffect(() => {
    if (activeTab === 'cron-logs' || activeTab === 'cron-jobs') {
    loadSettings();
    }
    if (activeTab === 'cron-schedules') {
      loadSchedules();
    }
    if (activeTab === 'ai-cron-jobs') {
      loadAiCronJobs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, activeTab]);
  
  useEffect(() => {
    if (activeTab === 'ai-logs') {
      loadExecutionHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, historyPagination.page, historyPagination.limit, historyFilters.serviceName, historyFilters.status, historyFilters.jobId]);

  useEffect(() => {
    if (activeTab === 'push-logs') {
      loadPushLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, pushLogsPagination.page, pushLogsPagination.limit, pushLogsFilters.userId, pushLogsFilters.status, pushLogsFilters.startDate, pushLogsFilters.endDate]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [jobsResponse, logsResponse] = await Promise.all([
        cronService.getCronJobs().catch((err) => {
          if (err?.response?.status === 404) {
            console.warn('Cron jobs endpoint not available yet.');
            return { jobs: [], count: 0, enabledJobs: 0, disabledJobs: 0 };
          }
          return { jobs: [], count: 0, enabledJobs: 0, disabledJobs: 0 };
        }),
        cronService.getLogs({ page: pagination.page, limit: pagination.limit }).catch((err) => {
          // Handle 404 if backend endpoints aren't implemented yet
          if (err?.response?.status === 404) {
            console.warn('Admin cron endpoints not available yet. Backend needs to implement /api/admin/cron/* endpoints.');
            return { logs: [], count: 0, filters: {} };
          }
          return { logs: [], count: 0, filters: {} };
        }),
        dashboardService.getSystemHealth().catch(() => null),
      ]);

      console.log('Settings: logsResponse:', logsResponse);
      console.log('Settings: logsResponse is array?', Array.isArray(logsResponse));
      
      // Handle different response formats (new admin API returns { logs, count, filters })
      let logsArray: CronLog[] = [];
      let paginationData = { total: 0, page: pagination.page, limit: pagination.limit, totalPages: 1 };
      
      if (Array.isArray(logsResponse)) {
        logsArray = logsResponse;
        paginationData = {
          total: logsResponse.length,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil(logsResponse.length / pagination.limit),
        };
      } else if (logsResponse && typeof logsResponse === 'object' && 'logs' in logsResponse) {
        // New admin API format: { logs: CronLog[], count: number, filters: {...} }
        const responseObj = logsResponse as { logs: CronLog[]; count: number; filters?: unknown };
        logsArray = Array.isArray(responseObj.logs) ? responseObj.logs : [];
        paginationData = {
          total: responseObj.count || logsArray.length,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: Math.ceil((responseObj.count || logsArray.length) / pagination.limit),
        };
      } else if (logsResponse && typeof logsResponse === 'object') {
        // Check for other paginated response formats
        const responseObj = logsResponse as { 
          items?: CronLog[]; 
          data?: CronLog[];
          meta?: { total: number; page: number; limit: number; totalPages: number };
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
        };
        
        if (Array.isArray(responseObj.items)) {
          logsArray = responseObj.items;
          if (responseObj.meta) {
            paginationData = responseObj.meta;
          }
        } else if (Array.isArray(responseObj.data)) {
          logsArray = responseObj.data;
          if (responseObj.total !== undefined) {
            paginationData = {
              total: responseObj.total,
              page: responseObj.page || pagination.page,
              limit: responseObj.limit || pagination.limit,
              totalPages: responseObj.totalPages || Math.ceil((responseObj.total || logsArray.length) / (responseObj.limit || pagination.limit)),
            };
          }
        }
      }
      
      console.log('Settings: Setting recentLogs to:', logsArray);
      console.log('Settings: Pagination data:', paginationData);
      console.log('Settings: Cron jobs:', jobsResponse.jobs);
      
      // Set cron jobs list
      setCronJobs(Array.isArray(jobsResponse.jobs) ? jobsResponse.jobs : []);
      
      // Note: cronStatus is deprecated - new admin API doesn't have a status endpoint
      // We use cronJobs list instead
      setCronStatus(null);
      setRecentLogs(logsArray);
      setPagination(paginationData);
      
      // Get service token from env (masked)
      const token = import.meta.env.VITE_SERVICE_TOKEN || '';
      setServiceToken(token ? `${token.substring(0, 8)}...` : 'Not configured');
    } catch (err) {
      setError('Failed to load settings');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSchedules = async () => {
    try {
      setIsSchedulesLoading(true);
      const schedules = await cronService.getSchedules();
      // Ensure schedules is always an array
      if (Array.isArray(schedules)) {
        setCronSchedules(schedules);
      } else if (schedules && typeof schedules === 'object' && 'items' in schedules) {
        // Handle paginated response
        setCronSchedules(Array.isArray((schedules as any).items) ? (schedules as any).items : []);
      } else {
        setCronSchedules([]);
      }
    } catch (err) {
      console.error('Failed to load cron schedules:', err);
      setCronSchedules([]);
    } finally {
      setIsSchedulesLoading(false);
    }
  };

  const handleOpenScheduleModal = (schedule?: CronSchedule) => {
    setEditingSchedule(schedule || null);
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (data: CreateCronScheduleDto | UpdateCronScheduleDto) => {
    try {
      setIsScheduleActionLoading(true);
      if (editingSchedule) {
        await cronService.updateSchedule(editingSchedule.jobName, data as UpdateCronScheduleDto);
      } else {
        await cronService.createOrUpdateSchedule(data as CreateCronScheduleDto);
      }
      setIsScheduleModalOpen(false);
      setEditingSchedule(null);
      await loadSchedules();
      await loadSettings(); // Reload jobs to get updated schedules
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to save schedule';
      alert(`Error: ${errorMessage}`);
      throw err;
    } finally {
      setIsScheduleActionLoading(false);
    }
  };

  const handleDeleteSchedule = async (jobName: string) => {
    if (!confirm(`Are you sure you want to delete the schedule for "${jobName}"?`)) return;
    try {
      setIsScheduleActionLoading(true);
      await cronService.deleteSchedule(jobName);
      await loadSchedules();
      await loadSettings();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to delete schedule';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsScheduleActionLoading(false);
    }
  };

  const handleInitializeSchedules = async () => {
    if (!confirm('This will initialize default schedules for all cron jobs. Continue?')) return;
    try {
      setIsScheduleActionLoading(true);
      await cronService.initializeSchedules();
      await loadSchedules();
      await loadSettings();
      alert('Default schedules initialized successfully');
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to initialize schedules';
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsScheduleActionLoading(false);
    }
  };

  const handleTriggerJob = async (jobName: string) => {
    try {
      setTriggeringJobId(jobName);
      setError(null);
      let response;
      
      // First, try to find the job in cronJobs and use its triggerEndpoint
      const job = cronJobs.find(j => j.id === jobName);
      if (job && job.triggerEndpoint) {
        // Use the generic trigger method with the endpoint from the API
        response = await cronService.triggerJob(jobName, job.triggerEndpoint);
      } else {
        // Fall back to hardcoded switch for backward compatibility
        switch (jobName) {
          case 'bill-reminders':
            response = await cronService.triggerBillReminders();
            break;
          case 'reminder-checks':
            response = await cronService.triggerReminderChecks();
            break;
          case 'budget-alerts':
            response = await cronService.triggerBudgetAlerts();
            break;
          case 'savings-goals-recalculate':
            response = await cronService.triggerSavingsGoalsRecalculation();
            break;
          case 'recurring-transactions':
          case 'recurring-transaction-detection':
            response = await cronService.triggerRecurringTransactionDetection();
            break;
          case 'bills-categorize':
            response = await cronService.triggerBillCategorization();
            break;
          case 'test-data-generation':
            response = await cronService.triggerTestDataGeneration();
            break;
          case 'comprehensive-notifications':
          case 'automated-checks':
            response = await cronService.triggerComprehensiveNotifications();
            break;
          default:
            // If no match, try the generic endpoint
            response = await cronService.triggerJob(jobName);
            break;
        }
      }
      alert(`Job triggered: ${response.message || 'Success'}`);
      // Reload logs to show the new execution
      loadSettings();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || `Failed to trigger ${jobName}`;
      setError(errorMessage);
      console.error('Error triggering job:', err);
      alert(`Error: ${errorMessage}`);
    } finally {
      setTriggeringJobId(null);
    }
  };

  const loadAiCronJobs = async () => {
    try {
      setIsAiCronLoading(true);
      setError(null);
      const [jobsResponse, statusResponse] = await Promise.all([
        filesJobsService.getAiCronJobs().catch((err) => {
          console.warn('AI cron jobs endpoint not available:', err);
          return { jobs: [], services: {} };
        }),
        filesJobsService.getAiCronStatus().catch((err) => {
          console.warn('AI cron status endpoint not available:', err);
          return { services: {}, totalServices: 0, totalJobs: 0 };
        }),
      ]);
      setAiCronJobs(jobsResponse);
      setAiCronStatus(statusResponse);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load AI cron jobs';
      setError(errorMessage);
      console.error('Error loading AI cron jobs:', err);
    } finally {
      setIsAiCronLoading(false);
    }
  };

  const handleTriggerAiJob = async (service: string, jobId: string) => {
    try {
      setTriggeringAiJob({ service, jobId });
      setError(null);
      const response = await filesJobsService.triggerAiCronJob({ service, jobId });
      alert(`Job triggered: ${response.message || 'Success'}`);
      await loadAiCronJobs();
    } catch (err: any) {
      let errorMessage = err?.response?.data?.message || err?.response?.data?.detail || err?.message || `Failed to trigger ${jobId}`;
      
      // Enhanced error handling for validation errors with available job IDs
      if (err?.response?.data?.availableJobIds && Array.isArray(err.response.data.availableJobIds)) {
        const availableIds = err.response.data.availableJobIds.join(', ');
        errorMessage = `${errorMessage}\n\nAvailable job IDs for service '${service}': ${availableIds}`;
      } else if (err?.response?.data?.detail && typeof err.response.data.detail === 'object') {
        // Handle FastAPI validation error format
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          const jobIdError = detail.find((e: any) => e.loc && (e.loc.includes('jobId') || e.loc.includes('job_id')));
          if (jobIdError && err?.response?.data?.availableJobIds) {
            const availableIds = err.response.data.availableJobIds.join(', ');
            errorMessage = `${errorMessage}\n\nAvailable job IDs for service '${service}': ${availableIds}`;
          }
        }
      }
      
      setError(errorMessage);
      console.error('Error triggering AI job:', err);
      alert(`Error: ${errorMessage}`);
    } finally {
      setTriggeringAiJob(null);
    }
  };

  const handleTriggerAllAiJobs = async (service: string) => {
    if (!confirm(`Trigger all jobs in the ${service} service?`)) return;
    try {
      setTriggeringAllAiJobs(service);
      setError(null);
      const response = await filesJobsService.triggerAllAiCronJobs({ service });
      const successCount = response.successful || 0;
      const failCount = response.failed || 0;
      const message = `Triggered ${response.totalTriggered} job(s): ${successCount} succeeded, ${failCount} failed. ${response.message || ''}`;
      alert(message);
      await loadAiCronJobs();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || `Failed to trigger all jobs in ${service}`;
      setError(errorMessage);
      console.error('Error triggering all AI jobs:', err);
      alert(`Error: ${errorMessage}`);
    } finally {
      setTriggeringAllAiJobs(null);
    }
  };

  const handlePauseService = async (serviceName: string) => {
    if (!confirm(`Pause all jobs in the ${serviceName} service?`)) return;
    try {
      setPausingService(serviceName);
      setError(null);
      const response = await filesJobsService.pauseAiCronService(serviceName);
      alert(response.message || 'Service paused successfully');
      await loadAiCronJobs();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || `Failed to pause ${serviceName}`;
      setError(errorMessage);
      console.error('Error pausing service:', err);
      alert(`Error: ${errorMessage}`);
    } finally {
      setPausingService(null);
    }
  };

  const handleResumeService = async (serviceName: string) => {
    if (!confirm(`Resume all jobs in the ${serviceName} service?`)) return;
    try {
      setResumingService(serviceName);
      setError(null);
      const response = await filesJobsService.resumeAiCronService(serviceName);
      alert(response.message || 'Service resumed successfully');
      await loadAiCronJobs();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || `Failed to resume ${serviceName}`;
      setError(errorMessage);
      console.error('Error resuming service:', err);
      alert(`Error: ${errorMessage}`);
    } finally {
      setResumingService(null);
    }
  };

  const loadExecutionHistory = async () => {
    try {
      setIsHistoryLoading(true);
      setError(null);
      const params: CronExecutionHistoryQueryParams = {
        ...historyFilters,
        limit: historyPagination.limit,
        offset: (historyPagination.page - 1) * historyPagination.limit,
      };
      const response = await filesJobsService.getCronExecutionHistory(params);
      setExecutionHistory(response.executions || []);
      setHistoryPagination(prev => ({
        ...prev,
        total: response.total || 0,
        totalPages: Math.ceil((response.total || 0) / prev.limit),
      }));
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load execution history';
      setError(errorMessage);
      console.error('Error loading execution history:', err);
      setExecutionHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleViewExecution = (execution: CronJobExecution) => {
    setSelectedExecution(execution);
    setIsExecutionModalOpen(true);
  };

  const loadPushLogs = async () => {
    try {
      setIsPushLogsLoading(true);
      setError(null);
      const params: PushLogsQueryParams = {
        ...pushLogsFilters,
        limit: pushLogsPagination.limit,
        offset: (pushLogsPagination.page - 1) * pushLogsPagination.limit,
      };
      const response = await pushNotificationsService.getPushLogs(params);
      setPushLogs(response.logs || []);
      setPushLogsPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 1,
      }));
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load push notification logs';
      setError(errorMessage);
      console.error('Error loading push notification logs:', err);
      setPushLogs([]);
    } finally {
      setIsPushLogsLoading(false);
    }
  };

  const handleViewPushLog = (log: PushNotificationLog) => {
    setSelectedPushLog(log);
    setIsPushLogModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-1">Configure system settings and integrations</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex border-b border-gray-200">
        {[
          { id: 'general', label: 'General' },
          { id: 'cron-schedules', label: 'Cron Schedules' },
          { id: 'cron-jobs', label: 'Cron Jobs' },
          { id: 'cron-logs', label: 'Cron Logs' },
          { id: 'ai-cron-jobs', label: 'AI Cron Jobs' },
          { id: 'ai-logs', label: 'AI Logs' },
          { id: 'push-logs', label: 'Push Notification Logs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <Card title="API Configuration">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Token
              </label>
              <Input
                value={serviceToken}
                readOnly
                helperText="Service token is read-only. Configure via environment variable VITE_SERVICE_TOKEN"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Base URL
              </label>
              <Input
                value={import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002'}
                readOnly
                helperText="API base URL configured via environment variable"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Cron Schedules Tab */}
      {activeTab === 'cron-schedules' && (
        <Card title="Cron Job Schedules">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Manage when cron jobs run automatically. Changes require app restart to take effect.
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleInitializeSchedules}
              isLoading={isScheduleActionLoading}
              disabled={isScheduleActionLoading}
            >
              Initialize Defaults
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleOpenScheduleModal()}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Schedule
            </Button>
                      </div>
                    </div>
        <Table isLoading={isSchedulesLoading} emptyMessage="No schedules configured">
          <TableHeader>
            <TableRow>
              <TableHead>Job Name</TableHead>
              <TableHead>Cron Expression</TableHead>
              <TableHead>Time Zone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(cronSchedules) && cronSchedules.map((schedule) => (
              <TableRow key={schedule.id}>
                <TableCell className="font-medium">{schedule.jobName}</TableCell>
                <TableCell>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{schedule.cronExpression}</code>
                </TableCell>
                <TableCell>{schedule.timeZone}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs rounded ${
                    schedule.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {schedule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell className="max-w-xs truncate">{schedule.description || '-'}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenScheduleModal(schedule)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSchedule(schedule.jobName)}
                      isLoading={isScheduleActionLoading}
                      disabled={isScheduleActionLoading}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </Card>
      )}

      {/* Cron Jobs Tab */}
      {activeTab === 'cron-jobs' && (
      <Card title="Manual Job Triggers">
        {(cronJobsStats.count !== undefined || cronJobsStats.enabledJobs !== undefined) && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-6 text-sm">
              {cronJobsStats.count !== undefined && (
                <div>
                  <span className="text-gray-600">Total Jobs:</span>{' '}
                  <span className="font-medium text-gray-900">{cronJobsStats.count}</span>
                </div>
              )}
              {cronJobsStats.enabledJobs !== undefined && (
                <div>
                  <span className="text-gray-600">Enabled:</span>{' '}
                  <span className="font-medium text-green-700">{cronJobsStats.enabledJobs}</span>
                </div>
              )}
              {cronJobsStats.disabledJobs !== undefined && (
                <div>
                  <span className="text-gray-600">Disabled:</span>{' '}
                  <span className="font-medium text-gray-700">{cronJobsStats.disabledJobs}</span>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="space-y-2">
          {cronJobs.length > 0 ? (
            cronJobs.map((job) => (
              <div key={job.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-sm">{job.name}</div>
                      {job.status && (
                        <span className={`px-2 py-1 text-xs rounded ${
                          job.status.enabled !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {job.status.enabled !== false ? 'Enabled' : 'Disabled'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Auto Schedule:</span> {job.schedule}
                    </div>
                    {job.description && (
                      <div className="text-xs text-gray-600 mt-1">{job.description}</div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleTriggerJob(job.id)}
                    variant="secondary"
                    size="sm"
                    className="ml-3"
                    isLoading={triggeringJobId === job.id}
                    disabled={triggeringJobId === job.id}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Trigger Now
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Bill Reminders</div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Auto Schedule:</span> Daily at 9:00 AM UTC
                    </div>
                  </div>
                  <Button
                    onClick={() => handleTriggerJob('bill-reminders')}
                    variant="secondary"
                    size="sm"
                    className="ml-3"
                    isLoading={triggeringJobId === 'bill-reminders'}
                    disabled={triggeringJobId === 'bill-reminders'}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Trigger Now
                  </Button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Reminder Checks</div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Auto Schedule:</span> Hourly
                    </div>
                  </div>
                  <Button
                    onClick={() => handleTriggerJob('reminder-checks')}
                    variant="secondary"
                    size="sm"
                    className="ml-3"
                    isLoading={triggeringJobId === 'reminder-checks'}
                    disabled={triggeringJobId === 'reminder-checks'}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Trigger Now
                  </Button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Budget Alerts</div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Auto Schedule:</span> Daily at 10:00 AM UTC
                    </div>
                  </div>
                  <Button
                    onClick={() => handleTriggerJob('budget-alerts')}
                    variant="secondary"
                    size="sm"
                    className="ml-3"
                    isLoading={triggeringJobId === 'budget-alerts'}
                    disabled={triggeringJobId === 'budget-alerts'}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Trigger Now
                  </Button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Savings Goals Recalculation</div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Auto Schedule:</span> Daily at midnight UTC
                    </div>
                  </div>
                  <Button
                    onClick={() => handleTriggerJob('savings-goals-recalculate')}
                    variant="secondary"
                    size="sm"
                    className="ml-3"
                    isLoading={triggeringJobId === 'savings-goals-recalculate'}
                    disabled={triggeringJobId === 'savings-goals-recalculate'}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Trigger Now
                  </Button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Recurring Transaction Detection</div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Auto Schedule:</span> Every 5 minutes
                    </div>
                  </div>
                  <Button
                    onClick={() => handleTriggerJob('recurring-transaction-detection')}
                    variant="secondary"
                    size="sm"
                    className="ml-3"
                    isLoading={triggeringJobId === 'recurring-transaction-detection'}
                    disabled={triggeringJobId === 'recurring-transaction-detection'}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Trigger Now
                  </Button>
                </div>
                      </div>
              <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Bill Categorization</div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Auto Schedule:</span> Every 6 hours
                    </div>
                  </div>
                  <Button
                    onClick={() => handleTriggerJob('bills-categorize')}
                    variant="secondary"
                    size="sm"
                    className="ml-3"
                    isLoading={triggeringJobId === 'bills-categorize'}
                    disabled={triggeringJobId === 'bills-categorize'}
                  >
                    <Clock className="w-4 h-4 mr-1" />
                    Trigger Now
                  </Button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Test Data Generation</div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Auto Schedule:</span> Daily at 2:00 AM UTC
          </div>
      </div>
          <Button
                    onClick={() => handleTriggerJob('test-data-generation')}
            variant="secondary"
                    size="sm"
                    className="ml-3"
                    isLoading={triggeringJobId === 'test-data-generation'}
                    disabled={triggeringJobId === 'test-data-generation'}
          >
                    <Clock className="w-4 h-4 mr-1" />
                    Trigger Now
          </Button>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">Comprehensive Notifications</div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Auto Schedule:</span> As needed
                    </div>
                  </div>
          <Button
                    onClick={() => handleTriggerJob('comprehensive-notifications')}
            variant="secondary"
                    size="sm"
                    className="ml-3"
                    isLoading={triggeringJobId === 'comprehensive-notifications'}
                    disabled={triggeringJobId === 'comprehensive-notifications'}
          >
                    <Clock className="w-4 h-4 mr-1" />
                    Trigger Now
          </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </Card>
      )}

      {/* Cron Logs Tab */}
      {activeTab === 'cron-logs' && (
      <Card title="Recent Cron Logs">
        <Table isLoading={isLoading} emptyMessage="No recent logs">
          <TableHeader>
            <TableRow>
              <TableHead>Job Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Started At</TableHead>
              <TableHead>Completed At</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Error</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.isArray(recentLogs) && recentLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">{log.jobName || '-'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs rounded ${
                  log.status === 'completed' ? 'bg-green-100 text-green-700' :
                  log.status === 'failed' ? 'bg-red-100 text-red-700' :
                  log.status === 'running' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {log.status || '-'}
                  </span>
                </TableCell>
                <TableCell>{log.startedAt ? formatDateTime(log.startedAt) : '-'}</TableCell>
                <TableCell>{log.completedAt ? formatDateTime(log.completedAt) : '-'}</TableCell>
                <TableCell>
                  {log.duration !== undefined && log.duration !== null 
                    ? `${(log.duration / 1000).toFixed(2)}s` 
                    : '-'}
                </TableCell>
                <TableCell className="max-w-xs">
                  {(log.metadata || log.summary || log.result) ? (
                    <div className="text-xs text-gray-600 space-y-1" title={JSON.stringify({ metadata: log.metadata, summary: log.summary, result: log.result }, null, 2)}>
                      {(() => {
                        const metrics: string[] = [];
                        
                        // Extract key metrics from metadata
                        if (log.metadata) {
                          if (typeof log.metadata.billsChecked === 'number') {
                            metrics.push(`Bills: ${log.metadata.billsChecked}`);
                          }
                          if (typeof log.metadata.remindersSent === 'number') {
                            metrics.push(`Reminders: ${log.metadata.remindersSent}`);
                          }
                          if (typeof log.metadata.usersProcessed === 'number') {
                            metrics.push(`Users: ${log.metadata.usersProcessed}`);
                          }
                          if (typeof log.metadata.totalSaved === 'number') {
                            metrics.push(`Saved: ${log.metadata.totalSaved}`);
                          }
                          if (typeof log.metadata.errorsCount === 'number' && log.metadata.errorsCount > 0) {
                            metrics.push(`Errors: ${log.metadata.errorsCount}`);
                          }
                        }
                        
                        // Extract key metrics from summary
                        if (log.summary) {
                          if (log.summary.status && typeof log.summary.status === 'string') {
                            metrics.push(`Status: ${log.summary.status}`);
                          }
                          if (Array.isArray(log.summary.errors) && log.summary.errors.length > 0) {
                            metrics.push(`Errors: ${log.summary.errors.length}`);
                          }
                        }
                        
                        if (metrics.length > 0) {
                          return metrics.slice(0, 3).map((m, i) => (
                            <div key={i} className="truncate">{m}</div>
                          ));
                        }
                        
                        // Fallback to field counts
                        const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;
                        const hasSummary = log.summary && Object.keys(log.summary).length > 0;
                        const parts = [];
                        if (hasMetadata && log.metadata) parts.push(`${Object.keys(log.metadata).length} fields`);
                        if (hasSummary && log.summary) parts.push(`${Object.keys(log.summary).length} fields`);
                        return parts.length > 0 ? parts.join(', ') : 'Empty';
                      })()}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate" title={log.errorMessage || log.error || ''}>
                  {(log.errorMessage || log.error) ? (
                    <span className="text-red-600 text-xs">{log.errorMessage || log.error}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedLog(log);
                      setIsLogModalOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {pagination && pagination.total > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
            </div>
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
                onPageChange={(page) => setPagination({ ...pagination, page })}
                onItemsPerPageChange={(limit) => setPagination({ ...pagination, limit, page: 1 })}
              />
            )}
          </div>
        )}
      </Card>
      )}

      {/* Log Details Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setSelectedLog(null);
        }}
        title={`Cron Job Log Details: ${selectedLog?.jobName || 'Unknown'}`}
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`px-2 py-1 text-xs rounded inline-block ${
                  selectedLog.status === 'completed' ? 'bg-green-100 text-green-700' :
                  selectedLog.status === 'failed' ? 'bg-red-100 text-red-700' :
                  selectedLog.status === 'running' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedLog.status || '-'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <p className="text-sm text-gray-900">
                  {selectedLog.duration !== undefined && selectedLog.duration !== null 
                    ? `${(selectedLog.duration / 1000).toFixed(2)}s` 
                    : '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Started At</label>
                <p className="text-sm text-gray-900">
                  {selectedLog.startedAt ? formatDateTime(selectedLog.startedAt) : '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Completed At</label>
                <p className="text-sm text-gray-900">
                  {selectedLog.completedAt ? formatDateTime(selectedLog.completedAt) : '-'}
                </p>
              </div>
            </div>

            {(selectedLog.errorMessage || selectedLog.error) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Error</label>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 whitespace-pre-wrap font-mono">
                    {selectedLog.errorMessage || selectedLog.error}
                  </p>
                  {selectedLog.errorStack && (
                    <details className="mt-2">
                      <summary className="text-xs text-red-700 cursor-pointer">Stack Trace</summary>
                      <pre className="text-xs text-red-700 mt-2 whitespace-pre-wrap overflow-auto max-h-64">
                        {selectedLog.errorStack}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
              <div>
                <details className="group">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                      <label className="block text-sm font-medium text-gray-700 cursor-pointer">
                        Metadata
                      </label>
                      <span className="text-xs text-gray-500 group-open:hidden">Click to expand</span>
                      <span className="text-xs text-gray-500 hidden group-open:inline">Click to collapse</span>
                    </div>
                  </summary>
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <pre className="text-xs text-gray-800 overflow-auto max-h-96 whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}

            {selectedLog.summary && Object.keys(selectedLog.summary).length > 0 && (
              <div>
                <details className="group" open>
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 cursor-pointer mb-1">
                          Summary
                        </label>
                        {(() => {
                          const summaryMessage = selectedLog.summary && typeof selectedLog.summary === 'object' && 'message' in selectedLog.summary 
                            ? String(selectedLog.summary.message as string | number | boolean | null | undefined)
                            : null;
                          return summaryMessage ? (
                            <p className="text-xs text-green-700 font-medium">{summaryMessage}</p>
                          ) : null;
                        })()}
                        {Array.isArray(selectedLog.summary.errors) && selectedLog.summary.errors.length > 0 && (
                          <p className="text-xs text-red-700 mt-1">
                            {selectedLog.summary.errors.length} error{selectedLog.summary.errors.length !== 1 ? 's' : ''} found
                          </p>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <span className="text-xs text-gray-500 group-open:hidden">Click to expand</span>
                        <span className="text-xs text-gray-500 hidden group-open:inline">Click to collapse</span>
                      </div>
                    </div>
                  </summary>
                  <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
                    {Array.isArray(selectedLog.summary.errors) && selectedLog.summary.errors.length > 0 && (
                      <div className="mb-3 pb-3 border-b border-green-200">
                        <p className="text-sm font-medium text-red-700 mb-2">Errors ({selectedLog.summary.errors.length}):</p>
                        <ul className="list-disc list-inside space-y-1">
                          {selectedLog.summary.errors.map((error: unknown, idx: number) => (
                            <li key={idx} className="text-xs text-red-800 whitespace-pre-wrap font-mono">
                              {String(error)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <pre className="text-xs text-gray-800 overflow-auto max-h-96 whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedLog.summary, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}

            {selectedLog.result && Object.keys(selectedLog.result).length > 0 && (
              <div>
                <details className="group">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100">
                      <label className="block text-sm font-medium text-gray-700 cursor-pointer">
                        Result Data (Legacy)
                      </label>
                      <span className="text-xs text-gray-500 group-open:hidden">Click to expand</span>
                      <span className="text-xs text-gray-500 hidden group-open:inline">Click to collapse</span>
                    </div>
                  </summary>
                  <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <pre className="text-xs text-gray-800 overflow-auto max-h-96 whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedLog.result, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}

            {!selectedLog.errorMessage && !selectedLog.error && !selectedLog.metadata && !selectedLog.summary && !selectedLog.result && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No additional data available for this log entry.
              </div>
          )}
        </div>
        )}
      </Modal>

      {/* Schedule Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setEditingSchedule(null);
        }}
        title={editingSchedule ? 'Edit Cron Schedule' : 'Create Cron Schedule'}
        size="md"
      >
        <ScheduleForm
          onSubmit={handleSaveSchedule}
          onCancel={() => {
            setIsScheduleModalOpen(false);
            setEditingSchedule(null);
          }}
          initialData={editingSchedule || undefined}
          availableJobs={cronJobs.map(job => ({ id: job.id, name: job.name }))}
          isLoading={isScheduleActionLoading}
        />
      </Modal>

      {/* AI Cron Jobs Tab */}
      {activeTab === 'ai-cron-jobs' && (
        <div className="space-y-6">
          {/* Status Overview */}
          {aiCronStatus && (
            <Card title="AI Cron System Status">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Total Services</div>
                  <div className="text-2xl font-bold text-gray-900">{aiCronStatus.totalServices}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Jobs</div>
                  <div className="text-2xl font-bold text-gray-900">{aiCronStatus.totalJobs}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Running Services</div>
                  <div className="text-2xl font-bold text-green-600">
                    {Object.values(aiCronStatus.services).filter(s => s.running).length}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Services and Jobs */}
          {aiCronJobs && (
            <div className="space-y-6">
              {Object.entries(aiCronJobs.services).map(([serviceName, serviceData]) => (
                <Card key={serviceName} title={`${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} Service`}>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs rounded ${
                        serviceData.running ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {serviceData.running ? 'Running' : 'Paused'}
                      </span>
                      <span className="text-sm text-gray-600">
                        {serviceData.jobs.length} job(s)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {serviceData.jobs.length > 0 && (
                        <Button
                          onClick={() => handleTriggerAllAiJobs(serviceName)}
                          variant="secondary"
                          size="sm"
                          disabled={triggeringAllAiJobs === serviceName}
                          isLoading={triggeringAllAiJobs === serviceName}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Trigger All
                        </Button>
                      )}
                      {serviceData.running ? (
                        <Button
                          onClick={() => handlePauseService(serviceName)}
                          variant="secondary"
                          size="sm"
                          disabled={pausingService === serviceName}
                          isLoading={pausingService === serviceName}
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          Pause Service
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleResumeService(serviceName)}
                          variant="secondary"
                          size="sm"
                          disabled={resumingService === serviceName}
                          isLoading={resumingService === serviceName}
                        >
                          <PlayCircle className="w-4 h-4 mr-1" />
                          Resume Service
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {serviceData.jobs.length > 0 ? (
                      serviceData.jobs.map((job) => (
                        <div key={job.jobId} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-sm">{job.name}</div>
                                <span className={`px-2 py-1 text-xs rounded ${
                                  job.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {job.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                <span className="font-medium">Schedule:</span> {job.schedule}
                              </div>
                              {job.nextRun && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className="font-medium">Next Run:</span> {formatDateTime(job.nextRun)}
                                </div>
                              )}
                              {job.lastRun && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className="font-medium">Last Run:</span> {formatDateTime(job.lastRun)}
                                </div>
                              )}
                            </div>
                            <Button
                              onClick={() => handleTriggerAiJob(job.service, job.jobId)}
                              variant="secondary"
                              size="sm"
                              className="ml-3"
                              disabled={
                                triggeringAiJob?.service === job.service &&
                                triggeringAiJob?.jobId === job.jobId
                              }
                              isLoading={
                                triggeringAiJob?.service === job.service &&
                                triggeringAiJob?.jobId === job.jobId
                              }
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Trigger
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No jobs found for this service
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {isAiCronLoading && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">Loading AI cron jobs...</p>
            </div>
          )}

          {!isAiCronLoading && (!aiCronJobs || Object.keys(aiCronJobs.services).length === 0) && (
            <Card title="AI Cron Jobs">
              <div className="text-center py-8 text-gray-500">
                No AI cron jobs found. Make sure the AI microservice is running and the endpoints are available.
              </div>
            </Card>
          )}
        </div>
      )}

      {/* AI Logs Tab - Execution History */}
      {activeTab === 'ai-logs' && (
        <div className="space-y-6">
          <Card title="AI Cron Execution History">
            <div className="mb-4 flex items-center gap-4 flex-wrap">
              <select
                value={historyFilters.serviceName || ''}
                onChange={(e) => {
                  const newFilters = { ...historyFilters, serviceName: e.target.value || undefined };
                  setHistoryFilters(newFilters);
                  setHistoryPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="">All Services</option>
                <option value="document">Document</option>
                <option value="snapshot">Snapshot</option>
                <option value="insight">Insight</option>
              </select>
              <select
                value={historyFilters.status || ''}
                onChange={(e) => {
                  const newFilters = { ...historyFilters, status: e.target.value as 'success' | 'failed' | 'cancelled' | undefined || undefined };
                  setHistoryFilters(newFilters);
                  setHistoryPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="">All Status</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Input
                type="text"
                placeholder="Filter by Job ID..."
                value={historyFilters.jobId || ''}
                onChange={(e) => {
                  const newFilters = { ...historyFilters, jobId: e.target.value || undefined };
                  setHistoryFilters(newFilters);
                  setHistoryPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="max-w-xs"
              />
              <Button
                onClick={loadExecutionHistory}
                disabled={isHistoryLoading}
                size="sm"
                variant="secondary"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isHistoryLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <Table isLoading={isHistoryLoading} emptyMessage="No execution history found">
              <TableHeader>
                <TableRow>
                  <TableHead>Job Name</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Started At</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executionHistory.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell className="font-medium">{execution.jobName}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                        {execution.serviceName}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded ${
                        execution.status === 'success' ? 'bg-green-100 text-green-700' :
                        execution.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {execution.status}
                      </span>
                    </TableCell>
                    <TableCell>{formatDateTime(execution.startedAt)}</TableCell>
                    <TableCell>
                      {execution.durationSeconds !== null && execution.durationSeconds !== undefined
                        ? `${execution.durationSeconds.toFixed(2)}s`
                        : execution.completedAt
                        ? 'Calculating...'
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewExecution(execution)}
                        title="View execution details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {historyPagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={historyPagination.page}
                  totalPages={historyPagination.totalPages}
                  totalItems={historyPagination.total}
                  itemsPerPage={historyPagination.limit}
                  onPageChange={(page) => setHistoryPagination(prev => ({ ...prev, page }))}
                  onItemsPerPageChange={(limit) => setHistoryPagination(prev => ({ ...prev, limit, page: 1 }))}
                />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Execution Details Modal */}
      <Modal
        isOpen={isExecutionModalOpen}
        onClose={() => {
          setIsExecutionModalOpen(false);
          setSelectedExecution(null);
        }}
        title={`Execution Details: ${selectedExecution?.jobName || 'Unknown'}`}
        size="lg"
      >
        {selectedExecution && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job ID</label>
                <p className="text-sm text-gray-900 font-mono">{selectedExecution.jobId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Name</label>
                <p className="text-sm text-gray-900">{selectedExecution.jobName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                <p className="text-sm text-gray-900">{selectedExecution.serviceName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`px-2 py-1 text-xs rounded inline-block ${
                  selectedExecution.status === 'success' ? 'bg-green-100 text-green-700' :
                  selectedExecution.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedExecution.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Started At</label>
                <p className="text-sm text-gray-900">{formatDateTime(selectedExecution.startedAt)}</p>
              </div>
              {selectedExecution.completedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completed At</label>
                  <p className="text-sm text-gray-900">{formatDateTime(selectedExecution.completedAt)}</p>
                </div>
              )}
              {selectedExecution.durationSeconds !== null && selectedExecution.durationSeconds !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <p className="text-sm text-gray-900">{selectedExecution.durationSeconds.toFixed(2)}s</p>
                </div>
              )}
              {selectedExecution.createdAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                  <p className="text-sm text-gray-900">{formatDateTime(selectedExecution.createdAt)}</p>
                </div>
              )}
            </div>

            {selectedExecution.errorMessage && (
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-red-700 mb-2">Error Message</label>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 whitespace-pre-wrap font-mono">{selectedExecution.errorMessage}</p>
                </div>
              </div>
            )}

            {selectedExecution.executionDetails && Object.keys(selectedExecution.executionDetails).length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <details className="group" open>
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                      <label className="block text-sm font-medium text-gray-700 cursor-pointer">
                        Execution Details
                      </label>
                      <span className="text-xs text-gray-500 group-open:hidden">Click to expand</span>
                      <span className="text-xs text-gray-500 hidden group-open:inline">Click to collapse</span>
                    </div>
                  </summary>
                  <div className="mt-2 bg-gray-50 rounded-lg p-3 max-h-96 overflow-y-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedExecution.executionDetails, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Push Notification Logs Tab */}
      {activeTab === 'push-logs' && (
        <div className="space-y-6">
          <Card title="Push Notification Logs">
            <div className="mb-4 flex items-center gap-4 flex-wrap">
              <Input
                type="number"
                placeholder="Filter by User ID..."
                value={pushLogsFilters.userId || ''}
                onChange={(e) => {
                  const newFilters = { 
                    ...pushLogsFilters, 
                    userId: e.target.value ? Number(e.target.value) : undefined 
                  };
                  setPushLogsFilters(newFilters);
                  setPushLogsPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="max-w-xs"
              />
              <select
                value={pushLogsFilters.status || ''}
                onChange={(e) => {
                  const newFilters = { 
                    ...pushLogsFilters, 
                    status: e.target.value as PushNotificationStatus | undefined || undefined 
                  };
                  setPushLogsFilters(newFilters);
                  setPushLogsPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="error">Error</option>
              </select>
              <Input
                type="date"
                placeholder="Start Date"
                value={pushLogsFilters.startDate ? pushLogsFilters.startDate.split('T')[0] : ''}
                onChange={(e) => {
                  const newFilters = { 
                    ...pushLogsFilters, 
                    startDate: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined 
                  };
                  setPushLogsFilters(newFilters);
                  setPushLogsPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="max-w-xs"
              />
              <Input
                type="date"
                placeholder="End Date"
                value={pushLogsFilters.endDate ? pushLogsFilters.endDate.split('T')[0] : ''}
                onChange={(e) => {
                  const newFilters = { 
                    ...pushLogsFilters, 
                    endDate: e.target.value ? `${e.target.value}T23:59:59.999Z` : undefined 
                  };
                  setPushLogsFilters(newFilters);
                  setPushLogsPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="max-w-xs"
              />
              <Button
                onClick={loadPushLogs}
                disabled={isPushLogsLoading}
                size="sm"
                variant="secondary"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isPushLogsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            <Table isLoading={isPushLogsLoading} emptyMessage="No push notification logs found">
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Body</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Delivered At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pushLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {log.user ? (
                        <div>
                          <div className="font-medium">{log.user.email}</div>
                          <div className="text-xs text-gray-500">ID: {log.user.id}</div>
                        </div>
                      ) : (
                        `User ${log.userId}`
                      )}
                    </TableCell>
                    <TableCell>{log.title}</TableCell>
                    <TableCell className="max-w-xs truncate">{log.body}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded ${
                        log.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        log.status === 'failed' || log.status === 'error' ? 'bg-red-100 text-red-700' :
                        log.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {log.status}
                      </span>
                    </TableCell>
                    <TableCell>{log.deviceName || log.deviceId || 'N/A'}</TableCell>
                    <TableCell>{log.sentAt ? formatDateTime(log.sentAt) : 'N/A'}</TableCell>
                    <TableCell>{log.deliveredAt ? formatDateTime(log.deliveredAt) : 'N/A'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewPushLog(log)}
                        title="View log details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {pushLogsPagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={pushLogsPagination.page}
                  totalPages={pushLogsPagination.totalPages}
                  totalItems={pushLogsPagination.total}
                  itemsPerPage={pushLogsPagination.limit}
                  onPageChange={(page) => setPushLogsPagination(prev => ({ ...prev, page }))}
                  onItemsPerPageChange={(limit) => setPushLogsPagination(prev => ({ ...prev, limit, page: 1 }))}
                />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Push Log Details Modal */}
      <Modal
        isOpen={isPushLogModalOpen}
        onClose={() => {
          setIsPushLogModalOpen(false);
          setSelectedPushLog(null);
        }}
        title={`Push Notification Log Details: ${selectedPushLog?.title || 'Unknown'}`}
        size="lg"
      >
        {selectedPushLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                <p className="text-sm text-gray-900">
                  {selectedPushLog.user ? `${selectedPushLog.user.email} (ID: ${selectedPushLog.user.id})` : `User ID: ${selectedPushLog.userId}`}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`px-2 py-1 text-xs rounded inline-block ${
                  selectedPushLog.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  selectedPushLog.status === 'failed' || selectedPushLog.status === 'error' ? 'bg-red-100 text-red-700' :
                  selectedPushLog.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {selectedPushLog.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <p className="text-sm text-gray-900">{selectedPushLog.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
                <p className="text-sm text-gray-900">{selectedPushLog.body}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Device</label>
                <p className="text-sm text-gray-900">{selectedPushLog.deviceName || selectedPushLog.deviceId || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Push Token</label>
                <p className="text-sm text-gray-900 font-mono text-xs truncate">{selectedPushLog.pushToken}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sent At</label>
                <p className="text-sm text-gray-900">{selectedPushLog.sentAt ? formatDateTime(selectedPushLog.sentAt) : 'N/A'}</p>
              </div>
              {selectedPushLog.deliveredAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivered At</label>
                  <p className="text-sm text-gray-900">{formatDateTime(selectedPushLog.deliveredAt)}</p>
                </div>
              )}
              {selectedPushLog.failedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Failed At</label>
                  <p className="text-sm text-gray-900">{formatDateTime(selectedPushLog.failedAt)}</p>
                </div>
              )}
              {selectedPushLog.errorCode && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Error Code</label>
                  <p className="text-sm text-red-900">{selectedPushLog.errorCode}</p>
                </div>
              )}
              {selectedPushLog.errorMessage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Error Message</label>
                  <p className="text-sm text-red-900">{selectedPushLog.errorMessage}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Retry Count</label>
                <p className="text-sm text-gray-900">{selectedPushLog.retryCount}</p>
              </div>
            </div>

            {selectedPushLog.notification && (
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notification</label>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-900"><strong>Type:</strong> {selectedPushLog.notification.type}</p>
                  <p className="text-sm text-gray-900"><strong>Title:</strong> {selectedPushLog.notification.title || 'N/A'}</p>
                  <p className="text-sm text-gray-900"><strong>Message:</strong> {selectedPushLog.notification.message}</p>
                </div>
              </div>
            )}

            {selectedPushLog.data && Object.keys(selectedPushLog.data).length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <details className="group">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                      <label className="block text-sm font-medium text-gray-700 cursor-pointer">
                        Data Payload
                      </label>
                      <span className="text-xs text-gray-500 group-open:hidden">Click to expand</span>
                      <span className="text-xs text-gray-500 hidden group-open:inline">Click to collapse</span>
                    </div>
                  </summary>
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <pre className="text-xs text-gray-800 overflow-auto max-h-96 whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedPushLog.data, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}

            {selectedPushLog.metadata && Object.keys(selectedPushLog.metadata).length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <details className="group">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100">
                      <label className="block text-sm font-medium text-gray-700 cursor-pointer">
                        Metadata
                      </label>
                      <span className="text-xs text-gray-500 group-open:hidden">Click to expand</span>
                      <span className="text-xs text-gray-500 hidden group-open:inline">Click to collapse</span>
                    </div>
                  </summary>
                  <div className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <pre className="text-xs text-gray-800 overflow-auto max-h-96 whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedPushLog.metadata, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
