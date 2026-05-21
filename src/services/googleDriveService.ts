import { GoogleAuthProvider, signInWithPopup, getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, writeBatch, serverTimestamp, query, limit } from 'firebase/firestore';

// In-memory token cache (never stored in localStorage for security)
let cachedAccessToken: string | null = null;
let isSigningIn = false;
let authListenerInitialized = false;

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';

/**
 * Custom hook or helper to listen to Firebase auth status and keep track of Google token
 */
export const initDriveAuth = (
  onSuccess?: (user: User, token: string) => void,
  onFailure?: () => void
) => {
  const authInstance = getAuth();
  return onAuthStateChanged(authInstance, (user) => {
    if (user && cachedAccessToken) {
      if (onSuccess) onSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onFailure) onFailure();
    }
  });
};

/**
 * Initiates Google Drive login popup
 */
export const loginWithGoogleDrive = async (): Promise<{ user: User; accessToken: string }> => {
  if (isSigningIn) {
    throw new Error('Ya hay un flujo de inicio de sesión en curso.');
  }

  const authInstance = getAuth();
  const provider = new GoogleAuthProvider();
  provider.addScope(DRIVE_SCOPE);
  // Optional but helpful properties
  provider.setCustomParameters({
    prompt: 'select_account'
  });

  try {
    isSigningIn = true;
    const result = await signInWithPopup(authInstance, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      throw new Error('No se pudo obtener el token de acceso de Google.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error in Google Drive signInWithPopup:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Signs out from current session & clears token cache
 */
export const logoutFromGoogleDrive = async (): Promise<void> => {
  const authInstance = getAuth();
  await authInstance.signOut();
  cachedAccessToken = null;
};

/**
 * Get the cached access token
 */
export const getDriveAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Search or create the INBOXA_COL_BACKUPS folder in Drive
 */
export const getOrCreateBackupFolder = async (token: string): Promise<string> => {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const folderName = 'INBOXA_COL_BACKUPS';

  // 1. Search for existing folder
  const queryUrl = `https://www.googleapis.com/drive/v3/files?q=name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`;
  const searchRes = await fetch(queryUrl, { headers });
  
  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Error buscando carpeta de respaldo: ${errText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // 2. Folder does not exist, create it
  const createUrl = 'https://www.googleapis.com/drive/v3/files';
  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Error creando carpeta de respaldo: ${errText}`);
  }

  const createData = await createRes.json();
  return createData.id;
};

/**
 * Drive interface for files
 */
export interface DriveBackupFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
}

/**
 * Listing all backups in the INBOXA_COL_BACKUPS folder
 */
export const listDriveBackups = async (token: string): Promise<DriveBackupFile[]> => {
  const folderId = await getOrCreateBackupFolder(token);
  const headers = { 'Authorization': `Bearer ${token}` };
  
  const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&orderBy=modifiedTime desc&fields=files(id,name,mimeType,size,modifiedTime)`;
  const res = await fetch(url, { headers });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error listando respaldos: ${errText}`);
  }

  const data = await res.json();
  return data.files || [];
};

/**
 * Generates a full state snapshot of products and customers
 */
export const createBackupStateSnapshot = async () => {
  // Fetch products
  const productsQuery = await getDocs(collection(db, 'products'));
  const products = productsQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  // Fetch customers
  const customersQuery = await getDocs(collection(db, 'customers'));
  const customers = customersQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    data: {
      products,
      customers
    }
  };
};

/**
 * Upload backup payload to INBOXA_COL_BACKUPS folder
 */
export const uploadBackupToGoogleDrive = async (
  token: string, 
  filename: string, 
  payload: any
): Promise<string> => {
  const folderId = await getOrCreateBackupFolder(token);
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // 1. Create file metadata in parent folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: filename,
      mimeType: 'application/json',
      parents: [folderId]
    })
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Error inicializando archivo de respaldo en Drive: ${errText}`);
  }

  const fileData = await createRes.json();
  const fileId = fileData.id;

  // 2. Stream content using Patch Upload type media
  const mediaRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!mediaRes.ok) {
    const errText = await mediaRes.text();
    throw new Error(`Error cargando contenido de respaldo: ${errText}`);
  }

  return fileId;
};

/**
 * Fetches content of a backup file
 */
export const getBackupFileContent = async (token: string, fileId: string): Promise<any> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error descargando contenido de respaldo: ${errText}`);
  }

  return await res.json();
};

/**
 * Restore data from snapshot payload
 */
export const restoreFromSnapshotPayload = async (payload: any): Promise<{ productsCount: number; customersCount: number }> => {
  if (!payload || !payload.data) {
    throw new Error('Formato de respaldo inválido.');
  }

  const { products, customers } = payload.data;
  let productsCount = 0;
  let customersCount = 0;

  // 1. Batch restoring products
  if (Array.isArray(products)) {
    const batch = writeBatch(db);
    for (const p of products) {
      if (p.id) {
        const docRef = doc(collection(db, 'products'), p.id);
        const { id, ...data } = p;
        batch.set(docRef, {
          ...data,
          updatedAt: serverTimestamp()
        }, { merge: true });
        productsCount++;
      }
    }
    await batch.commit();
  }

  // 2. Batch restoring customers
  if (Array.isArray(customers)) {
    const batch = writeBatch(db);
    for (const c of customers) {
      if (c.id) {
        const docRef = doc(collection(db, 'customers'), c.id);
        const { id, ...data } = c;
        batch.set(docRef, {
          ...data,
          updatedAt: serverTimestamp()
        }, { merge: true });
        customersCount++;
      }
    }
    await batch.commit();
  }

  return { productsCount, customersCount };
};

/**
 * Trash/Delete file in Google Drive
 */
export const deleteFileFromGoogleDrive = async (token: string, fileId: string): Promise<void> => {
  // Move to trash (safest) or permanently delete
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ trashed: true })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Error eliminando archivo de respaldo: ${errText}`);
  }
};
