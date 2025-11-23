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

