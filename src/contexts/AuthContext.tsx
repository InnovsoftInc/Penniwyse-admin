import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/api/auth.service';
import type { AuthState, SanitizedUser, AuthTokens, AdminSignInDto } from '../types/auth.types';
import * as cookieUtils from '../utils/cookies';

interface AuthContextType extends AuthState {
  login: (credentials: AdminSignInDto) => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SanitizedUser | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isClearingRef = useRef(false);
  const isInitializedRef = useRef(false);

  const clearAuth = useCallback(() => {
    // Prevent recursive calls
    if (isClearingRef.current) {
      return;
    }
    isClearingRef.current = true;

    setUser(null);
    setTokens(null);
    cookieUtils.clearTokens();
    localStorage.removeItem('user'); // Keep user in localStorage for quick access, but tokens in cookies
    authService.logout();
    
    // Reset flag after state updates
    setTimeout(() => {
      isClearingRef.current = false;
    }, 100);
  }, []);

  useEffect(() => {
    // Check for stored tokens and user on mount (only once)
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    const accessToken = cookieUtils.getAccessToken();
    const refreshToken = cookieUtils.getRefreshToken();
    const storedUser = localStorage.getItem('user');

    if (accessToken && refreshToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setTokens({ accessToken, refreshToken });
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        if (!isClearingRef.current) {
          clearAuth();
        }
      }
    } else if (refreshToken && storedUser) {
      // Have refresh token but no access token - try to refresh
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        // Try to refresh the access token
        refreshAuth();
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        if (!isClearingRef.current) {
          clearAuth();
        }
      }
    } else {
      // No tokens found, ensure state is cleared
      setUser(null);
      setTokens(null);
    }
    
    setIsLoading(false);
  }, [clearAuth]);

  // Listen for storage events to sync auth state across tabs (for user data)
  // Note: Cookies don't trigger storage events, so we check cookies directly
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // Only handle user data changes from localStorage (cookies don't trigger storage events)
      // Skip if we're currently clearing to prevent loops
      if (isClearingRef.current) return;
      
      if (e.key === 'user') {
        const accessToken = cookieUtils.getAccessToken();
        const refreshToken = cookieUtils.getRefreshToken();
        const storedUser = localStorage.getItem('user');

        if (!accessToken || !refreshToken || !storedUser) {
          setUser(null);
          setTokens(null);
        } else {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setTokens({ accessToken, refreshToken });
          } catch {
            // Don't call clearAuth here to avoid loops, just clear state
            setUser(null);
            setTokens(null);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = async (credentials: AdminSignInDto) => {
    try {
      setIsLoading(true);
      const response = await authService.adminSignIn(credentials);
      
      // Persist user in localStorage and tokens in cookies
      setUser(response.user);
      setTokens(response.tokens);
      localStorage.setItem('user', JSON.stringify(response.user));
      cookieUtils.setAccessToken(response.tokens.accessToken);
      cookieUtils.setRefreshToken(response.tokens.refreshToken);
    } catch (error) {
      clearAuth();
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
  };

  const refreshAuth = async () => {
    const refreshToken = cookieUtils.getRefreshToken();
    if (!refreshToken) {
      clearAuth();
      return;
    }

    try {
      const response = await authService.refreshToken(refreshToken);
      setTokens(response.tokens);
      cookieUtils.setAccessToken(response.tokens.accessToken);
      cookieUtils.setRefreshToken(response.tokens.refreshToken);
      // User remains the same after token refresh
    } catch {
      clearAuth();
    }
  };

  const value: AuthContextType = {
    user,
    tokens,
    isAuthenticated: !!user && !!tokens,
    isLoading,
    login,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

