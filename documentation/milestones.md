# Property Inspection PWA - MVP Milestones

## Overview
Progressive development roadmap for a mobile-first, offline-first Property Inspection PWA with checklist templates, photo annotations, and PDF report generation.

**Estimated Total Time**: 8-12 development days (solo developer)

---

## Milestone 0: Project Foundation & Tooling Setup
**Duration**: 0.5 days

### Objectives
- Initialize React + TypeScript project with Vite
- Configure PWA capabilities (vite-plugin-pwa)
- Set up project structure and development environment
- Establish code quality tooling

### Tasks
- [ ] Create React + TypeScript project with Vite
- [ ] Install and configure PWA plugin with basic manifest
- [ ] Set up folder structure:
  ```
  src/
  ├── components/     # Reusable UI components
  ├── pages/          # Route-level components
  ├── hooks/          # Custom React hooks
  ├── services/       # Business logic & data services
  ├── stores/         # State management
  ├── types/          # TypeScript interfaces
  ├── utils/          # Utility functions
  └── assets/         # Static assets
  ```
- [ ] Configure ESLint + Prettier
- [ ] Add TailwindCSS for rapid mobile-first styling
- [ ] Create basic App shell with mobile viewport meta tags

### Testing Checklist
- [ ] `npm run dev` starts development server
- [ ] App renders "Hello World" on mobile viewport
- [ ] PWA manifest is accessible at `/manifest.json`
- [ ] No TypeScript or lint errors

### Deliverables
- Running React + TypeScript + Vite project
- PWA manifest configured
- Mobile-responsive viewport

---

## Milestone 1: Core Data Types & IndexedDB Storage Layer
**Duration**: 1 day

### Objectives
- Define TypeScript interfaces for all domain entities
- Implement IndexedDB abstraction layer using Dexie.js
- Create storage service with CRUD operations

### Tasks
- [ ] Define TypeScript interfaces:
  ```typescript
  // Template types
  interface ChecklistTemplate { id, name, propertyType, sections[], createdAt, updatedAt }
  interface TemplateSection { id, name, items[] }
  interface TemplateItem { id, text, defaultNotes? }
  
  // Inspection types
  interface Inspection { id, templateId, address, unit?, tenantName?, inspectorName, startedAt, completedAt?, status, sections[] }
  interface InspectionSection { sectionId, name, items[], photos[] }
  interface InspectionItem { itemId, text, status: 'ok'|'attention'|'na'|'pending', notes?, photos[] }
  
  // Photo types
  interface Photo { id, inspectionId, sectionId?, itemId?, imageData, annotatedImageData?, timestamp, geolocation?, caption? }
  
  // Sync types
  interface SyncQueueItem { id, action, entityType, entityId, data, createdAt, status }
  ```
- [ ] Install and configure Dexie.js
- [ ] Create database schema with proper indexes
- [ ] Implement generic CRUD service
- [ ] Add migration support for schema updates

### Testing Checklist
- [ ] Can create, read, update, delete templates in IndexedDB
- [ ] Can create, read, update, delete inspections in IndexedDB
- [ ] Data persists after page refresh
- [ ] Browser DevTools → Application → IndexedDB shows correct structure
- [ ] TypeScript types are enforced (no `any` leaks)

### Deliverables
- Complete TypeScript type definitions
- Working IndexedDB storage layer
- Unit tests for storage operations (optional but recommended)

---

## Milestone 2: State Management & Basic Navigation
**Duration**: 0.5 days

### Objectives
- Set up React Router for navigation
- Implement global state management (Zustand recommended)
- Create app shell with bottom navigation

### Tasks
- [ ] Install React Router v6
- [ ] Configure routes:
  - `/` - Dashboard/Home
  - `/templates` - Template list
  - `/templates/new` - Create template
  - `/templates/:id` - Edit template
  - `/inspections` - Inspection list
  - `/inspections/new` - Start inspection
  - `/inspections/:id` - Active inspection
  - `/inspections/:id/pdf` - PDF preview/download
