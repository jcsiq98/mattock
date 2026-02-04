import { Link } from 'react-router-dom';
import {
  PlusIcon,
  ClipboardDocumentListIcon,
  DocumentMagnifyingGlassIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export function Dashboard() {
  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <section className="card">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Welcome to Property Inspector
        </h2>
        <p className="text-slate-600">
          Create detailed property inspections with photos, annotations, and
          professional PDF reports.
        </p>
      </section>

      {/* Quick Actions */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">
          Quick Actions
        </h3>
        
        <Link
          to="/inspections/new"
          className="card flex items-center gap-4 hover:border-primary-300 transition-colors"
        >
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <PlusIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900">New Inspection</h4>
            <p className="text-sm text-slate-500">Start a property inspection</p>
          </div>
          <ArrowRightIcon className="w-5 h-5 text-slate-400" />
        </Link>

        <Link
          to="/inspections"
          className="card flex items-center gap-4 hover:border-primary-300 transition-colors"
        >
          <div className="w-12 h-12 bg-success-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <DocumentMagnifyingGlassIcon className="w-6 h-6 text-success-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900">My Inspections</h4>
            <p className="text-sm text-slate-500">View and manage inspections</p>
          </div>
          <ArrowRightIcon className="w-5 h-5 text-slate-400" />
        </Link>

        <Link
          to="/templates"
          className="card flex items-center gap-4 hover:border-primary-300 transition-colors"
        >
          <div className="w-12 h-12 bg-warning-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <ClipboardDocumentListIcon className="w-6 h-6 text-warning-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900">Templates</h4>
            <p className="text-sm text-slate-500">Manage checklist templates</p>
          </div>
          <ArrowRightIcon className="w-5 h-5 text-slate-400" />
        </Link>
      </section>

      {/* Stats placeholder */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">
          Overview
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center">
            <div className="text-3xl font-bold text-primary-600">0</div>
            <div className="text-sm text-slate-500">Inspections</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold text-success-600">0</div>
            <div className="text-sm text-slate-500">Completed</div>
          </div>
        </div>
      </section>

      {/* Offline indicator */}
      <section className="card bg-slate-100 border-dashed">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <div className="w-2 h-2 bg-success-500 rounded-full" />
          <span>Works offline • All data saved locally</span>
        </div>
      </section>
    </div>
  );
}

