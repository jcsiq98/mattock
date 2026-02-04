# Property Inspection PWA - Architecture Overview

## Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (PWA)                         │
├─────────────────────────────────────────────────────────────┤
│  React 18 + TypeScript + Vite                               │
│  ├── React Router v6 (navigation)                           │
│  ├── Zustand (state management)                             │
│  ├── TailwindCSS (styling)                                  │
│  └── vite-plugin-pwa (service worker)                       │
├─────────────────────────────────────────────────────────────┤
│                    Local Storage                            │
│  ├── Dexie.js (IndexedDB wrapper)                          │
│  ├── Photos as base64/Blob                                  │
│  └── Sync queue for pending changes                         │
├─────────────────────────────────────────────────────────────┤
│                   Feature Modules                           │
│  ├── Fabric.js / Canvas API (annotations)                   │
│  ├── jsPDF (report generation)                              │
│  └── Web APIs (Camera, Geolocation)                         │
└─────────────────────────────────────────────────────────────┘
                            │
                   (Optional for Demo)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Optional)                       │
├─────────────────────────────────────────────────────────────┤
│  Express.js + SQLite                                        │
│  ├── REST API endpoints                                     │
│  ├── Demo authentication (JWT)                              │
│  └── Simple file-based storage                              │
└─────────────────────────────────────────────────────────────┘
```

## Recommended Folder Structure

```
mattock/
├── documentation/
│   ├── milestones.md          # Development roadmap
│   └── architecture-overview.md
│
├── frontend/                   # React PWA
│   ├── public/
│   │   ├── icons/             # PWA icons (various sizes)
│   │   └── manifest.json      # PWA manifest
│   │
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── common/        # Buttons, inputs, cards
│   │   │   ├── layout/        # Header, navigation, shell
│   │   │   ├── template/      # Template-specific components
│   │   │   ├── inspection/    # Inspection-specific components
│   │   │   └── photo/         # Photo capture & annotation
│   │   │
│   │   ├── pages/             # Route-level components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── templates/
│   │   │   │   ├── TemplateList.tsx
│   │   │   │   └── TemplateEditor.tsx
│   │   │   ├── inspections/
│   │   │   │   ├── InspectionList.tsx
│   │   │   │   ├── NewInspection.tsx
│   │   │   │   ├── InspectionChecklist.tsx
│   │   │   │   └── InspectionPDF.tsx
│   │   │   └── Settings.tsx
│   │   │
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useOnlineStatus.ts
│   │   │   ├── useGeolocation.ts
│   │   │   ├── useCamera.ts
│   │   │   └── useAutoSave.ts
│   │   │
│   │   ├── services/          # Business logic
│   │   │   ├── database.ts    # Dexie.js setup
│   │   │   ├── templateService.ts
│   │   │   ├── inspectionService.ts
│   │   │   ├── photoService.ts
│   │   │   ├── syncService.ts
│   │   │   └── pdfService.ts
│   │   │
│   │   ├── stores/            # Zustand stores
│   │   │   ├── useTemplateStore.ts
│   │   │   ├── useInspectionStore.ts
│   │   │   └── useAppStore.ts
│   │   │
│   │   ├── types/             # TypeScript definitions
│   │   │   ├── template.ts
│   │   │   ├── inspection.ts
│   │   │   ├── photo.ts
│   │   │   └── sync.ts
│   │   │
│   │   ├── utils/             # Utility functions
│   │   │   ├── imageUtils.ts
│   │   │   ├── dateUtils.ts
│   │   │   └── exportUtils.ts
│   │   │
│   │   ├── App.tsx            # Main app component
│   │   ├── main.tsx           # Entry point
│   │   └── index.css          # Global styles + Tailwind
│   │
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
│
├── backend/                    # Optional demo backend
│   ├── src/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── database/
│   │   └── index.ts
│   ├── data/                  # SQLite database file
│   └── package.json
│
├── README.md                   # Project documentation
└── package.json               # Workspace root (if using monorepo)
```

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         User Actions                             │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                      React Components                            │
│  (TemplateEditor, InspectionChecklist, PhotoCapture, etc.)      │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                       Zustand Stores                             │
│  (UI state, active inspection, sync status)                      │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Services Layer                            │
│  (templateService, inspectionService, photoService)              │
└──────────────────────────────────────────────────────────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              ▼                                   ▼
┌─────────────────────────┐         ┌─────────────────────────┐
│      IndexedDB          │         │      Sync Queue         │
│  (Dexie.js wrapper)     │         │  (pending operations)   │
│  - Templates            │         │                         │
│  - Inspections          │         │  When online:           │
│  - Photos               │         │  ───────────────►       │
│  - Settings             │         │  Sync to backend        │
└─────────────────────────┘         └─────────────────────────┘
```

## Offline-First Strategy

### Write Path (always local first)
1. User makes change (edit checklist item, add photo)
2. Change saved immediately to IndexedDB
3. UI updates optimistically
4. Change added to sync queue
5. If online, sync queue processes in background

### Read Path (always from local)
1. App loads data from IndexedDB
2. UI renders immediately
3. If online, background sync pulls latest from server
4. Conflicts resolved (last-write-wins for MVP)

### Sync Queue States
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   PENDING   │───▶│   SYNCING   │───▶│   SYNCED    │
└─────────────┘    └─────────────┘    └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   FAILED    │ (retry with backoff)
                   └─────────────┘
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Dexie.js over raw IndexedDB | Simpler API, Promise-based, better TypeScript support |
| Zustand over Redux | Lighter weight, simpler setup, sufficient for MVP |
| Fabric.js for annotations | Mature library, good touch support, object-based model |
| jsPDF over server-side PDF | Works offline, no backend dependency |
| Base64 photos in IndexedDB | Simpler than Blob references, works offline, acceptable for MVP |
| Vite over CRA | Faster builds, better PWA plugin ecosystem |

## Performance Considerations

1. **Photo Compression**: Resize to max 1920px, JPEG quality 0.8
2. **Lazy Loading**: Code-split annotation editor (large Fabric.js bundle)
3. **Virtual Scrolling**: For inspection lists with many items
4. **Service Worker**: Cache app shell, lazy-cache photos
5. **Debounced Saves**: Auto-save with 500ms debounce to reduce writes

## Security Notes (MVP Scope)

- Demo auth only (name + optional PIN)
- No sensitive data encryption at rest (acceptable for MVP)
- HTTPS required for camera/geolocation APIs
- Photos stored locally, not transmitted without user action

---

*This document complements milestones.md with technical architecture details.*

