import axios, { type AxiosError } from 'axios'

export interface ApiErrorResponse {
  message?: string
  errors?: Record<string, string[]>
}

export function isApiError(error: unknown): error is AxiosError<ApiErrorResponse> {
  return axios.isAxiosError(error)
}

// Keep the old manual check as a backup if needed, or deprecate it
// But for now, just replacing it with the robust check is better
// The checks below are redundant if we use keys
export function getErrorMessage(error: unknown): string {
  if (isApiError(error) && error.response?.data?.message) {
    return error.response.data.message
  }
  return error instanceof Error ? error.message : 'An unknown error occurred'
}
