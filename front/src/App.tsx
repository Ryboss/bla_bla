import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { AppLayout, EmptyState } from "./components/ui";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TripsPage } from "./pages/TripsPage";
import { CreateTripPage } from "./pages/CreateTripPage";
import { FindBookingPage } from "./pages/FindBookingPage";
import { TripDetailsPage } from "./pages/TripDetailsPage";
import { BookingDetailsPage } from "./pages/BookingDetailsPage";

function ProtectedRoute() {
  const { token } = useAuth();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}

function RootRedirect() {
  const { token } = useAuth();
  return <Navigate to={token ? "/dashboard" : "/login"} replace />;
}

function AppFrame() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/trips/new" element={<CreateTripPage />} />
          <Route path="/trips/:tripId" element={<TripDetailsPage />} />
          <Route path="/bookings/find" element={<FindBookingPage />} />
          <Route path="/bookings/:bookingId" element={<BookingDetailsPage />} />
        </Route>

        <Route
          path="*"
          element={<EmptyState text="Страница не найдена." error />}
        />
      </Routes>
    </AppLayout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppFrame />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