- [ ] Install Zustand for state management
- [ ] Create stores:
  - `useTemplateStore` - Template CRUD state
  - `useInspectionStore` - Inspection CRUD state
  - `useAppStore` - UI state (online status, sync queue count)
- [ ] Build mobile bottom navigation component
- [ ] Add page transition animations (subtle)

### Testing Checklist
- [ ] Navigation between all routes works
- [ ] Back button behavior is correct
- [ ] Bottom nav highlights active route
- [ ] State persists during navigation
- [ ] Deep linking works (direct URL access)

### Deliverables
- Working navigation system
- State management infrastructure
- Mobile-friendly app shell

---

## Milestone 3: Checklist Template Management (Admin)
**Duration**: 1.5 days

### Objectives
- Build template creation/editing UI
- Implement section and item management
- Create template list view with search

### Tasks
- [ ] Create `TemplateListPage` component:
  - List all templates with property type badges
  - Search/filter functionality
  - "New Template" FAB button
  - Swipe-to-delete or long-press menu
- [ ] Create `TemplateEditorPage` component:
  - Template name and property type inputs
  - Drag-and-drop section reordering
  - Add/edit/delete sections
  - Within each section: add/edit/delete items
  - Default notes input for items
  - Auto-save indicator
- [ ] Implement real-time auto-save to IndexedDB
- [ ] Add template duplication feature
- [ ] Pre-seed with sample templates (Studio, 1-Bedroom, 2-Bedroom)

### Testing Checklist
- [ ] Can create new template with sections and items
- [ ] Can edit existing template
- [ ] Can reorder sections via drag-and-drop
- [ ] Can delete template (with confirmation)
- [ ] Changes auto-save (verify in IndexedDB)
- [ ] Pre-seeded templates appear on first launch
- [ ] UI works well on 375px wide viewport (iPhone SE)

### Deliverables
- Complete template CRUD functionality
- Mobile-optimized template editor
- Sample templates for demo

---

## Milestone 4: Inspection Creation & Checklist Flow
**Duration**: 1.5 days

### Objectives
- Build inspection creation workflow
- Implement checklist completion UI optimized for mobile
- Add inspection list with status indicators

### Tasks
- [ ] Create `InspectionListPage`:
  - Show all inspections grouped by status (In Progress, Completed)
  - Display address, date, completion percentage
  - Quick actions: continue, view PDF, delete
- [ ] Create `NewInspectionPage`:
  - Template selector dropdown
  - Property address input (with autocomplete placeholder)
  - Unit number (optional)
  - Tenant name (optional)
  - Inspector name (pre-filled from last inspection)
  - Start inspection button
- [ ] Create `InspectionPage` (main checklist view):
  - Section tabs or accordion navigation
  - Item cards with large tap targets for status selection
  - Status buttons: ✓ OK | ⚠ Attention | — N/A
  - Notes expansion (tap to add note)
  - Photo attachment button per item
  - Progress indicator (items completed / total)
- [ ] Implement auto-save on every change
- [ ] Add "Complete Inspection" action with validation

### Testing Checklist
- [ ] Can create inspection from any template
- [ ] Checklist items match template
- [ ] Can mark items as OK/Attention/N/A
- [ ] Can add notes to items
- [ ] Progress percentage updates correctly
- [ ] Auto-save works (close and reopen browser)
- [ ] One-handed operation is comfortable
- [ ] Can complete and lock inspection

### Deliverables
- Full inspection creation and completion flow
- Mobile-optimized checklist UI
- Persistent inspection state

---

## Milestone 5: Photo Capture with Timestamp & Geolocation
**Duration**: 1 day

### Objectives
- Implement camera capture and file upload
- Capture and display timestamp/geolocation metadata
- Store photos in IndexedDB with proper compression

### Tasks
- [ ] Create `PhotoCapture` component:
  - Use `<input type="file" accept="image/*" capture="environment">`
  - Fallback to file picker on desktop
  - Show camera preview where supported (optional)
- [ ] Implement photo processing:
  - Resize large images (max 1920px) for storage efficiency
  - Convert to JPEG with quality setting
  - Extract EXIF timestamp if available
  - Capture current timestamp as fallback
