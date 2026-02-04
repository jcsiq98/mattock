import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  DocumentMagnifyingGlassIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  ClipboardDocumentListIcon as ClipboardDocumentListIconSolid,
  DocumentMagnifyingGlassIcon as DocumentMagnifyingGlassIconSolid,
  Cog6ToothIcon as Cog6ToothIconSolid,
} from '@heroicons/react/24/solid';
import { useAppStore } from '../../stores/useAppStore';

const navItems = [
  {
    to: '/',
    label: 'Home',
    icon: HomeIcon,
    iconActive: HomeIconSolid,
  },
  {
    to: '/templates',
    label: 'Templates',
    icon: ClipboardDocumentListIcon,
    iconActive: ClipboardDocumentListIconSolid,
  },
  {
    to: '/inspections',
    label: 'Inspections',
    icon: DocumentMagnifyingGlassIcon,
    iconActive: DocumentMagnifyingGlassIconSolid,
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: Cog6ToothIcon,
    iconActive: Cog6ToothIconSolid,
  },
];

export function AppShell() {
  const location = useLocation();
  const { isOnline, pendingSyncCount } = useAppStore();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 pt-safe sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 100 100" fill="none">
                <path
                  d="M25 70V35l25-15 25 15v35l-25 15-25-15z"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinejoin="round"
                />
                <circle cx="50" cy="50" r="8" fill="currentColor" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-slate-900">Property Inspector</h1>
          </div>

          {/* Online/Offline Status */}
          <div className="flex items-center gap-2">
            {pendingSyncCount > 0 && (
              <span className="bg-warning-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                {pendingSyncCount} pending
              </span>
            )}
            <div
              className={`w-3 h-3 rounded-full ${
                isOnline ? 'bg-success-500' : 'bg-warning-500'
              }`}
              title={isOnline ? 'Online' : 'Offline'}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-40">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const isActive =
              item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);
            const Icon = isActive ? item.iconActive : item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center justify-center min-w-[64px] py-1 px-3 rounded-xl transition-colors ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-xs mt-1 font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

