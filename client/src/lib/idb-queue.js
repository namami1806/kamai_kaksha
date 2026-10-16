import { openDB } from 'idb';

const DB_NAME = 'kamai-kaksha-db';
const DB_VERSION = 2; // Incremented for audio_queue store

let dbPromise = null;

export async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Sync queue for offline progress actions
        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('status', 'status');
        }
        // Local cache for voice transcripts
        if (!db.objectStoreNames.contains('transcripts')) {
          db.createObjectStore('transcripts', { keyPath: 'id' });
        }
        // Delta cache store for offline courses & local jobs
        if (!db.objectStoreNames.contains('delta_cache')) {
          db.createObjectStore('delta_cache', { keyPath: 'key' });
        }
        // Audio blob queue for offline voice recordings (transcribe-then-delete)
        if (!db.objectStoreNames.contains('audio_queue')) {
          db.createObjectStore('audio_queue', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Queue an event when offline or completing a module
 */
export async function queueSyncEvent({ studentId, eventType, itemId, payload = {} }) {
  const db = await getDB();
  const event = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    studentId: studentId || 'priya_17',
    eventType,
    itemId,
    payload,
    timestamp: new Date().toISOString(),
    retryCount: 0,
    status: 'pending' // pending | syncing | synced
  };

  await db.put('sync_queue', event);
  await notifyQueueChange();
  return event;
}

/**
 * Queue an offline audio blob from MediaRecorder
 */
export async function queueAudioBlob({ studentId, audioBlob, durationMs = 0 }) {
  const db = await getDB();
  const audioRecord = {
    id: `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    studentId: studentId || 'priya_17',
    blob: audioBlob,
    durationMs,
    timestamp: new Date().toISOString(),
    status: 'pending_transcription'
  };

  await db.put('audio_queue', audioRecord);
  // Also queue a sync action for the pending audio
  await queueSyncEvent({
    studentId,
    eventType: 'OFFLINE_VOICE_RECORDING_QUEUED',
    itemId: audioRecord.id,
    payload: { audioId: audioRecord.id, durationMs }
  });
  return audioRecord;
}

/**
 * Delete audio blob after successful transcription (DPDP compliance: transcripts only)
 */
export async function deleteAudioBlob(audioId) {
  const db = await getDB();
  await db.delete('audio_queue', audioId);
}

/**
 * Retrieve all pending audio blobs
 */
export async function getAllAudioBlobs() {
  const db = await getDB();
  return await db.getAll('audio_queue');
}

/**
 * Count pending offline items in the sync queue (persists across page reloads)
 */
export async function getPendingSyncCount() {
  try {
    const db = await getDB();
    const all = await db.getAll('sync_queue');
    return all.filter(item => item.status === 'pending').length;
  } catch (err) {
    console.error('Error fetching pending sync count:', err);
    return 0;
  }
}

/**
 * Get all pending events
 */
export async function getAllPendingEvents() {
  const db = await getDB();
  const all = await db.getAll('sync_queue');
  return all.filter(item => item.status === 'pending');
}

/**
 * Flush sync queue to backend when online
 */
export async function flushSyncQueue(apiEndpoint = '/api/sync') {
  const pending = await getAllPendingEvents();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  const db = await getDB();
  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      const studentId = item.studentId || 'priya_17';
      const token = `token_${studentId}`;

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(item),
      }).catch(() => null);

      if (response && response.ok) {
        // Item is marked as 'synced' in IndexedDB (audit trail preserved; pending reads 0)
        item.status = 'synced';
        item.syncedAt = new Date().toISOString();
        await db.put('sync_queue', item);
        synced++;
      } else {
        // STRICT REQUIREMENT: If server fails, is stopped, or offline, NEVER clear the queue.
        // Item remains pending in IndexedDB for retry.
        failed++;
      }
    } catch (err) {
      console.warn('Queue item sync retry later (server unreachable):', err);
      failed++;
    }
  }

  await notifyQueueChange();
  return { synced, failed };
}

/**
 * Save item into delta cache for offline viewing
 */
export async function setDeltaCache(key, data) {
  const db = await getDB();
  await db.put('delta_cache', { key, data, cachedAt: new Date().toISOString() });
}

/**
 * Retrieve item from delta cache
 */
export async function getDeltaCache(key) {
  try {
    const db = await getDB();
    const item = await db.get('delta_cache', key);
    return item ? item.data : null;
  } catch {
    return null;
  }
}

// Queue change subscriber system
const listeners = new Set();
export function subscribeToQueue(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

async function notifyQueueChange() {
  const count = await getPendingSyncCount();
  listeners.forEach(cb => cb(count));
}

if (typeof window !== 'undefined') {
  window.__kamai_idb = {
    flushSyncQueue,
    getAllPendingEvents,
    getDB,
    queueSyncEvent,
    getPendingSyncCount,
    getAllAudioBlobs,
    deleteAudioBlob
  };
}
