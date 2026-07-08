import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { BookingCard, EmptyState, Section } from '../components/ui'
import type { Booking, Trip } from '../types'
import { buildYandexRouteUrl, formatDateTime, formatMoney, getErrorMessage } from '../utils'

export function BookingDetailsPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const params = useParams()
  const bookingId = Number(params.bookingId)

  const [booking, setBooking] = useState<Booking | null>(null)
  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!token || !bookingId) {
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void api.bookings.get(bookingId, token)
      .then(async (bookingResult) => {
        if (cancelled) {
          return
        }
        setBooking(bookingResult)
        const tripResult = await api.trips.get(bookingResult.trip_id, token)
        if (!cancelled) {
          setTrip(tripResult)
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setError(getErrorMessage(error))
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [token, bookingId])

  async function handleDelete() {
    if (!token || !booking || !window.confirm(`Удалить бронь #${booking.id}?`)) {
      return
    }

    setDeleting(true)
    try {
      await api.bookings.delete(booking.id, token)
      navigate(`/trips/${booking.trip_id}`, {
        replace: true,
        state: { notice: { kind: 'success', text: `Бронь #${booking.id} удалена.` } },
      })
    } catch (error) {
      setError(getErrorMessage(error))
      setDeleting(false)
    }
  }

  if (!bookingId) {
    return <EmptyState text="Некорректный ID брони." error />
  }

  if (loading) {
    return <EmptyState text={`Загружаем бронь #${bookingId}...`} />
  }

  if (error || !booking) {
    return <EmptyState text={error || 'Бронь не найдена.'} error />
  }

  return (
    <>
      <Section title={`Бронь #${booking.id}`} subtitle="Отдельная страница конкретной брони с переходом к связанной поездке.">
        <BookingCard booking={booking} tripLink />
        <div className="card-actions card-actions--left">
          <button className="button button-danger" type="button" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Удаляем...' : 'Удалить бронь'}
          </button>
          <NavLink className="button button-secondary" to="/bookings/find">
            Искать другую бронь
          </NavLink>
        </div>
      </Section>

      {trip ? (
        <Section title={`Связанная поездка #${trip.id}`} subtitle="Данные поездки, в рамках которой была создана эта бронь.">
          <article className="panel panel-highlight">
            <div className="trip-card__top">
              <div>
                <h3 className="panel-title">{trip.departure_city} → {trip.arrival_city}</h3>
                <p className="muted">Отправление: {formatDateTime(trip.departure_time)}</p>
              </div>
              <a className="button button-secondary" href={buildYandexRouteUrl(trip.departure_city, trip.arrival_city)} target="_blank" rel="noreferrer">
                Маршрут в Яндекс
              </a>
            </div>
            <div className="trip-metrics">
              <div>
                <span className="metric-label">Цена</span>
                <strong>{formatMoney(trip.price)}</strong>
              </div>
              <div>
                <span className="metric-label">Свободные места</span>
                <strong>{trip.available_seats}</strong>
              </div>
            </div>
            <div className="card-actions card-actions--left">
              <NavLink className="button" to={`/trips/${trip.id}`}>
                Открыть страницу поездки
              </NavLink>
            </div>
          </article>
        </Section>
      ) : null}
    </>
  )
}
