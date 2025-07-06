import { Model, Q, Query } from '@nozbe/watermelondb';
import { field, date, json, readonly, writer } from '@nozbe/watermelondb/decorators';
import { sanitizeJson } from '../schema';

export type ModelType = 'task' | 'routine' | 'goal' | 'user';
export type OperationType = 'create' | 'update' | 'delete';

export interface SyncData {
  [key: string]: any;
}

export default class SyncQueueItem extends Model {
  static table = 'sync_queue';

  @field('model_type') modelType!: ModelType;
  @field('model_id') modelId!: string;
  @field('operation') operation!: OperationType;
  @json('data', sanitizeJson) data!: SyncData;
  @field('timestamp') timestamp!: number;
  @field('device_id') deviceId!: string;
  @field('version') version!: number;
  @field('retry_count') retryCount!: number;
  @field('last_error') lastError?: string;
  
  @readonly @date('created_at') createdAt!: Date;

  // Computed properties
  get isRetryable(): boolean {
    return this.retryCount < 3;
  }

  get shouldRetry(): boolean {
    if (!this.isRetryable) return false;
    
    // Exponential backoff
    const backoffMs = Math.pow(2, this.retryCount) * 1000 * 60; // 1min, 2min, 4min
    const timeSinceLastAttempt = Date.now() - this.timestamp;
    
    return timeSinceLastAttempt >= backoffMs;
  }

  // Actions
  @writer async incrementRetry(error?: string): Promise<void> {
    await this.update((item) => {
      item.retryCount += 1;
      item.lastError = error;
      item.timestamp = Date.now();
    });
  }

  @writer async markAsProcessed(): Promise<void> {
    await this.destroyPermanently();
  }

  // Query helpers
  static pendingItemsQuery(): Query<SyncQueueItem> {
    return this.query(
      Q.sortBy('timestamp', Q.asc)
    );
  }

  static retryableItemsQuery(): Query<SyncQueueItem> {
    return this.query(
      Q.where('retry_count', Q.lt(3)),
      Q.sortBy('timestamp', Q.asc)
    );
  }

  static byModelTypeQuery(modelType: ModelType): Query<SyncQueueItem> {
    return this.query(
      Q.where('model_type', modelType),
      Q.sortBy('timestamp', Q.asc)
    );
  }

  static failedItemsQuery(): Query<SyncQueueItem> {
    return this.query(
      Q.where('retry_count', Q.gte(3)),
      Q.sortBy('timestamp', Q.desc)
    );
  }
}