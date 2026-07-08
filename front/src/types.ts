export type Trip = {
  id: number
  departure_city: string
  arrival_city: string
  departure_time: string
  arrival_time: string
  price: number
  available_seats: number
}

export type Booking = {
  id: number
  trip_id: number
  passenger_name: string
  passenger_phone: string
  seats_booked: number
  comment?: string | null
  booked_at: string
}

export type AuthUser = Record<string, unknown> & {
  id?: number | string
  email?: string
  fullname?: string
  password?: string
}

export type TripPayload = {
  departure_city: string
  arrival_city: string
  departure_time: string
  arrival_time: string
  price: number
  available_seats: number
}

export type TripFiltersPayload = Partial<{
  departure_city: string
  arrival_city: string
  price__gte: number
  price__lte: number
  available_seats__gte: number
  available_seats__lte: number
  departure_time__gte: string
  departure_time__lte: string
  arrival_time__gte: string
  arrival_time__lte: string
}>

export type BookingPayload = {
  passenger_name: string
  passenger_phone: string
  seats_booked: number
  comment?: string
}
