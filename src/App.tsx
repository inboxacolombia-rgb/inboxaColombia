import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { SellerView } from './views/SellerView';
import { SellerOrdersView } from './views/SellerOrdersView';
import { WarehouseView } from './views/WarehouseView';
import { AdminView } from './views/AdminView';
import { SettingsView } from './views/SettingsView';
import { LoginView } from './views/LoginView';
import { InventoryView } from './views/InventoryView';
import { UserRole } from './types';
import { Navigation } from './components/Navigation';
import { syncFromGoogleSheets } from './services/googleSheetsService';

import { AuthProvider, useAuth } from './components/AuthProvider';
import { auth } from './firebase';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

function AppRouter() {
  const { profile, loading } = useAuth();
  
  // State for demo role selection if no profile exists
  const [demoRole, setDemoRole] = useState<UserRole | null>(null);

  const activeUser = profile || (demoRole ? { role: demoRole, name: 'Demo User' } : null);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-inboxa-gray">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-inboxa-coral"></div>
      </div>
    );
  }

  const handleLogout = () => {
    if (auth) auth.signOut();
    setDemoRole(null);
  };

  if (!activeUser) {
    return <LoginView onLogin={(role) => setDemoRole(role)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout role={activeUser.role} onLogout={handleLogout} />}>
          <Route index element={<Navigate to={`/${activeUser.role}`} replace />} />
          
          <Route 
            path="seller" 
            element={activeUser.role === 'seller' || activeUser.role === 'admin' ? <SellerView /> : <Navigate to="/" />} 
          />
          
          <Route 
            path="seller-orders" 
            element={activeUser.role === 'seller' || activeUser.role === 'admin' ? <SellerOrdersView /> : <Navigate to="/" />} 
          />
          
          <Route 
            path="warehouse" 
            element={activeUser.role === 'warehouse' || activeUser.role === 'admin' ? <WarehouseView /> : <Navigate to="/" />} 
          />
          
          <Route 
            path="admin" 
            element={activeUser.role === 'admin' ? <AdminView /> : <Navigate to="/" />} 
          />

          <Route 
            path="inventory" 
            element={<InventoryView userRole={activeUser.role} />} 
          />

          <Route 
            path="settings" 
            element={activeUser.role === 'admin' ? <SettingsView /> : <Navigate to="/" />} 
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

// Side Layout Component
const Layout: React.FC<{ role: UserRole; onLogout: () => void }> = ({ role, onLogout }) => {
  useEffect(() => {
    const runSincronismo = async () => {
      try {
        console.log("Sincronización automática de Google Sheets (cada 20s) iniciada...");
        const res = await syncFromGoogleSheets();
        console.log(`Sincronización automática completada: ${res.count} elementos actualizados.`);
      } catch (err) {
        console.error("Fallo la sincronización en segundo plano:", err);
      }
    };

    // Run immediately when layout mounts
    runSincronismo();

    // 20-second automatic refresh interval
    const intervalId = setInterval(runSincronismo, 20000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-inboxa-gray text-white">
      <Navigation role={role} onLogout={onLogout} />
      <main className="flex-1 lg:ml-64 min-h-screen overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};
