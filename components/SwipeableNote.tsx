import { Pressable, StyleSheet, Text, View } from 'react-native';
import { format } from 'date-fns';
import { Trash2 } from 'lucide-react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface Note {
  id: string;
  title: string;
  content: string;
  modifiedDate: Date;
}

interface Props {
  note: Note;
  onPress: () => void;
  onDelete: () => void;
}

const SWIPE_THRESHOLD = -75;

export function SwipeableNote({ note, onPress, onDelete }: Props) {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(76);
  const marginBottom = useSharedValue(10);
  const opacity = useSharedValue(1);

  const panGesture = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onActive: (event) => {
      translateX.value = Math.min(0, event.translationX);
    },
    onEnd: () => {
      const shouldBeDismissed = translateX.value < SWIPE_THRESHOLD;
      if (shouldBeDismissed) {
        translateX.value = withTiming(-100);
        itemHeight.value = withTiming(0);
        marginBottom.value = withTiming(0);
        opacity.value = withTiming(0, undefined, (finished) => {
          if (finished) {
            runOnJS(onDelete)();
          }
        });
      } else {
        translateX.value = withSpring(0);
      }
    },
  });

  const rStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const rContainerStyle = useAnimatedStyle(() => ({
    height: itemHeight.value,
    marginBottom: marginBottom.value,
    opacity: opacity.value,
  }));

  const rIconContainerStyle = useAnimatedStyle(() => ({
    opacity: withSpring(translateX.value < -20 ? 1 : 0),
  }));

  return (
    <Animated.View style={[styles.container, rContainerStyle]}>
      <Animated.View style={[styles.deleteIconContainer, rIconContainerStyle]}>
        <Trash2 size={24} color="#FF3B30" />
      </Animated.View>
      <PanGestureHandler onGestureEvent={panGesture}>
        <Animated.View style={[styles.noteItem, rStyle]}>
          <Pressable onPress={onPress} style={styles.content}>
            <Text style={styles.noteTitle}>{note.title || 'Untitled Note'}</Text>
            <Text style={styles.noteDate}>
              {format(note.modifiedDate, 'MMM d, yyyy')}
            </Text>
            <Text style={styles.notePreview} numberOfLines={2}>
              {note.content || 'No additional text'}
            </Text>
          </Pressable>
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  deleteIconContainer: {
    position: 'absolute',
    right: 20,
    height: '100%',
    justifyContent: 'center',
  },
  noteItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    padding: 16,
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