# Firestore Security Rules

The file `firestore.rules` in this directory must be deployed to Firebase
before the SOS realtime status listener on the frontend will work.

Without these rules, the frontend's Firestore `onSnapshot` call in
`lib/firebase/firestore-listeners.ts` will be rejected with a
`permission-denied` error because Firestore defaults to denying all reads.

## Deploy the rules

### Option 1 — Firebase Console (quickest for a hackathon)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click **Firestore Database** in the left sidebar
4. Click the **Rules** tab
5. Replace the contents with the rules from `firestore.rules`
6. Click **Publish**

### Option 2 — Firebase CLI

```bash
# Install the CLI if you don't have it
npm install -g firebase-tools

# Login
firebase login

# In the disaster-os-backend directory:
firebase deploy --only firestore:rules
```

## What the rules do

- `sos_requests/{sosId}`: users can READ their own SOS documents
  (needed for the frontend onSnapshot listener — `request.auth.uid == resource.data.uid`)
- All WRITES are denied — the backend uses the Admin SDK which bypasses
  Security Rules entirely, so no client can write directly
- Everything else is denied by default

## When to update rules

If you add more Firestore collections (e.g. emergency kit items persisted
to Firestore in a future feature), add matching rules here and redeploy.
Never open up writes from the client — always route mutations through
the backend's Admin SDK where you can enforce business logic.
