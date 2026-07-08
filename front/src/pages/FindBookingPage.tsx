import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Field, Section } from '../components/ui'

export function FindBookingPage() {
  const navigate = useNavigate()
  const [bookingId, setBookingId] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const id = Number(bookingId)
    if (!id) {
      setError('Введите корректный ID брони.')
      return
    }

    navigate(`/bookings/${id}`)
  }

  return (
    <Section title="Поиск брони" subtitle="После ввода ID выполняется переход на отдельную страницу конкретной брони.">
      <form className="panel" onSubmit={handleSubmit}>
        <Field label="ID брони">
          <input className="input" type="number" min="1" value={bookingId} onChange={(event) => setBookingId(event.target.value)} placeholder="12" />
        </Field>
        {error ? <p className="error-text">{error}</p> : null}
        <button className="button" type="submit">Открыть страницу брони</button>
      </form>
    </Section>
  )
}
