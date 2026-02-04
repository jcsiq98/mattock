import { Link } from 'react-router-dom';
import { PlusIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export function TemplateList() {
  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Templates</h2>
        <Link to="/templates/new" className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          New
        </Link>
      </div>

      {/* Empty State */}
      <div className="card text-center py-12">
        <DocumentTextIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          No templates yet
        </h3>
        <p className="text-slate-500 mb-6 max-w-xs mx-auto">
          Create your first checklist template to start inspecting properties.
        </p>
        <Link to="/templates/new" className="btn-primary inline-flex">
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Template
        </Link>
      </div>

      {/* Template list will be rendered here in Milestone 3 */}
    </div>
  );
}

