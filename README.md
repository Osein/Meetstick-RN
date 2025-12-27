# Meetstick Expo (React Native)

This folder contains a local Expo app that mirrors the Android Compose flows: onboarding, phone login + OTP, registration steps, dashboard, category/event browsing, event details, people profiles, profile settings (notifications, location radius, agreements, contact us, delete account), and the new meeting creation wizard with mock data.

## Getting started

```bash
cd react
npm install
npm start -- --offline
```

The `--offline` flag keeps everything local (no Expo cloud). You can also run `npm run android` or `npm run ios` for native builds.

## Notes

- Data is mocked in `src/data/mockData.ts`, matching the Compose samples.
- Navigation is driven from `AppNavigator` with stack + bottom tabs; the center tab opens the new-meeting wizard.
- Assets (`assets/*.png`) are placeholders—replace them with your own branding as needed.
