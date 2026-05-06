const DB_NAME = 'resonance_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_tracks';

const openDB = () =>
  new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const saveOfflineTrack = async (track) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(track);

    request.onsuccess = () => resolve(track);
    request.onerror = () => reject(request.error);
  });
};

export const getOfflineTracks = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const tracks = request.result.map((track) => ({
        ...track,
        source: 'offline',
      }));
      resolve(tracks);
    };

    request.onerror = () => reject(request.error);
  });
};

export const deleteOfflineTrack = async (trackId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(trackId);

    request.onsuccess = () => resolve(true);
    request.onerror = () => reject(request.error);
  });
};
