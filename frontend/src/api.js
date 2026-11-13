// Small wrapper around fetch. Every error becomes an ApiError with a plain-language message.
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status // 0 means the request never reached the server
    this.code = code
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      // The server only accepts JSON for POST/PATCH/DELETE (part of our CSRF protection).
      headers: { 'Content-Type': 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify(body ?? {}),
    })
  } catch {
    throw new ApiError(0, 'network', 'Could not reach the server. Check your internet connection and try again.')
  }

  let data = null
  try {
    data = await res.json()
  } catch {
    // not JSON; handled below
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.error?.code ?? 'unknown',
      data?.error?.message ?? 'Something went wrong. Please try again.',
    )
  }
  return data
}
