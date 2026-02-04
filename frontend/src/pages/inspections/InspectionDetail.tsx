import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export function InspectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

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
        <h2 className="text-xl font-bold text-slate-900">Inspection #{id}</h2>
      </div>

      {/* Placeholder for inspection detail */}
      <div className="card">
        <p className="text-slate-500 text-center py-8">
          Inspection checklist will be implemented in Milestone 4
        </p>
      </div>
    </div>
  );
}

