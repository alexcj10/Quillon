import { StorageError } from './errors.ts';

export class DocumentDB {
  private dbName = 'DocumentStorage';
  private version = 1;
  private storeName = 'documents';
  private db: IDBDatabase | null = null;

  async connect(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(new StorageError('Failed to open database'));
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
    });
  }

  async put(id: string, data: string): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.put(data, id);

      request.onerror = () => reject(new StorageError('Failed to save data'));
      request.onsuccess = () => resolve();
    });
  }

  async get(id: string): Promise<string> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const request = store.get(id);

      request.onerror = () => reject(new StorageError('Failed to load data'));
      request.onsuccess = () => resolve(request.result);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const request = store.delete(id);

      request.onerror = () => reject(new StorageError('Failed to delete data'));
      request.onsuccess = () => resolve();
    });
  }
}