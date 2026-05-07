import React from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  RefreshCw,
  Search
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { UserRole } from '../types';

interface InventoryViewProps {
  userRole?: UserRole;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ userRole = 'admin' }) => {
  const isAdmin = userRole === 'admin';

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

        {isAdmin && (
          <div className="flex gap-3 w-full lg:w-auto">
            <button className="flex-1 lg:flex-none btn-primary flex items-center justify-center gap-2">
              <Plus size={18} />
              Nuevo Producto
            </button>
            <button className="flex-1 lg:flex-none btn-primary bg-white/10 hover:bg-white/20 flex items-center justify-center gap-2">
              <FileSpreadsheet size={18} />
              Carga Drive
            </button>
          </div>
        )}
      </div>

      <div className="card-glass p-6 md:p-8 flex flex-col gap-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o SKU..." 
            className="input-field w-full pl-12"
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
              {[
                { name: 'Guantes Pro Red', sku: 'BOX-001', price: '$45.99', stock: 15, status: 'Normal' },
                { name: 'Pera Loca 2.0', sku: 'BOX-002', price: '$29.99', stock: 1, status: 'Bajo' },
                { name: 'Cabezal Foam', sku: 'BOX-003', price: '$55.00', stock: 24, status: 'Normal' },
                { name: 'Vendas Elásticas (Par)', sku: 'ACC-004', price: '$12.00', stock: 50, status: 'Normal' },
                { name: 'Saco Pesado 80lb', sku: 'GYM-005', price: '$120.00', stock: 3, status: 'Bajo' },
              ].map((item, idx) => (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={idx} 
                  className="group hover:bg-white/5"
                >
                  <td className="py-4 font-medium">{item.name}</td>
                  <td className="py-4 font-mono text-xs text-white/40 text-center">{item.sku}</td>
                  <td className="py-4 font-bold text-inboxa-coral text-center">{item.price}</td>
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
                      item.status === 'Bajo' ? "bg-inboxa-yellow/20 text-inboxa-yellow" : "bg-green-500/20 text-green-400"
                    )}>
                      {item.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="py-4 text-right">
                      <button className="p-2 opacity-0 group-hover:opacity-100 transition-all text-white/40 hover:text-white">
                        <RefreshCw size={16} />
                      </button>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
