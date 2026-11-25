import { useMemo, useState } from 'react'
import { Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useMusic } from './context/MusicContext'
import './admin.css'

const adminLinks = [
  ['/admin/dashboard', '▦', 'Dashboard'],
  ['/admin/songs', '♫', 'Manage Songs'],
  ['/admin/albums', '▤', 'Manage Albums'],
  ['/admin/artists', '♬', 'Manage Artists'],
  ['/admin/genres', '◉', 'Manage Genres'],
  ['/admin/users', '♙', 'Manage Users'],
  ['/admin/playlists', '☷', 'Manage Playlists'],
  ['/admin/analytics', '⌁', 'Analytics'],
  ['/admin/settings', '⚙', 'Settings'],
]

function AdminLogin() {
  const { adminSession, setAdminSession, adminSettings } = useMusic()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  if (adminSession) return <Navigate to="/admin/dashboard" replace/>
  const submit = (event) => {
    event.preventDefault()
    const expectedPassword = adminSettings.password || 'Admin123'
    if (email.trim().toLowerCase() !== 'admin@music.com' || password !== expectedPassword) {
      setError('Incorrect admin email or password.')
      return
    }
    setAdminSession(true)
    navigate('/admin/dashboard')
  }
  return <main className="admin-login-page"><form className="admin-login-card" onSubmit={submit}>
    <span className="admin-brand-mark">W</span><p className="admin-kicker">WAVELY CONTROL ROOM</p>
    <h1>Admin sign in</h1><p className="admin-muted">Manage the music, artists, and listener experience.</p>
    <label>Admin email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required/></label>
    <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required/></label>
    {error && <div className="admin-error">{error}</div>}
    <button className="admin-primary">Sign in to dashboard</button>
    <div className="admin-demo-hint">Demo credentials: <strong>admin@music.com</strong> / <strong>Admin123</strong></div>
    <small>Demo LocalStorage authentication only. Not secure for production.</small>
  </form></main>
}

function AdminSidebar() {
  const { setAdminSession, notify } = useMusic()
  const navigate = useNavigate()
  const logout = () => {
    setAdminSession(false)
    notify('Admin signed out')
    navigate('/admin/login')
  }
  return <aside className="admin-sidebar">
    <NavLink to="/admin/dashboard" className="admin-brand"><span className="admin-brand-mark">W</span><span>WAVELY <small>ADMIN</small></span></NavLink>
    <div className="admin-nav-label">WORKSPACE</div>
    <nav>{adminLinks.map(([to, icon, label]) => <NavLink key={to} to={to} className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}><span>{icon}</span>{label}</NavLink>)}</nav>
    <button className="admin-nav-link admin-logout" onClick={logout}><span>↪</span>Logout</button>
  </aside>
}

function AdminNavbar({ title }) {
  const { adminSettings } = useMusic()
  return <header className="admin-topbar"><div><span className="admin-mobile-title">WAVELY ADMIN</span><h1>{title}</h1></div><div className="admin-admin-chip"><span className="admin-status-dot"/><span>{adminSettings.displayName || 'Wavely Admin'}</span><b>WA</b></div></header>
}

function AdminLayout({ children, title }) {
  const { toast, adminSettings } = useMusic()
  return <div className={`admin-shell ${adminSettings.theme === 'light' ? 'admin-light' : ''} ${adminSettings.compactTables ? 'admin-compact' : ''}`}>
    <AdminSidebar/><div className="admin-main"><AdminNavbar title={title}/><main className="admin-content">{children}</main></div>
    {toast && <div className="admin-toast">{toast}</div>}
  </div>
}

function AdminStatCard({ label, value, icon, note, accent }) {
  return <article className={`admin-stat-card ${accent || ''}`}><div className="admin-stat-top"><span>{label}</span><b>{icon}</b></div><strong>{value}</strong><small>{note}</small></article>
}

function AdminTable({ columns, rows, emptyMessage = 'No records found' }) {
  if (!rows.length) return <div className="admin-empty"><span>◌</span><strong>{emptyMessage}</strong><small>Try changing your search or add a new record.</small></div>
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}</tbody></table></div>
}

function AdminSearch({ value, onChange, placeholder = 'Search records...' }) {
  return <label className="admin-search"><span>⌕</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder}/></label>
}

function AdminModal({ title, children, onClose, onSubmit, submitText = 'Save changes' }) {
  return <div className="admin-modal-overlay" onMouseDown={onClose}><form className="admin-modal" onSubmit={onSubmit} onMouseDown={(event) => event.stopPropagation()}>
    <header><div><span className="admin-kicker">LIBRARY MANAGEMENT</span><h2>{title}</h2></div><button type="button" className="admin-close" onClick={onClose}>×</button></header>
    <div className="admin-modal-body">{children}</div>
    <footer><button type="button" className="admin-secondary" onClick={onClose}>Cancel</button><button className="admin-primary">{submitText}</button></footer>
  </form></div>
}

