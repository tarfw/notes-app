import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TextInput, Pressable, Text } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ILog, useItems } from '../../context/ItemsContext';
import { useSQLiteContext } from 'expo-sqlite';
import { Save } from 'lucide-react-native';
import { useFocusEffect } from '@react-navigation/native';

export default function ItemScreen() {
  const { id } = useLocalSearchParams();
  const db = useSQLiteContext();
  const router = useRouter();
  const { items, updateItem, saveItem, deleteItem, startEditMode, endEditMode } = useItems();
  const [item, setItem] = useState({ 
    itemid: '', 
    locationid: '', 
    type: '', 
    qty: 0,
    refid: '',
    pqty: 0,
    nqty: 0,
    cqty: 0,
    userid: '',
    notes: '',
    status: 'active'
  });
  const originalItemRef = useRef<typeof item | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isNewItem, setIsNewItem] = useState(false);

  useEffect(() => {
    const fetchItem = async () => {
      const numericId = Number(id);
      
      // First check if it's a pending item (negative ID)
      if (numericId < 0) {
        const pendingItem = items.find(item => item.id === numericId);
        if (pendingItem) {
          const itemData = {
            itemid: pendingItem.itemid || '',
            locationid: pendingItem.locationid || '',
            type: pendingItem.type || '',
            qty: pendingItem.qty || 0,
            refid: pendingItem.refid || '',
            pqty: pendingItem.pqty || 0,
            nqty: pendingItem.nqty || 0,
            cqty: pendingItem.cqty || 0,
            userid: pendingItem.userid || '',
            notes: pendingItem.notes || '',
            status: pendingItem.status || 'active'
          };
          setItem(itemData);
          originalItemRef.current = itemData;
          setHasUnsavedChanges(false);
          setIsNewItem(true); // Pending items are always new
        }
        return;
      }
      
      // Otherwise fetch from database
      const currentItem = await db.getFirstAsync<ILog>(
        'SELECT * FROM ilogs WHERE id = ?',
        [numericId]
      );
      if (currentItem) {
        const itemData = {
          itemid: currentItem.itemid || '',
          locationid: currentItem.locationid || '',
          type: currentItem.type || '',
          qty: currentItem.qty || 0,
          refid: currentItem.refid || '',
          pqty: currentItem.pqty || 0,
          nqty: currentItem.nqty || 0,
          cqty: currentItem.cqty || 0,
          userid: currentItem.userid || '',
          notes: currentItem.notes || '',
          status: currentItem.status || 'active'
        };
        setItem(itemData);
        originalItemRef.current = itemData;
        setHasUnsavedChanges(false);
        
        // Check if this is a newly created empty item
        const isEmpty = !currentItem.itemid && !currentItem.locationid && 
                       !currentItem.type && !currentItem.refid && 
                       !currentItem.userid && !currentItem.notes;
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
      const isEmpty = !item.itemid && !item.locationid && 
                     !item.type && !item.refid && 
                     !item.userid && !item.notes;
      if (isEmpty) {
        deleteItem(Number(id));
      }
    }
    router.back();
  };

  const handleItemIdChange = (itemid: string) => {
    setItem((prev) => ({ ...prev, itemid }));
    setHasUnsavedChanges(true);
  };

  const handleLocationIdChange = (locationid: string) => {
    setItem((prev) => ({ ...prev, locationid }));
    setHasUnsavedChanges(true);
  };

  const handleTypeChange = (type: string) => {
    setItem((prev) => ({ ...prev, type }));
    setHasUnsavedChanges(true);
  };

  const handleRefIdChange = (refid: string) => {
    setItem((prev) => ({ ...prev, refid }));
    setHasUnsavedChanges(true);
  };

  const handleUserIdChange = (userid: string) => {
    setItem((prev) => ({ ...prev, userid }));
    setHasUnsavedChanges(true);
  };

  const handleNotesChange = (notes: string) => {
    setItem((prev) => ({ ...prev, notes }));
    setHasUnsavedChanges(true);
  };

  const handleStatusChange = (status: string) => {
    setItem((prev) => ({ ...prev, status }));
    setHasUnsavedChanges(true);
  };

  const handleQtyChange = (qtyText: string) => {
    const qty = parseInt(qtyText) || 0;
    setItem((prev) => ({ ...prev, qty }));
    setHasUnsavedChanges(true);
  };

  const handlePqtyChange = (pqtyText: string) => {
    const pqty = parseInt(pqtyText) || 0;
    setItem((prev) => ({ ...prev, pqty }));
    setHasUnsavedChanges(true);
  };

  const handleNqtyChange = (nqtyText: string) => {
    const nqty = parseInt(nqtyText) || 0;
    setItem((prev) => ({ ...prev, nqty }));
    setHasUnsavedChanges(true);
  };

  const handleCqtyChange = (cqtyText: string) => {
    const cqty = parseInt(cqtyText) || 0;
    setItem((prev) => ({ ...prev, cqty }));
    setHasUnsavedChanges(true);
  };

  const handleSaveItem = async () => {
    try {
      // Use saveItem for both new and existing items
      const savedId = await saveItem(Number(id), { 
        itemid: item.itemid, 
        locationid: item.locationid,
        type: item.type,
        qty: item.qty,
        refid: item.refid,
        pqty: item.pqty,
        nqty: item.nqty,
        cqty: item.cqty,
        userid: item.userid,
        notes: item.notes,
        status: item.status
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
          headerTitle: item.itemid || 'Untitled Item',
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
            value={item.itemid}
            onChangeText={handleItemIdChange}
            placeholder="Item ID"
            placeholderTextColor="#8E8E93"
            autoFocus
          />
          <TextInput
            style={styles.input}
            value={item.locationid}
            onChangeText={handleLocationIdChange}
            placeholder="Location ID"
            placeholderTextColor="#8E8E93"
          />
          <TextInput
            style={styles.input}
            value={item.type}
            onChangeText={handleTypeChange}
            placeholder="Type"
            placeholderTextColor="#8E8E93"
          />
          <TextInput
            style={styles.input}
            value={item.qty.toString()}
            onChangeText={handleQtyChange}
            placeholder="Current Quantity"
            placeholderTextColor="#8E8E93"
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={item.refid}
            onChangeText={handleRefIdChange}
            placeholder="Reference ID"
            placeholderTextColor="#8E8E93"
          />
          <TextInput
            style={styles.input}
            value={item.pqty.toString()}
            onChangeText={handlePqtyChange}
            placeholder="Previous Quantity"
            placeholderTextColor="#8E8E93"
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={item.nqty.toString()}
            onChangeText={handleNqtyChange}
            placeholder="New Quantity"
            placeholderTextColor="#8E8E93"
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={item.cqty.toString()}
            onChangeText={handleCqtyChange}
            placeholder="Committed Quantity"
            placeholderTextColor="#8E8E93"
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={item.userid}
            onChangeText={handleUserIdChange}
            placeholder="User ID"
            placeholderTextColor="#8E8E93"
          />
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={item.notes}
            onChangeText={handleNotesChange}
            placeholder="Notes"
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
  notesInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
});
