import { useState, useEffect } from 'react';
import { Plus, Edit, RefreshCw, Filter, Download, Loader } from 'lucide-react';
import { Card, Button, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Pagination, Input, Checkbox } from '../components/ui';
import { MerchantForm } from '../components/features/merchants';
import { merchantsService } from '../services/api/merchants.service';
import { categoriesService } from '../services/api/categories.service';
import type { Merchant, CreateMerchantMappingDto, UpdateMerchantDto, MerchantsQueryParams } from '../types/merchant.types';
import type { Category } from '../types/category.types';

export function Merchants() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MerchantsQueryParams>({ page: 1, limit: 50 });
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });
  const [missingLogo, setMissingLogo] = useState(false);
  const [missingDomain, setMissingDomain] = useState(false);
  const [selectedMerchants, setSelectedMerchants] = useState<Set<number>>(new Set());
  const [isFetchingBrands, setIsFetchingBrands] = useState(false);

  useEffect(() => {
    loadMerchants();
    loadCategories();
  }, [filters]);

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm || undefined, page: 1 }));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    // Update filters when missing field toggles change
    setFilters(prev => ({
      ...prev,
      missingLogo: missingLogo ? 'true' : undefined,
      missingDomain: missingDomain ? 'true' : undefined,
      page: 1, // Reset to first page when filters change
    }));
  }, [missingLogo, missingDomain]);

  const loadMerchants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await merchantsService.getMerchants(filters);
      setMerchants(response.merchants || []);
      setPagination({
        total: response.total || 0,
        page: response.page || 1,
        limit: response.limit || 50,
        totalPages: response.totalPages || 1,
      });
    } catch (err: unknown) {
      // Handle 404 gracefully - endpoint may not exist
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          setError('Merchants endpoint not available');
          setMerchants([]);
        } else {
          setError('Failed to load merchants');
        }
      } else {
        setError('Failed to load merchants');
      }
      console.error('Merchants load error:', err);
      setMerchants([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await categoriesService.getCategories();
      setCategories(cats || []);
    } catch (err) {
      console.error('Failed to load categories', err);
      setCategories([]);
    }
  };

  const handleSubmit = async (data: CreateMerchantMappingDto & UpdateMerchantDto) => {
    try {
      if (editingMerchant) {
        // Use full update endpoint if merchant has an ID
        await merchantsService.updateMerchant(editingMerchant.id, data);
      } else {
        // Create new merchant with all fields
        await merchantsService.createMerchant(data);
      }
      setIsModalOpen(false);
      setEditingMerchant(null);
      loadMerchants();
    } catch (err) {
      throw err;
    }
  };

  const handleSelectMerchant = (merchantId: number, checked: boolean) => {
    setSelectedMerchants(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(merchantId);
      } else {
        newSet.delete(merchantId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMerchants(new Set(merchants.map(m => m.id)));
    } else {
      setSelectedMerchants(new Set());
    }
  };

  const handleBatchFetchBrands = async () => {
    if (selectedMerchants.size === 0) {
      alert('Please select at least one merchant to fetch brands for');
      return;
    }

    if (!confirm(`Fetch brands for ${selectedMerchants.size} selected merchant(s)?`)) {
      return;
    }

    try {
      setIsFetchingBrands(true);
      setError(null);
      const response = await merchantsService.batchFetchBrands({
        merchantIds: Array.from(selectedMerchants),
        async: true, // Use async mode for better UX
      });
      
      alert(`Successfully queued ${response.processed} merchant(s) for brand fetching. ${response.message || ''}`);
      setSelectedMerchants(new Set());
      // Reload merchants after a short delay to see updated data
      setTimeout(() => {
        loadMerchants();
      }, 2000);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to fetch brands';
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsFetchingBrands(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Merchant Management</h1>
          <p className="text-gray-600 mt-1">Manage merchant profiles and category mappings</p>
        </div>
        <Button onClick={() => {
          setEditingMerchant(null);
          setIsModalOpen(true);
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Merchant
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Merchant Mappings</h2>
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Search merchants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Button variant="ghost" size="sm" onClick={loadMerchants}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Missing Field Filters and Batch Actions */}
        <div className="mb-4 space-y-3">
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter by missing fields:
            </span>
            <div className="flex items-center gap-4">
              <Checkbox
                label="Missing Logo"
                checked={missingLogo}
                onChange={(e) => setMissingLogo(e.target.checked)}
              />
              <Checkbox
                label="Missing Domain"
                checked={missingDomain}
                onChange={(e) => setMissingDomain(e.target.checked)}
              />
              {(missingLogo || missingDomain) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMissingLogo(false);
                    setMissingDomain(false);
                  }}
                  className="ml-2"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {selectedMerchants.size > 0 && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-700">
                {selectedMerchants.size} merchant(s) selected
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleBatchFetchBrands}
                disabled={isFetchingBrands}
                isLoading={isFetchingBrands}
              >
                {isFetchingBrands ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Fetch Brands
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedMerchants(new Set())}
              >
                Clear Selection
              </Button>
            </div>
          )}
        </div>

        <Table isLoading={isLoading} emptyMessage="No merchant mappings found">
          <TableHeader>
            <TableRow>
              <TableHead>
                <Checkbox
                  checked={merchants.length > 0 && merchants.every(m => selectedMerchants.has(m.id))}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableHead>
              <TableHead>Logo</TableHead>
              <TableHead>Merchant Name</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Times Used</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {merchants.map((merchant) => (
              <TableRow key={merchant.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedMerchants.has(merchant.id)}
                    onChange={(e) => handleSelectMerchant(merchant.id, e.target.checked)}
                  />
                </TableCell>
                <TableCell>
                  {(() => {
                    const logoUrl = merchant.logoBase64 || merchant.logo;
                    const isBase64 = logoUrl?.startsWith('data:image');
                    
                    return logoUrl ? (
                      <div className="flex items-center justify-center w-12 h-12 bg-white rounded-lg border border-gray-200 p-1 relative group">
                        <img
                          src={logoUrl}
                          alt={merchant.merchantName}
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            // Fallback to placeholder if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.parentElement) {
                              target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Logo</div>';
                            }
                          }}
                        />
                        {isBase64 && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" title="Base64 Logo" />
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg border border-gray-200">
                        <span className="text-gray-400 text-xs">No Logo</span>
                      </div>
                    );
                  })()}
                </TableCell>
                <TableCell className="font-medium">
                  <div>
                    <div>{merchant.merchantName}</div>
                    {merchant.brandName && merchant.brandName !== merchant.merchantName && (
                      <div className="text-xs text-gray-500">{merchant.brandName}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {merchant.domain ? (
                    <a
                      href={`https://${merchant.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                    >
                      {merchant.domain}
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {merchant.category ? (
                    <span className="px-2 py-1 text-xs rounded bg-gray-100">
                      {merchant.category.name}
                    </span>
                  ) : (
                    <span className="text-gray-400">No category</span>
                  )}
                </TableCell>
                <TableCell>
                  {merchant.timesUsed !== undefined ? (
                    <span className="text-gray-700">{merchant.timesUsed}</span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {merchant.lastUsed ? (
                    <span className="text-sm text-gray-600">
                      {new Date(merchant.lastUsed).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {merchant.confidence !== undefined ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 w-16">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${merchant.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {(merchant.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingMerchant(merchant);
                      setIsModalOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={(page) => setFilters({ ...filters, page })}
            />
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMerchant(null);
        }}
        title={editingMerchant ? 'Edit Merchant' : 'Create Merchant'}
        size="md"
      >
        <MerchantForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingMerchant(null);
          }}
          initialData={editingMerchant ? {
            id: editingMerchant.id,
            merchantName: editingMerchant.merchantName,
            categoryId: editingMerchant.categoryId || 0,
            confidence: editingMerchant.confidence,
            domain: editingMerchant.domain,
            brandName: editingMerchant.brandName,
            industry: editingMerchant.industry,
            logo: editingMerchant.logo,
            logoBase64: editingMerchant.logoBase64 || editingMerchant.logo,
          } : undefined}
          categories={categories}
        />
      </Modal>
    </div>
  );
}
