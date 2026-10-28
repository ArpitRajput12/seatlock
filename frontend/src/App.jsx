import { useState } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AdminRoute, Layout, ProtectedRoute, Toast } from './components/AppComponents'
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'
import {
  BookingDetailsPage,
  BookingSummaryPage,
  AdminDashboardPage,
  AdminResourcePage,
  HomePage,
  LoginPage,
  MovieDetailsPage,
  MoviesPage,
  MyBookingsPage,
  PaymentFailedPage,
  PaymentPage,
  PaymentSuccessPage,
  RegisterPage,
  SeatSelectionPage,
  ShowsPage,
} from './pages/Pages'
import './App.css'

function AppRoutes() {
  const [toast, setToast] = useState(null)
  const notify = (message, type = 'info') => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 4500)
  }

  return (
    <GlobalErrorBoundary>
      <Toast toast={toast} onClose={() => setToast(null)} />
      <Routes>
        <Route path="/" element={<HomePage notify={notify} />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/movies/:movieId" element={<MovieDetailsPage />} />
        <Route path="/shows" element={<ShowsPage />} />
        <Route path="/shows/:showId/seats" element={<SeatSelectionPage notify={notify} />} />
        <Route path="/login" element={<LoginPage notify={notify} />} />
        <Route path="/register" element={<RegisterPage notify={notify} />} />
        <Route path="/booking-summary" element={<ProtectedRoute><BookingSummaryPage notify={notify} /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute><PaymentPage notify={notify} /></ProtectedRoute>} />
        <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
        <Route path="/payment-failed" element={<ProtectedRoute><PaymentFailedPage /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><MyBookingsPage notify={notify} /></ProtectedRoute>} />
        <Route path="/bookings/:bookingId" element={<ProtectedRoute><BookingDetailsPage notify={notify} /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboardPage notify={notify} /></AdminRoute>} />
        <Route path="/admin/overview" element={<AdminRoute><AdminDashboardPage notify={notify} initialTab="overview" /></AdminRoute>} />
        <Route path="/admin/movies" element={<AdminRoute><AdminDashboardPage notify={notify} initialTab="movies" /></AdminRoute>} />
        <Route path="/admin/theaters" element={<AdminRoute><AdminDashboardPage notify={notify} initialTab="theaters" /></AdminRoute>} />
        <Route path="/admin/screens" element={<AdminRoute><AdminDashboardPage notify={notify} initialTab="screens" /></AdminRoute>} />
        <Route path="/admin/seats" element={<AdminRoute><AdminDashboardPage notify={notify} initialTab="screens" /></AdminRoute>} />
        <Route path="/admin/shows" element={<AdminRoute><AdminDashboardPage notify={notify} initialTab="shows" /></AdminRoute>} />
        <Route path="/admin/media" element={<AdminRoute><AdminDashboardPage notify={notify} initialTab="media" /></AdminRoute>} />
        <Route path="/admin/cloudinary" element={<AdminRoute><AdminDashboardPage notify={notify} initialTab="media" /></AdminRoute>} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </GlobalErrorBoundary>
  )
}

function App() {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Layout>
            <AppRoutes />
          </Layout>
        </BrowserRouter>
      </AuthProvider>
    </GlobalErrorBoundary>
  )
}

export default App
