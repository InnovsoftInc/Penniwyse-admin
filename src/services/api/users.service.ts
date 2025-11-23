import { apiClient } from '../apiClient';
import type { User, UserProfile, LoginHistory, ActivityLog } from '../../types/user.types';
import type { PaginatedResponse, PaginatedResponseAlt, QueryParams } from '../../types/api.types';

class UsersService {
  async getUsers(params?: QueryParams): Promise<PaginatedResponseAlt<User>> {
    const response = await apiClient.getClient().get<PaginatedResponseAlt<User>>(
      '/api/users',
      { params }
    );
    return response.data;
  }

  async getUserById(id: number): Promise<UserProfile> {
    const response = await apiClient.getClient().get<UserProfile>(
      `/api/users/${id}`
    );
    return response.data;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response = await apiClient.getClient().patch<User>(
      `/api/users/${id}`,
      data
    );
    return response.data;
  }

  async suspendUser(id: number): Promise<User> {
    const response = await apiClient.getClient().post<User>(
      `/api/users/${id}/suspend`
    );
    return response.data;
  }

  async activateUser(id: number): Promise<User> {
    const response = await apiClient.getClient().post<User>(
      `/api/users/${id}/activate`
    );
    return response.data;
  }

  async resetPassword(id: number): Promise<{ message: string }> {
    const response = await apiClient.getClient().post<{ message: string }>(
      `/api/users/${id}/reset-password`
    );
    return response.data;
  }

  async getLoginHistory(userId: number, params?: QueryParams): Promise<PaginatedResponseAlt<LoginHistory>> {
    const response = await apiClient.getClient().get<PaginatedResponseAlt<LoginHistory>>(
      `/api/users/${userId}/login-history`,
      { params }
    );
    return response.data;
  }

  async getActivityLogs(userId: number, params?: QueryParams): Promise<PaginatedResponseAlt<ActivityLog>> {
    const response = await apiClient.getClient().get<PaginatedResponseAlt<ActivityLog>>(
      `/api/users/${userId}/activity-logs`,
      { params }
    );
    return response.data;
  }

  async assignXP(userId: number, xp: number): Promise<{ message: string }> {
    const response = await apiClient.getClient().post<{ message: string }>(
      `/api/users/${userId}/xp`,
      { xp }
    );
    return response.data;
  }

  async assignBadge(userId: number, badgeId: number): Promise<{ message: string }> {
    const response = await apiClient.getClient().post<{ message: string }>(
      `/api/users/${userId}/badges`,
      { badgeId }
    );
    return response.data;
  }

  async updateStreak(userId: number, streakType: string, count: number): Promise<{ message: string }> {
    const response = await apiClient.getClient().post<{ message: string }>(
      `/api/users/${userId}/streaks`,
      { streakType, count }
    );
    return response.data;
  }
}

export const usersService = new UsersService();

