import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  RefreshCw,
  Search,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { UserRole, Product } from '../types';
import { syncFromGoogleSheets } from '../services/googleSheetsService';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';

interface InventoryViewProps {
  userRole?: UserRole;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ userRole = 'admin' }) => {
  const isAdmin = userRole === 'admin';
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'products'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (data.length > 0) {
        setProducts(data);
      } else {
        // Fallback to mock data if Firestore is empty
        setProducts([
          { name: 'Combo Hidro Percutor', sku: 'HIDRO-PERC', price: 185000, stock: 15, status: 'Normal' },
          { name: 'Combo Pintura Percutor', sku: 'PINT-PERC', price: 230000, stock: 10, status: 'Normal' },
          { name: 'Combo Secador + Plancha', sku: 'SEC-PLAN', price: 100000, stock: 25, status: 'Normal' },
          { name: 'Parlante Flip 7', sku: 'FLIP-7', price: 80000, stock: 30, status: 'Normal' },
          { name: 'Masajeador 3 Cabezas', sku: 'MASAJ-3C', price: 70000, stock: 15, status: 'Bajo' },
        ]);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error loading products via onSnapshot:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    const result = await syncFromGoogleSheets();
    if (result.success) {
      alert(`Sincronización exitosa: ${result.count} elementos sincronizados.`);
    } else {
      alert(`Error en sincronización: ${result.error}`);
    }
    setSyncing(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku || p.code || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 h-full">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-10 lg:pt-0">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <img 
              src="/logo/logo%20inboxa.jpg" 
              alt="INBOXA Logo" 
              className="w-28 h-auto max-h-28 object-contain rounded-xl mb-4 lg:hidden shadow-lg border border-white/10"
            />
            <h2 className="text-3xl font-display font-bold">Control de Inventario</h2>
            <p className="text-white/60">Consulta de stock y catálogo de productos en tiempo real.</p>
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            <button 
              onClick={handleSync}
              disabled={syncing}
              className="flex-1 lg:flex-none btn-primary bg-white/10 hover:bg-white/20 flex items-center justify-center gap-2"
            >
              {syncing ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
              {syncing ? 'Sincronizando...' : 'Carga Drive'}
            </button>
            {isAdmin && (
              <button className="flex-1 lg:flex-none btn-primary flex items-center justify-center gap-2">
                <Plus size={18} />
                Nuevo
              </button>
            )}
          </div>
        </div>

        <div className="card-glass p-6 md:p-8 flex flex-col gap-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o SKU..." 
              className="input-field w-full pl-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-widest text-white/40">
                  <th className="pb-4 pt-2">Producto</th>
                  <th className="pb-4 pt-2 text-center">SKU</th>
                  <th className="pb-4 pt-2 text-center">Precio</th>
                  <th className="pb-4 pt-2">Stock Actual</th>
                  <th className="pb-4 pt-2">Status</th>
                  {isAdmin && <th className="pb-4 pt-2"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((item, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      key={item.sku || idx} 
                      className="group hover:bg-white/5"
                    >
                      <td className="py-4 font-medium">{item.name}</td>
                      <td className="py-4 font-mono text-xs text-white/40 text-center">{item.sku || item.code}</td>
                      <td className="py-4 font-bold text-inboxa-coral text-center">
                        ${typeof item.price === 'number' ? item.price : item.price}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold w-6">{item.stock}</span>
                          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={cn("h-full", item.stock < 10 ? "bg-inboxa-yellow" : "bg-green-500")} 
                              style={{ width: `${Math.min(item.stock * 4, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                          item.stock < 10 ? "bg-inboxa-yellow/20 text-inboxa-yellow" : "bg-green-500/20 text-green-400"
                        )}>
                          {item.stock < 10 ? 'Bajo' : 'Normal'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-4 text-right">
                          <button 
                            onClick={handleSync}
                            className="p-2 opacity-0 group-hover:opacity-100 transition-all text-white/40 hover:text-white"
                            title="Sincronizar ahora"
                          >
                            <RefreshCw size={16} />
                          </button>
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-inboxa-coral" size={32} />
              </div>
            )}
            {!loading && filteredProducts.length === 0 && (
              <div className="text-center py-12 text-white/20 uppercase tracking-widest text-xs font-bold">
                No se encontraron productos
              </div>
            )}
          </div>
        </div>
    </div>
  );
};
