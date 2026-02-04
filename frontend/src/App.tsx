import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Dashboard } from './pages/Dashboard';
import { TemplateList } from './pages/templates/TemplateList';
import { TemplateEditor } from './pages/templates/TemplateEditor';
import { InspectionList } from './pages/inspections/InspectionList';
import { NewInspection } from './pages/inspections/NewInspection';
import { InspectionDetail } from './pages/inspections/InspectionDetail';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
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

          {/* Settings */}
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
