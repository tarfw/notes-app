import { View, Text, StyleSheet, TextInput, FlatList, Pressable } from 'react-native';
import { useState } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Search, X } from 'lucide-react-native';

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

export default function NotesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [notes, setNotes] = useState(initialNotes);
  const router = useRouter();

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderNote = ({ item }) => (
    <Pressable
      style={styles.noteItem}
      onPress={() => router.push(`/note/${item.id}`)}>
      <Text style={styles.noteTitle}>{item.title}</Text>
      <Text style={styles.noteDate}>
        {format(item.modifiedDate, 'MMM d, yyyy')}
      </Text>
      <Text style={styles.notePreview} numberOfLines={2}>
        {item.content}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notes</Text>
        <View style={styles.searchContainer}>
          <Search size={20} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={20} color="#8E8E93" />
            </Pressable>
          )}
        </View>
      </View>
      <Animated.View
        entering={FadeIn}
        style={styles.notesList}>
        <FlatList
          data={filteredNotes}
          renderItem={renderNote}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 10,
    backgroundColor: '#F2F2F7',
  },
  title: {
    fontSize: 34,
    fontWeight: '600',
    color: '#000',
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 36,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#000',
  },
  notesList: {
    flex: 1,
  },
  listContent: {
    padding: 16,
  },
  noteItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  noteDate: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 6,
  },
  notePreview: {
    fontSize: 15,
    color: '#3C3C43',
    opacity: 0.6,
  },
});