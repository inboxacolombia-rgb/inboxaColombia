import Papa from 'papaparse';
import { db } from '../firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const INVENTORY_SHEET_ID = '1zLLBY2qzxmdPTAC9qrhfSYHilvA9GXZiKFpxPPf0SY0';
const CUSTOMER_SHEET_ID = '1cO-X-MiKA1xb2x09jbzx-61rQBnEk4JhPwD9mR6MewU';

const INVENTORY_CSV_URL = `https://docs.google.com/spreadsheets/d/${INVENTORY_SHEET_ID}/export?format=csv`;
const CUSTOMER_CSV_URL = `https://docs.google.com/spreadsheets/d/${CUSTOMER_SHEET_ID}/export?format=csv`;

export interface CustomerData {
  name: string;
  idNumber: string;
  phone: string;
  address: string;
  city: string;
}

// Case-insensitive key/header helper
const getVal = (row: any, keys: string[]): any => {
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    const matched = rowKeys.find(rk => rk.toLowerCase().trim() === k.toLowerCase().trim());
    if (matched !== undefined && row[matched] !== undefined) {
      return row[matched];
    }
  }
  return undefined;
};

// Robust price parser to handle Colombian/global dots & commas
const parsePrice = (val: any): number => {
  if (val === undefined || val === null) return 0;
  let str = String(val).trim();
  
  if (str.includes('.') && str.includes(',')) {
    const lastDot = str.lastIndexOf('.');
    const lastComma = str.lastIndexOf(',');
    if (lastDot > lastComma) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(/\./g, '').replace(/,/g, '.');
    }
  } else if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      str = str.replace(/\./g, '');
    }
  } else if (str.includes(',')) {
    const parts = str.split(',');
    if (parts.length > 1 && parts[parts.length - 1].length === 3) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(/,/g, '.');
    }
  }
  
  str = str.replace(/[^0-9.]/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

// Robust integer parser
const parseStock = (val: any): number => {
  if (val === undefined || val === null) return 0;
  let str = String(val).trim();
  str = str.replace(/[^0-9]/g, '');
  const num = parseInt(str, 10);
  return isNaN(num) ? 0 : num;
};

export const syncFromGoogleSheets = async (): Promise<{ success: boolean; count: number; error?: string }> => {
  const WEB_APP_URL = import.meta.env.VITE_GOOGLE_SHEETS_WEBAPP_URL;
  
  if (!WEB_APP_URL) {
    console.warn("Inventory Sync: VITE_GOOGLE_SHEETS_WEBAPP_URL not set. Falling back to CSV URLs.");
  }
  
  try {
    let importedCount = 0;
    
    // 1. Try to sync from Web App URL first if available
    if (WEB_APP_URL) {
      try {
        const response = await fetch(WEB_APP_URL);
        const data = await response.json();
        
        if (Array.isArray(data)) {
          for (const row of data) {
            // Get possible keys
            const pCode = getVal(row, ['sku', 'code', 'codigo', 'código', 'id', 'cod', 'cód']);
            const pName = getVal(row, ['nombre', 'name', 'producto', 'product', 'articulo', 'artículo']);
            const priceVal = getVal(row, ['precio', 'price', 'venta', 'valor', 'costo', 'precio de venta', 'precios']);
            const stockVal = getVal(row, ['stock', 'cantidad', 'existencias', 'inventario', 'cant']);
            const imageUrlVal = getVal(row, ['imagen', 'image', 'imageurl', 'foto', 'link', 'imagen url', 'url de imagen', 'url']);

            const custId = getVal(row, ['cédula', 'cedula', 'idnumber', 'identificacion', 'identificación']);
            const custName = getVal(row, ['nombre', 'name', 'cliente', 'customer']);
            const custPhone = getVal(row, ['teléfono', 'telefono', 'celular', 'phone', 'tel']);
            const custAddress = getVal(row, ['dirección', 'direccion', 'address', 'dir']);
            const custCity = getVal(row, ['ciudad', 'city', 'pueblo', 'municipio']);

            // Detect if row represents a Product
            const isProduct = pCode && pName && (
              priceVal !== undefined || 
              stockVal !== undefined || 
              getVal(row, ['sku', 'codigo', 'código', 'cod', 'cód']) !== undefined
            );

            if (isProduct) {
              const productRef = doc(db, 'products', String(pCode).trim());
              await setDoc(productRef, {
                code: String(pCode).trim(),
                name: String(pName).trim(),
                price: parsePrice(priceVal),
                stock: parseStock(stockVal),
                imageUrl: imageUrlVal ? String(imageUrlVal).trim() : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
                updatedAt: serverTimestamp()
              }, { merge: true });
              importedCount++;
            } else if ((custId || custPhone) && custName) {
              const idVal = String(custId || custPhone).trim();
              const customerRef = doc(db, 'customers', idVal);
              await setDoc(customerRef, {
                idNumber: idVal,
                name: String(custName).trim(),
                phone: custPhone ? String(custPhone).trim() : '',
                address: custAddress ? String(custAddress).trim() : '',
                city: custCity ? String(custCity).trim() : '',
                fidelity: 'Conocido',
                updatedAt: serverTimestamp(),
                source: 'GoogleSheet-WebApp'
              }, { merge: true });
              importedCount++;
            }
          }
          return { success: true, count: importedCount };
        }
      } catch (e) {
        console.warn("Web App GET sync failed, falling back to direct CSV files:", e);
      }
    }

    // 2. Direct CSV Import logic for both Sheets
    const parseCsvUrl = (url: string): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        Papa.parse(url, {
          download: true,
          header: true,
          skipEmptyLines: true,
          complete: (results) => resolve(results.data),
          error: (err) => reject(err)
        });
      });
    };

    // Load Products
    try {
      console.log("Fetching products CSV...");
      const productRows = await parseCsvUrl(INVENTORY_CSV_URL);
      for (const row of productRows) {
        const pCode = getVal(row, ['sku', 'code', 'codigo', 'código', 'id', 'cod', 'cód']);
        const pName = getVal(row, ['nombre', 'name', 'producto', 'product', 'articulo', 'artículo']);
        const priceVal = getVal(row, ['precio', 'price', 'venta', 'valor', 'costo', 'precio de venta', 'precios']);
        const stockVal = getVal(row, ['stock', 'cantidad', 'existencias', 'inventario', 'cant']);
        const imageUrlVal = getVal(row, ['imagen', 'image', 'imageurl', 'foto', 'link', 'imagen url', 'url de imagen', 'url']);

        if (pCode && pName) {
          const productRef = doc(db, 'products', String(pCode).trim());
          const imageUrl = imageUrlVal ? String(imageUrlVal).trim() : 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
          await setDoc(productRef, {
            code: String(pCode).trim(),
            name: String(pName).trim(),
            price: parsePrice(priceVal),
            stock: parseStock(stockVal),
            imageUrl: imageUrl,
            updatedAt: serverTimestamp()
          }, { merge: true });
          importedCount++;
        }
      }
    } catch (productError) {
      console.error("Error syncing products Google Sheet:", productError);
    }

    // Load Customers
    try {
      console.log("Fetching customers CSV...");
      const customerRows = await parseCsvUrl(CUSTOMER_CSV_URL);
      for (const row of customerRows) {
        const custId = getVal(row, ['cédula', 'cedula', 'idnumber', 'identificacion', 'identificación']);
        const custName = getVal(row, ['nombre', 'name', 'cliente', 'customer']);
        const custPhone = getVal(row, ['teléfono', 'telefono', 'celular', 'phone', 'tel']);
        const custAddress = getVal(row, ['dirección', 'direccion', 'address', 'dir']);
        const custCity = getVal(row, ['ciudad', 'city', 'pueblo', 'municipio']);

        if (custName && (custId || custPhone)) {
          const idVal = String(custId || custPhone).trim();
          const customerRef = doc(db, 'customers', idVal);
          await setDoc(customerRef, {
            idNumber: idVal,
            name: String(custName).trim(),
            phone: custPhone ? String(custPhone).trim() : '',
            address: custAddress ? String(custAddress).trim() : '',
            city: custCity ? String(custCity).trim() : '',
            fidelity: 'Conocido',
            updatedAt: serverTimestamp(),
            source: 'GoogleSheet-CSV'
          }, { merge: true });
          importedCount++;
        }
      }
    } catch (customerError) {
      console.error("Error syncing customers Google Sheet:", customerError);
    }

    return { success: true, count: importedCount };
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
