import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TextInput, Pressable } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Item, useItems } from '../../context/ItemsContext';
import { useSQLiteContext } from 'expo-sqlite';
import { Save } from 'lucide-react-native';

export default function ItemScreen() {
  const { id } = useLocalSearchParams();
  const db = useSQLiteContext();
  const router = useRouter();
  const { items, updateItem } = useItems();
  const [item, setItem] = useState({ 
    image: '', 
    barcode: '', 
    name: '', 
    qty: 0 
  });
  const originalItemRef = useRef<typeof item | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      const currentItem = await db.getFirstAsync<Item>(
        'SELECT * FROM items WHERE id = ?',
        [id as string]
      );
      if (currentItem) {
        const itemData = {
          image: currentItem.image || '',
          barcode: currentItem.barcode || '',
          name: currentItem.name || '',
          qty: currentItem.qty || 0,
        };
        setItem(itemData);
        originalItemRef.current = itemData;
        setHasUnsavedChanges(false);
      }
    };
    fetchItem();
  }, [id, db]); // Removed 'items' dependency to prevent refresh on sync

  const handleImageChange = (image: string) => {
    setItem((prev) => ({ ...prev, image }));
    setHasUnsavedChanges(true);
  };

  const handleBarcodeChange = (barcode: string) => {
    setItem((prev) => ({ ...prev, barcode }));
    setHasUnsavedChanges(true);
  };

  const handleNameChange = (name: string) => {
    setItem((prev) => ({ ...prev, name }));
    setHasUnsavedChanges(true);
  };

  const handleQtyChange = (qtyText: string) => {
    const qty = parseInt(qtyText) || 0;
    setItem((prev) => ({ ...prev, qty }));
    setHasUnsavedChanges(true);
  };

  const handleSaveItem = async () => {
    try {
      console.log('💾 Saving item to local database...');
      
      // Save current item data to LOCAL database only
      await updateItem(id as string, { 
        image: item.image, 
        barcode: item.barcode,
        name: item.name,
        qty: item.qty
      });
      
      console.log('✅ Item saved to local database successfully');
      setHasUnsavedChanges(false);
      
      // Small delay to ensure smooth state transition, then navigate back
      setTimeout(() => {
        console.log('🔙 Navigating back to items list...');
        router.back();
        console.log('🔄 Changes ready for sync when auto-sync runs');
      }, 100);
    } catch (error) {
      console.error('❌ Error saving item:', error);
      alert('Failed to save item. Please try again.');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: item.name || 'Untitled Item',
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
            style={styles.input}
            value={item.image}
            onChangeText={handleImageChange}
            placeholder="Image URL"
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
            style={styles.nameInput}
            value={item.name}
            onChangeText={handleNameChange}
            placeholder="Item Name"
            placeholderTextColor="#8E8E93"
            autoFocus
          />
          <TextInput
            style={styles.input}
            value={item.qty.toString()}
            onChangeText={handleQtyChange}
            placeholder="Quantity"
            placeholderTextColor="#8E8E93"
            keyboardType="numeric"
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
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  nameInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 8,
  },
  input: {
    fontSize: 17,
    color: '#000',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingBottom: 8,
  },
  saveButton: {
    padding: 8,
    marginRight: 8,
  },
  saveButtonHighlight: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
  },
});
