const DATABASE = 'wavely-media'
const STORE = 'assets'

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveMedia(file) {
  const db = await openDatabase()
  const id = `asset-${Date.now()}-${Math.random().toString(36).slice(2)}`
  await new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(file, id)
    request.onsuccess = resolve
    request.onerror = () => reject(request.error)
  })
  db.close()
  return { id, url: URL.createObjectURL(file) }
}

export async function loadMedia(id) {
  const db = await openDatabase()
  const file = await new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(id)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  db.close()
  return file ? URL.createObjectURL(file) : ''
}
