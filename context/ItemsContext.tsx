import { useSQLiteContext } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';

if (
  !process.env.EXPO_PUBLIC_TURSO_DB_URL ||
  !process.env.EXPO_PUBLIC_TURSO_DB_AUTH_TOKEN
) {
  throw new Error('Turso DB URL and Auth Token must be set in .env.local');
}

export interface Item {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  status: string;
  options: string; // JSON string
  created: string;
  updated: string;
}

export const DB_NAME = 'items-app-db.db';

export const tursoOptions = {
  url: process.env.EXPO_PUBLIC_TURSO_DB_URL,
  authToken: process.env.EXPO_PUBLIC_TURSO_DB_AUTH_TOKEN,
};

interface ItemsContextType {
  items: Item[];
  createItem: () => Promise<Item | undefined>;
  updateItem: (id: string, updates: Partial<Item>) => void;
  saveItem: (id: string, itemData: Partial<Item>) => Promise<string>;
  deleteItem: (id: string) => void;
  pullFromRemote: () => void;
  pushToRemote: () => void;
  toggleSync: (enabled: boolean) => void;
  startEditMode: () => void;
  endEditMode: () => void;
  isSyncing: boolean;
  hasPendingDeletions: boolean;
  syncPendingDeletions: () => Promise<void>;
}

const ItemsContext = createContext<ItemsContextType | null>(null);

