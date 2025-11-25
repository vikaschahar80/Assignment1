# AI-Assisted Text Editor

## Overview

This is a professional AI-assisted text editor built with React, TypeScript, and ProseMirror. The application allows users to write text and leverage AI-powered text continuation using Google's Gemini AI model. The editor features a clean, minimalist interface inspired by productivity tools like Linear and Notion, with a focus on distraction-free writing.

The core functionality includes:
- Rich text editing powered by ProseMirror
- AI-powered text continuation triggered by user action
- State management using XState finite state machine
- Professional UI components from shadcn/ui
- Real-time content updates and validation

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Component Structure:**
- Single-page application (SPA) using React with TypeScript
- Vite as the build tool and development server
- Component-based architecture with separation of concerns

**Key Design Patterns:**
- **ProseMirror Integration**: Custom wrapper component (`ProseMirrorEditor`) that encapsulates the ProseMirror editor with imperative handle for text insertion and content extraction
- **State Machine Pattern**: XState manages the editor lifecycle with distinct states (idle, loadingAI, error) for handling asynchronous AI requests
- **Custom Hooks**: React hooks for mobile detection, toast notifications, and state machine integration
- **Ref-based Communication**: Uses React refs to bridge between React component state and ProseMirror's imperative API

**UI Component Library:**
- shadcn/ui components with Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- "New York" style variant configured
- Consistent spacing system using Tailwind units (2, 3, 4, 6, 8, 12, 16)

**Routing:**
- wouter for lightweight client-side routing
- Single main route ("/") for the Editor page
- 404 handler for undefined routes

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript
- ESM module system
- Separate development and production entry points

**API Design:**
- RESTful endpoint: `POST /api/continue-writing`
- Request/response validation using Zod schemas
- Centralized error handling with structured error responses

**Development vs Production:**
- Development: Vite middleware integration for HMR and fast refresh
- Production: Static file serving from pre-built dist directory
- Environment-aware server configuration

### State Management

**XState Finite State Machine:**
- **States**: idle, loadingAI, error
- **Context**: Tracks editor content, AI-generated text, error messages, and request timestamps
- **Events**: CONTINUE_WRITING, AI_SUCCESS, AI_ERROR, CLEAR_ERROR, UPDATE_CONTENT
- **Guards**: Validates non-empty content before triggering AI requests
- **Global Event Handlers**: UPDATE_CONTENT event handled across all states for real-time content synchronization

**React Query:**
- Configured with infinite stale time for static data
- Custom query functions with credential handling
- Error boundary integration for unauthorized states

### Data Flow

1. User types in ProseMirror editor → triggers `onContentChange` callback
2. Content updates XState context via UPDATE_CONTENT event
3. User clicks "Continue Writing" button → sends CONTINUE_WRITING event
4. State machine transitions to loadingAI state
5. API request made to `/api/continue-writing` endpoint
6. On success: AI text inserted into editor, state returns to idle
7. On error: State transitions to error state with message

### Type Safety

**Shared Schema:**
- Centralized type definitions in `shared/schema.ts`
- Zod schemas for runtime validation
- TypeScript interfaces for compile-time safety
- ProseMirror document type definitions

**Type Organization:**
- API request/response types
- Editor context and event types
- ProseMirror document structure types

## External Dependencies

### AI Service Integration

**Google Gemini AI:**
- Package: `@google/genai` v1.30.0
- Model: gemini-2.5-flash (configurable)
- Environment variable: `GEMINI_API_KEY`
- Use case: Text continuation generation
- Configuration: Temperature 0.8, max tokens 200
- Error handling: Wrapped with try-catch and meaningful error messages

### Database

**Drizzle ORM:**
- Package: `drizzle-orm` v0.39.1
- Configured for PostgreSQL dialect
- Schema location: `./shared/schema.ts`
- Migration output: `./migrations` directory
- Database connection: `@neondatabase/serverless` v0.10.4
- Environment variable: `DATABASE_URL`

**Note:** While Drizzle is configured, the current implementation uses in-memory storage (`MemStorage` class) for user data. The database setup is prepared for future persistence needs.

### UI Components

**shadcn/ui:**
- Extensive component library based on Radix UI primitives
- Components include: Button, Card, Dialog, Toast, Tooltip, and 30+ others
- Customized with Tailwind CSS variables
- Accessibility-focused with ARIA support

**Radix UI:**
- Unstyled, accessible component primitives
- 20+ primitive packages for complex UI patterns
- Keyboard navigation and screen reader support

### Styling

**Tailwind CSS:**
- Custom configuration with extended color palette
- HSL-based color system with alpha channel support
- Custom border radius values (lg: 9px, md: 6px, sm: 3px)
- CSS custom properties for theming
- PostCSS with autoprefixer

**Typography:**
- Google Fonts: Inter font family (weights 300-700)
- System font fallbacks

### Development Tools

**Replit Plugins:**
- `@replit/vite-plugin-runtime-error-modal`: Runtime error overlay
- `@replit/vite-plugin-cartographer`: Code navigation
- `@replit/vite-plugin-dev-banner`: Development indicator
- Conditionally loaded only in development environment

**Build Tools:**
- Vite for frontend bundling and dev server
- esbuild for server-side bundling
- tsx for TypeScript execution in development

### Session Management

**connect-pg-simple:**
- PostgreSQL session store for Express
- Configured for production session persistence
- Currently using in-memory storage in development

### Utilities

**Class Management:**
- `clsx` and `tailwind-merge` for conditional class composition
- `class-variance-authority` for component variant styling

**Date Handling:**
- `date-fns` v3.6.0 for date formatting and manipulation

**Form Validation:**
- `zod` for schema validation
- `@hookform/resolvers` for React Hook Form integration

**Icons:**
- `lucide-react` for consistent iconography throughout the UI