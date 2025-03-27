import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ArrowLeft, Share2 } from 'lucide-react-native';
import { Note, useNotes } from '../../context/NotesContext';
import { useSQLiteContext } from 'expo-sqlite';

export default function NoteScreen() {
  const { id } = useLocalSearchParams();
  const db = useSQLiteContext();
  const router = useRouter();
  const { notes, updateNote } = useNotes();
  const [note, setNote] = useState({ title: '', content: '' });

  useEffect(() => {
    const fetchNote = async () => {
      const currentNote = await db.getFirstAsync<Note>(
        'SELECT * FROM notes WHERE id = ?',
        [id as string]
      );
      if (currentNote) {
        setNote({
          title: currentNote.title || '',
          content: currentNote.content || '',
        });
      }
    };
    fetchNote();
  }, [id, notes]);

  const handleTitleChange = (title: string) => {
    setNote((prev) => ({ ...prev, title }));
    updateNote(id as string, { title });
  };

  const handleContentChange = (content: string) => {
    setNote((prev) => ({ ...prev, content }));
    updateNote(id as string, { content });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#007AFF" />
          <Text style={styles.backText}>Notes</Text>
        </Pressable>
        <Pressable style={styles.shareButton}>
          <Share2 size={24} color="#007AFF" />
        </Pressable>
      </View>
      <View style={styles.content}>
        <TextInput
          style={styles.titleInput}
          value={note.title}
          onChangeText={handleTitleChange}
          placeholder="Title"
          placeholderTextColor="#8E8E93"
        />
        <TextInput
          style={styles.contentInput}
          value={note.content}
          onChangeText={handleContentChange}
          placeholder="Note"
          placeholderTextColor="#8E8E93"
          multiline
          textAlignVertical="top"
          autoFocus
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 10,
    backgroundColor: '#F2F2F7',
    borderBottomWidth: 0.5,
    borderBottomColor: '#C6C6C8',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 17,
    color: '#007AFF',
    marginLeft: 4,
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  contentInput: {
    flex: 1,
    fontSize: 17,
    color: '#000',
    lineHeight: 22,
  },
});
