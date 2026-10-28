/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useRef } from 'react'
import { Link, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  MapPin,
  Search,
  Sparkles,
  ChevronDown,
  User,
  LogOut,
  Ticket,
  ShieldCheck,
  Check,
  X,
  Tag,
  Lock,
  Shield,
  Film,
  Menu,
  Clock,
  Flame,
} from 'lucide-react'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingScreen label="Restoring your session" />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

export function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingScreen label="Restoring your session" />
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!isAdmin) return <Navigate to="/movies" replace />
  return children
}

export function Layout({ children }) {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [offersModalOpen, setOffersModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState(() => localStorage.getItem('seatlock_city') || 'Delhi NCR')

  const cityMenuRef = useRef(null)
  const userMenuRef = useRef(null)

  const cities = ['Delhi NCR', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Pune', 'Kolkata']

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cityMenuRef.current && !cityMenuRef.current.contains(e.target)) {
        setCityDropdownOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectCity = (city) => {
    setSelectedCity(city)
    localStorage.setItem('seatlock_city', city)
    setCityDropdownOpen(false)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = async () => {
    setUserDropdownOpen(false)
    await logout()
    navigate('/')
  }

  return (
    <div className="app-shell">
      {/* Luxury Header / Navbar */}
      <header className="site-header-lux">
        <div className="lux-header-inner">
          {/* Brand & City Selector */}
          <div className="lux-brand-group">
            <Link to="/" className="lux-brand" onClick={() => setMenuOpen(false)}>
              <span className="lux-brand-icon">SL</span>
              <span className="lux-brand-text">SeatLock</span>
            </Link>

            <span className="lux-brand-badge">
              <span className="lux-pulse-dot" />
              IMAX & 3D Enabled
            </span>

            {/* City Selector */}
            <div className="city-selector-wrap" ref={cityMenuRef}>
              <button
                type="button"
                className="city-trigger-btn"
                onClick={() => setCityDropdownOpen((prev) => !prev)}
                title="Change city"
              >
                <MapPin size={14} color="#f59e0b" />
                <span>{selectedCity}</span>
                <ChevronDown size={12} />
              </button>

              {cityDropdownOpen && (
                <div className="city-dropdown-menu">
                  {cities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      className={`city-dropdown-item ${selectedCity === city ? 'active' : ''}`}
                      onClick={() => handleSelectCity(city)}
                    >
                      <span>{city}</span>
                      {selectedCity === city && <Check size={12} color="#f59e0b" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <form className="lux-search-form" onSubmit={handleSearchSubmit}>
            <Search size={15} className="lux-search-icon" />
            <input
              type="text"
              className="lux-search-input"
              placeholder="Search movies, genre, cinema, language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Navigation Links */}
          <nav className="lux-nav-links">
            <NavLink
              to="/movies"
              className={({ isActive }) => `lux-nav-link ${isActive ? 'active' : ''}`}
            >
              <Film size={14} />
              <span>Movies</span>
            </NavLink>

            <NavLink
              to="/shows"
              className={({ isActive }) => `lux-nav-link ${isActive ? 'active' : ''}`}
            >
              <Clock size={14} />
              <span>Cinemas</span>
            </NavLink>

            <button
              type="button"
              className="lux-nav-link"
              onClick={() => setOffersModalOpen(true)}
              style={{ background: 'transparent', border: 0, cursor: 'pointer' }}
            >
              <Tag size={14} color="#f59e0b" />
              <span>Offers</span>
            </button>
          </nav>

          {/* User Profile Pill / Auth Actions */}
          <div className="lux-auth-group">
            {user ? (
              <div className="user-profile-wrap" ref={userMenuRef}>
                <button
                  type="button"
                  className="user-profile-pill"
                  onClick={() => setUserDropdownOpen((prev) => !prev)}
                >
                  <span className="user-avatar-circle">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                  <span className="user-pill-name">{isAdmin ? 'Admin' : user.name.split(' ')[0]}</span>
                  <ChevronDown size={12} color="#94a3b8" />
                </button>

                {userDropdownOpen && (
                  <div className="user-dropdown-menu">
                    <div className="user-dropdown-header">
                      <div className="user-dropdown-name">{user.name}</div>
                      <div className="user-dropdown-email">{user.email}</div>
                      <span className="user-role-badge">{isAdmin ? 'SUPER ADMIN' : 'VERIFIED MEMBER'}</span>
                    </div>

                    {!isAdmin && (
                      <Link
                        to="/bookings"
                        className="user-dropdown-link"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <Ticket size={14} color="#f59e0b" />
                        <span>My Bookings</span>
                      </Link>
                    )}

                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="user-dropdown-link"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <ShieldCheck size={14} color="#10b981" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      className="user-dropdown-logout"
                      onClick={handleLogout}
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="user-actions">
                <Link className="button button-small button-ghost" to="/login">
                  Log in
                </Link>
                <Link
                  className="button button-small button-primary"
                  to="/register"
                  style={{
                    background: 'linear-gradient(135deg, #d75a36, #8b1528)',
                    boxShadow: '0 4px 14px rgba(215, 90, 54, 0.4)',
                  }}
                >
                  Join now
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="lux-hamburger-btn"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? <X size={22} color="#ffffff" /> : <Menu size={22} color="#ffffff" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Out Drawer Overlay */}
      <div className={`lux-mobile-drawer ${menuOpen ? 'open' : ''}`}>
        <div className="lux-mobile-drawer-backdrop" onClick={() => setMenuOpen(false)} />
        <div className="lux-mobile-drawer-panel">
          <div className="mobile-drawer-header">
            <div className="lux-brand">
              <span className="lux-brand-icon">SL</span>
              <span className="lux-brand-text">SeatLock</span>
            </div>
            <button
              type="button"
              className="mobile-drawer-close"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* City Chips in Mobile Drawer */}
          <div className="mobile-drawer-section">
            <div className="mobile-section-title">
              <MapPin size={13} color="#f59e0b" />
              <span>CURRENT CITY: <strong>{selectedCity}</strong></span>
            </div>
            <div className="mobile-city-chips">
              {cities.map((city) => (
                <button
                  key={city}
                  type="button"
                  className={`mobile-city-chip ${selectedCity === city ? 'active' : ''}`}
                  onClick={() => {
                    handleSelectCity(city)
                    setMenuOpen(false)
                  }}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>

          {/* Search in Mobile Drawer */}
          <form
            className="mobile-drawer-search"
            onSubmit={(e) => {
              handleSearchSubmit(e)
              setMenuOpen(false)
            }}
          >
            <Search size={16} className="drawer-search-icon" />
            <input
              type="text"
              placeholder="Search movies, genre, cinema..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Navigation Items in Mobile Drawer */}
          <nav className="mobile-drawer-nav">
            <NavLink
              to="/"
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <Flame size={18} />
              <span>Home & Featured</span>
            </NavLink>

            <NavLink
              to="/movies"
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <Film size={18} />
              <span>Movies & Premieres</span>
            </NavLink>

            <NavLink
              to="/shows"
              className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <Clock size={18} />
              <span>Cinemas & Theaters</span>
            </NavLink>

            <button
              type="button"
              className="mobile-nav-link"
              onClick={() => {
                setOffersModalOpen(true)
                setMenuOpen(false)
              }}
            >
              <Tag size={18} color="#f59e0b" />
              <span>Privileges & Offers</span>
            </button>

            {user && !isAdmin && (
              <NavLink
                to="/bookings"
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <Ticket size={18} color="#f59e0b" />
                <span>My Bookings</span>
              </NavLink>
            )}

            {isAdmin && (
              <NavLink
                to="/admin"
                className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <ShieldCheck size={18} color="#10b981" />
                <span>Admin Control Center</span>
              </NavLink>
            )}
          </nav>

          {/* Auth Footer in Mobile Drawer */}
          <div className="mobile-drawer-auth">
            {user ? (
              <div className="mobile-auth-user">
                <div className="mobile-user-info">
                  <span className="user-avatar-circle">
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                  <div>
                    <div className="mobile-user-name">{user.name}</div>
                    <div className="mobile-user-email">{user.email}</div>
                  </div>
                </div>
                <button
                  type="button"
                  className="mobile-logout-btn"
                  onClick={() => {
                    handleLogout()
                    setMenuOpen(false)
                  }}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="mobile-auth-guest">
                <Link
                  to="/login"
                  className="button button-ghost"
                  onClick={() => setMenuOpen(false)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="button button-primary"
                  onClick={() => setMenuOpen(false)}
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Join SeatLock
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Offers & Discounts Modal */}
      {offersModalOpen && (
        <div className="cinematic-modal-overlay" onClick={() => setOffersModalOpen(false)}>
          <div className="trailer-modal-box" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <div className="trailer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Tag size={18} color="#f59e0b" />
                <h3 style={{ margin: 0, color: '#fff', fontSize: 16 }}>SeatLock Luxury Privileges & Offers</h3>
              </div>
              <button
                type="button"
                className="clear-button"
                onClick={() => setOffersModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="offer-code-pill">
                <div>
                  <div className="offer-code-text">WELCOME50</div>
                  <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 2 }}>Flat 50% discount on your first movie ticket reservation.</div>
                </div>
                <button
                  type="button"
                  className="offer-copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText('WELCOME50')
                    alert('Promo code WELCOME50 copied to clipboard!')
                  }}
                >
                  Copy
                </button>
              </div>

              <div className="offer-code-pill">
                <div>
                  <div className="offer-code-text">IMAX2026</div>
                  <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 2 }}>Flat ₹150 OFF on all IMAX 3D and 4K Laser Screenings.</div>
                </div>
                <button
                  type="button"
                  className="offer-copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText('IMAX2026')
                    alert('Promo code IMAX2026 copied to clipboard!')
                  }}
                >
                  Copy
                </button>
              </div>

              <div className="offer-code-pill">
                <div>
                  <div className="offer-code-text">RECLINERVIP</div>
                  <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 2 }}>Complimentary Gourmet Popcorn & Beverage Combo with Recliner seats.</div>
                </div>
                <button
                  type="button"
                  className="offer-copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText('RECLINERVIP')
                    alert('Promo code RECLINERVIP copied to clipboard!')
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <main className="page-content" key={location.pathname}>
        {children}
      </main>

      {/* Luxury Footer */}
      <footer className="lux-footer">
        <div className="lux-footer-inner">
          <div className="footer-top-row">
            <div className="footer-brand-summary">
              <div className="lux-brand">
                <span className="lux-brand-icon">SL</span>
                <span className="lux-brand-text">SeatLock</span>
              </div>
              <p>
                The next-generation cinematic ticketing and auditorium experience platform. High-concurrency seat locking, interactive 3D POV preview, and instant reservations.
              </p>
            </div>

            <div>
              <div className="footer-col-title">Navigation</div>
              <ul className="footer-links-list">
                <li><Link to="/movies">Now Showing</Link></li>
                <li><Link to="/shows">Showtimes & Cinemas</Link></li>
                <li><Link to="/bookings">My Bookings</Link></li>
                <li><a href="#experience-3d">3D Hall Simulator</a></li>
              </ul>
            </div>

            <div>
              <div className="footer-col-title">Cinemas & Cities</div>
              <div className="footer-cities-pills">
                {cities.map((c) => (
                  <span key={c} className="footer-city-tag">{c}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="footer-col-title">Concierge & Support</div>
              <ul className="footer-links-list">
                <li><a href="mailto:support@seatlock.com">support@seatlock.com</a></li>
                <li><span style={{ color: '#94a3b8', fontSize: 12 }}>Toll-Free: 1800-SEAT-LOCK</span></li>
                <li><span style={{ color: '#10b981', fontSize: 12 }}>● 24/7 Concurrency Engine Online</span></li>
              </ul>
            </div>
          </div>

          <div className="footer-trust-row">
            <div className="trust-badge-item">
              <ShieldCheck size={18} className="trust-badge-icon" />
              <span>PCI-DSS Level 1 Simulated Gateway</span>
            </div>
            <div className="trust-badge-item">
              <Lock size={18} className="trust-badge-icon" />
              <span>256-Bit TLS End-to-End Encryption</span>
            </div>
            <div className="trust-badge-item">
              <Clock size={18} className="trust-badge-icon" />
              <span>Instant 10-Minute Concurrency Hold</span>
            </div>
            <div className="trust-badge-item">
              <Ticket size={18} className="trust-badge-icon" />
              <span>Dynamic QR Verified E-Tickets</span>
            </div>
          </div>

          <div className="footer-bottom-copy">
            <span>© 2026 SeatLock Cinema Lounge Technologies Inc. All rights reserved.</span>
            <span>Privacy Policy · Terms of Service · Security Disclosures</span>
          </div>
        </div>
      </footer>

      {/* Floating Mobile Bottom Navigation Bar (< 768px) */}
      <nav className="lux-mobile-bottom-bar" aria-label="Mobile navigation">
        <NavLink
          to="/"
          className={({ isActive }) => `bottom-bar-item ${isActive ? 'active' : ''}`}
        >
          <Flame size={20} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/movies"
          className={({ isActive }) => `bottom-bar-item ${isActive ? 'active' : ''}`}
        >
          <Film size={20} />
          <span>Movies</span>
        </NavLink>

        <NavLink
          to="/shows"
          className={({ isActive }) => `bottom-bar-item ${isActive ? 'active' : ''}`}
        >
          <Clock size={20} />
          <span>Cinemas</span>
        </NavLink>

        {user ? (
          <NavLink
            to="/bookings"
            className={({ isActive }) => `bottom-bar-item ${isActive ? 'active' : ''}`}
          >
            <Ticket size={20} />
            <span>Bookings</span>
          </NavLink>
        ) : (
          <NavLink
            to="/login"
            className={({ isActive }) => `bottom-bar-item ${isActive ? 'active' : ''}`}
          >
            <User size={20} />
            <span>Sign In</span>
          </NavLink>
        )}
      </nav>
    </div>
  )
}

export function LoadingScreen({ label = 'Loading' }) {
  return <div className="loading-screen"><span className="spinner" /><p>{label}</p></div>
}

export function ErrorState({ message, onRetry }) {
  return <div className="state-card error-state"><span className="state-icon">!</span><h3>We hit a pause</h3><p>{message}</p>{onRetry && <button className="button button-primary" onClick={onRetry}>Try again</button>}</div>
}

export function EmptyState({ title, message, action }) {
  return <div className="state-card"><span className="state-icon">+</span><h3>{title}</h3><p>{message}</p>{action}</div>
}

export function Toast({ toast, onClose }) {
  if (!toast) return null
  return <div className={`toast toast-${toast.type || 'info'}`} role="status"><span>{toast.message}</span><button onClick={onClose} aria-label="Dismiss notification">×</button></div>
}

export function Poster({ movie, large = false }) {
  return movie?.posterUrl ? <img className={`poster ${large ? 'poster-large' : ''}`} src={movie.posterUrl} alt={`${movie.title} poster`} /> : <div className={`poster poster-fallback ${large ? 'poster-large' : ''}`}><span>{movie?.title?.slice(0, 1) || 'S'}</span></div>
}

export function MovieCard({ movie }) {
  return <Link to={`/movies/${movie.id}`} className="movie-card"><Poster movie={movie} /><div className="movie-card-copy"><span className="eyebrow">{movie.language}</span><h3>{movie.title}</h3><p>{movie.genre} <span className="dot">·</span> {movie.durationMin} min</p></div></Link>
}

export function StatusPill({ status }) {
  return <span className={`status-pill status-${String(status).toLowerCase()}`}>{status}</span>
}

export function formatDate(value, options = {}) {
  if (!value) return 'Date TBA'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', ...options }).format(new Date(value))
}

export function formatTime(value) {
  if (!value) return 'Time TBA'
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

export function formatMoney(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0))
}

export function BackLink({ to = -1, children = 'Back' }) {
  return <Link className="back-link" to={to}>← {children}</Link>
}

export function QRCode({ value = '', size = 160 }) {
  const N = 25
  const grid = Array.from({ length: N }, () => Array(N).fill(false))

  const drawFinder = (startX, startY) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          grid[startY + r][startX + c] = true
        }
      }
    }
  }

  drawFinder(0, 0)
  drawFinder(N - 7, 0)
  drawFinder(0, N - 7)

  for (let i = 8; i < N - 8; i++) {
    if (i % 2 === 0) {
      grid[6][i] = true
      grid[i][6] = true
    }
  }

  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i)
    hash |= 0
  }

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const inFinder1 = r < 8 && c < 8
      const inFinder2 = r < 8 && c >= N - 8
      const inFinder3 = r >= N - 8 && c < 8
      const inTiming = r === 6 || c === 6
      if (!inFinder1 && !inFinder2 && !inFinder3 && !inTiming) {
        const seed = Math.sin(hash + r * 31 + c * 17) * 10000
        grid[r][c] = (seed - Math.floor(seed)) > 0.48
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${N} ${N}`} style={{ display: 'block', background: '#fff', padding: '6px', borderRadius: '4px', border: '1px solid #deded7' }}>
      {grid.map((row, r) =>
        row.map((active, c) =>
          active ? <rect key={`${r}-${c}`} x={c} y={r} width="1" height="1" fill="#192622" /> : null
        )
      )}
    </svg>
  )
}
