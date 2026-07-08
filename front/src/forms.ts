import type { BookingPayload, TripFiltersPayload, TripPayload } from './types'
import { toIsoString } from './utils'

export type Notice = {
  kind: 'success' | 'error' | 'info'
  text: string
}

export type FilterFormState = {
  departure_city: string
  arrival_city: string
  price__gte: string
  price__lte: string
  available_seats__gte: string
  available_seats__lte: string
  departure_time__gte: string
  departure_time__lte: string
  arrival_time__gte: string
  arrival_time__lte: string
}

export type TripFormState = {
  departure_city: string
  arrival_city: string
  departure_time: string
  arrival_time: string
  price: string
  available_seats: string
}

export type BookingFormState = {
  passenger_name: string
  passenger_phone: string
  seats_booked: string
  comment: string
}

export const emptyFilters: FilterFormState = {
  departure_city: '',
  arrival_city: '',
  price__gte: '',
  price__lte: '',
  available_seats__gte: '',
  available_seats__lte: '',
  departure_time__gte: '',
  departure_time__lte: '',
  arrival_time__gte: '',
  arrival_time__lte: '',
}

export const emptyBookingForm: BookingFormState = {
  passenger_name: '',
  passenger_phone: '',
  seats_booked: '1',
  comment: '',
}

function toLocalInputValue(date: Date): string {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return shifted.toISOString().slice(0, 16)
}

export function getDefaultTripForm(): TripFormState {
  const departure = new Date(Date.now() + 60 * 60 * 1000)
  const arrival = new Date(Date.now() + 4 * 60 * 60 * 1000)

  return {
    departure_city: '',
    arrival_city: '',
    departure_time: toLocalInputValue(departure),
    arrival_time: toLocalInputValue(arrival),
    price: '',
    available_seats: '1',
  }
}

export function buildTripFiltersPayload(filters: FilterFormState): TripFiltersPayload {
  const payload: TripFiltersPayload = {}

  if (filters.departure_city.trim()) payload.departure_city = filters.departure_city.trim()
  if (filters.arrival_city.trim()) payload.arrival_city = filters.arrival_city.trim()
  if (filters.price__gte.trim()) payload.price__gte = Number(filters.price__gte)
  if (filters.price__lte.trim()) payload.price__lte = Number(filters.price__lte)
  if (filters.available_seats__gte.trim()) payload.available_seats__gte = Number(filters.available_seats__gte)
  if (filters.available_seats__lte.trim()) payload.available_seats__lte = Number(filters.available_seats__lte)
  if (filters.departure_time__gte.trim()) payload.departure_time__gte = toIsoString(filters.departure_time__gte)
  if (filters.departure_time__lte.trim()) payload.departure_time__lte = toIsoString(filters.departure_time__lte)
  if (filters.arrival_time__gte.trim()) payload.arrival_time__gte = toIsoString(filters.arrival_time__gte)
  if (filters.arrival_time__lte.trim()) payload.arrival_time__lte = toIsoString(filters.arrival_time__lte)

  return payload
}

export function hasActiveFilters(filters: FilterFormState): boolean {
  return Object.keys(buildTripFiltersPayload(filters)).length > 0
}

export function buildTripPayload(form: TripFormState): TripPayload {
  return {
    departure_city: form.departure_city.trim(),
    arrival_city: form.arrival_city.trim(),
    departure_time: toIsoString(form.departure_time),
    arrival_time: toIsoString(form.arrival_time),
    price: Number(form.price),
    available_seats: Number(form.available_seats),
  }
}

export function buildBookingPayload(form: BookingFormState): BookingPayload {
  const payload: BookingPayload = {
    passenger_name: form.passenger_name.trim(),
    passenger_phone: form.passenger_phone.trim(),
    seats_booked: Number(form.seats_booked),
  }

  if (form.comment.trim()) {
    payload.comment = form.comment.trim()
  }

  return payload
}

export function validateTripForm(form: TripFormState): string | null {
  if (!form.departure_city.trim() || !form.arrival_city.trim()) {
    return 'Укажите города отправления и прибытия'
  }

  if (!form.departure_time || !form.arrival_time) {
    return 'Укажите время отправления и прибытия'
  }

  if (new Date(form.arrival_time) <= new Date(form.departure_time)) {
    return 'Время прибытия должно быть позже времени отправления'
  }

  if (Number(form.price) <= 0) {
    return 'Цена должна быть больше нуля'
  }

  if (Number(form.available_seats) <= 0) {
    return 'Количество мест должно быть больше нуля'
  }

  return null
}

export function validateBookingForm(form: BookingFormState): string | null {
  if (!form.passenger_name.trim()) {
    return 'Укажите имя пассажира'
  }

  if (!form.passenger_phone.trim()) {
    return 'Укажите телефон пассажира'
  }

  if (Number(form.seats_booked) <= 0) {
    return 'Количество мест должно быть больше нуля'
  }

  return null
}
