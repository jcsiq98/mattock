import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  MinusIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CameraIcon,
  ChatBubbleLeftIcon,
  CheckCircleIcon,
  LockClosedIcon,
  LockOpenIcon,
  EllipsisVerticalIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { inspectionService } from '../../services/inspectionService';
import type { Inspection, ItemStatus, InspectionSection, InspectionItem } from '../../types/inspection';
import { ITEM_STATUS_LABELS, calculateInspectionSummary } from '../../types/inspection';

export function InspectionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadInspection(id);
    }
  }, [id]);

  async function loadInspection(inspectionId: string) {
    try {
      setLoading(true);
      const data = await inspectionService.getById(inspectionId);
      if (data) {
        setInspection(data);
        // Expand first section by default
        if (data.sections.length > 0) {
          setExpandedSections(new Set([data.sections[0].sectionId]));
        }
      }
    } catch (error) {
      console.error('Failed to load inspection:', error);
    } finally {
      setLoading(false);
    }
  }

  const autoSave = useCallback(
    async (updatedInspection: Inspection) => {
      setSaving(true);
      try {
        await inspectionService.update(updatedInspection.id, {
          sections: updatedInspection.sections,
          status: updatedInspection.status,
          updatedAt: new Date(),
        });
      } catch (error) {
        console.error('Auto-save failed:', error);
      } finally {
        // Brief delay to show saving indicator
        setTimeout(() => setSaving(false), 300);
      }
    },
    []
  );

  function handleStatusChange(sectionId: string, itemId: string, status: ItemStatus) {
    if (!inspection || inspection.status === 'completed') return;

    const updatedInspection = { ...inspection };
    const section = updatedInspection.sections.find((s) => s.sectionId === sectionId);
    if (!section) return;

    const item = section.items.find((i) => i.itemId === itemId);
    if (!item) return;

    item.status = status;

    // Update status to in_progress if it was draft
    if (updatedInspection.status === 'draft') {
      updatedInspection.status = 'in_progress';
    }

    updatedInspection.updatedAt = new Date();
    setInspection(updatedInspection);
    autoSave(updatedInspection);
  }

  function handleNotesChange(sectionId: string, itemId: string, notes: string) {
    if (!inspection || inspection.status === 'completed') return;

    const updatedInspection = { ...inspection };
    const section = updatedInspection.sections.find((s) => s.sectionId === sectionId);
    if (!section) return;

    const item = section.items.find((i) => i.itemId === itemId);
    if (!item) return;

    item.notes = notes;
    updatedInspection.updatedAt = new Date();
    setInspection(updatedInspection);
    
    // Debounced save for notes
    autoSave(updatedInspection);
  }

  function toggleSection(sectionId: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }

  function toggleNotes(itemId: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  }

  async function handleComplete() {
    if (!inspection) return;

    try {
      await inspectionService.complete(inspection.id);
      setInspection({
        ...inspection,
        status: 'completed',
        completedAt: new Date(),
      });
      setShowCompleteModal(false);
    } catch (error) {
      console.error('Failed to complete inspection:', error);
    }
  }

  async function handleReopen() {
    if (!inspection) return;

    try {
      await inspectionService.reopen(inspection.id);
      setInspection({
        ...inspection,
        status: 'in_progress',
        completedAt: undefined,
      });
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to reopen inspection:', error);
    }
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded animate-pulse" />
          <div className="h-7 w-40 bg-slate-200 rounded animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card h-32 animate-pulse bg-slate-100" />
        ))}
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="p-4">
        <div className="card text-center py-12">
          <p className="text-slate-500">Inspection not found</p>
          <button
            onClick={() => navigate('/inspections')}
            className="btn-primary mt-4"
          >
            Back to Inspections
          </button>
        </div>
      </div>
    );
  }

  const summary = calculateInspectionSummary(inspection);
  const isCompleted = inspection.status === 'completed';
  const canComplete = summary.pendingCount === 0 && summary.totalItems > 0;

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => navigate('/inspections')}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900 truncate">
              {inspection.address}
              {inspection.unit && <span className="text-slate-500 font-normal"> #{inspection.unit}</span>}
            </h2>
            <p className="text-sm text-slate-500">{inspection.templateName}</p>
          </div>
          
          {/* Saving indicator */}
          {saving && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving
            </span>
          )}

          {/* Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-slate-600 hover:text-slate-900"
            >
              <EllipsisVerticalIcon className="w-6 h-6" />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 min-w-[160px]">
                  {isCompleted ? (
                    <button
                      onClick={handleReopen}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                    >
                      <LockOpenIcon className="w-4 h-4" />
                      Reopen Inspection
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        setShowCompleteModal(true);
                      }}
                      disabled={!canComplete}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LockClosedIcon className="w-4 h-4" />
                      Complete Inspection
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-600">
              {summary.completedItems} of {summary.totalItems} items
            </span>
            <span className="font-semibold text-primary-600">{summary.completionPercentage}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isCompleted ? 'bg-success-500' : 'bg-primary-500'
              }`}
              style={{ width: `${summary.completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Status Banner */}
        {isCompleted && (
          <div className="bg-success-50 border-t border-success-100 px-4 py-2 flex items-center gap-2 text-success-700">
            <CheckCircleSolid className="w-5 h-5" />
            <span className="text-sm font-medium">
              Completed on {formatDate(inspection.completedAt!)}
            </span>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border-t border-slate-100 overflow-x-auto scrollbar-hide">
          {summary.okCount > 0 && (
            <span className="badge-ok whitespace-nowrap">
              <CheckIcon className="w-3 h-3 mr-1" />
              {summary.okCount} OK
            </span>
          )}
          {summary.attentionCount > 0 && (
            <span className="badge-attention whitespace-nowrap">
              <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
              {summary.attentionCount} Attention
            </span>
          )}
          {summary.naCount > 0 && (
            <span className="badge-na whitespace-nowrap">
              <MinusIcon className="w-3 h-3 mr-1" />
              {summary.naCount} N/A
            </span>
          )}
          {summary.pendingCount > 0 && (
            <span className="badge-pending whitespace-nowrap">
              {summary.pendingCount} Pending
            </span>
          )}
        </div>
      </div>

      {/* Inspection Info */}
      <div className="p-4 space-y-2 bg-white border-b border-slate-200">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
          <span className="flex items-center gap-1">
            <CalendarIcon className="w-4 h-4" />
            {formatDate(inspection.startedAt)}
          </span>
          <span className="flex items-center gap-1">
            <UserIcon className="w-4 h-4" />
            {inspection.inspectorName}
          </span>
          {inspection.tenantName && (
            <span className="flex items-center gap-1">
              Tenant: {inspection.tenantName}
            </span>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="p-4 space-y-3">
        {inspection.sections
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <SectionCard
              key={section.sectionId}
              section={section}
              expanded={expandedSections.has(section.sectionId)}
              onToggle={() => toggleSection(section.sectionId)}
              expandedNotes={expandedNotes}
              onToggleNotes={toggleNotes}
              onStatusChange={(itemId, status) =>
                handleStatusChange(section.sectionId, itemId, status)
              }
              onNotesChange={(itemId, notes) =>
                handleNotesChange(section.sectionId, itemId, notes)
              }
              disabled={isCompleted}
            />
          ))}
      </div>

      {/* Complete Button (fixed at bottom) */}
      {!isCompleted && (
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-8">
          <button
            onClick={() => setShowCompleteModal(true)}
            disabled={!canComplete}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
              canComplete
                ? 'bg-success-500 text-white hover:bg-success-600 active:scale-[0.98]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {canComplete ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircleIcon className="w-6 h-6" />
                Complete Inspection
              </span>
            ) : (
              `${summary.pendingCount} item${summary.pendingCount !== 1 ? 's' : ''} remaining`
            )}
          </button>
        </div>
      )}

      {/* Complete Confirmation Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
                <CheckCircleIcon className="w-7 h-7 text-success-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Complete Inspection?</h3>
                <p className="text-sm text-slate-500">This will lock the inspection</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">OK Items</span>
                <span className="font-medium text-success-600">{summary.okCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Needs Attention</span>
                <span className="font-medium text-warning-600">{summary.attentionCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">N/A</span>
                <span className="font-medium text-slate-500">{summary.naCount}</span>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              You can reopen the inspection later if you need to make changes.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCompleteModal(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button onClick={handleComplete} className="btn-success flex-1">
                Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Section Card Component
interface SectionCardProps {
  section: InspectionSection;
  expanded: boolean;
  onToggle: () => void;
  expandedNotes: Set<string>;
  onToggleNotes: (itemId: string) => void;
  onStatusChange: (itemId: string, status: ItemStatus) => void;
  onNotesChange: (itemId: string, notes: string) => void;
  disabled: boolean;
}

function SectionCard({
  section,
  expanded,
  onToggle,
  expandedNotes,
  onToggleNotes,
  onStatusChange,
  onNotesChange,
  disabled,
}: SectionCardProps) {
  const completedCount = section.items.filter((i) => i.status !== 'pending').length;
  const totalCount = section.items.length;
  const allComplete = completedCount === totalCount && totalCount > 0;

  return (
    <div className="card p-0 overflow-hidden">
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            allComplete ? 'bg-success-100' : 'bg-slate-100'
          }`}
        >
          {allComplete ? (
            <CheckCircleSolid className="w-6 h-6 text-success-600" />
          ) : (
            <span className="font-bold text-slate-600">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900">{section.name}</h3>
          <p className="text-sm text-slate-500">
            {completedCount} of {totalCount} items complete
          </p>
        </div>
        {expanded ? (
          <ChevronUpIcon className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDownIcon className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {/* Section Items */}
      {expanded && (
        <div className="border-t border-slate-100">
          {section.items
            .sort((a, b) => a.order - b.order)
            .map((item, index) => (
              <ItemCard
                key={item.itemId}
                item={item}
                isLast={index === section.items.length - 1}
                notesExpanded={expandedNotes.has(item.itemId)}
                onToggleNotes={() => onToggleNotes(item.itemId)}
                onStatusChange={(status) => onStatusChange(item.itemId, status)}
                onNotesChange={(notes) => onNotesChange(item.itemId, notes)}
                disabled={disabled}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// Item Card Component
interface ItemCardProps {
  item: InspectionItem;
  isLast: boolean;
  notesExpanded: boolean;
  onToggleNotes: () => void;
  onStatusChange: (status: ItemStatus) => void;
  onNotesChange: (notes: string) => void;
  disabled: boolean;
}

function ItemCard({
  item,
  isLast,
  notesExpanded,
  onToggleNotes,
  onStatusChange,
  onNotesChange,
  disabled,
}: ItemCardProps) {
  const statusButtons: { status: ItemStatus; icon: typeof CheckIcon; label: string; colors: string }[] = [
    {
      status: 'ok',
      icon: CheckIcon,
      label: 'OK',
      colors: item.status === 'ok'
        ? 'bg-success-500 text-white border-success-500'
        : 'bg-white text-success-600 border-success-300 hover:bg-success-50',
    },
    {
      status: 'attention',
      icon: ExclamationTriangleIcon,
      label: 'Attention',
      colors: item.status === 'attention'
        ? 'bg-warning-500 text-white border-warning-500'
        : 'bg-white text-warning-600 border-warning-300 hover:bg-warning-50',
    },
    {
      status: 'na',
      icon: MinusIcon,
      label: 'N/A',
      colors: item.status === 'na'
        ? 'bg-slate-500 text-white border-slate-500'
        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50',
    },
  ];

  return (
    <div className={`p-4 ${!isLast ? 'border-b border-slate-100' : ''}`}>
      {/* Item Text */}
      <p className="text-slate-900 mb-3">{item.text}</p>

      {/* Status Buttons */}
      <div className="flex gap-2 mb-2">
        {statusButtons.map(({ status, icon: Icon, label, colors }) => (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            disabled={disabled}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg border-2 font-medium text-sm transition-all ${colors} ${
              disabled ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden xs:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Actions Row */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleNotes}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            item.notes || notesExpanded
              ? 'bg-primary-50 text-primary-600'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ChatBubbleLeftIcon className="w-4 h-4" />
          {item.notes ? 'Edit Note' : 'Add Note'}
        </button>
        
        {/* Photo button placeholder - will be functional in Milestone 5 */}
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          title="Photo capture coming in Milestone 5"
        >
          <CameraIcon className="w-4 h-4" />
          {item.photoIds.length > 0 ? item.photoIds.length : 'Photo'}
        </button>
      </div>

      {/* Notes Input */}
      {notesExpanded && (
        <div className="mt-3">
          <textarea
            value={item.notes}
            onChange={(e) => onNotesChange(e.target.value)}
            disabled={disabled}
            placeholder="Add notes about this item..."
            className="input min-h-[80px] resize-none text-sm"
            rows={3}
          />
        </div>
      )}

      {/* Show notes preview when collapsed */}
      {!notesExpanded && item.notes && (
        <button
          onClick={onToggleNotes}
          className="mt-2 text-sm text-slate-500 italic truncate w-full text-left hover:text-slate-700"
        >
          "{item.notes}"
        </button>
      )}
    </div>
  );
}
