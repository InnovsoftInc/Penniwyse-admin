import { useEffect, useState, useRef } from 'react';
import { Users, CreditCard, DollarSign, TrendingUp, Activity } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { dashboardService } from '../services/api/dashboard.service';
import { usersService } from '../services/api/users.service';
import { transactionsService } from '../services/api/transactions.service';
import type { DashboardStats, SystemHealth } from '../types/dashboard.types';
import { formatCurrency } from '../utils/formatters';
import { requestCache } from '../utils/requestCache';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
  });
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Use cache to prevent duplicate requests (30 second cache)
      // Health endpoint may not exist, so we catch and ignore 404s
      const [transactionsResponse, healthData] = await Promise.all([
        requestCache.get(
          'dashboard-transactions-summary',
          () => transactionsService.getTransactionSummary().catch(() => ({ summary: { totalTransactions: 0, totalAmount: 0 } })),
          30000 // 30 seconds
        ),
        requestCache.get(
          'dashboard-health',
          () => dashboardService.getSystemHealth().catch((err) => {
            // Silently ignore 404s for health endpoint if it doesn't exist
            if (err?.response?.status === 404) {
              return null;
            }
            console.warn('Failed to load system health:', err);
            return null;
          }),
          60000 // 1 minute
        ),
      ]);

      // Try to get users count if endpoint exists, otherwise use 0
      let usersCount = 0;
      try {
        const usersResponse = await requestCache.get(
          'dashboard-users-count',
          () => usersService.getUsers({ limit: 1 }),
          30000 // 30 seconds
        );
        usersCount = usersResponse.total || 0;
      } catch {
        // Endpoint doesn't exist, use default
        usersCount = 0;
      }

      setStats({
        totalUsers: usersCount,
        activeUsers: usersCount,
        totalTransactions: transactionsResponse.summary?.totalTransactions || 0,
        totalRevenue: transactionsResponse.summary?.totalAmount || 0,
      });
      
      setHealth(healthData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers.toLocaleString(),
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Transactions',
      value: stats.totalTransactions.toLocaleString(),
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  // Mock chart data - replace with real data from API
  const transactionData = [
    { month: 'Jan', transactions: 1200, revenue: 45000 },
    { month: 'Feb', transactions: 1500, revenue: 52000 },
    { month: 'Mar', transactions: 1800, revenue: 61000 },
    { month: 'Apr', transactions: 1600, revenue: 58000 },
    { month: 'May', transactions: 2000, revenue: 72000 },
    { month: 'Jun', transactions: 2200, revenue: 79000 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to the Penniwyse Admin Dashboard</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {health && (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                health.status === 'healthy' ? 'bg-green-500' :
                health.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="font-medium">System Status: {health.status}</span>
            </div>
            <span className="text-sm text-gray-500">
              Last checked: {new Date(health.timestamp).toLocaleString()}
            </span>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-20 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Transaction Trends">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={transactionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="transactions" stroke="#8884d8" name="Transactions" />
              <Line type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Monthly Revenue">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transactionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Activity">
          <p className="text-gray-600">Activity feed will be displayed here</p>
        </Card>
        <Card title="Quick Actions">
          <div className="space-y-2">
            <a href="/users" className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors">
              View All Users
            </a>
            <a href="/categories" className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors">
              Manage Categories
            </a>
            <a href="/settings" className="block w-full text-left px-4 py-2 hover:bg-gray-50 rounded-lg transition-colors">
              System Settings
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
