import { describe, it, expect } from 'vitest'
import { isApiError, getErrorMessage } from '../error-handling'
import { AxiosError, AxiosHeaders } from 'axios'

describe('error-handling utilities', () => {
  describe('isApiError', () => {
    it('returns true for Axios errors', () => {
      const headers = new AxiosHeaders()
      const axiosError = new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 400,
        statusText: 'Bad Request',
        data: { message: 'Validation error' },
        headers,
        config: { headers },
      })
      expect(isApiError(axiosError)).toBe(true)
    })

    it('returns false for regular errors', () => {
      const regularError = new Error('Something went wrong')
      expect(isApiError(regularError)).toBe(false)
    })

    it('returns false for non-error values', () => {
      expect(isApiError('string error')).toBe(false)
      expect(isApiError(null)).toBe(false)
      expect(isApiError(undefined)).toBe(false)
      expect(isApiError(123)).toBe(false)
    })
  })

  describe('getErrorMessage', () => {
    it('extracts message from API error response', () => {
      const headers = new AxiosHeaders()
      const axiosError = new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 400,
        statusText: 'Bad Request',
        data: { message: 'Email sudah terdaftar' },
        headers,
        config: { headers },
      })
      expect(getErrorMessage(axiosError)).toBe('Email sudah terdaftar')
    })

    it('falls back to Error.message for regular errors', () => {
      const error = new Error('Connection timeout')
      expect(getErrorMessage(error)).toBe('Connection timeout')
    })

    it('returns default message for unknown error types', () => {
      expect(getErrorMessage('string error')).toBe('An unknown error occurred')
      expect(getErrorMessage(null)).toBe('An unknown error occurred')
      expect(getErrorMessage(undefined)).toBe('An unknown error occurred')
      expect(getErrorMessage(123)).toBe('An unknown error occurred')
    })

    it('handles Axios error without response data message', () => {
      const headers = new AxiosHeaders()
      const axiosError = new AxiosError('Network Error', 'ERR_NETWORK', undefined, undefined, {
        status: 500,
        statusText: 'Internal Server Error',
        data: {},
        headers,
        config: { headers },
      })
      // Falls back to the Axios error message itself
      expect(getErrorMessage(axiosError)).toBe('Network Error')
    })
  })
})
