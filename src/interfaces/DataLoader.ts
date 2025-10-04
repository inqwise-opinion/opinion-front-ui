/**
 * DataLoader Interface
 * 
 * Service architecture interface for Facebook's DataLoader integration.
 * Provides standardized methods for data loading, batching, and caching.
 */

import DataLoader from 'dataloader';

/**
 * Cache map interface compatible with DataLoader
 */
export interface CacheMap<K, V> {
  get(key: K): V | void;
  set(key: K, value: V): void;
  delete(key: K): boolean;
  clear(): void;
}

/**
 * Configuration options for DataLoader services
 */
export interface DataLoaderConfig<K = unknown, V = unknown> {
  /**
   * Maximum batch size (default: Infinity)
   */
  maxBatchSize?: number;

  /**
   * Cache key function for custom cache keys
   */
  cacheKeyFn?: (key: K) => K;

  /**
   * Cache map implementation (default: Map)
   */
  cacheMap?: CacheMap<K, Promise<V>> | null;

  /**
   * Whether to enable caching (default: true)
   */
  cache?: boolean;

  /**
   * Batch function - how to batch load keys
   */
  batchLoadFn: (keys: readonly K[]) => Promise<V[]>;
}

/**
 * Service interface for data loading with batching and caching
 * Wraps Facebook's DataLoader with service architecture patterns
 */
export interface DataLoaderService<K, V> {
  /**
   * Get the underlying DataLoader instance
   */
  getLoader(): DataLoader<K, V>;

  /**
   * Load a single value by key
   * @param key - Key to load
   */
  load(key: K): Promise<V>;

  /**
   * Load multiple values by keys
   * @param keys - Array of keys to load
   */
  loadMany(keys: readonly K[]): Promise<Array<V | Error>>;

  /**
   * Clear the cache for a specific key
   * @param key - Key to clear from cache
   */
  clear(key: K): this;

  /**
   * Clear all cached values
   */
  clearAll(): this;

  /**
   * Prime the cache with a specific key-value pair
   * @param key - Key to prime
   * @param value - Value to cache
   */
  prime(key: K, value: V): this;
}

/**
 * Factory interface for creating DataLoader services
 */
export interface DataLoaderFactory {
  /**
   * Create a new DataLoader service
   * @param config - DataLoader configuration
   */
  createLoader<K, V>(config: DataLoaderConfig<K, V>): DataLoaderService<K, V>;
}

/**
 * Base implementation of DataLoaderService
 */
export class DataLoaderServiceImpl<K, V> implements DataLoaderService<K, V> {
  private loader: DataLoader<K, V>;

  constructor(config: DataLoaderConfig<K, V>) {
    this.loader = new DataLoader<K, V>(config.batchLoadFn, {
      maxBatchSize: config.maxBatchSize,
      cacheKeyFn: config.cacheKeyFn,
      cacheMap: config.cacheMap as any,
      cache: config.cache,
    });
  }

  getLoader(): DataLoader<K, V> {
    return this.loader;
  }

  load(key: K): Promise<V> {
    return this.loader.load(key);
  }

  loadMany(keys: readonly K[]): Promise<Array<V | Error>> {
    return this.loader.loadMany(keys);
  }

  clear(key: K): this {
    this.loader.clear(key);
    return this;
  }

  clearAll(): this {
    this.loader.clearAll();
    return this;
  }

  prime(key: K, value: V): this {
    this.loader.prime(key, value);
    return this;
  }
}

/**
 * DataLoader factory implementation
 */
export class DataLoaderFactoryImpl implements DataLoaderFactory {
  createLoader<K, V>(config: DataLoaderConfig<K, V>): DataLoaderService<K, V> {
    return new DataLoaderServiceImpl<K, V>(config);
  }
}
