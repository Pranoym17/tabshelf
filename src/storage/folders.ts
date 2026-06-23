import { v4 as uuidv4 } from 'uuid'
import { openDB, FOLDERS_STORE } from './db'
import type { Folder, PartialFolder } from '../types'

function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(FOLDERS_STORE, mode)
        const req = fn(tx.objectStore(FOLDERS_STORE))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
        tx.onerror = () => reject(tx.error)
      }),
  )
}

export function getAllFolders(): Promise<Folder[]> {
  return withStore('readonly', (store) => store.getAll())
}

export function getFolder(id: string): Promise<Folder | undefined> {
  return withStore('readonly', (store) => store.get(id))
}

export function saveFolder(folder: Folder): Promise<void> {
  return withStore('readwrite', (store) => store.put(folder)).then(() => undefined)
}

export function deleteFolder(id: string): Promise<void> {
  return withStore('readwrite', (store) => store.delete(id)).then(() => undefined)
}

export function updateFolder(patch: PartialFolder): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(FOLDERS_STORE, 'readwrite')
        const store = tx.objectStore(FOLDERS_STORE)
        const getReq = store.get(patch.id)

        getReq.onsuccess = () => {
          const existing: Folder | undefined = getReq.result
          if (!existing) {
            reject(new Error(`Folder not found: ${patch.id}`))
            return
          }
          store.put({ ...existing, ...patch })
        }

        getReq.onerror = () => reject(getReq.error)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      }),
  )
}

export function createFolder(
  data: Omit<Folder, 'id' | 'createdAt' | 'lastOpenedAt' | 'openCount'>,
): Promise<Folder> {
  const folder: Folder = {
    ...data,
    id: uuidv4(),
    createdAt: Date.now(),
    lastOpenedAt: null,
    openCount: 0,
  }
  return saveFolder(folder).then(() => folder)
}

export function recordFolderOpened(id: string): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(FOLDERS_STORE, 'readwrite')
        const store = tx.objectStore(FOLDERS_STORE)
        const getReq = store.get(id)

        getReq.onsuccess = () => {
          const folder: Folder | undefined = getReq.result
          if (folder) {
            store.put({
              ...folder,
              lastOpenedAt: Date.now(),
              openCount: folder.openCount + 1,
            })
          }
        }

        getReq.onerror = () => reject(getReq.error)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      }),
  )
}
