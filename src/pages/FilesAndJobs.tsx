import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search, Eye, Clock, AlertCircle, CheckCircle, XCircle, Loader, FileText, FolderOpen, Play } from 'lucide-react';
import { Card, Button, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input, Pagination } from '../components/ui';
import { filesJobsService } from '../services/api/files-jobs.service';
import { useAuth } from '../hooks/useAuth';
import * as cookieUtils from '../utils/cookies';
import type { FilesAndJobsResponse, S3FileInfo, ProcessingJobInfo, JobStatus } from '../types/files-jobs.types';
import { formatDateTime } from '../utils/formatters';

export function FilesAndJobs() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'files' | 'jobs'>('files');
  const [data, setData] = useState<FilesAndJobsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userIdFilter, setUserIdFilter] = useState<string>('');
  const [fileSearchTerm, setFileSearchTerm] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<S3FileInfo | null>(null);
  const [selectedJob, setSelectedJob] = useState<ProcessingJobInfo | null>(null);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [retriggeringJobId, setRetriggeringJobId] = useState<string | null>(null);
  
  // Pagination state
  const [jobsPagination, setJobsPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [filesPagination, setFilesPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });

  const loadData = useCallback(async () => {
    console.log('[FilesAndJobs] loadData called:', {
      userIdFilter,
      isAuthenticated,
      timestamp: new Date().toISOString(),
    });

    try {
      setIsLoading(true);
      setError(null);

      // Check if user is authenticated
      if (!isAuthenticated) {
        console.warn('[FilesAndJobs] User not authenticated');
        setError('Please log in to access files and jobs.');
        setIsLoading(false);
        return;
      }

      // Verify token exists before making request
      const token = cookieUtils.getAccessToken();
      console.log('[FilesAndJobs] Token check:', {
        hasToken: !!token,
        tokenLength: token?.length || 0,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
      });

      if (!token) {
        console.error('[FilesAndJobs] No access token found in cookies. User needs to log in.');
        setError('No authentication token found. Please log in again.');
        setIsLoading(false);
        return;
      }

      const userId = userIdFilter ? parseInt(userIdFilter, 10) : undefined;
      if (userIdFilter && isNaN(userId!)) {
        console.error('[FilesAndJobs] Invalid user ID:', userIdFilter);
        setError('Invalid user ID');
        setIsLoading(false);
        return;
      }

      // Build query parameters with pagination
      const queryParams: { userId?: number; page?: number; limit?: number } = {};
      if (userId) {
        queryParams.userId = userId;
      }
      if (activeTab === 'jobs') {
        queryParams.page = jobsPagination.page;
        queryParams.limit = jobsPagination.limit;
      } else if (activeTab === 'files') {
        queryParams.page = filesPagination.page;
        queryParams.limit = filesPagination.limit;
      }

      console.log('[FilesAndJobs] Calling filesJobsService.getFilesAndJobs with params:', queryParams);
      const response = await filesJobsService.getFilesAndJobs(queryParams);
      
      console.log('[FilesAndJobs] Response received:', {
        filesCount: response?.filesCount || 0,
        jobsCount: response?.jobsCount || 0,
        userId: response?.userId,
        hasFiles: response?.files && response.files.length > 0,
        hasJobs: response?.jobs && response.jobs.length > 0,
        page: response?.page,
        totalPages: response?.totalPages,
        total: response?.total,
      });

      setData(response);
      
      // Update pagination state from response
      if (response?.total !== undefined && response?.totalPages !== undefined) {
        if (activeTab === 'jobs') {
          setJobsPagination({
            total: response.total || response.jobsCount || 0,
            page: response.page || jobsPagination.page,
            limit: response.limit || jobsPagination.limit,
            totalPages: response.totalPages || Math.ceil((response.total || response.jobsCount || 0) / (response.limit || jobsPagination.limit)),
          });
        } else if (activeTab === 'files') {
          setFilesPagination({
            total: response.total || response.filesCount || 0,
            page: response.page || filesPagination.page,
            limit: response.limit || filesPagination.limit,
            totalPages: response.totalPages || Math.ceil((response.total || response.filesCount || 0) / (response.limit || filesPagination.limit)),
          });
        }
      } else {
        // Fallback: calculate pagination from counts if not provided
        if (activeTab === 'jobs') {
          setJobsPagination(prev => ({
            ...prev,
            total: response?.jobsCount || 0,
            totalPages: Math.ceil((response?.jobsCount || 0) / prev.limit),
          }));
        } else if (activeTab === 'files') {
          setFilesPagination(prev => ({
            ...prev,
            total: response?.filesCount || 0,
            totalPages: Math.ceil((response?.filesCount || 0) / prev.limit),
          }));
        }
      }
      
      console.log('[FilesAndJobs] Data set successfully');
    } catch (err: unknown) {
      const error = err as { isAuthError?: boolean; response?: { status?: number; data?: { message?: string } }; message?: string };
      let errorMessage = error?.response?.data?.message || error?.message || 'Failed to load files and jobs';
      
      console.error('[FilesAndJobs] Error caught:', {
        errorMessage,
        status: error?.response?.status,
        isAuthError: error?.isAuthError,
        errorDetails: error?.response?.data,
      });
      
      // Handle authentication errors
      if (error?.isAuthError || error?.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in to access files and jobs. If you are logged in, try refreshing the page.';
        console.error('[FilesAndJobs] Authentication error:', {
          isAuthenticated,
          hasToken: !!cookieUtils.getAccessToken(),
        });
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      console.log('[FilesAndJobs] loadData completed');
    }
  }, [userIdFilter, isAuthenticated, activeTab, jobsPagination.page, jobsPagination.limit, filesPagination.page, filesPagination.limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  // Reset pagination when filters change
  useEffect(() => {
    if (activeTab === 'jobs') {
      setJobsPagination(prev => ({ ...prev, page: 1 }));
    } else if (activeTab === 'files') {
      setFilesPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [userIdFilter, jobStatusFilter, activeTab]);

  const getStatusBadge = (status: JobStatus) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-700', icon: Loader },
      completed: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
      failed: { color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
      permanently_failed: { color: 'bg-red-100 text-red-700', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${config.color}`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatTTL = (seconds?: number): string => {
    if (!seconds || seconds < 0) return 'Expired';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const getTTLColor = (seconds?: number): string => {
    if (!seconds || seconds < 0) return 'text-red-600';
    if (seconds < 3600) return 'text-red-500';
    if (seconds < 86400) return 'text-orange-500';
    return 'text-gray-600';
  };

  const filteredFiles = data?.files.filter((file) => {
    const matchesSearch = fileSearchTerm === '' || 
      file.filename.toLowerCase().includes(fileSearchTerm.toLowerCase()) ||
      file.fileId.toLowerCase().includes(fileSearchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  const filteredJobs = data?.jobs.filter((job) => {
    const matchesStatus = jobStatusFilter === 'all' || job.status === jobStatusFilter;
    return matchesStatus;
  }) || [];

  const handleViewFile = (file: S3FileInfo) => {
    setSelectedFile(file);
    setIsFileModalOpen(true);
  };

  const handleViewJob = (job: ProcessingJobInfo) => {
    setSelectedJob(job);
    setIsJobModalOpen(true);
  };

  const handleRetriggerJob = async (jobId: string) => {
    try {
      setRetriggeringJobId(jobId);
      setError(null);
      
      console.log('[FilesAndJobs] Retriggering job:', jobId);
      await filesJobsService.retriggerJob(jobId);
      
      // Reload data to show updated job status
      await loadData();
      
      // Show success message (you could use a toast notification here)
      console.log('[FilesAndJobs] Job retriggered successfully:', jobId);
    } catch (err: unknown) {
      const error = err as { isAuthError?: boolean; response?: { status?: number; data?: { message?: string } }; message?: string };
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to retrigger job';
      
      console.error('[FilesAndJobs] Retrigger error:', {
        jobId,
        errorMessage,
        status: error?.response?.status,
        isAuthError: error?.isAuthError,
      });
      
      setError(errorMessage);
    } finally {
      setRetriggeringJobId(null);
    }
  };

  const isViewingAllJobs = !userIdFilter;
  const currentUserId = data?.userId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Files & Jobs Management</h1>
          <p className="text-gray-600 mt-1">
            {isViewingAllJobs 
              ? 'View and manage all AI document processing jobs across all users'
              : `View and manage AI document processing files and jobs for User ID: ${currentUserId || userIdFilter}`
            }
          </p>
        </div>
        <Button onClick={loadData} disabled={isLoading} variant="secondary">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 max-w-xs">
          <Input
            type="number"
            placeholder="Filter by User ID (leave empty for all jobs)"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                loadData();
              }
            }}
          />
        </div>
        <Button onClick={loadData} disabled={isLoading} size="sm">
          {isViewingAllJobs ? 'View All Jobs' : 'Apply Filter'}
        </Button>
        {userIdFilter && (
          <Button 
            onClick={() => {
              setUserIdFilter('');
              setTimeout(() => loadData(), 0);
            }} 
            disabled={isLoading} 
            size="sm"
            variant="ghost"
          >
            Clear Filter
          </Button>
        )}
      </div>

      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('files')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'files'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Files ({data?.filesCount || 0})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'jobs'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Jobs ({data?.jobsCount || 0})
          </div>
        </button>
      </div>

      {/* Files Tab */}
      {activeTab === 'files' && (
        <Card title={isViewingAllJobs ? "Files (User-specific - filter by User ID to view)" : "Files"}>
          {isViewingAllJobs && (
            <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
              <strong>Note:</strong> Files are user-specific. Please enter a User ID to view files for that user.
            </div>
          )}
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search files by name or ID..."
              value={fileSearchTerm}
              onChange={(e) => setFileSearchTerm(e.target.value)}
              icon={<Search className="w-4 h-4" />}
            />
          </div>

          <Table isLoading={isLoading} emptyMessage="No files found">
            <TableHeader>
              <TableRow>
                <TableHead>File ID</TableHead>
                <TableHead>Filename</TableHead>
                <TableHead>Content Type</TableHead>
                <TableHead>Stored At</TableHead>
                <TableHead>TTL Remaining</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFiles.map((file) => (
                <TableRow key={file.fileId}>
                  <TableCell className="font-mono text-xs">{file.fileId}</TableCell>
                  <TableCell className="font-medium">{file.filename}</TableCell>
                  <TableCell>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {file.contentType}
                    </span>
                  </TableCell>
                  <TableCell>{formatDateTime(file.storedAt)}</TableCell>
                  <TableCell>
                    <span className={getTTLColor(file.ttlRemainingSeconds)}>
                      {formatTTL(file.ttlRemainingSeconds)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewFile(file)}
                      title="View file details"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filesPagination.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={filesPagination.page}
                totalPages={filesPagination.totalPages}
                totalItems={filesPagination.total}
                itemsPerPage={filesPagination.limit}
                onPageChange={(page) => setFilesPagination(prev => ({ ...prev, page }))}
                onItemsPerPageChange={(limit) => setFilesPagination(prev => ({ ...prev, limit, page: 1 }))}
              />
            </div>
          )}
        </Card>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <Card title={isViewingAllJobs ? "Processing Jobs (All Users)" : "Processing Jobs"}>
          {isViewingAllJobs && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
              <strong>Viewing all jobs:</strong> Showing jobs from all users. Use the User ID filter to view jobs for a specific user.
            </div>
          )}
          <div className="mb-4 flex items-center gap-4">
            <select
              value={jobStatusFilter}
              onChange={(e) => setJobStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="permanently_failed">Permanently Failed</option>
            </select>
          </div>

          <Table isLoading={isLoading} emptyMessage="No jobs found">
            <TableHeader>
              <TableRow>
                <TableHead>Job ID</TableHead>
                <TableHead>User ID</TableHead>
                <TableHead>Profile Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Files</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Updated At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job) => (
                <TableRow key={job.jobId}>
                  <TableCell className="font-mono text-xs">{job.jobId}</TableCell>
                  <TableCell>
                    <span className="font-medium">{job.userId}</span>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {job.profileType}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(job.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${job.progress * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-12 text-right">
                        {Math.round(job.progress * 100)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {job.filesData ? (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                        {Array.isArray(job.filesData) ? job.filesData.length : 0}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDateTime(job.createdAt)}</TableCell>
                  <TableCell>{formatDateTime(job.updatedAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewJob(job)}
                        title="View job details"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {(job.status === 'failed' || job.status === 'permanently_failed' || job.status === 'completed') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetriggerJob(job.jobId)}
                          disabled={retriggeringJobId === job.jobId}
                          title="Retrigger job"
                        >
                          {retriggeringJobId === job.jobId ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {jobsPagination.totalPages > 1 && (
            <div className="mt-4">
              <Pagination
                currentPage={jobsPagination.page}
                totalPages={jobsPagination.totalPages}
                totalItems={jobsPagination.total}
                itemsPerPage={jobsPagination.limit}
                onPageChange={(page) => setJobsPagination(prev => ({ ...prev, page }))}
                onItemsPerPageChange={(limit) => setJobsPagination(prev => ({ ...prev, limit, page: 1 }))}
              />
            </div>
          )}
        </Card>
      )}

      {/* File Details Modal */}
      <Modal
        isOpen={isFileModalOpen}
        onClose={() => {
          setIsFileModalOpen(false);
          setSelectedFile(null);
        }}
        title="File Details"
        size="lg"
      >
        {selectedFile && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File ID</label>
              <p className="text-sm text-gray-900 font-mono">{selectedFile.fileId}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filename</label>
              <p className="text-sm text-gray-900">{selectedFile.filename}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
              <p className="text-sm text-gray-900">{selectedFile.contentType}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">S3 Key</label>
              <p className="text-sm text-gray-900 font-mono break-all">{selectedFile.s3Key}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stored At</label>
              <p className="text-sm text-gray-900">{formatDateTime(selectedFile.storedAt)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">TTL Information</label>
              <div className="space-y-1">
                <p className="text-sm text-gray-900">
                  Remaining: <span className={getTTLColor(selectedFile.ttlRemainingSeconds)}>{formatTTL(selectedFile.ttlRemainingSeconds)}</span>
                </p>
                {selectedFile.ttlSeconds && (
                  <p className="text-xs text-gray-500">
                    Total TTL: {formatTTL(selectedFile.ttlSeconds)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Job Details Modal */}
      <Modal
        isOpen={isJobModalOpen}
        onClose={() => {
          setIsJobModalOpen(false);
          setSelectedJob(null);
        }}
        title={`Processing Job Details: ${selectedJob?.jobId || 'Unknown'}`}
        size="xl"
      >
        {selectedJob && (
          <div className="space-y-4">
            {/* Status and Key Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job ID</label>
                <p className="text-sm text-gray-900 font-mono break-all">{selectedJob.jobId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div>{getStatusBadge(selectedJob.status)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <p className="text-sm text-gray-900">{selectedJob.userId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Type</label>
                <p className="text-sm text-gray-900">{selectedJob.profileType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Progress</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${selectedJob.progress * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {Math.round(selectedJob.progress * 100)}%
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Retry Count</label>
                <p className="text-sm text-gray-900">{selectedJob.retryCount}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <p className="text-sm text-gray-900">{selectedJob.currency || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <p className="text-sm text-gray-900">
                  {selectedJob.completedAt && selectedJob.createdAt
                    ? `${Math.round((new Date(selectedJob.completedAt).getTime() - new Date(selectedJob.createdAt).getTime()) / 1000)}s`
                    : selectedJob.status === 'processing' || selectedJob.status === 'pending'
                    ? 'In progress...'
                    : '-'}
                </p>
              </div>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                <p className="text-sm text-gray-900">{formatDateTime(selectedJob.createdAt)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Updated At</label>
                <p className="text-sm text-gray-900">{formatDateTime(selectedJob.updatedAt)}</p>
              </div>
              {selectedJob.completedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completed At</label>
                  <p className="text-sm text-gray-900">{formatDateTime(selectedJob.completedAt)}</p>
                </div>
              )}
            </div>

            {/* Files Data */}
            {selectedJob.filesData && Array.isArray(selectedJob.filesData) && selectedJob.filesData.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <details className="group" open>
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                      <label className="block text-sm font-medium text-gray-700 cursor-pointer">
                        Files ({selectedJob.filesData.length})
                      </label>
                      <span className="text-xs text-gray-500 group-open:hidden">Click to expand</span>
                      <span className="text-xs text-gray-500 hidden group-open:inline">Click to collapse</span>
                    </div>
                  </summary>
                  <div className="mt-2 bg-gray-50 rounded-lg p-3 max-h-64 overflow-y-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedJob.filesData, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}

            {/* Files Status */}
            {selectedJob.filesStatus && Object.keys(selectedJob.filesStatus).length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <details className="group">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100">
                      <label className="block text-sm font-medium text-gray-700 cursor-pointer">
                        Files Status
                      </label>
                      <span className="text-xs text-gray-500 group-open:hidden">Click to expand</span>
                      <span className="text-xs text-gray-500 hidden group-open:inline">Click to collapse</span>
                    </div>
                  </summary>
                  <div className="mt-2 bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedJob.filesStatus, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}

            {/* Error Display */}
            {selectedJob.error && (
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-red-700 mb-2">Error Details</label>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 whitespace-pre-wrap font-mono">{selectedJob.error}</p>
                </div>
              </div>
            )}

            {/* Results */}
            {selectedJob.results && (
              <div className="pt-4 border-t border-gray-200">
                <details className="group" open>
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 cursor-pointer mb-1">
                          Processing Results
                        </label>
                        {selectedJob.results && typeof selectedJob.results === 'object' && 'message' in selectedJob.results && (
                          <p className="text-xs text-green-700 font-medium">{String(selectedJob.results.message)}</p>
                        )}
                        {selectedJob.results && typeof selectedJob.results === 'object' && 'transactions' in selectedJob.results && Array.isArray(selectedJob.results.transactions) && (
                          <p className="text-xs text-green-700 mt-1">
                            {selectedJob.results.transactions.length} transaction(s) extracted
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 group-open:hidden">Click to expand</span>
                      <span className="text-xs text-gray-500 hidden group-open:inline">Click to collapse</span>
                    </div>
                  </summary>
                  <div className="mt-2 bg-gray-50 rounded-lg p-3 max-h-96 overflow-y-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedJob.results, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}

            {(selectedJob.status === 'failed' || selectedJob.status === 'permanently_failed' || selectedJob.status === 'completed') && (
              <div className="pt-4 border-t border-gray-200">
                <Button
                  onClick={() => handleRetriggerJob(selectedJob.jobId)}
                  disabled={retriggeringJobId === selectedJob.jobId}
                  className="w-full"
                >
                  {retriggeringJobId === selectedJob.jobId ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Retriggering...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Retrigger Job
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

