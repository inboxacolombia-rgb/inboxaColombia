import React from 'react';
import { FileSpreadsheet, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

export const SettingsView: React.FC = () => {
  return (
    <div className="flex flex-col gap-8 p-4 lg:p-8 h-full">
      <div className="pt-10 lg:pt-0 flex flex-col items-center lg:items-start text-center lg:text-left">
        <img 
          src="/logo/logo%20inboxa.jpg" 
          alt="INBOXA Logo" 
          className="w-28 h-auto max-h-28 object-contain rounded-xl mb-4 lg:hidden shadow-lg border border-white/10"
        />
        <h2 className="text-3xl font-display font-bold">Ajustes del Sistema</h2>
        <p className="text-white/60">Configuración de integraciones y seguridad.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Google Drive Integration */}
        <div className="card-glass p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3 text-inboxa-coral">
            <FileSpreadsheet size={24} />
            <h3 className="text-xl font-bold">Sincronización Google Drive</h3>
          </div>
          
          <p className="text-sm text-white/60 leading-relaxed">
            Vincula tu archivo <code className="bg-white/10 px-1 rounded">Inventario_Inboxa.xlsx</code> para mantener el stock y precios sincronizados automáticamente.
          </p>

          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white/40 uppercase">Archivo Actual</p>
                <p className="font-medium">Inventario_Inboxa_May2026.xlsx</p>
              </div>
              <ExternalLink size={18} className="text-white/20" />
            </div>

            <div className="flex items-center gap-2 text-xs text-green-400">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Sincronizado hace 5 minutos
            </div>
          </div>

          <button className="btn-primary flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20">
            <RefreshCw size={18} />
            Forzar Sincronización
          </button>
        </div>

        {/* Security & Access */}
        <div className="card-glass p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3 text-white/60">
            <ShieldCheck size={24} />
            <h3 className="text-xl font-bold">Seguridad de Roles</h3>
          </div>

          <p className="text-sm text-white/60 leading-relaxed">
            Configura los permisos de acceso para cada perfil del sistema.
          </p>

          <div className="divide-y divide-white/10">
            <div className="py-3 flex justify-between items-center">
              <span className="text-sm font-medium">Vendedores: Solo ven sus ventas</span>
              <div className="w-10 h-5 bg-green-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
              </div>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-sm font-medium">Bodega: Ocultar precios/totales</span>
              <div className="w-10 h-5 bg-green-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
              </div>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-sm font-medium">Alertas de Stock (&lt; 2 units)</span>
              <div className="w-10 h-5 bg-green-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Run Service URL */}
      <div className="mt-auto card-glass p-6 border-dashed border-white/20 bg-transparent flex flex-col items-center justify-center gap-2">
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Service Endpoint</p>
        <p className="font-mono text-sm text-inboxa-coral">{process.env.APP_URL || 'https://inboxa-col-hub.run.app'}</p>
      </div>
    </div>
  );
};
