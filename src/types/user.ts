export interface Permission {
  id: number;
  name: string;
  group_name: string;
}

export interface Role {
  id: number;
  name: string;
  permissions?: Permission[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
  roles?: Role[];
  permissions?: Permission[];
}

export interface UserCreationPayload {
  name: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  role: string;
}

export interface UserUpdatePayload {
  name: string;
  email: string;
  roles: number[];
}