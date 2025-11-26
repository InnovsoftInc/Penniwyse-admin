import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui';
import { usersService } from '../services/api/users.service';
import { authService } from '../services/api/auth.service';
import { UserForm } from '../components/features/users/UserForm';
import type { User } from '../types/user.types';
import type { AdminSignUpFormData } from '../utils/validators';
import { formatDate } from '../utils/formatters';
import { requestCache } from '../utils/requestCache';
import { Search, Eye, Edit, Plus } from 'lucide-react';

export function Users() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isCreateUserLoading, setIsCreateUserLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    // Debounce search to prevent too many requests
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      loadUsers();
    }, 300); // Wait 300ms after user stops typing

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const cacheKey = `users-${searchTerm || 'all'}`;
      const response = await requestCache.get(
        cacheKey,
        () => usersService.getUsers({ search: searchTerm, limit: 100 }),
        10000 // 10 second cache
      );
      setUsers(response.items || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      // Endpoint may not exist - show empty state
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewUser = (user: User) => {
    navigate(`/users/${user.id}`);
  };

  const handleCreateUser = async (data: AdminSignUpFormData) => {
    try {
      setIsCreateUserLoading(true);
      await authService.adminSignUp(data);
      alert('User created successfully');
      setIsCreateUserModalOpen(false);
      // Clear cache and reload users
      requestCache.clearAll();
      await loadUsers();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create user';
      alert(errorMessage);
      console.error('Failed to create user:', error);
    } finally {
      setIsCreateUserLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage all users and their accounts</p>
        </div>
        <Button onClick={() => setIsCreateUserModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </div>

      <Card>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search users by email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Table isLoading={isLoading} emptyMessage="No users found">
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.id}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {user.role}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      user.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleViewUser(user)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Modal
        isOpen={isCreateUserModalOpen}
        onClose={() => {
          setIsCreateUserModalOpen(false);
        }}
        title="Create New User"
        size="md"
      >
        <UserForm
          onSubmit={handleCreateUser}
          onCancel={() => {
            setIsCreateUserModalOpen(false);
          }}
          isLoading={isCreateUserLoading}
        />
      </Modal>
    </div>
  );
}
