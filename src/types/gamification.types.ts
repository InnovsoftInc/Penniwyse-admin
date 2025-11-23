export interface GamificationSummary {
  progress: UserProgress;
  badges: Badge[];
  quests: Quest[];
}

export interface UserProgress {
  xp: number;
  level: number;
  completionPercentage: number;
}

export interface Badge {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  earnedAt?: string;
  category?: string;
  key?: string;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Quest {
  id: number;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'achievement';
  xpReward: number;
  badgeReward?: number;
  status?: 'available' | 'in_progress' | 'completed' | 'locked';
  progress?: number;
  target?: number;
  startedAt?: string;
  completedAt?: string;
  slug?: string;
  category?: string;
  isActive?: boolean;
  requirements?: string | Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface XPHistory {
  id: number;
  userId: number;
  amount: number;
  source: string;
  description?: string;
  createdAt: string;
}

export interface Streak {
  type: string;
  count: number;
  lastUpdated: string;
}

export interface StartQuestDto {
  questId: number;
}

export interface CompleteQuestDto {
  questId: number;
}

// Admin DTOs
export interface CreateQuestDto {
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'achievement';
  xpReward: number;
  badgeReward?: number;
  slug: string;
  category?: string;
  isActive?: boolean;
  requirements?: string | Record<string, unknown>;
}

export interface UpdateQuestDto {
  name?: string;
  description?: string;
  type?: 'daily' | 'weekly' | 'monthly' | 'achievement';
  xpReward?: number;
  badgeReward?: number;
  slug?: string;
  category?: string;
  isActive?: boolean;
  requirements?: string | Record<string, unknown>;
}

export interface CreateBadgeDto {
  name: string;
  description?: string;
  icon?: string;
  key: string;
  category?: string;
  slug?: string;
}

export interface UpdateBadgeDto {
  name?: string;
  description?: string;
  icon?: string;
  key?: string;
  category?: string;
  // slug is not allowed in update requests (backend generates it from key)
}

// Configuration types
export interface XPLevel {
  level: number;
  xpRequired: number;
}

export interface QuestRule {
  id: number | string;
  name?: string;
  description?: string;
  trigger: string;
  xp?: number;
  badge?: string; // Badge key
  questSlug?: string; // Quest slug
  conditions?: string | Record<string, unknown>;
  rewards?: string | Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface GamificationConfig {
  xpLevels: XPLevel[];
  questRules?: QuestRule[];
}

export interface CreateQuestRuleDto {
  id?: string; // Rule identifier (e.g., "r_add_income")
  description?: string;
  trigger: string;
  xp?: number;
  badge?: string; // Badge key
  questSlug?: string; // Quest slug
  conditions?: string | Record<string, unknown>;
  rewards?: string | Record<string, unknown>;
}

export interface UpdateQuestRuleDto {
  description?: string;
  trigger?: string;
  xp?: number;
  badge?: string; // Badge key
  questSlug?: string; // Quest slug
  conditions?: string | Record<string, unknown>;
  rewards?: string | Record<string, unknown>;
}

export interface UpdateXPLevelsDto {
  xpLevels: XPLevel[];
}

