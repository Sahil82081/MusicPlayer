# MusicPlayer — Aura Music

A premium, production-quality offline music player for Android and iOS built with React Native and Expo (SDK 58).

## Features

- **100% Offline**: Zero analytics, zero tracking, no backend required. All data stored locally in SQLite (`aura_music_v2.db`).
- **Universal Audio Playback**: High-fidelity playback for MP3, FLAC (Lossless Hi-Res), WAV, AAC, M4A, OGG, and OPUS.
- **Background & Lock Screen Controls**: Continuous playback when the app is in the background or the screen is locked, with system media notification and lock screen controls.
- **Local Library Organization**: Differential storage scanning and native document picker to import songs from any folder.
- **Search & Sort**: Real-time multi-field search across songs, artists, albums, and folders, with sorting by Name, Recently Added, Recently Played, Artist, and Album.
- **Playlists & Favorites**: Create, rename, delete custom playlists; instant favorite toggling with animated feedback; persistent recently played history.
- **Modern UI & Animations**: Dark glassmorphic aesthetic with fluid transitions, bottom sheet mini-player, full-screen player with gestures, and responsive track lists.

## Tech Stack

- **Framework**: React Native & Expo SDK 58 (Expo Router)
- **Audio Engine**: `expo-audio`
- **Database**: `expo-sqlite` (WAL mode, indexed queries)
- **Storage & Metadata**: Native MediaStore & DocumentPicker adapters
- **Animations**: `react-native-reanimated`

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

3. Scan the QR code using the **Expo Go** app on your phone.

4. To build a standalone Android APK:
   ```bash
   npx eas-cli build -p android --profile preview
   ```
