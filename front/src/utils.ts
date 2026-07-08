export function formatMoney(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function formatDuration(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  const totalMinutes = Math.max(0, Math.round(diff / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours && minutes) {
    return `${hours} ч ${minutes} мин`
  }

  if (hours) {
    return `${hours} ч`
  }

  return `${minutes} мин`
}

export function toDatetimeLocalValue(value: string): string {
  const date = new Date(value)
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function toIsoString(value: string): string {
  return new Date(value).toISOString()
}

export function buildYandexRouteUrl(from: string, to: string): string {
  const route = `${from}~${to}`
  return `https://yandex.ru/maps/?rtext=${encodeURIComponent(route)}&rtt=auto`
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return 'Произошла непредвиденная ошибка'
}

export function extractToken(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const token = Reflect.get(payload, 'access_token')
    ?? Reflect.get(payload, 'token')
    ?? Reflect.get(payload, 'accessToken')
    ?? Reflect.get(payload, 'jwt')

  return typeof token === 'string' ? token : null
}

export function stringifyPayload(payload: unknown): string {
  try {
    return JSON.stringify(payload, null, 2)
  } catch {
    return String(payload)
  }
}

export function parseExtraJson(raw: string): Record<string, unknown> {
  const trimmed = raw.trim()

  if (!trimmed) {
    return {}
  }

  const parsed = JSON.parse(trimmed) as unknown

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Дополнительные поля должны быть объектом JSON')
  }

  return parsed as Record<string, unknown>
}
