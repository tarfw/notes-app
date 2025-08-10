import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TextInput, Pressable, Text } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Item, useItems } from '../../context/ItemsContext';
import { useSQLiteContext } from 'expo-sqlite';
import { Save } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function ItemScreen() {
  const { id } = useLocalSearchParams();
  const db = useSQLiteContext();
  const router = useRouter();
  const { items, updateItem, saveItem, deleteItem, startEditMode, endEditMode } = useItems();
  const [item, setItem] = useState({ 
    name: '', 
    sku: '', 
    barcode: '', 
    status: 'active',
    options: '{}'
  });
  const originalItemRef = useRef<typeof item | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isNewItem, setIsNewItem] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      const itemId = id as string;
      
      // First check if it's a pending item (temp ID)
      if (itemId.startsWith('temp_')) {
        const pendingItem = items.find(item => item.id === itemId);
        if (pendingItem) {
          const itemData = {
            name: pendingItem.name || '',
            sku: pendingItem.sku || '',
            barcode: pendingItem.barcode || '',
            status: pendingItem.status || 'active',
            options: pendingItem.options || '{}'
          };
          setItem(itemData);
          originalItemRef.current = itemData;
          setHasUnsavedChanges(false);
          setIsNewItem(true); // Pending items are always new
        }
        return;
      }
      
      // Otherwise fetch from database
      const currentItem = await db.getFirstAsync<Item>(
        'SELECT * FROM items WHERE id = ?',
        [itemId]
      );
      if (currentItem) {
        const itemData = {
          name: currentItem.name || '',
          sku: currentItem.sku || '',
          barcode: currentItem.barcode || '',
          status: currentItem.status || 'active',
          options: currentItem.options || '{}'
        };
        setItem(itemData);
        originalItemRef.current = itemData;
        setHasUnsavedChanges(false);
        
        // Check if this is a newly created empty item
        const isEmpty = !currentItem.name && !currentItem.sku && 
                       !currentItem.barcode && currentItem.options === '{}';
        setIsNewItem(isEmpty);
      }
    };
    fetchItem();
  }, [id, db, items]); // Added items dependency to react to pending item changes
  
  // Start/end edit mode for smooth sync operation
  useFocusEffect(
    React.useCallback(() => {
      startEditMode();
      
      return () => {
        endEditMode();
      };
    }, [startEditMode, endEditMode])
  );
  
  // Handle back button press to clean up empty items
  const handleBackPress = () => {
    if (isNewItem && !hasUnsavedChanges) {
      const isEmpty = !item.name && !item.sku && 
                     !item.barcode && item.options === '{}';
      if (isEmpty) {
        deleteItem(id as string);
      }
    }
    router.back();
  };

  const handleNameChange = (name: string) => {
    setItem((prev) => ({ ...prev, name }));
    setHasUnsavedChanges(true);
  };

  const handleSkuChange = (sku: string) => {
    setItem((prev) => ({ ...prev, sku }));
    setHasUnsavedChanges(true);
  };

  const handleBarcodeChange = (barcode: string) => {
    setItem((prev) => ({ ...prev, barcode }));
    setHasUnsavedChanges(true);
  };

  const handleStatusChange = (status: string) => {
    setItem((prev) => ({ ...prev, status }));
    setHasUnsavedChanges(true);
  };

  const handleOptionsChange = (options: string) => {
    setItem((prev) => ({ ...prev, options }));
    setHasUnsavedChanges(true);
  };

  const handleSaveItem = async () => {
    try {
      // Use saveItem for both new and existing items
      const savedId = await saveItem(id as string, { 
        name: item.name, 
        sku: item.sku,
        barcode: item.barcode,
        status: item.status,
        options: item.options
      });
      
      setHasUnsavedChanges(false);
      setIsNewItem(false); // No longer a new item after saving
      
      // Small delay to ensure smooth state transition, then navigate back
      setTimeout(() => {
        router.back();
      }, 100);
    } catch (error) {
      alert('Failed to save item. Please try again.');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: item.name || 'Untitled Item',
          headerLeft: () => (
            <Pressable onPress={handleBackPress}>
              <Text style={{ color: '#007AFF', fontSize: 17 }}>Back</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              style={[styles.saveButton, hasUnsavedChanges && styles.saveButtonHighlight]}
              onPress={handleSaveItem}
            >
              <Save size={24} color={hasUnsavedChanges ? "#FF3B30" : "#007AFF"} />
            </Pressable>
          ),
        }}
      />
      <View style={styles.container}>
        <View style={styles.content}>
          <TextInput
            style={styles.nameInput}
            value={item.name}
            onChangeText={handleNameChange}
            placeholder="Item Name"
            placeholderTextColor="#8E8E93"
            autoFocus
          />
          <TextInput
            style={styles.input}
            value={item.sku}
            onChangeText={handleSkuChange}
            placeholder="SKU"
            placeholderTextColor="#8E8E93"
          />
          <TextInput
            style={styles.input}
            value={item.barcode}
            onChangeText={handleBarcodeChange}
            placeholder="Barcode"
            placeholderTextColor="#8E8E93"
          />
          <TextInput
            style={styles.input}
            value={item.options}
            onChangeText={handleOptionsChange}
            placeholder="Options (JSON)"
            placeholderTextColor="#8E8E93"
            multiline
            numberOfLines={3}
          />
          <TextInput
            style={styles.input}
            value={item.status}
            onChangeText={handleStatusChange}
            placeholder="Status"
            placeholderTextColor="#8E8E93"
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  nameInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 12,
    marginBottom: 24,
  },
  input: {
    fontSize: 17,
    color: '#000',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingVertical: 12,
    marginBottom: 16,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonHighlight: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
  },
});
