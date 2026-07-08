import type {
  AuthUser,
  Booking,
  BookingPayload,
  Trip,
  TripFiltersPayload,
  TripPayload,
} from './types'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  token?: string | null
  body?: unknown
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', token, body } = options
  const headers = new Headers()

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '')

  if (!response.ok) {
    const detail = typeof payload === 'object' && payload && 'detail' in payload
      ? String((payload as { detail?: unknown }).detail)
      : typeof payload === 'string' && payload
        ? payload
        : `Ошибка запроса ${response.status}`

    throw new Error(detail)
  }

  return payload as T
}

export const api = {
  auth: {
    login: (payload: Record<string, unknown>) => request<Record<string, unknown>>('/auth/login', {
      method: 'POST',
      body: payload,
    }),
    register: (payload: Record<string, unknown>) => request<Record<string, unknown>>('/auth/register', {
      method: 'POST',
      body: payload,
    }),
    me: (token: string) => request<AuthUser>('/auth/me', { token }),
  },
  trips: {
    list: (token: string) => request<Trip[]>('/trips/', { token }),
    get: (tripId: number, token: string) => request<Trip>(`/trips/${tripId}`, { token }),
    filter: (filters: TripFiltersPayload, token: string) => request<Trip[]>('/trips/filter', {
      method: 'POST',
      token,
      body: filters,
    }),
    create: (payload: TripPayload, token: string) => request<Trip>('/trips/', {
      method: 'POST',
      token,
      body: payload,
    }),
    update: (tripId: number, payload: TripPayload, token: string) => request<Trip>(`/trips/${tripId}`, {
      method: 'PUT',
      token,
      body: payload,
    }),
    delete: async (tripId: number, token: string) => {
      await request<null>(`/trips/${tripId}`, { method: 'DELETE', token })
    },
  },
  bookings: {
    get: (bookingId: number, token: string) => request<Booking>(`/bookings/${bookingId}`, { token }),
    listForTrip: (tripId: number, token: string) => request<Booking[]>(`/trips/${tripId}/bookings`, { token }),
    create: (tripId: number, payload: BookingPayload, token: string) => request<Booking>(`/trips/${tripId}/bookings`, {
      method: 'POST',
      token,
      body: payload,
    }),
    delete: (bookingId: number, token: string) => request<Booking | boolean>(`/trips/bookings/${bookingId}`, {
      method: 'DELETE',
      token,
    }),
  },
}
