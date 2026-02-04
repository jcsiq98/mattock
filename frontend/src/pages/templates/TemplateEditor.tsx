import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { useTemplateStore } from '../../stores/useTemplateStore';
import {
  createTemplate,
  createSection,
  createItem,
  PROPERTY_TYPE_LABELS,
  type ChecklistTemplate,
  type TemplateSection,
  type PropertyType,
} from '../../types/template';

export function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { loadTemplate, createTemplate: saveNewTemplate, updateTemplate, currentTemplate, setCurrentTemplate } = useTemplateStore();
  
  const isNew = !id || id === 'new';
  const [template, setTemplate] = useState<ChecklistTemplate | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [hasChanges, setHasChanges] = useState(false);

  // Load existing template or create new one
  useEffect(() => {
    if (isNew) {
      const newTemplate = createTemplate({ name: '', propertyType: 'other' });
      setTemplate(newTemplate);
      setExpandedSections(new Set());
      setHasChanges(false);
      setSaveStatus('unsaved'); // New templates start as unsaved
    } else {
      loadTemplate(id).then(() => {
        // Template will be in currentTemplate after load
      });
    }

    return () => setCurrentTemplate(null);
  }, [id, isNew, loadTemplate, setCurrentTemplate]);

  // Sync currentTemplate to local state
  useEffect(() => {
    if (!isNew && currentTemplate) {
      setTemplate(currentTemplate);
      // Expand all sections by default
      setExpandedSections(new Set(currentTemplate.sections.map(s => s.id)));
      setHasChanges(false);
      setSaveStatus('saved');
    }
  }, [currentTemplate, isNew]);

  // Manual save only - no auto-save
  const handleSave = useCallback(async () => {
    if (!template) return;
    
    if (!template.name.trim()) {
      alert('Please enter a template name before saving.');
      return;
    }
    
    setSaveStatus('saving');
    try {
      if (isNew) {
        const newId = await saveNewTemplate(template);
        if (newId) {
          setSaveStatus('saved');
          setHasChanges(false);
          // Navigate to edit the newly created template
          setTimeout(() => {
            navigate(`/templates/${newId}`, { replace: true });
          }, 500);
        }
      } else {
        await updateTemplate(template.id, template);
        setSaveStatus('saved');
        setHasChanges(false);
      }
    } catch (err) {
      console.error('Failed to save template:', err);
      setSaveStatus('unsaved');
      alert('Failed to save template. Please try again.');
    }
  }, [template, isNew, saveNewTemplate, updateTemplate, navigate]);

  // Update template helper (marks as having changes, but does NOT auto-save)
  const updateLocalTemplate = (updates: Partial<ChecklistTemplate>) => {
    if (!template) return;
    setTemplate({ ...template, ...updates, updatedAt: new Date() });
    setHasChanges(true);
    setSaveStatus('unsaved');
  };

  // Section operations
  const addSection = () => {
    if (!template) return;
    const newSection = createSection({ 
      name: `Section ${template.sections.length + 1}`,
      order: template.sections.length,
    });
    updateLocalTemplate({ sections: [...template.sections, newSection] });
    setExpandedSections(prev => new Set([...prev, newSection.id]));
  };

  const updateSection = (sectionId: string, updates: Partial<TemplateSection>) => {
    if (!template) return;
    updateLocalTemplate({
      sections: template.sections.map(s => 
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    });
  };

  const deleteSection = (sectionId: string) => {
    if (!template) return;
    updateLocalTemplate({
      sections: template.sections
        .filter(s => s.id !== sectionId)
        .map((s, i) => ({ ...s, order: i })),
    });
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    if (!template) return;
    const index = template.sections.findIndex(s => s.id === sectionId);
    if (index === -1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= template.sections.length) return;

    const newSections = [...template.sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    newSections.forEach((s, i) => s.order = i);
    
    updateLocalTemplate({ sections: newSections });
  };

  // Item operations
  const addItem = (sectionId: string) => {
    if (!template) return;
    const section = template.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const newItem = createItem({ 
      text: '',
      order: section.items.length,
    });
    
    updateSection(sectionId, { items: [...section.items, newItem] });
  };

  const updateItem = (sectionId: string, itemId: string, text: string) => {
    if (!template) return;
    updateLocalTemplate({
      sections: template.sections.map(s => 
        s.id === sectionId
          ? { ...s, items: s.items.map(i => i.id === itemId ? { ...i, text } : i) }
          : s
      ),
    });
  };

  const deleteItem = (sectionId: string, itemId: string) => {
    if (!template) return;
    updateLocalTemplate({
      sections: template.sections.map(s => 
        s.id === sectionId
          ? { ...s, items: s.items.filter(i => i.id !== itemId).map((i, idx) => ({ ...i, order: idx })) }
          : s
      ),
    });
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  if (!template) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-12 bg-slate-200 rounded" />
          <div className="h-12 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-slate-200 px-4 py-3 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/templates')}
              className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
              aria-label="Go back"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900 truncate">
              {isNew ? 'New Template' : 'Edit Template'}
            </h2>
          </div>
          
          {/* Save Status Indicator */}
          <div className="flex items-center gap-2 text-sm">
            {saveStatus === 'saved' && !isNew && (
              <span className="text-success-600 flex items-center gap-1">
                <CheckIcon className="w-4 h-4" />
                Saved
              </span>
            )}
            {(hasChanges || isNew) && saveStatus !== 'saved' && (
              <span className="text-warning-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-warning-500 rounded-full" />
                Unsaved
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Template Info */}
        <div className="card space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
              Template Name *
            </label>
            <input
              id="name"
              type="text"
              className="input"
              placeholder="e.g., Studio Apartment Inspection"
              value={template.name}
              onChange={(e) => updateLocalTemplate({ name: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="propertyType" className="block text-sm font-medium text-slate-700 mb-1">
              Property Type
            </label>
            <select
              id="propertyType"
              className="input"
              value={template.propertyType}
              onChange={(e) => updateLocalTemplate({ propertyType: e.target.value as PropertyType })}
            >
              {Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Sections ({template.sections.length})
            </h3>
          </div>

          {template.sections.length === 0 && (
            <div className="card text-center py-8 border-dashed">
              <p className="text-slate-500 mb-4">No sections yet. Add your first section.</p>
              <button onClick={addSection} className="btn-primary inline-flex">
                <PlusIcon className="w-5 h-5 mr-2" />
                Add Section
              </button>
            </div>
          )}

          {template.sections.map((section, sectionIndex) => (
            <div key={section.id} className="card p-0 overflow-hidden">
              {/* Section Header */}
              <div
                className="flex items-center gap-2 p-3 bg-slate-50 border-b border-slate-200 cursor-pointer"
                onClick={() => toggleSection(section.id)}
              >
                <Bars3Icon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  className="flex-1 bg-transparent font-medium text-slate-900 focus:outline-none"
                  placeholder="Section name"
                  value={section.name}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateSection(section.id, { name: e.target.value });
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="text-sm text-slate-500 flex-shrink-0">
                  {section.items.length} items
                </span>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'up'); }}
                    disabled={sectionIndex === 0}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  >
                    <ChevronUpIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'down'); }}
                    disabled={sectionIndex === template.sections.length - 1}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30"
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }}
                    className="p-1 text-slate-400 hover:text-danger-600"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Section Items */}
              {expandedSections.has(section.id) && (
                <div className="p-3 space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <span className="text-sm text-slate-400 w-6 text-right flex-shrink-0">
                        {itemIndex + 1}.
                      </span>
                      <input
                        type="text"
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 text-sm"
                        placeholder="Item description"
                        value={item.text}
                        onChange={(e) => updateItem(section.id, item.id, e.target.value)}
                      />
                      <button
                        onClick={() => deleteItem(section.id, item.id)}
                        className="p-2 text-slate-400 hover:text-danger-600 flex-shrink-0"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => addItem(section.id)}
                    className="w-full py-2 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg flex items-center justify-center gap-1"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Item
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Add Section Button */}
          {template.sections.length > 0 && (
            <button
              onClick={addSection}
              className="w-full card border-dashed py-4 text-slate-600 hover:text-primary-600 hover:border-primary-300 flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Add Section
            </button>
          )}
        </div>

        {/* Summary */}
        {template.sections.length > 0 && (
          <div className="card bg-slate-50">
            <div className="text-sm text-slate-600">
              <strong>Summary:</strong> {template.sections.length} sections, {' '}
              {template.sections.reduce((acc, s) => acc + s.items.length, 0)} total items
            </div>
          </div>
        )}
      </div>

      {/* Fixed Save Button at bottom */}
      <div className="fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-slate-200 z-30">
        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all ${
            saveStatus === 'saving'
              ? 'bg-slate-400 cursor-not-allowed'
              : saveStatus === 'saved' && !isNew
              ? 'bg-success-500'
              : 'bg-primary-600 hover:bg-primary-700 active:scale-98'
          }`}
        >
          {saveStatus === 'saving' ? (
            'Saving...'
          ) : saveStatus === 'saved' && !isNew ? (
            <span className="flex items-center justify-center gap-2">
              <CheckIcon className="w-5 h-5" />
              Saved
            </span>
          ) : (
            'Save Template'
          )}
        </button>
      </div>
    </div>
  );
}
