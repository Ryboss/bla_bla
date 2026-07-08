import type { ReactNode } from "react";
import {
  NavLink,
  useLocation,
  type NavLinkRenderProps,
} from "react-router-dom";
import type { Booking, Trip } from "../types";
import type { Notice } from "../forms";
import { useAuth } from "../auth";
import {
  buildYandexRouteUrl,
  formatDateTime,
  formatDuration,
  formatMoney,
} from "../utils";

type LocationNoticeState = {
  notice?: Notice;
};

function navLinkClassName({ isActive }: NavLinkRenderProps) {
  return isActive ? "active" : "";
}

export function AppLayout(props: { children: ReactNode }) {
  const { token, logout } = useAuth();
  const location = useLocation();
  const notice = (location.state as LocationNoticeState | null)?.notice;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <NavLink className="brand" to={token ? "/dashboard" : "/login"}>
            BlaBla Front
          </NavLink>
          <p className="brand-subtitle">
            Поиск дешевых поездок
          </p>
        </div>

        <nav className="nav-links">
          {token ? (
            <>
              <NavLink to="/dashboard" className={navLinkClassName}>
                Главная
              </NavLink>
              <NavLink to="/trips" className={navLinkClassName}>
                Поездки
              </NavLink>
              <NavLink to="/trips/new" className={navLinkClassName}>
                Создать поездку
              </NavLink>
              <NavLink to="/bookings/find" className={navLinkClassName}>
                Бронирования
              </NavLink>
            </>
          ) : (
            <>
              <NavLink to="/login" className={navLinkClassName}>
                Вход
              </NavLink>
              <NavLink to="/register" className={navLinkClassName}>
                Регистрация
              </NavLink>
            </>
          )}
        </nav>

        <div className="header-status">
          <span className={`status-pill ${token ? "status-pill--ok" : ""}`}>
            {token ? "Авторизован" : "Гость"}
          </span>
          {token ? (
            <button
              className="button button-secondary"
              type="button"
              onClick={logout}
            >
              Выйти
            </button>
          ) : null}
        </div>
      </header>

      <main className="page">
        {notice ? (
          <div className={`notice notice--${notice.kind}`}>{notice.text}</div>
        ) : null}
        {props.children}
      </main>
    </div>
  );
}

export function Section(props: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="section">
      <div className="section-head">
        <div>
          <h2>{props.title}</h2>
          {props.subtitle ? (
            <p className="section-subtitle">{props.subtitle}</p>
          ) : null}
        </div>
      </div>
      {props.children}
    </section>
  );
}

export function Field(props: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span className="field-label">{props.label}</span>
      {props.children}
      {props.hint ? <span className="field-hint">{props.hint}</span> : null}
    </label>
  );
}

export function StatCard(props: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <article className="stat-card">
      <span className="stat-label">{props.label}</span>
      <strong className="stat-value">{props.value}</strong>
      {props.hint ? <span className="stat-hint">{props.hint}</span> : null}
    </article>
  );
}

export function EmptyState(props: { text: string; error?: boolean }) {
  return (
    <div className={`empty-state ${props.error ? "empty-state--error" : ""}`}>
      <p>{props.text}</p>
    </div>
  );
}

export function TripCard(props: { trip: Trip }) {
  const routeUrl = buildYandexRouteUrl(
    props.trip.departure_city,
    props.trip.arrival_city,
  );

  return (
    <article className="trip-card">
      <div className="trip-card__top">
        <div>
          <div className="trip-route">
            <strong>{props.trip.departure_city}</strong>
            <span className="route-arrow">→</span>
            <strong>{props.trip.arrival_city}</strong>
          </div>
          <p className="muted">
            {formatDateTime(props.trip.departure_time)} —{" "}
            {formatDateTime(props.trip.arrival_time)}
          </p>
        </div>
        <span className="tag">#{props.trip.id}</span>
      </div>

      <div className="trip-metrics">
        <div>
          <span className="metric-label">Цена</span>
          <strong>{formatMoney(props.trip.price)}</strong>
        </div>
        <div>
          <span className="metric-label">Длительность</span>
          <strong>
            {formatDuration(props.trip.departure_time, props.trip.arrival_time)}
          </strong>
        </div>
        <div>
          <span className="metric-label">Мест</span>
          <strong>{props.trip.available_seats}</strong>
        </div>
      </div>

      <div className="card-actions">
        <NavLink className="button" to={`/trips/${props.trip.id}`}>
          Открыть страницу поездки
        </NavLink>
        <a
          className="button button-secondary"
          href={routeUrl}
          target="_blank"
          rel="noreferrer"
        >
          Маршрут в Яндекс
        </a>
      </div>
    </article>
  );
}

export function BookingCard(props: { booking: Booking; tripLink?: boolean }) {
  return (
    <article className="booking-card">
      <div className="booking-card__top">
        <div>
          <strong>{props.booking.passenger_name}</strong>
          <p className="muted">{props.booking.passenger_phone}</p>
        </div>
        <span className="tag">Бронь #{props.booking.id}</span>
      </div>
      <div className="booking-meta">
        <span>Мест: {props.booking.seats_booked}</span>
        <span>Создано: {formatDateTime(props.booking.booked_at)}</span>
      </div>
      {props.booking.comment ? (
        <p className="booking-comment">{props.booking.comment}</p>
      ) : null}
      <div className="card-actions card-actions--left">
        <NavLink className="button" to={`/bookings/${props.booking.id}`}>
          Страница брони
        </NavLink>
        {props.tripLink ? (
          <NavLink
            className="button button-secondary"
            to={`/trips/${props.booking.trip_id}`}
          >
            К поездке #{props.booking.trip_id}
          </NavLink>
        ) : null}
      </div>
    </article>
  );
}