function EntityForm({ fields, initial, onSave, onClose, title, submitText, songs = [] }) {
  const [values, setValues] = useState(() => ({ ...initial }))
  const [error, setError] = useState('')
  const update = (key, value) => setValues((old) => {
    const next = { ...old, [key]: value }
    if (key === 'artwork') delete next.artworkAssetId
    if (key === 'audioUrl') delete next.audioAssetId
    if (key === 'image') delete next.imageAssetId
    return next
  })
  const submit = (event) => {
    event.preventDefault()
    const required = fields.find((field) => field.required && !String(values[field.key] || '').trim())
    if (required) { setError(`${required.label} is required.`); return }
    onSave(values)
  }
  return <AdminModal title={title} onClose={onClose} onSubmit={submit} submitText={submitText}>
    <div className="admin-form-grid">{fields.map((field) => <label key={field.key} className={field.full ? 'span-two' : ''}>{field.label}
      {field.type === 'select' ? <select required={field.required} value={values[field.key] || ''} onChange={(event) => update(field.key, event.target.value)}><option value="">Select {field.label.toLowerCase()}</option>{field.options.map((option) => <option key={option} value={option}>{option}</option>)}</select>
        : field.type === 'textarea' ? <textarea required={field.required} rows="3" value={values[field.key] || ''} onChange={(event) => update(field.key, event.target.value)} placeholder={field.placeholder || ''}/>
          : field.type === 'file' ? <><input type="file" accept={field.accept} onChange={(event) => update(field.key, event.target.files?.[0] || null)}/><small>{field.help}</small></>
            : field.type === 'songIds' ? <div className="admin-song-checks">{songs.map((song) => <label key={song.id}><input type="checkbox" checked={(values.songIds || []).includes(song.id)} onChange={(event) => update('songIds', event.target.checked ? [...(values.songIds || []), song.id] : values.songIds.filter((id) => id !== song.id))}/>{song.title} <small>· {song.artist}</small></label>)}</div>
              : <input required={field.required} type={field.type || 'text'} value={values[field.key] ?? ''} onChange={(event) => update(field.key, event.target.value)} placeholder={field.placeholder || ''}/>}
    </label>)}</div>{error && <div className="admin-error">{error}</div>}
  </AdminModal>
}

function DashboardHome() {
  const { songs, albums, artists, demoUsers, playlists, downloadsCount, playCounts, followedArtists, recent } = useMusic()
  const popular = [...songs].sort((a, b) => (playCounts[b.id] || b.popularity || 0) - (playCounts[a.id] || a.popularity || 0)).slice(0, 5)
  const recentSongs = recent.slice(0, 5).map((id) => songs.find((song) => song.id === id)).filter(Boolean)
  const topArtists = artists.map((artist) => ({ ...artist, follows: followedArtists.filter((id) => id === artist.id).length })).sort((a,b) => b.follows - a.follows).slice(0,5)
  const activity = recentSongs.map((song) => ({ id: song.id, name: song.title, detail: `${song.artist} was played`, time: 'Recent playback' }))
  return <AdminLayout title="Dashboard">
    <div className="admin-welcome"><div><span className="admin-kicker">OVERVIEW</span><h2>Good to see you, Admin</h2><p>Here’s what’s happening across your music library.</p></div></div>
    <div className="admin-stats-grid">
      <AdminStatCard label="Total songs" value={songs.length} icon="♫" note="In your library" accent="lime"/>
      <AdminStatCard label="Total albums" value={albums.length} icon="▤" note="Catalog collections" accent="violet"/>
      <AdminStatCard label="Total artists" value={artists.length} icon="♬" note="Artist profiles" accent="blue"/>
      <AdminStatCard label="Total users" value={demoUsers.length} icon="♙" note="Registered demo accounts" accent="orange"/>
      <AdminStatCard label="Total playlists" value={playlists.length} icon="☷" note="Saved user playlists" accent="pink"/>
      <AdminStatCard label="Downloads" value={downloadsCount} icon="↓" note="Successful download events on this device" accent="cyan"/>
    </div>
    <div className="admin-two-column">
      <section className="admin-panel"><PanelHeading title="Recently added songs" action="/admin/songs"/><AdminTable columns={[
        { key:'song', label:'TRACK', render: (song) => <div className="admin-track-cell"><img src={song.artwork} alt=""/><span><b>{song.title}</b><small>{song.artist}</small></span></div> },
        { key:'album', label:'ALBUM' }, { key:'genre', label:'GENRE' },
      ]} rows={[...songs].slice(-5).reverse()} emptyMessage="No songs in the library"/></section>
      <section className="admin-panel"><PanelHeading title="Most popular songs" action="/admin/analytics"/><div className="admin-rank-list">{popular.map((song, index) => <div className="admin-rank-row" key={song.id}><span className="admin-rank">{String(index + 1).padStart(2,'0')}</span><img src={song.artwork} alt=""/>      <span className="admin-rank-name"><b>{song.title}</b><small>{song.artist}</small></span><strong>{playCounts[song.id] ? `${playCounts[song.id]} plays` : `${song.popularity || 0}% score`}</strong></div>)}</div><p className="admin-footnote">When play history is empty, the seeded catalog popularity score is shown instead.</p></section>
    </div>
    <div className="admin-two-column">
      <section className="admin-panel"><PanelHeading title="Recently registered users" action="/admin/users"/>{demoUsers.length ? <AdminTable columns={[
        { key:'name', label:'USER', render: (user) => <div className="admin-user-cell"><span>{user.name?.[0]?.toUpperCase() || 'U'}</span><b>{user.name}</b></div> },
        { key:'email', label:'EMAIL' }, { key:'registeredAt', label:'JOINED', render: (user) => user.registeredAt ? new Date(user.registeredAt).toLocaleDateString() : '—' },
      ]} rows={demoUsers.slice(-5).reverse()}/> : <div className="admin-empty compact"><strong>No registered demo accounts yet</strong><small>Accounts appear here after registration on the user site.</small></div>}</section>
      <section className="admin-panel"><PanelHeading title="Most followed artists" action="/admin/artists"/><div className="admin-rank-list">{topArtists.map((artist,index) => <div className="admin-rank-row" key={artist.id}><span className="admin-rank">{String(index + 1).padStart(2,'0')}</span><img className="round" src={artist.image} alt=""/><span className="admin-rank-name"><b>{artist.name}</b><small>{artist.genre || 'Artist'}</small></span><strong>{artist.follows} follows</strong></div>)}</div></section>
    </div>
    <section className="admin-panel"><PanelHeading title="Recent listening activity" action="/admin/analytics"/>{activity.length ? <div className="admin-activity-list">{activity.map((item) => <div key={item.id}><span className="activity-dot">♫</span><span><b>{item.name}</b><small>{item.detail}</small></span><small>{item.time}</small></div>)}</div> : <div className="admin-empty compact"><strong>No recent plays recorded</strong><small>Listening events are recorded on this device only.</small></div>}</section>
  </AdminLayout>
}

