/**
 * API caching utility for optimizing data fetching
 * Implements memory caching with TTL (Time To Live) for API responses
 */

type CacheEntry<T> = {
  data: T;
  expiry: number;
};

class ApiCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  /**
   * Get data from cache if available and not expired
   * @param key Cache key
   * @returns Cached data or null if not found/expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    // Return null if no cache entry exists
    if (!entry) return null;
    
    // Check if the cache entry has expired
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  /**
   * Set data in cache with expiration
   * @param key Cache key
   * @param data Data to cache
   * @param ttlMs Time to live in milliseconds (default: 5 minutes)
   */
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }
  
  /**
   * Remove an item from cache
   * @param key Cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cached API response or fetch new data
   * @param key Cache key
   * @param fetchFn Function to fetch data if not in cache
   * @param ttlMs Time to live in milliseconds
   * @returns Promise resolving to the data
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttlMs: number = 5 * 60 * 1000
  ): Promise<T> {
    // Try to get from cache first
    const cachedData = this.get<T>(key);
    if (cachedData !== null) {
      return cachedData;
    }
    
    // If not in cache, fetch new data
    try {
      const data = await fetchFn();
      this.set(key, data, ttlMs);
      return data;
    } catch (error) {
      // Re-throw the error to be handled by the caller
      throw error;
    }
  }
}

// Export a singleton instance
export const apiCache = new ApiCache();

/**
 * Decorator for caching API responses
 * @param ttlMs Time to live in milliseconds
 * @returns Decorated function with caching
 */
export function withCache<T>(
  fn: (...args: any[]) => Promise<T>,
  keyPrefix: string,
  ttlMs: number = 5 * 60 * 1000
) {
  return async (...args: any[]): Promise<T> => {
    // Create a cache key based on function name and arguments
    const key = `${keyPrefix}:${JSON.stringify(args)}`;
    return apiCache.getOrFetch(key, () => fn(...args), ttlMs);
  };
}