import { Stack } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DB_NAME, ItemsProvider, tursoOptions } from '../context/ItemsContext';
import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'react-native';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <SQLiteProvider
      databaseName={DB_NAME}
      options={{
        libSQLOptions: {
          url: tursoOptions.url,
          authToken: tursoOptions.authToken,
        },
      }}
      onInit={async (db: SQLiteDatabase) => {
        try {
          // Always sync libSQL first to prevent conflicts between local and remote databases
          db.syncLibSQL();
        } catch (e) {
          console.log('Error onInit syncing libSQL:', e);
        }

        // Define the target database version.
        const DATABASE_VERSION = 2;

        // PRAGMA is a special command in SQLite used to query or modify database settings. For example, PRAGMA user_version retrieves or sets a custom schema version number, helping you track migrations.
        // Retrieve the current database version using PRAGMA.
        let result = await db.getFirstAsync<{
          user_version: number;
        } | null>('PRAGMA user_version');
        let currentDbVersion = result?.user_version ?? 0;

        // If the current version is already equal or newer, no migration is needed.
        if (currentDbVersion >= DATABASE_VERSION) {
          console.log('No migration needed, DB version:', currentDbVersion);
          return;
        }

        // For a new or uninitialized database (version 0), apply the initial migration.
        if (currentDbVersion === 0) {
          // Note: libSQL does not support WAL (Write-Ahead Logging) mode.
          // await db.execAsync(`PRAGMA journal_mode = 'wal';`);

          // Create the 'items' table with new columns:
          // - id: an integer primary key that cannot be null.
          // - image: a text column for image URL/path.
          // - barcode: a text column for barcode.
          // - name: a text column for item name.
          // - qty: an integer column for quantity/stock on hand.
          await db.execAsync(
            `CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY NOT NULL, image TEXT, barcode TEXT, name TEXT, qty INTEGER);`
          );
          console.log(
            'Initial migration applied, DB version:',
            DATABASE_VERSION
          );
          // Update the current version after applying the initial migration.
          currentDbVersion = 2;
        } else if (currentDbVersion === 1) {
          // Migration from notes to items table
          console.log('Migrating from notes to items table...');
          
          // Drop old notes table and create new items table
          await db.execAsync(`DROP TABLE IF EXISTS notes;`);
          await db.execAsync(
            `CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY NOT NULL, image TEXT, barcode TEXT, name TEXT, qty INTEGER);`
          );
          
          console.log('Migration to items table completed, DB version:', DATABASE_VERSION);
          currentDbVersion = 2;
        } else {
          console.log('DB version:', currentDbVersion);
        }

        // Future migrations for later versions can be added here.
        // Example:
        // if (currentDbVersion === 1) {
        //   // Add migration steps for upgrading from version 1 to a higher version.
        // }

        // Set the database version to the target version after migration.
        await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
      }}
    >
      <ItemsProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'none',
              gestureEnabled: true,
            }}
          >
            <Stack.Screen
              name="index"
              options={{
                headerShown: true,
                headerLargeTitle: true,
                headerTitle: 'Items',
              }}
            />
            <Stack.Screen
              name="item/[id]"
              options={{
                headerShown: true,
              }}
            />
          </Stack>
          <StatusBar barStyle={'dark-content'} />
        </GestureHandlerRootView>
      </ItemsProvider>
    </SQLiteProvider>
  );
}
