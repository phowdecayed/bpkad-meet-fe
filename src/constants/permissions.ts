export const PERMISSIONS = {
  MEETINGS: {
    CREATE: 'create meetings',
    EDIT: 'edit meetings',
    DELETE: 'delete meetings',
    VIEW: 'view meetings',
    VIEW_HOST_KEY: 'view host key',
  },
  USERS: {
    MANAGE: 'manage users',
  },
  ROLES: {
    MANAGE: 'manage roles',
  },
  SETTINGS: {
    MANAGE: 'manage settings',
  },
  PARTICIPANTS: {
    MANAGE: 'manage participants',
    VIEW: 'view participants',
  },
} as const
