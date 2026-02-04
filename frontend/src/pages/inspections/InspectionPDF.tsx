import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  DocumentIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { inspectionService } from '../../services/inspectionService';
import {
  generateInspectionPDF,
  downloadPDF,
  sharePDF,
  type PDFGeneratorResult,
} from '../../services/pdfGenerator';
import type { Inspection } from '../../types/inspection';
import { calculateInspectionSummary } from '../../types/inspection';

export function InspectionPDF() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [pdfResult, setPdfResult] = useState<PDFGeneratorResult | null>(null);
  const [canShare, setCanShare] = useState(false);

  // Check if sharing is supported
  useEffect(() => {
    setCanShare(!!navigator.share && !!navigator.canShare);
  }, []);

  // Load inspection
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
      }
    } catch (error) {
      console.error('Failed to load inspection:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleProgress = useCallback((progressValue: number, message: string) => {
    setProgress(progressValue);
    setProgressMessage(message);
  }, []);

  async function handleGenerate() {
    if (!inspection) return;

    setGenerating(true);
    setProgress(0);
    setProgressMessage('Starting...');
    setPdfResult(null);

    try {
      const result = await generateInspectionPDF(inspection, {
        includePhotos: true,
        compressPhotos: true,
        onProgress: handleProgress,
      });

      setPdfResult(result);
    } catch (error) {
      console.error('PDF generation failed:', error);
      setPdfResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload() {
    if (pdfResult?.blob && pdfResult?.filename) {
      downloadPDF(pdfResult.blob, pdfResult.filename);
    }
  }

  async function handleShare() {
    if (pdfResult?.blob && pdfResult?.filename) {
      const shared = await sharePDF(pdfResult.blob, pdfResult.filename);
      if (!shared) {
        // Fallback to download
        handleDownload();
      }
    }
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-200 rounded animate-pulse" />
          <div className="h-7 w-40 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="card h-64 animate-pulse bg-slate-100" />
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

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="flex items-center gap-3 p-4">
          <button
            onClick={() => navigate(`/inspections/${inspection.id}`)}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900">Generate PDF</h2>
            <p className="text-sm text-slate-500 truncate">{inspection.address}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Inspection Summary Card */}
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-3">Report Preview</h3>
          
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Property</span>
              <span className="font-medium text-slate-900">
                {inspection.address}
                {inspection.unit && ` #${inspection.unit}`}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Inspector</span>
              <span className="font-medium text-slate-900">{inspection.inspectorName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Date</span>
              <span className="font-medium text-slate-900">
                {new Date(inspection.startedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Template</span>
              <span className="font-medium text-slate-900">{inspection.templateName}</span>
            </div>
            
            <hr className="border-slate-200" />
            
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-success-600">{summary.okCount}</div>
                <div className="text-xs text-slate-500">OK</div>
              </div>
              <div>
                <div className="text-lg font-bold text-warning-600">{summary.attentionCount}</div>
                <div className="text-xs text-slate-500">Attention</div>
              </div>
              <div>
                <div className="text-lg font-bold text-slate-500">{summary.naCount}</div>
                <div className="text-xs text-slate-500">N/A</div>
              </div>
              <div>
                <div className="text-lg font-bold text-primary-600">{summary.photoCount}</div>
                <div className="text-xs text-slate-500">Photos</div>
              </div>
            </div>
          </div>
        </div>

        {/* Generation Progress */}
        {generating && (
          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <DocumentIcon className="w-5 h-5 text-primary-600 animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Generating PDF...</p>
                <p className="text-sm text-slate-500">{progressMessage}</p>
              </div>
            </div>
            
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1 text-right">{Math.round(progress)}%</p>
          </div>
        )}

        {/* Result - Success */}
        {pdfResult?.success && (
          <div className="card border-success-200 bg-success-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
                <CheckCircleIcon className="w-7 h-7 text-success-600" />
              </div>
              <div>
                <p className="font-semibold text-success-900">PDF Ready!</p>
                <p className="text-sm text-success-700">{pdfResult.filename}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Download
              </button>
              
              {canShare && (
                <button
                  onClick={handleShare}
                  className="flex-1 btn-secondary flex items-center justify-center gap-2"
                >
                  <ShareIcon className="w-5 h-5" />
                  Share
                </button>
              )}
            </div>
          </div>
        )}

        {/* Result - Error */}
        {pdfResult && !pdfResult.success && (
          <div className="card border-danger-200 bg-danger-50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-danger-100 flex items-center justify-center">
                <ExclamationTriangleIcon className="w-7 h-7 text-danger-600" />
              </div>
              <div>
                <p className="font-semibold text-danger-900">Generation Failed</p>
                <p className="text-sm text-danger-700">{pdfResult.error}</p>
              </div>
            </div>
            
            <button
              onClick={handleGenerate}
              className="btn-danger w-full mt-4"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Generate Button */}
        {!generating && !pdfResult?.success && (
          <button
            onClick={handleGenerate}
            className="w-full py-4 rounded-xl font-semibold text-lg bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <DocumentIcon className="w-6 h-6" />
            Generate PDF Report
          </button>
        )}

        {/* Regenerate button if already generated */}
        {pdfResult?.success && (
          <button
            onClick={handleGenerate}
            className="w-full btn-secondary"
          >
            Regenerate PDF
          </button>
        )}

        {/* Info */}
        <div className="text-center text-sm text-slate-500">
          <p>The PDF will include all inspection details,</p>
          <p>photos, and annotations.</p>
        </div>
      </div>
    </div>
  );
}

