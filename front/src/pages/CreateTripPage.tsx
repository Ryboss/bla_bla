import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../auth'
import { buildTripPayload, getDefaultTripForm, validateTripForm, type TripFormState } from '../forms'
import { Field, Section } from '../components/ui'
import type { Trip } from '../types'
import { getErrorMessage } from '../utils'

export function CreateTripPage() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [form, setForm] = useState<TripFormState>(getDefaultTripForm())
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      return
    }

    void api.trips.list(token)
      .then(setTrips)
      .catch((error: unknown) => setError(getErrorMessage(error)))
  }, [token])

  const cities = useMemo(() => {
    const set = new Set<string>()
    for (const trip of trips) {
      set.add(trip.departure_city)
      set.add(trip.arrival_city)
    }
    return [...set].sort((left, right) => left.localeCompare(right, 'ru'))
  }, [trips])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validateTripForm(form)
    if (validationError) {
      setError(validationError)
      return
    }

    if (!token) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const trip = await api.trips.create(buildTripPayload(form), token)
      navigate(`/trips/${trip.id}`, {
        replace: true,
        state: {
          notice: {
            kind: 'success',
            text: `Поездка #${trip.id} создана и открыта на отдельной странице.`,
          },
        },
      })
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Section title="Создание поездки" subtitle="После создания будет редирект на страницу новой поездки с её выходными данными.">
      <form className="panel" onSubmit={handleSubmit}>
        <div className="form-grid form-grid--three">
          <Field label="Город отправления">
            <input className="input" list="cities-list" value={form.departure_city} onChange={(event) => setForm((prev) => ({ ...prev, departure_city: event.target.value }))} placeholder="Москва" />
          </Field>
          <Field label="Город прибытия">
            <input className="input" list="cities-list" value={form.arrival_city} onChange={(event) => setForm((prev) => ({ ...prev, arrival_city: event.target.value }))} placeholder="Казань" />
          </Field>
          <Field label="Цена, ₽">
            <input className="input" type="number" min="1" step="1" value={form.price} onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))} />
          </Field>
          <Field label="Отправление">
            <input className="input" type="datetime-local" value={form.departure_time} onChange={(event) => setForm((prev) => ({ ...prev, departure_time: event.target.value }))} />
          </Field>
          <Field label="Прибытие">
            <input className="input" type="datetime-local" value={form.arrival_time} onChange={(event) => setForm((prev) => ({ ...prev, arrival_time: event.target.value }))} />
          </Field>
          <Field label="Свободные места">
            <input className="input" type="number" min="1" value={form.available_seats} onChange={(event) => setForm((prev) => ({ ...prev, available_seats: event.target.value }))} />
          </Field>
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        <div className="card-actions card-actions--left">
          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Создаём поездку...' : 'Создать поездку'}
          </button>
        </div>
      </form>

      <datalist id="cities-list">
        {cities.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>
    </Section>
  )
}
