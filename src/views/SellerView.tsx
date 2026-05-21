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
  Minus,
  Truck,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { Product, OrderItem } from '@/src/types';
import { writeToGoogleSheets, syncFromGoogleSheets, OrderData } from '../services/googleSheetsService';
import { db, auth } from '../firebase';
import { useAuth } from '../components/AuthProvider';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  getDocs, 
  query, 
  where, 
  doc, 
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

// Products from INBOXA store
const MOCK_PRODUCTS: Product[] = [
  { id: '1', code: 'HIDRO-PERC', name: 'Combo Hidro Percutor', price: 185000, stock: 15, imageUrl: 'https://cdn.shopify.com/s/files/1/0737/9035/7642/files/GAME_TV.png?v=1776462379', updatedAt: new Date() },
  { id: '2', code: 'PINT-PERC', name: 'Combo Pintura Percutor', price: 230000, stock: 10, imageUrl: 'https://cdn.shopify.com/s/files/1/0737/9035/7642/files/2.png?v=1776461882', updatedAt: new Date() },
  { id: '3', code: 'SEC-PLAN', name: 'Combo Secador + Plancha', price: 100000, stock: 25, imageUrl: 'https://cdn.shopify.com/s/files/1/0737/9035/7642/files/secador.png?v=1771880783', updatedAt: new Date() },
  { id: '4', code: 'AGUACATE', name: 'Combo Aguacate (Plancha + Secador)', price: 100000, stock: 20, imageUrl: 'https://cdn.shopify.com/s/files/1/0737/9035/7642/files/2577-1-680x680.jpg?v=1777480761', updatedAt: new Date() },
  { id: '5', code: 'FLIP-7', name: 'Parlante Flip 7', price: 80000, stock: 30, imageUrl: 'https://cdn.shopify.com/s/files/1/0737/9035/7642/files/5-680x907.png?v=1777558633', updatedAt: new Date() },
  { id: '6', code: 'CHARGE-6', name: 'Parlante Charge 6', price: 90000, stock: 20, imageUrl: 'https://cdn.shopify.com/s/files/1/0737/9035/7642/files/9efb082d-43f7-4a80-b746-bc07a6405c91-680x907.jpg?v=1777558465', updatedAt: new Date() },
  { id: '7', code: 'V380-CAM', name: 'Cámara Exterior Doble Lente', price: 110000, stock: 12, imageUrl: 'https://cdn.shopify.com/s/files/1/0737/9035/7642/files/WhatsApp-Image-2025-08-15-at-1.06.39-PM-4-680x907.jpg?v=1777481504', updatedAt: new Date() },
  { id: '8', code: 'TRUPER-ASP', name: 'Aspiradora Truper 15L 3Hp', price: 400000, stock: 5, imageUrl: 'https://cdn.shopify.com/s/files/1/0737/9035/7642/files/18b543f30d5-protool_herramientas-ogf01t8hom-lb8ryamr6rk.jpg?v=1772573373', updatedAt: new Date() },
  { id: '9', code: 'MASAJ-3C', name: 'Masajeador 3 Cabezas', price: 70000, stock: 15, imageUrl: 'https://cdn.shopify.com/s/files/1/0737/9035/7642/files/19c6de09070-protool_herramientas-fjwbb98qeiv-jh1djznt28a.jpg?v=177740906', updatedAt: new Date() },
  { id: '10', code: 'LEGO-PIR', name: 'Lego Piratas (509 pcs)', price: 95000, stock: 8, imageUrl: 'https://cdn.shopify.com/s/files/1/0737/9035/7642/files/19ac72af788-sokanylocales-fvmy22txuii-jtggfhol8j.jpg?v=1777741457', updatedAt: new Date() },
  { id: '11', code: 'PIC-SOKANY', name: 'Picador 4L Sokany', price: 100000, stock: 10, imageUrl: 'https://cdn.shopify.com/s/files/1/0737/9035/7642/files/199355473bd-sokanylocales-9gufn31sg0v-vzczxy93x49.jpg?v=1777740751', updatedAt: new Date() },
  { id: '12', code: 'K-ROBOT', name: 'Kit Robot Solar', price: 68000, stock: 15, imageUrl: 'https://cdn.shopify.com/s/files/1/0737/9035/7642/files/01566859-3c56-4689-a123-212e799ca62f-680x907.jpg?v=1777741971', updatedAt: new Date() },
];



