import { Stack } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DB_NAME, ILogsProvider, tursoOptions } from '../context/ItemsContext';
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
        const DATABASE_VERSION = 3;

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

          // Create the 'ilogs' table with new columns:
          // - id: an integer primary key that cannot be null.
          // - itemid: text column for item identifier.
          // - locationid: text column for location identifier.
          // - type: text column for log type.
          // - qty: integer column for current quantity.
          // - refid: text column for reference identifier.
          // - pqty: integer column for previous quantity.
          // - nqty: integer column for new quantity.
          // - cqty: integer column for committed quantity.
          // - userid: text column for user identifier.
          // - notes: text column for notes.
          // - status: text column for status.
          // - created_at: datetime column with default current timestamp.
          await db.execAsync(
            `CREATE TABLE IF NOT EXISTS ilogs (
              id INTEGER PRIMARY KEY NOT NULL, 
              itemid TEXT, 
              locationid TEXT, 
              type TEXT, 
              qty INTEGER, 
              refid TEXT, 
              pqty INTEGER, 
              nqty INTEGER, 
              cqty INTEGER, 
              userid TEXT, 
              notes TEXT, 
              status TEXT, 
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );`
          );
          console.log(
            'Initial migration applied, DB version:',
            DATABASE_VERSION
          );
          // Update the current version after applying the initial migration.
          currentDbVersion = 3;
        } else if (currentDbVersion === 1) {
          // Migration from notes to ilogs table
          console.log('Migrating from notes to ilogs table...');
          
          // Drop old notes table and create new ilogs table
          await db.execAsync(`DROP TABLE IF EXISTS notes;`);
          await db.execAsync(
            `CREATE TABLE IF NOT EXISTS ilogs (
              id INTEGER PRIMARY KEY NOT NULL, 
              itemid TEXT, 
              locationid TEXT, 
              type TEXT, 
              qty INTEGER, 
              refid TEXT, 
              pqty INTEGER, 
              nqty INTEGER, 
              cqty INTEGER, 
              userid TEXT, 
              notes TEXT, 
              status TEXT, 
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );`
          );
          
          console.log('Migration to ilogs table completed, DB version:', DATABASE_VERSION);
          currentDbVersion = 3;
        } else if (currentDbVersion === 2) {
          // Migration from items to ilogs table
          console.log('Migrating from items to ilogs table...');
          
          // Drop old items table and create new ilogs table
          await db.execAsync(`DROP TABLE IF EXISTS items;`);
          await db.execAsync(
            `CREATE TABLE IF NOT EXISTS ilogs (
              id INTEGER PRIMARY KEY NOT NULL, 
              itemid TEXT, 
              locationid TEXT, 
              type TEXT, 
              qty INTEGER, 
              refid TEXT, 
              pqty INTEGER, 
              nqty INTEGER, 
              cqty INTEGER, 
              userid TEXT, 
              notes TEXT, 
              status TEXT, 
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );`
          );
          
          console.log('Migration to ilogs table completed, DB version:', DATABASE_VERSION);
          currentDbVersion = 3;
        } else {
          console.log('DB version:', currentDbVersion);
        }

        // Future migrations for later versions can be added here.

        // Set the database version to the target version after migration.
        await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
      }}
    >
      <ILogsProvider>
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
      </ILogsProvider>
    </SQLiteProvider>
  );
}