function PanelHeading({ title, action }) {
  return <div className="admin-panel-heading"><h3>{title}</h3>{action && <NavLink to={action}>View all <span>↗</span></NavLink>}</div>
}

function ManagerHeader({ eyebrow, title, description, button, onClick }) {
  return <div className="admin-page-heading"><div><span className="admin-kicker">{eyebrow}</span><h2>{title}</h2><p>{description}</p></div>{button && <button className="admin-primary" onClick={onClick}>＋ {button}</button>}</div>
}

function SongsManager() {
  const { songs, artists, albums, genres, createSong, updateSong, deleteSong, notify } = useMusic()
  const [query, setQuery] = useState('')
  const [genreFilter, setGenreFilter] = useState('All genres')
  const [artistFilter, setArtistFilter] = useState('All artists')
  const [sort, setSort] = useState('title')
  const [editing, setEditing] = useState(null)
  const [isNew, setIsNew] = useState(false)
  const fields = [
    { key:'title', label:'Song title', required:true }, { key:'artist', label:'Artist', type:'select', options:artists.map((artist) => artist.name), required:true },
    { key:'album', label:'Album', type:'select', options:['Single', ...albums.map((album) => album.name)], required:true },
    { key:'genre', label:'Genre', type:'select', options:genres, required:true },
    { key:'year', label:'Release year', type:'number', required:true }, { key:'duration', label:'Duration', placeholder:'e.g. 3:42' },
    { key:'audioUrl', label:'Audio URL', placeholder:'https://... or upload a file', full:true },
    { key:'audioFile', label:'Upload audio file', type:'file', accept:'audio/*', help:'Stored in IndexedDB on this browser; never in LocalStorage.' },
    { key:'artwork', label:'Artwork URL', placeholder:'https://...' },
    { key:'artworkFile', label:'Upload artwork', type:'file', accept:'image/*', help:'Stored in IndexedDB on this browser.' },
  ]
  const visible = useMemo(() => [...songs].filter((song) => `${song.title} ${song.artist} ${song.album} ${song.genre}`.toLowerCase().includes(query.toLowerCase()))
    .filter((song) => genreFilter === 'All genres' || song.genre === genreFilter)
    .filter((song) => artistFilter === 'All artists' || song.artist === artistFilter)
    .sort((a,b) => String(a[sort] || '').localeCompare(String(b[sort] || ''))), [songs, query, genreFilter, artistFilter, sort])
  const save = async (value) => {
    try {
      if (!value.audioUrl?.trim() && !value.audioFile) {
        notify('Add an audio URL or upload an audio file before saving.')
        return
      }
      if (isNew) await createSong(value)
      else await updateSong(editing.id, value)
      setEditing(null); setIsNew(false)
    } catch { notify('Song could not be saved. Check media permissions and try again.') }
  }
  return <AdminLayout title="Manage Songs"><ManagerHeader eyebrow="CONTENT LIBRARY" title="Songs" description={`${songs.length} tracks · Add, organize, and update your music catalog.`} button="Add song" onClick={() => { setEditing({ year:new Date().getFullYear(), popularity:0, genre:genres[0], artist:artists[0]?.name || '', album:'Single' }); setIsNew(true) }}/>
    <section className="admin-panel admin-list-panel"><div className="admin-toolbar"><AdminSearch value={query} onChange={setQuery} placeholder="Search title, artist, album..."/><select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)}><option>All genres</option>{genres.map((genre) => <option key={genre}>{genre}</option>)}</select><select value={artistFilter} onChange={(event) => setArtistFilter(event.target.value)}><option>All artists</option>{artists.map((artist) => <option key={artist.id}>{artist.name}</option>)}</select><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="title">Sort: title</option><option value="artist">Sort: artist</option><option value="album">Sort: album</option><option value="year">Sort: year</option></select></div>
      <AdminTable columns={[
        { key:'title', label:'SONG', render: (song) => <div className="admin-track-cell"><img src={song.artwork} alt=""/><span><b>{song.title}</b><small>{song.artist}</small></span></div> },
        { key:'album', label:'ALBUM' }, { key:'genre', label:'GENRE' }, { key:'year', label:'YEAR' }, { key:'duration', label:'LENGTH' },
        { key:'actions', label:'ACTIONS', render: (song) => <div className="admin-row-actions"><button onClick={() => { setEditing(song); setIsNew(false) }}>Edit</button><button className="danger-text" onClick={() => { if (window.confirm(`Delete “${song.title}” from the library?`)) deleteSong(song.id) }}>Delete</button></div> },
      ]} rows={visible} emptyMessage="No matching songs"/></section>
    {editing && <EntityForm title={isNew ? 'Add a song' : 'Edit song'} initial={editing} fields={fields} songs={songs} onClose={() => { setEditing(null); setIsNew(false) }} onSave={save} submitText={isNew ? 'Add song' : 'Save song'}/>}
  </AdminLayout>
}

