import React, { useState } from 'react';
import { ShoppingCart, Package, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../types';
import { cn } from '../lib/utils';

interface LoginViewProps {
  onLogin: (role: UserRole) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      id: 'seller' as UserRole,
      title: 'Vendedor (Live)',
      description: 'Registro de ventas rápidas y consulta de stock en tiempo real.',
      icon: ShoppingCart,
      color: 'bg-inboxa-coral'
    },
    {
      id: 'warehouse' as UserRole,
      title: 'Bodega (Logística)',
      description: 'Gestión de empaques, despachos y estados de envío.',
      icon: Package,
      color: 'bg-slate-600'
    },
    {
      id: 'admin' as UserRole,
      title: 'Administrador',
      description: 'Control financiero, inventarios y gestión de moras.',
      icon: ShieldCheck,
      color: 'bg-inboxa-yellow'
    }
  ];

  const handleRoleSelect = (role: UserRole) => {
    setLoading(true);
    setSelectedRole(role);
    
    // Simulate a brief loading state for better UX
    setTimeout(() => {
      setLoading(false);
      onLogin(role);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-inboxa-gray flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-inboxa-coral/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-inboxa-yellow/5 rounded-full blur-[120px]" />

      <motion.div 
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl flex flex-col items-center gap-10 z-10"
      >
        <div className="text-center">
          <img 
            src="/logo/logo%20inboxa.jpg" 
            alt="INBOXA COL Logo" 
            className="h-24 w-auto mx-auto mb-4 drop-shadow-2xl"
            referrerPolicy="no-referrer"
          />
          <h1 className="text-3xl font-display font-bold tracking-tight">INBOXA COL</h1>
          <p className="text-white/40 mt-2">Hub de Comercio y Logística</p>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 border-4 border-inboxa-coral/20 border-t-inboxa-coral rounded-full animate-spin" />
              <p className="text-sm font-bold uppercase tracking-widest text-white/40">Iniciando Sesión...</p>
            </motion.div>
          ) : (
            <motion.div 
              key="role-selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
            >
              {roles.map((role, idx) => (
                <motion.button
                  key={role.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ scale: 1.02, translateY: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect(role.id)}
                  className="card-glass p-8 flex flex-col items-center text-center gap-6 group hover:border-white/20 transition-all border border-white/5"
                >
                  <div className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-6",
                    role.color
                  )}>
                    <role.icon size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{role.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                  <div className="mt-auto pt-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/20 group-hover:text-inboxa-coral transition-colors">
                    Ingresar <span>→</span>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] mt-10">
          Acceso Directo Habilitado (Entorno de Pruebas)
        </p>
      </motion.div>
    </div>
  );
};
