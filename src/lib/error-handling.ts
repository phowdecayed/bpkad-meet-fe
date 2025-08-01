export interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
}

export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as ApiError).response === 'object' &&
    (error as ApiError).response !== null &&
    'data' in (error as ApiError).response! &&
    typeof (error as ApiError).response!.data === 'object' &&
    (error as ApiError).response!.data !== null &&
    'message' in (error as ApiError).response!.data! &&
    typeof (error as ApiError).response!.data!.message === 'string'
  )
}
