import { Link } from 'react-router-dom';
import { PlusIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

export function InspectionList() {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Inspections</h2>
        <Link to="/inspections/new" className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          New
        </Link>
      </div>

      {/* Empty State */}
      <div className="card text-center py-12">
        <ClipboardDocumentCheckIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          No inspections yet
        </h3>
        <p className="text-slate-500 mb-6 max-w-xs mx-auto">
          Start your first property inspection to document conditions with photos and notes.
        </p>
        <Link to="/inspections/new" className="btn-primary inline-flex">
          <PlusIcon className="w-5 h-5 mr-2" />
          Start Inspection
        </Link>
      </div>

      {/* Inspection list will be rendered here in Milestone 4 */}
    </div>
  );
}

