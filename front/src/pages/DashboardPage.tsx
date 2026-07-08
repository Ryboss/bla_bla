import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { api } from '../api'
import { EmptyState, Field, Section, StatCard } from '../components/ui'
import type { Trip } from '../types'
import { buildYandexRouteUrl, formatMoney, getErrorMessage } from '../utils'

export function DashboardPage() {
  const navigate = useNavigate()
  const { token, user, loading: userLoading, error: userError } = useAuth()
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [routeFrom, setRouteFrom] = useState('')
  const [routeTo, setRouteTo] = useState('')
  const [bookingId, setBookingId] = useState('')

  useEffect(() => {
    if (!token) {
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    void api.trips.list(token)
      .then((result) => {
        if (!cancelled) {
          setTrips(result)
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
  }, [token])

  const cities = useMemo(() => {
    const set = new Set<string>()
    for (const trip of trips) {
      set.add(trip.departure_city)
      set.add(trip.arrival_city)
    }
    return [...set].sort((left, right) => left.localeCompare(right, 'ru'))
  }, [trips])

  const cheapestTrip = useMemo(() => {
    if (!trips.length) return null
    return trips.reduce((minTrip, trip) => (trip.price < minTrip.price ? trip : minTrip), trips[0])
  }, [trips])

  const totalAvailableSeats = useMemo(() => trips.reduce((sum, trip) => sum + trip.available_seats, 0), [trips])

  const routeUrl = routeFrom.trim() && routeTo.trim() ? buildYandexRouteUrl(routeFrom.trim(), routeTo.trim()) : ''

  function handleBookingLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = Number(bookingId)
    if (!id) {
      return
    }
    navigate(`/bookings/${id}`)
  }

  return (
    <>
      <section className="hero section">
        <div className="hero-grid">
          <div className="hero-card hero-card--accent">
            <span className="eyebrow">Главная</span>
            <h1>Рабочее пространство сервиса поездок</h1>
            <p className="hero-text">
              Теперь интерфейс разбит на отдельные страницы: авторизация, список поездок, создание поездки,
              детали поездки, поиск и просмотр брони.
            </p>
            <div className="hero-actions">
              <NavLink className="button" to="/trips">Все поездки</NavLink>
              <NavLink className="button button-secondary" to="/trips/new">Создать поездку</NavLink>
            </div>
          </div>

          <div className="stats-grid">
            <StatCard label="Всего поездок" value={loading ? '...' : String(trips.length)} hint="По данным API" />
            <StatCard label="Городов" value={String(cities.length)} hint="Для быстрого выбора маршрута" />
            <StatCard label="Минимальная цена" value={cheapestTrip ? formatMoney(cheapestTrip.price) : '—'} hint={cheapestTrip ? `${cheapestTrip.departure_city} → ${cheapestTrip.arrival_city}` : 'Нет данных'} />
            <StatCard label="Свободных мест" value={String(totalAvailableSeats)} hint="Суммарно по всем поездкам" />
          </div>
        </div>
      </section>

      <Section title="Профиль" subtitle="Ответ от `/auth/me` после сохранения токена.">
        <div className="panel">
          {userLoading ? <p className="muted">Загружаем профиль...</p> : null}
          {userError ? <p className="error-text">{userError}</p> : null}
          {user ? <pre className="preformatted">{JSON.stringify(user, null, 2)}</pre> : <p className="muted">Профиль пока не загружен.</p>}
        </div>
      </Section>

      <Section title="Быстрые действия" subtitle="Переходы между отдельными страницами приложения.">
        {error ? <EmptyState text={error} error /> : null}
        <div className="tools-grid">
          <div className="panel">
            <h3>Построение маршрута</h3>
            <div className="form-grid">
              <Field label="Откуда">
                <input className="input" list="cities-list" value={routeFrom} onChange={(event) => setRouteFrom(event.target.value)} placeholder="Москва" />
              </Field>
              <Field label="Куда">
                <input className="input" list="cities-list" value={routeTo} onChange={(event) => setRouteTo(event.target.value)} placeholder="Казань" />
              </Field>
            </div>
            <div className="card-actions card-actions--left">
              <a className={`button ${routeUrl ? '' : 'button--disabled'}`} href={routeUrl || '#'} target="_blank" rel="noreferrer">
                Открыть в Яндекс Картах
              </a>
            </div>
          </div>

          <form className="panel" onSubmit={handleBookingLookup}>
            <h3>Быстрый поиск брони</h3>
            <Field label="ID брони">
              <input className="input" type="number" min="1" value={bookingId} onChange={(event) => setBookingId(event.target.value)} placeholder="12" />
            </Field>
            <div className="card-actions card-actions--left">
              <button className="button" type="submit">Открыть бронь</button>
              <NavLink className="button button-secondary" to="/bookings/find">Страница поиска</NavLink>
            </div>
          </form>
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
