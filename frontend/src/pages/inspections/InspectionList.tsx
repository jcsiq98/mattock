import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  DocumentTextIcon,
  PlayIcon,
  ChevronRightIcon,
  MapPinIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { inspectionService } from '../../services/inspectionService';
import { photoService } from '../../services/photoService';
import type { Inspection, InspectionSummary } from '../../types/inspection';
import { calculateInspectionSummary } from '../../types/inspection';

interface InspectionWithSummary {
  inspection: Inspection;
  summary: InspectionSummary;
}

export function InspectionList() {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<InspectionWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadInspections();
  }, []);

  async function loadInspections() {
    try {
      setLoading(true);
      const all = await inspectionService.getAll();
      
      // Load summaries with photo counts
      const withSummaries = await Promise.all(
        all.map(async (inspection) => {
          const photoCount = await photoService.countByInspection(inspection.id);
          return {
            inspection,
            summary: calculateInspectionSummary(inspection, photoCount),
          };
        })
      );
      
      setInspections(withSummaries);
    } catch (error) {
      console.error('Failed to load inspections:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await inspectionService.delete(id);
      setInspections(prev => prev.filter(i => i.inspection.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete inspection:', error);
    }
  }

  // Filter inspections by search query
  const filteredInspections = inspections.filter(({ inspection }) =>
    inspection.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inspection.tenantName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inspection.unit?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by status
  const inProgress = filteredInspections.filter(
    ({ inspection }) => inspection.status === 'draft' || inspection.status === 'in_progress'
  );
  const completed = filteredInspections.filter(
    ({ inspection }) => inspection.status === 'completed'
  );

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function formatTime(date: Date) {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function getStatusColor(status: Inspection['status']) {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-600';
      case 'in_progress':
        return 'bg-primary-50 text-primary-600';
      case 'completed':
        return 'bg-success-50 text-success-600';
    }
  }

  function getStatusLabel(status: Inspection['status']) {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
    }
  }

  function InspectionCard({ inspection, summary }: InspectionWithSummary) {
    const isDeleting = deleteConfirm === inspection.id;

    return (
      <div className="card group relative overflow-hidden">
        {/* Delete Confirmation Overlay */}
        {isDeleting && (
          <div className="absolute inset-0 bg-white/95 z-10 flex items-center justify-center gap-3 p-4">
            <p className="text-sm text-slate-600">Delete this inspection?</p>
            <button
              onClick={() => handleDelete(inspection.id)}
              className="btn-danger px-3 py-2 text-sm"
            >
              Delete
            </button>
            <button
              onClick={() => setDeleteConfirm(null)}
              className="btn-secondary px-3 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex items-start gap-3">
          {/* Progress Circle */}
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="24"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                className="text-slate-100"
              />
              <circle
                cx="28"
                cy="28"
                r="24"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${(summary.completionPercentage / 100) * 150.8} 150.8`}
                className={inspection.status === 'completed' ? 'text-success-500' : 'text-primary-500'}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-slate-700">
                {summary.completionPercentage}%
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 truncate">
                  {inspection.address}
                  {inspection.unit && (
                    <span className="text-slate-500 font-normal"> #{inspection.unit}</span>
                  )}
                </h3>
                {inspection.tenantName && (
                  <p className="text-sm text-slate-500 truncate">{inspection.tenantName}</p>
                )}
              </div>
              <span className={`badge text-xs whitespace-nowrap ${getStatusColor(inspection.status)}`}>
                {getStatusLabel(inspection.status)}
              </span>
            </div>

            {/* Meta info */}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5" />
                {formatDate(inspection.startedAt)}
              </span>
              <span>{inspection.templateName}</span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-3 mt-2">
              {summary.okCount > 0 && (
                <span className="badge-ok text-xs">{summary.okCount} OK</span>
              )}
              {summary.attentionCount > 0 && (
                <span className="badge-attention text-xs">{summary.attentionCount} Attention</span>
              )}
              {summary.pendingCount > 0 && (
                <span className="badge-pending text-xs">{summary.pendingCount} Pending</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => navigate(`/inspections/${inspection.id}`)}
            className="btn-primary flex-1 py-2 text-sm"
          >
            {inspection.status === 'completed' ? (
              <>
                <DocumentTextIcon className="w-4 h-4 mr-2" />
                View
              </>
            ) : (
              <>
                <PlayIcon className="w-4 h-4 mr-2" />
                Continue
              </>
            )}
          </button>
          <button
            onClick={() => setDeleteConfirm(inspection.id)}
            className="btn p-2 text-slate-400 hover:text-danger-500 hover:bg-danger-50"
            aria-label="Delete inspection"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-32 bg-slate-200 rounded animate-pulse" />
          <div className="h-10 w-20 bg-slate-200 rounded animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card h-40 animate-pulse bg-slate-100" />
        ))}
      </div>
    );
  }

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

      {/* Search */}
      {inspections.length > 0 && (
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by address, tenant, or unit..."
            className="input pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {/* Empty State */}
      {inspections.length === 0 && (
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
      )}

      {/* No Results */}
      {inspections.length > 0 && filteredInspections.length === 0 && (
        <div className="card text-center py-8">
          <MagnifyingGlassIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No inspections match your search</p>
        </div>
      )}

      {/* In Progress Section */}
      {inProgress.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">
            In Progress ({inProgress.length})
          </h3>
          {inProgress.map((item) => (
            <InspectionCard key={item.inspection.id} {...item} />
          ))}
        </section>
      )}

      {/* Completed Section */}
      {completed.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">
            Completed ({completed.length})
          </h3>
          {completed.map((item) => (
            <InspectionCard key={item.inspection.id} {...item} />
          ))}
        </section>
      )}
    </div>
  );
}