export function ItemsProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  
  // Separate state for UI items and sync control
  const [uiItems, setUiItems] = useState<Item[]>([]);
  const [pendingItems, setPendingItems] = useState<Map<string, Item>>(new Map());
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPendingDeletions, setHasPendingDeletions] = useState(false);
  
  // Refs for sync control - won't trigger re-renders
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const isEditingRef = useRef(false);
  const syncQueueRef = useRef<Set<string>>(new Set());
  const deletedItemsRef = useRef<Set<string>>(new Set());

  // Initial data load
  useEffect(() => {
    loadItemsFromDB();
  }, []);

  // Load items from database without affecting UI state during editing
  const loadItemsFromDB = useCallback(async () => {
    try {
      const items = await db.getAllAsync<Item>(
        'SELECT * FROM items ORDER BY created DESC'
      );
      
      // Only update UI if not currently editing
      if (!isEditingRef.current) {
        setUiItems(items);
      }
    } catch (error) {
      console.error('Error loading items:', error);
    }
  }, [db]);

  // Enhanced background sync that handles deletions
  const backgroundSync = useCallback(async () => {
    if (!isSyncing || isEditingRef.current) {
      return;
    }

    try {
      console.log(`Background sync starting... Pending deletions: ${deletedItemsRef.current.size}`);
      
      // Sync with remote database to push local changes (including deletions)
      await db.syncLibSQL();
      
      console.log('Background sync completed successfully');
      
      // Load fresh data but don't update UI if editing
      const items = await db.getAllAsync<Item>(
        'SELECT * FROM items ORDER BY created DESC'
      );
      
      if (!isEditingRef.current) {
        setUiItems(items);
      }
      
      // Clear sync queue and deleted items after successful sync
      const deletedCount = deletedItemsRef.current.size;
      syncQueueRef.current.clear();
      deletedItemsRef.current.clear();
      setHasPendingDeletions(false);
      
      if (deletedCount > 0) {
        console.log(`Successfully synced ${deletedCount} deletions to remote database`);
      }
    } catch (error) {
      // Silently handle sync errors
      console.error('Background sync error:', error);
    }
  }, [db, isSyncing]);

  // Start editing mode - blocks UI updates
  const startEditMode = useCallback(() => {
    isEditingRef.current = true;
  }, []);

  // End editing mode - allows UI updates and syncs
  const endEditMode = useCallback(() => {
    isEditingRef.current = false;
    
    // Immediate refresh after editing
    setTimeout(() => {
      loadItemsFromDB();
      if (isSyncing) {
        backgroundSync();
      }
    }, 100);
  }, [loadItemsFromDB, backgroundSync, isSyncing]);

  // Create new item (local only, no DB insertion)
  const createItem = useCallback(async () => {
    const tempId = `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`; // String ID for temp items
    
    const newItem: Item = {
      id: tempId,
      name: '',
      sku: '',
      barcode: '',
      status: 'active',
      options: '{}', // Empty JSON object
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    setPendingItems(prev => new Map(prev).set(tempId.toString(), newItem));
    
    return newItem;
  }, []);

  // Update item (local state only during editing)
  const updateItem = useCallback((id: string, updates: Partial<Item>) => {
    if (id.startsWith('temp_')) {
      // Update pending item (temp ID)
      setPendingItems(prev => {
        const newMap = new Map(prev);
        const existingItem = newMap.get(id);
        if (existingItem) {
          newMap.set(id, { ...existingItem, ...updates });
        }
        return newMap;
      });
    } else {
      // Update existing item in UI state only (don't touch DB during editing)
      setUiItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      ));
    }
  }, []);

  // Save item to database (only called when user explicitly saves)
  const saveItem = useCallback(async (id: string, itemData: Partial<Item>): Promise<string> => {
    try {
      if (id.startsWith('temp_')) {
        // Insert new item (temp ID)
        const realId = `item_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const now = new Date().toISOString();
        const result = await db.runAsync(
          'INSERT INTO items (id, name, sku, barcode, status, options, created, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          realId,
          itemData.name || '',
          itemData.sku || '',
          itemData.barcode || '',
          itemData.status || 'active',
          itemData.options || '{}',
          now,
          now
        );
        
        // Remove from pending
        setPendingItems(prev => {
          const newMap = new Map(prev);
          newMap.delete(id);
          return newMap;
        });
        
        // Add to sync queue for later
        syncQueueRef.current.add(realId);
        
        return realId;
      } else {
        // Update existing item
        const fields: string[] = [];
        const values: any[] = [];
        
        Object.entries(itemData).forEach(([key, value]) => {
          if (value !== undefined && key !== 'id' && key !== 'created') {
            fields.push(`${key} = ?`);
            values.push(value);
          }
        });
        
        if (fields.length > 0) {
          // Add updated timestamp
          fields.push('updated = ?');
          values.push(new Date().toISOString());
          values.push(id);
          const updateQuery = `UPDATE items SET ${fields.join(', ')} WHERE id = ?`;
          await db.runAsync(updateQuery, ...values);
          
          // Add to sync queue
          syncQueueRef.current.add(id);
        }
        
        return id;
      }
    } catch (error) {
      console.error('Error saving item:', error);
      throw error;
    }
  }, [db]);

  // Delete item
  const deleteItem = useCallback(async (id: string) => {
    // Validate ID parameter
    if (id === undefined || id === null) {
      console.error('Delete failed: Valid ID is required, received:', id);
      return;
    }

    try {
      if (id.startsWith('temp_')) {
        // Remove pending item (temp ID)
        setPendingItems(prev => {
          const newMap = new Map(prev);
          newMap.delete(id);
          return newMap;
        });
      } else {
        // Delete from database
        await db.runAsync('DELETE FROM items WHERE id = ?', id);
        
        // Update UI immediately
        setUiItems(prev => prev.filter(item => item.id !== id));
        
        // Track deletion for sync
        deletedItemsRef.current.add(id);
        setHasPendingDeletions(true);
        syncQueueRef.current.add(`delete_${id}`);
        
        console.log(`Item ${id} deleted locally, pending sync to remote. Total pending deletions: ${deletedItemsRef.current.size}`);
        
        // If auto-sync is enabled, trigger immediate sync for deletions
        if (isSyncing) {
          // Small delay to ensure deletion is committed locally
          setTimeout(() => {
            console.log('Triggering immediate sync for deletion...');
            backgroundSync();
          }, 100);
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }, [db, isSyncing, backgroundSync]);

  // Pull from remote
  const pullFromRemote = useCallback(async () => {
    try {
      await db.syncLibSQL();
      await loadItemsFromDB();
    } catch (error) {
      // Silently handle pull errors
    }
  }, [db, loadItemsFromDB]);

  // Push to remote
  const pushToRemote = useCallback(async () => {
    try {
      await db.syncLibSQL();
    } catch (error) {
      // Silently handle push errors
    }
  }, [db]);

  // Sync pending deletions
  const syncPendingDeletions = useCallback(async () => {
    if (deletedItemsRef.current.size > 0) {
      try {
        await db.syncLibSQL();
        deletedItemsRef.current.clear();
        setHasPendingDeletions(false);
        console.log('Pending deletions synced successfully');
      } catch (error) {
        console.error('Error syncing pending deletions:', error);
      }
    }
  }, [db]);

  // Toggle sync
  const toggleSync = useCallback((enabled: boolean) => {
      setIsSyncing(enabled);
    
      if (enabled) {
        // Immediate sync to handle any pending changes (including deletions)
        backgroundSync();
        // Set interval for background sync - more frequent when there are pending deletions
        const syncInterval = hasPendingDeletions ? 5000 : 10000; // 5s if deletions pending, 10s otherwise
        syncIntervalRef.current = setInterval(backgroundSync, syncInterval);
      } else {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
        }
      }
  }, [backgroundSync, hasPendingDeletions]);

  // Update sync interval when pending deletions change
  useEffect(() => {
    if (isSyncing && syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      const syncInterval = hasPendingDeletions ? 5000 : 10000;
      syncIntervalRef.current = setInterval(backgroundSync, syncInterval);
    }
  }, [hasPendingDeletions, isSyncing, backgroundSync]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  // Combined items for UI (real items + pending items) - filter out invalid items
  const allItems = [
    ...uiItems.filter(item => item && item.id), 
    ...Array.from(pendingItems.values()).filter(item => item && item.id)
  ];

  return (
    <ItemsContext.Provider
      value={{
        items: allItems,
        createItem,
        updateItem,
        saveItem,
        deleteItem,
        pullFromRemote,
        pushToRemote,
        toggleSync,
        startEditMode,
        endEditMode,
        isSyncing,
        hasPendingDeletions,
        syncPendingDeletions,
      }}
    >
      {children}
    </ItemsContext.Provider>
  );
}

export function useItems() {
  const context = useContext(ItemsContext);
  if (!context) {
    throw new Error('useItems must be used within an ItemsProvider');
  }
  return context;
}