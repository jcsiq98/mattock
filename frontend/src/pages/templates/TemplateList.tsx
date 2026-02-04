import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';
import { useTemplateStore, useFilteredTemplates } from '../../stores/useTemplateStore';
import { PROPERTY_TYPE_LABELS, type PropertyType } from '../../types/template';

export function TemplateList() {
  const navigate = useNavigate();
  const { loadTemplates, deleteTemplate, duplicateTemplate, searchQuery, setSearchQuery, isLoading } = useTemplateStore();
  const templates = useFilteredTemplates();
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleDelete = async (id: string) => {
    await deleteTemplate(id);
    setDeleteConfirm(null);
  };

  const handleDuplicate = async (id: string) => {
    const newId = await duplicateTemplate(id);
    setMenuOpen(null);
    if (newId) {
      navigate(`/templates/${newId}`);
    }
  };

  const getItemCount = (template: { sections: Array<{ items: unknown[] }> }) => {
    return template.sections.reduce((acc, section) => acc + section.items.length, 0);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

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

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search templates..."
          className="input pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-5 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && templates.length === 0 && (
        <div className="card text-center py-12">
          <ClipboardDocumentListIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {searchQuery ? 'No templates found' : 'No templates yet'}
          </h3>
          <p className="text-slate-500 mb-6 max-w-xs mx-auto">
            {searchQuery 
              ? 'Try a different search term'
              : 'Create your first checklist template to start inspecting properties.'
            }
          </p>
          {!searchQuery && (
            <Link to="/templates/new" className="btn-primary inline-flex">
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Template
            </Link>
          )}
        </div>
      )}

      {/* Template Cards */}
      {!isLoading && templates.length > 0 && (
        <div className="space-y-3">
          {templates.map((template) => (
            <div
              key={template.id}
              className="card relative"
            >
              <Link
                to={`/templates/${template.id}`}
                className="block"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-8">
                    <h3 className="font-semibold text-slate-900 truncate">
                      {template.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="badge bg-primary-50 text-primary-700">
                        {PROPERTY_TYPE_LABELS[template.propertyType as PropertyType] || template.propertyType}
                      </span>
                      <span className="text-sm text-slate-500">
                        {template.sections.length} sections • {getItemCount(template)} items
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      Updated {formatDate(template.updatedAt)}
                    </p>
                  </div>
                </div>
              </Link>

              {/* Actions Menu */}
              <div className="absolute top-4 right-4">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setMenuOpen(menuOpen === template.id ? null : template.id);
                  }}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <EllipsisVerticalIcon className="w-5 h-5" />
                </button>

                {menuOpen === template.id && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setMenuOpen(null)}
                    />
                    {/* Menu */}
                    <div className="absolute right-0 top-10 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-20 min-w-[160px]">
                      <button
                        onClick={() => handleDuplicate(template.id)}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <DocumentDuplicateIcon className="w-4 h-4" />
                        Duplicate
                      </button>
                      <button
                        onClick={() => {
                          setMenuOpen(null);
                          setDeleteConfirm(template.id);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-2"
                      >
                        <TrashIcon className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Delete Template?
            </h3>
            <p className="text-slate-600 mb-6">
              This action cannot be undone. The template will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="btn-danger flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
