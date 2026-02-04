import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-slate-900">
          {isNew ? 'New Template' : 'Edit Template'}
        </h2>
      </div>

      {/* Placeholder for template editor */}
      <div className="card">
        <p className="text-slate-500 text-center py-8">
          Template editor will be implemented in Milestone 3
        </p>
      </div>
    </div>
  );
}

