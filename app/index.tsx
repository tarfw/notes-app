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
import { useState, useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Plus, Search, X, ArrowUpCircle, ArrowDownCircle } from 'lucide-react-native';
import { SwipeableItem } from '../components/SwipeableItem';
import { useItems } from '../context/ItemsContext';
import { useSQLiteContext } from 'expo-sqlite';

export default function ItemsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tableSize, setTableSize] = useState('0 KB');
  const router = useRouter();
  const db = useSQLiteContext();
  const { items, createItem, deleteItem, isSyncing, toggleSync, pullFromRemote, pushToRemote, hasPendingDeletions, syncPendingDeletions } =
    useItems();

  const filteredItems = items
    .filter(item => item?.id) // Only include items with valid IDs
    .filter(
      (item) =>
        item.itemid?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.locationid?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Calculate table size
  useEffect(() => {
    const calculateTableSize = async () => {
      try {
        // Get table size from SQLite system tables
        const result = await db.getFirstAsync<{ size: number }>(
          `SELECT SUM(LENGTH(id) + LENGTH(COALESCE(itemid, '')) + LENGTH(COALESCE(locationid, '')) + 
           LENGTH(COALESCE(type, '')) + LENGTH(COALESCE(refid, '')) + LENGTH(COALESCE(userid, '')) + 
           LENGTH(COALESCE(notes, '')) + LENGTH(COALESCE(status, '')) + 
           LENGTH(COALESCE(created_at, '')) + 40) as size FROM ilogs`
        );
        
        if (result && result.size) {
          const sizeInBytes = result.size;
          const sizeInKB = sizeInBytes / 1024;
          const sizeInMB = sizeInKB / 1024;
          
          if (sizeInMB >= 1) {
            setTableSize(`${sizeInMB.toFixed(2)} MB`);
          } else if (sizeInKB >= 1) {
            setTableSize(`${sizeInKB.toFixed(2)} KB`);
          } else {
            setTableSize(`${sizeInBytes} bytes`);
          }
        } else {
          // Fallback: estimate based on record count
          const estimatedSizeKB = items.length * 0.5; // Rough estimate
          setTableSize(`~${estimatedSizeKB.toFixed(2)} KB`);
        }
      } catch (error) {
        console.error('Error calculating table size:', error);
        // Fallback: estimate based on record count
        const estimatedSizeKB = items.length * 0.5; // Rough estimate
        setTableSize(`~${estimatedSizeKB.toFixed(2)} KB`);
      }
    };

    calculateTableSize();
  }, [items, db]);

  const handlePullFromRemote = async () => {
    console.log('Pulling changes from remote...');
    await pullFromRemote();
  };

  const handlePushToRemote = async () => {
    console.log('Pushing local changes to remote...');
    await pushToRemote();
  };

  const handleSyncPendingDeletions = async () => {
    console.log('Syncing pending deletions...');
    await syncPendingDeletions();
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
      onPress={() => router.push(`/item/${item.id.toString()}` as any)}
      onDelete={() => {
        if (item?.id !== undefined && item?.id !== null) {
          deleteItem(item.id);
        }
      }}
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
              <Text style={{ fontSize: 16, marginRight: 8 }}>Auto Sync</Text>
              <Switch
                value={isSyncing}
                onValueChange={(enabled) => {
                  toggleSync(enabled);
                }}
              />
              {hasPendingDeletions && (
                <Pressable
                  style={[styles.syncButton, { backgroundColor: '#FF3B30' }]}
                  onPress={handleSyncPendingDeletions}
                >
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                    {hasPendingDeletions ? 'Sync Del' : ''}
                  </Text>
                </Pressable>
              )}
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
          keyExtractor={(item) => item.id.toString()}
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
              <Text style={styles.dataSize}>
                {filteredItems.length} of {items.length} records • {tableSize}
              </Text>
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
  dataSize: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
});
