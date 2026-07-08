import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { api } from '../api'
import { useAuth } from '../auth'
import {
  buildTripFiltersPayload,
  emptyFilters,
  hasActiveFilters,
  type FilterFormState,
} from '../forms'
import { EmptyState, Field, Section, TripCard } from '../components/ui'
import type { Trip } from '../types'
import { getErrorMessage } from '../utils'

export function TripsPage() {
  const { token } = useAuth()
  const [allTrips, setAllTrips] = useState<Trip[]>([])
  const [visibleTrips, setVisibleTrips] = useState<Trip[]>([])
  const [filters, setFilters] = useState<FilterFormState>(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState<FilterFormState>(emptyFilters)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          setAllTrips(result)
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

  useEffect(() => {
    if (!token) {
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    const request = hasActiveFilters(appliedFilters)
      ? api.trips.filter(buildTripFiltersPayload(appliedFilters), token)
      : api.trips.list(token)

    void request
      .then((result) => {
        if (!cancelled) {
          setVisibleTrips(result)
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
  }, [token, appliedFilters])

  const cities = useMemo(() => {
    const set = new Set<string>()
    for (const trip of allTrips) {
      set.add(trip.departure_city)
      set.add(trip.arrival_city)
    }
    return [...set].sort((left, right) => left.localeCompare(right, 'ru'))
  }, [allTrips])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAppliedFilters(filters)
  }

  function resetFilters() {
    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
  }

  return (
    <>
      <Section title="Поиск и список поездок" subtitle="Отдельная страница для `GET /trips` и `POST /trips/filter`.">
        <form className="panel" onSubmit={handleSubmit}>
          <div className="form-grid form-grid--two">
            <Field label="Город отправления">
              <input className="input" list="cities-list" value={filters.departure_city} onChange={(event) => setFilters((prev) => ({ ...prev, departure_city: event.target.value }))} placeholder="Москва" />
            </Field>
            <Field label="Город прибытия">
              <input className="input" list="cities-list" value={filters.arrival_city} onChange={(event) => setFilters((prev) => ({ ...prev, arrival_city: event.target.value }))} placeholder="Казань" />
            </Field>
            <Field label="Цена от">
              <input className="input" type="number" min="0" value={filters.price__gte} onChange={(event) => setFilters((prev) => ({ ...prev, price__gte: event.target.value }))} />
            </Field>
            <Field label="Цена до">
              <input className="input" type="number" min="0" value={filters.price__lte} onChange={(event) => setFilters((prev) => ({ ...prev, price__lte: event.target.value }))} />
            </Field>
            <Field label="Свободных мест от">
              <input className="input" type="number" min="0" value={filters.available_seats__gte} onChange={(event) => setFilters((prev) => ({ ...prev, available_seats__gte: event.target.value }))} />
            </Field>
            <Field label="Свободных мест до">
              <input className="input" type="number" min="0" value={filters.available_seats__lte} onChange={(event) => setFilters((prev) => ({ ...prev, available_seats__lte: event.target.value }))} />
            </Field>
          </div>
          <div className="card-actions card-actions--left">
            <button className="button" type="submit">Применить фильтры</button>
            <button className="button button-secondary" type="button" onClick={resetFilters}>Сбросить</button>
          </div>
        </form>

        <datalist id="cities-list">
          {cities.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
      </Section>

      <Section title="Результаты" subtitle="Откройте карточку, чтобы перейти на отдельную страницу конкретной поездки.">
        {error ? <EmptyState text={error} error /> : null}
        {loading ? <EmptyState text="Загружаем поездки..." /> : null}
        {!loading && !error && !visibleTrips.length ? <EmptyState text="Поездки не найдены." /> : null}
        {!loading && !error && visibleTrips.length ? (
          <div className="trip-grid">
            {visibleTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : null}
      </Section>
    </>
  )
}