function AlbumsManager() {
  const { albums, songs, artists, genres, createAlbum, updateAlbum, deleteAlbum, notify } = useMusic()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [isNew, setIsNew] = useState(false)
  const fields = [
    { key:'name', label:'Album name', required:true }, { key:'artist', label:'Artist', type:'select', options:artists.map((artist) => artist.name), required:true },
    { key:'year', label:'Release year', type:'number', required:true }, { key:'genre', label:'Genre', type:'select', options:genres, required:true },
    { key:'artwork', label:'Artwork URL', placeholder:'https://...' }, { key:'artworkFile', label:'Upload artwork', type:'file', accept:'image/*', help:'Stored in IndexedDB.' },
    { key:'songIds', label:'Songs in album', type:'songIds', full:true },
  ]
  const visible = albums.filter((album) => `${album.name} ${album.artist} ${album.genre}`.toLowerCase().includes(query.toLowerCase()))
  const save = async (value) => {
    try {
      if (isNew) await createAlbum(value)
      else await updateAlbum(editing.id, value)
      setEditing(null); setIsNew(false)
    } catch { notify('Album could not be saved.') }
  }
  return <AdminLayout title="Manage Albums"><ManagerHeader eyebrow="CONTENT LIBRARY" title="Albums" description="Create and maintain album collections and track assignments." button="Add album" onClick={() => { setEditing({ name:'', artist:artists[0]?.name || '', genre:genres[0] || '', year:new Date().getFullYear(), artwork:'', songIds:[] }); setIsNew(true) }}/>
    <section className="admin-panel admin-list-panel"><div className="admin-toolbar"><AdminSearch value={query} onChange={setQuery}/><span className="admin-result-count">{visible.length} albums</span></div><AdminTable columns={[
      { key:'name', label:'ALBUM', render: (album) => <div className="admin-track-cell"><img src={album.artwork} alt=""/><span><b>{album.name}</b><small>{album.artist}</small></span></div> },
      { key:'genre', label:'GENRE' }, { key:'year', label:'YEAR' }, { key:'songIds', label:'TRACKS', render: (album) => (album.songIds || []).length },
      { key:'actions', label:'ACTIONS', render: (album) => <div className="admin-row-actions"><button onClick={() => { setEditing(album); setIsNew(false) }}>Edit</button><button className="danger-text" onClick={() => { if (window.confirm(`Delete album “${album.name}”? Songs will remain as singles.`)) deleteAlbum(album.id) }}>Delete</button></div> },
    ]} rows={visible} emptyMessage="No albums found"/></section>
    {editing && <EntityForm title={isNew ? 'Add an album' : 'Edit album'} initial={editing} fields={fields} songs={songs} onClose={() => { setEditing(null); setIsNew(false) }} onSave={save} submitText={isNew ? 'Create album' : 'Save album'}/>}
  </AdminLayout>
}

