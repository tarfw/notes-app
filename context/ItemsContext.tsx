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

export interface ILog {
  id: number;
  itemid: string | null;
  locationid: string | null;
  type: string | null;
  qty: number | null;
  refid: string | null;
  pqty: number | null;  // previous quantity
  nqty: number | null;  // new quantity
  cqty: number | null;  // committed quantity
  userid: string | null;
  notes: string | null;
  status: string | null;
  created_at: string | null;
}

export const DB_NAME = 'items-app-db.db';

export const tursoOptions = {
  url: process.env.EXPO_PUBLIC_TURSO_DB_URL,
  authToken: process.env.EXPO_PUBLIC_TURSO_DB_AUTH_TOKEN,
};

interface ILogsContextType {
  items: ILog[];
  createItem: () => Promise<ILog | undefined>;
  updateItem: (id: number, updates: Partial<ILog>) => void;
  saveItem: (id: number, itemData: Partial<ILog>) => Promise<string>;
  deleteItem: (id: number) => void;
  pullFromRemote: () => void;
  pushToRemote: () => void;
  toggleSync: (enabled: boolean) => void;
  startEditMode: () => void;
  endEditMode: () => void;
  isSyncing: boolean;
  hasPendingDeletions: boolean;
  syncPendingDeletions: () => Promise<void>;
}

const ILogsContext = createContext<ILogsContextType | null>(null);

export function ILogsProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  
  // Separate state for UI items and sync control
  const [uiItems, setUiItems] = useState<ILog[]>([]);
  const [pendingItems, setPendingItems] = useState<Map<string, ILog>>(new Map());
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPendingDeletions, setHasPendingDeletions] = useState(false);
  
  // Refs for sync control - won't trigger re-renders
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const isEditingRef = useRef(false);
  const syncQueueRef = useRef<Set<string>>(new Set());
  const deletedItemsRef = useRef<Set<number>>(new Set());

  // Initial data load
  useEffect(() => {
    loadItemsFromDB();
  }, []);

  // Load items from database without affecting UI state during editing
  const loadItemsFromDB = useCallback(async () => {
    try {
      const items = await db.getAllAsync<ILog>(
        'SELECT * FROM ilogs ORDER BY created_at DESC'
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
      const items = await db.getAllAsync<ILog>(
        'SELECT * FROM ilogs ORDER BY created_at DESC'
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
    const tempId = -(Date.now() + Math.floor(Math.random() * 1000)); // Negative number for temp items
    
    const newItem: ILog = {
      id: tempId,
      itemid: '',
      locationid: '',
      type: '',
      qty: 0,
      refid: '',
      pqty: 0,
      nqty: 0,
      cqty: 0,
      userid: '',
      notes: '',
      status: 'active',
      created_at: new Date().toISOString(),
    };

    setPendingItems(prev => new Map(prev).set(tempId.toString(), newItem));
    
    return newItem;
  }, []);

  // Update item (local state only during editing)
  const updateItem = useCallback((id: number, updates: Partial<ILog>) => {
    if (id < 0) {
      // Update pending item (negative ID)
      setPendingItems(prev => {
        const newMap = new Map(prev);
        const existingItem = newMap.get(id.toString());
        if (existingItem) {
          newMap.set(id.toString(), { ...existingItem, ...updates });
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
  const saveItem = useCallback(async (id: number, itemData: Partial<ILog>): Promise<string> => {
    try {
      if (id < 0) {
        // Insert new item (negative ID)
        const result = await db.runAsync(
          'INSERT INTO ilogs (itemid, locationid, type, qty, refid, pqty, nqty, cqty, userid, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          itemData.itemid || '',
          itemData.locationid || '',
          itemData.type || '',
          itemData.qty || 0,
          itemData.refid || '',
          itemData.pqty || 0,
          itemData.nqty || 0,
          itemData.cqty || 0,
          itemData.userid || '',
          itemData.notes || '',
          itemData.status || 'active'
        );
        
        const realId = result.lastInsertRowId;
        
        // Remove from pending
        setPendingItems(prev => {
          const newMap = new Map(prev);
          newMap.delete(id.toString());
          return newMap;
        });
        
        // Add to sync queue for later
        syncQueueRef.current.add(realId.toString());
        
        return realId.toString();
      } else {
        // Update existing item
        const fields: string[] = [];
        const values: any[] = [];
        
        Object.entries(itemData).forEach(([key, value]) => {
          if (value !== undefined && key !== 'id' && key !== 'created_at') {
            fields.push(`${key} = ?`);
            values.push(value);
          }
        });
        
        if (fields.length > 0) {
          values.push(id);
          const updateQuery = `UPDATE ilogs SET ${fields.join(', ')} WHERE id = ?`;
          await db.runAsync(updateQuery, ...values);
          
          // Add to sync queue
          syncQueueRef.current.add(id.toString());
        }
        
        return id.toString();
      }
    } catch (error) {
      console.error('Error saving item:', error);
      throw error;
    }
  }, [db]);

  // Delete item
  const deleteItem = useCallback(async (id: number) => {
    // Validate ID parameter
    if (id === undefined || id === null) {
      console.error('Delete failed: Valid ID is required, received:', id);
      return;
    }

    try {
      if (id < 0) {
        // Remove pending item (negative ID)
        setPendingItems(prev => {
          const newMap = new Map(prev);
          newMap.delete(id.toString());
          return newMap;
        });
      } else {
        // Delete from database
        await db.runAsync('DELETE FROM ilogs WHERE id = ?', id);
        
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
    <ILogsContext.Provider
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
    </ILogsContext.Provider>
  );
}

export function useItems() {
  const context = useContext(ILogsContext);
  if (!context) {
    throw new Error('useItems must be used within an ILogsProvider');
  }
  return context;
}