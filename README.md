## Local First Notes App

Powered by Expo ❤️

## Getting started

- Clone the repo
- Install dependencies
- Prebuild the app (⚠️ not compatible with Expo Go)
- Turn on `LibSQL`
  ```json
  [
    "expo-sqlite",
    {
      "useLibSQL": true
    }
  ]
  ```

## Turso setup

- Create a Turso account (if needed)
- Go to Databases tab
  - Create a new Group e.g. "offline"
  - Create a db in the new group
  - Create and copy a db token with write/read permissions

## Environment Variables

Rename the `.env.local.example` to `.env.local` and add your variables

EXPO_PUBLIC_TURSO_DB_URL=libsql://xxxx.aws-us-east-1.turso.io
EXPO_PUBLIC_TURSO_DB_AUTH_TOKEN=your_token_here

## Adding data in Turso
