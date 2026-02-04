import { useState, useRef } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { useOnlineStatus, formatLastSynced } from '../hooks';
import { exportAllData, importData, clearAllData, getStorageEstimate } from '../services/database';
import {
  UserIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  TrashIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';

export function Settings() {
  const { inspectorName, setInspectorName } = useAppStore();
  const { isOnline, pendingSyncCount, lastSyncedAt, isSyncing, processSync } = useOnlineStatus();
  
  const [exportStatus, setExportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [storageInfo, setStorageInfo] = useState<{ used: number; percentage: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load storage info
  useState(() => {
    getStorageEstimate().then(setStorageInfo);
  });

  async function handleExport() {
    try {
      setExportStatus(null);
      const data = await exportAllData();
      
      // Create and download file
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `property-inspector-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportStatus({ type: 'success', message: 'Data exported successfully!' });
    } catch (error) {
      setExportStatus({ type: 'error', message: 'Failed to export data' });
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus(null);
      const text = await file.text();
      const result = await importData(text);
      
      if (result.success) {
        setImportStatus({ type: 'success', message: result.message });
        // Refresh the page to load new data
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setImportStatus({ type: 'error', message: result.message });
      }
    } catch (error) {
      setImportStatus({ type: 'error', message: 'Failed to read file' });
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleClearData() {
    try {
      await clearAllData();
      setShowClearConfirm(false);
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear data:', error);
    }
  }

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <h2 className="text-xl font-bold text-slate-900">Settings</h2>

      {/* Inspector Profile */}
      <section className="card space-y-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <UserIcon className="w-5 h-5" />
          Inspector Profile
        </h3>
        <div>
          <label htmlFor="inspectorName" className="block text-sm font-medium text-slate-700 mb-1">
            Your Name
          </label>
          <input
            id="inspectorName"
            type="text"
            className="input"
            placeholder="Enter your name"
            value={inspectorName}
            onChange={(e) => setInspectorName(e.target.value)}
          />
          <p className="text-xs text-slate-500 mt-1">
            This name will appear on inspection reports
          </p>
        </div>
      </section>

      {/* Sync Status */}
      <section className="card space-y-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <CloudArrowUpIcon className="w-5 h-5" />
          Sync Status
        </h3>
        
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Connection</span>
          <span className={`flex items-center gap-2 font-medium ${isOnline ? 'text-success-600' : 'text-warning-600'}`}>
            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-success-500' : 'bg-warning-500'} ${!isOnline ? 'animate-pulse' : ''}`} />
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Pending Changes</span>
          <span className={`font-medium ${pendingSyncCount > 0 ? 'text-warning-600' : 'text-slate-900'}`}>
            {pendingSyncCount}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Last Synced</span>
          <span className="text-slate-900">{formatLastSynced(lastSyncedAt)}</span>
        </div>

        {pendingSyncCount > 0 && isOnline && (
          <button
            onClick={processSync}
            disabled={isSyncing}
            className="btn-primary w-full"
          >
            {isSyncing ? (
              <span className="flex items-center justify-center gap-2">
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                Syncing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <ArrowPathIcon className="w-5 h-5" />
                Sync Now
              </span>
            )}
          </button>
        )}

        {!isOnline && (
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 text-sm text-warning-700">
            <p className="font-medium">You're offline</p>
            <p className="text-warning-600">Changes will sync when you're back online.</p>
          </div>
        )}
      </section>

      {/* Data Management */}
      <section className="card space-y-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <CloudArrowDownIcon className="w-5 h-5" />
          Data Management
        </h3>

        {/* Storage Info */}
        {storageInfo && (
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600">Storage Used</span>
              <span className="font-medium">{formatBytes(storageInfo.used)}</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${storageInfo.percentage > 80 ? 'bg-warning-500' : 'bg-primary-500'}`}
                style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">{storageInfo.percentage}% of available storage</p>
          </div>
        )}

        {/* Export */}
        <button onClick={handleExport} className="btn-secondary w-full justify-start">
          <DocumentArrowDownIcon className="w-5 h-5 mr-3" />
          Export All Data
        </button>
        
        {exportStatus && (
          <div className={`flex items-center gap-2 text-sm p-2 rounded ${
            exportStatus.type === 'success' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
          }`}>
            {exportStatus.type === 'success' ? (
              <CheckCircleIcon className="w-4 h-4" />
            ) : (
              <ExclamationTriangleIcon className="w-4 h-4" />
            )}
            {exportStatus.message}
          </div>
        )}

        {/* Import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="btn-secondary w-full justify-start"
        >
          <DocumentArrowUpIcon className="w-5 h-5 mr-3" />
          Import Data
        </button>
        
        {importStatus && (
          <div className={`flex items-center gap-2 text-sm p-2 rounded ${
            importStatus.type === 'success' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
          }`}>
            {importStatus.type === 'success' ? (
              <CheckCircleIcon className="w-4 h-4" />
            ) : (
              <ExclamationTriangleIcon className="w-4 h-4" />
            )}
            {importStatus.message}
          </div>
        )}

        {/* Clear Data */}
        <button 
          onClick={() => setShowClearConfirm(true)}
          className="btn w-full justify-start text-danger-600 hover:bg-danger-50"
        >
          <TrashIcon className="w-5 h-5 mr-3" />
          Clear All Data
        </button>
      </section>

      {/* App Info */}
      <section className="card space-y-3">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <InformationCircleIcon className="w-5 h-5" />
          About
        </h3>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-9 h-9 text-primary-600" viewBox="0 0 100 100" fill="none">
              <path
                d="M25 70V35l25-15 25 15v35l-25 15-25-15z"
                stroke="currentColor"
                strokeWidth="6"
                strokeLinejoin="round"
              />
              <circle cx="50" cy="50" r="7" fill="currentColor" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Property Inspector</p>
            <p className="text-sm text-slate-500">Version 0.9.0</p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
          <p>Mobile-first property inspection app with:</p>
          <ul className="mt-2 space-y-1 text-slate-500">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-success-500 rounded-full" />
              Custom inspection templates
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-success-500 rounded-full" />
              Photo capture & annotation
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-success-500 rounded-full" />
              Offline-first architecture
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-success-500 rounded-full" />
              Professional PDF reports
            </li>
          </ul>
        </div>
        <p className="text-xs text-slate-400">
          Milestone 9 Complete • MVP Ready
        </p>
        <button
          onClick={() => {
            localStorage.removeItem('mattock_onboarding_complete');
            window.location.reload();
          }}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
        >
          Show Welcome Screen Again
        </button>
      </section>

      {/* PWA Install Hint */}
      <section className="card bg-primary-50 border-primary-200">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <CloudArrowDownIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h4 className="font-semibold text-primary-900">Install App</h4>
            <p className="text-sm text-primary-700 mt-1">
              For the best experience, install this app to your home screen. 
              Look for "Add to Home Screen" in your browser menu.
            </p>
          </div>
        </div>
      </section>

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-danger-100 flex items-center justify-center">
                <TrashIcon className="w-7 h-7 text-danger-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Clear All Data?</h3>
                <p className="text-sm text-slate-500">This cannot be undone</p>
              </div>
            </div>
            
            <p className="text-slate-600">
              This will permanently delete all templates, inspections, and photos. 
              Consider exporting your data first.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                className="btn-danger flex-1"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