function ArtistsManager() {
  const { artists, songs, genres, createArtist, updateArtist, deleteArtist, notify } = useMusic()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null)
  const [isNew, setIsNew] = useState(false)
  const fields = [
    { key:'name', label:'Artist name', required:true }, { key:'genre', label:'Primary genre', type:'select', options:genres, required:true },
    { key:'monthlyListeners', label:'Listener label', placeholder:'Optional display text' }, { key:'image', label:'Profile image URL', placeholder:'https://...' },
    { key:'imageFile', label:'Upload profile image', type:'file', accept:'image/*', help:'Stored in IndexedDB.' },
    { key:'biography', label:'Biography', type:'textarea', full:true }, { key:'songIds', label:'Songs by this artist', type:'songIds', full:true },
  ]
  const visible = artists.filter((artist) => `${artist.name} ${artist.genre} ${artist.biography || ''}`.toLowerCase().includes(query.toLowerCase()))
  const save = async (value) => {
    try {
      if (isNew) await createArtist(value)
      else await updateArtist(editing.id, value)
      setEditing(null); setIsNew(false)
    } catch { notify('Artist profile could not be saved.') }
  }
  return <AdminLayout title="Manage Artists"><ManagerHeader eyebrow="CONTENT LIBRARY" title="Artists" description="Maintain artist profiles and connect them with songs." button="Add artist" onClick={() => { setEditing({ name:'', genre:genres[0] || '', image:'', biography:'', songIds:[] }); setIsNew(true) }}/>
    <section className="admin-panel admin-list-panel"><div className="admin-toolbar"><AdminSearch value={query} onChange={setQuery} placeholder="Search artist or genre"/><span className="admin-result-count">{visible.length} artists</span></div><AdminTable columns={[
      { key:'name', label:'ARTIST', render: (artist) => <div className="admin-track-cell"><img className="round" src={artist.image} alt=""/><span><b>{artist.name}</b><small>{artist.biography || artist.monthlyListeners || 'Artist profile'}</small></span></div> },
      { key:'genre', label:'GENRE' }, { key:'songs', label:'SONGS', render: (artist) => songs.filter((song) => song.artist === artist.name).length },
      { key:'actions', label:'ACTIONS', render: (artist) => <div className="admin-row-actions"><button onClick={() => { setEditing(artist); setIsNew(false) }}>Edit</button><button className="danger-text" onClick={() => { if (window.confirm(`Remove artist profile for “${artist.name}”? Songs remain in the catalog.`)) deleteArtist(artist.id) }}>Delete</button></div> },
    ]} rows={visible} emptyMessage="No artists found"/></section>
    {editing && <EntityForm title={isNew ? 'Add an artist' : 'Edit artist'} initial={editing} fields={fields} songs={songs} onClose={() => { setEditing(null); setIsNew(false) }} onSave={save} submitText={isNew ? 'Create artist' : 'Save artist'}/>}
  </AdminLayout>
}

function GenresManager() {
  const { genres, songs, createGenre, renameGenre, deleteGenre, notify } = useMusic()
  const [query, setQuery] = useState('')
  const [newName, setNewName] = useState('')
  const visible = genres.filter((genre) => genre.toLowerCase().includes(query.toLowerCase()))
  const add = (event) => {
    event.preventDefault()
    if (!createGenre(newName)) notify('Enter a unique genre name.')
    else setNewName('')
  }
  return <AdminLayout title="Manage Genres"><ManagerHeader eyebrow="CONTENT TAXONOMY" title="Genres" description="Keep discovery categories current across the music catalog."/>
    <section className="admin-panel genre-add-panel"><form onSubmit={add}><label>Add a genre<input value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="e.g. Ambient" required/></label><button className="admin-primary">＋ Add genre</button></form></section>
    <section className="admin-panel admin-list-panel"><div className="admin-toolbar"><AdminSearch value={query} onChange={setQuery} placeholder="Search genres"/><span className="admin-result-count">{visible.length} genres</span></div><AdminTable columns={[
      { key:'name', label:'GENRE', render: (genre) => <b>{genre.name}</b> },
      { key:'songCount', label:'SONGS', render: (genre) => songs.filter((song) => song.genre === genre.name).length },
      { key:'actions', label:'ACTIONS', render: (genre) => <div className="admin-row-actions"><button onClick={() => { const name = window.prompt('Rename genre', genre.name); if (name && !renameGenre(genre.name, name)) notify('Genre name must be unique.') }}>Rename</button><button className="danger-text" onClick={() => { if (window.confirm(`Delete “${genre.name}”? Matching songs will be reassigned to Other.`)) deleteGenre(genre.name) }}>Delete</button></div> },
    ]} rows={visible.map((name) => ({ id:name, name }))} emptyMessage="No genres found"/></section>
  </AdminLayout>
}

