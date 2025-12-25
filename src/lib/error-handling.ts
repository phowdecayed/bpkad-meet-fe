import axios, { type AxiosError } from 'axios'

export interface ApiErrorResponse {
  message?: string
  errors?: Record<string, string[]>
}

export function isApiError(error: unknown): error is AxiosError<ApiErrorResponse> {
  return axios.isAxiosError(error)
}

export function getErrorMessage(error: unknown): string {
  if (isApiError(error) && error.response?.data?.message) {
    return error.response.data.message
  }
  return error instanceof Error ? error.message : 'An unknown error occurred'
}
