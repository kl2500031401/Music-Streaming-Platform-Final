import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { songs } from '../data/songs'
import { artists as defaultArtists } from '../data/artists'
import { loadState, saveState } from '../utils/storage'
import { loadMedia, saveMedia } from '../utils/mediaStorage'

const MusicContext = createContext(null)
const defaultAlbums = [...new Map(songs.map((song) => [song.album, {
  id: `album-${song.album.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  name: song.album, artist: song.artist, genre: song.genre, year: song.year,
  artwork: song.artwork, songIds: songs.filter((item) => item.album === song.album).map((item) => item.id),
}])).values()]
const defaultGenres = [...new Set([
  'Pop','Rock','Hip-Hop','Classical','Jazz','Electronic','Telugu','Hindi','English','Tamil',
  ...songs.map((song) => song.genre),
])]

export function MusicProvider({ children }) {
  const audioRef = useRef(null)
  const [librarySongs, setLibrarySongs] = useState(() => loadState('librarySongs', songs))
  const [libraryArtists, setLibraryArtists] = useState(() => loadState('libraryArtists', defaultArtists))
  const [albums, setAlbums] = useState(() => loadState('libraryAlbums', defaultAlbums))
  const [genres, setGenres] = useState(() => {
    const savedGenres = loadState('libraryGenres', defaultGenres)
    const savedSongs = loadState('librarySongs', songs)
    return [...new Set([...savedGenres, ...savedSongs.map((song) => song.genre).filter(Boolean)])]
  })
  const [currentSong, setCurrentSong] = useState(() => loadState('currentSong', null))
  const [queue, setQueue] = useState(() => loadState('queue', loadState('librarySongs', songs)))
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [repeat, setRepeat] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [favorites, setFavorites] = useState(() => loadState('favorites', []))
  const [playlists, setPlaylists] = useState(() => loadState('playlists', []))
  const [followedArtists, setFollowedArtists] = useState(() => loadState('followedArtists', []))
  const [recent, setRecent] = useState(() => loadState('recent', []))
  const [downloads, setDownloads] = useState(() => {
    const saved = loadState('downloads', {})
    return Object.fromEntries(Object.entries(saved).map(([id, value]) => [
      id,
      { title: value.title, artist: value.artist, localUrl: null },
    ]))
  })
  const [toast, setToast] = useState('')
  const [user, setUser] = useState(() => loadState('demoUser', null))
  const [demoUsers, setDemoUsers] = useState(() => loadState('demoUsers', []))
  const [playCounts, setPlayCounts] = useState(() => loadState('playCounts', {}))
  const [downloadsCount, setDownloadsCount] = useState(() => loadState('downloadsCount', 0))
  const [adminSession, setAdminSession] = useState(() => loadState('adminSession', false))
  const [adminSettings, setAdminSettings] = useState(() => loadState('adminSettings', { displayName: 'Wavely Admin', theme: 'dark', compactTables: false }))
  const notify = (message) => setToast(message)
  const initialMedia = useRef({ songs: librarySongs, artists: libraryArtists, albums })

  const persistLibrary = (nextSongs, nextArtists, nextAlbums, nextGenres) => {
    setLibrarySongs(nextSongs)
    setLibraryArtists(nextArtists)
    setAlbums(nextAlbums)
    setGenres(nextGenres)
    setQueue((old) => old.filter((queuedSong) => nextSongs.some((song) => song.id === queuedSong.id)).map((queuedSong) => {
      const updatedSong = nextSongs.find((song) => song.id === queuedSong.id)
      return queuedSong.audioUrl?.startsWith('blob:') ? { ...updatedSong, audioUrl: queuedSong.audioUrl } : updatedSong
    }))
    setCurrentSong((old) => {
      if (!old) return old
      const updatedSong = nextSongs.find((song) => song.id === old.id)
      return updatedSong ? { ...updatedSong, audioUrl: old.audioUrl?.startsWith('blob:') ? old.audioUrl : updatedSong.audioUrl } : null
    })
    saveState('librarySongs', nextSongs.map(({ artwork, audioUrl, ...song }) => ({
      ...song,
      artwork: song.artworkAssetId ? '' : artwork,
      audioUrl: song.audioAssetId ? '' : audioUrl,
    })))
    saveState('libraryArtists', nextArtists.map(({ image, ...artist }) => ({ ...artist, image: artist.imageAssetId ? '' : image })))
    saveState('libraryAlbums', nextAlbums.map(({ artwork, ...album }) => ({ ...album, artwork: album.artworkAssetId ? '' : artwork })))
    saveState('libraryGenres', nextGenres)
  }

  const prepareMedia = async (item, fileField, assetField, urlField) => {
    const file = item[fileField]
    if (!file) return item
    const asset = await saveMedia(file)
    return { ...item, [assetField]: asset.id, [urlField]: asset.url, [fileField]: undefined }
  }

  useEffect(() => {
    let active = true
    const hydrate = async () => {
      try {
        const [savedSongs, savedArtists, savedAlbums] = await Promise.all([
          Promise.all(initialMedia.current.songs.map(async (song) => ({
            ...song,
            artwork: song.artworkAssetId ? await loadMedia(song.artworkAssetId) : song.artwork,
            audioUrl: song.audioAssetId ? await loadMedia(song.audioAssetId) : song.audioUrl,
          }))),
          Promise.all(initialMedia.current.artists.map(async (artist) => ({
            ...artist, image: artist.imageAssetId ? await loadMedia(artist.imageAssetId) : artist.image,
          }))),
          Promise.all(initialMedia.current.albums.map(async (album) => ({
            ...album, artwork: album.artworkAssetId ? await loadMedia(album.artworkAssetId) : album.artwork,
          }))),
        ])
        if (active) {
          setLibrarySongs(savedSongs)
          setLibraryArtists(savedArtists)
          setAlbums(savedAlbums)
          setQueue((current) => current.map((song) => savedSongs.find((item) => item.id === song.id) || song))
          setCurrentSong((current) => current ? savedSongs.find((item) => item.id === current.id) || current : current)
        }
      } catch {
        if (active) notify('Could not load uploaded media from this browser.')
      }
    }
    hydrate()
    return () => { active = false }
  }, [])

  useEffect(() => saveState('favorites', favorites), [favorites])
  useEffect(() => saveState('playlists', playlists), [playlists])
  useEffect(() => saveState('followedArtists', followedArtists), [followedArtists])
  useEffect(() => saveState('recent', recent), [recent])
  useEffect(() => saveState('downloads', downloads), [downloads])
  useEffect(() => saveState('queue', queue), [queue])
  useEffect(() => saveState('currentSong', currentSong), [currentSong])
  useEffect(() => saveState('demoUser', user), [user])
  useEffect(() => saveState('demoUsers', demoUsers), [demoUsers])
  useEffect(() => saveState('playCounts', playCounts), [playCounts])
  useEffect(() => saveState('downloadsCount', downloadsCount), [downloadsCount])
  useEffect(() => saveState('adminSession', adminSession), [adminSession])
  useEffect(() => saveState('adminSettings', adminSettings), [adminSettings])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const playSong = async (song, newQueue) => {
    if (!song) return
    if (newQueue) setQueue(newQueue)
    setCurrentSong(song)
    setRecent((old) => [song.id, ...old.filter((id, index) => id !== song.id && !(index === 0 && id === old[0]))].slice(0, 30))
    setTimeout(async () => {
      if (!audioRef.current) return
      try {
        await audioRef.current.play()
        setIsPlaying(true)
      } catch {
        setIsPlaying(false)
        notify('Playback could not start. Tap play to try again.')
      }
    }, 50)
  }

  const togglePlay = async () => {
    if (!currentSong) {
      playSong(queue[0] || songs[0])
      return
    }
    if (isPlaying) audioRef.current?.pause()
    else {
      try {
        await audioRef.current?.play()
        setIsPlaying(true)
      } catch { notify('Unable to play this audio. Check your connection.') }
    }
  }

  const nextSong = () => {
    if (!queue.length) return
    const index = queue.findIndex((song) => song.id === currentSong?.id)
    const nextIndex = shuffle
      ? Math.floor(Math.random() * queue.length)
      : (index + 1) % queue.length
    playSong(queue[nextIndex])
  }

  const previousSong = () => {
    if (!queue.length) return
    const index = queue.findIndex((song) => song.id === currentSong?.id)
    playSong(queue[index <= 0 ? queue.length - 1 : index - 1])
  }

  const toggleFavorite = (id) => {
    setFavorites((old) => old.includes(id) ? old.filter((item) => item !== id) : [...old, id])
  }

  const toggleArtist = (id) => {
    setFollowedArtists((old) => old.includes(id) ? old.filter((item) => item !== id) : [...old, id])
  }

  const createPlaylist = (name) => {
    if (!name.trim()) return
    setPlaylists((old) => [...old, {
      id: `p${Date.now()}`, name: name.trim(), songIds: [],
      createdAt: new Date().toISOString(), ownerId: user?.email || 'local-device', ownerName: user?.name || 'Local device',
    }])
    notify('Playlist created')
  }

  const addToPlaylist = (playlistId, songId) => {
    setPlaylists((old) => old.map((playlist) =>
      playlist.id === playlistId && !playlist.songIds.includes(songId)
        ? { ...playlist, songIds: [...playlist.songIds, songId] }
        : playlist
    ))
    notify('Added to playlist')
  }

  const removeFromPlaylist = (playlistId, songId) => {
    setPlaylists((old) => old.map((playlist) =>
      playlist.id === playlistId ? { ...playlist, songIds: playlist.songIds.filter((id) => id !== songId) } : playlist
    ))
  }

  const renamePlaylist = (playlistId, name) => {
    if (!name.trim()) return
    setPlaylists((old) => old.map((playlist) => playlist.id === playlistId ? { ...playlist, name: name.trim() } : playlist))
  }

  const deletePlaylist = (playlistId) => setPlaylists((old) => old.filter((playlist) => playlist.id !== playlistId))

  const downloadSong = async (song) => {
    if (!song.audioUrl || !navigator.onLine) {
      notify('Download unavailable while offline')
      return
    }
    try {
      const response = await fetch(song.audioUrl)
      if (!response.ok) throw new Error('Audio unavailable')
      const blob = await response.blob()
      if (!blob.size) throw new Error('Empty audio file')
      const url = URL.createObjectURL(blob)
      setDownloads((old) => ({ ...old, [song.id]: { localUrl: url, title: song.title, artist: song.artist } }))
      setDownloadsCount((count) => count + 1)
      notify('Download saved locally')
    } catch {
      notify('Download failed. This file could not be saved.')
    }
  }

  const removeDownload = (songId) => setDownloads((old) => {
    if (old[songId]?.localUrl) URL.revokeObjectURL(old[songId].localUrl)
    const next = { ...old }
    delete next[songId]
    return next
  })

  const createSong = async (input) => {
    let song = {
      ...input, id: input.id || `song-${Date.now()}`, popularity: Number(input.popularity) || 0,
      artwork: input.artwork || librarySongs[0]?.artwork || '',
    }
    song = await prepareMedia(song, 'artworkFile', 'artworkAssetId', 'artwork')
    song = await prepareMedia(song, 'audioFile', 'audioAssetId', 'audioUrl')
    const nextSongs = [...librarySongs, song]
    let nextAlbums = albums
    if (song.album && song.album !== 'Single' && !albums.some((album) => album.name === song.album)) {
      nextAlbums = [...albums, { id: `album-${Date.now()}`, name: song.album, artist: song.artist, genre: song.genre, year: Number(song.year) || new Date().getFullYear(), artwork: song.artwork, songIds: [song.id] }]
    } else {
      nextAlbums = albums.map((album) => album.name === song.album ? { ...album, songIds: [...new Set([...album.songIds, song.id])] } : album)
    }
    persistLibrary(nextSongs, libraryArtists, nextAlbums, genres)
    notify('Song added to the library')
  }

  const updateSong = async (id, changes) => {
    let patch = { ...changes }
    patch = await prepareMedia(patch, 'artworkFile', 'artworkAssetId', 'artwork')
    patch = await prepareMedia(patch, 'audioFile', 'audioAssetId', 'audioUrl')
    const nextSongs = librarySongs.map((song) => song.id === id ? { ...song, ...patch } : song)
    const edited = nextSongs.find((song) => song.id === id)
    const nextAlbums = albums.map((album) => {
      const old = librarySongs.find((song) => song.id === id)
      const oldSongIds = album.songIds || []
      if (album.name === old?.album && edited?.album !== old.album) return { ...album, songIds: oldSongIds.filter((songId) => songId !== id) }
      if (album.name === edited?.album) return { ...album, songIds: [...new Set([...oldSongIds, id])] }
      return album
    })
    persistLibrary(nextSongs, libraryArtists, nextAlbums, genres)
    notify('Song updated')
  }

  const deleteSong = (id) => {
    persistLibrary(librarySongs.filter((song) => song.id !== id), libraryArtists,
      albums.map((album) => ({ ...album, songIds: (album.songIds || []).filter((songId) => songId !== id) })), genres)
    setFavorites((old) => old.filter((songId) => songId !== id))
    setRecent((old) => old.filter((songId) => songId !== id))
    setPlaylists((old) => old.map((playlist) => ({ ...playlist, songIds: playlist.songIds.filter((songId) => songId !== id) })))
    setQueue((old) => old.filter((song) => song.id !== id))
    setCurrentSong((old) => old?.id === id ? null : old)
    notify('Song deleted')
  }

  const createAlbum = async (input) => {
    let album = {
      ...input, id: input.id || `album-${Date.now()}`, songIds: input.songIds || [],
      artwork: input.artwork || librarySongs[0]?.artwork || '',
    }
    album = await prepareMedia(album, 'artworkFile', 'artworkAssetId', 'artwork')
    const assigned = new Set(album.songIds)
    const nextSongs = librarySongs.map((song) => assigned.has(song.id)
      ? { ...song, album: album.name, artist: album.artist, genre: album.genre, year: album.year, artwork: album.artwork, artworkAssetId: album.artworkAssetId }
      : song)
    const nextAlbums = albums.map((item) => ({ ...item, songIds: (item.songIds || []).filter((id) => !assigned.has(id)) }))
    persistLibrary(nextSongs, libraryArtists, [...nextAlbums, album], genres)
    notify('Album created')
  }

  const updateAlbum = async (id, changes) => {
    let patch = await prepareMedia({ ...changes }, 'artworkFile', 'artworkAssetId', 'artwork')
    const existing = albums.find((album) => album.id === id)
    const updated = { ...existing, ...patch }
    const oldIds = new Set(existing.songIds || [])
    const selectedIds = new Set(updated.songIds || [])
    const nextAlbums = albums.map((album) => album.id === id
      ? updated
      : { ...album, songIds: (album.songIds || []).filter((songId) => !selectedIds.has(songId)) })
    const nextSongs = librarySongs.map((song) => {
      if (selectedIds.has(song.id)) return { ...song, album: updated.name, artist: updated.artist, genre: updated.genre, year: updated.year, artwork: updated.artwork, artworkAssetId: updated.artworkAssetId }
      if (oldIds.has(song.id)) return { ...song, album: 'Single' }
      return song
    })
    persistLibrary(nextSongs, libraryArtists, nextAlbums, genres)
    notify('Album updated')
  }

  const deleteAlbum = (id) => {
    const target = albums.find((album) => album.id === id)
    persistLibrary(librarySongs.map((song) => song.album === target?.name ? { ...song, album: 'Single' } : song),
      libraryArtists, albums.filter((album) => album.id !== id), genres)
    notify('Album deleted')
  }

  const createArtist = async (input) => {
    let artist = {
      ...input, id: input.id || `artist-${Date.now()}`, monthlyListeners: input.monthlyListeners || 'New artist',
      image: input.image || libraryArtists[0]?.image || '',
    }
    artist = await prepareMedia(artist, 'imageFile', 'imageAssetId', 'image')
    const assigned = new Set(artist.songIds || [])
    const nextSongs = librarySongs.map((song) => assigned.has(song.id) ? { ...song, artist: artist.name, genre: artist.genre } : song)
    const nextAlbums = albums.map((album) => (album.songIds || []).some((id) => assigned.has(id)) ? { ...album, artist: artist.name } : album)
    persistLibrary(nextSongs, [...libraryArtists, artist], nextAlbums, genres)
    notify('Artist added')
  }

  const updateArtist = async (id, changes) => {
    const patch = await prepareMedia({ ...changes }, 'imageFile', 'imageAssetId', 'image')
    const old = libraryArtists.find((artist) => artist.id === id)
    const updated = { ...old, ...patch }
    const assigned = new Set(updated.songIds || [])
    const nextSongs = librarySongs.map((song) => assigned.has(song.id) || song.artist === old?.name
      ? { ...song, artist: updated.name, genre: updated.genre }
      : song)
    persistLibrary(nextSongs,
      libraryArtists.map((artist) => artist.id === id ? updated : artist),
      albums.map((album) => album.artist === old?.name || (album.songIds || []).some((songId) => assigned.has(songId))
        ? { ...album, artist: updated.name }
        : album), genres)
    notify('Artist updated')
  }

  const deleteArtist = (id) => {
    persistLibrary(librarySongs, libraryArtists.filter((artist) => artist.id !== id), albums, genres)
    setFollowedArtists((old) => old.filter((artistId) => artistId !== id))
    notify('Artist removed')
  }

  const createGenre = (name) => {
    const normalized = name.trim()
    if (!normalized || genres.some((genre) => genre.toLowerCase() === normalized.toLowerCase())) return false
    persistLibrary(librarySongs, libraryArtists, albums, [...genres, normalized])
    notify('Genre added')
    return true
  }

  const renameGenre = (oldName, newName) => {
    const normalized = newName.trim()
    if (!normalized || genres.some((genre) => genre.toLowerCase() === normalized.toLowerCase() && genre !== oldName)) return false
    persistLibrary(librarySongs.map((song) => song.genre === oldName ? { ...song, genre: normalized } : song),
      libraryArtists.map((artist) => artist.genre === oldName ? { ...artist, genre: normalized } : artist),
      albums.map((album) => album.genre === oldName ? { ...album, genre: normalized } : album),
      genres.map((genre) => genre === oldName ? normalized : genre))
    notify('Genre updated')
    return true
  }

  const deleteGenre = (name) => {
    const hasAssignments = librarySongs.some((song) => song.genre === name)
      || libraryArtists.some((artist) => artist.genre === name)
      || albums.some((album) => album.genre === name)
    if (name === 'Other' && hasAssignments) {
      notify('Other cannot be removed while records are assigned to it.')
      return
    }
    const remainingGenres = genres.filter((genre) => genre !== name)
    if (hasAssignments && !remainingGenres.includes('Other')) remainingGenres.push('Other')
    persistLibrary(librarySongs.map((song) => song.genre === name ? { ...song, genre: 'Other' } : song),
      libraryArtists.map((artist) => artist.genre === name ? { ...artist, genre: 'Other' } : artist),
      albums.map((album) => album.genre === name ? { ...album, genre: 'Other' } : album),
      remainingGenres)
    notify('Genre deleted; assigned tracks were moved to Other')
  }

  const registerDemoUser = (newUser) => {
    const entry = { id: `user-${Date.now()}`, name: newUser.name, email: newUser.email, registeredAt: new Date().toISOString(), status: 'Active' }
    if (demoUsers.some((item) => item.email.toLowerCase() === entry.email.toLowerCase())) return false
    setDemoUsers((old) => [...old, entry])
    return entry
  }

  const isDemoUserDisabled = (email) => demoUsers.some((item) => item.email.toLowerCase() === email.toLowerCase() && item.status === 'Disabled')
  const updateDemoUser = (id, changes) => {
    const target = demoUsers.find((item) => item.id === id)
    if (changes.status === 'Disabled' && target?.email === user?.email) setUser(null)
    setDemoUsers((old) => old.map((item) => item.id === id ? { ...item, ...changes } : item))
  }
  const deleteDemoUser = (id) => {
    const target = demoUsers.find((item) => item.id === id)
    if (target?.email === user?.email) setUser(null)
    setPlaylists((old) => old.filter((playlist) => playlist.ownerId !== target?.email && playlist.ownerId !== id))
    setDemoUsers((old) => old.filter((item) => item.id !== id))
  }

  const recordPlay = (songId) => setPlayCounts((counts) => ({ ...counts, [songId]: (counts[songId] || 0) + 1 }))

  const value = {
    songs: librarySongs, artists: libraryArtists, albums, genres, createSong, updateSong, deleteSong,
    createAlbum, updateAlbum, deleteAlbum, createArtist, updateArtist, deleteArtist, createGenre, renameGenre, deleteGenre,
    demoUsers, registerDemoUser, isDemoUserDisabled, updateDemoUser, deleteDemoUser, playCounts, recordPlay, downloadsCount, adminSession, setAdminSession, adminSettings, setAdminSettings,
    audioRef, currentSong, queue, setQueue, isPlaying, setIsPlaying, progress, setProgress,
    duration, setDuration, volume, setVolume, repeat, setRepeat, shuffle, setShuffle,
    favorites, toggleFavorite, playlists, createPlaylist, addToPlaylist, removeFromPlaylist,
    renamePlaylist, deletePlaylist, followedArtists, toggleArtist, recent, downloads,
    downloadSong, removeDownload, playSong, togglePlay, nextSong, previousSong, toast, notify,
    user, setUser,
  }

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>
}

export function useMusic() {
  const context = useContext(MusicContext)
  if (!context) throw new Error('useMusic must be used inside MusicProvider')
  return context
}
