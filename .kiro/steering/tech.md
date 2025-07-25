# Technology Stack

## Frontend Framework

- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Vite** as build tool and dev server
- **Vue Router 4** for routing
- **Pinia** for state management

## UI & Styling

- **Tailwind CSS 4** for styling
- **shadcn-vue** component library (New York style)
- **Reka UI** for headless components
- **Lucide Vue** for icons
- **Chart.js** with vue-chartjs for data visualization

## Form Handling & Validation

- **Vee-validate** with Zod schema validation
- **@vee-validate/zod** for integration

## HTTP & API

- **Axios** for HTTP requests with interceptors
- Base URL configured via `VITE_API_BASE_URL` environment variable
- Bearer token authentication with automatic 401 handling

## Development Tools

- **ESLint** with Vue and TypeScript configs
- **Prettier** for code formatting
- **Vitest** for unit testing
- **Vue DevTools** for debugging

## Common Commands

```bash
# Development
npm run dev              # Start dev server with hot reload

# Building
npm run build           # Type-check and build for production
npm run build-only      # Build without type checking
npm run type-check      # Run TypeScript type checking

# Testing & Quality
npm run test:unit       # Run unit tests with Vitest
npm run lint            # Lint and fix code with ESLint
npm run format          # Format code with Prettier

# Preview
npm run preview         # Preview production build locally
```

## Code Style

- **No semicolons** (Prettier config)
- **Single quotes** preferred
- **100 character** line width
- **Path aliases**: `@/` maps to `src/`
