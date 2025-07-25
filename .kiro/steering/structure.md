# Project Structure

## Root Directory

- **src/**: Main application source code
- **docs/**: API documentation and Postman collections
- **public/**: Static assets (favicon, images)
- **dist/**: Build output (generated)
- **.kiro/**: Kiro AI assistant configuration

## Source Code Organization (`src/`)

### Core Application

- **main.ts**: Application entry point with Pinia, router, and axios setup
- **App.vue**: Root component with RouterView and global Toaster

### Components (`src/components/`)

- **ui/**: shadcn-vue UI components organized by component type
  - Each UI component has its own folder with Vue files and index.ts
  - Uses barrel exports pattern for clean imports
- **charts/**: Chart.js wrapper components for analytics
- **meetings/**: Meeting-specific components (create/edit dialogs)
- **settings/**: Settings and configuration components
- **icons/**: Custom icon components
- ****tests**/**: Component test files

### Application Logic

- **stores/**: Pinia stores for state management
  - `auth.ts`: Authentication and user management
  - `meetings.ts`: Meeting data and operations
  - `locations.ts`: Meeting location management
  - `settings.ts`: Application settings
  - `statistics.ts`: Analytics data
  - `users.ts`: User management
- **types/**: TypeScript type definitions
  - Interface definitions for API responses
  - Shared type definitions across components
- **lib/**: Utility functions and helpers
  - `utils.ts`: Common utility functions (likely Tailwind class merging)

### Routing & Views

- **router/**: Vue Router configuration
- **views/**: Page-level components
  - Authentication views (Login, Register, ForgotPassword, etc.)
  - Main application views (Dashboard, Meetings, Settings, etc.)
  - Admin views (UserManagement, RoleManagement)

### Assets & Layouts

- **assets/**: Stylesheets, images, and static resources
  - `main.css`: Global styles and Tailwind imports
- **layouts/**: Layout components for different page types

## Naming Conventions

### Components

- **PascalCase** for component names and files
- **Descriptive prefixes**: `Create*Dialog`, `Edit*Dialog`, `*View`, `*Form`
- **UI components**: Follow shadcn-vue naming (e.g., `Button.vue`, `Dialog.vue`)

### Stores

- **camelCase** filenames with descriptive names
- Use `use*Store` pattern for store composables

### Types

- **PascalCase** for interface names
- **Descriptive names**: `Meeting`, `MeetingLocation`, `ZoomMeeting`

## Import Patterns

- Use `@/` alias for src imports
- Barrel exports from UI component folders
- Group imports: Vue/framework first, then libraries, then local imports

## File Organization Rules

- One main component per file
- Related components grouped in folders
- Types defined close to where they're used
- Shared types in dedicated `types/` directory
