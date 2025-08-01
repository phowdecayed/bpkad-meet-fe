# Vue Router

This document provides an overview of the Vue Router configuration in the BPKAD Zoom Vue FE application.

The router is configured in `src/router/index.ts`. It defines the application's routes, including public routes, authenticated routes, and admin routes.

## Routes

The following routes are defined:

- **`/`**: The home page.
- **`/login`**: The login page.
- **`/forgot-password`**: The forgot password page.
- **`/reset-password`**: The reset password page.
- **`/verify-email`**: The verify email page.
- **`/app`**: The main application layout, which requires authentication.
  - **`/dashboard`**: The dashboard.
  - **`/meetings`**: The meetings page.
  - **`/locations`**: The meeting locations page.
  - **`/settings`**: The settings page.
  - **`/users`**: The user management page.
  - **`/roles`**: The role management page.
  - **`/profile`**: The user profile page.
- **`/about`**: The about page.
- **`/*`**: A catch-all route for 404 Not Found errors.
