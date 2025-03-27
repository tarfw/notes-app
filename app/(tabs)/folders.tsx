import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { ChevronRight, Folder } from 'lucide-react-native';

const folders = [
  { id: '1', name: 'All Notes', count: 15 },
  { id: '2', name: 'Personal', count: 5 },
  { id: '3', name: 'Work', count: 7 },
  { id: '4', name: 'Ideas', count: 3 },
];

export default function FoldersScreen() {
  const renderFolder = ({ item }) => (
    <Pressable style={styles.folderItem}>
      <View style={styles.folderLeft}>
        <Folder size={24} color="#007AFF" />
        <Text style={styles.folderName}>{item.name}</Text>
      </View>
      <View style={styles.folderRight}>
        <Text style={styles.folderCount}>{item.count}</Text>
        <ChevronRight size={20} color="#C7C7CC" />
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Folders</Text>
      </View>
      <FlatList
        data={folders}
        renderItem={renderFolder}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />
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
  listContent: {
    padding: 16,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  folderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderName: {
    fontSize: 17,
    color: '#000',
    marginLeft: 12,
  },
  folderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  folderCount: {
    fontSize: 17,
    color: '#8E8E93',
    marginRight: 8,
  },
});