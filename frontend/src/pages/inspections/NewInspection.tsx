import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ClipboardDocumentListIcon,
  MapPinIcon,
  HomeIcon,
  UserIcon,
  IdentificationIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { templateService } from '../../services/templateService';
import { inspectionService } from '../../services/inspectionService';
import { useAppStore } from '../../stores/useAppStore';
import type { ChecklistTemplate } from '../../types/template';
import { PROPERTY_TYPE_LABELS } from '../../types/template';
import { createInspectionFromTemplate } from '../../types/inspection';

interface FormData {
  templateId: string;
  address: string;
  unit: string;
  tenantName: string;
  inspectorName: string;
}

interface FormErrors {
  templateId?: string;
  address?: string;
  inspectorName?: string;
}

export function NewInspection() {
  const navigate = useNavigate();
  const { inspectorName: savedInspectorName, setInspectorName: saveInspectorName } = useAppStore();
  
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    templateId: '',
    address: '',
    unit: '',
    tenantName: '',
    inspectorName: savedInspectorName,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    try {
      const active = await templateService.getActive();
      setTemplates(active);
      
      // Auto-select if only one template
      if (active.length === 1) {
        setFormData(prev => ({ ...prev, templateId: active[0].id }));
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field: keyof FormData, value: string) {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user types
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }

  function handleBlur(field: string) {
    setTouched(prev => new Set(prev).add(field));
    validateField(field as keyof FormData);
  }

  function validateField(field: keyof FormData): boolean {
    let error: string | undefined;
    
    switch (field) {
      case 'templateId':
        if (!formData.templateId) {
          error = 'Please select a template';
        }
        break;
      case 'address':
        if (!formData.address.trim()) {
          error = 'Address is required';
        }
        break;
      case 'inspectorName':
        if (!formData.inspectorName.trim()) {
          error = 'Inspector name is required';
        }
        break;
    }
    
    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  }

  function validateForm(): boolean {
    const templateValid = validateField('templateId');
    const addressValid = validateField('address');
    const inspectorValid = validateField('inspectorName');
    
    setTouched(new Set(['templateId', 'address', 'inspectorName']));
    
    return templateValid && addressValid && inspectorValid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      const template = templates.find(t => t.id === formData.templateId);
      if (!template) {
        setErrors({ templateId: 'Selected template not found' });
        return;
      }
      
      // Save inspector name for future inspections
      if (formData.inspectorName !== savedInspectorName) {
        saveInspectorName(formData.inspectorName);
      }
      
      // Create inspection from template
      const inspection = createInspectionFromTemplate(
        template,
        formData.inspectorName.trim(),
        formData.address.trim(),
        formData.unit.trim() || undefined,
        formData.tenantName.trim() || undefined
      );
      
      await inspectionService.create(inspection);
      
      // Navigate to the new inspection
      navigate(`/inspections/${inspection.id}`);
    } catch (error) {
      console.error('Failed to create inspection:', error);
    } finally {
      setSubmitting(false);
    }
  }

  const selectedTemplate = templates.find(t => t.id === formData.templateId);
  const templateItemCount = selectedTemplate?.sections.reduce(
    (acc, section) => acc + section.items.length,
    0
  ) ?? 0;

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded animate-pulse" />
          <div className="h-7 w-40 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="card space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

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
        <h2 className="text-xl font-bold text-slate-900">New Inspection</h2>
      </div>

      {/* No Templates Warning */}
      {templates.length === 0 && (
        <div className="card bg-warning-50 border-warning-200">
          <div className="flex items-start gap-3">
            <ExclamationCircleIcon className="w-6 h-6 text-warning-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-warning-800">No Templates Available</h3>
              <p className="text-sm text-warning-700 mt-1">
                You need to create a checklist template before starting an inspection.
              </p>
              <button
                onClick={() => navigate('/templates/new')}
                className="btn-warning mt-3 text-sm"
              >
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {templates.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Selector */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <ClipboardDocumentListIcon className="w-5 h-5 text-primary-600" />
              Select Template
            </h3>
            
            <div className="relative">
              <select
                id="template"
                className={`input appearance-none pr-10 ${
                  errors.templateId && touched.has('templateId')
                    ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
                    : ''
                }`}
                value={formData.templateId}
                onChange={(e) => handleChange('templateId', e.target.value)}
                onBlur={() => handleBlur('templateId')}
              >
                <option value="">Choose a template...</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({PROPERTY_TYPE_LABELS[template.propertyType]})
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="w-5 h-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            
            {errors.templateId && touched.has('templateId') && (
              <p className="text-sm text-danger-500 flex items-center gap-1">
                <ExclamationCircleIcon className="w-4 h-4" />
                {errors.templateId}
              </p>
            )}

            {/* Template Preview */}
            {selectedTemplate && (
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>{selectedTemplate.sections.length} sections</span>
                  <span>{templateItemCount} items</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedTemplate.sections.slice(0, 4).map((section) => (
                    <span
                      key={section.id}
                      className="bg-white px-2 py-0.5 rounded text-xs text-slate-600 border"
                    >
                      {section.name}
                    </span>
                  ))}
                  {selectedTemplate.sections.length > 4 && (
                    <span className="px-2 py-0.5 text-xs text-slate-400">
                      +{selectedTemplate.sections.length - 4} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Property Details */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <HomeIcon className="w-5 h-5 text-primary-600" />
              Property Details
            </h3>
            
            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1">
                Address <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <MapPinIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="address"
                  type="text"
                  className={`input pl-10 ${
                    errors.address && touched.has('address')
                      ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
                      : ''
                  }`}
                  placeholder="123 Main Street"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  onBlur={() => handleBlur('address')}
                  autoComplete="street-address"
                />
              </div>
              {errors.address && touched.has('address') && (
                <p className="text-sm text-danger-500 mt-1 flex items-center gap-1">
                  <ExclamationCircleIcon className="w-4 h-4" />
                  {errors.address}
                </p>
              )}
            </div>

            {/* Unit Number */}
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-slate-700 mb-1">
                Unit/Apt Number <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="unit"
                type="text"
                className="input"
                placeholder="e.g., 4B, Suite 201"
                value={formData.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
              />
            </div>

            {/* Tenant Name */}
            <div>
              <label htmlFor="tenant" className="block text-sm font-medium text-slate-700 mb-1">
                Tenant Name <span className="text-slate-400">(optional)</span>
              </label>
              <div className="relative">
                <UserIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="tenant"
                  type="text"
                  className="input pl-10"
                  placeholder="John Doe"
                  value={formData.tenantName}
                  onChange={(e) => handleChange('tenantName', e.target.value)}
                  autoComplete="name"
                />
              </div>
            </div>
          </div>

          {/* Inspector Details */}
          <div className="card space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <IdentificationIcon className="w-5 h-5 text-primary-600" />
              Inspector Details
            </h3>
            
            <div>
              <label htmlFor="inspector" className="block text-sm font-medium text-slate-700 mb-1">
                Your Name <span className="text-danger-500">*</span>
              </label>
              <input
                id="inspector"
                type="text"
                className={`input ${
                  errors.inspectorName && touched.has('inspectorName')
                    ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
                    : ''
                }`}
                placeholder="Inspector name"
                value={formData.inspectorName}
                onChange={(e) => handleChange('inspectorName', e.target.value)}
                onBlur={() => handleBlur('inspectorName')}
                autoComplete="name"
              />
              {errors.inspectorName && touched.has('inspectorName') && (
                <p className="text-sm text-danger-500 mt-1 flex items-center gap-1">
                  <ExclamationCircleIcon className="w-4 h-4" />
                  {errors.inspectorName}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-1">
                This will be saved for future inspections
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full text-lg py-4"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating...
              </span>
            ) : (
              'Start Inspection'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
