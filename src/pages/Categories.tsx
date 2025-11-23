import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { Card, Button, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui';
import { CategoryForm, CategoryTree } from '../components/features/categories';
import { categoriesService } from '../services/api/categories.service';
import type { Category, CategoryTree as CategoryTreeType, CreateCategoryDto, UpdateCategoryDto } from '../types/category.types';

export function Categories() {
  const [categories, setCategories] = useState<CategoryTreeType[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'tree'>('table');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [tree, flat] = await Promise.all([
        categoriesService.getCategoryTree(),
        categoriesService.getCategories(),
      ]);
      setCategories(tree);
      setFlatCategories(flat);
    } catch (err) {
      setError('Failed to load categories');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (data: CreateCategoryDto) => {
    try {
      await categoriesService.createCategory(data);
      setIsModalOpen(false);
      loadCategories();
    } catch (err) {
      throw err;
    }
  };

  const handleUpdate = async (data: UpdateCategoryDto) => {
    if (!editingCategory) return;
    try {
      await categoriesService.updateCategory(editingCategory.id, data);
      setIsModalOpen(false);
      setEditingCategory(null);
      loadCategories();
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? This action cannot be undone.')) return;
    try {
      await categoriesService.deleteCategory(id);
      loadCategories();
    } catch (err) {
      setError('Failed to delete category');
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600 mt-1">Manage transaction categories</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2 text-sm rounded-l-lg ${viewMode === 'table' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('tree')}
              className={`px-4 py-2 text-sm rounded-r-lg ${viewMode === 'tree' ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Tree View
            </button>
          </div>
          <Button onClick={() => {
            setEditingCategory(null);
            setIsModalOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Categories</h2>
          <Button variant="ghost" size="sm" onClick={loadCategories}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading categories...</div>
        ) : viewMode === 'table' ? (
          <Table isLoading={isLoading} emptyMessage="No categories found">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Parent Category</TableHead>
                <TableHead>Taxable</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flatCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded ${
                      category.type === 'income' ? 'bg-green-100 text-green-700' :
                      category.type === 'expense' ? 'bg-red-100 text-red-700' :
                      category.type === 'savings' ? 'bg-blue-100 text-blue-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {category.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    {category.parentCategory ? (
                      <span className="text-gray-700">{category.parentCategory.name}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {category.taxable ? (
                      <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-700">Yes</span>
                    ) : (
                      <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">No</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCategory(category);
                          setIsModalOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <CategoryTree
            categories={categories}
            onEdit={(cat) => {
              setEditingCategory(cat);
              setIsModalOpen(true);
            }}
            onDelete={(cat) => handleDelete(cat.id)}
          />
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        size="md"
      >
        <CategoryForm
          onSubmit={editingCategory ? handleUpdate : handleCreate}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingCategory(null);
          }}
          initialData={editingCategory ? {
            name: editingCategory.name,
            type: editingCategory.type,
            taxable: editingCategory.taxable,
            parentCategoryId: editingCategory.parentCategoryId || null,
          } : undefined}
          parentCategories={flatCategories.filter(cat => cat.id !== editingCategory?.id)}
        />
      </Modal>
    </div>
  );
}
