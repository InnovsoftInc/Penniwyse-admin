import { apiClient } from '../apiClient';
import type {
  GamificationSummary,
  Quest,
  UserProgress,
  Badge,
  XPHistory,
  StartQuestDto,
  CompleteQuestDto,
} from '../../types/gamification.types';

class GamificationService {
  async getSummary(): Promise<GamificationSummary> {
    const response = await apiClient.getClient().get<GamificationSummary>('/api/gamification/summary');
    return response.data;
  }

  async getQuests(): Promise<Quest[]> {
    const response = await apiClient.getClient().get<Quest[]>('/api/gamification/quests');
    return response.data;
  }

  async startQuest(data: StartQuestDto): Promise<Quest> {
    const response = await apiClient.getClient().post<Quest>(`/api/gamification/quests/${data.questId}/start`);
    return response.data;
  }

  async completeQuest(data: CompleteQuestDto): Promise<{ message: string; xpAwarded: number }> {
    const response = await apiClient.getClient().post<{ message: string; xpAwarded: number }>(
      `/api/gamification/quests/${data.questId}/complete`
    );
    return response.data;
  }

  async getProgress(): Promise<UserProgress> {
    const response = await apiClient.getClient().get<UserProgress>('/api/gamification/progress');
    return response.data;
  }

  async getBadges(): Promise<Badge[]> {
    const response = await apiClient.getClient().get<Badge[]>('/api/gamification/badges');
    return response.data;
  }

  async getXPHistory(params?: { page?: number; limit?: number }): Promise<XPHistory[]> {
    const response = await apiClient.getClient().get<XPHistory[]>('/api/gamification/xp/history', { params });
    return response.data;
  }
}

export const gamificationService = new GamificationService();

