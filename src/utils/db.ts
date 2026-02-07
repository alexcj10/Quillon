import { StorageError } from './errors.ts';

export class DocumentDB {
  private dbName = 'DocumentStorage';
  private version = 5;
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
        if (!db.objectStoreNames.contains('notes')) {
          db.createObjectStore('notes', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('document_metadata')) {
          db.createObjectStore('document_metadata', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('attachments')) {
          db.createObjectStore('attachments', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('nodes_data')) {
          db.createObjectStore('nodes_data', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('tag_groups')) {
          db.createObjectStore('tag_groups', { keyPath: 'id' });
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
  async getAllNotes(): Promise<any[]> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notes', 'readonly');
      const store = tx.objectStore('notes');
      const request = store.getAll();

      request.onerror = () => reject(new StorageError('Failed to load notes'));
      request.onsuccess = () => resolve(request.result);
    });
  }

  async saveNote(note: any): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notes', 'readwrite');
      const store = tx.objectStore('notes');
      const request = store.put(note);

      request.onerror = () => reject(new StorageError('Failed to save note'));
      request.onsuccess = () => resolve();
    });
  }

  async saveNotesBulk(notes: any[]): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notes', 'readwrite');
      const store = tx.objectStore('notes');

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new StorageError('Failed to save bulk notes'));

      notes.forEach(note => store.put(note));
    });
  }

  async deleteNote(id: string): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notes', 'readwrite');
      const store = tx.objectStore('notes');
      const request = store.delete(id);

      request.onerror = () => reject(new StorageError('Failed to delete note'));
      request.onsuccess = () => resolve();
    });
  }

  // Metadata methods
  async getAllMetadata(): Promise<any[]> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('document_metadata', 'readonly');
      const store = tx.objectStore('document_metadata');
      const request = store.getAll();

      request.onerror = () => reject(new StorageError('Failed to load metadata'));
      request.onsuccess = () => resolve(request.result);
    });
  }

  async saveMetadata(metadata: any): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('document_metadata', 'readwrite');
      const store = tx.objectStore('document_metadata');
      const request = store.put(metadata);

      request.onerror = () => reject(new StorageError('Failed to save metadata'));
      request.onsuccess = () => resolve();
    });
  }

  async saveMetadataBulk(metadataList: any[]): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('document_metadata', 'readwrite');
      const store = tx.objectStore('document_metadata');

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new StorageError('Failed to save bulk metadata'));

      metadataList.forEach(item => store.put(item));
    });
  }

  async deleteMetadata(id: string): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('document_metadata', 'readwrite');
      const store = tx.objectStore('document_metadata');
      const request = store.delete(id);

      request.onerror = () => reject(new StorageError('Failed to delete metadata'));
      request.onsuccess = () => resolve();
    });
  }

  // Standalone Attachments methods
  async getAllAttachments(): Promise<any[]> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('attachments', 'readonly');
      const store = tx.objectStore('attachments');
      const request = store.getAll();

      request.onerror = () => reject(new StorageError('Failed to load attachments'));
      request.onsuccess = () => resolve(request.result);
    });
  }

  async saveAttachment(attachment: any): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('attachments', 'readwrite');
      const store = tx.objectStore('attachments');
      const request = store.put(attachment);

      request.onerror = () => reject(new StorageError('Failed to save attachment'));
      request.onsuccess = () => resolve();
    });
  }

  async saveAttachmentsBulk(attachments: any[]): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('attachments', 'readwrite');
      const store = tx.objectStore('attachments');

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new StorageError('Failed to save bulk attachments'));

      attachments.forEach(att => store.put(att));
    });
  }

  async deleteAttachment(id: string): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('attachments', 'readwrite');
      const store = tx.objectStore('attachments');
      const request = store.delete(id);

      request.onerror = () => reject(new StorageError('Failed to delete attachment'));
      request.onsuccess = () => resolve();
    });
  }

  // Nodes methods
  async getAllNodes(): Promise<any[]> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('nodes_data', 'readonly');
      const store = tx.objectStore('nodes_data');
      const request = store.getAll();

      request.onerror = () => reject(new StorageError('Failed to load nodes'));
      request.onsuccess = () => resolve(request.result);
    });
  }

  async saveNodesBulk(nodes: any[]): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('nodes_data', 'readwrite');
      const store = tx.objectStore('nodes_data');

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new StorageError('Failed to save bulk nodes'));

      // Clear existing first to ensure sync (simpler for full-list state)
      store.clear().onsuccess = () => {
        nodes.forEach(node => store.put(node));
      };
    });
  }

  // Tag Groups methods
  async getAllTagGroups(): Promise<any[]> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tag_groups', 'readonly');
      const store = tx.objectStore('tag_groups');
      const request = store.getAll();

      request.onerror = () => reject(new StorageError('Failed to load tag groups'));
      request.onsuccess = () => resolve(request.result);
    });
  }

  async saveTagGroup(group: any): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tag_groups', 'readwrite');
      const store = tx.objectStore('tag_groups');
      const request = store.put(group);

      request.onerror = () => reject(new StorageError('Failed to save tag group'));
      request.onsuccess = () => resolve();
    });
  }

  async deleteTagGroup(id: string): Promise<void> {
    const db = await this.connect();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tag_groups', 'readwrite');
      const store = tx.objectStore('tag_groups');
      const request = store.delete(id);

      request.onerror = () => reject(new StorageError('Failed to delete tag group'));
      request.onsuccess = () => resolve();
    });
  }
}