import React from 'react';
import { Pressable, StyleSheet, Text, View, LogBox } from 'react-native';
import { Trash2 } from 'lucide-react-native';

LogBox.ignoreAllLogs(); // YOLO

interface Item {
  id: string;
  image: string | null;
  barcode: string | null;
  name: string | null;
  qty: number | null;
}

interface Props {
  item: Item;
  onPress: () => void;
  onDelete: () => void;
}

export function SwipeableItem({ item, onPress, onDelete }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => {
          onPress();
        }}
        style={styles.swipeable}
      >
        <View style={styles.content}>
          <Text style={styles.itemName}>
            {item.name || 'Untitled Item'}
          </Text>
          <Text style={styles.itemBarcode}>
            {item.barcode || 'No barcode'}
          </Text>
          <Text style={styles.itemQty}>
            Qty: {item.qty || 0}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            onDelete();
          }}
          style={styles.deleteButton}
        >
          <Trash2 size={24} color="red" />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  swipeable: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: 'white',
  },
  deleteButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  itemBarcode: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 6,
  },
  itemQty: {
    fontSize: 15,
    color: '#3C3C43',
    fontWeight: '500',
  },
});
