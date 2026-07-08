import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { api } from "./api";
import type {
  AuthUser,
  Booking,
  BookingPayload,
  Trip,
  TripFiltersPayload,
  TripPayload,
} from "./types";
import {
  buildYandexRouteUrl,
  extractToken,
  formatDateTime,
  formatDuration,
  formatMoney,
  getErrorMessage,
  parseExtraJson,
  stringifyPayload,
  toDatetimeLocalValue,
  toIsoString,
} from "./utils";

type Notice = {
  kind: "success" | "error" | "info";
  text: string;
};

type FilterFormState = {
  departure_city: string;
  arrival_city: string;
  price__gte: string;
  price__lte: string;
  available_seats__gte: string;
  available_seats__lte: string;
  departure_time__gte: string;
  departure_time__lte: string;
  arrival_time__gte: string;
  arrival_time__lte: string;
};

type TripFormState = {
  departure_city: string;
  arrival_city: string;
  departure_time: string;
  arrival_time: string;
  price: string;
  available_seats: string;
};

type BookingFormState = {
  passenger_name: string;
  passenger_phone: string;
  seats_booked: string;
  comment: string;
};

const TOKEN_STORAGE_KEY = "blabla-front-token";

const emptyFilters: FilterFormState = {
  departure_city: "",
  arrival_city: "",
  price__gte: "",
  price__lte: "",
  available_seats__gte: "",
  available_seats__lte: "",
  departure_time__gte: "",
  departure_time__lte: "",
  arrival_time__gte: "",
  arrival_time__lte: "",
};

const emptyBookingForm: BookingFormState = {
  passenger_name: "",
  passenger_phone: "",
  seats_booked: "1",
  comment: "",
};

function toLocalInputValue(date: Date): string {
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return shifted.toISOString().slice(0, 16);
}

function getDefaultTripForm(): TripFormState {
  const departure = new Date(Date.now() + 60 * 60 * 1000);
  const arrival = new Date(Date.now() + 4 * 60 * 60 * 1000);

  return {
    departure_city: "",
    arrival_city: "",
    departure_time: toLocalInputValue(departure),
    arrival_time: toLocalInputValue(arrival),
    price: "",
    available_seats: "1",
  };
}

function buildTripFiltersPayload(filters: FilterFormState): TripFiltersPayload {
  const payload: TripFiltersPayload = {};

  if (filters.departure_city.trim())
    payload.departure_city = filters.departure_city.trim();
  if (filters.arrival_city.trim())
    payload.arrival_city = filters.arrival_city.trim();
  if (filters.price__gte.trim())
    payload.price__gte = Number(filters.price__gte);
  if (filters.price__lte.trim())
    payload.price__lte = Number(filters.price__lte);
  if (filters.available_seats__gte.trim())
    payload.available_seats__gte = Number(filters.available_seats__gte);
  if (filters.available_seats__lte.trim())
    payload.available_seats__lte = Number(filters.available_seats__lte);
  if (filters.departure_time__gte.trim())
    payload.departure_time__gte = toIsoString(filters.departure_time__gte);
  if (filters.departure_time__lte.trim())
    payload.departure_time__lte = toIsoString(filters.departure_time__lte);
  if (filters.arrival_time__gte.trim())
    payload.arrival_time__gte = toIsoString(filters.arrival_time__gte);
  if (filters.arrival_time__lte.trim())
    payload.arrival_time__lte = toIsoString(filters.arrival_time__lte);

  return payload;
}

function hasActiveFilters(filters: FilterFormState): boolean {
  return Object.keys(buildTripFiltersPayload(filters)).length > 0;
}

function buildTripPayload(form: TripFormState): TripPayload {
  return {
    departure_city: form.departure_city.trim(),
    arrival_city: form.arrival_city.trim(),
    departure_time: toIsoString(form.departure_time),
    arrival_time: toIsoString(form.arrival_time),
    price: Number(form.price),
    available_seats: Number(form.available_seats),
  };
}

function buildBookingPayload(form: BookingFormState): BookingPayload {
  const payload: BookingPayload = {
    passenger_name: form.passenger_name.trim(),
    passenger_phone: form.passenger_phone.trim(),
    seats_booked: Number(form.seats_booked),
  };

  if (form.comment.trim()) {
    payload.comment = form.comment.trim();
  }

  return payload;
}

function validateTripForm(form: TripFormState): string | null {
  if (!form.departure_city.trim() || !form.arrival_city.trim()) {
    return "Укажите города отправления и прибытия";
  }

  if (!form.departure_time || !form.arrival_time) {
    return "Укажите время отправления и прибытия";
  }

  if (new Date(form.arrival_time) <= new Date(form.departure_time)) {
    return "Время прибытия должно быть позже времени отправления";
  }

  if (Number(form.price) <= 0) {
    return "Цена должна быть больше нуля";
  }

  if (Number(form.available_seats) <= 0) {
    return "Количество мест должно быть больше нуля";
  }

  return null;
}

function validateBookingForm(form: BookingFormState): string | null {
  if (!form.passenger_name.trim()) {
    return "Укажите имя пассажира";
  }

  if (!form.passenger_phone.trim()) {
    return "Укажите телефон пассажира";
  }

  if (Number(form.seats_booked) <= 0) {
    return "Количество мест должно быть больше нуля";
  }

  return null;
}

