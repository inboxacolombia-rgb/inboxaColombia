import Papa from 'papaparse';
import { db } from '../firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const SHEET_ID = '1cO-X-MiKA1xb2x09jbzx-61rQBnEk4JhPwD9mR6MewU';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv`;

export interface CustomerData {
  name: string;
  idNumber: string;
  phone: string;
  address: string;
  city: string;
}

export const syncFromGoogleSheets = async (): Promise<{ success: boolean; count: number; error?: string }> => {
  const WEB_APP_URL = import.meta.env.VITE_GOOGLE_SHEETS_WEBAPP_URL;
  
  if (!WEB_APP_URL) {
    console.warn("Inventory Sync: VITE_GOOGLE_SHEETS_WEBAPP_URL not set. Falling back to CSV.");
  }
  
  try {
    // Try to sync from Web App URL first if available
    if (WEB_APP_URL) {
      try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        
        if (Array.isArray(data)) {
          let importedCount = 0;
          for (const row of data) {
            const idNumber = row.Cédula || row.Identificacion || row.idNumber || row.ID;
            const name = row.Nombre || row.name;
            
            if (idNumber && name) {
              // It's a Customer
              const customerRef = doc(db, 'customers', String(idNumber).trim());
              await setDoc(customerRef, {
                idNumber: String(idNumber).trim(),
                name: String(name).trim(),
                phone: String(row.Teléfono || row.phone || row.Celular || '').trim(),
                address: String(row.Dirección || row.address || '').trim(),
                city: String(row.Ciudad || row.city || '').trim(),
                fidelity: 'Conocido',
                updatedAt: serverTimestamp(),
                source: 'GoogleSheet-WebApp'
              }, { merge: true });
              importedCount++;
            } else if (row.SKU || row.Code || row.Codigo) {
              // It's a Product
              const code = (row.SKU || row.Code || row.Codigo || '').trim();
              const pName = (row.Nombre || row.Name || row.Product || '').trim();
              if (code && pName) {
                const productRef = doc(db, 'products', code);
                await setDoc(productRef, {
                  code: code,
                  name: pName,
                  price: parseFloat(row.Precio || row.Price || 0),
                  stock: parseInt(row.Stock || row.Cantidad || 0),
                  imageUrl: row.Imagen || row.Image || row.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
                  updatedAt: serverTimestamp()
                }, { merge: true });
                importedCount++;
              }
            }
          }
          return { success: true, count: importedCount };
        }
      } catch (e) {
        console.warn("Web App GET sync failed, falling back to CSV:", e);
      }
    }

    // Fallback to direct CSV export
    const response = await fetch(CSV_URL);
    const csvData = await response.text();
    
    return new Promise((resolve) => {
      Papa.parse(csvData, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data as any[];
          let importedCount = 0;

          for (const row of rows) {
            const idNumber = row.Cédula || row.Identificacion || row.ID;
            const name = row.Nombre || row.name;
            
            if (idNumber && name) {
              // It's a Customer
              const customerRef = doc(db, 'customers', String(idNumber).trim());
              await setDoc(customerRef, {
                idNumber: String(idNumber).trim(),
                name: String(name).trim(),
                phone: String(row.Teléfono || row.phone || row.Celular || '').trim(),
                address: String(row.Dirección || row.address || '').trim(),
                city: String(row.Ciudad || row.city || '').trim(),
                fidelity: 'Conocido',
                updatedAt: serverTimestamp(),
                source: 'GoogleSheet-CSV'
              }, { merge: true });
              importedCount++;
            } else if (row.SKU || row.Code || row.Codigo) {
              // It's a Product
              const code = (row.SKU || row.Code || row.Codigo || '').trim();
              const pName = (row.Nombre || row.Name || row.Product || '').trim();
              if (code && pName) {
                const productRef = doc(db, 'products', code);
                await setDoc(productRef, {
                  code: code,
                  name: pName,
                  price: parseFloat(row.Precio || row.Price || 0),
                  stock: parseInt(row.Stock || row.Cantidad || 0),
                  imageUrl: row.Imagen || row.Image || row.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
                  updatedAt: serverTimestamp()
                }, { merge: true });
                importedCount++;
              }
            }
          }
          resolve({ success: true, count: importedCount });
        },
        error: (error: any) => {
          resolve({ success: false, count: 0, error: error.message });
        }
      });
    });
  } catch (error: any) {
    console.error("Sheets Sync Error:", error);
    return { success: false, count: 0, error: error.message };
  }
};

/**
 * To enable writing TO Google Sheets, we need a Google Apps Script Web App.
 * Instructions for the user:
 * 1. Open your Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste the provided script (I will provide this in the chat)
 * 4. Deploy > New Deployment > Web App (Set "Who has access" to "Anyone")
 * 5. Provide the URL here or via env variable.
 */
export interface OrderData extends CustomerData {
  total: number;
  items: string; // Concatenated items for the sheet
  paymentMethod: string;
  sellerName: string;
  shippingCost: number;
}

export const writeToGoogleSheets = async (data: OrderData) => {
  const WEB_APP_URL = import.meta.env.VITE_GOOGLE_SHEETS_WEBAPP_URL;
  if (!WEB_APP_URL) {
    console.warn("Google Sheets Sync: VITE_GOOGLE_SHEETS_WEBAPP_URL not set. Order not pushed to Sheets.");
    return;
  }

  console.log("Pushing full order to Google Sheets:", data.idNumber);
  try {
    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        orderId: Math.random().toString(36).substring(7).toUpperCase()
      })
    });
    console.log("Google Sheets response:", response.type);
  } catch (err) {
    console.error("Error writing to Sheet:", err);
  }
};