- [ ] Implement geolocation capture:
  - Request permission on first photo
  - Capture coordinates if permission granted
  - Handle denied/unavailable gracefully (show "Location unavailable")
  - Cache permission state
- [ ] Create `PhotoGallery` component:
  - Thumbnail grid for item/section photos
  - Tap to view full-size
  - Show timestamp and location badge
  - Delete option
- [ ] Store photos as base64 or Blob in IndexedDB
- [ ] Link photos to inspection items or sections

### Testing Checklist
- [ ] Can capture photo from camera on mobile
- [ ] Can upload photo from gallery
- [ ] Timestamp is captured and displayed
- [ ] Geolocation works when permission granted
- [ ] Geolocation denial is handled gracefully
- [ ] Photos persist after refresh
- [ ] Can delete photos
- [ ] Large photos are compressed appropriately

### Deliverables
- Working photo capture with metadata
- Photo storage in IndexedDB
- Photo gallery component

---

## Milestone 6: Photo Annotation Tools
**Duration**: 2 days

### Objectives
- Build canvas-based annotation editor
- Implement arrow, circle, freehand pen tools
- Support undo and save annotated image

### Tasks
- [ ] Create `AnnotationEditor` component using HTML5 Canvas or Fabric.js:
  - Display photo as background
  - Touch-optimized canvas interactions
  - Pinch-to-zoom support
- [ ] Implement annotation tools:
  - **Arrow tool**: drag to create directional arrow
  - **Circle tool**: drag to create circle/ellipse
  - **Freehand pen**: draw with touch/mouse
  - **Color picker**: red, yellow, blue, black (limited for MVP)
  - **Stroke width**: thin, medium, thick
- [ ] Implement editing features:
  - Undo last action (keep history stack)
  - Clear all annotations
  - Cancel (return without saving)
- [ ] Implement save workflow:
  - Render annotations onto image
  - Store both original and annotated versions
  - Return to checklist view
- [ ] Optimize for touch:
  - Large tool buttons
  - Palm rejection (optional)
  - Smooth drawing performance

### Testing Checklist
- [ ] Arrow tool creates arrows correctly
- [ ] Circle tool creates circles correctly
- [ ] Freehand drawing is smooth (60fps target)
- [ ] Undo removes last annotation
- [ ] Color and stroke width changes work
- [ ] Annotated image saves correctly
- [ ] Original image is preserved
- [ ] Works on touch devices
- [ ] Works with mouse on desktop

### Deliverables
- Full annotation editor with MVP tool set
- Touch-optimized drawing experience
- Save annotated images to IndexedDB

---

## Milestone 7: Offline-First Architecture & Sync Queue
**Duration**: 1 day

### Objectives
- Implement service worker for full offline support
- Create sync queue for pending changes
- Add online/offline status indicator

### Tasks
- [ ] Configure Workbox via vite-plugin-pwa:
  - Pre-cache app shell and static assets
  - Runtime caching for dynamic data
  - Offline fallback page
- [ ] Implement online/offline detection:
  - Use `navigator.onLine` and `online`/`offline` events
  - Create `useOnlineStatus` hook
  - Add visual indicator in header (green dot online, yellow offline)
- [ ] Build sync queue system:
  - Queue all mutations when offline
  - Store queue in IndexedDB
  - Display "X changes pending sync" badge
  - Process queue when online (FIFO)
- [ ] Implement export/import for MVP:
  - "Export Data" button → downloads JSON file
  - "Import Data" button → uploads JSON file
  - Include all templates, inspections, photos
- [ ] Add "last synced" timestamp display
- [ ] Handle sync conflicts (last-write-wins for MVP)

### Testing Checklist
- [ ] App loads when offline (airplane mode test)
- [ ] Can create templates offline
- [ ] Can create and complete inspections offline
- [ ] Can capture and annotate photos offline
- [ ] Offline indicator appears when disconnected
- [ ] Sync queue count is accurate
- [ ] Export creates valid JSON with all data
- [ ] Import restores all data correctly
- [ ] App is installable as PWA

