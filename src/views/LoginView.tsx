import React, { useState } from 'react';
import { ShoppingCart, Package, ShieldCheck, Mail, Lock, LogIn, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserRole } from '../types';
import { cn } from '../lib/utils';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface LoginViewProps {
  onLogin: (role: UserRole) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      color: 'bg-blue-500'
    },
    {
      id: 'admin' as UserRole,
      title: 'Administrador',
      description: 'Control financiero, inventarios y gestión de moras.',
      icon: ShieldCheck,
      color: 'bg-inboxa-yellow'
    }
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      // Demo mode if firebase not ready
      onLogin(selectedRole!);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // AuthProvider will detect the change
    } catch (err: any) {
      console.error(err);
      setError('Error al iniciar sesión. Verifica tus credenciales.');
      // If error is "config not found", fall back to demo
      if (err.message?.includes('not found')) {
        onLogin(selectedRole!);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-inboxa-gray flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-inboxa-coral/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />

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
          {!selectedRole ? (
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
                  onClick={() => setSelectedRole(role.id)}
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
          ) : (
            <motion.div 
              key="login-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-md"
            >
              <form onSubmit={handleLogin} className="card-glass p-8 flex flex-col gap-6">
                <button 
                  type="button"
                  onClick={() => setSelectedRole(null)}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-all mb-4 self-start"
                >
                  <ChevronLeft size={16} /> Volver
                </button>

                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-white",
                    roles.find(r => r.id === selectedRole)?.color
                  )}>
                    {React.createElement(roles.find(r => r.id === selectedRole)?.icon || ShoppingCart, { size: 24 })}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Ingreso: {roles.find(r => r.id === selectedRole)?.title}</h2>
                    <p className="text-xs text-white/40">Inicia sesión con tus credenciales</p>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
                    <Lock size={16} /> {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                      <Mail size={12} /> Email
                    </label>
                    <input 
                      type="email"
                      required
                      placeholder="usuario@inboxa.col"
                      className="input-field w-full"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                      <Lock size={12} /> Contraseña
                    </label>
                    <input 
                      type="password"
                      required
                      placeholder="••••••••"
                      className="input-field w-full"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="btn-primary h-12 flex items-center justify-center gap-2 font-bold text-lg mt-2"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <LogIn size={20} />}
                  Acceder
                </button>

                <p className="text-[10px] text-center text-white/20 uppercase tracking-widest">
                  El sistema valida roles automáticamente
                </p>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] mt-10">
          Powered by INBOXA COL & Firebase Enterprise
        </p>
      </motion.div>
    </div>
  );
};
