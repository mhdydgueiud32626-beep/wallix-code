/**
 * Media Storage Utility using browser-native IndexedDB
 * Persists user-uploaded video and image files across page refreshes and browser restarts.
 */

const DB_NAME = 'WallixMediaDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_files';

interface StoredMediaItem {
  id: string;
  blob: Blob;
  mimeType: string;
  name: string;
  updatedAt: number;
}

let dbInstance: IDBDatabase | null = null;

const getDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open IndexedDB'));
    };
  });
};

/**
 * Save a media Blob/File to persistent IndexedDB storage
 */
export const saveMediaFile = async (id: string, file: Blob, name = 'custom-media'): Promise<void> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const item: StoredMediaItem = {
        id,
        blob: file,
        mimeType: file.type || 'video/mp4',
        name,
        updatedAt: Date.now(),
      };
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[mediaStorage] Failed to save media file:', err);
  }
};

/**
 * Retrieve a stored Blob from IndexedDB by wallpaper ID
 */
export const getMediaFile = async (id: string): Promise<Blob | null> => {
  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result as StoredMediaItem | undefined;
        resolve(result ? result.blob : null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('[mediaStorage] Failed to retrieve media file:', err);
    return null;
  }
};

/**
 * Delete a media file from IndexedDB
 */
export const deleteMediaFile = async (id: string): Promise<void> => {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('[mediaStorage] Failed to delete media file:', err);
  }
};

/**
 * Extract a real video frame canvas snapshot from an uploaded video file.
 * Returns a high-quality base64 Data URL (e.g. data:image/jpeg;base64,...).
 * Because this contains real image bytes, it can be safely persisted in localStorage
 * and used as the wallpaper's permanent poster thumbnail.
 */
export const extractVideoThumbnail = (file: File | Blob): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;
      video.playsInline = true;
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      let settled = false;
      const finish = (result: string) => {
        if (!settled) {
          settled = true;
          URL.revokeObjectURL(objectUrl);
          resolve(result);
        }
      };

      const captureFrame = () => {
        try {
          const width = video.videoWidth || 640;
          const height = video.videoHeight || 360;
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(width, 1280);
          canvas.height = Math.round((canvas.width / width) * height);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
            finish(dataUrl);
            return;
          }
        } catch (e) {
          console.warn('[mediaStorage] Canvas frame capture error:', e);
        }
        finish('');
      };

      video.onloadeddata = () => {
        // Seek to 0.5s or 10% into video for an active frame
        const targetTime = Math.min(0.5, (video.duration || 1) / 4);
        video.currentTime = targetTime;
      };

      video.onseeked = () => {
        captureFrame();
      };

      video.onerror = () => {
        finish('');
      };

      // Safety timeout: 4 seconds
      setTimeout(() => finish(''), 4000);
    } catch (e) {
      console.warn('[mediaStorage] Thumbnail extraction error:', e);
      resolve('');
    }
  });
};