function UsersManager() {
  const { demoUsers, updateDemoUser, deleteDemoUser, playlists } = useMusic()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [selected, setSelected] = useState(null)
  const visible = demoUsers.filter((user) => `${user.name} ${user.email} ${user.status}`.toLowerCase().includes(query.toLowerCase()))
    .filter((user) => statusFilter === 'All statuses' || (user.status || 'Active') === statusFilter)
  return <AdminLayout title="Manage Users"><ManagerHeader eyebrow="COMMUNITY" title="Users" description="Registered demo accounts only. Passwords are never displayed or stored here."/>
    <section className="admin-panel admin-list-panel"><div className="admin-toolbar"><AdminSearch value={query} onChange={setQuery} placeholder="Search name or email"/><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option><option>Active</option><option>Disabled</option></select></div><AdminTable columns={[
      { key:'id', label:'USER ID', render: (user) => <code>{user.id}</code> },
      { key:'name', label:'USER', render: (user) => <div className="admin-user-cell"><span>{user.name?.[0]?.toUpperCase() || 'U'}</span><b>{user.name}</b></div> },
      { key:'email', label:'EMAIL' },
      { key:'registeredAt', label:'REGISTERED', render: (user) => user.registeredAt ? new Date(user.registeredAt).toLocaleDateString() : '—' },
      { key:'status', label:'STATUS', render: (user) => <span className={`admin-status ${user.status === 'Disabled' ? 'disabled' : ''}`}>{user.status || 'Active'}</span> },
      { key:'playlists', label:'PLAYLISTS', render: (user) => playlists.filter((playlist) => playlist.ownerId === user.id).length },
      { key:'actions', label:'ACTIONS', render: (user) => <div className="admin-row-actions"><button onClick={() => setSelected(user)}>Details</button><button onClick={() => updateDemoUser(user.id, { status:user.status === 'Disabled' ? 'Active' : 'Disabled' })}>{user.status === 'Disabled' ? 'Enable' : 'Disable'}</button><button className="danger-text" onClick={() => { if (window.confirm(`Delete demo account ${user.email}?`)) deleteDemoUser(user.id) }}>Delete</button></div> },
    ]} rows={visible} emptyMessage="No registered accounts. Demo accounts appear after a user registers."/><p className="admin-footnote">Only usernames, email addresses, account status, and registration timestamps are stored. No passwords or fabricated user records are shown.</p></section>
    {selected && <AdminModal title="Demo user details" onClose={() => setSelected(null)} onSubmit={(event) => { event.preventDefault(); setSelected(null) }} submitText="Close"><div className="admin-detail-list"><span>User ID</span><strong>{selected.id}</strong><span>Username</span><strong>{selected.name}</strong><span>Email</span><strong>{selected.email}</strong><span>Registered</span><strong>{selected.registeredAt ? new Date(selected.registeredAt).toLocaleString() : 'Not available'}</strong><span>Status</span><strong>{selected.status || 'Active'}</strong></div></AdminModal>}
  </AdminLayout>
}

function PlaylistsManager() {
  const { playlists, songs, deletePlaylist } = useMusic()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const visible = playlists.filter((playlist) => playlist.name.toLowerCase().includes(query.toLowerCase()))
  return <AdminLayout title="Manage Playlists"><ManagerHeader eyebrow="COMMUNITY" title="Playlists" description="Review playlists stored on this device. Deletions require confirmation."/>
    <section className="admin-panel admin-list-panel"><div className="admin-toolbar"><AdminSearch value={query} onChange={setQuery}/><span className="admin-result-count">{playlists.length} playlists</span></div><AdminTable columns={[
      { key:'name', label:'PLAYLIST', render: (playlist) => <div className="admin-track-cell"><span className="admin-playlist-icon">☷</span><span><b>{playlist.name}</b><small>{playlist.ownerName || 'Local device'}</small></span></div> },
      { key:'songIds', label:'TRACKS', render: (playlist) => playlist.songIds.length },
      { key:'createdAt', label:'CREATED', render: (playlist) => playlist.createdAt ? new Date(playlist.createdAt).toLocaleDateString() : '—' },
      { key:'actions', label:'ACTIONS', render: (playlist) => <div className="admin-row-actions"><button onClick={() => setSelected(playlist)}>View tracks</button><button className="danger-text" onClick={() => { if (window.confirm(`Delete playlist “${playlist.name}”? This cannot be undone.`)) deletePlaylist(playlist.id) }}>Delete</button></div> },
    ]} rows={visible} emptyMessage="No playlists have been created"/></section>
    {selected && <AdminModal title={selected.name} onClose={() => setSelected(null)} onSubmit={(event) => { event.preventDefault(); setSelected(null) }} submitText="Done"><div className="admin-track-modal-list">{selected.songIds.map((id) => songs.find((song) => song.id === id)).filter(Boolean).map((song) => <div key={song.id}><img src={song.artwork} alt=""/><span><b>{song.title}</b><small>{song.artist}</small></span><span>{song.duration}</span></div>)}{!selected.songIds.length && <p>This playlist is currently empty.</p>}</div><p className="admin-footnote">Playlist creator information is unavailable in this local demo.</p></AdminModal>}
  </AdminLayout>
}

