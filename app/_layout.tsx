import { Stack } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NotesProvider } from '../context/NotesContext';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <NotesProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              headerShown: true,
              headerLargeTitle: true,
              headerTitle: 'Notes',
            }}
          />
          <Stack.Screen name="note/[id]" />
        </Stack>
      </GestureHandlerRootView>
    </NotesProvider>
  );
}
