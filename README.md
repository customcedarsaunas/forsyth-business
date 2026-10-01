# Forsyth Business

React Native / Expo iPhone beta for estimates, invoices, expenses, jobs, and mileage.

## TestFlight setup

Use Expo Launch with this public repository. Connect your Expo account and select your existing Apple app.

- iOS Bundle ID: `com.johnforsyth.forsythbusiness`
- App Store Connect app ID: `6817920131`
- App version: `1.0.0`

## Development

```sh
npm ci
npx expo start
```

## Beta status

The first-run workspace is empty. Enter your business contact and tax details and rates in settings. Customer data and financial records are stored locally on the device and are not committed to this repository.

Assistant and banking connections are unfinished. Cloud synchronization and phone contacts import are not implemented. JavaScript iOS bundling passed; native signing, device testing, and TestFlight upload are still pending.
