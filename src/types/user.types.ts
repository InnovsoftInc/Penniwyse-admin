export interface User {
  id: number;
  email: string;
  type?: string;
  role: string;
  createdAt: Date;
  isActive: boolean;
  lastActive?: Date;
  passwordHash?: string;
}

export interface UserProfile {
  id: number;
  email: string;
  type?: string;
  role: string;
  createdAt: Date;
  isActive: boolean;
  lastActive?: Date;
  linkedBanks?: BankAccount[];
  subscriptionStatus?: SubscriptionStatus;
  xp?: number;
  badges?: Badge[];
  streaks?: Streak[];
}

export interface BankAccount {
  id: string;
  name: string;
  type: string;
  lastSync?: Date;
}

export interface SubscriptionStatus {
  status: 'active' | 'inactive' | 'trial' | 'cancelled';
  plan?: string;
  expiresAt?: Date;
}

export interface Badge {
  id: number;
  name: string;
  icon?: string;
  earnedAt: Date;
}

export interface Streak {
  type: string;
  count: number;
  lastUpdated: Date;
}

export interface LoginHistory {
  id: number;
  userId: number;
  ipAddress: string;
  userAgent: string;
  loginAt: Date;
}

export interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

export interface UserDetailsResponse {
  success: boolean;
  user: {
    id: number;
    email: string;
  };
  profile?: {
    id: number;
    userId: number;
    fullName?: string;
    type?: string;
    [key: string]: any;
  };
  devices?: Array<{
    id: string;
    token: string;
    deviceName?: string | null;
    deviceModel?: string | null;
    platform?: string | null;
    registeredAt?: Date | string;
    lastActiveAt?: Date | string | null;
  }>;
  notifications?: {
    items: Array<{
      id: number;
      type: string;
      title: string | null;
      message: string;
      sentAt: Date | string;
      isRead: boolean;
      readAt?: Date | string | null;
      additionalData?: any;
    }>;
    count: number;
  };
  pushNotifications?: {
    logs: Array<any>;
    count: number;
    statistics?: {
      total: number;
      pending: number;
      sent: number;
      delivered: number;
      failed: number;
      error: number;
      deliveryRate: number;
      failureRate: number;
    } | null;
  };
  badges?: {
    badges: Array<{
      id: number;
      key?: string;
      name: string;
      description?: string;
      category?: string;
      earnedAt?: Date | string;
    }>;
    streaks?: {
      current: number;
      longest: number;
      startDate?: Date | string | null;
    };
    progress?: any;
  };
  integrations?: Array<{
    id: number;
    type: string;
    status: string;
    provider: string;
    lastSync?: Date | string;
    createdAt: Date | string;
    reauthNeeded: boolean;
  }>;
  financialAccounts?: Array<{
    id: number;
    accountId: string;
    accountName: string;
    accountType: string;
    balance: number;
    currency: string;
    isCreditCard: boolean;
    lastUpdated?: Date | string;
  }>;
  creditCards?: Array<{
    id: number;
    accountName: string;
    cardType: string;
    currentBalance: number;
    creditLimit: number;
    utilizationRate: number;
    isPastDue: boolean;
    paymentDueDate?: Date | string;
  }>;
  transactions?: {
    items: Array<{
      id: number;
      amount: number;
      currency: string;
      date: Date | string;
      description: string;
      merchant?: string | null;
      type: string;
      source: string;
      category?: {
        id: number;
        name: string;
      } | null;
    }>;
    count: number;
  };
  budgets?: {
    items: Array<{
      id: number;
      name: string;
      amount: number;
      spent: number;
      period: string;
      currency: string;
      startDate: Date | string;
      endDate: Date | string;
      category?: {
        id: number;
        name: string;
      } | null;
    }>;
    count: number;
  };
  savingsGoals?: {
    items: Array<{
      id: number;
      name: string;
      targetAmount: number;
      currentAmount: number;
      currency: string;
      deadline?: Date | string | null;
      isCompleted: boolean;
    }>;
    count: number;
  };
  reminders?: {
    items: Array<{
      id: number;
      title: string;
      description?: string | null;
      reminderDate: Date | string;
      status: string;
      reminderType: string;
    }>;
    count: number;
  };
  notes?: {
    items: Array<{
      id: number;
      title: string;
      createdAt: Date | string;
      updatedAt: Date | string;
    }>;
    count: number;
  };
  gamification?: {
    progress?: {
      id?: number;
      userId?: number;
      totalXp?: number;
      level?: number;
      completionPercent?: number;
      badgesCount?: number;
      questsCompleted?: number;
    } | null;
    quests: Array<{
      id: number;
      status: string;
      progress?: {
        current: number;
        target: number;
        percent: number;
      } | null;
      startedAt?: Date | string | null;
      completedAt?: Date | string | null;
      quest: {
        id: number;
        slug: string;
        title: string;
        xp: number;
      };
    }>;
  };
}

