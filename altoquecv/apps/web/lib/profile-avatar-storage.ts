export interface StoredProfileAvatar {
  ownerId: string;
  type: string;
  blob: Blob;
}

const DATABASE_NAME = 'altoquecv-profile-files';
const AVATAR_STORE = 'profile-avatars';
const DATABASE_VERSION = 2;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('El navegador no permite guardar la foto localmente.'));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains('original-cvs')) {
        database.createObjectStore('original-cvs');
      }
      if (!database.objectStoreNames.contains(AVATAR_STORE)) {
        database.createObjectStore(AVATAR_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('No se pudo abrir el almacenamiento de fotos.'));
    request.onblocked = () => reject(new Error('Cierra otras pestañas de AltoqueCV e inténtalo nuevamente.'));
  });
}

export async function saveProfileAvatar(ownerId: string, file: File): Promise<StoredProfileAvatar> {
  const database = await openDatabase();
  const avatar = { ownerId, type: file.type, blob: file };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(AVATAR_STORE, 'readwrite');
    transaction.objectStore(AVATAR_STORE).put(avatar, ownerId);
    transaction.oncomplete = () => {
      database.close();
      resolve(avatar);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('No se pudo guardar la foto de perfil.'));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error('No se pudo guardar la foto de perfil.'));
    };
  });
}

export async function loadProfileAvatar(ownerId: string): Promise<StoredProfileAvatar | null> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(AVATAR_STORE, 'readonly');
    const request = transaction.objectStore(AVATAR_STORE).get(ownerId);
    let avatar: StoredProfileAvatar | null = null;
    request.onsuccess = () => {
      avatar = (request.result as StoredProfileAvatar | undefined) ?? null;
    };
    transaction.oncomplete = () => {
      database.close();
      resolve(avatar);
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error ?? new Error('No se pudo cargar la foto de perfil.'));
    };
    transaction.onabort = () => {
      database.close();
      reject(transaction.error ?? new Error('No se pudo cargar la foto de perfil.'));
    };
  });
}
