export type UserRole = 'seller' | 'warehouse' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: any;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  updatedAt: any;
}

export type OrderStatus = 
  | 'Solicitado' 
  | 'Validado' 
  | 'En Preparación' 
  | 'Despachado' 
  | 'Finalizado/Pagado' 
  | 'Mora/Reclamo';

export type CustomerFidelity = 
  | 'Nuevo' 
  | 'Conocido' 
  | 'Amigo de Confianza' 
  | 'Amigo Especial';

export interface OrderItem {
  productId: string;
  code: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Customer {
  id: string;
  idNumber: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  fidelity: CustomerFidelity;
  lastOrderAt: any;
}

export interface Order {
  id: string;
  customerPhone: string;
  customerName: string;
  customerIdNumber: string;
  customerAddress: string;
  customerCity: string;
  customerFidelity: CustomerFidelity;
  items: OrderItem[];
  total: number;
  shippingCost?: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: 'Pendiente' | 'Pagado' | 'Rechazado';
  paidAt?: any;
  sellerId: string;
  sellerName?: string;
  trackingNumber?: string;
  createdAt: any;
  updatedAt: any;
}
