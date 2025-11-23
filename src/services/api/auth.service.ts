import { apiClient } from '../apiClient';
import type { AdminSignInDto, AuthResponse } from '../../types/auth.types';

class AuthService {
  async adminSignIn(credentials: AdminSignInDto): Promise<AuthResponse> {
    const response = await apiClient.getClient().post<AuthResponse>(
      '/auth/admin/signin',
      credentials
    );
    
    // Store tokens
    if (response.data.tokens) {
      apiClient.setTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );
    }
    
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<{ tokens: { accessToken: string; refreshToken: string } }> {
    const response = await apiClient.getClient().post<{ tokens: { accessToken: string; refreshToken: string } }>(
      '/auth/refresh',
      { refreshToken }
    );
    
    if (response.data.tokens) {
      apiClient.setTokens(
        response.data.tokens.accessToken,
        response.data.tokens.refreshToken
      );
    }
    
    return response.data;
  }

  logout(): void {
    apiClient.clearAuth();
  }
}

export const authService = new AuthService();