export const SellerView: React.FC = () => {
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [existingCustomers, setExistingCustomers] = useState<any[]>([]);
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Customer Form State
  const [customerData, setCustomerData] = useState({
    name: '',
    idNumber: '',
    address: '',
    city: '',
    phone: '',
    paymentMethod: 'transfer',
    shippingCost: ''
  });

  const loadData = async () => {
    setIsDataLoading(true);
    try {
      console.log("Sincronizando de Google Sheets a petición del vendedor...");
      await syncFromGoogleSheets();
    } catch (err) {
      console.error("Error al forzar sincronización de Google Sheets:", err);
    } finally {
      setIsDataLoading(false);
    }
  };

  React.useEffect(() => {
    setIsDataLoading(true);
    
    // Live stream products
    const productsQuery = query(collection(db, 'products'));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const fetchedProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(fetchedProducts);
      setIsDataLoading(false);
    }, (err) => {
      console.error("Error al escuchar productos en tiempo real:", err);
      setIsDataLoading(false);
    });

    // Live stream customers
    const customersQuery = query(collection(db, 'customers'));
    const unsubscribeCustomers = onSnapshot(customersQuery, (snapshot) => {
      const customers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExistingCustomers(customers);
    }, (err) => {
      console.error("Error al escuchar clientes en tiempo real:", err);
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCustomers();
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, products]);

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
        const product = products.find(p => p.id === productId);
        if (product && newQty > product.stock) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const shipCost = parseFloat(customerData.shippingCost) || 0;
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal + shipCost;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const isBogotaOrEmpty = customerData.city.toLowerCase().trim() === 'bogota' || 
                           customerData.city.toLowerCase().trim() === 'bogotá' ||
                           customerData.city.trim() === '';

  const isFormValid = (
    cart.length > 0 && 
    customerData.name.trim() !== '' && 
    customerData.idNumber.trim() !== '' && 
    customerData.phone.trim() !== '' && 
    customerData.city.trim() !== '' && 
    customerData.address.trim() !== '' &&
    customerData.paymentMethod !== '' &&
    (isBogotaOrEmpty || customerData.shippingCost.trim() !== '')
  );

  const handleConfirmOrder = async () => {
    if (cart.length === 0 || !isFormValid || loading) return;

    setLoading(true);
    try {
      // Verify auth exists for rules
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (authError) {
          console.warn("Auth failed, continuing anyway (might fail Firestore rules):", authError);
        }
      }

      // Save order to Firestore
      const orderData = {
        customerName: customerData.name || 'Sin Nombre',
        customerPhone: customerData.phone || '0',
        customerIdNumber: customerData.idNumber || '0',
        customerAddress: customerData.address || 'Sin Dirección',
        customerCity: customerData.city || 'Sin Ciudad',
        customerFidelity: 'Nuevo',
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          code: item.code
        })),
        total: total,
        shippingCost: shipCost,
        status: 'Solicitado',
        paymentMethod: customerData.paymentMethod,
        paymentStatus: 'Pendiente',
        sellerId: auth.currentUser?.uid || 'anonymous',
        sellerName: auth.currentUser?.displayName || 'Vendedor Live',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add Order
      try {
        await addDoc(collection(db, 'orders'), orderData);
      } catch (orderErr) {
        console.error("Firestore Order Save failed:", orderErr);
        // We continue because maybe Sheets works, but we should inform later
      }
      
      // Save/Update Customer in Database
      try {
        const customerRef = doc(db, 'customers', customerData.idNumber);
        await setDoc(customerRef, {
          idNumber: customerData.idNumber,
          name: customerData.name,
          phone: customerData.phone,
          address: customerData.address,
          city: customerData.city,
          fidelity: 'Conocido',
          lastOrderAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (custErr) {
        console.error("Firestore Customer Save failed:", custErr);
      }

      // Push to Google Sheets (Non-blocking)
      const sheetData: OrderData = {
        name: customerData.name,
        idNumber: customerData.idNumber,
        phone: customerData.phone,
        address: customerData.address,
        city: customerData.city,
        total: total,
        paymentMethod: customerData.paymentMethod,
        sellerName: profile?.name || 'Vendedor Anónimo',
        shippingCost: shipCost,
        items: cart.map(i => `${i.quantity}x ${i.name}`).join(' | ')
      };

      writeToGoogleSheets(sheetData).catch(sheetError => {
        console.error("Error pushing to Google Sheets:", sheetError);
      });
      
      // SUCCESS ACTIONS
      setIsSuccess(true);
      setLoading(false);
      
      // Reset Data
      setCart([]);
      setCustomerData({
        name: '',
        idNumber: '',
        address: '',
        city: '',
        phone: '',
        paymentMethod: 'transfer',
        shippingCost: ''
      });
      
      setIsConfirming(false);
      
      // Auto-hide success and close drawer after 2 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setIsCartOpen(false);
      }, 2000);

    } catch (error: any) {
      console.error("General Order Process Error:", error);
      alert("Hubo un problema al procesar el pedido. Por favor verifica tu conexión.");
      setLoading(false);
    }
  };

  return (
    <div className="relative h-screen flex flex-col bg-inboxa-gray overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 p-4 lg:p-8 overflow-y-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-10 lg:pt-0">
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
            <img 
              src="/logo/logo%20inboxa.jpg" 
              alt="INBOXA Logo" 
              className="w-24 h-auto max-h-24 object-contain rounded-xl mb-4 lg:hidden shadow-lg border border-white/10"
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
        <div className="relative max-w-4xl mx-auto w-full flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40" size={24} />
            <input 
              type="text"
              placeholder="Escribe para buscar productos..."
              className="input-field w-full pl-16 h-16 text-xl bg-white/5 border-white/10 focus:border-inboxa-coral/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={loadData}
            disabled={isDataLoading}
            className="w-16 h-16 card-glass flex items-center justify-center text-white/40 hover:text-white transition-all"
            title="Recargar Inventario"
          >
            <RefreshCw size={24} className={cn(isDataLoading && "animate-spin")} />
          </button>
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
                    <div className="flex flex-col gap-1.5 relative">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Hash size={10} /> Cédula
                      </label>
                      <input 
                        type="text"
                        placeholder="Documento de Identidad"
                        className="input-field w-full h-12 bg-white/5"
                        value={customerData.idNumber}
                        onChange={e => {
                          const val = e.target.value;
                          setCustomerData(prev => ({ ...prev, idNumber: val }));
                          setShowCustomerResults(val.length > 3);
                        }}
                        onBlur={() => setTimeout(() => setShowCustomerResults(false), 200)}
                      />
                      
                      {showCustomerResults && (
                        <div className="absolute top-full left-0 right-0 bg-inboxa-dark border border-white/10 rounded-xl mt-1 z-50 overflow-hidden shadow-2xl max-h-48 overflow-y-auto">
                          {existingCustomers
                            .filter(c => c.idNumber.includes(customerData.idNumber))
                            .map(c => (
                              <button
                                key={c.id}
                                className="w-full p-3 text-left hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors"
                                onClick={() => {
                                  setCustomerData({
                                    name: c.name,
                                    idNumber: c.idNumber,
                                    phone: c.phone || '',
                                    address: c.address || '',
                                    city: c.city || '',
                                    paymentMethod: 'transfer',
                                    shippingCost: ''
                                  });
                                  setShowCustomerResults(false);
                                }}
                              >
                                <p className="font-bold text-sm">{c.name}</p>
                                <p className="text-[10px] text-white/40 font-mono">{c.idNumber} • {c.city}</p>
                              </button>
                            ))}
                        </div>
                      )}
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
                    
                    {!isBogotaOrEmpty && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex flex-col gap-1.5"
                      >
                        <label className="text-[10px] font-bold uppercase tracking-widest text-inboxa-coral flex items-center gap-2">
                          <Truck size={10} /> Valor de Envío
                        </label>
                        <input 
                          type="number"
                          placeholder="Costo de transporte"
                          className="input-field w-full h-12 bg-white/10 border-inboxa-coral/30"
                          value={customerData.shippingCost}
                          onChange={e => setCustomerData(prev => ({ ...prev, shippingCost: e.target.value }))}
                        />
                      </motion.div>
                    )}

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
                    {shipCost > 0 && (
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] text-white/40 uppercase font-bold">Sub: ${subtotal.toFixed(2)}</p>
                        <p className="text-[10px] text-inboxa-coral uppercase font-bold">+ Envío: ${shipCost.toFixed(2)}</p>
                      </div>
                    )}
                    <p className="text-xs text-white/40">Total a pagar</p>
                    <h2 className="text-3xl font-black text-inboxa-coral">${total.toFixed(2)}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-white/40">Productos</p>
                    <p className="font-bold uppercase tracking-widest">{cartItemCount} items</p>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.button
                      key="success"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => setIsSuccess(false)}
                      className="w-full h-16 bg-green-500 hover:bg-green-600 rounded-2xl flex items-center justify-center gap-3 text-lg font-black uppercase tracking-widest transition-colors shadow-lg shadow-green-500/20"
                    >
                      <CheckCircle2 size={24} /> ¡Éxito! Nueva Venta?
                    </motion.button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={handleConfirmOrder}
                        disabled={!isFormValid || loading}
                        className={cn(
                          "w-full h-16 rounded-2xl flex items-center justify-center gap-3 text-lg font-black uppercase tracking-widest transition-all relative overflow-hidden",
                          !isFormValid || loading
                            ? "bg-white/5 text-white/20 cursor-not-allowed"
                            : "bg-inboxa-coral hover:bg-inboxa-coral/90 shadow-xl shadow-inboxa-coral/20"
                        )}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            Procesando...
                          </div>
                        ) : (
                          <>Confirmar Pedido <ChevronRight size={24} /></>
                        )}
                      </button>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
