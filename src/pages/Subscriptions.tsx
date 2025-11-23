import { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { Card, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui';
import { usersService } from '../services/api/users.service';
import type { User } from '../types/user.types';
import { formatDate } from '../utils/formatters';
import { requestCache } from '../utils/requestCache';

export function Subscriptions() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await requestCache.get(
        'subscriptions-users',
        () => usersService.getUsers({ limit: 100 }),
        30000 // 30 seconds
      );
      setUsers(response.items || []);
    } catch (err) {
      setError('Failed to load subscriptions');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600 mt-1">Manage subscriptions and billing</p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadSubscriptions}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <Card>
        <Table isLoading={isLoading} emptyMessage="No subscriptions found">
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.email}
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs rounded ${
                    user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-gray-600">-</span>
                </TableCell>
                <TableCell>{formatDate(user.createdAt)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    Manage
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
