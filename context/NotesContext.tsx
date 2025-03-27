import { createContext, useContext, useState } from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
  modifiedDate: Date;
}

interface NotesContextType {
  notes: Note[];
  createNote: () => Note;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
}

const initialNotes = [
  {
    id: '1',
    title: 'Shopping List',
    content: 'Milk, eggs, bread, fruits, vegetables',
    modifiedDate: new Date('2024-01-20'),
  },
  {
    id: '2',
    title: 'Meeting Notes',
    content: 'Discuss project timeline and deliverables',
    modifiedDate: new Date('2024-01-19'),
  },
  {
    id: '3',
    title: 'Ideas',
    content: 'New app features and improvements',
    modifiedDate: new Date('2024-01-18'),
  },
];

const NotesContext = createContext<NotesContextType | null>(null);

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState(initialNotes);

  const createNote = () => {
    const newNote = {
      id: String(Date.now()),
      title: '',
      content: '',
      modifiedDate: new Date(),
    };
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === id
          ? { ...note, ...updates, modifiedDate: new Date() }
          : note
      )
    );
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  return (
    <NotesContext.Provider value={{ notes, createNote, updateNote, deleteNote }}>
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