# Forsyth Business

React Native / Expo iPhone beta using the approved v18 prototype as its reference.

## Build

Use Expo Launch with the correction branch after review. Reuse the existing Expo account and Apple listing.

- Bundle ID: com.johnforsyth.forsythbusiness
- App Store Connect ID: 6817920131

## Development and verification

```sh
npm ci
node tests/data.test.mjs
npx expo start
npx expo export --platform ios
```

The first-run workspace is empty. Personal contact, registration and financial details belong in the app, not this public repository. Existing local records use the same storage key as the installed beta.

Cloud sign-in, optional automatic backup, manual restore, selected phone-contact import, v18 data import, native PDF sharing and file exports are implemented. See docs/VALIDATION.md for tested behavior and device checks still required. Automatic backup is one-way; assistant and banking integrations are unfinished. No replacement has been uploaded to TestFlight from this branch yet.

Assistant-created drafts now have an owner-only cloud inbox and automatic native delivery on sign-in, app foreground and 30-second checks while active. The ChatGPT-side action uses the connected Supabase tools (see docs/ASSISTANT_DRAFTS.md). Updating the phone and signing into the matching app account are required. A queued draft is not yet a confirmed phone receipt. This feature does not email or text customers and is separate from full-state cloud backup.
