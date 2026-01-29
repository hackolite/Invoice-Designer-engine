# Invoice Template WYSIWYG Editor

## Overview

A drag-and-drop invoice template builder that allows users to create, edit, and manage customizable invoice layouts. The application features a canvas-based WYSIWYG editor where users can place and configure elements (text, images, tables, boxes, lines) with data binding support using `{{variable}}` syntax. Templates are stored with sample JSON data for previewing how real invoice data will render.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, bundled via Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state, local React state for UI
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Canvas Editor**: react-rnd library for drag-and-drop and resizable elements on an A4-sized canvas

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints defined in `shared/routes.ts` with Zod schemas for request/response validation
- **Database Access**: Drizzle ORM with PostgreSQL

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with schema defined in `shared/schema.ts`
- **Migrations**: Drizzle Kit for schema migrations (`drizzle-kit push`)
- **Schema Design**: Templates table stores layout as JSONB containing element positions, styles, content, and data bindings

### Shared Code Pattern
- The `shared/` directory contains code used by both client and server
- `shared/schema.ts`: Database table definitions and TypeScript types
- `shared/routes.ts`: API contract with paths, methods, and Zod validation schemas

### Build System
- **Development**: Vite dev server with HMR, proxied through Express
- **Production**: Vite builds client to `dist/public`, esbuild bundles server to `dist/index.cjs`
- **Type Checking**: TypeScript with path aliases (`@/` for client, `@shared/` for shared)

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connected via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage (available but may not be actively used)

### UI Libraries
- **Radix UI**: Headless component primitives for accessibility
- **shadcn/ui**: Pre-styled component collection
- **react-rnd**: Draggable and resizable container for canvas elements
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel component
- **cmdk**: Command palette component

### Data & Validation
- **Zod**: Schema validation for API contracts and form data
- **drizzle-zod**: Generate Zod schemas from Drizzle table definitions
- **@tanstack/react-query**: Async state management and caching

### Styling
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: Variant management for components
- **tailwind-merge**: Merge Tailwind classes safely