function Analytics() {
  const { songs, artists, albums, demoUsers, playlists, playCounts, downloadsCount, recent } = useMusic()
  const playTotal = Object.values(playCounts).reduce((sum, count) => sum + count, 0)
  const genreCounts = [...new Set(songs.map((song) => song.genre))].map((genre) => ({ genre, count:songs.filter((song) => song.genre === genre).length })).sort((a,b) => b.count-a.count)
  const topTracks = [...songs].sort((a,b) => (playCounts[b.id] || 0) - (playCounts[a.id] || 0)).slice(0,6)
  const maxPlays = Math.max(1, ...topTracks.map((song) => playCounts[song.id] || 0))
  const recentTrend = recent.slice(0,10).map((id,index) => ({ index, count: playCounts[id] || 0 }))
  const polyline = recentTrend.length ? recentTrend.map((point,index) => `${recentTrend.length === 1 ? 50 : index * 100 / (recentTrend.length - 1)},${95 - Math.min(80,point.count / Math.max(1,...recentTrend.map((item) => item.count)) * 80)}`).join(' ') : ''
  const popularArtists = artists.map((artist) => ({
    ...artist,
    count: songs.filter((song) => song.artist === artist.name).reduce((sum, song) => sum + (playCounts[song.id] || 0), 0),
  })).sort((a,b) => b.count-a.count).slice(0,5)
  const playedAlbums = albums.map((album) => ({
    ...album,
    plays: songs.filter((song) => song.album === album.name).reduce((sum, song) => sum + (playCounts[song.id] || 0), 0),
  })).sort((a,b) => b.plays-a.plays).slice(0,5)
  return <AdminLayout title="Analytics"><ManagerHeader eyebrow="INSIGHTS" title="Analytics" description="Usage metrics collected by this browser for this local demo."/>
    <div className="admin-stats-grid analytics-stats"><AdminStatCard label="Recorded plays" value={playTotal} icon="▶" note="Actual play events in this browser" accent="lime"/><AdminStatCard label="Downloads" value={downloadsCount} icon="↓" note="Successful download events on this device" accent="cyan"/><AdminStatCard label="Demo users" value={demoUsers.length} icon="♙" note="Registered accounts" accent="violet"/><AdminStatCard label="Playlists" value={playlists.length} icon="☷" note="Current local library" accent="pink"/></div>
    <div className="admin-two-column analytics-columns"><section className="admin-panel chart-panel"><PanelHeading title="Most played songs"/><div className="bar-chart">{topTracks.map((song) => <div className="bar-item" key={song.id}><div className="bar-rail"><span style={{ height:`${Math.max(4,(playCounts[song.id] || 0) / maxPlays * 100)}%` }}/></div><b>{playCounts[song.id] || 0}</b><small>{song.title}</small></div>)}</div><p className="admin-footnote">Bars represent locally recorded play events. Catalog popularity is not substituted for play data.</p></section>
      <section className="admin-panel chart-panel"><PanelHeading title="Genre distribution"/>{genreCounts.length ? <div className="genre-analytics"><div className="genre-donut" style={{ background:`conic-gradient(${genreCounts.map((item,index) => { const total = genreCounts.reduce((sum,entry) => sum + entry.count,0); const start = genreCounts.slice(0,index).reduce((sum,entry) => sum + entry.count,0) / total * 100; const end = start + item.count / total * 100; return `${['#b4f43b','#9074f5','#48c9da','#ff9d59','#f16eaa','#77a9ff'][index%6]} ${start}% ${end}%` }).join(',')})`}}><span>{songs.length}<small>tracks</small></span></div><div className="genre-legend">{genreCounts.slice(0,8).map((item,index) => <span key={item.genre}><i style={{background:['#b4f43b','#9074f5','#48c9da','#ff9d59','#f16eaa','#77a9ff'][index%6]}}/>{item.genre}<b>{item.count}</b></span>)}</div></div> : <div className="admin-empty">No genre data available</div>}</section>
    </div>
    <div className="admin-two-column analytics-columns"><section className="admin-panel chart-panel"><PanelHeading title="Recent playback trend"/>{recentTrend.length ? <div className="line-chart"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={polyline}/></svg><div className="line-axis"><span>Oldest recent play</span><span>Most recent</span></div></div> : <div className="admin-empty compact"><strong>No plays recorded yet</strong><small>Play songs on the user side to build a local trend.</small></div>}<p className="admin-footnote">Based on up to 10 most recent unique tracks; repeat plays are counted above.</p></section>
      <section className="admin-panel"><PanelHeading title="Popular artists"/><div className="admin-rank-list">{popularArtists.map((artist,index) => <div className="admin-rank-row" key={artist.id}><span className="admin-rank">{index + 1}</span><img className="round" src={artist.image} alt=""/><span className="admin-rank-name"><b>{artist.name}</b><small>{artist.genre}</small></span><strong>{artist.count} plays</strong></div>)}</div></section>
    </div>
    <section className="admin-panel"><PanelHeading title="Most played albums"/><div className="admin-rank-list">{playedAlbums.map((album,index) => <div className="admin-rank-row" key={album.id}><span className="admin-rank">{index + 1}</span><img src={album.artwork} alt=""/><span className="admin-rank-name"><b>{album.name}</b><small>{album.artist}</small></span><strong>{album.plays} plays</strong></div>)}</div>{!playedAlbums.length && <div className="admin-empty compact"><strong>No albums in the catalog</strong></div>}</section>
    <p className="admin-footnote">Albums in catalog: {albums.length}. User growth is not charted because historical account snapshots are not available in the local demo.</p>
  </AdminLayout>
}

