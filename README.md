# StreamDock TV

A ready-to-run IPTV-style streaming hub demo for Web/Laptop, designed to be adapted for Android TV and Amazon Fire TV.

## Features
- Live TV, Movies, Series sections
- M3U/M3U8 file upload
- M3U link loading where browser CORS allows it
- HLS player support via hls.js
- Favorites saved in localStorage
- Responsive layout for laptop and TV-style screens
- Original UI, not copied from other IPTV apps

## Run locally
```bash
npm install
npm run dev
```

Open the URL shown in the terminal.

## Build
```bash
npm run build
npm run preview
```

## Important legal note
This app is a player interface. Do not host or distribute copyrighted channels, movies, or series without permission.

## Next production steps
- Add backend proxy for reading M3U links reliably
- Add login and cloud sync
- Add EPG database
- Build Android TV APK with Capacitor or React Native TV
- Add payment system and ads
