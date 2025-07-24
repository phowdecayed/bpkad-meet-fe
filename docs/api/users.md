[<-- Back to Index](../api_documentation.md)

# Admin: User Management

This section covers endpoints for administrators to manage user accounts.

### 1. List Users

- **Method:** `GET`
- **Endpoint:** `/api/users`
- **Description:** Retrieves a paginated list of all users. **Requires `manage users` permission.**
- **Headers:** `Authorization: Bearer <token>`
- **Success Response (200):** A paginated list of user objects.

### 2. Create User

- **Method:** `POST`
- **Endpoint:** `/api/users`
- **Description:** Creates a new user. **Requires `manage users` permission.**
- **Headers:** `Authorization: Bearer <token>`
- **Payload:** See `POST /api/register` in [Authentication](./authentication.md).
- **Success Response (201):** Returns the new user object.

### 3. Get a Specific User

- **Method:** `GET`
- **Endpoint:** `/api/users/{id}`
- **Description:** Retrieves a single user. **Requires `manage users` permission.**
- **Headers:** `Authorization: Bearer <token>`
- **Success Response (200):** Returns the user object.

### 4. Update a User

- **Method:** `PUT` or `PATCH`
- **Endpoint:** `/api/users/{id}`
- **Description:** Updates a user's details (name, email, roles). **Requires `manage users` permission.**
- **Headers:** `Authorization: Bearer <token>`
- **Payload:**
| Parameter | Type | Validation | Description |
|---|---|---|---|
| `name` | string | sometimes, required, max:255 | The user's full name. |
| `email` | string | sometimes, required, email, unique | The user's email address. |
| `roles` | array | sometimes | An array of role IDs to assign to the user. |
- **Success Response (200):** Returns the updated user object.

### 5. Delete a User

- **Method:** `DELETE`
- **Endpoint:** `/api/users/{id}`
- **Description:** Deletes a user. **Requires `manage users` permission.**
- **Headers:** `Authorization: Bearer <token>`
- **Success Response (200):** `{"message": "User deleted successfully."}`

### 6. Send Password Reset Email

- **Method:** `POST`
- **Endpoint:** `/api/users/{id}/send-password-reset`
- **Description:** Triggers the "forgot password" email flow for a specific user. **Requires `manage users` permission.**
- **Headers:** `Authorization: Bearer <token>`
- **Success Response (200):** `{"message": "Password reset email sent successfully."}`

---

## Common Error Responses

- **401 Unauthorized:** The request is missing a valid authentication token.
- **403 Forbidden:** The authenticated user does not have the `manage users` permission.
- **404 Not Found:** The requested user does not exist.
- **422 Unprocessable Entity:** The request payload contains validation errors.
- **500 Internal Server Error:** A generic error indicating a problem on the server.
