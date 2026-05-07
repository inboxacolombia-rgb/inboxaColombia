import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  MapPin, 
  Clock, 
  Truck,
  ClipboardList,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Order } from '@/src/types';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';

export const SellerOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const sellerId = auth.currentUser?.uid || 'anonymous';
    const isActuallyAdmin = auth.currentUser && (auth.currentUser.email === 'inboxacolombia@gmail.com' || auth.currentUser.email?.includes('admin'));

    let q;
    if (isActuallyAdmin) {
      // Admins see all orders
      q = query(
        collection(db, 'orders'), 
        orderBy('createdAt', 'desc')
      );
    } else {
      // Sellers see their own orders (or anonymous ones if they are anonymous)
      q = query(
        collection(db, 'orders'), 
        where('sellerId', 'in', [sellerId, 'anonymous']),
        orderBy('createdAt', 'desc')
      );
    }
    
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Order[];
        setOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error en listener de pedidos:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser?.uid]);

  const filteredOrders = orders.filter(order => 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 h-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-10 lg:pt-0">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
          <img 
            src="/logo/logo%20inboxa.jpg" 
            alt="INBOXA Logo" 
            className="w-24 h-auto max-h-24 object-contain rounded-xl mb-4 lg:hidden shadow-lg border border-white/10"
          />
          <h2 className="text-3xl font-display font-bold">Mis Pedidos</h2>
          <p className="text-white/60">Seguimiento de tus ventas y estado de despacho.</p>
        </div>
      </div>

      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
        <input 
          type="text"
          placeholder="Buscar por cliente o ID..."
          className="input-field w-full pl-12 h-12 bg-white/5 border-white/10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-white/10 border-t-inboxa-coral rounded-full animate-spin" />
            <p className="text-white/40 font-bold uppercase tracking-widest">Cargando Tus Ventas...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="col-span-full py-20 text-center card-glass border-dashed">
            <ClipboardList size={64} className="mx-auto mb-4 text-white/10" />
            <p className="text-white/20 text-lg font-bold">No se encontraron pedidos.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <motion.div
              layout
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-glass p-6 flex flex-col gap-6 hover:border-inboxa-coral/30 transition-all group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">Pedido #{order.id.slice(-6).toUpperCase()}</p>
                  <h4 className="font-bold text-lg leading-tight">{order.customerName}</h4>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                  order.status === 'Solicitado' ? "bg-white/10 text-white/60" :
                  order.status === 'Validado' ? "bg-green-500/20 text-green-400" :
                  order.status === 'En Preparación' ? "bg-inboxa-yellow/20 text-inboxa-yellow" :
                  "bg-inboxa-coral/20 text-inboxa-coral"
                )}>
                  {order.status}
                </div>
              </div>

              <div className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-white/60"><span className="text-inboxa-coral font-bold">{item.quantity}x</span> {item.name}</span>
                    <span className="font-mono text-white/40">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                {order.shippingCost && order.shippingCost > 0 && (
                  <div className="flex justify-between items-center text-sm border-t border-white/5 pt-2">
                    <span className="text-white/40 italic">Costo de Envío</span>
                    <span className="font-mono text-white/40">${order.shippingCost.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Total</span>
                  <p className="font-black text-xl text-inboxa-coral">${order.total.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Pago</span>
                  <p className="text-xs font-bold uppercase">{order.paymentMethod === 'cod' ? 'Contra Entrega' : 'Transferencia'}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[10px] font-bold text-white/40">
                <span className="flex items-center gap-1"><MapPin size={12} /> {order.customerCity}</span>
                <span className={cn(
                  "flex items-center gap-1",
                  order.status === 'Despachado' ? "text-green-400" : "text-inboxa-yellow"
                )}>
                  {order.status === 'Despachado' ? <Truck size={12} /> : <Clock size={12} />}
                  {order.status === 'Despachado' ? 'En camino' : 'En proceso'}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
