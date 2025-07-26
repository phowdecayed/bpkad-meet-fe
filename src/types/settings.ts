/**
 * Settings data structures for the settings management system
 */

/**
 * Individual setting item interface
 */
export interface Setting {
  id: number
  name: string
  group: string
  payload: Record<string, unknown>
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
  payload: Record<string, unknown>
}

/**
 * Payload interface for updating an existing setting
 */
export interface SettingUpdatePayload {
  payload: Record<string, unknown>
}
