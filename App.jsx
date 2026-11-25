import { useMemo, useState } from 'react'
import { NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { useMusic } from './context/MusicContext'
import AdminModule from './Admin'
import './styles.css'

const icons = {
  home: '⌂', search: '⌕', explore: '◉', albums: '▦', artists: '♬', playlists: '≡', admin: '⚙',
  favorites: '♥', downloads: '↓', profile: '●', logout: '↪', plus: '+', share: '↗',
  play: '▶', pause: 'Ⅱ', prev: '‹', next: '›', volume: '♪', shuffle: '⇄', repeat: '↻',
}

function Sidebar() {
  const { setUser, notify, adminSession } = useMusic()
  const navigate = useNavigate()
  const links = [
    ['/', 'home', 'Home'], ['/search', 'search', 'Search'], ['/explore', 'explore', 'Explore'],
    ['/albums', 'albums', 'Albums'], ['/artists', 'artists', 'Artists'], ['/playlists', 'playlists', 'My Playlists'],
    ['/favorites', 'favorites', 'Favorites'], ['/downloads', 'downloads', 'Downloads'], ['/profile', 'profile', 'Profile'],
  ]
  const logout = () => {
    setUser(null)
    notify('Logged out')
    navigate('/login')
  }
  return (
    <aside className="sidebar">
      <NavLink to="/" className="brand"><span className="brand-mark">W</span><span>WAVELY</span></NavLink>
      <nav>
        {links.map(([path, icon, label]) => (
          <NavLink key={path} to={path} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{icons[icon]}</span><span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <NavLink aria-label="Admin" title="Admin dashboard" to={adminSession ? '/admin/dashboard' : '/admin/login'} className={({ isActive }) => `nav-item admin-entry ${isActive ? 'active' : ''}`}>
        <span className="nav-icon">{icons.admin}</span><span>Admin</span>
      </NavLink>
      <button className="nav-item logout" onClick={logout}><span className="nav-icon">{icons.logout}</span><span>Log out</span></button>
    </aside>
  )
}

function Navbar({ title }) {
  const navigate = useNavigate()
  const { user } = useMusic()
  return (
    <header className="topbar">
      <h1>{title}</h1>
      <button className="profile-chip" onClick={() => navigate('/profile')}>
        <span className="avatar">{user?.name?.[0]?.toUpperCase() || 'G'}</span>
        <span>{user?.name || 'Guest'}</span>
      </button>
    </header>
  )
}

function SongCard({ song, compact = false }) {
  const { favorites, toggleFavorite, playSong, queue, downloads } = useMusic()
  const favorite = favorites.includes(song.id)
  return (
    <article className={`song-card ${compact ? 'compact' : ''}`}>
      <button className="artwork-button" onClick={() => playSong(song, downloads[song.id]?.localUrl ? [ { ...song, audioUrl: downloads[song.id].localUrl }, ...queue.filter((item) => item.id !== song.id) ] : queue)} aria-label={`Play ${song.title}`}>
        <img src={song.artwork} alt="" onError={(event) => { event.currentTarget.src = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600' }} />
        <span className="card-play">{icons.play}</span>
      </button>
      <div className="song-info">
        <strong>{song.title}</strong>
        <span>{song.artist}</span>
      </div>
      <button className={`heart ${favorite ? 'selected' : ''}`} onClick={() => toggleFavorite(song.id)} aria-label="Toggle favorite">{icons.favorites}</button>
    </article>
  )
}

function Section({ title, children, action }) {
  return <section className="section"><div className="section-heading"><h2>{title}</h2>{action}</div>{children}</section>
}

function Home() {
  const { songs: allSongs, artists, recent, favorites } = useMusic()
  const recentSongs = recent.map((id) => allSongs.find((song) => song.id === id)).filter(Boolean)
  const favoriteGenres = [...new Set(favorites.map((id) => allSongs.find((song) => song.id === id)?.genre).filter(Boolean))]
  const recommended = allSongs.filter((song) => favoriteGenres.includes(song.genre)).slice(0, 6)
  const recommendationFallback = recommended.length ? recommended : allSongs.slice(0, 6)
  return (
    <>
      <Navbar title="Good afternoon" />
      <main className="content">
        <section className="hero-banner">
          <div><span className="eyebrow">Made for you</span><h2>Discover your next favorite</h2><p>Fresh tracks, timeless classics, and sounds picked for you.</p></div>
          <button className="primary" onClick={() => document.querySelector('.song-card')?.querySelector('button')?.click()}>{icons.play} Play mix</button>
        </section>
        {recentSongs.length > 0 && <Section title="Recently played"><div className="card-grid">{recentSongs.slice(0, 6).map((song) => <SongCard key={song.id} song={song}/>)}</div></Section>}
        <Section title="Recommended for you"><div className="card-grid">{recommendationFallback.map((song) => <SongCard key={song.id} song={song}/>)}</div></Section>
        <Section title="Popular right now"><div className="card-grid">{allSongs.slice().sort((a,b) => b.popularity-a.popularity).slice(0,8).map((song) => <SongCard key={song.id} song={song}/>)}</div></Section>
        <Section title="Trending artists"><div className="artist-grid">{artists.slice(0,5).map((artist) => <ArtistCard key={artist.id} artist={artist}/>)}</div></Section>
      </main>
    </>
  )
}

function Search() {
  const [query, setQuery] = useState('')
  const { songs: allSongs } = useMusic()
  const results = useMemo(() => allSongs.filter((song) =>
    `${song.title} ${song.artist} ${song.album} ${song.genre}`.toLowerCase().includes(query.toLowerCase())
  ), [query, allSongs])
  return (
    <>
      <Navbar title="Search" />
      <main className="content">
        <label className="search-box"><span>{icons.search}</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search songs, artists, albums or genres" /></label>
        <Section title={query ? `Results for “${query}”` : 'Browse all music'}>
          {results.length ? <div className="card-grid">{results.map((song) => <SongCard key={song.id} song={song}/>)}</div> :
            <div className="empty"><span>{icons.search}</span><h3>No matches found</h3><p>Try another song, artist, album or genre.</p></div>}
        </Section>
      </main>
    </>
  )
}

function Explore() {
  const [genre, setGenre] = useState('Pop')
  const { songs: allSongs, genres } = useMusic()
  const filtered = allSongs.filter((song) => song.genre === genre)
  return (
    <>
      <Navbar title="Explore" />
      <main className="content">
        <Section title="Genres"><div className="genre-grid">{genres.map((item, index) => <button key={item} onClick={() => setGenre(item)} className={`genre-card genre-${index % 5} ${genre === item ? 'selected' : ''}`}><strong>{item}</strong><span>{allSongs.filter((song) => song.genre === item).length} tracks</span></button>)}</div></Section>
        <Section title={`${genre} music`}><div className="card-grid">{filtered.length ? filtered.map((song) => <SongCard key={song.id} song={song}/>) : <div className="empty"><h3>No tracks in this genre yet</h3></div>}</div></Section>
      </main>
    </>
  )
}

function ArtistCard({ artist }) {
  const { followedArtists, toggleArtist } = useMusic()
  const followed = followedArtists.includes(artist.id)
  return (
    <article className="artist-card">
      <NavLink to={`/artists/${artist.id}`}><img src={artist.image} alt={artist.name}/><strong>{artist.name}</strong><span>{artist.monthlyListeners} listeners</span></NavLink>
      <button className={followed ? 'following' : 'outline'} onClick={() => toggleArtist(artist.id)}>{followed ? 'Following' : 'Follow'}</button>
    </article>
  )
}

function Artists() {
  const { artists } = useMusic()
  return <><Navbar title="Artists"/><main className="content"><Section title="Popular artists"><div className="artist-grid">{artists.map((artist) => <ArtistCard key={artist.id} artist={artist}/>)}</div></Section></main></>
}

function ArtistDetails() {
  const { id } = useParams()
  const { songs: allSongs, artists, followedArtists, toggleArtist } = useMusic()
  const artist = artists.find((item) => item.id === id) || artists[0]
  if (!artist) return <><Navbar title="Artist"/><main className="content"><div className="empty"><h3>Artist not found</h3></div></main></>
  const artistSongs = allSongs.filter((song) => song.artist === artist.name)
  return <><Navbar title="Artist"/><main className="content"><section className="artist-hero"><img src={artist.image} alt={artist.name}/><div><span>Verified artist</span><h2>{artist.name}</h2><p>{artist.monthlyListeners} monthly listeners</p>{artist.biography && <p>{artist.biography}</p>}<button className={followedArtists.includes(artist.id) ? 'following' : 'primary'} onClick={() => toggleArtist(artist.id)}>{followedArtists.includes(artist.id) ? 'Following' : 'Follow'}</button></div></section><Section title="Songs"><div className="card-grid">{artistSongs.length ? artistSongs.map((song) => <SongCard key={song.id} song={song}/>) : <div className="empty"><h3>No songs available</h3></div>}</div></Section></main></>
}

function Albums() {
  const { songs: allSongs, albums, playSong } = useMusic()
  return <><Navbar title="Albums"/><main className="content"><Section title="Featured albums"><div className="album-grid">{albums.map((album) => { const albumSongs = allSongs.filter((song) => (album.songIds || []).includes(song.id)); return <article className="album-card" key={album.id}><img src={album.artwork} alt={album.name}/><div><strong>{album.name}</strong><span>{album.artist} · {album.year}</span></div><button className="round-play" disabled={!albumSongs.length} onClick={() => playSong(albumSongs[0], albumSongs)}>{icons.play}</button></article>})}</div></Section></main></>
}

function Playlists() {
  const { songs, playlists, createPlaylist, renamePlaylist, deletePlaylist, playSong, favorites, addToPlaylist } = useMusic()
  const [name, setName] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const navigate = useNavigate()
  const handleCreate = (event) => { event.preventDefault(); if (name.trim()) { createPlaylist(name); setName(''); setShowCreate(false) } }
  return <>
    <Navbar title="My Playlists"/>
    <main className="content">
      <Section title="Your playlists" action={<button className="primary" onClick={() => setShowCreate(true)}>{icons.plus} Create playlist</button>}>
        {playlists.length ? <div className="playlist-grid">{playlists.map((playlist) => {
          const tracks = playlist.songIds.map((id) => songs.find((song) => song.id === id)).filter(Boolean)
          return <article className="playlist-card" key={playlist.id}><div className="playlist-cover">{tracks[0] ? <img src={tracks[0].artwork} alt=""/> : <span>{icons.playlists}</span>}</div><strong>{playlist.name}</strong><span>{tracks.length} songs</span><div className="card-actions"><button onClick={() => navigate(`/playlists/${playlist.id}`)}>Open</button>{tracks.length > 0 && <button onClick={() => playSong(tracks[0], tracks)}>Play</button>}<button onClick={() => { const next = prompt('Rename playlist', playlist.name); if (next) renamePlaylist(playlist.id, next) }}>Rename</button><button onClick={() => { if (window.confirm(`Delete “${playlist.name}”?`)) deletePlaylist(playlist.id) }}>Delete</button></div></article>
        })}</div> : <div className="empty"><span>{icons.playlists}</span><h3>No playlists yet</h3><p>Create one and add your favorite tracks.</p></div>}
      </Section>
      {favorites.length > 0 && <Section title="Add favorites to a playlist"><div className="card-grid">{favorites.map((id) => songs.find((song) => song.id === id)).filter(Boolean).map((song) => <div key={song.id}><SongCard song={song}/>{playlists.length > 0 && <select className="playlist-select" defaultValue="" onChange={(event) => { if (event.target.value) { addToPlaylist(event.target.value, song.id); event.target.value = '' } }}><option value="" disabled>Add to…</option>{playlists.map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}</select>}</div>)}</div></Section>}
    </main>
    {showCreate && <div className="modal-backdrop" onMouseDown={() => setShowCreate(false)}><form className="modal" onSubmit={handleCreate} onMouseDown={(event) => event.stopPropagation()}><h2>Create playlist</h2><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Playlist name" required/><div className="modal-actions"><button type="button" className="outline" onClick={() => setShowCreate(false)}>Cancel</button><button className="primary" type="submit">Create</button></div></form></div>}
  </>
}

function PlaylistDetails() {
  const { id } = useParams()
  const { songs, playlists, removeFromPlaylist, playSong, notify } = useMusic()
  const playlist = playlists.find((item) => item.id === id)
  if (!playlist) return <><Navbar title="Playlist"/><main className="content"><div className="empty"><h3>Playlist not found</h3></div></main></>
  const tracks = playlist.songIds.map((songId) => songs.find((song) => song.id === songId)).filter(Boolean)
  const share = async () => {
    const url = `${window.location.origin}/playlists/${playlist.id}`
    const data = { title: playlist.name, text: `Listen to ${playlist.name} on WAVELY`, url }
    try {
      if (navigator.share) await navigator.share(data)
      else {
        await navigator.clipboard.writeText(url)
        notify('Share link copied')
      }
    } catch {
      notify('Sharing cancelled')
    }
  }
  return <><Navbar title={playlist.name}/><main className="content"><section className="playlist-hero"><div className="playlist-cover large">{tracks[0] ? <img src={tracks[0].artwork} alt=""/> : <span>{icons.playlists}</span>}</div><div><span>Playlist</span><h2>{playlist.name}</h2><p>{tracks.length} songs</p><div className="hero-actions">{tracks.length > 0 && <button className="primary" onClick={() => playSong(tracks[0], tracks)}>{icons.play} Play all</button>}<button className="outline" onClick={share}>{icons.share} Share</button></div></div></section><Section title="Tracks">{tracks.length ? <div className="track-list">{tracks.map((song, index) => <div className="track-row" key={song.id}><span className="track-number">{index + 1}</span><img src={song.artwork} alt=""/><button className="track-name" onClick={() => playSong(song, tracks)}><strong>{song.title}</strong><span>{song.artist}</span></button><span>{song.album}</span><span>{song.duration}</span><button className="icon-button" onClick={() => removeFromPlaylist(playlist.id, song.id)}>×</button></div>)}</div> : <div className="empty"><h3>This playlist is empty</h3><p>Add songs from the Favorites or Songs views.</p></div>}</Section></main></>
}

function Favorites() {
  const { songs, favorites } = useMusic()
  const favoriteSongs = favorites.map((id) => songs.find((song) => song.id === id)).filter(Boolean)
  return <><Navbar title="Favorites"/><main className="content"><Section title="Liked songs">{favoriteSongs.length ? <div className="track-list">{favoriteSongs.map((song, index) => <div className="track-row" key={song.id}><span className="track-number">{index + 1}</span><img src={song.artwork} alt=""/><SongCard song={song} compact/><span>{song.album}</span><span>{song.duration}</span></div>)}</div> : <div className="empty"><span>{icons.favorites}</span><h3>No favorites yet</h3><p>Tap the heart on any song to save it here.</p></div>}</Section></main></>
}

function Downloads() {
  const { songs, downloads, downloadSong, removeDownload, playSong } = useMusic()
  return <><Navbar title="Downloads"/><main className="content"><Section title="Available songs"><div className="track-list">{songs.map((song, index) => {
    const download = downloads[song.id]
    return <div className="track-row" key={song.id}><span className="track-number">{index + 1}</span><img src={song.artwork} alt=""/><button className="track-name" onClick={() => download?.localUrl ? playSong({ ...song, audioUrl: download.localUrl }, songs) : downloadSong(song)}><strong>{song.title}</strong><span>{song.artist}</span></button><span>{song.album}</span>{download?.localUrl ? <button className="outline" onClick={() => removeDownload(song.id)}>Remove</button> : <button className="outline" onClick={() => downloadSong(song)}>{icons.downloads} Download</button>}</div>
  })}</div></Section>{!navigator.onLine && <div className="offline-banner">You are offline. Only songs successfully saved in this session can play locally.</div>}</main></>
}

function Profile() {
  const { user, setUser, favorites, playlists, followedArtists } = useMusic()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || 'Guest Listener')
  const save = (event) => { event.preventDefault(); setUser({ ...(user || {}), name: name.trim() || 'Guest Listener' }); setEditing(false) }
  return <><Navbar title="Profile"/><main className="content"><section className="profile-card"><div className="profile-avatar">{(user?.name || 'G')[0].toUpperCase()}</div><div><span>Music lover</span><h2>{user?.name || 'Guest Listener'}</h2><p>{user?.email || 'Demo local profile'}</p></div><button className="outline" onClick={() => setEditing(true)}>Edit profile</button></section><div className="stats-grid"><article><strong>{favorites.length}</strong><span>Favorite songs</span></article><article><strong>{playlists.length}</strong><span>Playlists</span></article><article><strong>{followedArtists.length}</strong><span>Followed artists</span></article></div><button className="outline" onClick={() => { setUser(null); navigate('/login') }}>Log out</button>{editing && <div className="modal-backdrop" onMouseDown={() => setEditing(false)}><form className="modal" onSubmit={save} onMouseDown={(event) => event.stopPropagation()}><h2>Edit profile</h2><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Display name"/><div className="modal-actions"><button type="button" className="outline" onClick={() => setEditing(false)}>Cancel</button><button className="primary">Save</button></div></form></div>}</main></>
}

function AuthPage({ register = false }) {
  const { setUser, notify, registerDemoUser, isDemoUserDisabled } = useMusic()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const submit = (event) => {
    event.preventDefault()
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (register && form.name.trim().length < 2) return setError('Enter a username with at least 2 characters.')
    if (!emailPattern.test(form.email)) return setError('Enter a valid email address.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    if (!register && isDemoUserDisabled(form.email)) return setError('This demo account has been disabled. Contact an administrator.')
    const newUser = register ? { name: form.name.trim(), email: form.email } : { name: form.email.split('@')[0], email: form.email }
    if (register && !registerDemoUser(newUser)) return setError('An account with this email is already registered.')
    setUser(newUser)
    notify(register ? 'Account created' : 'Welcome back')
    navigate('/')
  }
  return <main className="auth-page"><form className="auth-card" onSubmit={submit}><NavLink to="/" className="brand"><span className="brand-mark">W</span><span>WAVELY</span></NavLink><h1>{register ? 'Create account' : 'Welcome back'}</h1><p>{register ? 'Start your listening journey.' : 'Sign in to continue to your music.'}</p>{register && <label>Username<input value={form.name} onChange={(event) => setForm({...form, name: event.target.value})} required/></label>}<label>Email<input type="email" value={form.email} onChange={(event) => setForm({...form, email: event.target.value})} required/></label><label>Password<input type="password" value={form.password} onChange={(event) => setForm({...form, password: event.target.value})} required/></label>{error && <div className="form-error">{error}</div>}<button className="primary" type="submit">{register ? 'Create account' : 'Log in'}</button><span className="auth-switch">{register ? 'Already have an account?' : 'New to WAVELY?' } <NavLink to={register ? '/login' : '/register'}>{register ? 'Log in' : 'Create account'}</NavLink></span><small>Demo authentication uses LocalStorage and is not secure.</small></form></main>
}

function MusicPlayer() {
  const {
    audioRef, currentSong, isPlaying, setIsPlaying, progress, setProgress, duration, setDuration,
    volume, setVolume, repeat, setRepeat, shuffle, setShuffle, togglePlay, nextSong, previousSong, recordPlay,
  } = useMusic()
  const onTimeUpdate = () => {
    const audio = audioRef.current
    if (audio) { setProgress(audio.currentTime); setDuration(audio.duration || 0) }
  }
  const seek = (event) => {
    const nextProgress = Number(event.target.value)
    if (audioRef.current) audioRef.current.currentTime = nextProgress
    setProgress(nextProgress)
  }
  if (!currentSong) return null
  return <div className="music-player"><audio ref={audioRef} src={currentSong.audioUrl} onTimeUpdate={onTimeUpdate} onLoadedMetadata={onTimeUpdate} onPlay={() => { setIsPlaying(true); recordPlay(currentSong.id) }} onPause={() => setIsPlaying(false)} onEnded={() => repeat ? (audioRef.current.currentTime = 0, audioRef.current.play()) : nextSong()} onError={() => setIsPlaying(false)}/><div className="now-playing"><img src={currentSong.artwork} alt=""/><div><strong>{currentSong.title}</strong><span>{currentSong.artist}</span></div></div><div className="player-center"><div className="player-controls"><button onClick={() => setShuffle(!shuffle)} className={shuffle ? 'selected' : ''}>{icons.shuffle}</button><button onClick={previousSong}>{icons.prev}</button><button className="main-play" onClick={togglePlay}>{isPlaying ? icons.pause : icons.play}</button><button onClick={nextSong}>{icons.next}</button><button onClick={() => setRepeat(!repeat)} className={repeat ? 'selected' : ''}>{icons.repeat}</button></div><div className="progress-row"><span>{formatTime(progress)}</span><input className="progress" type="range" min="0" max={duration || 1} step="0.1" value={progress} onChange={seek}/><span>{formatTime(duration)}</span></div></div><div className="volume"><button onClick={() => setVolume(volume ? 0 : 0.8)}>{icons.volume}</button><input type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => setVolume(Number(event.target.value))}/></div></div>
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00'
  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

function AppLayout() {
  const { toast, currentSong } = useMusic()
  return <div className={`app-shell ${currentSong ? 'with-player' : ''}`}><Sidebar/><div className="app-main"><Routes><Route path="/" element={<Home/>}/><Route path="/search" element={<Search/>}/><Route path="/explore" element={<Explore/>}/><Route path="/albums" element={<Albums/>}/><Route path="/artists" element={<Artists/>}/><Route path="/artists/:id" element={<ArtistDetails/>}/><Route path="/playlists" element={<Playlists/>}/><Route path="/playlists/:id" element={<PlaylistDetails/>}/><Route path="/favorites" element={<Favorites/>}/><Route path="/downloads" element={<Downloads/>}/><Route path="/profile" element={<Profile/>}/></Routes></div><MusicPlayer/>{toast && <div className="toast">{toast}</div>}</div>
}

export default function App() {
  return <Routes><Route path="/admin/*" element={<AdminModule/>}/><Route path="/login" element={<AuthPage/>}/><Route path="/register" element={<AuthPage register/>}/><Route path="*" element={<AppLayout/>}/></Routes>
}
