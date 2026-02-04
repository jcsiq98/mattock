import { useAppStore } from '../stores/useAppStore';
import {
  UserIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  TrashIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export function Settings() {
  const { inspectorName, setInspectorName, isOnline, pendingSyncCount } = useAppStore();

  return (
    <div className="p-4 space-y-6">
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
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success-500' : 'bg-warning-500'}`} />
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Pending Changes</span>
          <span className="font-medium text-slate-900">{pendingSyncCount}</span>
        </div>
      </section>

      {/* Data Management */}
      <section className="card space-y-3">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <CloudArrowDownIcon className="w-5 h-5" />
          Data Management
        </h3>
        <button className="btn-secondary w-full justify-start">
          <CloudArrowDownIcon className="w-5 h-5 mr-3" />
          Export All Data
        </button>
        <button className="btn-secondary w-full justify-start">
          <CloudArrowUpIcon className="w-5 h-5 mr-3" />
          Import Data
        </button>
        <button className="btn w-full justify-start text-danger-600 hover:bg-danger-50">
          <TrashIcon className="w-5 h-5 mr-3" />
          Clear All Data
        </button>
      </section>

      {/* App Info */}
      <section className="card space-y-2">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <InformationCircleIcon className="w-5 h-5" />
          About
        </h3>
        <div className="text-sm text-slate-600 space-y-1">
          <p><strong>Property Inspector</strong> v0.1.0</p>
          <p>Mobile-first inspection app with offline support</p>
          <p className="text-xs text-slate-400 pt-2">
            Milestone 6 Complete • MVP in Progress
          </p>
        </div>
      </section>
    </div>
  );
}

