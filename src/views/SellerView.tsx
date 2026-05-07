import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ShoppingBag, 
  User, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  CreditCard, 
  MapPin, 
  Hash, 
  Trash2, 
  ChevronRight,
  Plus,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Product, OrderItem } from '@/src/types';

// Mock products for UI development
const MOCK_PRODUCTS: Product[] = [
  { id: '1', code: 'PROD-001', name: 'Boxing Gloves Red', price: 45.99, stock: 15, imageUrl: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=200&h=200&fit=crop', updatedAt: new Date() },
  { id: '2', code: 'PROD-002', name: 'Speed Bag', price: 29.99, stock: 5, imageUrl: 'https://images.unsplash.com/photo-1599058917233-57c0e8ba0793?w=200&h=200&fit=crop', updatedAt: new Date() },
  { id: '3', code: 'PROD-003', name: 'Punching Mitts', price: 34.99, stock: 10, imageUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=200&h=200&fit=crop', updatedAt: new Date() },
  { id: '4', code: 'PROD-004', name: 'Head Guard', price: 55.00, stock: 3, imageUrl: 'https://images.unsplash.com/photo-1552072092-2f9c76212902?w=200&h=200&fit=crop', updatedAt: new Date() },
  { id: '5', code: 'PROD-005', name: 'Hand Wraps', price: 12.50, stock: 50, imageUrl: 'https://images.unsplash.com/photo-1511886929837-354d827aae26?w=200&h=200&fit=crop', updatedAt: new Date() },
];

export const SellerView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<OrderItem[]>([]);
  
  // Customer Form State
  const [customerData, setCustomerData] = useState({
    name: '',
    idNumber: '',
    address: '',
    city: '',
    phone: '',
    paymentMethod: 'transfer'
  });

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
    // Open cart on adding first item for better visibility
    if (cart.length === 0) setIsCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        const product = MOCK_PRODUCTS.find(p => p.id === productId);
        if (product && newQty > product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isFormValid = customerData.name && customerData.phone && customerData.idNumber && cart.length > 0;

  return (
    <div className="relative h-screen flex flex-col bg-inboxa-gray overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 p-4 lg:p-8 overflow-y-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-10 lg:pt-0">
          <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
            <img 
              src="/logo/logo%20inboxa.jpg" 
              alt="INBOXA Logo" 
              className="w-16 h-16 rounded-lg mb-2 lg:hidden shadow-lg border border-white/10"
            />
            <h2 className="text-2xl font-display font-bold">Venta Fast-Track</h2>
            <p className="text-white/60">Busca y agrega productos rápidamente durante el Live.</p>
          </div>

          <button 
            onClick={() => setIsCartOpen(true)}
            className="relative lg:fixed lg:bottom-8 lg:right-8 z-10 btn-primary h-14 px-6 flex items-center gap-3 shadow-xl shadow-inboxa-coral/20 group animate-in fade-in zoom-in duration-500"
          >
            <ShoppingBag size={24} className="group-hover:scale-110 transition-transform" />
            <span className="font-bold">Ver Carrito</span>
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-inboxa-dark text-xs font-black flex items-center justify-center border-2 border-inboxa-coral shadow-lg">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-4xl mx-auto w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={24} />
          <input 
            type="text"
            placeholder="Escribe para buscar productos..."
            className="input-field w-full pl-16 h-16 text-xl bg-white/5 border-white/10 focus:border-inboxa-coral/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-24">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => addToCart(product)}
                className={cn(
                  "card-glass p-4 cursor-pointer flex flex-col gap-4 group hover:border-inboxa-coral/30 transition-all",
                  product.stock <= 0 && "opacity-50 grayscale pointer-events-none"
                )}
              >
                <div className="aspect-square rounded-xl overflow-hidden relative">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center font-bold text-inboxa-coral uppercase tracking-wider">
                      Agotado
                    </div>
                  )}
                  {product.stock > 0 && product.stock <= 3 && (
                    <div className="absolute top-3 right-3 bg-inboxa-yellow text-inboxa-dark px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg">
                      ¡Quedan {product.stock}!
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white text-inboxa-dark px-4 py-2 rounded-full font-bold flex items-center gap-2">
                      <Plus size={16} /> Agregar
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{product.name}</h3>
                  <p className="text-xs text-white/40 font-mono mt-1">{product.code}</p>
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-2xl font-black text-inboxa-coral">${product.price}</span>
                  <span className="text-xs font-bold text-white/60 bg-white/5 px-2 py-1 rounded">Stock: {product.stock}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-inboxa-dark z-50 shadow-2xl flex flex-col border-l border-white/10"
            >
              {/* Header */}
              <div className="p-6 flex items-center justify-between border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-inboxa-coral/20 flex items-center justify-center text-inboxa-coral">
                    <ShoppingBag size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Carrito Live</h3>
                    <p className="text-xs text-white/40">Completa los datos para cerrar la venta</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-white/40"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
                {/* Product List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Productos Agregados</h4>
                  {cart.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl">
                      <ShoppingBag size={48} className="mx-auto text-white/5 mb-4" />
                      <p className="text-white/20">Tu carrito está vacío</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <motion.div 
                          layout
                          key={item.productId} 
                          className="flex gap-4 items-center p-3 rounded-xl bg-white/5 border border-white/5 group"
                        >
                          <div className="flex-1">
                            <h4 className="font-bold text-sm">{item.name}</h4>
                            <p className="text-xs text-inboxa-coral font-black">${item.price}</p>
                          </div>
                          
                          <div className="flex items-center gap-2 bg-black/20 rounded-lg p-1">
                            <button 
                              onClick={() => updateQuantity(item.productId, -1)}
                              className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.productId, 1)}
                              className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          
                          <div className="text-right w-20">
                            <p className="font-black text-sm">${(item.price * item.quantity).toFixed(2)}</p>
                          </div>

                          <button 
                            onClick={() => removeFromCart(item.productId)}
                            className="p-2 text-white/20 hover:text-inboxa-coral transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Customer Form */}
                <div className="space-y-6">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white/40">Datos del Cliente</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <User size={10} /> Nombre Completo
                      </label>
                      <input 
                        type="text"
                        placeholder="Nombre y Apellido"
                        className="input-field w-full h-12 bg-white/5"
                        value={customerData.name}
                        onChange={e => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Hash size={10} /> Cédula
                      </label>
                      <input 
                        type="text"
                        placeholder="Documento de Identidad"
                        className="input-field w-full h-12 bg-white/5"
                        value={customerData.idNumber}
                        onChange={e => setCustomerData(prev => ({ ...prev, idNumber: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2" >
                        <Phone size={10} /> Celular
                      </label>
                      <input 
                        type="tel"
                        placeholder="Ej: 3101234567"
                        className="input-field w-full h-12 bg-white/5"
                        value={customerData.phone}
                        onChange={e => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <MapPin size={10} /> Ciudad
                      </label>
                      <input 
                        type="text"
                        placeholder="Bogotá, Medellín, etc."
                        className="input-field w-full h-12 bg-white/5"
                        value={customerData.city}
                        onChange={e => setCustomerData(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <MapPin size={10} /> Dirección de Entrega
                      </label>
                      <input 
                        type="text"
                        placeholder="Calle 123 # 45-67 Barrio..."
                        className="input-field w-full h-12 bg-white/5"
                        value={customerData.address}
                        onChange={e => setCustomerData(prev => ({ ...prev, address: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                      <CreditCard size={10} /> Método de Pago
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'transfer', label: 'Transferencia', icon: CreditCard },
                        { id: 'cod', label: 'Contra Entrega', icon: MapPin },
                      ].map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setCustomerData(prev => ({ ...prev, paymentMethod: method.id }))}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border transition-all",
                            customerData.paymentMethod === method.id 
                              ? "bg-inboxa-coral/10 border-inboxa-coral text-inboxa-coral" 
                              : "bg-white/5 border-white/5 hover:border-white/10 text-white/60"
                          )}
                        >
                          <method.icon size={18} />
                          <span className="font-bold text-sm">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Totals */}
              <div className="p-6 bg-white/5 border-t border-white/10 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/40">Subtotal a pagar</p>
                    <h2 className="text-3xl font-black text-inboxa-coral">${total.toFixed(2)}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40">Productos</p>
                    <p className="font-bold uppercase tracking-widest">{cartItemCount} items</p>
                  </div>
                </div>

                <button 
                  disabled={!isFormValid}
                  className={cn(
                    "w-full h-16 rounded-2xl flex items-center justify-center gap-3 text-lg font-black uppercase tracking-widest transition-all",
                    isFormValid 
                      ? "bg-inboxa-coral hover:bg-inboxa-coral/90 shadow-xl shadow-inboxa-coral/20" 
                      : "bg-white/5 text-white/20 cursor-not-allowed"
                  )}
                >
                  Confirmar Pedido <ChevronRight size={24} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