### Deliverables
- Full offline functionality
- Working sync queue
- Export/import feature
- PWA installability

---

## Milestone 8: PDF Report Generation
**Duration**: 1.5 days

### Objectives
- Generate professional PDF inspection reports client-side
- Include all inspection data, photos, and annotations
- Optimize for print

### Tasks
- [ ] Choose PDF library (jsPDF + jspdf-autotable recommended)
- [ ] Design PDF layout:
  - **Cover page**: Property address, unit, inspector name, date/time, company logo placeholder
  - **Executive summary**: Count of OK / Attention / N/A items, key issues list
  - **Detailed sections**: Each section with all items and their status/notes
  - **Photo evidence**: Photos with captions, timestamps, locations
  - **Footer**: Page numbers, generated timestamp
- [ ] Implement `PDFGenerator` service:
  - Accept inspection object as input
  - Render cover page
  - Render summary section
  - Loop through sections and items
  - Embed photos (compressed for file size)
  - Add page breaks appropriately
- [ ] Create `PDFPreviewPage`:
  - Show PDF in iframe or as image previews
  - "Download PDF" button
  - "Share" button (Web Share API where supported)
- [ ] Optimize performance:
  - Show progress indicator during generation
  - Generate in web worker if needed

### Testing Checklist
- [ ] PDF generates without errors
- [ ] Cover page has correct information
- [ ] Summary accurately reflects inspection
- [ ] All sections and items appear
- [ ] Photos are included with captions
- [ ] Annotations are visible in PDF photos
- [ ] PDF opens correctly in various viewers
- [ ] File size is reasonable (<10MB for typical inspection)
- [ ] Generation works offline

### Deliverables
- Complete PDF generation
- Professional report layout
- Download and share functionality

---

## Milestone 9: Polish & UX Refinement
**Duration**: 1 day

### Objectives
- Improve visual design and micro-interactions
- Add helpful empty states and onboarding
- Ensure accessibility basics

### Tasks
- [ ] Visual polish:
  - Consistent color scheme (professional blues/grays)
  - Icon set (Heroicons or similar)
  - Loading skeletons
  - Subtle animations (page transitions, button feedback)
- [ ] Empty states:
  - No templates → "Create your first template"
  - No inspections → "Start your first inspection"
  - Helpful illustrations or icons
- [ ] Onboarding:
  - First-launch welcome screen
  - Quick feature tour (optional)
  - Sample data seeding
- [ ] Accessibility:
  - Proper ARIA labels
  - Focus management
  - Color contrast (WCAG AA)
  - Touch targets ≥44px
- [ ] Error handling:
  - Graceful error messages
  - Retry options
  - Data recovery prompts
- [ ] Settings page:
  - Inspector name default
  - Clear all data option
  - App version info

### Testing Checklist
- [ ] App looks professional and cohesive
- [ ] Empty states are helpful, not confusing
- [ ] Keyboard navigation works
- [ ] Screen reader can navigate main flows
- [ ] Color contrast passes WCAG AA
- [ ] All tap targets are comfortable on mobile
- [ ] Error messages are user-friendly

### Deliverables
- Polished, professional UI
- Accessible interface
- Good user experience for first-time users

---

## Milestone 10: Optional Demo Backend
**Duration**: 1 day (optional)

### Objectives
- Create minimal Node.js backend for sync demonstration
- Implement simple REST API
- Store data in SQLite for portability

### Tasks
- [ ] Create Express.js server:
  - `/api/templates` - CRUD endpoints
  - `/api/inspections` - CRUD endpoints
  - `/api/sync` - Batch sync endpoint
- [ ] Use SQLite with better-sqlite3:
  - Schema mirrors IndexedDB structure
  - Photo storage as BLOBs or file references
- [ ] Implement demo authentication:
  - POST `/api/login` with name + optional PIN
  - Return simple JWT token
  - Middleware to validate token
- [ ] Connect frontend sync queue to backend
- [ ] Add Docker support for easy deployment (optional)

