import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  ExternalLink, 
  ShieldCheck, 
  Cloud, 
  LogOut, 
  DatabaseBackup, 
  FolderOpen, 
  Trash2, 
  Check, 
  AlertTriangle, 
  FileJson 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { 
  loginWithGoogleDrive, 
  logoutFromGoogleDrive, 
  getDriveAccessToken, 
  listDriveBackups, 
  createBackupStateSnapshot, 
  uploadBackupToGoogleDrive, 
  getBackupFileContent, 
  restoreFromSnapshotPayload, 
  deleteFileFromGoogleDrive,
  DriveBackupFile 
} from '../services/googleDriveService';
import { syncFromGoogleSheets } from '../services/googleSheetsService';

export const SettingsView: React.FC = () => {
  // Google Drive Connection State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [backups, setBackups] = useState<DriveBackupFile[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Sheets Sync State
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sheetsSyncInfo, setSheetsSyncInfo] = useState<string | null>(null);

  useEffect(() => {
    const currentToken = getDriveAccessToken();
    if (currentToken) {
      setToken(currentToken);
      // We could try to fetch backups if token exists
      loadBackupsList(currentToken);
    }
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const result = await loginWithGoogleDrive();
      setUser(result.user);
      setToken(result.accessToken);
      loadBackupsList(result.accessToken);
    } catch (err: any) {
      console.error("Error signing into Google Drive:", err);
      alert(`Error al conectar con Google Drive: ${err.message || err}`);
    }
  };

  const handleGoogleLogout = async () => {
    try {
      await logoutFromGoogleDrive();
      setUser(null);
      setToken(null);
      setBackups([]);
    } catch (err: any) {
      console.error("Error logging out:", err);
    }
  };

  const loadBackupsList = async (accessToken: string) => {
    setIsLoadingBackups(true);
    try {
      const list = await listDriveBackups(accessToken);
      setBackups(list);
    } catch (err: any) {
      console.error("Error loading backups:", err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!token) return;
    const confirmed = window.confirm("¿Deseas generar un respaldo completo de la base de datos (inventarios y clientes) en Google Drive?");
    if (!confirmed) return;

    setIsBackingUp(true);
    try {
      const snapshot = await createBackupStateSnapshot();
      const dateStr = new Date().toISOString().replace(/T/, '_').replace(/:/g, '-').slice(0, 19);
      const filename = `inboxa_backup_${dateStr}.json`;
      
      await uploadBackupToGoogleDrive(token, filename, snapshot);
      alert("¡Respaldo exitoso! Archivo creado correctamente en Google Drive.");
      loadBackupsList(token);
    } catch (err: any) {
      console.error("Error creating backup:", err);
      alert(`Error al respaldar en Drive: ${err.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = async (file: DriveBackupFile) => {
    if (!token) return;
    const confirmed = window.confirm(`¡ATENCIÓN! ¿Estás completamente seguro de que deseas restaurar la base de datos al punto de "${file.name}"? Los datos actuales del sistema serán sobrescritos.`);
    if (!confirmed) return;

    setIsRestoring(true);
    try {
      const payload = await getBackupFileContent(token, file.id);
      const result = await restoreFromSnapshotPayload(payload);
      alert(`¡Restauración exitosa! Se han recuperado ${result.productsCount} productos y ${result.customersCount} clientes.`);
    } catch (err: any) {
      console.error("Error restoring backup:", err);
      alert(`Error al restaurar respaldo: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteBackup = async (fileId: string) => {
    if (!token) return;
    const confirmed = window.confirm("¿Seguro que deseas eliminar permanentemente este archivo de respaldo de tu Google Drive?");
    if (!confirmed) return;

    setIsDeletingId(fileId);
    try {
      await deleteFileFromGoogleDrive(token, fileId);
      loadBackupsList(token);
    } catch (err: any) {
      console.error("Error deleting backup:", err);
      alert(`Error al eliminar el respaldo: ${err.message}`);
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleForceSheetsSync = async () => {
    setIsSyncingSheets(true);
    setSheetsSyncInfo(null);
    try {
      const result = await syncFromGoogleSheets();
      if (result.success) {
        setSheetsSyncInfo(`Sincronización exitosa: ${result.count} elementos actualizados.`);
      } else {
        setSheetsSyncInfo(`Error: ${result.error}`);
      }
    } catch (err: any) {
      setSheetsSyncInfo(`Fallo: ${err.message}`);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const formatBytes = (bytes?: string) => {
    if (!bytes) return 'N/A';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return 'N/A';
    if (num < 1024) return `${num} B`;
    if (num < 1048576) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-8 p-4 lg:p-8 h-full">
      <div className="pt-10 lg:pt-0 flex flex-col items-center lg:items-start text-center lg:text-left">
        <img 
          src="/logo/logo%20inboxa.jpg" 
          alt="INBOXA Logo" 
          className="w-28 h-auto max-h-28 object-contain rounded-xl mb-4 lg:hidden shadow-lg border border-white/10"
        />
        <h2 className="text-3xl font-display font-bold">Ajustes del Sistema</h2>
        <p className="text-white/60">Configuración de integraciones de Google Drive, Hojas de Cálculo y seguridad.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Real Google Drive Backup & Recovery Center */}
        <div className="card-glass p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-inboxa-coral">
              <Cloud size={24} />
              <h3 className="text-xl font-bold">Respaldo Google Drive</h3>
            </div>
            {token && (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-400 text-xs font-bold rounded-full border border-green-500/25">
                <Check size={12} /> Conectado
              </span>
            )}
          </div>

          <p className="text-sm text-white/60 leading-relaxed">
            Autoriza tu cuenta de Google Drive para respaldar de manera segura y restaurar la base de datos de productos y clientes cuando lo necesites.
          </p>

          {!token ? (
            <div className="p-8 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center text-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/40">
                <Cloud size={24} />
              </div>
              <div>
                <p className="font-bold">No se detecta conexión</p>
                <p className="text-xs text-white/40 mt-1">Conecta tu cuenta para habilitar el historial de respaldos.</p>
              </div>
              <button 
                onClick={handleGoogleLogin}
                className="gsi-material-button text-black w-full max-w-xs flex justify-center py-2 px-4 rounded-lg bg-white border border-transparent font-medium shadow-md hover:bg-white/90 transition-all font-sans"
              >
                <div className="gsi-material-button-content-wrapper flex items-center gap-3">
                  <div className="gsi-material-button-icon w-5 h-5">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                  </div>
                  <span className="gsi-material-button-contents text-sm font-semibold tracking-wide text-gray-700">Conectar Google Drive</span>
                </div>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Connected Header */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="User Avatar" 
                      className="w-10 h-10 rounded-full border border-white/15"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-inboxa-coral rounded-full flex items-center justify-center font-bold text-white uppercase text-sm">
                      {user?.displayName ? user.displayName.substring(0, 2) : 'GD'}
                    </div>
                  )}
                  <div>
                    <p className="font-bold text-sm">{user?.displayName || 'Usuario Google'}</p>
                    <p className="text-xs text-white/40">{user?.email || 'Conectado de forma segura'}</p>
                  </div>
                </div>
                <button 
                  onClick={handleGoogleLogout}
                  className="p-2 text-white/40 hover:text-white transition-colors"
                  title="Desvincular Cuenta"
                >
                  <LogOut size={18} />
                </button>
              </div>

              {/* Action Trigger Row */}
              <div className="flex gap-4">
                <button
                  onClick={handleCreateBackup}
                  disabled={isBackingUp || isRestoring}
                  className="flex-1 btn-primary bg-inboxa-coral text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-inboxa-coral/90 transition-all text-sm disabled:opacity-50"
                >
                  {isBackingUp ? (
                    <RefreshCw className="animate-spin" size={18} />
                  ) : (
                    <DatabaseBackup size={18} />
                  )}
                  {isBackingUp ? 'Creando Respaldo...' : 'Crear Respaldo Ahora'}
                </button>
                <button
                  onClick={() => loadBackupsList(token)}
                  disabled={isLoadingBackups || isRestoring}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors disabled:opacity-30"
                  title="Actualizar listado de archivos"
                >
                  <RefreshCw size={18} className={isLoadingBackups ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Files explorer list */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-widest">
                  <FolderOpen size={14} />
                  <span>Carpeta "INBOXA_COL_BACKUPS" en Drive ({backups.length})</span>
                </div>

                {isLoadingBackups ? (
                  <div className="py-8 flex flex-col items-center justify-center gap-3 text-white/40">
                    <RefreshCw className="animate-spin text-inboxa-coral" size={24} />
                    <span className="text-xs">Buscando respaldos...</span>
                  </div>
                ) : backups.length === 0 ? (
                  <div className="p-4 bg-white/5 border border-dashed border-white/15 rounded-xl text-center text-xs text-white/40">
                    No se han encontrado archivos `.json` de respaldo en Drive. ¡Crea el primero!
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto divide-y divide-white/10 bg-white/5 rounded-xl border border-white/10 pr-2">
                    {backups.map((bk) => (
                      <div key={bk.id} className="p-4 flex items-center justify-between gap-4 group">
                        <div className="flex items-start gap-3 min-w-0">
                          <FileJson size={20} className="text-inboxa-yellow mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-ellipsis overflow-hidden whitespace-nowrap" title={bk.name}>
                              {bk.name}
                            </p>
                            <p className="text-xs text-white/40 mt-0.5">
                              {new Date(bk.modifiedTime).toLocaleString()} • {formatBytes(bk.size)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRestoreBackup(bk)}
                            disabled={isRestoring || isBackingUp}
                            className="px-3 py-1.5 bg-inboxa-yellow/10 hover:bg-inboxa-yellow text-inboxa-yellow hover:text-black rounded-lg font-bold text-xs transition-all disabled:opacity-30 whitespace-nowrap"
                          >
                            Restaurar
                          </button>
                          <button
                            onClick={() => handleDeleteBackup(bk.id)}
                            disabled={isDeletingId === bk.id || isRestoring}
                            className="p-2 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                            title="Eliminar Respaldo"
                          >
                            {isDeletingId === bk.id ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {isRestoring && (
            <div className="p-4 bg-inboxa-yellow/10 border border-inboxa-yellow/30 text-inboxa-yellow rounded-xl flex items-center gap-3 text-sm animate-pulse">
              <RefreshCw size={18} className="animate-spin flex-shrink-0" />
              <span>Restaurando respaldo en curso... Por favor no cierres la app.</span>
            </div>
          )}
        </div>

        {/* Google Sheets Sync & Security */}
        <div className="flex flex-col gap-8">
          {/* Google Sheets Synchronization Card */}
          <div className="card-glass p-6 flex flex-col gap-6">
            <div className="flex items-center gap-3 text-inboxa-coral">
              <FileSpreadsheet size={24} />
              <h3 className="text-xl font-bold">Importación Hojas de Cálculo</h3>
            </div>
            
            <p className="text-sm text-white/60 leading-relaxed">
              El centro sincroniza automáticamente el catálogo e inventario cada <strong className="text-white">20 segundos</strong> desde tus Hojas de Cálculo de Google asociadas.
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10 divide-y divide-white/5">
                <div className="pb-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white/40 uppercase">Inventario y Catálogo</span>
                    <p className="text-sm font-medium">Inventario_Inboxa</p>
                  </div>
                  <a 
                    href="https://docs.google.com/spreadsheets/d/1zLLBY2qzxmdPTAC9qrhfSYHilvA9GXZiKFpxPPf0SY0/edit?usp=sharing" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
                <div className="pt-2.5 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white/40 uppercase">Clientes Directos</span>
                    <p className="text-sm font-medium">Clientes_Base_Inboxa</p>
                  </div>
                  <a 
                    href="https://docs.google.com/spreadsheets/d/1cO-X-MiKA1xb2x09jbzx-61rQBnEk4JhPwD9mR6MewU/edit?usp=sharing" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Actualización constante (20s) activa
                </div>
              </div>
            </div>

            <button 
              onClick={handleForceSheetsSync}
              disabled={isSyncingSheets}
              className="btn-primary flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white disabled:opacity-50"
            >
              <RefreshCw size={18} className={isSyncingSheets ? 'animate-spin' : ''} />
              {isSyncingSheets ? 'Sincronizando...' : 'Forzar Sincronización Completa'}
            </button>

            {sheetsSyncInfo && (
              <div className="p-3 bg-white/5 rounded-lg text-white/70 text-xs text-center border border-white/10">
                {sheetsSyncInfo}
              </div>
            )}
          </div>

          {/* Security & Access Box */}
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
                <span className="text-sm font-medium">Alertas de Stock (&lt; 2 unidades)</span>
                <div className="w-10 h-5 bg-green-500 rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Run Service URL */}
      <div className="mt-auto card-glass p-6 border-dashed border-white/20 bg-transparent flex flex-col items-center justify-center gap-2">
        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Service Endpoint</p>
        <p className="font-mono text-sm text-inboxa-coral">{process.env.APP_URL || 'https://ais-pre-so7bnp35l5r6kxudodkhgb-292174000955.us-west1.run.app'}</p>
      </div>
    </div>
  );
};

