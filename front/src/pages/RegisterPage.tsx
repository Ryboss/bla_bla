import { useState, type FormEvent } from 'react'
import { NavLink, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { api } from '../api'
import { Field, Section } from '../components/ui'
import { getErrorMessage, parseExtraJson } from '../utils'

export function RegisterPage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [fullname, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [extra, setExtra] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await api.auth.register({
        fullname,
        email,
        phone,
        password,
        ...parseExtraJson(extra),
      })

      navigate('/login', {
        replace: true,
        state: {
          notice: {
            kind: 'success',
            text: 'Регистрация прошла успешно. Теперь выполните вход.',
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
    <Section title="Регистрация" subtitle="После успешной регистрации будет редирект на страницу авторизации.">
      <div className="auth-grid">
        <form className="panel" onSubmit={handleSubmit}>
          <h3>Создать аккаунт</h3>
          <div className="form-grid">
            <Field label="ФИО">
              <input className="input" value={fullname} onChange={(event) => setFullName(event.target.value)} placeholder="amir" />
            </Field>
            <Field label="Почта">
              <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="user@example.com" />
            </Field>
            <Field label="Пароль">
              <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
            </Field>
            <Field label="Телефон">
              <input className="input" type="phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+7 (999) 999 99 99" />
            </Field>
            <Field label="Доп. JSON поля" hint="Можно передать произвольные дополнительные поля для внешнего auth-сервиса.">
              <textarea className="textarea" rows={5} value={extra} onChange={(event) => setExtra(event.target.value)} placeholder='{"name": "Amir"}' />
            </Field>
          </div>
          {error ? <p className="error-text">{error}</p> : null}
          <div className="card-actions card-actions--left">
            <button className="button" type="submit" disabled={loading}>
              {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
            </button>
            <NavLink className="button button-secondary" to="/login">
              Уже есть аккаунт
            </NavLink>
          </div>
        </form>
      </div>
    </Section>
  )
}
