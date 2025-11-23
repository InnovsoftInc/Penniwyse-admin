import { useState, useEffect, useCallback } from 'react';
import { Eye, RefreshCw, Calendar, DollarSign, Tag, Building2, MapPin, FileText, CheckCircle, XCircle, Filter, Sparkles } from 'lucide-react';
import { Card, Button, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination, Checkbox } from '../components/ui';
import { TransactionFilters } from '../components/features/transactions';
import { transactionsService } from '../services/api/transactions.service';
import { categoriesService } from '../services/api/categories.service';
import type { Transaction, TransactionQueryParams, MissingInfoQueryParams } from '../types/transaction.types';
import type { Category } from '../types/category.types';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<TransactionQueryParams>({ page: 1, limit: 20 });
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [error, setError] = useState<string | null>(null);
  
  // Missing info filter state
  const [isMissingInfoModalOpen, setIsMissingInfoModalOpen] = useState(false);
  const [missingInfoFilters, setMissingInfoFilters] = useState<MissingInfoQueryParams>({
    missingCategory: true,
    page: 1,
    limit: 50,
  });
  const [isLoadingMissingInfo, setIsLoadingMissingInfo] = useState(false);
  const [isUsingMissingInfoFilter, setIsUsingMissingInfoFilter] = useState(false);
  
  // Batch categorization state
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<number>>(new Set());
  const [isBatchCategorizing, setIsBatchCategorizing] = useState(false);

  useEffect(() => {
    loadTransactions();
    loadCategories();
  }, [filters]);

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await transactionsService.getTransactions(filters);
      
      // Handle both array response and paginated response
      if (Array.isArray(response)) {
        // API returned array directly
        setTransactions(response);
        setPagination({
          total: response.length,
          page: filters.page || 1,
          limit: filters.limit || 20,
          totalPages: Math.ceil(response.length / (filters.limit || 20)),
        });
      } else if (response && typeof response === 'object' && 'items' in response) {
        // API returned paginated response with items/meta
        setTransactions(response.items || []);
        setPagination(response.meta || { total: 0, page: 1, limit: 20, totalPages: 1 });
      } else if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        // API returned PaginatedResponse format
        setTransactions(response.data);
        setPagination({
          total: response.total || response.data.length,
          page: response.page || filters.page || 1,
          limit: response.limit || filters.limit || 20,
          totalPages: response.totalPages || Math.ceil((response.total || response.data.length) / (response.limit || filters.limit || 20)),
        });
      } else {
        // Fallback
        setTransactions([]);
        setPagination({ total: 0, page: 1, limit: 20, totalPages: 1 });
      }
    } catch (err) {
      setError('Failed to load transactions');
      console.error('Transaction load error:', err);
      setTransactions([]);
      setPagination({ total: 0, page: 1, limit: 20, totalPages: 1 });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await categoriesService.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsModalOpen(true);
  };

  const handleFilterChange = (newFilters: TransactionQueryParams) => {
    setFilters({ ...newFilters, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const loadMissingInfoTransactions = useCallback(async () => {
    try {
      setIsLoadingMissingInfo(true);
      setIsLoading(true);
      setError(null);
      const response = await transactionsService.getTransactionsWithMissingInfo(missingInfoFilters);
      
      // Handle both array response and paginated response
      if (Array.isArray(response)) {
        setTransactions(response);
        setPagination({
          total: response.length,
          page: missingInfoFilters.page || 1,
          limit: missingInfoFilters.limit || 50,
          totalPages: Math.ceil(response.length / (missingInfoFilters.limit || 50)),
        });
      } else if (response && typeof response === 'object' && 'items' in response) {
        setTransactions(response.items || []);
        setPagination(response.meta || { total: 0, page: 1, limit: 50, totalPages: 1 });
      } else if (response && typeof response === 'object' && 'data' in response && Array.isArray(response.data)) {
        setTransactions(response.data);
        setPagination({
          total: response.total || response.data.length,
          page: response.page || missingInfoFilters.page || 1,
          limit: response.limit || missingInfoFilters.limit || 50,
          totalPages: response.totalPages || Math.ceil((response.total || response.data.length) / (response.limit || missingInfoFilters.limit || 50)),
        });
      }
      setIsUsingMissingInfoFilter(true);
      setIsMissingInfoModalOpen(false);
    } catch (err) {
      setError('Failed to load transactions with missing information');
      console.error('Missing info load error:', err);
    } finally {
      setIsLoadingMissingInfo(false);
      setIsLoading(false);
    }
  }, [missingInfoFilters]);

  const handleMissingInfoPageChange = (page: number) => {
    setMissingInfoFilters({ ...missingInfoFilters, page });
  };

  useEffect(() => {
    if (isUsingMissingInfoFilter) {
      loadMissingInfoTransactions();
    }
  }, [missingInfoFilters.page, missingInfoFilters.limit, isUsingMissingInfoFilter, loadMissingInfoTransactions]);

  const handleBatchCategorize = async () => {
    if (selectedTransactionIds.size === 0) {
      setError('Please select at least one transaction to categorize');
      return;
    }

    if (!confirm(`Are you sure you want to categorize ${selectedTransactionIds.size} transaction(s)? This will use AI to automatically categorize them.`)) {
      return;
    }

    try {
      setIsBatchCategorizing(true);
      setError(null);
      const response = await transactionsService.batchCategorizeTransactions({
        transactionIds: Array.from(selectedTransactionIds),
      });

      if (response.errors && response.errors.length > 0) {
        setError(`Categorized ${response.processed} transaction(s). ${response.errors.length} failed.`);
      } else {
        setError(null);
      }

      // Clear selection and reload transactions
      setSelectedTransactionIds(new Set());
      await loadTransactions();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to categorize transactions';
      setError(errorMessage);
      console.error('Batch categorize error:', err);
    } finally {
      setIsBatchCategorizing(false);
    }
  };

  const handleToggleSelection = (transactionId: number) => {
    const newSelection = new Set(selectedTransactionIds);
    if (newSelection.has(transactionId)) {
      newSelection.delete(transactionId);
    } else {
      newSelection.add(transactionId);
    }
    setSelectedTransactionIds(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedTransactionIds.size === transactions.length) {
      setSelectedTransactionIds(new Set());
    } else {
      setSelectedTransactionIds(new Set(transactions.map(t => t.id)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>
          <p className="text-gray-600 mt-1">
            {isUsingMissingInfoFilter ? 'Transactions with missing information' : 'View all transactions'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isUsingMissingInfoFilter && (
            <Button
              variant="secondary"
              onClick={() => {
                setIsUsingMissingInfoFilter(false);
                setMissingInfoFilters({ missingCategory: true, page: 1, limit: 50 });
                loadTransactions();
              }}
            >
              Clear Filter
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => setIsMissingInfoModalOpen(true)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter Missing Info
          </Button>
          {selectedTransactionIds.size > 0 && (
            <Button
              onClick={handleBatchCategorize}
              isLoading={isBatchCategorizing}
              disabled={isBatchCategorizing}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Batch Categorize ({selectedTransactionIds.size})
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <TransactionFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
      />

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Transactions</h2>
          <Button variant="ghost" size="sm" onClick={loadTransactions}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Table isLoading={isLoading} emptyMessage="No transactions found">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTransactionIds.size === transactions.length && transactions.length > 0}
                  onChange={handleSelectAll}
                  onClick={(e) => e.stopPropagation()}
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id} className="hover:bg-gray-50">
                <TableCell>
                  <Checkbox
                    checked={selectedTransactionIds.has(transaction.id)}
                    onChange={() => handleToggleSelection(transaction.id)}
                  />
                </TableCell>
                <TableCell>{formatDate(transaction.date)}</TableCell>
                <TableCell>{transaction.description || transaction.title || '-'}</TableCell>
                <TableCell>{transaction.merchant || '-'}</TableCell>
                <TableCell>
                  {transaction.category ? (
                    <span className="px-2 py-1 text-xs rounded bg-gray-100">
                      {transaction.category.name}
                    </span>
                  ) : (
                    <span className="text-gray-400">Uncategorized</span>
                  )}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs rounded ${
                    transaction.type === 'income' ? 'bg-green-100 text-green-700' :
                    transaction.type === 'expense' ? 'bg-red-100 text-red-700' :
                    transaction.type === 'savings' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {transaction.type}
                  </span>
                </TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(parseFloat(transaction.amount), transaction.currency)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(transaction)}
                    title="View transaction details"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {pagination && pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
            onPageChange={isUsingMissingInfoFilter ? handleMissingInfoPageChange : handlePageChange}
          />
        )}
      </Card>

      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedTransaction(null);
        }}
        title="Transaction Details"
        size="xl"
      >
        {selectedTransaction && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4" />
                    Date
                  </label>
                  <p className="text-gray-900">{formatDate(selectedTransaction.date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-1">
                    <DollarSign className="w-4 h-4" />
                    Amount
                  </label>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(parseFloat(selectedTransaction.amount), selectedTransaction.currency)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-1">
                    <Tag className="w-4 h-4" />
                    Type
                  </label>
                  <span className={`inline-block px-3 py-1 text-sm rounded ${
                    selectedTransaction.type === 'income' ? 'bg-green-100 text-green-700' :
                    selectedTransaction.type === 'expense' ? 'bg-red-100 text-red-700' :
                    selectedTransaction.type === 'savings' ? 'bg-blue-100 text-blue-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {selectedTransaction.type.charAt(0).toUpperCase() + selectedTransaction.type.slice(1)}
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-1">
                    <Building2 className="w-4 h-4" />
                    Merchant
                  </label>
                  <p className="text-gray-900">{selectedTransaction.merchant || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-1">
                    <Tag className="w-4 h-4" />
                    Category
                  </label>
                  {selectedTransaction.category ? (
                    <span className="inline-block px-3 py-1 text-sm rounded bg-gray-100 text-gray-900">
                      {selectedTransaction.category.name}
                    </span>
                  ) : (
                    <span className="text-gray-400">Uncategorized</span>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-1">
                    Source
                  </label>
                  <span className={`inline-block px-3 py-1 text-sm rounded ${
                    selectedTransaction.source === 'manual' ? 'bg-blue-100 text-blue-700' :
                    selectedTransaction.source === 'bank' ? 'bg-green-100 text-green-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {selectedTransaction.source.charAt(0).toUpperCase() + selectedTransaction.source.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Description and Title */}
            {(selectedTransaction.title || selectedTransaction.description) && (
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4" />
                  Description
                </label>
                <div className="bg-gray-50 rounded-lg p-4">
                  {selectedTransaction.title && (
                    <p className="font-semibold text-gray-900 mb-1">{selectedTransaction.title}</p>
                  )}
                  {selectedTransaction.description && (
                    <p className="text-gray-700">{selectedTransaction.description}</p>
                  )}
                </div>
              </div>
            )}

            {/* Location */}
            {selectedTransaction.location && (
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4" />
                  Location
                </label>
                <p className="text-gray-900">{selectedTransaction.location}</p>
              </div>
            )}

            {/* Additional Information */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Additional Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Taxable:</span>
                  {selectedTransaction.taxable ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Has Receipt:</span>
                  {selectedTransaction.hasReceipt ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Transaction ID:</span>
                  <span className="ml-2 text-gray-900 font-mono">{selectedTransaction.id}</span>
                </div>
                <div>
                  <span className="text-gray-500">User ID:</span>
                  <span className="ml-2 text-gray-900">{selectedTransaction.userId}</span>
                </div>
                <div>
                  <span className="text-gray-500">Created At:</span>
                  <span className="ml-2 text-gray-900">{formatDateTime(selectedTransaction.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Updated At:</span>
                  <span className="ml-2 text-gray-900">{formatDateTime(selectedTransaction.updatedAt)}</span>
                </div>
                {selectedTransaction.integrationId && (
                  <div>
                    <span className="text-gray-500">Integration ID:</span>
                    <span className="ml-2 text-gray-900">{selectedTransaction.integrationId}</span>
                  </div>
                )}
                {selectedTransaction.financialAccountId && (
                  <div>
                    <span className="text-gray-500">Financial Account ID:</span>
                    <span className="ml-2 text-gray-900">{selectedTransaction.financialAccountId}</span>
                  </div>
                )}
                {selectedTransaction.incomeSourceId && (
                  <div>
                    <span className="text-gray-500">Income Source ID:</span>
                    <span className="ml-2 text-gray-900">{selectedTransaction.incomeSourceId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Missing Info Filter Modal */}
      <Modal
        isOpen={isMissingInfoModalOpen}
        onClose={() => setIsMissingInfoModalOpen(false)}
        title="Filter Transactions by Missing Information"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Options
            </label>
            <div className="space-y-3">
              <Checkbox
                label="Missing Category (Uncategorized)"
                checked={missingInfoFilters.missingCategory || false}
                onChange={(e) => setMissingInfoFilters({ ...missingInfoFilters, missingCategory: e.target.checked })}
              />
              <Checkbox
                label="Missing Description"
                checked={missingInfoFilters.missingDescription || false}
                onChange={(e) => setMissingInfoFilters({ ...missingInfoFilters, missingDescription: e.target.checked })}
              />
              <Checkbox
                label="Missing Merchant"
                checked={missingInfoFilters.missingMerchant || false}
                onChange={(e) => setMissingInfoFilters({ ...missingInfoFilters, missingMerchant: e.target.checked })}
              />
              <Checkbox
                label="Missing Type"
                checked={missingInfoFilters.missingType || false}
                onChange={(e) => setMissingInfoFilters({ ...missingInfoFilters, missingType: e.target.checked })}
              />
              <Checkbox
                label="Pending Categorization"
                checked={missingInfoFilters.pendingCategorization || false}
                onChange={(e) => setMissingInfoFilters({ ...missingInfoFilters, pendingCategorization: e.target.checked })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID (optional)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Filter by user ID"
                value={missingInfoFilters.userId || ''}
                onChange={(e) => setMissingInfoFilters({ 
                  ...missingInfoFilters, 
                  userId: e.target.value ? parseInt(e.target.value, 10) : undefined,
                  page: 1, // Reset to first page when filter changes
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Items Per Page
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="1"
                max="100"
                value={missingInfoFilters.limit || 50}
                onChange={(e) => setMissingInfoFilters({ 
                  ...missingInfoFilters, 
                  limit: parseInt(e.target.value, 10) || 50,
                  page: 1, // Reset to first page when limit changes
                })}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={loadMissingInfoTransactions}
              isLoading={isLoadingMissingInfo}
              disabled={isLoadingMissingInfo}
            >
              Apply Filter
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsMissingInfoModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