function Section(props: {
  id?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="section" id={props.id}>
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

function StatCard(props: { label: string; value: string; hint?: string }) {
  return (
    <article className="stat-card">
      <span className="stat-label">{props.label}</span>
      <strong className="stat-value">{props.value}</strong>
      {props.hint ? <span className="stat-hint">{props.hint}</span> : null}
    </article>
  );
}

function Field(props: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span className="field-label">{props.label}</span>
      {props.children}
      {props.hint ? <span className="field-hint">{props.hint}</span> : null}
    </label>
  );
}

function TripCard(props: {
  trip: Trip;
  active: boolean;
  onSelect: () => void;
}) {
  const routeUrl = buildYandexRouteUrl(
    props.trip.departure_city,
    props.trip.arrival_city,
  );

  return (
    <article className={`trip-card ${props.active ? "trip-card--active" : ""}`}>
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
        <button className="button" type="button" onClick={props.onSelect}>
          {props.active ? "Открыто" : "Подробнее и бронирование"}
        </button>
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

function BookingCard(props: {
  booking: Booking;
  onDelete: () => void;
  deleting: boolean;
}) {
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
      <button
        className="button button-danger"
        type="button"
        onClick={props.onDelete}
        disabled={props.deleting}
      >
        {props.deleting ? "Удаление..." : "Удалить бронь"}
      </button>
    </article>
  );
}

function App() {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY),
  );
  const [notice, setNotice] = useState<Notice | null>(null);
  const [authResponse, setAuthResponse] = useState<unknown>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const detailRef = useRef<HTMLDivElement | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginExtra, setLoginExtra] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerFullName, setRegisterFullName] = useState("");
  const [registerPhone, setRegisterPhone] = useState("");
  const [registerExtra, setRegisterExtra] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [currentUserLoading, setCurrentUserLoading] = useState(false);
  const [currentUserError, setCurrentUserError] = useState<string | null>(null);

  const [filterDraft, setFilterDraft] = useState<FilterFormState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterFormState>(emptyFilters);

  const [routeFrom, setRouteFrom] = useState("");
  const [routeTo, setRouteTo] = useState("");

  const [allTrips, setAllTrips] = useState<Trip[]>([]);
  const [allTripsLoading, setAllTripsLoading] = useState(false);
  const [allTripsError, setAllTripsError] = useState<string | null>(null);

  const [visibleTrips, setVisibleTrips] = useState<Trip[]>([]);
  const [visibleTripsLoading, setVisibleTripsLoading] = useState(false);
  const [visibleTripsError, setVisibleTripsError] = useState<string | null>(
    null,
  );

  const [createTripForm, setCreateTripForm] =
    useState<TripFormState>(getDefaultTripForm());
  const [createTripLoading, setCreateTripLoading] = useState(false);

  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedTripLoading, setSelectedTripLoading] = useState(false);
  const [selectedTripError, setSelectedTripError] = useState<string | null>(
    null,
  );
  const [editTripForm, setEditTripForm] =
    useState<TripFormState>(getDefaultTripForm());
  const [updateTripLoading, setUpdateTripLoading] = useState(false);
  const [deleteTripLoading, setDeleteTripLoading] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [bookingForm, setBookingForm] =
    useState<BookingFormState>(emptyBookingForm);
  const [createBookingLoading, setCreateBookingLoading] = useState(false);
  const [deletingBookingId, setDeletingBookingId] = useState<number | null>(
    null,
  );

  const [bookingLookupInput, setBookingLookupInput] = useState("");
  const [bookingLookupLoading, setBookingLookupLoading] = useState(false);
  const [bookingLookupError, setBookingLookupError] = useState<string | null>(
    null,
  );
  const [bookingLookup, setBookingLookup] = useState<Booking | null>(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      setManualToken(token);
      return;
    }

    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setCurrentUser(null);
    setSelectedTripId(null);
    setSelectedTrip(null);
    setBookings([]);
  }, [token]);

  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      setCurrentUserError(null);
      return;
    }

    let cancelled = false;
    setCurrentUserLoading(true);
    setCurrentUserError(null);

    void api.auth
      .me(token)
      .then((result) => {
        if (!cancelled) {
          setCurrentUser(result);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setCurrentUser(null);
          setCurrentUserError(getErrorMessage(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setCurrentUserLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      setAllTrips([]);
      setAllTripsError(null);
      setAllTripsLoading(false);
      return;
    }

    let cancelled = false;
    setAllTripsLoading(true);
    setAllTripsError(null);

    void api.trips
      .list(token)
      .then((result) => {
        if (!cancelled) {
          setAllTrips(result);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setAllTrips([]);
          setAllTripsError(getErrorMessage(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAllTripsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, dataVersion]);

  useEffect(() => {
    if (!token) {
      setVisibleTrips([]);
      setVisibleTripsError(null);
      setVisibleTripsLoading(false);
      return;
    }

    let cancelled = false;
    setVisibleTripsLoading(true);
    setVisibleTripsError(null);

    const request = hasActiveFilters(appliedFilters)
      ? api.trips.filter(buildTripFiltersPayload(appliedFilters), token)
      : api.trips.list(token);

    void request
      .then((result) => {
        if (!cancelled) {
          setVisibleTrips(result);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setVisibleTrips([]);
          setVisibleTripsError(getErrorMessage(error));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setVisibleTripsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, appliedFilters, dataVersion]);

  useEffect(() => {
    if (!token || selectedTripId === null) {
      setSelectedTrip(null);
      setSelectedTripError(null);
      setSelectedTripLoading(false);
      setBookings([]);
      setBookingsError(null);
      setBookingsLoading(false);
      return;
    }

    let cancelled = false;
    setSelectedTripLoading(true);
    setSelectedTripError(null);
    setBookingsLoading(true);
    setBookingsError(null);

    void Promise.all([
      api.trips.get(selectedTripId, token),
      api.bookings.listForTrip(selectedTripId, token),
    ])
      .then(([tripResult, bookingsResult]) => {
        if (!cancelled) {
          setSelectedTrip(tripResult);
          setBookings(bookingsResult);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = getErrorMessage(error);
          setSelectedTrip(null);
          setBookings([]);
          setSelectedTripError(message);
          setBookingsError(message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSelectedTripLoading(false);
          setBookingsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, selectedTripId, dataVersion]);

  useEffect(() => {
    if (!selectedTrip) {
      return;
    }

    setEditTripForm({
      departure_city: selectedTrip.departure_city,
      arrival_city: selectedTrip.arrival_city,
      departure_time: toDatetimeLocalValue(selectedTrip.departure_time),
      arrival_time: toDatetimeLocalValue(selectedTrip.arrival_time),
      price: String(selectedTrip.price),
      available_seats: String(selectedTrip.available_seats),
    });
  }, [selectedTrip]);

  const cities = useMemo(() => {
    const items = new Set<string>();

    for (const trip of allTrips) {
      items.add(trip.departure_city);
      items.add(trip.arrival_city);
    }

    return [...items].sort((left, right) => left.localeCompare(right, "ru"));
  }, [allTrips]);

  const routeUrl =
    routeFrom.trim() && routeTo.trim()
      ? buildYandexRouteUrl(routeFrom.trim(), routeTo.trim())
      : "";

  const totalAvailableSeats = useMemo(
    () => allTrips.reduce((sum, trip) => sum + trip.available_seats, 0),
    [allTrips],
  );

  const cheapestTrip = useMemo(() => {
    if (!allTrips.length) {
      return null;
    }

    return allTrips.reduce(
      (minTrip, trip) => (trip.price < minTrip.price ? trip : minTrip),
      allTrips[0],
    );
  }, [allTrips]);

  function refreshData() {
    setDataVersion((value) => value + 1);
  }

  function handleSelectTrip(tripId: number) {
    setSelectedTripId(tripId);
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setAuthLoading(true);

    try {
      const extraFields = parseExtraJson(loginExtra);
      const result = await api.auth.login({
        email: loginEmail,
        password: loginPassword,
        ...extraFields,
      });

      setAuthResponse(result);

      const nextToken = extractToken(result);
      if (nextToken) {
        setToken(nextToken);
        setNotice({ kind: "success", text: "Вход выполнен, токен сохранён." });
      } else {
        setNotice({
          kind: "info",
          text: "Ответ от auth-сервиса получен, но токен не найден автоматически. Его можно вставить вручную ниже.",
        });
      }
    } catch (error) {
      setNotice({ kind: "error", text: getErrorMessage(error) });
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setAuthLoading(true);

    try {
      const extraFields = parseExtraJson(registerExtra);
      const result = await api.auth.register({
        email: registerEmail,
        password: registerPassword,
        fullname: registerFullName,
        phone: registerPhone,
        ...extraFields,
      });

      setAuthResponse(result);

      const nextToken = extractToken(result);
      if (nextToken) {
        setToken(nextToken);
        setNotice({
          kind: "success",
          text: "Регистрация успешна, токен сохранён.",
        });
      } else {
        setNotice({
          kind: "success",
          text: "Регистрация выполнена. Если сервис не вернул токен автоматически, вставьте его вручную.",
        });
      }
    } catch (error) {
      setNotice({ kind: "error", text: getErrorMessage(error) });
    } finally {
      setAuthLoading(false);
    }
  }

  function handleApplyManualToken(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!manualToken.trim()) {
      setNotice({
        kind: "error",
        text: "Вставьте JWT токен перед сохранением.",
      });
      return;
    }

    setToken(manualToken.trim());
    setNotice({ kind: "success", text: "Токен сохранён локально в браузере." });
  }

  function handleLogout() {
    setToken(null);
    setManualToken("");
    setAuthResponse(null);
    setNotice({ kind: "info", text: "Токен удалён из локального хранилища." });
  }

  function handleApplyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedFilters(filterDraft);
    setNotice({
      kind: "info",
      text: hasActiveFilters(filterDraft)
        ? "Фильтры применены."
        : "Фильтры сброшены, показаны все поездки.",
    });
  }

  function handleResetFilters() {
    setFilterDraft(emptyFilters);
    setAppliedFilters(emptyFilters);
    setNotice({ kind: "info", text: "Фильтры очищены." });
  }

  async function handleCreateTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setNotice({
        kind: "error",
        text: "Сначала авторизуйтесь, чтобы создавать поездки.",
      });
      return;
    }

    const validationError = validateTripForm(createTripForm);
    if (validationError) {
      setNotice({ kind: "error", text: validationError });
      return;
    }

    setCreateTripLoading(true);
    setNotice(null);

    try {
      const trip = await api.trips.create(
        buildTripPayload(createTripForm),
        token,
      );
      setCreateTripForm(getDefaultTripForm());
      refreshData();
      handleSelectTrip(trip.id);
      setNotice({ kind: "success", text: `Поездка #${trip.id} создана.` });
    } catch (error) {
      setNotice({ kind: "error", text: getErrorMessage(error) });
    } finally {
      setCreateTripLoading(false);
    }
  }

  async function handleUpdateTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !selectedTripId) {
      return;
    }

    const validationError = validateTripForm(editTripForm);
    if (validationError) {
      setNotice({ kind: "error", text: validationError });
      return;
    }

    setUpdateTripLoading(true);
    setNotice(null);

    try {
      await api.trips.update(
        selectedTripId,
        buildTripPayload(editTripForm),
        token,
      );
      refreshData();
      setNotice({
        kind: "success",
        text: `Поездка #${selectedTripId} обновлена.`,
      });
    } catch (error) {
      setNotice({ kind: "error", text: getErrorMessage(error) });
    } finally {
      setUpdateTripLoading(false);
    }
  }

  async function handleDeleteTrip() {
    if (!token || !selectedTripId) {
      return;
    }

    const confirmed = window.confirm(`Удалить поездку #${selectedTripId}?`);
    if (!confirmed) {
      return;
    }

    setDeleteTripLoading(true);
    setNotice(null);

    try {
      await api.trips.delete(selectedTripId, token);
      setSelectedTripId(null);
      setSelectedTrip(null);
      setBookings([]);
      refreshData();
      setNotice({
        kind: "success",
        text: `Поездка #${selectedTripId} удалена.`,
      });
    } catch (error) {
      setNotice({ kind: "error", text: getErrorMessage(error) });
    } finally {
      setDeleteTripLoading(false);
    }
  }

  async function handleCreateBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !selectedTripId) {
      setNotice({ kind: "error", text: "Сначала выберите поездку." });
      return;
    }

    const validationError = validateBookingForm(bookingForm);
    if (validationError) {
      setNotice({ kind: "error", text: validationError });
      return;
    }

    setCreateBookingLoading(true);
    setNotice(null);

    try {
      const booking = await api.bookings.create(
        selectedTripId,
        buildBookingPayload(bookingForm),
        token,
      );
      setBookingForm(emptyBookingForm);
      setBookingLookup(booking);
      setBookingLookupError(null);
      setBookingLookupInput(String(booking.id));
      refreshData();
      setNotice({
        kind: "success",
        text: `Бронь #${booking.id} успешно создана.`,
      });
    } catch (error) {
      setNotice({ kind: "error", text: getErrorMessage(error) });
    } finally {
      setCreateBookingLoading(false);
    }
  }

  async function handleDeleteBooking(bookingId: number) {
    if (!token) {
      return;
    }

    const confirmed = window.confirm(`Удалить бронь #${bookingId}?`);
    if (!confirmed) {
      return;
    }

    setDeletingBookingId(bookingId);
    setNotice(null);

    try {
      await api.bookings.delete(bookingId, token);
      if (bookingLookup?.id === bookingId) {
        setBookingLookup(null);
      }
      refreshData();
      setNotice({ kind: "success", text: `Бронь #${bookingId} удалена.` });
    } catch (error) {
      setNotice({ kind: "error", text: getErrorMessage(error) });
    } finally {
      setDeletingBookingId(null);
    }
  }

  async function handleBookingLookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setNotice({
        kind: "error",
        text: "Сначала авторизуйтесь, чтобы искать брони.",
      });
      return;
    }

    const bookingId = Number(bookingLookupInput);
    if (!bookingId) {
      setBookingLookup(null);
      setBookingLookupError("Введите корректный ID брони");
      return;
    }

    setBookingLookupLoading(true);
    setBookingLookupError(null);

    try {
      const result = await api.bookings.get(bookingId, token);
      setBookingLookup(result);
      setSelectedTripId(result.trip_id);
      requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch (error) {
      setBookingLookup(null);
      setBookingLookupError(getErrorMessage(error));
    } finally {
      setBookingLookupLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <a className="brand" href="#overview">
            BlaBla Front
          </a>
          <p className="brand-subtitle">
            React + TypeScript интерфейс для сервиса поездок, броней и
            маршрутов.
          </p>
        </div>

        <nav className="nav-links">
          <a href="#auth">Auth</a>
          <a href="#search">Поиск</a>
          <a href="#create">Создать поездку</a>
          <a href="#trips">Поездки</a>
          <a href="#details">Детали</a>
        </nav>

        <div className="header-status">
          <span className={`status-pill ${token ? "status-pill--ok" : ""}`}>
            {token ? "Авторизован" : "Нужен токен"}
          </span>
          {token ? (
            <button
              className="button button-secondary"
              type="button"
              onClick={handleLogout}
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

        <section className="hero section" id="overview">
          <div className="hero-grid">
            <div className="hero-card hero-card--accent">
              <span className="eyebrow">Сервис поездок</span>
              <h1>
                Удобный фронтенд для поездок, бронирований и построения
                маршрутов
              </h1>
              <p className="hero-text">
                Интерфейс опирается на существующий FastAPI-бэкенд: список и
                фильтрация поездок, создание/редактирование/удаление,
                бронирование мест, поиск брони по ID и построение маршрута через
                Яндекс Карты.
              </p>
              <div className="hero-actions">
                <a className="button" href="#trips">
                  Смотреть поездки
                </a>
                <a className="button button-secondary" href="#auth">
                  Подключить токен
                </a>
              </div>
            </div>

            <div className="stats-grid">
              <StatCard
                label="Всего поездок"
                value={token ? String(allTrips.length) : "—"}
                hint={allTripsLoading ? "Обновление..." : "По данным API"}
              />
              <StatCard
                label="Городов в системе"
                value={token ? String(cities.length) : "—"}
                hint="Для быстрого выбора"
              />
              <StatCard
                label="Минимальная цена"
                value={
                  token && cheapestTrip ? formatMoney(cheapestTrip.price) : "—"
                }
                hint={
                  cheapestTrip
                    ? `${cheapestTrip.departure_city} → ${cheapestTrip.arrival_city}`
                    : "Нет данных"
                }
              />
              <StatCard
                label="Свободных мест"
                value={token ? String(totalAvailableSeats) : "—"}
                hint="Суммарно по всем поездкам"
              />
            </div>
          </div>
        </section>

        <Section
          id="auth"
          title="Авторизация и профиль"
          subtitle="Все поездки и бронирования защищены bearer-токеном. Можно войти, зарегистрироваться или вставить JWT вручную."
        >
          <div className="auth-grid">
            <form className="panel" onSubmit={handleLoginSubmit}>
              <h3>Вход</h3>
              <div className="form-grid">
                <Field label="Email">
                  <input
                    className="input"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    placeholder="user@example.com"
                    type="email"
                  />
                </Field>
                <Field label="Пароль">
                  <input
                    className="input"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    placeholder="••••••••"
                    type="password"
                  />
                </Field>
                <Field
                  label="Доп. JSON поля"
                  hint="Если внешний auth-сервис ждёт дополнительные поля, добавьте их здесь как JSON-объект."
                >
                  <textarea
                    className="textarea"
                    value={loginExtra}
                    onChange={(event) => setLoginExtra(event.target.value)}
                    placeholder='{"phone": "+7..."}'
                    rows={4}
                  />
                </Field>
              </div>
              <button className="button" type="submit" disabled={authLoading}>
                {authLoading ? "Выполняем вход..." : "Войти"}
              </button>
            </form>

            <form className="panel" onSubmit={handleRegisterSubmit}>
              <h3>Регистрация</h3>
              <div className="form-grid">
                <Field label="fullname">
                  <input
                    className="input"
                    value={registerFullName}
                    onChange={(event) =>
                      setRegisterFullName(event.target.value)
                    }
                    placeholder="amir"
                  />
                </Field>
                <Field label="email">
                  <input
                    className="input"
                    value={registerEmail}
                    onChange={(event) => setRegisterEmail(event.target.value)}
                    placeholder="user@example.com"
                    type="email"
                  />
                </Field>
                <Field label="phone">
                  <input
                    className="input"
                    value={registerPhone}
                    onChange={(event) => setRegisterPhone(event.target.value)}
                    placeholder="+7 (999) 999 99 99"
                    type="phone"
                  />
                </Field>
                <Field label="Пароль">
                  <input
                    className="input"
                    value={registerPassword}
                    onChange={(event) =>
                      setRegisterPassword(event.target.value)
                    }
                    placeholder="••••••••"
                    type="password"
                  />
                </Field>
                <Field
                  label="Доп. JSON поля"
                  hint="Можно передать дополнительные поля для внешнего auth-сервиса."
                >
                  <textarea
                    className="textarea"
                    value={registerExtra}
                    onChange={(event) => setRegisterExtra(event.target.value)}
                    placeholder='{"name": "Amir"}'
                    rows={4}
                  />
                </Field>
              </div>
              <button className="button" type="submit" disabled={authLoading}>
                {authLoading ? "Создаём аккаунт..." : "Зарегистрироваться"}
              </button>
            </form>

            <form className="panel" onSubmit={handleApplyManualToken}>
              <h3>JWT вручную</h3>
              <Field
                label="Bearer token"
                hint="Токен сохраняется только в localStorage браузера и нужен для доступа к защищённым эндпоинтам."
              >
                <textarea
                  className="textarea"
                  value={manualToken}
                  onChange={(event) => setManualToken(event.target.value)}
                  rows={8}
                  placeholder="eyJhbGciOi..."
                />
              </Field>
              <div className="stack-sm">
                <button className="button" type="submit">
                  Сохранить токен
                </button>
                {token ? (
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={handleLogout}
                  >
                    Очистить токен
                  </button>
                ) : null}
              </div>
            </form>
          </div>

          <div className="info-grid">
            <div className="panel">
              <h3>Текущий пользователь</h3>
              {currentUserLoading ? (
                <p className="muted">Загружаем профиль...</p>
              ) : null}
              {currentUserError ? (
                <p className="error-text">{currentUserError}</p>
              ) : null}
              {currentUser ? (
                <pre className="preformatted">
                  {stringifyPayload(currentUser)}
                </pre>
              ) : (
                <p className="muted">
                  После сохранения токена здесь появится ответ `/auth/me`.
                </p>
              )}
            </div>
            <div className="panel">
              <h3>Последний ответ auth-сервиса</h3>
              {authResponse ? (
                <pre className="preformatted">
                  {stringifyPayload(authResponse)}
                </pre>
              ) : (
                <p className="muted">
                  Здесь будет виден ответ на логин или регистрацию.
                </p>
              )}
            </div>
          </div>
        </Section>

        <Section
          id="search"
          title="Поиск поездок, города и маршрут"
          subtitle="Можно фильтровать поездки по цене, датам и местам, а также строить маршрут между городами через Яндекс Карты."
        >
          <div className="tools-grid">
            <form className="panel" onSubmit={handleApplyFilters}>
              <h3>Фильтры поездок</h3>
              <div className="form-grid form-grid--two">
                <Field label="Город отправления">
                  <input
                    className="input"
                    list="cities-list"
                    value={filterDraft.departure_city}
                    onChange={(event) =>
                      setFilterDraft((prev) => ({
                        ...prev,
                        departure_city: event.target.value,
                      }))
                    }
                    placeholder="Москва"
                  />
                </Field>
                <Field label="Город прибытия">
                  <input
                    className="input"
                    list="cities-list"
                    value={filterDraft.arrival_city}
                    onChange={(event) =>
                      setFilterDraft((prev) => ({
                        ...prev,
                        arrival_city: event.target.value,
                      }))
                    }
                    placeholder="Казань"
                  />
                </Field>
                <Field label="Цена от">
                  <input
                    className="input"
                    value={filterDraft.price__gte}
                    onChange={(event) =>
                      setFilterDraft((prev) => ({
                        ...prev,
                        price__gte: event.target.value,
                      }))
                    }
                    placeholder="1500"
                    type="number"
                    min="0"
                  />
                </Field>
                <Field label="Цена до">
                  <input
                    className="input"
                    value={filterDraft.price__lte}
                    onChange={(event) =>
                      setFilterDraft((prev) => ({
                        ...prev,
                        price__lte: event.target.value,
                      }))
                    }
                    placeholder="5000"
                    type="number"
                    min="0"
                  />
                </Field>
                <Field label="Свободных мест от">
                  <input
                    className="input"
                    value={filterDraft.available_seats__gte}
                    onChange={(event) =>
                      setFilterDraft((prev) => ({
                        ...prev,
                        available_seats__gte: event.target.value,
                      }))
                    }
                    placeholder="1"
                    type="number"
                    min="0"
                  />
                </Field>
                <Field label="Свободных мест до">
                  <input
                    className="input"
                    value={filterDraft.available_seats__lte}
                    onChange={(event) =>
                      setFilterDraft((prev) => ({
                        ...prev,
                        available_seats__lte: event.target.value,
                      }))
                    }
                    placeholder="6"
                    type="number"
                    min="0"
                  />
                </Field>
                <Field label="Отправление с">
                  <input
                    className="input"
                    value={filterDraft.departure_time__gte}
                    onChange={(event) =>
                      setFilterDraft((prev) => ({
                        ...prev,
                        departure_time__gte: event.target.value,
                      }))
                    }
                    type="datetime-local"
                  />
                </Field>
                <Field label="Отправление до">
                  <input
                    className="input"
                    value={filterDraft.departure_time__lte}
                    onChange={(event) =>
                      setFilterDraft((prev) => ({
                        ...prev,
                        departure_time__lte: event.target.value,
                      }))
                    }
                    type="datetime-local"
                  />
                </Field>
              </div>
              <div className="card-actions card-actions--left">
                <button className="button" type="submit">
                  Применить фильтры
                </button>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={handleResetFilters}
                >
                  Сбросить
                </button>
              </div>
            </form>

            <div className="panel">
              <h3>Построение маршрута</h3>
              <div className="form-grid">
                <Field label="Откуда">
                  <input
                    className="input"
                    list="cities-list"
                    value={routeFrom}
                    onChange={(event) => setRouteFrom(event.target.value)}
                    placeholder="Москва"
                  />
                </Field>
                <Field label="Куда">
                  <input
                    className="input"
                    list="cities-list"
                    value={routeTo}
                    onChange={(event) => setRouteTo(event.target.value)}
                    placeholder="Санкт-Петербург"
                  />
                </Field>
                <p className="muted">
                  Маршрут открывается в Яндекс Картах. Такой вариант не требует
                  API-ключа и работает как быстрая интеграция.
                </p>
              </div>
              <div className="card-actions card-actions--left">
                <a
                  className={`button ${routeUrl ? "" : "button--disabled"}`}
                  href={routeUrl || "#"}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!routeUrl}
                >
                  Открыть маршрут
                </a>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => {
                    setRouteFrom("");
                    setRouteTo("");
                  }}
                >
                  Очистить
                </button>
              </div>
            </div>

            <form className="panel" onSubmit={handleBookingLookup}>
              <h3>Поиск брони по ID</h3>
              <Field
                label="ID брони"
                hint="Использует эндпоинт `/bookings/{id}` и, если бронь найдена, автоматически открывает связанную поездку ниже."
              >
                <input
                  className="input"
                  value={bookingLookupInput}
                  onChange={(event) =>
                    setBookingLookupInput(event.target.value)
                  }
                  placeholder="12"
                  type="number"
                  min="1"
                />
              </Field>
              <button
                className="button"
                type="submit"
                disabled={bookingLookupLoading}
              >
                {bookingLookupLoading ? "Ищем бронь..." : "Найти бронь"}
              </button>
              {bookingLookupError ? (
                <p className="error-text">{bookingLookupError}</p>
              ) : null}
              {bookingLookup ? (
                <div className="lookup-result">
                  <strong>Бронь #{bookingLookup.id}</strong>
                  <span>{bookingLookup.passenger_name}</span>
                  <span>Мест: {bookingLookup.seats_booked}</span>
                  <span>Поездка: #{bookingLookup.trip_id}</span>
                </div>
              ) : null}
            </form>
          </div>

          <datalist id="cities-list">
            {cities.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>
        </Section>

        <Section
          id="create"
          title="Создание новой поездки"
          subtitle="Полный CRUD по поездкам: создание на этой форме, редактирование и удаление — в блоке деталей ниже."
        >
          {!token ? (
            <div className="empty-state">
              <p>
                Для создания поездок сначала выполните вход или вставьте JWT
                токен.
              </p>
            </div>
          ) : (
            <form className="panel" onSubmit={handleCreateTrip}>
              <div className="form-grid form-grid--three">
                <Field label="Город отправления">
                  <input
                    className="input"
                    list="cities-list"
                    value={createTripForm.departure_city}
                    onChange={(event) =>
                      setCreateTripForm((prev) => ({
                        ...prev,
                        departure_city: event.target.value,
                      }))
                    }
                    placeholder="Москва"
                  />
                </Field>
                <Field label="Город прибытия">
                  <input
                    className="input"
                    list="cities-list"
                    value={createTripForm.arrival_city}
                    onChange={(event) =>
                      setCreateTripForm((prev) => ({
                        ...prev,
                        arrival_city: event.target.value,
                      }))
                    }
                    placeholder="Казань"
                  />
                </Field>
                <Field label="Цена, ₽">
                  <input
                    className="input"
                    value={createTripForm.price}
                    onChange={(event) =>
                      setCreateTripForm((prev) => ({
                        ...prev,
                        price: event.target.value,
                      }))
                    }
                    placeholder="2500"
                    type="number"
                    min="1"
                    step="1"
                  />
                </Field>
                <Field label="Отправление">
                  <input
                    className="input"
                    value={createTripForm.departure_time}
                    onChange={(event) =>
                      setCreateTripForm((prev) => ({
                        ...prev,
                        departure_time: event.target.value,
                      }))
                    }
                    type="datetime-local"
                  />
                </Field>
                <Field label="Прибытие">
                  <input
                    className="input"
                    value={createTripForm.arrival_time}
                    onChange={(event) =>
                      setCreateTripForm((prev) => ({
                        ...prev,
                        arrival_time: event.target.value,
                      }))
                    }
                    type="datetime-local"
                  />
                </Field>
                <Field label="Свободные места">
                  <input
                    className="input"
                    value={createTripForm.available_seats}
                    onChange={(event) =>
                      setCreateTripForm((prev) => ({
                        ...prev,
                        available_seats: event.target.value,
                      }))
                    }
                    placeholder="3"
                    type="number"
                    min="1"
                  />
                </Field>
              </div>
              <button
                className="button"
                type="submit"
                disabled={createTripLoading}
              >
                {createTripLoading ? "Создаём поездку..." : "Создать поездку"}
              </button>
            </form>
          )}
        </Section>

        <Section
          id="trips"
          title="Список поездок"
          subtitle="Используются `GET /trips` и `POST /trips/filter`. Выберите карточку, чтобы открыть управление поездкой и её бронированиями."
        >
          {!token ? (
            <div className="empty-state">
              <p>
                Бэкенд требует авторизацию. Сначала вставьте bearer токен в
                блоке выше.
              </p>
            </div>
          ) : allTripsError || visibleTripsError ? (
            <div className="empty-state empty-state--error">
              <p>{allTripsError || visibleTripsError}</p>
            </div>
          ) : visibleTripsLoading ? (
            <div className="empty-state">
              <p>Загружаем список поездок...</p>
            </div>
          ) : visibleTrips.length ? (
            <div className="trip-grid">
              {visibleTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  active={trip.id === selectedTripId}
                  onSelect={() => handleSelectTrip(trip.id)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>По текущим фильтрам поездки не найдены.</p>
            </div>
          )}
        </Section>

        <Section
          id="details"
          title="Детали поездки и брони"
          subtitle="Здесь собраны `GET /trips/{id}`, `PUT /trips/{id}`, `DELETE /trips/{id}`, `GET /trips/{id}/bookings`, `POST /trips/{id}/bookings` и удаление брони."
        >
          <div ref={detailRef} />
          {!token ? (
            <div className="empty-state">
              <p>Для работы с деталями поездки нужна авторизация.</p>
            </div>
          ) : selectedTripId === null ? (
            <div className="empty-state">
              <p>
                Выберите поездку из списка выше, чтобы открыть редактирование и
                бронирование.
              </p>
            </div>
          ) : selectedTripLoading ? (
            <div className="empty-state">
              <p>Загружаем поездку #{selectedTripId}...</p>
            </div>
          ) : selectedTripError || !selectedTrip ? (
            <div className="empty-state empty-state--error">
              <p>{selectedTripError || "Не удалось загрузить поездку."}</p>
            </div>
          ) : (
            <div className="detail-grid">
              <div className="stack-lg">
                <article className="panel panel-highlight">
                  <div className="trip-card__top">
                    <div>
                      <h3 className="panel-title">
                        Поездка #{selectedTrip.id}
                      </h3>
                      <p className="muted">
                        {selectedTrip.departure_city} →{" "}
                        {selectedTrip.arrival_city}
                      </p>
                    </div>
                    <a
                      className="button button-secondary"
                      href={buildYandexRouteUrl(
                        selectedTrip.departure_city,
                        selectedTrip.arrival_city,
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Открыть маршрут
                    </a>
                  </div>
                  <div className="trip-metrics">
                    <div>
                      <span className="metric-label">Отправление</span>
                      <strong>
                        {formatDateTime(selectedTrip.departure_time)}
                      </strong>
                    </div>
                    <div>
                      <span className="metric-label">Прибытие</span>
                      <strong>
                        {formatDateTime(selectedTrip.arrival_time)}
                      </strong>
                    </div>
                    <div>
                      <span className="metric-label">Стоимость</span>
                      <strong>{formatMoney(selectedTrip.price)}</strong>
                    </div>
                    <div>
                      <span className="metric-label">Свободных мест</span>
                      <strong>{selectedTrip.available_seats}</strong>
                    </div>
                  </div>
                </article>

                <form className="panel" onSubmit={handleUpdateTrip}>
                  <h3>Редактировать поездку</h3>
                  <div className="form-grid form-grid--two">
                    <Field label="Город отправления">
                      <input
                        className="input"
                        list="cities-list"
                        value={editTripForm.departure_city}
                        onChange={(event) =>
                          setEditTripForm((prev) => ({
                            ...prev,
                            departure_city: event.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Field label="Город прибытия">
                      <input
                        className="input"
                        list="cities-list"
                        value={editTripForm.arrival_city}
                        onChange={(event) =>
                          setEditTripForm((prev) => ({
                            ...prev,
                            arrival_city: event.target.value,
                          }))
                        }
                      />
                    </Field>
                    <Field label="Отправление">
                      <input
                        className="input"
                        value={editTripForm.departure_time}
                        onChange={(event) =>
                          setEditTripForm((prev) => ({
                            ...prev,
                            departure_time: event.target.value,
                          }))
                        }
                        type="datetime-local"
                      />
                    </Field>
                    <Field label="Прибытие">
                      <input
                        className="input"
                        value={editTripForm.arrival_time}
                        onChange={(event) =>
                          setEditTripForm((prev) => ({
                            ...prev,
                            arrival_time: event.target.value,
                          }))
                        }
                        type="datetime-local"
                      />
                    </Field>
                    <Field label="Цена, ₽">
                      <input
                        className="input"
                        value={editTripForm.price}
                        onChange={(event) =>
                          setEditTripForm((prev) => ({
                            ...prev,
                            price: event.target.value,
                          }))
                        }
                        type="number"
                        min="1"
                        step="1"
                      />
                    </Field>
                    <Field label="Свободные места">
                      <input
                        className="input"
                        value={editTripForm.available_seats}
                        onChange={(event) =>
                          setEditTripForm((prev) => ({
                            ...prev,
                            available_seats: event.target.value,
                          }))
                        }
                        type="number"
                        min="1"
                      />
                    </Field>
                  </div>
                  <div className="card-actions card-actions--left">
                    <button
                      className="button"
                      type="submit"
                      disabled={updateTripLoading}
                    >
                      {updateTripLoading
                        ? "Сохраняем..."
                        : "Сохранить изменения"}
                    </button>
                    <button
                      className="button button-danger"
                      type="button"
                      onClick={handleDeleteTrip}
                      disabled={deleteTripLoading}
                    >
                      {deleteTripLoading ? "Удаляем..." : "Удалить поездку"}
                    </button>
                  </div>
                </form>
              </div>

              <div className="stack-lg">
                <form className="panel" onSubmit={handleCreateBooking}>
                  <h3>Создать бронь</h3>
                  <div className="form-grid">
                    <Field label="Имя пассажира">
                      <input
                        className="input"
                        value={bookingForm.passenger_name}
                        onChange={(event) =>
                          setBookingForm((prev) => ({
                            ...prev,
                            passenger_name: event.target.value,
                          }))
                        }
                        placeholder="Иван Иванов"
                      />
                    </Field>
                    <Field label="Телефон">
                      <input
                        className="input"
                        value={bookingForm.passenger_phone}
                        onChange={(event) =>
                          setBookingForm((prev) => ({
                            ...prev,
                            passenger_phone: event.target.value,
                          }))
                        }
                        placeholder="+7 999 123-45-67"
                      />
                    </Field>
                    <Field label="Количество мест">
                      <input
                        className="input"
                        value={bookingForm.seats_booked}
                        onChange={(event) =>
                          setBookingForm((prev) => ({
                            ...prev,
                            seats_booked: event.target.value,
                          }))
                        }
                        type="number"
                        min="1"
                      />
                    </Field>
                    <Field label="Комментарий">
                      <textarea
                        className="textarea"
                        value={bookingForm.comment}
                        onChange={(event) =>
                          setBookingForm((prev) => ({
                            ...prev,
                            comment: event.target.value,
                          }))
                        }
                        rows={4}
                        placeholder="Необязательно"
                      />
                    </Field>
                  </div>
                  <button
                    className="button"
                    type="submit"
                    disabled={createBookingLoading}
                  >
                    {createBookingLoading
                      ? "Создаём бронь..."
                      : "Забронировать"}
                  </button>
                </form>

                <div className="panel">
                  <div className="section-head section-head--compact">
                    <div>
                      <h3>Брони по поездке</h3>
                      <p className="section-subtitle">
                        Эндпоинт `GET /trips/{selectedTrip.id}/bookings`.
                      </p>
                    </div>
                  </div>
                  {bookingsLoading ? (
                    <p className="muted">Загружаем брони...</p>
                  ) : null}
                  {bookingsError ? (
                    <p className="error-text">{bookingsError}</p>
                  ) : null}
                  {!bookingsLoading && !bookings.length ? (
                    <p className="muted">
                      Для этой поездки бронирований пока нет.
                    </p>
                  ) : null}
                  <div className="booking-list">
                    {bookings.map((booking) => (
                      <BookingCard
                        key={booking.id}
                        booking={booking}
                        deleting={deletingBookingId === booking.id}
                        onDelete={() => handleDeleteBooking(booking.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Section>
      </main>
    </div>
  );
}

export default App;
