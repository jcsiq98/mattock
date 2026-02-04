import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  ClipboardDocumentListIcon,
  DocumentMagnifyingGlassIcon,
  ArrowRightIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { inspectionService } from '../services/inspectionService';
import { templateService } from '../services/templateService';
import { useAppStore } from '../stores/useAppStore';
import type { Inspection } from '../types/inspection';
import { calculateInspectionSummary } from '../types/inspection';

interface Stats {
  totalInspections: number;
  completedInspections: number;
  inProgressInspections: number;
  totalTemplates: number;
  attentionItems: number;
}

export function Dashboard() {
  const { isOnline } = useAppStore();
  const [stats, setStats] = useState<Stats>({
    totalInspections: 0,
    completedInspections: 0,
    inProgressInspections: 0,
    totalTemplates: 0,
    attentionItems: 0,
  });
  const [recentInspections, setRecentInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [inspections, templates] = await Promise.all([
        inspectionService.getAll(),
        templateService.countActive(),
      ]);
      
      // Calculate stats
      const completedInspections = inspections.filter(i => i.status === 'completed').length;
      const inProgressInspections = inspections.filter(i => i.status === 'draft' || i.status === 'in_progress').length;
      
      // Count attention items across all inspections
      let attentionItems = 0;
      for (const inspection of inspections) {
        const summary = calculateInspectionSummary(inspection);
        attentionItems += summary.attentionCount;
      }
      
      setStats({
        totalInspections: inspections.length,
        completedInspections,
        inProgressInspections,
        totalTemplates: templates,
        attentionItems,
      });
      
      // Get recent inspections (last 3)
      setRecentInspections(inspections.slice(0, 3));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  function getStatusBadge(status: Inspection['status']) {
    switch (status) {
      case 'draft':
        return <span className="badge-pending text-xs">Draft</span>;
      case 'in_progress':
        return <span className="badge bg-primary-50 text-primary-600 text-xs">In Progress</span>;
      case 'completed':
        return <span className="badge-ok text-xs">Completed</span>;
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Welcome Section */}
      <section className="card bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0">
        <h2 className="text-xl font-bold mb-2">
          Welcome to Property Inspector
        </h2>
        <p className="text-primary-100 text-sm">
          Create detailed property inspections with photos, annotations, and
          professional PDF reports.
        </p>
        <Link
          to="/inspections/new"
          className="inline-flex items-center gap-2 mt-4 bg-white text-primary-600 font-semibold px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Start New Inspection
        </Link>
      </section>

      {/* Stats Grid */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">
          Overview
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/inspections" className="card text-center hover:border-primary-300 transition-colors">
            <div className="text-3xl font-bold text-primary-600">
              {loading ? '—' : stats.totalInspections}
            </div>
            <div className="text-sm text-slate-500">Total Inspections</div>
          </Link>
          <Link to="/inspections" className="card text-center hover:border-success-300 transition-colors">
            <div className="text-3xl font-bold text-success-600">
              {loading ? '—' : stats.completedInspections}
            </div>
            <div className="text-sm text-slate-500">Completed</div>
          </Link>
          <Link to="/inspections" className="card text-center hover:border-primary-300 transition-colors">
            <div className="text-3xl font-bold text-primary-600">
              {loading ? '—' : stats.inProgressInspections}
            </div>
            <div className="text-sm text-slate-500">In Progress</div>
          </Link>
          <Link to="/templates" className="card text-center hover:border-warning-300 transition-colors">
            <div className="text-3xl font-bold text-warning-600">
              {loading ? '—' : stats.totalTemplates}
            </div>
            <div className="text-sm text-slate-500">Templates</div>
          </Link>
        </div>
        
        {/* Attention Items Alert */}
        {stats.attentionItems > 0 && (
          <div className="card bg-warning-50 border-warning-200 flex items-center gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-warning-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-warning-800">
                {stats.attentionItems} item{stats.attentionItems !== 1 ? 's' : ''} need attention
              </p>
              <p className="text-sm text-warning-600">Across all inspections</p>
            </div>
          </div>
        )}
      </section>

      {/* Recent Inspections */}
      {recentInspections.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              Recent Inspections
            </h3>
            <Link to="/inspections" className="text-sm text-primary-600 font-medium">
              View All
            </Link>
          </div>
          
          <div className="space-y-2">
            {recentInspections.map((inspection) => {
              const summary = calculateInspectionSummary(inspection);
              return (
                <Link
                  key={inspection.id}
                  to={`/inspections/${inspection.id}`}
                  className="card flex items-center gap-3 hover:border-primary-300 transition-colors"
                >
                  {/* Progress indicator */}
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <svg className="w-10 h-10 transform -rotate-90">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        className="text-slate-100"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={`${(summary.completionPercentage / 100) * 100.5} 100.5`}
                        className={inspection.status === 'completed' ? 'text-success-500' : 'text-primary-500'}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-slate-600">
                        {summary.completionPercentage}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {inspection.address}
                      {inspection.unit && <span className="text-slate-500"> #{inspection.unit}</span>}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{formatDate(inspection.startedAt)}</span>
                      {getStatusBadge(inspection.status)}
                    </div>
                  </div>
                  
                  <ArrowRightIcon className="w-5 h-5 text-slate-400" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider px-1">
          Quick Actions
        </h3>
        
        <Link
          to="/inspections/new"
          className="card flex items-center gap-4 hover:border-primary-300 transition-colors"
        >
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <PlusIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900">New Inspection</h4>
            <p className="text-sm text-slate-500">Start a property inspection</p>
          </div>
          <ArrowRightIcon className="w-5 h-5 text-slate-400" />
        </Link>

        <Link
          to="/inspections"
          className="card flex items-center gap-4 hover:border-primary-300 transition-colors"
        >
          <div className="w-12 h-12 bg-success-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <DocumentMagnifyingGlassIcon className="w-6 h-6 text-success-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900">My Inspections</h4>
            <p className="text-sm text-slate-500">View and manage inspections</p>
          </div>
          <ArrowRightIcon className="w-5 h-5 text-slate-400" />
        </Link>

        <Link
          to="/templates"
          className="card flex items-center gap-4 hover:border-primary-300 transition-colors"
        >
          <div className="w-12 h-12 bg-warning-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <ClipboardDocumentListIcon className="w-6 h-6 text-warning-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-900">Templates</h4>
            <p className="text-sm text-slate-500">Manage checklist templates</p>
          </div>
          <ArrowRightIcon className="w-5 h-5 text-slate-400" />
        </Link>
      </section>

      {/* Offline indicator */}
      <section className="card bg-slate-100 border-dashed">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success-500' : 'bg-warning-500'}`} />
          <span>
            {isOnline ? 'Online' : 'Offline'} • All data saved locally
          </span>
        </div>
      </section>
    </div>
  );
}