### Testing Checklist
- [ ] Backend starts with `npm run server`
- [ ] Can sync templates to backend
- [ ] Can sync inspections to backend
- [ ] Demo login works
- [ ] Data persists in SQLite
- [ ] Works alongside offline-first frontend

### Deliverables
- Optional demo backend
- REST API documentation
- Easy local setup

---

## Milestone 11: Final Integration & Testing
**Duration**: 0.5 days

### Objectives
- End-to-end testing of complete workflow
- Performance optimization
- Documentation completion

### Tasks
- [ ] Complete end-to-end test:
  1. Fresh install, create template
  2. Create inspection from template
  3. Complete checklist with various statuses
  4. Add photos with annotations
  5. Go offline, continue working
  6. Go online, verify sync (or export)
  7. Generate PDF, verify contents
- [ ] Performance audit:
  - Lighthouse PWA score ≥90
  - First contentful paint <2s
  - Time to interactive <4s
- [ ] Bundle optimization:
  - Code splitting by route
  - Lazy load annotation editor
  - Optimize images and icons
- [ ] Complete README.md:
  - Installation instructions
  - Development setup
  - Offline behavior explanation
  - Export/import guide
  - Known limitations
  - Future roadmap
- [ ] Create demo video or screenshots

### Testing Checklist
- [ ] Full workflow works on iPhone Safari
- [ ] Full workflow works on Android Chrome
- [ ] Full workflow works on desktop Chrome
- [ ] PWA installs and works as standalone app
- [ ] Lighthouse PWA audit passes
- [ ] No console errors in production build
- [ ] README is complete and accurate

### Deliverables
- Production-ready MVP
- Complete documentation
- Demo materials

---

## Summary Timeline

| Milestone | Description | Duration | Cumulative |
|-----------|-------------|----------|------------|
| 0 | Project Foundation | 0.5 days | 0.5 days |
| 1 | Data Types & Storage | 1 day | 1.5 days |
| 2 | State & Navigation | 0.5 days | 2 days |
| 3 | Template Management | 1.5 days | 3.5 days |
| 4 | Inspection Flow | 1.5 days | 5 days |
| 5 | Photo Capture | 1 day | 6 days |
| 6 | Photo Annotation | 2 days | 8 days |
| 7 | Offline & Sync | 1 day | 9 days |
| 8 | PDF Generation | 1.5 days | 10.5 days |
| 9 | Polish & UX | 1 day | 11.5 days |
| 10 | Demo Backend (optional) | 1 day | 12.5 days |
| 11 | Integration & Testing | 0.5 days | 13 days |

---

## Key Dependencies

```
Core:
- react ^18.x
- react-dom ^18.x
- react-router-dom ^6.x
- typescript ^5.x
- vite ^5.x

PWA & Storage:
- vite-plugin-pwa ^0.17.x
- dexie ^3.x (IndexedDB wrapper)
- zustand ^4.x (state management)

UI:
- tailwindcss ^3.x
- @headlessui/react ^1.x (accessible components)
- @heroicons/react ^2.x (icons)

Photo & Annotation:
- fabric ^5.x (canvas manipulation) OR custom canvas implementation

PDF:
- jspdf ^2.x
- jspdf-autotable ^3.x

Optional Backend:
- express ^4.x
- better-sqlite3 ^9.x
- jsonwebtoken ^9.x
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Photo storage fills device | Implement storage usage display, offer cleanup of old inspections |
| Annotation performance on low-end devices | Use simple canvas API, limit undo history |
| PDF generation slow for many photos | Show progress, generate in background |
| IndexedDB quota exceeded | Monitor storage, warn user before limit |
| Offline detection unreliable | Use multiple signals, assume offline for critical saves |

---

## Success Criteria (MVP Complete When)

- [ ] Inspector can complete full inspection workflow on mobile
- [ ] All data persists offline with zero data loss
- [ ] Photos can be captured and annotated easily
- [ ] PDF reports are professional and complete
- [ ] App is installable as PWA
- [ ] First-time user can figure out app without help
- [ ] Code is structured for future backend integration

---

*Document Version: 1.0*  
*Last Updated: February 4, 2026*

