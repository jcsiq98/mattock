import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { TemplateList } from './pages/templates/TemplateList';
import { TemplateEditor } from './pages/templates/TemplateEditor';
import { InspectionList } from './pages/inspections/InspectionList';
import { NewInspection } from './pages/inspections/NewInspection';
import { InspectionDetail } from './pages/inspections/InspectionDetail';
import { InspectionPDF } from './pages/inspections/InspectionPDF';
import { Settings } from './pages/Settings';
import { useDatabase } from './hooks/useDatabase';

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        {/* Dashboard */}
        <Route index element={<Dashboard />} />

        {/* Templates */}
        <Route path="templates" element={<TemplateList />} />
        <Route path="templates/new" element={<TemplateEditor />} />
        <Route path="templates/:id" element={<TemplateEditor />} />

        {/* Inspections */}
        <Route path="inspections" element={<InspectionList />} />
        <Route path="inspections/new" element={<NewInspection />} />
        <Route path="inspections/:id" element={<InspectionDetail />} />
        <Route path="inspections/:id/pdf" element={<InspectionPDF />} />

        {/* Settings */}
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <svg className="w-10 h-10 text-white" viewBox="0 0 100 100" fill="none">
            <path
              d="M25 70V35l25-15 25 15v35l-25 15-25-15z"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinejoin="round"
            />
            <circle cx="50" cy="50" r="8" fill="currentColor" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Property Inspector</h1>
        <p className="text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-danger-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-slate-900 mb-2">Oops!</h1>
        <p className="text-slate-500 mb-4">{message}</p>
        <button 
          onClick={() => window.location.reload()}
          className="btn-primary"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function App() {
  const { isReady, error } = useDatabase();

  if (error) {
    return <ErrorScreen message={error} />;
  }

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
