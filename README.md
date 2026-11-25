# Wavely Music Streaming Platform

A responsive React music streaming demo built with Vite.

## Start

```powershell
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

## Build

```powershell
npm run build
npm run preview
```

## Features

- Search, explore, albums, artists, playlists, favorites, downloads, profile, and demo authentication
- Persistent bottom player with play, pause, previous, next, seek, volume, shuffle, repeat, and queue support
- LocalStorage persistence for demo users, playlists, favorites, followed artists, recent songs, and preferences
- Session downloads that fetch and save audio as local Blob URLs
- Download metadata persistence; after a refresh, a song must be downloaded again because browser Blob URLs are session-only
- Playlist sharing through Web Share API or copied share links
- Separate admin dashboard at `/admin/login` with protected library, users, playlist, analytics, and settings views
- Admin catalog edits update the same shared music data used by the user-facing pages
- Uploaded admin artwork/audio is stored in IndexedDB; catalog metadata and admin preferences are stored in LocalStorage
- Responsive desktop, tablet, and mobile layouts

## Demo authentication

Registration and login are local demonstrations only. Passwords are validated but not stored. Do not enter real passwords or sensitive information. LocalStorage authentication is not secure.

Admin demo credentials:

- Email: `admin@music.com`
- Password: `Admin123`

Admin sessions, the demo admin password changed in Settings, and catalog data are stored in LocalStorage. This is only a student-project demonstration, not production authentication or authorization. The Users page only lists accounts registered through the demo registration form; it never stores or displays passwords. Analytics are device-local: playback counts are recorded by this browser, and download totals reflect successful downloads here.

## Replacing demo songs

Edit `src/data/songs.js`. Each song supports an `id`, `title`, `artist`, `album`, `genre`, `duration`, `year`, `popularity`, `artwork`, and `audioUrl`.

For a local track, place the audio file in `public/audio/` and set `audioUrl` to `/audio/your-track.mp3`. Use only audio you have permission to distribute. Unsplash artwork URLs and SoundHelix demo tracks are used for presentation and testing.

Browser audio and download availability depend on the source server and network/CORS support. Media files uploaded from the Admin Dashboard are stored in IndexedDB on that browser; they are not synchronized to other devices or a server.
