import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  FileSpreadsheet, 
  Plus, 
  AlertTriangle,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

export const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'finance' | 'inventory'>('finance');

  const stats = [
    { label: 'Ventas Totales', value: '$12,450.00', icon: TrendingUp, delta: '+12.5%', color: 'text-green-400' },
    { label: 'Pedidos en Mora', value: '5', icon: AlertTriangle, delta: '+2 hoy', color: 'text-inboxa-coral' },
    { label: 'Vendedores Activos', value: '8', icon: Users, delta: 'Live ahora', color: 'text-blue-400' },
  ];

  return (
    <div className="flex flex-col gap-8 p-4 lg:p-8 h-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold">Panel Administrativo</h2>
          <p className="text-white/60">Control total de ingresos, logística e inventario.</p>
        </div>
        
        <div className="flex bg-inboxa-dark p-1 rounded-lg border border-white/10">
          <button 
            onClick={() => setActiveTab('finance')}
            className={cn(
              "px-6 py-2 rounded-md font-medium transition-all",
              activeTab === 'finance' ? "bg-inboxa-coral text-white shadow-lg" : "text-white/40 hover:text-white"
            )}
          >
            Finanzas
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={cn(
              "px-6 py-2 rounded-md font-medium transition-all",
              activeTab === 'inventory' ? "bg-inboxa-coral text-white shadow-lg" : "text-white/40 hover:text-white"
            )}
          >
            Inventario
          </button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={stat.label}
            className="card-glass p-6 flex flex-col gap-4"
          >
            <div className="flex justify-between items-start">
              <div className="p-3 bg-white/5 rounded-xl text-white/60">
                <stat.icon size={24} />
              </div>
              <span className={cn("text-xs font-bold px-2 py-1 bg-white/5 rounded", stat.color)}>
                {stat.delta}
              </span>
            </div>
            <div>
              <p className="text-sm text-white/40 font-medium">{stat.label}</p>
              <h4 className="text-3xl font-display font-bold mt-1">{stat.value}</h4>
            </div>
          </motion.div>
        ))}
      </div>

      {activeTab === 'finance' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Revenue by Seller */}
          <div className="card-glass p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 size={20} className="text-inboxa-coral" />
              Ingresos por Vendedor (Mes)
            </h3>
            <div className="space-y-6">
              {[
                { name: 'Sebastian (Ventas Live)', amount: '$4,200', pct: 80 },
                { name: 'Andrea M.', amount: '$3,100', pct: 60 },
                { name: 'Carlos Gomez', amount: '$2,850', pct: 55 },
              ].map(seller => (
                <div key={seller.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{seller.name}</span>
                    <span className="font-bold text-inboxa-coral">{seller.amount}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${seller.pct}%` }}
                      className="h-full bg-inboxa-coral" 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Semaphore (Mora) */}
          <div className="card-glass p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <AlertTriangle size={20} className="text-inboxa-yellow" />
              Semáforo de Pagos Mora
            </h3>
            <div className="space-y-4">
              {[
                { id: 'ORD-098', customer: 'Lina Ortiz', days: 5, amount: '$150.00' },
                { id: 'ORD-101', customer: 'Camilo R.', days: 4, amount: '$76.00' },
                { id: 'ORD-095', customer: 'Juan Soto', days: 3, amount: '$210.00' },
              ].map(order => (
                <div key={order.id} className="flex items-center gap-4 p-4 bg-inboxa-coral/10 border border-inboxa-coral/20 rounded-xl animate-pulse">
                  <div className="p-3 bg-inboxa-coral text-white rounded-lg">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{order.customer} - {order.id}</h4>
                    <p className="text-xs text-inboxa-coral/80 font-medium">{order.days} días sin acuse de pago</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{order.amount}</p>
                    <button className="text-[10px] uppercase font-bold text-white/40 hover:text-white transition-all underline">Gestionar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="card-glass p-8 flex flex-col gap-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold">Gestión de Inventario Dinámico</h3>
              <p className="text-sm text-white/40">Sincronización bidireccional con Google Drive (Excel).</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none btn-primary flex items-center justify-center gap-2">
                <Plus size={18} />
                Nuevo Producto
              </button>
              <button className="flex-1 md:flex-none btn-primary bg-white/10 hover:bg-white/20 flex items-center justify-center gap-2">
                <FileSpreadsheet size={18} />
                Carga Drive
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-xs font-bold uppercase tracking-widest text-white/40">
                  <th className="pb-4 pt-2">Producto</th>
                  <th className="pb-4 pt-2">SKU</th>
                  <th className="pb-4 pt-2">Precio</th>
                  <th className="pb-4 pt-2">Stock Actual</th>
                  <th className="pb-4 pt-2">Status</th>
                  <th className="pb-4 pt-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { name: 'Guantes Pro Red', sku: 'BOX-001', price: '$45.99', stock: 15, status: 'Normal' },
                  { name: 'Pera Loca 2.0', sku: 'BOX-002', price: '$29.99', stock: 1, status: 'Bajo' },
                  { name: 'Cabezal Foam', sku: 'BOX-003', price: '$55.00', stock: 24, status: 'Normal' },
                ].map((item, idx) => (
                  <tr key={idx} className="group hover:bg-white/5">
                    <td className="py-4 font-medium">{item.name}</td>
                    <td className="py-4 font-mono text-xs text-white/40">{item.sku}</td>
                    <td className="py-4 font-bold text-inboxa-coral">{item.price}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{item.stock}</span>
                        <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
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
                    <td className="py-4 text-right">
                      <button className="p-2 opacity-0 group-hover:opacity-100 transition-all text-white/40 hover:text-white">
                        <RefreshCw size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
