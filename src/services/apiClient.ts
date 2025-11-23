import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '../types/api.types';
import * as cookieUtils from '../utils/cookies';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        } else if (!token && config.url && !config.url.includes('/auth/')) {
          // Log warning for non-auth endpoints missing token
          console.warn('[ApiClient] No access token found for request:', {
            url: config.url,
            method: config.method,
            hasToken: !!token,
          });
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle network errors (connection refused, etc.)
        if (!error.response) {
          console.error('Network Error:', {
            message: error.message,
            baseURL: API_BASE_URL,
            url: originalRequest?.url,
            fullUrl: originalRequest ? `${API_BASE_URL}${originalRequest.url}` : 'N/A',
          });
          
          // Show user-friendly error message
          if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
            console.error(`Cannot connect to backend at ${API_BASE_URL}. Make sure the backend server is running.`);
          }
          
          return Promise.reject({
            ...error,
            message: `Cannot connect to backend server at ${API_BASE_URL}. Please ensure the backend is running on port 3002.`,
            isNetworkError: true,
          });
        }

        // Handle 429 Too Many Requests
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : 5000; // Default 5 seconds
          
          console.warn(`Rate limited. Retrying after ${delay}ms...`);
          
          // Wait and retry once
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.client(originalRequest);
        }

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // Don't try to refresh on auth endpoints - let them fail naturally
          if (originalRequest.url?.includes('/auth/')) {
            return Promise.reject(error);
          }

          // Check if the error is due to missing token
          const errorMessage = error.response?.data?.message || '';
          const isMissingToken = errorMessage.includes('No token provided') || 
                                 errorMessage.includes('No token') ||
                                 errorMessage.includes('Unauthorized');

          if (isMissingToken) {
            console.error('[ApiClient] 401 Unauthorized: No token provided', {
              url: originalRequest.url,
              method: originalRequest.method,
              hasAccessToken: !!this.getAccessToken(),
              hasRefreshToken: !!this.getRefreshToken(),
              errorMessage,
            });
            
            // If we have a refresh token, try to refresh
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              try {
                console.log('[ApiClient] Attempting to refresh token...');
                const response = await axios.post(
                  `${API_BASE_URL}/auth/refresh`,
                  { refreshToken }
                );
                const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
                // Store both tokens - critical to prevent using old refresh tokens
                cookieUtils.setAccessToken(accessToken);
                cookieUtils.setRefreshToken(newRefreshToken);
                
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }
                
                console.log('[ApiClient] Token refreshed successfully, retrying request');
                return this.client(originalRequest);
              } catch (refreshError) {
                console.error('[ApiClient] Token refresh failed:', refreshError);
                this.clearTokens();
                return Promise.reject({
                  ...error,
                  message: 'Authentication expired. Please log in again.',
                  isAuthError: true,
                });
              }
            } else {
              // No refresh token available
              console.error('[ApiClient] No refresh token available. User needs to log in.');
              this.clearTokens();
              return Promise.reject({
                ...error,
                message: 'No authentication token found. Please log in.',
                isAuthError: true,
              });
            }
          }

          // For other 401 errors, try to refresh token
          try {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
              const response = await axios.post(
                `${API_BASE_URL}/auth/refresh`,
                { refreshToken }
              );
              const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
              // Store both tokens - critical to prevent using old refresh tokens
              cookieUtils.setAccessToken(accessToken);
              cookieUtils.setRefreshToken(newRefreshToken);
              
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              }
              
              return this.client(originalRequest);
            } else {
              // No refresh token, clear auth but don't redirect (let ProtectedRoute handle it)
              this.clearTokens();
              return Promise.reject({
                ...error,
                message: 'Authentication expired. Please log in again.',
                isAuthError: true,
              });
            }
          } catch {
            // Refresh failed, clear tokens but don't redirect (let ProtectedRoute handle it)
            this.clearTokens();
            return Promise.reject({
              ...error,
              message: 'Authentication failed. Please log in again.',
              isAuthError: true,
            });
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private getAccessToken(): string | null {
    return cookieUtils.getAccessToken();
  }

  private getRefreshToken(): string | null {
    return cookieUtils.getRefreshToken();
  }

  // private _setAccessToken(token: string): void {
  //   cookieUtils.setAccessToken(token);
  // }

  private clearTokens(): void {
    cookieUtils.clearTokens();
  }

  public setTokens(accessToken: string, refreshToken: string): void {
    cookieUtils.setAccessToken(accessToken);
    cookieUtils.setRefreshToken(refreshToken);
  }

  public clearAuth(): void {
    this.clearTokens();
  }

  public getClient(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();

