import React, { useState } from 'react';
import { Package, Truck, ClipboardList, User, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Order, OrderStatus } from '@/src/types';
import { db, auth } from '../firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Bell, Hash, CreditCard, Building2, CheckCircle2, X } from 'lucide-react';

export const WarehouseView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);

  React.useEffect(() => {
    // Escuchar pedidos en tiempo real
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      
      setOrders(ordersData);
      setLoading(false);
    }, (error) => {
      console.error("Warehouse listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // Sin dependencias para que sea estable

  const updateStatus = async (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus = currentStatus;
    if (currentStatus === 'Solicitado') nextStatus = 'Validado';
    else if (currentStatus === 'Validado') nextStatus = 'En Preparación';
    else if (currentStatus === 'En Preparación') nextStatus = 'Despachado';

    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: nextStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 h-full relative">
      <AnimatePresence>
        {newOrderAlert && (
          <motion.div 
            initial={{ opacity: 0, y: -100, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -100, x: '-50%' }}
            className="fixed top-0 left-1/2 z-[100] w-full max-w-md"
          >
            <div className="bg-inboxa-coral p-1 rounded-2xl shadow-2xl">
              <div className="bg-inboxa-dark p-6 rounded-[14px] flex flex-col gap-4 border border-white/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-inboxa-coral flex items-center justify-center animate-pulse">
                    <Bell size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl uppercase tracking-tighter">¡Nuevo Pedido!</h3>
                    <p className="text-white/40 text-xs">Un vendedor acaba de cerrar una venta.</p>
                  </div>
                  <button onClick={() => setNewOrderAlert(null)} className="ml-auto p-2 hover:bg-white/5 rounded-lg">
                    <X size={20} />
                  </button>
                </div>
                <div className="bg-white/5 p-4 rounded-xl space-y-2">
                  <p className="font-bold text-lg">{newOrderAlert.customerName}</p>
                  <p className="text-white/60 text-sm flex items-center gap-2"><Truck size={14} /> {newOrderAlert.customerCity}</p>
                  <p className="text-inboxa-coral font-black">{newOrderAlert.items.length} Productos</p>
                </div>
                <button 
                  onClick={() => {
                    const el = document.getElementById(`order-${newOrderAlert.id}`);
                    el?.scrollIntoView({ behavior: 'smooth' });
                    setNewOrderAlert(null);
                  }}
                  className="btn-primary h-12 w-full font-bold uppercase tracking-widest text-sm"
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-2 pt-10 lg:pt-0 items-center lg:items-start text-center lg:text-left">
        <img 
          src="/logo/logo%20inboxa.jpg" 
          alt="INBOXA Logo" 
          className="w-24 h-auto max-h-24 object-contain rounded-xl mb-4 lg:hidden shadow-lg border border-white/10"
        />
        <h2 className="text-2xl font-display font-bold">Gestión de Bodega</h2>
        <p className="text-white/60">Lista de pedidos listos para empaque y despacho.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="col-span-full py-20 flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-white/10 border-t-inboxa-coral rounded-full animate-spin" />
              <p className="text-white/40 font-bold uppercase tracking-widest">Cargando Pedidos...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <p className="text-white/20 text-lg">No hay pedidos registrados.</p>
            </div>
          ) : orders.map((order) => (
            <motion.div
              layout
              id={`order-${order.id}`}
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-glass flex flex-col overflow-hidden group"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">ID Pedido</span>
                  <p className="font-mono text-lg font-bold text-inboxa-coral">{order.id.slice(-8).toUpperCase()}</p>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                  order.status === 'Solicitado' ? "bg-white/10 text-white/60" :
                  order.status === 'Validado' ? "bg-green-500/20 text-green-400" : 
                  "bg-inboxa-yellow/20 text-inboxa-yellow"
                )}>
                  {order.status}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 space-y-6">
                {/* Customer Info for Labeling */}
                <div className="space-y-4 bg-white/5 p-4 rounded-xl border border-white/5 group-hover:border-inboxa-coral/30 transition-all">
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-inboxa-coral" />
                    <div>
                      <h4 className="font-bold text-sm leading-tight">{order.customerName}</h4>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Hash size={8} /> {order.customerIdNumber}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-black text-white/20">Celular</p>
                      <p className="text-xs font-bold">{order.customerPhone}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-black text-white/20">Ciudad</p>
                      <p className="text-xs font-bold">{order.customerCity}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <p className="text-[10px] uppercase font-black text-white/20">Dirección</p>
                      <p className="text-xs font-bold leading-tight">{order.customerAddress}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-black text-white/20">Pago</p>
                      <p className="text-xs font-bold uppercase flex items-center gap-1">
                        <CreditCard size={10} /> {order.paymentMethod === 'cod' ? 'Contra Entrega' : 'Transferencia'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-3">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold block">Items a Empacar</span>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                        <div className="w-8 h-8 rounded bg-inboxa-coral/20 flex items-center justify-center font-bold text-inboxa-coral">
                          {item.quantity}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium leading-tight">{item.name}</p>
                          <p className="text-[10px] font-mono text-white/40">{item.code}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="p-4 bg-black/20 border-t border-white/5 flex flex-col gap-2">
                {order.status === 'Solicitado' && (
                  <button 
                    onClick={() => updateStatus(order.id, order.status)}
                    className="w-full btn-primary h-12 flex items-center justify-center gap-2 font-bold"
                  >
                    <CheckCircle2 size={18} />
                    Validar Pedido
                  </button>
                )}
                {order.status === 'Validado' && (
                  <button 
                    onClick={() => updateStatus(order.id, order.status)}
                    className="w-full btn-primary h-12 bg-inboxa-yellow text-inboxa-dark flex items-center justify-center gap-2 font-bold"
                  >
                    <ClipboardList size={18} />
                    Comenzar Empaque
                  </button>
                )}
                {order.status === 'En Preparación' && (
                  <button 
                    onClick={() => updateStatus(order.id, order.status)}
                    className="w-full btn-primary h-12 bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2 font-bold"
                  >
                    <Truck size={18} />
                    Marcar Despachado
                  </button>
                )}
                {order.status === 'Despachado' && (
                  <div className="w-full h-12 bg-green-500/10 text-green-400 font-bold flex items-center justify-center gap-2 rounded-xl">
                    <CheckCircle size={18} />
                    Despachado
                  </div>
                )}
                
                <button 
                  onClick={() => window.print()}
                  className="w-full h-10 border border-white/10 hover:border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Building2 size={14} /> Imprimir Etiqueta
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const CheckCircle: React.FC<{ size?: number; className?: string }> = ({ size = 20, className }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
