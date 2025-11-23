import { useState, useEffect, useRef } from 'react';
import { RefreshCw, Users, TrendingUp, DollarSign } from 'lucide-react';
import { Card, Button } from '../components/ui';
import { usersService } from '../services/api/users.service';
import { transactionsService } from '../services/api/transactions.service';
import { formatCurrency } from '../utils/formatters';
import { requestCache } from '../utils/requestCache';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Analytics() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState({ total: 0, active: 0 });
  const [transactionStats, setTransactionStats] = useState({ total: 0, amount: 0 });
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use cache to prevent duplicate requests
      let usersCount = 0;
      try {
        const usersResponse = await requestCache.get(
          'analytics-users-count',
          () => usersService.getUsers({ limit: 1 }),
          30000 // 30 seconds
        );
        usersCount = usersResponse.total || 0;
      } catch {
        // Endpoint doesn't exist, use default
        usersCount = 0;
      }

      const transactionsResponse = await requestCache.get(
        'analytics-transactions-summary',
        () => transactionsService.getTransactionSummary().catch(() => ({ summary: { totalTransactions: 0, totalAmount: 0 } })),
        30000 // 30 seconds
      );

      setUserStats({
        total: usersCount,
        active: usersCount,
      });

      setTransactionStats({
        total: transactionsResponse.summary?.totalTransactions || 0,
        amount: transactionsResponse.summary?.totalAmount || 0,
      });
    } catch (err) {
      setError('Failed to load analytics');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Mock data for charts - replace with real data
  const userGrowthData = [
    { month: 'Jan', users: 1000 },
    { month: 'Feb', users: 1200 },
    { month: 'Mar', users: 1500 },
    { month: 'Apr', users: 1800 },
    { month: 'May', users: 2100 },
    { month: 'Jun', users: 2500 },
  ];

  const transactionVolumeData = [
    { month: 'Jan', volume: 12000, amount: 450000 },
    { month: 'Feb', volume: 15000, amount: 520000 },
    { month: 'Mar', volume: 18000, amount: 610000 },
    { month: 'Apr', volume: 16000, amount: 580000 },
    { month: 'May', volume: 20000, amount: 720000 },
    { month: 'Jun', volume: 22000, amount: 790000 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">System-wide analytics and metrics</p>
        </div>
        <Button variant="ghost" size="sm" onClick={loadAnalytics}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.total.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{userStats.active.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{transactionStats.total.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-600" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(transactionStats.amount)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-600" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="User Growth">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="users" stroke="#8884d8" fill="#8884d8" name="Users" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Transaction Volume">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={transactionVolumeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="volume" stroke="#8884d8" name="Volume" />
              <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#82ca9d" name="Amount" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
