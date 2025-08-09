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
  image: string | null;
  barcode: string | null;
  name: string | null;
  qty: number | null;
}

export const DB_NAME = 'items-app-db.db'; // Turso db name

export const tursoOptions = {
  url: process.env.EXPO_PUBLIC_TURSO_DB_URL,
  authToken: process.env.EXPO_PUBLIC_TURSO_DB_AUTH_TOKEN,
};

interface ItemsContextType {
  items: Item[];
  createItem: () => Promise<Item | undefined>;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  syncItems: () => void;
  pullFromRemote: () => void;
  pushToRemote: () => void;
  toggleSync: (enabled: boolean) => void;
  isSyncing: boolean;
}

const ItemsContext = createContext<ItemsContextType | null>(null);

export function ItemsProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [items, setItems] = useState<Item[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchItems();
  }, [db]);

  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  const fetchItems = useCallback(async () => {
    console.log('📋 Fetching items from local database...');
    const items = await db.getAllAsync<Item>(
      'SELECT * FROM items ORDER BY name ASC'
    );
    console.log(`📋 Found ${items.length} items in local database`);
    setItems(items);
  }, [db]);

  const syncItems = useCallback(async () => {
    console.log('Syncing items with Turso DB...');

    try {
      await db.syncLibSQL();
      await fetchItems();
      console.log('Synced items with Turso DB');
    } catch (e) {
      console.log(e);
    }
  }, [db, fetchItems]);

  const pullFromRemote = useCallback(async () => {
    console.log('Pulling changes from remote Turso DB...');
    try {
      await db.syncLibSQL();
      await fetchItems();
      console.log('Successfully pulled changes from remote');
    } catch (e) {
      console.log('Error pulling from remote:', e);
    }
  }, [db, fetchItems]);

  const pushToRemote = useCallback(async () => {
    console.log('Pushing local changes to remote Turso DB...');
    try {
      await db.syncLibSQL();
      console.log('Successfully pushed local changes to remote');
    } catch (e) {
      console.log('Error pushing to remote:', e);
    }
  }, [db]);

  const toggleSync = useCallback(
    async (enabled: boolean) => {
      setIsSyncing(enabled);
      if (enabled) {
        console.log('Starting sync interval...');
        await syncItems(); // Sync immediately when enabled
        syncIntervalRef.current = setInterval(syncItems, 2000);
      } else if (syncIntervalRef.current) {
        console.log('Stopping sync interval...');
        clearInterval(syncIntervalRef.current);
      }
    },
    [syncItems]
  );

  const createItem = async () => {
    const newItem = {
      image: '',
      barcode: '',
      name: '',
      qty: 0,
    };

    try {
      const result = await db.runAsync(
        'INSERT INTO items (image, barcode, name, qty) VALUES (?, ?, ?, ?)',
        newItem.image,
        newItem.barcode,
        newItem.name,
        newItem.qty
      );
      fetchItems();
      return { ...newItem, id: result.lastInsertRowId.toString() };
    } catch (e) {
      console.log(e);
    }
  };

  const updateItem = async (id: string, updates: Partial<Item>) => {
    try {
      // Build dynamic SQL query based on what fields are being updated
      const fields = [];
      const values = [];
      
      if (updates.image !== undefined) {
        fields.push('image = ?');
        values.push(updates.image);
      }
      
      if (updates.barcode !== undefined) {
        fields.push('barcode = ?');
        values.push(updates.barcode);
      }
      
      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }
      
      if (updates.qty !== undefined) {
        fields.push('qty = ?');
        values.push(updates.qty);
      }
      
      values.push(id);

      await db.runAsync(
        `UPDATE items SET ${fields.join(', ')} WHERE id = ?`,
        ...values
      );

      // Always refetch to ensure UI is in sync with database
      await fetchItems();
      console.log('Item updated and list refreshed');
    } catch (error) {
      console.error('Error updating item:', error);
      // Fallback to refetch on error
      fetchItems();
    }
  };
  const deleteItem = async (id: string) => {
    try {
      await db.runAsync('DELETE FROM items WHERE id = ?', id);
      
      // Update local state optimistically
      setItems(prevItems => prevItems.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
      // Fallback to refetch on error
      fetchItems();
    }
  };

  return (
    <ItemsContext.Provider
      value={{
        items,
        createItem,
        updateItem,
        deleteItem,
        syncItems,
        pullFromRemote,
        pushToRemote,
        toggleSync,
        isSyncing,
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
