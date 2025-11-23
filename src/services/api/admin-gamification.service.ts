import { apiClient } from '../apiClient';
import type {
  Quest,
  Badge,
  CreateQuestDto,
  UpdateQuestDto,
  CreateBadgeDto,
  UpdateBadgeDto,
  GamificationConfig,
  QuestRule,
  CreateQuestRuleDto,
  UpdateQuestRuleDto,
  XPLevel,
  UpdateXPLevelsDto,
} from '../../types/gamification.types';
import type { QueryParams, PaginatedResponseAlt } from '../../types/api.types';

class AdminGamificationService {
  // Quest CRUD
  async getQuests(params?: QueryParams): Promise<PaginatedResponseAlt<Quest>> {
    const response = await apiClient.getClient().get<PaginatedResponseAlt<Quest>>('/api/admin/gamification/quests', { params });
    return response.data;
  }

  async getQuestById(id: number): Promise<Quest> {
    const response = await apiClient.getClient().get<Quest>(`/api/admin/gamification/quests/${id}`);
    return response.data;
  }

  async createQuest(data: CreateQuestDto): Promise<Quest> {
    const response = await apiClient.getClient().post<Quest>('/api/admin/gamification/quests', data);
    return response.data;
  }

  async updateQuest(id: number, data: UpdateQuestDto): Promise<Quest> {
    const response = await apiClient.getClient().put<Quest>(`/api/admin/gamification/quests/${id}`, data);
    return response.data;
  }

  async deleteQuest(id: number): Promise<{ message: string }> {
    const response = await apiClient.getClient().delete<{ message: string }>(`/api/admin/gamification/quests/${id}`);
    return response.data;
  }

  // Badge CRUD
  async getBadges(params?: QueryParams): Promise<PaginatedResponseAlt<Badge>> {
    const response = await apiClient.getClient().get<PaginatedResponseAlt<Badge>>('/api/admin/gamification/badges', { params });
    return response.data;
  }

  async getBadgeById(id: number): Promise<Badge> {
    const response = await apiClient.getClient().get<Badge>(`/api/admin/gamification/badges/${id}`);
    return response.data;
  }

  async createBadge(data: CreateBadgeDto): Promise<Badge> {
    const response = await apiClient.getClient().post<Badge>('/api/admin/gamification/badges', data);
    return response.data;
  }

  async updateBadge(id: number, data: UpdateBadgeDto): Promise<Badge> {
    const response = await apiClient.getClient().put<Badge>(`/api/admin/gamification/badges/${id}`, data);
    return response.data;
  }

  async deleteBadge(id: number): Promise<{ message: string }> {
    const response = await apiClient.getClient().delete<{ message: string }>(`/api/admin/gamification/badges/${id}`);
    return response.data;
  }

  // Configuration
  async getConfig(): Promise<GamificationConfig> {
    const response = await apiClient.getClient().get<GamificationConfig>('/api/admin/gamification/config');
    return response.data;
  }

  async updateXPLevels(data: UpdateXPLevelsDto): Promise<{ message: string }> {
    const response = await apiClient.getClient().put<{ message: string }>('/api/admin/gamification/config/xp-levels', data);
    return response.data;
  }

  async getQuestRules(): Promise<QuestRule[]> {
    const response = await apiClient.getClient().get<QuestRule[]>('/api/admin/gamification/config/rules');
    return response.data;
  }

  async createQuestRule(data: CreateQuestRuleDto): Promise<QuestRule> {
    const response = await apiClient.getClient().post<QuestRule>('/api/admin/gamification/config/rules', data);
    return response.data;
  }

  async updateQuestRule(id: number, data: UpdateQuestRuleDto): Promise<QuestRule> {
    const response = await apiClient.getClient().put<QuestRule>(`/api/admin/gamification/config/rules/${id}`, data);
    return response.data;
  }

  async deleteQuestRule(id: number): Promise<{ message: string }> {
    const response = await apiClient.getClient().delete<{ message: string }>(`/api/admin/gamification/config/rules/${id}`);
    return response.data;
  }

  // Linking helpers - get active badges and quests for linking in quest rules
  async getAvailableBadges(): Promise<Array<{ key: string; name: string; isActive: boolean }>> {
    try {
      // Try the linking endpoint first
      const response = await apiClient.getClient().get<Array<{ key: string; name: string; isActive: boolean }>>('/api/admin/gamification/linking/badges');
      return response.data;
    } catch (err: any) {
      // Fallback to regular badges endpoint if linking endpoint doesn't exist
      if (err?.response?.status === 404) {
        const badgesResponse = await this.getBadges({ isActive: true, limit: 1000 });
        const badges = Array.isArray(badgesResponse.items) ? badgesResponse.items : [];
        return badges
          .filter((badge: Badge) => badge.isActive && badge.key)
          .map((badge: Badge) => ({
            key: badge.key!,
            name: badge.name || badge.key!,
            isActive: badge.isActive ?? true,
          }));
      }
      throw err;
    }
  }

  async getAvailableQuests(): Promise<Array<{ slug: string; name: string; isActive: boolean }>> {
    try {
      // Try the linking endpoint first
      const response = await apiClient.getClient().get<Array<{ slug: string; name: string; isActive: boolean }>>('/api/admin/gamification/linking/quests');
      return response.data;
    } catch (err: any) {
      // Fallback to regular quests endpoint if linking endpoint doesn't exist
      if (err?.response?.status === 404) {
        const questsResponse = await this.getQuests({ isActive: true, limit: 1000 });
        const quests = Array.isArray(questsResponse.items) ? questsResponse.items : [];
        return quests
          .filter((quest: Quest) => quest.isActive && quest.slug)
          .map((quest: Quest) => ({
            slug: quest.slug!,
            name: quest.name || quest.title || quest.slug!,
            isActive: quest.isActive ?? true,
          }));
      }
      throw err;
    }
  }
}

export const adminGamificationService = new AdminGamificationService();