function SettingsManager() {
  const { adminSettings, setAdminSettings, notify } = useMusic()
  const [displayName, setDisplayName] = useState(adminSettings.displayName || 'Wavely Admin')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const save = (event) => {
    event.preventDefault()
    if (newPassword && newPassword.length < 6) return setError('Demo password must be at least 6 characters.')
    if (newPassword && newPassword !== confirmPassword) return setError('Passwords do not match.')
    setAdminSettings({ ...adminSettings, displayName:displayName.trim() || 'Wavely Admin', ...(newPassword ? { password:newPassword } : {}) })
    setNewPassword(''); setConfirmPassword(''); setError(''); notify('Admin settings saved')
  }
  return <AdminLayout title="Settings"><ManagerHeader eyebrow="PREFERENCES" title="Admin settings" description="Update your demo admin profile and dashboard preferences."/>
    <form className="admin-settings-form" onSubmit={save}><section className="admin-panel"><PanelHeading title="Admin profile"/><label>Display name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)}/></label><div className="admin-settings-readonly"><span>Admin email</span><strong>admin@music.com</strong></div><label>New demo password<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Leave blank to keep current password"/></label><label>Confirm new password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password"/></label><small className="admin-footnote">The changed password is stored in LocalStorage and is not secure. Never reuse a real password.</small></section>
      <section className="admin-panel"><PanelHeading title="Dashboard preferences"/><label className="admin-select-label">Theme<select value={adminSettings.theme || 'dark'} onChange={(event) => setAdminSettings({ ...adminSettings, theme:event.target.value })}><option value="dark">Dark</option><option value="light">Light</option></select></label><label className="admin-toggle-row"><span><b>Compact tables</b><small>Reduce table row height to show more records.</small></span><input type="checkbox" checked={Boolean(adminSettings.compactTables)} onChange={(event) => setAdminSettings({ ...adminSettings, compactTables:event.target.checked })}/></label></section>
      {error && <div className="admin-error">{error}</div>}<button className="admin-primary">Save settings</button></form>
  </AdminLayout>
}

function AdminProtected() {
  const location = useLocation()
  const { adminSession } = useMusic()
  if (!adminSession) return <Navigate to="/admin/login" replace state={{ from:location.pathname }}/>
  const path = location.pathname.replace(/\/+$/, '') || '/admin/dashboard'
  if (path === '/admin/songs') return <SongsManager/>
  if (path === '/admin/albums') return <AlbumsManager/>
  if (path === '/admin/artists') return <ArtistsManager/>
  if (path === '/admin/genres') return <GenresManager/>
  if (path === '/admin/users') return <UsersManager/>
  if (path === '/admin/playlists') return <PlaylistsManager/>
  if (path === '/admin/analytics') return <Analytics/>
  if (path === '/admin/settings') return <SettingsManager/>
  if (path === '/admin/dashboard' || path === '/admin') return <DashboardHome/>
  return <Navigate to="/admin/dashboard" replace/>
}

export default function AdminModule() {
  const location = useLocation()
  if (location.pathname === '/admin/login') return <AdminLogin/>
  return <AdminProtected/>
}
