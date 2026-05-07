import React, { useState, useMemo } from 'react';
import { Search, ShoppingBag, User, Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Product, OrderItem, CustomerFidelity } from '@/src/types';

// Mock products for UI development
const MOCK_PRODUCTS: Product[] = [
  { id: '1', code: 'PROD-001', name: 'Boxing Gloves Red', price: 45.99, stock: 15, imageUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=200&h=200&fit=crop', updatedAt: new Date() },
  { id: '2', code: 'PROD-002', name: 'Speed Bag', price: 29.99, stock: 1, imageUrl: 'https://images.unsplash.com/photo-1599058917233-57c0e8ba0793?w=200&h=200&fit=crop', updatedAt: new Date() },
  { id: '3', code: 'PROD-003', name: 'Punching Mitts', price: 34.99, stock: 0, imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop', updatedAt: new Date() },
];

export const SellerView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [fidelity, setFidelity] = useState<CustomerFidelity>('Nuevo');

  const filteredProducts = useMemo(() => {
    return MOCK_PRODUCTS.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        code: product.code,
        name: product.name,
        price: product.price,
        quantity: 1
      }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Simulation of fidelity check by phone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomerPhone(val);
    if (val.length >= 10) {
      // Mocking autocompletion
      setCustomerName('Camilo Rodriguez');
      setFidelity('Amigo Especial');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full w-full p-4 lg:p-8">
      {/* Left Column: Product Selection */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-display font-bold">Venta Fast-Track</h2>
          <p className="text-white/60">Busca y agrega productos rápidamente durante el Live.</p>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
          <input 
            type="text"
            placeholder="Buscar por nombre o código..."
            className="input-field w-full pl-12 h-14 text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(product)}
                className={cn(
                  "card-glass p-4 cursor-pointer flex flex-col gap-3 group relative overflow-hidden",
                  product.stock <= 0 && "opacity-50 grayscale",
                  product.stock > 0 && product.stock < 2 && "ring-2 ring-inboxa-yellow/50"
                )}
              >
                <div className="aspect-square rounded-lg overflow-hidden relative">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-bold text-inboxa-coral uppercase tracking-wider">
                      Sin Stock
                    </div>
                  )}
                  {product.stock > 0 && product.stock < 2 && (
                    <div className="absolute top-2 right-2 bg-inboxa-yellow text-inboxa-dark px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      Último!
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold truncate">{product.name}</h3>
                  <p className="text-xs text-white/40 font-mono">{product.code}</p>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xl font-bold text-inboxa-coral">${product.price}</span>
                  <span className="text-xs px-2 py-1 bg-white/5 rounded-md">Stock: {product.stock}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: Checkout */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6">
        <div className="card-glass p-6 flex flex-col gap-6 sticky top-8">
          <h3 className="text-xl font-bold border-b border-white/10 pb-4 flex items-center gap-2">
            <ShoppingBag size={20} className="text-inboxa-coral" />
            Resumen de Orden
          </h3>

          {/* Customer Section */}
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-white/40 flex items-center gap-2">
                <Phone size={12} /> Celular del Cliente
              </label>
              <input 
                type="tel"
                placeholder="Ej: 3101234567"
                className="input-field w-full bg-white/5"
                value={customerPhone}
                onChange={handlePhoneChange}
              />
            </div>

            {customerPhone.length >= 10 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-inboxa-coral/20 flex items-center justify-center text-inboxa-coral">
                    <User size={16} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">{customerName}</h4>
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase",
                      fidelity === 'Amigo Especial' ? "bg-inboxa-yellow text-inboxa-dark" : "bg-blue-500/20 text-blue-400"
                    )}>
                      {fidelity}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto max-h-[300px] space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-white/20">
                <p>No hay productos en la orden</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.productId} className="flex gap-3 items-center p-2 rounded-lg hover:bg-white/5 group">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{item.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <span>{item.quantity} x ${item.price}</span>
                    </div>
                  </div>
                  <span className="font-bold text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                  <button 
                    onClick={() => removeFromCart(item.productId)}
                    className="p-1.5 text-white/20 hover:text-inboxa-coral opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <AlertCircle size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Totals */}
          <div className="border-t border-white/10 pt-4 space-y-4">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total a Pagar</span>
              <span className="text-2xl text-inboxa-coral">${total.toFixed(2)}</span>
            </div>

            <button 
              disabled={cart.length === 0 || customerPhone.length < 10}
              className="btn-primary w-full h-14 flex items-center justify-center gap-2 text-lg shadow-lg shadow-inboxa-coral/20"
            >
              <CheckCircle2 size={24} />
              Registrar Venta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
