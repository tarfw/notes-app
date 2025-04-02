## Local First Notes App

Powered by Expo ❤️

## Getting Started

1. Clone the repo.
2. Install dependencies.
3. Prebuild the app. ⚠️ This app isn't compatible with Expo Go.
4. Enable `LibSQL` in your `app.json`:
   ```json
   [
     "expo-sqlite",
     {
       "useLibSQL": true
     }
   ]
   ```

## Turso setup

1. Create a Turso account (if needed)
2. Go to Databases tab
   - Create a new Group e.g. "offline"
   - Create a db in the new group
   - Create and copy a db token with write/read permissions

## Environment Variables

Rename the `.env.local.example` to `.env.local` and add your variables

EXPO_PUBLIC_TURSO_DB_URL=libsql://xxxx.aws-us-east-1.turso.io
EXPO_PUBLIC_TURSO_DB_AUTH_TOKEN=your_token_here

## Adding data in Turso

Create a table

```sql
CREATE TABLE "main"."notes"(
  "id" INTEGER PRIMARY KEY,
  "title" TEXT,
  "content" TEXT,
  "modifiedDatte" TEXT
)
```
