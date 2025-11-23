import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Eye, Search } from 'lucide-react';
import { Card, Button, Input, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination, Modal, Select } from '../components/ui';
import { filesJobsService } from '../services/api/files-jobs.service';
import type { PeriodInsightRecord, AllInsightsRequest } from '../types/admin-insights.types';
import { formatDateTime } from '../utils/formatters';

export function Insights() {
  const [insights, setInsights] = useState<PeriodInsightRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [userIdFilter, setUserIdFilter] = useState<string>('');
  const [profileTypeFilter, setProfileTypeFilter] = useState<string>('');
  const [insightTypeFilter, setInsightTypeFilter] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<'user_insights' | 'insight_summaries' | 'all'>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Pagination
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  
  // Modal state
  const [selectedInsight, setSelectedInsight] = useState<PeriodInsightRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadInsights = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params: AllInsightsRequest = {
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
      };
      
      if (userIdFilter) {
        const userId = parseInt(userIdFilter, 10);
        if (!isNaN(userId)) {
          params.userId = userId;
        }
      }
      
      if (profileTypeFilter) {
        params.profileType = profileTypeFilter;
      }
      
      if (insightTypeFilter) {
        params.insightType = insightTypeFilter;
      }
      
      if (sourceFilter && sourceFilter !== 'all') {
        params.source = sourceFilter;
      }
      
      if (startDateFilter) {
        params.startDate = new Date(startDateFilter).toISOString();
      }
      
      if (endDateFilter) {
        params.endDate = new Date(endDateFilter).toISOString();
      }
      
      const response = await filesJobsService.getAllInsights(params);
      setInsights(response.insights || []);
      setPagination(prev => ({
        ...prev,
        total: response.totalCount || 0,
        totalPages: Math.ceil((response.totalCount || 0) / prev.limit),
      }));
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to load insights';
      setError(errorMessage);
      console.error('Error loading insights:', err);
      setInsights([]);
    } finally {
      setIsLoading(false);
    }
  }, [userIdFilter, profileTypeFilter, insightTypeFilter, sourceFilter, startDateFilter, endDateFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  // Reset pagination when filters change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [userIdFilter, profileTypeFilter, insightTypeFilter, sourceFilter, startDateFilter, endDateFilter]);

  const filteredInsights = insights.filter((insight) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      insight.userId.toString().includes(searchLower) ||
      insight.profileType.toLowerCase().includes(searchLower) ||
      insight.insightType.toLowerCase().includes(searchLower) ||
      JSON.stringify(insight.data).toLowerCase().includes(searchLower)
    );
  });

  const handleViewInsight = (insight: PeriodInsightRecord) => {
    setSelectedInsight(insight);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Users' Insights</h1>
          <p className="text-gray-600 mt-1">View insights across all users</p>
        </div>
        <Button onClick={loadInsights} disabled={isLoading} variant="secondary">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
          <Input
            type="number"
            placeholder="User ID"
            value={userIdFilter}
            onChange={(e) => setUserIdFilter(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Profile Type"
            value={profileTypeFilter}
            onChange={(e) => setProfileTypeFilter(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Insight Type"
            value={insightTypeFilter}
            onChange={(e) => setInsightTypeFilter(e.target.value)}
          />
          <Select
            placeholder="Source"
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value as 'user_insights' | 'insight_summaries' | 'all')}
            options={[
              { value: 'all', label: 'All Sources' },
              { value: 'user_insights', label: 'User Insights' },
              { value: 'insight_summaries', label: 'Insight Summaries' },
            ]}
          />
          <Input
            type="date"
            placeholder="Start Date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
          />
          <Input
            type="date"
            placeholder="End Date"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
          />
        </div>
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search insights..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
      </Card>

      <Card title={`Insights (${pagination.total} total)`}>
        <Table isLoading={isLoading} emptyMessage="No insights found">
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Profile Type</TableHead>
              <TableHead>Insight Type</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Period Start</TableHead>
              <TableHead>Period End</TableHead>
              <TableHead>Generated At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInsights.map((insight) => (
              <TableRow key={insight.id}>
                <TableCell className="font-mono text-xs">{insight.id}</TableCell>
                <TableCell>
                  <span className="font-medium">{insight.userId}</span>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                    {insight.profileType}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                    {insight.insightType}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs rounded ${
                    insight.source === 'user_insights' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {insight.source === 'user_insights' ? 'User Insights' : 'Summaries'}
                  </span>
                </TableCell>
                <TableCell>{insight.periodStart ? formatDateTime(insight.periodStart) : '-'}</TableCell>
                <TableCell>{insight.periodEnd ? formatDateTime(insight.periodEnd) : '-'}</TableCell>
                <TableCell>
                  {insight.generatedAt ? formatDateTime(insight.generatedAt) : '-'}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewInsight(insight)}
                    title="View insight details"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {pagination.totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
              onItemsPerPageChange={(limit) => setPagination(prev => ({ ...prev, limit, page: 1 }))}
            />
          </div>
        )}
      </Card>

      {/* Insight Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedInsight(null);
        }}
        title={`Insight Details: ${selectedInsight?.insightType || 'Unknown'}`}
        size="xl"
      >
        {selectedInsight && (
          <div className="space-y-4">
            {/* Basic Info Section */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                <p className="text-sm text-gray-900 font-mono break-all">{selectedInsight.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <p className="text-sm text-gray-900">{selectedInsight.userId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Profile Type</label>
                <p className="text-sm text-gray-900">{selectedInsight.profileType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insight Type</label>
                <p className="text-sm text-gray-900">{selectedInsight.insightType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <p className="text-sm text-gray-900">
                  <span className={`px-2 py-1 text-xs rounded ${
                    selectedInsight.source === 'user_insights' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    {selectedInsight.source === 'user_insights' ? 'User Insights' : 'Insight Summaries'}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Generated At</label>
                <p className="text-sm text-gray-900">{selectedInsight.generatedAt ? formatDateTime(selectedInsight.generatedAt) : '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
                <p className="text-sm text-gray-900">{selectedInsight.periodStart ? formatDateTime(selectedInsight.periodStart) : '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
                <p className="text-sm text-gray-900">{selectedInsight.periodEnd ? formatDateTime(selectedInsight.periodEnd) : '-'}</p>
              </div>
              {selectedInsight.currency && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <p className="text-sm text-gray-900">{selectedInsight.currency}</p>
                </div>
              )}
            </div>

            {/* Summary Message */}
            {selectedInsight.summaryMessage && (
              <div className="pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">Summary Message</label>
                <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedInsight.summaryMessage}
                  </div>
                </div>
              </div>
            )}

            {/* Full JSON View */}
            <div className="pt-4 border-t border-gray-200">
              <details className="group" open>
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100">
                    <label className="block text-sm font-medium text-gray-700 cursor-pointer">
                      Full Insight JSON
                    </label>
                    <span className="text-xs text-gray-500 group-open:hidden">Click to expand</span>
                    <span className="text-xs text-gray-500 hidden group-open:inline">Click to collapse</span>
                  </div>
                </summary>
                <div className="mt-2 bg-gray-900 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                  <pre className="text-xs text-gray-100 whitespace-pre-wrap font-mono">
                    {JSON.stringify(selectedInsight, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
