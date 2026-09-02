/**
 * Safely extracts a human-readable message from an unknown error value,
 * typically an Axios error whose server payload is `{ message?: string }`.
 * Falls back to the provided default when no message is available.
 */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  const message = (err as { response?: { data?: { message?: unknown } } })?.response?.data?.message
  return typeof message === 'string' && message.trim() ? message : fallback
}
