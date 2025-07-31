# BPKAD Zoom Vue FE Codebase

This document provides a detailed overview of the BPKAD Zoom Vue FE codebase, its structure, and how to get started.

## Project Structure

The project is organized into the following directories:

- **`src`**: Contains the main application source code.
  - **`assets`**: Static assets like CSS and images.
  - **`components`**: Reusable Vue components.
    - **`charts`**: Chart components.
    - **`icons`**: Icon components.
    - **`meetings`**: Components related to meetings.
    - **`settings`**: Components related to settings.
    - **`ui`**: Generic UI components.
  - **`layouts`**: Application layouts.
  - **`lib`**: Utility functions and libraries.
    - **`validation`**: Validation schemas and utilities.
  - **`router`**: Vue Router configuration.
  - **`stores`**: Pinia stores for state management.
  - **`types`**: TypeScript type definitions.
  - **`views`**: Application views or pages.
- **`public`**: Static assets that are not processed by the build system.
- **`docker`**: Docker-related files.
- **`docs`**: Project documentation.

## Getting Started

To get started with the project, you can use Docker or run it locally.

### Docker

For detailed instructions on how to use Docker, see the [Docker documentation](./docker/docker.md).

### Local Development

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Run the development server:**

   ```bash
   npm run dev
   ```

   The application will be available at [http://localhost:5173](http://localhost:5173).

## Building for Production

To build the application for production, run the following command:

```bash
npm run build
```

This will create a `dist` directory with the production-ready files.

## Documentation

- **[API Documentation](./docs/api_documentation.md)**: Detailed documentation of the API endpoints.
- **[Docker Documentation](./docker/docker.md)**: Instructions for building and running the application with Docker.
