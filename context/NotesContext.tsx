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
export interface Note {
  id: string;
  title: string | null;
  content: string | null;
  modifiedDate: Date | null;
}

export const DB_NAME = 'notes-app-db.db'; // Turso db name

export const tursoOptions = {
  url: process.env.EXPO_PUBLIC_TURSO_DB_URL,
  authToken: process.env.EXPO_PUBLIC_TURSO_DB_AUTH_TOKEN,
};

interface NotesContextType {
  notes: Note[];
  createNote: () => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  syncNotes: () => void;
  toggleSync: (enabled: boolean) => void;
  isSyncing: boolean;
}

const NotesContext = createContext<NotesContextType | null>(null);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const db = useSQLiteContext();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchNotes();
  }, [db]);

  useEffect(() => {
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  const fetchNotes = useCallback(async () => {
    const notes = await db.getAllAsync<Note>('SELECT * FROM notes');
    setNotes(notes);
  }, [db]);

  const syncNotes = useCallback(async () => {
    console.log('Syncing notes with Turso DB...');
    db.syncLibSQL();
    fetchNotes();
  }, [db, fetchNotes]);

  const toggleSync = useCallback(
    (enabled: boolean) => {
      setIsSyncing(enabled);
      if (enabled) {
        console.log('Starting sync interval...');
        syncNotes(); // Sync immediately when enabled
        syncIntervalRef.current = setInterval(syncNotes, 2000);
      } else if (syncIntervalRef.current) {
        console.log('Stopping sync interval...');
        clearInterval(syncIntervalRef.current);
      }
    },
    [syncNotes]
  );

  const createNote = () => {
    const newNote = {
      id: String(Date.now()),
      title: '',
      content: '',
      modifiedDate: new Date(),
    };
    setNotes((prev) => [newNote, ...prev]);
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id
          ? { ...note, ...updates, modifiedDate: new Date() }
          : note
      )
    );
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        createNote,
        updateNote,
        deleteNote,
        syncNotes,
        toggleSync,
        isSyncing,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export function useNotes() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within a NotesProvider');
  }
  return context;
}
