import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { BookingCard, EmptyState, Field, Section } from '../components/ui'
import {
  buildBookingPayload,
  buildTripPayload,
  emptyBookingForm,
  getDefaultTripForm,
  validateBookingForm,
  validateTripForm,
  type BookingFormState,
  type Notice,
  type TripFormState,
} from '../forms'
import type { Booking, Trip } from '../types'
import {
  buildYandexRouteUrl,
  formatDateTime,
  formatMoney,
  getErrorMessage,
  toDatetimeLocalValue,
} from '../utils'

export function TripDetailsPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const params = useParams()
  const tripId = Number(params.tripId)

  const [trip, setTrip] = useState<Trip | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [editForm, setEditForm] = useState<TripFormState>(getDefaultTripForm())
  const [bookingForm, setBookingForm] = useState<BookingFormState>(emptyBookingForm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [pageNotice, setPageNotice] = useState<Notice | null>(null)

  async function loadTripData() {
    if (!token || !tripId) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [tripResult, bookingsResult, tripsResult] = await Promise.all([
        api.trips.get(tripId, token),
        api.bookings.listForTrip(tripId, token),
        api.trips.list(token),
      ])
      setTrip(tripResult)
      setBookings(bookingsResult)
      setTrips(tripsResult)
      setEditForm({
        departure_city: tripResult.departure_city,
        arrival_city: tripResult.arrival_city,
        departure_time: toDatetimeLocalValue(tripResult.departure_time),
        arrival_time: toDatetimeLocalValue(tripResult.arrival_time),
        price: String(tripResult.price),
        available_seats: String(tripResult.available_seats),
      })
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTripData()
  }, [token, tripId])

  const cities = useMemo(() => {
    const set = new Set<string>()
    for (const item of trips) {
      set.add(item.departure_city)
      set.add(item.arrival_city)
    }
    return [...set].sort((left, right) => left.localeCompare(right, 'ru'))
  }, [trips])

  async function handleUpdateTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateTripForm(editForm)
    if (validationError || !token || !tripId) {
      setPageNotice(validationError ? { kind: 'error', text: validationError } : null)
      return
    }

    setActionLoading(true)
    setPageNotice(null)

    try {
      await api.trips.update(tripId, buildTripPayload(editForm), token)
      await loadTripData()
      setPageNotice({ kind: 'success', text: `Поездка #${tripId} обновлена.` })
    } catch (error) {
      setPageNotice({ kind: 'error', text: getErrorMessage(error) })
    } finally {
      setActionLoading(false)
    }
  }

  async function handleDeleteTrip() {
    if (!token || !tripId || !window.confirm(`Удалить поездку #${tripId}?`)) {
      return
    }

    setActionLoading(true)
    setPageNotice(null)

    try {
      await api.trips.delete(tripId, token)
      navigate('/trips', {
        replace: true,
        state: { notice: { kind: 'success', text: `Поездка #${tripId} удалена.` } },
      })
    } catch (error) {
      setPageNotice({ kind: 'error', text: getErrorMessage(error) })
      setActionLoading(false)
    }
  }

  async function handleCreateBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationError = validateBookingForm(bookingForm)
    if (validationError || !token || !tripId) {
      setPageNotice(validationError ? { kind: 'error', text: validationError } : null)
      return
    }

    setActionLoading(true)
    setPageNotice(null)

    try {
      const booking = await api.bookings.create(tripId, buildBookingPayload(bookingForm), token)
      navigate(`/bookings/${booking.id}`, {
        replace: true,
        state: { notice: { kind: 'success', text: `Бронь #${booking.id} создана.` } },
      })
    } catch (error) {
      setPageNotice({ kind: 'error', text: getErrorMessage(error) })
      setActionLoading(false)
    }
  }

  async function handleDeleteBooking(bookingId: number) {
    if (!token || !window.confirm(`Удалить бронь #${bookingId}?`)) {
      return
    }

    setActionLoading(true)
    setPageNotice(null)

    try {
      await api.bookings.delete(bookingId, token)
      await loadTripData()
      setPageNotice({ kind: 'success', text: `Бронь #${bookingId} удалена.` })
    } catch (error) {
      setPageNotice({ kind: 'error', text: getErrorMessage(error) })
    } finally {
      setActionLoading(false)
    }
  }

  if (!tripId) {
    return <EmptyState text="Некорректный ID поездки." error />
  }

  if (loading) {
    return <EmptyState text={`Загружаем поездку #${tripId}...`} />
  }

  if (error || !trip) {
    return <EmptyState text={error || 'Поездка не найдена.'} error />
  }

  return (
    <>
      <Section title={`Поездка #${trip.id}`} subtitle="Отдельная страница просмотра, редактирования и бронирования.">
        {pageNotice ? <div className={`notice notice--${pageNotice.kind}`}>{pageNotice.text}</div> : null}
        <article className="panel panel-highlight">
          <div className="trip-card__top">
            <div>
              <h3 className="panel-title">{trip.departure_city} → {trip.arrival_city}</h3>
              <p className="muted">Маршрут и все выходные данные по поездке.</p>
            </div>
            <a className="button button-secondary" href={buildYandexRouteUrl(trip.departure_city, trip.arrival_city)} target="_blank" rel="noreferrer">
              Открыть маршрут
            </a>
          </div>
          <div className="trip-metrics">
            <div>
              <span className="metric-label">Отправление</span>
              <strong>{formatDateTime(trip.departure_time)}</strong>
            </div>
            <div>
              <span className="metric-label">Прибытие</span>
              <strong>{formatDateTime(trip.arrival_time)}</strong>
            </div>
            <div>
              <span className="metric-label">Цена</span>
              <strong>{formatMoney(trip.price)}</strong>
            </div>
            <div>
              <span className="metric-label">Свободных мест</span>
              <strong>{trip.available_seats}</strong>
            </div>
          </div>
        </article>
      </Section>

      <Section title="Редактирование поездки" subtitle="После сохранения вы остаётесь на этой странице с обновлёнными данными.">
        <form className="panel" onSubmit={handleUpdateTrip}>
          <div className="form-grid form-grid--two">
            <Field label="Город отправления">
              <input className="input" list="cities-list" value={editForm.departure_city} onChange={(event) => setEditForm((prev) => ({ ...prev, departure_city: event.target.value }))} />
            </Field>
            <Field label="Город прибытия">
              <input className="input" list="cities-list" value={editForm.arrival_city} onChange={(event) => setEditForm((prev) => ({ ...prev, arrival_city: event.target.value }))} />
            </Field>
            <Field label="Отправление">
              <input className="input" type="datetime-local" value={editForm.departure_time} onChange={(event) => setEditForm((prev) => ({ ...prev, departure_time: event.target.value }))} />
            </Field>
            <Field label="Прибытие">
              <input className="input" type="datetime-local" value={editForm.arrival_time} onChange={(event) => setEditForm((prev) => ({ ...prev, arrival_time: event.target.value }))} />
            </Field>
            <Field label="Цена, ₽">
              <input className="input" type="number" min="1" step="1" value={editForm.price} onChange={(event) => setEditForm((prev) => ({ ...prev, price: event.target.value }))} />
            </Field>
            <Field label="Свободные места">
              <input className="input" type="number" min="1" value={editForm.available_seats} onChange={(event) => setEditForm((prev) => ({ ...prev, available_seats: event.target.value }))} />
            </Field>
          </div>
          <div className="card-actions card-actions--left">
            <button className="button" type="submit" disabled={actionLoading}>
              {actionLoading ? 'Сохраняем...' : 'Сохранить изменения'}
            </button>
            <button className="button button-danger" type="button" onClick={handleDeleteTrip} disabled={actionLoading}>
              Удалить поездку
            </button>
          </div>
        </form>
      </Section>

      <Section title="Брони по поездке" subtitle="Создание новой брони ведёт на отдельную страницу этой брони.">
        <div className="detail-grid">
          <form className="panel" onSubmit={handleCreateBooking}>
            <h3>Создать бронь</h3>
            <div className="form-grid">
              <Field label="Имя пассажира">
                <input className="input" value={bookingForm.passenger_name} onChange={(event) => setBookingForm((prev) => ({ ...prev, passenger_name: event.target.value }))} placeholder="Иван Иванов" />
              </Field>
              <Field label="Телефон">
                <input className="input" value={bookingForm.passenger_phone} onChange={(event) => setBookingForm((prev) => ({ ...prev, passenger_phone: event.target.value }))} placeholder="+7 999 123-45-67" />
              </Field>
              <Field label="Количество мест">
                <input className="input" type="number" min="1" value={bookingForm.seats_booked} onChange={(event) => setBookingForm((prev) => ({ ...prev, seats_booked: event.target.value }))} />
              </Field>
              <Field label="Комментарий">
                <textarea className="textarea" rows={4} value={bookingForm.comment} onChange={(event) => setBookingForm((prev) => ({ ...prev, comment: event.target.value }))} />
              </Field>
            </div>
            <button className="button" type="submit" disabled={actionLoading}>
              Создать бронь
            </button>
          </form>

          <div className="panel">
            <div className="section-head section-head--compact">
              <div>
                <h3>Список броней</h3>
                <p className="section-subtitle">Каждая бронь открывается на отдельной странице.</p>
              </div>
              <NavLink className="button button-secondary" to="/bookings/find">
                Найти бронь по ID
              </NavLink>
            </div>
            {!bookings.length ? <p className="muted">Для этой поездки броней пока нет.</p> : null}
            <div className="booking-list">
              {bookings.map((booking) => (
                <div key={booking.id} className="stack-lg">
                  <BookingCard booking={booking} />
                  <button className="button button-danger" type="button" onClick={() => handleDeleteBooking(booking.id)} disabled={actionLoading}>
                    Удалить бронь #{booking.id}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <datalist id="cities-list">
          {cities.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
      </Section>
    </>
  )
}
