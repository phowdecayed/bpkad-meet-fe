/**
 * Settings data structures for the settings management system
 */

/**
 * Defines the recursive type for nested setting values.
 */
export type FieldValue = string | number | boolean | { [key: string]: FieldValue } | FieldValue[]

/**
 * Individual setting item interface
 */
export interface Setting {
  id: number
  name: string
  group: string
  payload: Record<string, FieldValue>
  created_at: string
  updated_at: string
}

/**
 * Interface for organizing settings by group
 * Key is the group name, value is array of settings for that group
 */
export interface GroupedSettings {
  [groupName: string]: Setting[]
}

/**
 * Payload interface for creating a new setting
 */
export interface SettingCreationPayload {
  name: string
  group: string
  payload: Record<string, FieldValue>
}

/**
 * Payload interface for updating an existing setting
 */
export interface SettingUpdatePayload {
  payload: Record<string, FieldValue>
}
