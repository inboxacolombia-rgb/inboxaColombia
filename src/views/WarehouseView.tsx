import React, { useState } from 'react';
import { Package, Truck, ClipboardList, User, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Order, OrderStatus } from '@/src/types';

// Mock orders for Warehouse development
const MOCK_ORDERS: Order[] = [
  { 
    id: 'ORD-101', 
    customerPhone: '3101234567', 
    customerName: 'Camilo Rodriguez',
    customerFidelity: 'Amigo Especial',
    items: [
      { productId: '1', code: 'PROD-001', name: 'Boxing Gloves Red', price: 0, quantity: 2 },
      { productId: '2', code: 'PROD-002', name: 'Speed Bag', price: 0, quantity: 1 }
    ],
    total: 0, // Hidden in Warehouse
    status: 'Validado',
    sellerId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  { 
    id: 'ORD-102', 
    customerPhone: '3209876543', 
    customerName: 'Maria Garcia',
    customerFidelity: 'Nuevo',
    items: [
      { productId: '3', code: 'PROD-003', name: 'Punching Mitts', price: 0, quantity: 1 }
    ],
    total: 0,
    status: 'En Preparación',
    sellerId: 'user1',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const WarehouseView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);

  const updateStatus = (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus = currentStatus;
    if (currentStatus === 'Validado') nextStatus = 'En Preparación';
    else if (currentStatus === 'En Preparación') nextStatus = 'Despachado';

    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8 h-full">
      <div className="flex flex-col gap-2 pt-10 lg:pt-0 text-center lg:text-left items-center lg:items-start">
        <img 
          src="/logo/logo%20inboxa.jpg" 
          alt="INBOXA Logo" 
          className="w-16 h-16 rounded-lg mb-2 lg:hidden shadow-lg border border-white/10"
        />
        <h2 className="text-2xl font-display font-bold">Gestión de Bodega</h2>
        <p className="text-white/60">Lista de pedidos listos para empaque y despacho.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {orders.map((order) => (
            <motion.div
              layout
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-glass flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-5 border-b border-white/10 flex justify-between items-start">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">ID Pedido</span>
                  <p className="font-mono text-lg font-bold text-inboxa-coral">{order.id}</p>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                  order.status === 'Validado' ? "bg-green-500/20 text-green-400" : "bg-inboxa-yellow/20 text-inboxa-yellow"
                )}>
                  {order.status}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 space-y-6">
                {/* Customer Info */}
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <User size={20} className="text-white/40" />
                  </div>
                  <div>
                    <h4 className="font-bold">{order.customerName}</h4>
                    <p className="text-xs text-white/40">{order.customerPhone}</p>
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
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-[10px] font-mono text-white/40">{item.code}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="p-4 bg-black/20 border-t border-white/5 flex gap-3">
                {order.status === 'Validado' && (
                  <button 
                    onClick={() => updateStatus(order.id, order.status)}
                    className="flex-1 btn-primary bg-inboxa-yellow text-inboxa-dark flex items-center justify-center gap-2"
                  >
                    <ClipboardList size={18} />
                    Comenzar Empaque
                  </button>
                )}
                {order.status === 'En Preparación' && (
                  <button 
                    onClick={() => updateStatus(order.id, order.status)}
                    className="flex-1 btn-primary bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2"
                  >
                    <Truck size={18} />
                    Marcar Despachado
                  </button>
                )}
                {order.status === 'Despachado' && (
                  <div className="flex-1 py-2 text-center text-green-400 font-bold flex items-center justify-center gap-2">
                    <CheckCircle size={18} />
                    Listo para Entrega
                  </div>
                )}
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
