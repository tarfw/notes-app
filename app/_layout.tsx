import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
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
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="note/[id]" />
        </Stack>
        <StatusBar style="auto" />
      </GestureHandlerRootView>
    </NotesProvider>
  );
}