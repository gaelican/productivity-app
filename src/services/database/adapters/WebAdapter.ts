// Web adapter for WatermelonDB - uses IndexedDB for storage
import { Platform } from 'react-native';

interface WebDatabase {
  collections: Map<string, Map<string, any>>;
  nextIds: Map<string, number>;
}

export class WebAdapter {
  private db: WebDatabase = {
    collections: new Map(),
    nextIds: new Map(),
  };
  
  private dbName: string;
  private idb?: IDBDatabase;

  constructor(dbName: string = 'productivity_app') {
    this.dbName = dbName;
    if (Platform.OS === 'web') {
      this.initializeIndexedDB();
    }
  }

  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.idb = request.result;
        this.loadFromIndexedDB();
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for each collection
        const collections = ['users', 'tasks', 'routines', 'goals', 'sync_queue_items'];
        
        collections.forEach(collection => {
          if (!db.objectStoreNames.contains(collection)) {
            const store = db.createObjectStore(collection, { keyPath: 'id' });
            store.createIndex('syncStatus', 'syncStatus', { unique: false });
            store.createIndex('userId', 'userId', { unique: false });
          }
        });
      };
    });
  }

  private async loadFromIndexedDB(): Promise<void> {
    if (!this.idb) return;
    
    const collections = ['users', 'tasks', 'routines', 'goals', 'sync_queue_items'];
    
    for (const collectionName of collections) {
      const transaction = this.idb.transaction([collectionName], 'readonly');
      const store = transaction.objectStore(collectionName);
      const request = store.getAll();
      
      await new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const records = request.result;
          const collection = new Map();
          
          records.forEach(record => {
            collection.set(record.id, record);
          });
          
          this.db.collections.set(collectionName, collection);
          resolve(undefined);
        };
        
        request.onerror = () => reject(request.error);
      });
    }
  }

  private async saveToIndexedDB(collectionName: string, record: any): Promise<void> {
    if (!this.idb) return;
    
    const transaction = this.idb.transaction([collectionName], 'readwrite');
    const store = transaction.objectStore(collectionName);
    store.put(record);
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async find(table: string, id: string): Promise<any> {
    const collection = this.db.collections.get(table);
    if (!collection) return null;
    return collection.get(id) || null;
  }

  async query(table: string, conditions: any = {}): Promise<any[]> {
    const collection = this.db.collections.get(table);
    if (!collection) return [];
    
    const records = Array.from(collection.values());
    
    // Simple filtering based on conditions
    return records.filter(record => {
      return Object.entries(conditions).every(([key, value]) => {
        return record[key] === value;
      });
    });
  }

  async create(table: string, record: any): Promise<any> {
    let collection = this.db.collections.get(table);
    if (!collection) {
      collection = new Map();
      this.db.collections.set(table, collection);
    }
    
    // Generate ID if not provided
    if (!record.id) {
      const nextId = (this.db.nextIds.get(table) || 1);
      record.id = `${table}_${nextId}`;
      this.db.nextIds.set(table, nextId + 1);
    }
    
    // Add timestamps
    const now = new Date();
    record.createdAt = record.createdAt || now;
    record.updatedAt = now;
    
    collection.set(record.id, record);
    
    // Save to IndexedDB
    await this.saveToIndexedDB(table, record);
    
    return record;
  }

  async update(table: string, id: string, changes: any): Promise<void> {
    const collection = this.db.collections.get(table);
    if (!collection) return;
    
    const record = collection.get(id);
    if (!record) return;
    
    const updated = {
      ...record,
      ...changes,
      updatedAt: new Date(),
    };
    
    collection.set(id, updated);
    
    // Save to IndexedDB
    await this.saveToIndexedDB(table, updated);
  }

  async delete(table: string, id: string): Promise<void> {
    const collection = this.db.collections.get(table);
    if (!collection) return;
    
    collection.delete(id);
    
    // Delete from IndexedDB
    if (this.idb) {
      const transaction = this.idb.transaction([table], 'readwrite');
      const store = transaction.objectStore(table);
      store.delete(id);
    }
  }

  async batch(operations: any[]): Promise<void> {
    // Process batch operations
    for (const op of operations) {
      switch (op.type) {
        case 'create':
          await this.create(op.table, op.record);
          break;
        case 'update':
          await this.update(op.table, op.id, op.changes);
          break;
        case 'delete':
          await this.delete(op.table, op.id);
          break;
      }
    }
  }

  // Mock implementation for web
  unsafeResetDatabase(): void {
    this.db.collections.clear();
    this.db.nextIds.clear();
    
    if (this.idb) {
      const collections = ['users', 'tasks', 'routines', 'goals', 'sync_queue_items'];
      collections.forEach(collection => {
        const transaction = this.idb!.transaction([collection], 'readwrite');
        const store = transaction.objectStore(collection);
        store.clear();
      });
    }
  }
}