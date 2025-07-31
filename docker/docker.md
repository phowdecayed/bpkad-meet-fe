   # Docker Documentation

This document provides instructions for building and running the BPKAD Zoom Vue FE application using Docker.

## Prerequisites

- Docker installed on your local machine.

## Docker Setup

The Docker setup is divided into two main environments: production and development.

### Production Environment

The production environment is optimized for performance and security. It uses a multi-stage build to create a small, efficient image.

- **Dockerfile**: `Dockerfile`
- **Service Name**: `app-prod`

**To build and run the production environment:**

```bash
# Build the production image
docker-compose -f docker/docker-compose.yml build app-prod

# Run the production container
docker-compose -f docker/docker-compose.yml up app-prod
```

Access the application at [http://localhost:5173](http://localhost:5173).

### Development Environment

The development environment is configured for live-reloading and easy debugging. It mounts the source code into the container, so any changes you make to the code will be reflected in the running application.

- **Dockerfile**: `Dockerfile.dev`
- **Service Name**: `app-dev`

**To build and run the development environment:**

```bash
# Build the development image
docker-compose -f docker/docker-compose.yml build app-dev

# Run the development container
docker-compose -f docker/docker-compose.yml up app-dev
```

Access the application at [http://localhost:5173](http://localhost:5173).

## Docker Compose

The `docker-compose.yml` file defines the services, networks, and volumes for the application.

- **`app-prod`**: The production service, which builds the application using the `Dockerfile` and runs it on port `5173`.
- **`app-dev`**: The development service, which builds the application using the `Dockerfile.dev` and runs it on port `5173` with live-reloading.
- **`bpkad-network`**: The network that the services connect to.

## Dockerfiles

- **`Dockerfile`**: This is the production Dockerfile. It uses a multi-stage build to create a small, optimized image. It installs dependencies, builds the application, and serves it with a production-ready server.
- **`Dockerfile.dev`**: This is the development Dockerfile. It installs dependencies and runs the application with a development server that supports live-reloading.
