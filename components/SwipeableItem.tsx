import React from 'react';
import { Pressable, StyleSheet, Text, View, LogBox } from 'react-native';
import { Trash2 } from 'lucide-react-native';

LogBox.ignoreAllLogs(); // YOLO

interface ILog {
  id: number;
  itemid: string | null;
  locationid: string | null;
  type: string | null;
  qty: number | null;
  refid: string | null;
  pqty: number | null;
  nqty: number | null;
  cqty: number | null;
  userid: string | null;
  notes: string | null;
  status: string | null;
  created_at: string | null;
}

interface Props {
  item: ILog;
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
            {item.itemid || 'Untitled Item'}
          </Text>
          <Text style={styles.itemBarcode}>
            Type: {item.type || 'No type'} | Location: {item.locationid || 'No location'}
          </Text>
          <Text style={styles.itemQty}>
            Qty: {item.qty || 0} | Status: {item.status || 'No status'}
          </Text>
          {item.notes && (
            <Text style={styles.itemNotes}>
              Notes: {item.notes}
            </Text>
          )}
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
  itemNotes: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
    fontStyle: 'italic',
  },
});
