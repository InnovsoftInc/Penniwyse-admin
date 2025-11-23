/**
 * Simple request cache to prevent duplicate API calls
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class RequestCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private pendingRequests: Map<string, Promise<unknown>> = new Map();

  /**
   * Get cached data or execute request function
   */
  async get<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = 30000 // 30 seconds default
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;

    // Return cached data if still valid
    if (cached && now < cached.expiresAt) {
      return cached.data;
    }

    // If request is already pending, return the pending promise
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Execute request and cache result
    const promise = requestFn()
      .then((data) => {
        this.cache.set(key, {
          data,
          timestamp: now,
          expiresAt: now + ttl,
        });
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Clear cache entry
   */
  clear(key: string): void {
    this.cache.delete(key);
    this.pendingRequests.delete(key);
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Invalidate expired entries
   */
  invalidateExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export const requestCache = new RequestCache();

// Clean up expired entries every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestCache.invalidateExpired();
  }, 60000);
}

