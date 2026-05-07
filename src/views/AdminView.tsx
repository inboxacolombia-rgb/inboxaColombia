import React, { useState } from 'react';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  FileSpreadsheet, 
  Plus, 
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  User,
  CreditCard,
  X,
  RefreshCcw
} from 'lucide-react';
import { syncFromGoogleSheets } from '../services/googleSheetsService';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { InventoryView } from './InventoryView';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Order } from '../types';

export const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'finance' | 'inventory' | 'sales' | 'customers'>('finance');
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    const result = await syncFromGoogleSheets();
    setIsSyncing(false);
    if (result.success) {
      alert(`Sincronización exitosa: ${result.count} clientes actualizados desde Google Sheets.`);
    } else {
      alert(`Error al sincronizar: ${result.error || 'Verifica que el Spreadsheet sea público'}`);
    }
  };

  const handleExportCSV = () => {
    const csvData = customers.map(c => ({
      Nombre: c.name,
      Identificacion: c.idNumber,
      Telefono: c.phone || '',
      Direccion: c.address || '',
      Ciudad: c.city || '',
      Fidelidad: c.fidelity || 'Nuevo',
      Ultima_Compra: c.lastOrderAt ? new Date(c.lastOrderAt.seconds * 1000).toLocaleDateString() : 'N/A'
    }));
    
    // We'll use a simple CSV generation if Papa is not easily imported here
    const headers = Object.keys(csvData[0] || {}).join(',');
    const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `base_clientes_inboxa_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  React.useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        setOrders(ordersData);
      },
      (error) => {
        console.error("Admin listener error:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (activeTab === 'customers') {
      const q = query(collection(db, 'customers'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const customersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCustomers(customersData);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  const stats = [
    { label: 'Ventas Totales', value: `$${orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}`, icon: TrendingUp, delta: `+${orders.length} pedidos`, color: 'text-green-400' },
    { label: 'Pendientes Pago', value: orders.filter(o => o.paymentStatus === 'Pendiente').length.toString(), icon: AlertTriangle, delta: 'Acción requerida', color: 'text-inboxa-coral' },
    { label: 'Recaudado hoy', value: `$${orders.filter(o => o.paymentStatus === 'Pagado').reduce((sum, o) => sum + o.total, 0).toFixed(2)}`, icon: DollarSign, delta: 'Pagos confirmados', color: 'text-white/60' },
  ];

  const updatePaymentStatus = async (orderId: string, status: 'Pagado' | 'Rechazado' | 'Pendiente') => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        paymentStatus: status,
        paidAt: status === 'Pagado' ? serverTimestamp() : null,
        updatedAt: serverTimestamp()
      });
      setSelectedOrder(null);
    } catch (error) {
      console.error("Error updating payment:", error);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-4 lg:p-8 h-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-10 lg:pt-0">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          <img 
            src="/logo/logo%20inboxa.jpg" 
            alt="INBOXA Logo" 
            className="w-28 h-auto max-h-28 object-contain rounded-xl mb-4 lg:hidden shadow-lg border border-white/10"
          />
          <h2 className="text-3xl font-display font-bold">Panel Administrativo</h2>
          <p className="text-white/60">Control total de ingresos, logística e inventario.</p>
        </div>
        
        <div className="flex bg-inboxa-dark p-1 rounded-lg border border-white/10 mx-auto lg:mx-0 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('finance')}
            className={cn(
              "px-6 py-2 rounded-md font-medium transition-all whitespace-nowrap",
              activeTab === 'finance' ? "bg-inboxa-coral text-white shadow-lg" : "text-white/40 hover:text-white"
            )}
          >
            Tablero
          </button>
          <button 
            onClick={() => setActiveTab('sales')}
            className={cn(
              "px-6 py-2 rounded-md font-medium transition-all whitespace-nowrap",
              activeTab === 'sales' ? "bg-inboxa-coral text-white shadow-lg" : "text-white/40 hover:text-white"
            )}
          >
            Gestión Pagos
          </button>
          <button 
            onClick={() => setActiveTab('inventory')}
            className={cn(
              "px-6 py-2 rounded-md font-medium transition-all whitespace-nowrap",
              activeTab === 'inventory' ? "bg-inboxa-coral text-white shadow-lg" : "text-white/40 hover:text-white"
            )}
          >
            Inventario
          </button>
          <button 
            onClick={() => setActiveTab('customers')}
            className={cn(
              "px-6 py-2 rounded-md font-medium transition-all whitespace-nowrap",
              activeTab === 'customers' ? "bg-inboxa-coral text-white shadow-lg" : "text-white/40 hover:text-white"
            )}
          >
            Clientes
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
              Ingresos por Vendedor (Real)
            </h3>
            <div className="space-y-6">
              {Array.from(orders.reduce((acc, order) => {
                const seller = order.sellerName || 'Vendedor Desconocido';
                acc.set(seller, (acc.get(seller) || 0) + order.total);
                return acc;
              }, new Map<string, number>())).map(([name, total]) => (
                <div key={name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{name}</span>
                    <span className="font-bold text-inboxa-coral">${total.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (total / 1000) * 100)}%` }}
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
              Acuses de Pago Pendientes
            </h3>
            <div className="space-y-4">
              {orders.filter(o => o.paymentStatus === 'Pendiente').slice(0, 5).map(order => (
                <div key={order.id} className="flex items-center gap-4 p-4 bg-inboxa-coral/10 border border-inboxa-coral/20 rounded-xl">
                  <div className="p-3 bg-inboxa-coral text-white rounded-lg">
                    <CreditCard size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm">{order.customerName} - {order.id.slice(-6).toUpperCase()}</h4>
                    <p className="text-xs text-inboxa-coral/80 font-medium">Esperando confirmación de {order.paymentMethod === 'cod' ? 'Efectivo' : 'Transferencia'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${order.total.toFixed(2)}</p>
                    <button 
                      onClick={() => {
                        setSelectedOrder(order);
                        setActiveTab('sales');
                      }}
                      className="text-[10px] uppercase font-bold text-white/40 hover:text-white transition-all underline"
                    >
                      Gestionar
                    </button>
                  </div>
                </div>
              ))}
              {orders.filter(o => o.paymentStatus === 'Pendiente').length === 0 && (
                <div className="py-10 text-center opacity-20">
                  <CheckCircle2 size={48} className="mx-auto mb-2" />
                  <p>Todos los pagos al día</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'customers' ? (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/10">
            <div className="flex flex-col">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <RefreshCcw size={20} className="text-inboxa-coral" />
                Sincronización de Clientes
              </h3>
              <p className="text-xs text-white/40">Importa la base de datos de clientes desde tu Google Sheet.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all bg-white/5 border border-white/10 hover:bg-white/10 text-white"
              >
                <FileSpreadsheet size={16} /> Exportar CSV
              </button>
              <button 
                onClick={handleSync}
                disabled={isSyncing}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all",
                  isSyncing ? "bg-white/10 text-white/20 cursor-wait" : "bg-inboxa-coral hover:bg-inboxa-coral/80 text-white shadow-lg shadow-inboxa-coral/20"
                )}
              >
                {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Ahora'}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
              <input 
                type="text"
                placeholder="Buscar clientes por nombre o cédula..."
                className="input-field w-full pl-12 h-12 bg-white/5"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="card-glass overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-[10px] uppercase font-black tracking-widest text-white/40">
                  <th className="px-6 py-4">Nombre</th>
                  <th className="px-6 py-4">Identificación</th>
                  <th className="px-6 py-4">Celular</th>
                  <th className="px-6 py-4">Ubicación</th>
                  <th className="px-6 py-4">Última Compra</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {customers
                  .filter(c => 
                    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    c.idNumber.includes(searchTerm)
                  )
                  .map((customer) => (
                    <tr key={customer.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold">{customer.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-mono text-sm text-white/60">{customer.idNumber}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm">{customer.phone}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{customer.city}</span>
                          <span className="text-[10px] text-white/40">{customer.address}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-white/40">
                          {customer.lastOrderAt ? new Date(customer.lastOrderAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </p>
                      </td>
                    </tr>
                  ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-white/20">
                      No hay clientes registrados aún. Se guardarán automáticamente al confirmar pedidos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'sales' ? (
        <div className="flex flex-col gap-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
            <input 
              type="text"
              placeholder="Buscar por cliente, ID o vendedor..."
              className="input-field w-full pl-12 h-14 bg-white/5"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {orders.filter(o => o.customerName.toLowerCase().includes(searchTerm.toLowerCase())).map((order) => (
              <motion.div
                layout
                key={order.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSelectedOrder(order)}
                className="card-glass p-6 cursor-pointer hover:border-white/20 transition-all space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-black uppercase text-white/20">#{order.id.slice(-8).toUpperCase()}</p>
                    <h4 className="font-bold mt-1">{order.customerName}</h4>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                    order.paymentStatus === 'Pagado' ? "bg-green-500/20 text-green-400" :
                    order.paymentStatus === 'Rechazado' ? "bg-red-500/20 text-red-400" :
                    "bg-inboxa-yellow/20 text-inboxa-yellow"
                  )}>
                    {order.paymentStatus}
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-white/40">Vendedor: {order.sellerName}</span>
                  <span className="font-black text-inboxa-coral">${order.total.toFixed(2)}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-white/40 border-t border-white/5 pt-3">
                  <CreditCard size={14} /> 
                  <span className="uppercase tracking-widest">{order.paymentMethod === 'cod' ? 'Contra Entrega' : 'Transferencia'}</span>
                </div>
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {selectedOrder && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setSelectedOrder(null)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] w-full max-w-lg p-6"
                >
                  <div className="bg-inboxa-dark border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/10 flex justify-between items-center">
                      <h3 className="text-xl font-bold uppercase tracking-tighter">Detalle de Pago</h3>
                      <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-white/5 rounded-lg">
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="p-8 space-y-8">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs text-white/40 uppercase font-black">Cliente</p>
                          <p className="text-xl font-bold">{selectedOrder.customerName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white/40 uppercase font-black">Total</p>
                          <p className="text-2xl font-black text-inboxa-coral">${selectedOrder.total.toFixed(2)}</p>
                          {selectedOrder.shippingCost && selectedOrder.shippingCost > 0 && (
                            <p className="text-[10px] text-white/20 font-bold uppercase mt-1">Incluye ${selectedOrder.shippingCost.toFixed(2)} de envío</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-2xl">
                          <p className="text-[10px] text-white/40 uppercase font-black mb-1">Método</p>
                          <p className="text-sm font-bold flex items-center gap-2">
                            <CreditCard size={14} className="text-inboxa-coral" />
                            {selectedOrder.paymentMethod === 'cod' ? 'Contra Entrega' : 'Transferencia'}
                          </p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl">
                          <p className="text-[10px] text-white/40 uppercase font-black mb-1">Vendedor</p>
                          <p className="text-sm font-bold flex items-center gap-2">
                            <User size={14} className="text-inboxa-coral" />
                            {selectedOrder.sellerName}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs font-black uppercase text-white/20 tracking-widest text-center">Gestionar Acuse de Pago</p>
                        <div className="flex flex-col gap-3">
                          <button 
                            onClick={() => updatePaymentStatus(selectedOrder.id, 'Pagado')}
                            className="w-full h-14 bg-green-500 hover:bg-green-600 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest"
                          >
                            <CheckCircle2 size={24} /> Confirmar Pago
                          </button>
                          <button 
                            onClick={() => updatePaymentStatus(selectedOrder.id, 'Rechazado')}
                            className="w-full h-14 bg-white/5 hover:bg-inboxa-coral/20 hover:text-inboxa-coral border border-white/10 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest transition-all"
                          >
                            <XCircle size={24} /> Rechazar/Anular
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <InventoryView userRole="admin" />
      )}
    </div>
  );
};
