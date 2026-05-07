import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  Settings, 
  LogOut,
  Menu,
  X,
  FileSpreadsheet,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import { UserRole } from '@/src/types';

interface NavigationProps {
  role: UserRole;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ role, onLogout }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const menuItems = [
    {
      label: 'Ventas Live',
      path: '/seller',
      icon: ShoppingCart,
      roles: ['seller', 'admin']
    },
    {
      label: 'Mis Pedidos',
      path: '/seller-orders',
      icon: ClipboardList,
      roles: ['seller', 'admin']
    },
    {
      label: 'Bodega',
      path: '/warehouse',
      icon: Package,
      roles: ['warehouse', 'admin']
    },
    {
      label: 'Inventario',
      path: '/inventory',
      icon: FileSpreadsheet,
      roles: ['seller', 'warehouse', 'admin']
    },
    {
      label: 'Dashboard',
      path: '/admin',
      icon: BarChart3,
      roles: ['admin']
    },
    {
      label: 'Ajustes',
      path: '/settings',
      icon: Settings,
      roles: ['admin']
    }
  ].filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        id="mobile-nav-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-inboxa-coral rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 bg-inboxa-dark border-r border-white/10 z-40 transition-transform duration-300 lg:translate-x-0 w-64",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="mb-10 flex flex-col items-center text-center">
            <img 
              src="/logo/logo%20inboxa.jpg" 
              alt="INBOXA COL Logo" 
              className="w-32 h-auto max-h-32 object-contain rounded-2xl mb-4 shadow-xl border-2 border-white/10"
              referrerPolicy="no-referrer"
            />
            <p className="text-xs text-white/40 uppercase tracking-widest">Live-Commerce Hub</p>
          </div>

          <nav className="flex-1 space-y-2">
            {menuItems.map((item) => (
              <NavLink
                id={`nav-${item.path.substring(1)}`}
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all group",
                  isActive 
                    ? "bg-inboxa-coral text-white" 
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={20} className={cn(
                  "transition-all",
                  location.pathname === item.path ? "scale-110" : "group-hover:scale-110"
                )} />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <button 
            id="logout-button"
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-white/60 hover:bg-inboxa-coral/20 hover:text-inboxa-coral transition-all mt-auto"
          >
            <LogOut size={20} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {isOpen && (
        <div 
          id="nav-overlay"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};
