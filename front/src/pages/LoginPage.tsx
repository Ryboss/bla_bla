import { useState, type FormEvent } from 'react'
import { NavLink, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import { api } from '../api'
import { Field, Section } from '../components/ui'
import { extractToken, getErrorMessage, parseExtraJson, stringifyPayload } from '../utils'

export function LoginPage() {
  const { token, setToken } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [extra, setExtra] = useState('')
  const [manualToken, setManualToken] = useState('')
  const [authResponse, setAuthResponse] = useState<unknown>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)

    try {
      const result = await api.auth.login({
        email,
        password,
        ...parseExtraJson(extra),
      })
      setAuthResponse(result)

      const nextToken = extractToken(result)
      if (!nextToken) {
        setNotice('Ответ от auth-сервиса получен, но токен не найден автоматически. Вставьте его вручную ниже.')
        return
      }

      setToken(nextToken)
      navigate('/dashboard', {
        replace: true,
        state: { notice: { kind: 'success', text: 'Вход выполнен успешно.' } },
      })
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Section title="Авторизация" subtitle="После успешного входа будет редирект на главную страницу приложения.">
        <div className="auth-grid">
          <form className="panel" onSubmit={handleSubmit}>
            <h3>Войти</h3>
            <div className="form-grid">
              <Field label="Email">
                <input className="input" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="user@example.com" />
              </Field>
              <Field label="Пароль">
                <input className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" />
              </Field>
              <Field label="Доп. JSON поля" hint="Если внешний auth-сервис ожидает дополнительные поля, добавьте их объектом JSON.">
                <textarea className="textarea" rows={4} value={extra} onChange={(event) => setExtra(event.target.value)} placeholder='{"phone": "+7..."}' />
              </Field>
            </div>
            {notice ? <p className="muted">{notice}</p> : null}
            {error ? <p className="error-text">{error}</p> : null}
            <div className="card-actions card-actions--left">
              <button className="button" type="submit" disabled={loading}>
                {loading ? 'Выполняем вход...' : 'Войти'}
              </button>
              <NavLink className="button button-secondary" to="/register">
                Перейти к регистрации
              </NavLink>
            </div>
          </form>
        </div>
      </Section>

      <Section title="Последний ответ auth-сервиса" subtitle="Помогает понять, какие поля реально возвращает внешний auth backend.">
        <div className="panel">
          {authResponse ? <pre className="preformatted">{stringifyPayload(authResponse)}</pre> : <p className="muted">Пока ответов нет.</p>}
        </div>
      </Section>
    </>
  )
}
