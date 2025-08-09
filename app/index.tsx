import React from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  FlatList,
  Pressable,
  Switch,
  Text,
  Button,
} from 'react-native';
import { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Plus, Search, X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react-native';
import { SwipeableItem } from '../components/SwipeableItem';
import { useItems } from '../context/ItemsContext';

export default function ItemsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { items, createItem, deleteItem, isSyncing, toggleSync, pullFromRemote, pushToRemote } =
    useItems();

  const filteredItems = items.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePullFromRemote = async () => {
    console.log('Pulling changes from remote...');
    await pullFromRemote();
  };

  const handlePushToRemote = async () => {
    console.log('Pushing local changes to remote...');
    await pushToRemote();
  };

  const handleCreateItem = async () => {
    console.log('Creating item...');
    const newItem = await createItem();
    if (newItem) {
      router.push(`/item/${newItem.id}` as any);
    } else {
      alert('Failed to create item');
    }
  };

  const renderItem = ({ item }: any) => (
    <SwipeableItem
      item={item}
      onPress={() => router.push(`/item/${item.id}` as any)}
      onDelete={() => deleteItem(item.id)}
    />
  );
  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {/* <Text style={{ fontSize: 16 }}>Sync</Text> */}
              {/* <Switch
                value={isSyncing}
                onValueChange={() => {
                  // toggleSync(!isSyncing);
                  
                }}
              /> */}
              <Pressable
                style={styles.syncButton}
                onPress={handlePullFromRemote}
              >
                <ArrowDownCircle size={24} color="#007AFF" />
              </Pressable>
              <Pressable
                style={styles.syncButton}
                onPress={handlePushToRemote}
              >
                <ArrowUpCircle size={24} color="#007AFF" />
              </Pressable>
            </View>
          ),
        }}
      />
      <View style={styles.itemsList}>
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={() => (
            <View style={styles.headerContainer}>
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
          )}
          contentContainerStyle={styles.listContent}
          contentInsetAdjustmentBehavior="automatic"
        />
        <Pressable style={styles.fab} onPress={handleCreateItem}>
          <Plus size={24} color="#FFFFFF" />
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 10,
  },
  headerContainer: {
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
    borderRadius: 10,
    paddingHorizontal: 8,
    height: 36,
    marginVertical: 16,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: '#000',
  },
  itemsList: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  syncButton: {
    padding: 8,
    marginLeft: 4,
    marginRight: 4,
  },
  listContent: {
    paddingBottom: 100, // Extra padding for FAB
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
