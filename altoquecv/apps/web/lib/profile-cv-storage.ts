export interface StoredProfileCV {
  ownerId: string;
  name: string;
  type: string;
  size: number;
  savedAt: string;
  blob: Blob;
}

const DATABASE_NAME = 'altoquecv-profile-files';
const STORE_NAME = 'original-cvs';
const DATABASE_VERSION = 2;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('El navegador no permite almacenar archivos localmente.'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
      if (!database.objectStoreNames.contains('profile-avatars')) {
        database.createObjectStore('profile-avatars');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('No se pudo abrir el almacenamiento de CV.'));
    request.onblocked = () => reject(new Error('Cierra otras pestañas de AltoqueCV e inténtalo nuevamente.'));
  });
}

export async function saveOriginalProfileCV(ownerId: string, file: File): Promise<StoredProfileCV> {
  const database = await openDatabase();
  const savedFile: StoredProfileCV = {
    ownerId,
    name: file.name,
    type: file.type || 'application/pdf',
    size: file.size,
    savedAt: new Date().toISOString(),
    blob: file,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(savedFile, ownerId);
    transaction.oncomplete = () => {
      database.close();
      resolve(savedFile);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('No se pudo guardar el CV original.'));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error('No se pudo guardar el CV original.'));
    };
  });
}

export async function loadOriginalProfileCV(ownerId: string): Promise<StoredProfileCV | null> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(ownerId);
    let savedFile: StoredProfileCV | null = null;
    request.onsuccess = () => {
      savedFile = (request.result as StoredProfileCV | undefined) ?? null;
    };
    transaction.oncomplete = () => {
      database.close();
      resolve(savedFile);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('No se pudo cargar el CV guardado.'));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error('No se pudo cargar el CV guardado.'));
    };
  });
}

export async function deleteOriginalProfileCV(ownerId: string): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(ownerId);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('No se pudo borrar el CV guardado.'));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error('No se pudo borrar el CV guardado.'));
    };
  });
}
