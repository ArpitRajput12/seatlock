/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
import React, { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { adminApi, bookingApi, catalogApi, getApiError, movieApi, paymentApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import {
  BackLink,
  EmptyState,
  ErrorState,
  formatDate,
  formatMoney,
  formatTime,
  LoadingScreen,
  MovieCard,
  Poster,
  QRCode,
  StatusPill,
} from '../components/AppComponents'
import { CinemaHall3D } from '../components/CinemaHall3D'
import {
  MapPin,
  Sparkles,
  Eye,
  X,
  ChevronRight,
  ChevronLeft,
  Clock,
  CreditCard,
  QrCode,
  Building2,
  Check,
  RotateCcw,
  Film,
  Layers,
  Play,
  Star,
  Bell,
  Calendar,
  Flame,
  Ticket,
  Tag,
  ShieldCheck,
  Volume2,
  VolumeX,
} from 'lucide-react'

function SectionHeading({ eyebrow, title, copy, action }) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        {copy && <p>{copy}</p>}
      </div>
      {action}
    </div>
  )
}

// Curated Blockbuster Carousel Data for Hero Showcase
const HERO_SHOWCASE_MOVIES = [
  {
    id: 'hero-interstellar',
    title: 'Interstellar: The IMAX Experience',
    backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=2000&auto=format&fit=crop',
    rating: '8.9/10',
    votes: '42.8K',
    durationMin: 169,
    cert: 'U/A 16+',
    formats: ['IMAX 3D', 'DOLBY ATMOS 7.1', '4K LASER'],
    genre: 'Sci-Fi / Space Epic',
    language: 'English',
    description: 'When Earth faces ecological collapse, a team of pioneering astronauts embarks on an interstellar voyage through a newly opened wormhole near Saturn in a desperate quest to secure humanity’s survival.',
    trailerUrl: 'https://res.cloudinary.com/yrhsbxba/video/upload/v1793210356/seatlock/trailers/u3ztl5w3ihf1gl5xlutr.mp4',
    trailer_url: 'https://res.cloudinary.com/yrhsbxba/video/upload/v1793210356/seatlock/trailers/u3ztl5w3ihf1gl5xlutr.mp4',
  },
  {
    id: 'hero-dune2',
    title: 'Dune: Part Two (Dolby Cinema Edition)',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2000&auto=format&fit=crop',
    rating: '8.8/10',
    votes: '38.1K',
    durationMin: 166,
    cert: 'U/A 16+',
    formats: ['DOLBY CINEMA', 'IMAX LASER', 'REALD 3D'],
    genre: 'Sci-Fi / Adventure',
    language: 'English',
    description: 'Paul Atreides unites with Chani and the Fremen on a warpath of revenge against the conspirators who destroyed his family, confronting a choice between the love of his life and the fate of the known universe.',
    trailerUrl: 'https://res.cloudinary.com/yrhsbxba/video/upload/v1793210947/posters/wgpea8bwp5whndq7wusa.mp4',
    trailer_url: 'https://res.cloudinary.com/yrhsbxba/video/upload/v1793210947/posters/wgpea8bwp5whndq7wusa.mp4',
  },
  {
    id: 'hero-darkknight',
    title: 'The Dark Knight (Remastered 70mm)',
    backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=2000&auto=format&fit=crop',
    rating: '9.0/10',
    votes: '64.9K',
    durationMin: 152,
    cert: 'A 18+',
    formats: ['70MM IMAX', 'DOLBY ATMOS', 'D-BOX'],
    genre: 'Action / Crime',
    language: 'English',
    description: 'When the menace known as the Joker wreaks havoc and chaos on the citizens of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
    trailerUrl: 'https://res.cloudinary.com/yrhsbxba/video/upload/v1793210445/seatlock/trailers/nrjpg8jzawvtdyqdrziv.mp4',
    trailer_url: 'https://res.cloudinary.com/yrhsbxba/video/upload/v1793210445/seatlock/trailers/nrjpg8jzawvtdyqdrziv.mp4',
  },
  {
    id: 'hero-cyberpunk',
    title: 'Cyberpunk: Neon Horizon 2026',
    backdropUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=2000&auto=format&fit=crop',
    rating: '8.7/10',
    votes: '24.5K',
    durationMin: 140,
    cert: 'U/A 16+',
    formats: ['IMAX 3D', '4K LASER', 'VIP RECLINER'],
    genre: 'Action / Sci-Fi',
    language: 'Hindi',
    description: 'In the rain-drenched megacity of Neo-Kashi, a covert data operative discovers a rogue sentient intelligence that threatens to rewrite global biometric consciousness.',
    trailerUrl: 'https://res.cloudinary.com/yrhsbxba/video/upload/v1793210647/seatlock/trailers/yuokkwsbzx1ds8ectiqc.mp4',
    trailer_url: 'https://res.cloudinary.com/yrhsbxba/video/upload/v1793210647/seatlock/trailers/yuokkwsbzx1ds8ectiqc.mp4',
  },
]

// Upcoming Movies Data
const UPCOMING_BLOCKBUSTERS = [
  {
    id: 'up-1',
    title: 'Avatar: Fire and Ash (IMAX 3D)',
    releaseText: 'Releasing 18 Dec 2026',
    genre: 'Sci-Fi · Adventure · 3D',
    posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'up-2',
    title: 'Tron: Ares (Laser IMAX)',
    releaseText: 'Releasing 12 Nov 2026',
    genre: 'Sci-Fi · Cyber · Electronic',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'up-3',
    title: 'The Batman: Part II',
    releaseText: 'Releasing 24 Dec 2026',
    genre: 'Action · Crime · Mystery',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: 'up-4',
    title: 'Project Hail Mary (Dolby Atmos)',
    releaseText: 'Releasing 08 Jan 2027',
    genre: 'Sci-Fi · Space Exploration',
    posterUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=600&auto=format&fit=crop',
  },
]

// Cinematic High-Contrast Trailer Modal (Instant Autoplay, Centered Viewport, Zero Scroll)
function TrailerModal({ movie, onClose }) {
  const videoRef = useRef(null)
  const [isMuted, setIsMuted] = useState(false)

  // Prevent background page scroll while trailer is playing
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  if (!movie) return null

  const rawUrl =
    movie.trailer_url ||
    movie.trailerUrl ||
    movie.description?.match(/Trailer:\s*(https?:\/\/[^\s]+)/)?.[1] ||
    (movie.title?.toLowerCase().includes('dune')
      ? 'https://res.cloudinary.com/yrhsbxba/video/upload/v1793210947/posters/wgpea8bwp5whndq7wusa.mp4'
      : movie.title?.toLowerCase().includes('dark knight')
      ? 'https://res.cloudinary.com/yrhsbxba/video/upload/v1793210445/seatlock/trailers/nrjpg8jzawvtdyqdrziv.mp4'
      : movie.title?.toLowerCase().includes('cyber')
      ? 'https://res.cloudinary.com/yrhsbxba/video/upload/v1793210647/seatlock/trailers/yuokkwsbzx1ds8ectiqc.mp4'
      : 'https://res.cloudinary.com/yrhsbxba/video/upload/v1793210356/seatlock/trailers/u3ztl5w3ihf1gl5xlutr.mp4')

  const trailerUrl = (rawUrl || '').trim()
  const isYoutube = trailerUrl.includes('youtube') || trailerUrl.includes('youtu.be')
  const youtubeEmbedUrl = isYoutube
    ? `${trailerUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}?autoplay=1&mute=0`
    : ''

  // Autoplay handler with graceful browser-policy unmuted-to-muted fallback
  useEffect(() => {
    if (videoRef.current && !isYoutube) {
      videoRef.current.currentTime = 0
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If browser policy blocks sound autoplay, immediately autoplay muted
          if (videoRef.current) {
            videoRef.current.muted = true
            setIsMuted(true)
            videoRef.current.play().catch((err) => console.warn('Autoplay failed:', err))
          }
        })
      }
    }
  }, [trailerUrl, isYoutube])

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-hidden"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.90)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '16px',
        overflow: 'hidden',
        margin: 0,
      }}
    >
      <div
        className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '896px',
          background: '#09090b',
          border: '1px solid rgba(39, 39, 42, 0.8)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.95), 0 0 50px rgba(225, 29, 72, 0.2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-zinc-800"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid #27272a',
            background: '#09090b',
          }}
        >
          <h3
            className="text-lg font-semibold text-white tracking-wide"
            style={{ fontSize: '18px', fontWeight: 600, color: '#fff', letterSpacing: '0.025em', margin: 0 }}
          >
            🎬 {movie.title} - Official Trailer
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-2xl font-bold cursor-pointer"
            style={{
              color: '#a1a1aa',
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              fontWeight: 700,
              cursor: 'pointer',
              lineHeight: 1,
              padding: '4px 8px',
              borderRadius: '6px',
            }}
            title="Close Trailer"
          >
            ✕
          </button>
        </div>

        <div
          className="relative aspect-video w-full bg-black flex items-center justify-center"
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '16 / 9',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isYoutube ? (
            <iframe
              src={youtubeEmbedUrl}
              title={`${movie.title} Trailer Player`}
              className="w-full h-full border-0"
              style={{ width: '100%', height: '100%', border: 0 }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <>
              <video
                ref={videoRef}
                src={trailerUrl}
                controls
                autoPlay
                playsInline
                preload="auto"
                className="w-full h-full object-contain"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={() => {
                  const fallback = 'https://res.cloudinary.com/yrhsbxba/video/upload/v1793210356/seatlock/trailers/u3ztl5w3ihf1gl5xlutr.mp4'
                  if (videoRef.current && videoRef.current.src !== fallback) {
                    videoRef.current.src = fallback
                    videoRef.current.play().catch(() => {})
                  }
                }}
              />
              {isMuted && (
                <button
                  type="button"
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.muted = false
                      setIsMuted(false)
                    }
                  }}
                  className="absolute bottom-16 right-4 z-20 flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg transition-all"
                  style={{
                    position: 'absolute',
                    bottom: '56px',
                    right: '16px',
                    zIndex: 20,
                    background: '#e11d48',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '9999px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600,
                    fontSize: '13px',
                    boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)',
                  }}
                >
                  <Volume2 size={16} />
                  <span>Click to Unmute</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function HomePage({ notify }) {
  const navigate = useNavigate()
  const [movies, setMovies] = useState([])
  const [shows, setShows] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedTrailerMovie, setSelectedTrailerMovie] = useState(null)
  const trailerMovie = selectedTrailerMovie
  const setTrailerMovie = setSelectedTrailerMovie

  const handleOpenTrailer = (movie) => {
    if (!movie) return
    setSelectedTrailerMovie({
      ...movie,
      trailer_url: movie?.trailer_url || movie?.trailerUrl,
      trailerUrl: movie?.trailerUrl || movie?.trailer_url,
    })
  }

  // Carousel slides & resilient auto-swapping interval
  const slides = HERO_SHOWCASE_MOVIES
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const currentSlide = currentSlideIndex // backward compatibility alias
  const [isHovered, setIsHovered] = useState(false)
  const timerRef = useRef(null)

  // Fetch movies and shows for 3D simulator shortcut
  useEffect(() => {
    Promise.all([
      movieApi.list({ limit: 20 }),
      catalogApi.shows(),
    ])
      .then(([movieRes, showRes]) => {
        setMovies(movieRes.data || [])
        setShows(showRes.data || [])
      })
      .catch((error) => setState({ loading: false, error: getApiError(error) }))
      .finally(() => setState((current) => ({ ...current, loading: false })))
  }, [])

  // Auto-advance Billboard Carousel every 4000ms (4 seconds) using stable useRef and useEffect
  const resetAutoPlayTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (!isHovered && slides && slides.length > 0) {
      timerRef.current = setInterval(() => {
        setCurrentSlideIndex((prev) => (prev + 1) % slides.length)
      }, 4000)
    }
  }, [isHovered, slides])

  useEffect(() => {
    resetAutoPlayTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [resetAutoPlayTimer])

  const handlePrevSlide = (e) => {
    e?.stopPropagation()
    setCurrentSlideIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
    resetAutoPlayTimer()
  }

  const handleNextSlide = (e) => {
    e?.stopPropagation()
    setCurrentSlideIndex((prev) => (prev + 1) % slides.length)
    resetAutoPlayTimer()
  }

  const handleSelectDot = (idx, e) => {
    e?.stopPropagation()
    setCurrentSlideIndex(idx)
    resetAutoPlayTimer()
  }

  // Backward compatibility aliases
  const activeSlide = currentSlideIndex
  const setActiveSlide = setCurrentSlideIndex
  const isHoveringCarousel = isHovered
  const setIsHoveringCarousel = setIsHovered

  // Filter movies by category tab
  const categories = ['All', 'Action', 'Sci-Fi', 'Thriller', 'Hindi', 'English']

  const filteredMovies = useMemo(() => {
    const list = Array.isArray(movies) ? movies : []
    if (activeCategory === 'All') return list
    const query = activeCategory.toLowerCase()
    return list.filter((m) =>
      (m.genre && m.genre.toLowerCase().includes(query)) ||
      (m.language && m.language.toLowerCase().includes(query))
    )
  }, [movies, activeCategory])

  // Find show ID for direct 3D auditorium booking
  const handleBookMovie = (movie) => {
    const safeMovies = Array.isArray(movies) ? movies : []
    const safeShows = Array.isArray(shows) ? shows : []
    const match = safeMovies.find(
      (m) => m.id === movie.id || (m.title && movie.title && m.title.toLowerCase().includes(movie.title.split(' ')[0].toLowerCase()))
    )
    if (match) {
      // Find show for this movie
      const movieShow = safeShows.find((s) => s.movieId === match.id)
      if (movieShow) {
        navigate(`/shows/${movieShow.id}/seats`)
        return
      }
      navigate(`/movies/${match.id}`)
      return
    }
    // Fallback to shows page
    if (safeShows.length > 0) {
      navigate(`/shows/${safeShows[0].id}/seats`)
    } else {
      navigate('/movies')
    }
  }

  const handleLaunch3DSimulator = () => {
    const safeShows = Array.isArray(shows) ? shows : []
    const safeMovies = Array.isArray(movies) ? movies : []
    if (safeShows.length > 0) {
      navigate(`/shows/${safeShows[0].id}/seats`)
    } else if (safeMovies.length > 0) {
      navigate(`/movies/${safeMovies[0].id}`)
    } else {
      navigate('/movies')
    }
  }

  const handleNotifyUpcoming = (item) => {
    if (notify) {
      notify(`🔔 Alert set! You will be notified the instant bookings open for "${item.title}".`, 'success')
    } else {
      alert(`Reminder set for ${item.title}!`)
    }
  }

  return (
    <div className="home-page-luxury" style={{ paddingBottom: 60 }}>
      {/* 1. Cinematic Billboard Carousel (Hero Section) */}
      <section
        className="cinematic-hero-section"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`hero-slide ${index === currentSlideIndex ? 'active' : ''}`}
          >
            <img
              src={slide.backdropUrl}
              alt={slide.title}
              className="hero-backdrop-img"
            />
            <div className="hero-vignette" />

            <div className="hero-content-wrap">
              <div className="hero-tags-row">
                <span className="hero-rating-pill">⭐ {slide.rating} ({slide.votes})</span>
                <span className="hero-meta-pill"><Clock size={12} /> {slide.durationMin} min</span>
                <span className="hero-meta-pill">{slide.cert}</span>
                {slide.formats.map((fmt) => (
                  <span key={fmt} className="hero-meta-pill" style={{ color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                    {fmt}
                  </span>
                ))}
              </div>

              <h1 className="hero-title-text">{slide.title}</h1>
              <p className="hero-desc-text">{slide.description}</p>

              <div className="hero-cta-row">
                <button
                  type="button"
                  className="hero-btn-book"
                  onClick={() => handleBookMovie(slide)}
                >
                  <Ticket size={16} />
                  <span>Book Tickets (3D Seating)</span>
                </button>

                <button
                  type="button"
                  className="hero-btn-trailer"
                  onClick={() => handleOpenTrailer(slide)}
                >
                  <Play size={15} />
                  <span>Watch Trailer</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Carousel Indicators & Controls */}
        <div className="hero-carousel-nav">
          <button
            type="button"
            className="hero-carousel-arrow"
            onClick={handlePrevSlide}
            aria-label="Previous slide"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="hero-dots-row">
            {slides.map((_, dotIdx) => (
              <span
                key={dotIdx}
                className={`hero-dot-indicator ${dotIdx === currentSlideIndex ? 'active' : ''}`}
                onClick={(e) => handleSelectDot(dotIdx, e)}
                title={`Go to slide ${dotIdx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            className="hero-carousel-arrow"
            onClick={handleNextSlide}
            aria-label="Next slide"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* Main Container for Discovery */}
      <div className="container" style={{ width: 'min(1360px, calc(100% - 40px))' }}>
        {/* Category Filter Pills */}
        <div className="category-filter-bar">
          <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginRight: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} color="#f59e0b" /> Filters:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`cat-filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 2. Now Showing Section */}
        <section style={{ marginBottom: 60 }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Experience In Cinema</span>
              <h2 style={{ color: '#fff', fontSize: 28 }}>Now Showing</h2>
              <p style={{ color: '#94a3b8' }}>
                Ultra-high-definition 4K Laser & Dolby Atmos screenings available today.
              </p>
            </div>
            <Link className="text-link" to="/movies" style={{ color: '#f59e0b', borderColor: '#f59e0b' }}>
              View All Movies →
            </Link>
          </div>

          {state.loading ? (
            <LoadingScreen label="Loading verified showtimes & seating..." />
          ) : state.error ? (
            <ErrorState message={state.error} />
          ) : filteredMovies.length === 0 ? (
            <EmptyState
              title="No movies found in this category"
              message="Try switching category tabs to explore all available films."
              action={
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => setActiveCategory('All')}
                >
                  Show All Movies
                </button>
              }
            />
          ) : (
            <div className="lux-movie-grid">
              {filteredMovies.map((movie) => (
                <div className="lux-card" key={movie.id}>
                  <div className="lux-card-media">
                    <img
                      src={movie.posterUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop'}
                      alt={movie.title}
                    />
                    <div className="lux-badge-top-left">
                      {movie.language === 'English' ? 'IMAX 3D' : 'DOLBY ATMOS'}
                    </div>
                    <div className="lux-badge-top-right">
                      <Star size={11} color="#f59e0b" fill="#f59e0b" />
                      <span>8.9</span>
                    </div>
                  </div>

                  <div className="lux-card-content">
                    <h3 className="lux-card-title" title={movie.title}>
                      {movie.title}
                    </h3>
                    <div className="lux-card-details">
                      <span>{movie.language}</span>
                      <span>•</span>
                      <span>{movie.genre}</span>
                      <span>•</span>
                      <span>{movie.durationMin}m</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button
                        type="button"
                        className="lux-card-btn"
                        style={{ flex: 1 }}
                        onClick={() => handleBookMovie(movie)}
                      >
                        <Ticket size={14} />
                        <span>Book Tickets</span>
                      </button>
                      <button
                        type="button"
                        className="lux-card-trailer-btn"
                        title="Watch Trailer"
                        onClick={() => handleOpenTrailer(movie)}
                      >
                        <Play size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. Next-Gen 3D Cinema Auditorium Featurette */}
        <section id="experience-3d" className="featurette-3d-banner">
          <div>
            <span className="featurette-badge-tag">
              <Sparkles size={13} />
              Revolutionary WebGL Seating Engine
            </span>
            <h2 className="featurette-title">
              Experience the Auditorium in 3D Before You Reserve.
            </h2>
            <p className="featurette-desc">
              Every armchair in our Lumière auditoriums is mapped in full 3D. Inspect your exact viewing sightline angle, test velvet recliners, and enjoy sub-second concurrency hold protection.
            </p>

            <div className="featurette-perks">
              <div className="featurette-perk-item">
                <Check size={16} className="perk-check-icon" />
                <span>Real-time POV Camera to 4K Screen</span>
              </div>
              <div className="featurette-perk-item">
                <Check size={16} className="perk-check-icon" />
                <span>Zero Double-Booking Row Locks</span>
              </div>
              <div className="featurette-perk-item">
                <Check size={16} className="perk-check-icon" />
                <span>Velvet Recliners & Cup-Holder Pedestals</span>
              </div>
              <div className="featurette-perk-item">
                <Check size={16} className="perk-check-icon" />
                <span>Instant 10-Minute Hold Timer</span>
              </div>
            </div>

            <button
              type="button"
              className="hero-btn-book"
              onClick={handleLaunch3DSimulator}
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d75a36)',
                color: '#000',
                fontWeight: 800,
              }}
            >
              <Eye size={16} />
              <span>Launch 3D Hall Simulator</span>
            </button>
          </div>

          <div className="featurette-visual-card">
            <img
              src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200&auto=format&fit=crop"
              alt="3D Cinema Seating"
              className="featurette-visual-img"
            />
            <div className="featurette-visual-overlay">
              <span className="hero-rating-pill" style={{ width: 'fit-content', marginBottom: 6 }}>
                Auditorium 01 • Dolby Atmos Laser
              </span>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>
                60 FPS WebGL Interactive Auditorium View
              </div>
            </div>
          </div>
        </section>

        {/* 4. Upcoming Movies & Anticipated Blockbusters */}
        <section style={{ marginBottom: 60 }}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">Coming Soon</span>
              <h2 style={{ color: '#fff', fontSize: 28 }}>Upcoming Blockbusters</h2>
              <p style={{ color: '#94a3b8' }}>
                Advance ticket alerts for the most anticipated releases of 2026.
              </p>
            </div>
          </div>

          <div className="upcoming-grid">
            {UPCOMING_BLOCKBUSTERS.map((up) => (
              <div className="upcoming-card" key={up.id}>
                <img src={up.posterUrl} alt={up.title} className="upcoming-poster" />
                <div className="upcoming-info">
                  <div>
                    <span className="upcoming-release-badge">
                      <Calendar size={11} />
                      {up.releaseText}
                    </span>
                    <h4 className="upcoming-title" title={up.title}>
                      {up.title}
                    </h4>
                    <div className="upcoming-genre">{up.genre}</div>
                  </div>

                  <button
                    type="button"
                    className="upcoming-notify-btn"
                    onClick={() => handleNotifyUpcoming(up)}
                  >
                    <Bell size={13} />
                    <span>Notify Me</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Exclusive Privileges & Offers */}
        <section className="offers-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Exclusive Privileges</span>
              <h2 style={{ color: '#fff', fontSize: 28 }}>Coupons & Lounge Benefits</h2>
              <p style={{ color: '#94a3b8' }}>
                Use these discount codes during simulated checkout to save on tickets and gourmet dining.
              </p>
            </div>
          </div>

          <div className="offers-grid">
            <div className="offer-card">
              <div>
                <span className="hero-rating-pill" style={{ marginBottom: 10 }}>NEW MEMBER SPECIAL</span>
                <h3 style={{ color: '#fff', fontSize: 18, margin: '8px 0 4px' }}>Flat 50% OFF</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                  Enjoy half-price tickets on your very first movie booking across all cinemas.
                </p>
              </div>

              <div className="offer-code-pill">
                <span className="offer-code-text">WELCOME50</span>
                <button
                  type="button"
                  className="offer-copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText('WELCOME50')
                    if (notify) notify('Copied WELCOME50 to clipboard!', 'success')
                  }}
                >
                  <Tag size={12} />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            <div className="offer-card">
              <div>
                <span className="hero-rating-pill" style={{ marginBottom: 10 }}>IMAX CELEBRATION</span>
                <h3 style={{ color: '#fff', fontSize: 18, margin: '8px 0 4px' }}>₹150 Flat Discount</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                  Valid on all IMAX Laser 3D and 70mm screenings booked 24 hours in advance.
                </p>
              </div>

              <div className="offer-code-pill">
                <span className="offer-code-text">IMAX2026</span>
                <button
                  type="button"
                  className="offer-copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText('IMAX2026')
                    if (notify) notify('Copied IMAX2026 to clipboard!', 'success')
                  }}
                >
                  <Tag size={12} />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            <div className="offer-card">
              <div>
                <span className="hero-rating-pill" style={{ marginBottom: 10 }}>GOURMET LOUNGE</span>
                <h3 style={{ color: '#fff', fontSize: 18, margin: '8px 0 4px' }}>Free Snack Combo</h3>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                  Complimentary artisanal truffle popcorn and chilled beverage with Recliner seats.
                </p>
              </div>

              <div className="offer-code-pill">
                <span className="offer-code-text">RECLINERVIP</span>
                <button
                  type="button"
                  className="offer-copy-btn"
                  onClick={() => {
                    navigator.clipboard.writeText('RECLINERVIP')
                    if (notify) notify('Copied RECLINERVIP to clipboard!', 'success')
                  }}
                >
                  <Tag size={12} />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* High-Contrast Interactive Luxury Trailer Modal */}
      {selectedTrailerMovie && (
        <TrailerModal
          movie={selectedTrailerMovie}
          onClose={() => setSelectedTrailerMovie(null)}
          onBookNow={(movie) => handleBookMovie(movie)}
        />
      )}
    </div>
  )
}

export function MoviesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [movies, setMovies] = useState([])
  const [meta, setMeta] = useState(null)
  const [state, setState] = useState({ loading: true, error: '' })

  const fetchMovies = (params = {}) => {
    setState({ loading: true, error: '' })
    movieApi.list({ limit: 100, ...params })
      .then((response) => {
        setMovies(response.data || [])
        setMeta(response.meta)
      })
      .catch((error) => setState({ loading: false, error: getApiError(error) }))
      .finally(() => setState((current) => ({ ...current, loading: false })))
  }

  useEffect(() => {
    fetchMovies()
  }, [])

  // Keep search input in sync if URL search parameter changes
  useEffect(() => {
    const queryInUrl = searchParams.get('search')
    if (queryInUrl !== null && queryInUrl !== searchQuery) {
      setSearchQuery(queryInUrl)
    }
  }, [searchParams])

  // Real-time filtering by title, genre, and language
  const filteredMovies = useMemo(() => {
    if (!searchQuery.trim()) return movies
    const q = searchQuery.toLowerCase().trim()
    return movies.filter((m) =>
      (m.title && m.title.toLowerCase().includes(q)) ||
      (m.genre && m.genre.toLowerCase().includes(q)) ||
      (m.language && m.language.toLowerCase().includes(q)) ||
      (m.description && m.description.toLowerCase().includes(q))
    )
  }, [movies, searchQuery])

  const submit = (event) => {
    event.preventDefault()
    const next = searchQuery.trim()
    next ? setSearchParams({ search: next }) : setSearchParams({})
  }

  return (
    <div className="container">
      <div className="page-intro">
        <div>
          <span className="eyebrow">Browse the programme</span>
          <h1>Movies</h1>
          <p>Pick a story, then we’ll find the right showtime for you.</p>
        </div>
        <form className="search-form" onSubmit={submit}>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search title, genre or language"
            aria-label="Search movies"
            className="movies-search-input"
            style={{ color: '#ffffff', background: '#121216', caretColor: '#f59e0b' }}
          />
          <button className="button button-dark" type="submit">Search</button>
        </form>
      </div>

      {state.loading ? (
        <LoadingScreen label="Loading movies" />
      ) : state.error ? (
        <ErrorState message={state.error} onRetry={() => fetchMovies()} />
      ) : movies.length ? (
        <>
          <div className="results-line">
            <span>{filteredMovies.length} {filteredMovies.length === 1 ? 'title' : 'titles'}</span>
            {searchQuery && (
              <button
                className="clear-button"
                onClick={() => {
                  setSearchQuery('')
                  setSearchParams({})
                }}
              >
                Clear search ×
              </button>
            )}
          </div>
          {filteredMovies.length > 0 ? (
            <div className="movie-grid movie-grid-wide">
              {filteredMovies.map((movie) => <MovieCard movie={movie} key={movie.id} />)}
            </div>
          ) : (
            <EmptyState
              title="No movies found"
              message={`No titles found matching "${searchQuery}". Try a different title, genre, or clear the search.`}
            />
          )}
        </>
      ) : (
        <EmptyState title="No movies found" message="Try a different search or check back soon." />
      )}
    </div>
  )
}

export function MovieDetailsPage() {
  const { movieId } = useParams()
  const navigate = useNavigate()
  const [movie, setMovie] = useState(null)
  const [shows, setShows] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })
  const [selectedTrailerMovie, setSelectedTrailerMovie] = useState(null)

  useEffect(() => {
    Promise.all([movieApi.get(movieId), catalogApi.shows({ movieId })])
      .then(([movieResponse, showResponse]) => {
        setMovie(movieResponse.data.movie)
        setShows(showResponse.data || [])
      })
      .catch((error) => setState({ loading: false, error: getApiError(error) }))
      .finally(() => setState((current) => ({ ...current, loading: false })))
  }, [movieId])

  if (state.loading) return <LoadingScreen label="Loading movie details" />
  if (state.error) return <div className="container"><ErrorState message={state.error} /></div>

  return (
    <div className="container">
      <BackLink to="/movies">Back to movies</BackLink>
      <section className="detail-hero">
        <Poster movie={movie} large />
        <div className="detail-copy">
          <span className="eyebrow">{movie.genre} · {movie.language}</span>
          <h1>{movie.title}</h1>
          <p className="lead">{movie.description || 'A new story is waiting on the big screen.'}</p>
          <div className="detail-facts">
            <span>{movie.durationMin} min</span>
            <span>{movie.releaseDate ? formatDate(movie.releaseDate) : 'Release date TBA'}</span>
            <span>{movie.isActive ? 'Now showing' : 'Not currently active'}</span>
          </div>
          <div style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="hero-btn-trailer"
              onClick={() => setSelectedTrailerMovie(movie)}
            >
              <Play size={15} />
              <span>Watch Trailer</span>
            </button>
          </div>
        </div>
      </section>
      <section className="shows-section">
        <SectionHeading eyebrow="Find your time" title="Choose a showtime" copy="Select a show to see its live seat map." />
        {shows.length ? <ShowList shows={shows} /> : <EmptyState title="No shows scheduled" message="There are no active showtimes for this movie yet." />}
      </section>

      {selectedTrailerMovie && (
        <TrailerModal
          movie={selectedTrailerMovie}
          onClose={() => setSelectedTrailerMovie(null)}
          onBookNow={() => {
            setSelectedTrailerMovie(null)
            if (shows.length > 0) {
              navigate(`/shows/${shows[0].id}/seats`)
            }
          }}
        />
      )}
    </div>
  )
}

export function ShowsPage() {
  const [searchParams] = useSearchParams()
  const movieId = searchParams.get('movieId')
  const [shows, setShows] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })

  useEffect(() => {
    catalogApi.shows(movieId ? { movieId } : {})
      .then((response) => setShows(response.data || []))
      .catch((error) => setState({ loading: false, error: getApiError(error) }))
      .finally(() => setState((current) => ({ ...current, loading: false })))
  }, [movieId])

  if (state.loading) return <LoadingScreen label="Finding showtimes" />

  return (
    <div className="container">
      <div className="page-intro">
        <div>
          <span className="eyebrow">The next scene</span>
          <h1>Showtimes</h1>
          <p>{movieId ? 'Choose a time, then choose your seat.' : 'Every active showtime in one place.'}</p>
        </div>
        <Link className="button button-ghost" to="/movies">Change movie</Link>
      </div>
      {state.error ? (
        <ErrorState message={state.error} />
      ) : shows.length ? (
        <ShowList shows={shows} />
      ) : (
        <EmptyState title="No showtimes yet" message="Try another movie or come back later." />
      )}
    </div>
  )
}

function ShowList({ shows }) {
  const safeShows = Array.isArray(shows) ? shows : []
  return (
    <div className="show-list">
      {safeShows.map((show) => (
        <Link to={`/shows/${show.id}/seats`} className="show-row" key={show.id}>
          <div className="show-date">
            <strong>{new Date(show.startTime).toLocaleDateString('en-IN', { weekday: 'short' })}</strong>
            <span>{new Date(show.startTime).getDate()}</span>
          </div>
          <div className="show-main">
            <strong>{formatTime(show.startTime)}</strong>
            <span>{show.screen?.theater?.name || 'Theater'} · {show.screen?.name || 'Screen'}</span>
          </div>
          <div className="show-meta">
            <span>{show.language}</span>
            <strong>{formatMoney(show.basePrice)}</strong>
          </div>
          <span className="show-arrow">→</span>
        </Link>
      ))}
    </div>
  )
}

export function SeatSelectionPage({ notify }) {
  const { showId } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  // Data State
  const [show, setShow] = useState(null)
  const [seats, setSeats] = useState([])
  const [selected, setSelected] = useState([])
  const [movies, setMovies] = useState([])
  const [activeMovie, setActiveMovie] = useState(null)
  const [movieShows, setMovieShows] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })

  // UI Interactive State
  const [activeLocation, setActiveLocation] = useState('Mumbai • Palladium Luxury Mall')
  const [selectedDateIndex, setSelectedDateIndex] = useState(0)
  const [selectedTime, setSelectedTime] = useState('17:30')
  const [activePovSeat, setActivePovSeat] = useState(null)
  const [is2dModalOpen, setIs2dModalOpen] = useState(false)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [activePaymentTab, setActivePaymentTab] = useState('upi')
  const [upiId, setUpiId] = useState('alex@okhdfcbank')
  const [selectedBank, setSelectedBank] = useState('HDFC')
  const [cardData, setCardData] = useState({
    number: '4532 •••• •••• 8821',
    name: 'Alex Morgan',
    expiry: '12/28',
    cvv: '•••',
  })
  const [submittingHold, setSubmittingHold] = useState(false)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [isCarouselCollapsed, setIsCarouselCollapsed] = useState(false)
  const [heldBooking, setHeldBooking] = useState(null)
  const [confirmedBooking, setConfirmedBooking] = useState(null)
  const [holdSecondsRemaining, setHoldSecondsRemaining] = useState(600)

  const carouselTrackRef = useRef(null)
  const scrollCarousel = (direction) => {
    if (carouselTrackRef.current) {
      carouselTrackRef.current.scrollBy({ left: 260 * direction, behavior: 'smooth' })
    }
  }

  // Load active show and seats
  const loadShowData = (id) => {
    const cleanId = String(id || showId).trim().replace(/\s+/g, '-')
    setState({ loading: true, error: '' })
    Promise.all([catalogApi.show(cleanId), catalogApi.showSeats(cleanId)])
      .then(([showResponse, seatResponse]) => {
        const currentShow = showResponse?.data?.show || showResponse?.show || showResponse?.data
        setShow(currentShow || null)
        setActiveMovie(currentShow?.movie || null)
        setSeats(Array.isArray(seatResponse?.data) ? seatResponse.data : Array.isArray(seatResponse) ? seatResponse : [])
        setSelected([])
        setActivePovSeat(null)
      })
      .catch((error) => setState({ loading: false, error: getApiError(error) }))
      .finally(() => setState((current) => ({ ...current, loading: false })))
  }

  useEffect(() => {
    loadShowData(showId)
  }, [showId])

  // Load carousel movies
  useEffect(() => {
    movieApi.list({ limit: 12 })
      .then((res) => {
        setMovies(Array.isArray(res?.data) ? res.data : [])
      })
      .catch((err) => {
        console.warn('Could not load carousel movies:', err)
        setMovies([])
      })
  }, [])

  // Load shows for active movie
  useEffect(() => {
    if (!activeMovie?.id) return
    catalogApi.shows({ movieId: activeMovie.id })
      .then((res) => {
        setMovieShows(Array.isArray(res?.data) ? res.data : [])
      })
      .catch((err) => {
        console.warn('Could not load shows for movie:', err)
        setMovieShows([])
      })
  }, [activeMovie?.id])

  // 10-Minute Hold Timer
  useEffect(() => {
    if (!heldBooking) return
    const timer = setInterval(() => {
      setHoldSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [heldBooking])

  // Rows grouping for 2D matrix
  const rows = useMemo(() => (Array.isArray(seats) ? seats : []).reduce((groups, showSeat) => {
    const row = showSeat.seat?.rowLabel || '?'
    groups[row] ||= []
    groups[row].push(showSeat)
    return groups
  }, {}), [seats])

  const toggleSeat = (seat) => {
    if (seat.status !== 'AVAILABLE') return
    const seatIdToMatch = seat.showSeatId || seat.id
    const isAlreadySelected = selected.some(
      (item) => (item.showSeatId || item.id) === seatIdToMatch
    )
    if (isAlreadySelected) {
      setSelected((curr) => curr.filter((item) => (item.showSeatId || item.id) !== seatIdToMatch))
    } else {
      if (selected.length >= 10) {
        notify('Maximum 10 seats allowed per reservation.', 'error')
        return
      }
      const matched = (seats || []).find(
        (s) =>
          (s.seat?.rowLabel === seat.seat?.rowLabel && Number(s.seat?.seatNumber) === Number(seat.seat?.seatNumber)) ||
          s.id === seat.id ||
          s.id === seat.showSeatId
      )
      const seatObj = {
        ...seat,
        id: matched?.id || seat.id,
        showSeatId: matched?.id || seat.showSeatId || seat.id,
        seatId: matched?.seatId || matched?.seat?.id || seat.seatId || seat.seat?.id,
        price: matched?.price ? Number(matched.price) : Number(seat.price || 250),
      }
      setSelected((curr) => [...curr, seatObj])
      // Trigger 3D camera POV fly-through
      setActivePovSeat(seatObj)
    }
  }

  // Price calculations
  const subtotal = useMemo(() => {
    return selected.reduce((sum, seat) => sum + Number(seat.price), 0)
  }, [selected])
  const convenienceFee = selected.length * 30
  const gstTax = Math.round(convenienceFee * 0.18)
  const totalAmount = subtotal + convenienceFee + gstTax

  const minutes = Math.floor(holdSecondsRemaining / 60)
  const seconds = holdSecondsRemaining % 60
  const formattedTimer = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  // Razorpay Checkout Lifecycle Execution
  const launchRazorpayCheckout = async (holdInfo, targetShowId) => {
    const activeHold = holdInfo || heldBooking
    if (!activeHold) return
    const activeBookingId = activeHold.bookingId || activeHold.id
    const activeHoldToken = activeHold.holdToken
    const cleanShowId = String(targetShowId || show?.id || showId).trim().replace(/\s+/g, '-')

    setSubmittingPayment(true)
    try {
      const loadScript = () => {
        return new Promise((resolve) => {
          if (window.Razorpay) return resolve(true)
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.onload = () => resolve(true)
          script.onerror = () => resolve(false)
          document.body.appendChild(script)
        })
      }

      await loadScript()

      // Step B: Call /payments/razorpay/create-order
      const orderRes = await paymentApi.createRazorpayOrder({
        bookingId: activeBookingId,
        showId: cleanShowId,
        seatIds: selected.map((s) => s.seatId || s.seat?.id || s.id),
        showSeatIds: selected.map((s) => s.showSeatId || s.id),
        totalAmount,
      })

      const orderData = orderRes.data || orderRes
      const orderId = orderData.orderId || orderRes.orderId
      const amount = orderData.amount || orderRes.amount || Math.round(totalAmount * 100)
      const currency = orderData.currency || orderRes.currency || 'INR'
      const keyId = orderData.keyId || orderData.key || orderRes.key || 'rzp_test_YourTestKeyIdHere'

      if (!window.Razorpay) {
        // Fallback for sandboxed / offline test environment
        const verifyRes = await paymentApi.verifyRazorpayPayment({
          bookingId: activeBookingId,
          holdToken: activeHoldToken,
          showId: cleanShowId,
          selectedSeats: selected.map((s) => `${s.seat?.rowLabel || ''}${s.seat?.seatNumber || ''}`),
          razorpay_order_id: orderId || `order_test_${Date.now()}`,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: 'mock_signature_test',
        })
        const finalBooking = verifyRes.booking || verifyRes.data?.booking || {
          bookingNumber: verifyRes.bookingReference || verifyRes.data?.bookingReference || activeHold.bookingNumber,
          status: 'CONFIRMED',
          bookingSeats: selected,
          totalAmount: amount ? amount / 100 : totalAmount,
        }
        setConfirmedBooking(finalBooking)
        setIsPaymentModalOpen(true)
        notify('🎉 Congratulations! Your seat is booked', 'success')
        return
      }

      // Step C: Open new window.Razorpay(options)
      const options = {
        key: keyId,
        amount,
        currency,
        name: 'SeatLock Cinema Lounge',
        description: `Auditorium 01 Reservation · ${activeMovie?.title || 'Cinema'}`,
        order_id: orderId,
        prefill: {
          name: user?.name || 'Customer',
          email: user?.email || 'customer@example.com',
          contact: '9876543210',
        },
        theme: {
          color: '#e11d48',
        },
        handler: async (response) => {
          try {
            // Verify on backend
            const verifyRes = await paymentApi.verifyRazorpayPayment({
              bookingId: activeBookingId,
              holdToken: activeHoldToken,
              showId: cleanShowId,
              selectedSeats: selected.map((s) => `${s.seat?.rowLabel || ''}${s.seat?.seatNumber || ''}`),
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || 'mock_signature_test',
            })
            const finalBooking = verifyRes.booking || verifyRes.data?.booking || {
              bookingNumber: verifyRes.bookingReference || verifyRes.data?.bookingReference || activeHold.bookingNumber,
              status: 'CONFIRMED',
              bookingSeats: selected,
              totalAmount: amount ? amount / 100 : totalAmount,
            }
            setConfirmedBooking(finalBooking)
            setIsPaymentModalOpen(true)
            notify('🎉 Congratulations! Your seat is booked', 'success')
          } catch (verifyErr) {
            notify(getApiError(verifyErr), 'error')
          } finally {
            setSubmittingPayment(false)
          }
        },
        modal: {
          ondismiss: () => {
            setSubmittingPayment(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (failRes) => {
        notify(`Razorpay payment failed: ${failRes.error?.description || 'Declined'}`, 'error')
        setSubmittingPayment(false)
      })

      rzp.open()
    } catch (error) {
      notify(getApiError(error), 'error')
      setSubmittingPayment(false)
    }
  }

  // Step 4: Continue to Payment (Call backend holdSeats API & trigger Razorpay)
  const handleContinueToPayment = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/shows/${showId}/seats` } })
      return
    }
    if (!selected.length) {
      notify('Please select at least one seat.', 'error')
      return
    }

    setSubmittingHold(true)
    const cleanShowId = String(show?.id || showId).trim().replace(/\s+/g, '-')

    try {
      // Step A: Call /seats/hold with sanitized show UUID
      const response = await catalogApi.holdSeats(cleanShowId, {
        showId: cleanShowId,
        seatIds: selected.map((s) => s.seatId || s.seat?.id || s.id),
        showSeatIds: selected.map((s) => s.showSeatId || s.id),
        strategy: 'PESSIMISTIC',
      })
      const holdData = response.data || response
      setHeldBooking(holdData)
      setHoldSecondsRemaining(600)
      setIsPaymentModalOpen(true)
      notify('Seats locked successfully for 10 minutes!', 'success')

      // Trigger Razorpay standard checkout popup
      await launchRazorpayCheckout(holdData, cleanShowId)
    } catch (error) {
      notify(getApiError(error), 'error')
      if (error.response?.status === 409) {
        loadShowData(cleanShowId)
      }
    } finally {
      setSubmittingHold(false)
    }
  }

  // Primary drawer button handler
  const handleRazorpayPayment = async () => {
    await launchRazorpayCheckout(heldBooking, show?.id || showId)
  }

  // Switching movie from bottom carousel
  const handleSelectMovie = (movie) => {
    setActiveMovie(movie)
    catalogApi.shows({ movieId: movie.id })
      .then((res) => {
        const movieShowsList = res.data || []
        setMovieShows(movieShowsList)
        if (movieShowsList.length > 0) {
          navigate(`/shows/${movieShowsList[0].id}/seats`, { replace: true })
        } else {
          notify(`No scheduled shows found for ${movie.title}. Showing 3D screen view.`, 'info')
        }
      })
      .catch((err) => console.warn(err))
  }

  if (state.loading) return <LoadingScreen label="Entering LUMIÈRE 2026 Auditorium" />
  if (state.error) return <div className="container"><ErrorState message={state.error} onRetry={() => loadShowData(showId)} /></div>

  const dates = [
    { label: 'TODAY', date: '25 OCT' },
    { label: 'TOMORROW', date: '26 OCT' },
    { label: 'MON', date: '27 OCT' },
    { label: 'TUE', date: '28 OCT' },
  ]

  const times = ['14:00', '17:30', '20:45', '23:00']

  return (
    <div className="lumiere-cinema-page">
      {/* 1. Top Navigation Bar */}
      <header className="lumiere-top-navbar">
        <div className="lumiere-nav-left">
          <Link to="/" className="lumiere-brand-anchor">
            <div className="brand-gem">
              <Sparkles size={16} />
            </div>
            <div className="brand-text-block">
              <span className="brand-name">LUMIÈRE CINEMA LOUNGE</span>
              <small className="brand-tagline">2026 SPATIAL EXPERIENCE</small>
            </div>
          </Link>

          <div className="location-dropdown-wrapper">
            <MapPin size={13} className="location-icon" />
            <select
              className="location-select"
              value={activeLocation}
              onChange={(e) => setActiveLocation(e.target.value)}
            >
              <option value="Mumbai • Palladium Luxury Mall">Mumbai • Palladium Luxury Mall</option>
              <option value="Delhi • Ambience Director's Cut">Delhi • Ambience Director's Cut</option>
              <option value="Bengaluru • Orion Gold Class">Bengaluru • Orion Gold Class</option>
              <option value="Hyderabad • Inorbit Lounge">Hyderabad • Inorbit Lounge</option>
            </select>
          </div>
        </div>

        <div className="lumiere-nav-center">
          <div className="screen-spec-pill">
            <span className="pulse-dot" />
            <span>AUDITORIUM 01 • DOLBY ATMOS 4K LASER</span>
          </div>
        </div>

        <div className="lumiere-nav-right">
          <Link to="/movies" className="hud-action-btn" style={{ textDecoration: 'none' }}>
            <Film size={14} />
            <span>All Movies</span>
          </Link>

          {user ? (
            <div className="nav-user-pill">
              <div className="user-avatar-circle">{user.name?.charAt(0) || 'U'}</div>
              <span>Hi, {user.name?.split(' ')[0]}</span>
              <button
                type="button"
                onClick={logout}
                style={{ background: 'transparent', border: 0, color: '#f59e0b', cursor: 'pointer', fontSize: '11px', fontWeight: 700 }}
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link to="/login" className="nav-auth-btn">
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* 2. Main Stage (Two-Column Sibling Layout: 3D Canvas Left, Dedicated Booking Panel Right) */}
      <div className="lumiere-stage-layout">
        {/* Left Section: 3D WebGL Cinema Auditorium (~70% width) */}
        <div className="lumiere-canvas-pane">
          <CinemaHall3D
            show={show}
            movie={activeMovie}
            seats={seats}
            selectedSeats={selected}
            activePovSeat={activePovSeat}
            onToggleSeat={toggleSeat}
            onProceed={handleContinueToPayment}
            onSwitchTo2D={() => setIs2dModalOpen(true)}
            hideDock={true}
            hideHeader={false}
          />

          {/* Left-Bottom Floating Movie Cards Carousel (contained cleanly inside canvas pane) */}
          <div className={`lumiere-floating-carousel ${isCarouselCollapsed ? 'collapsed' : ''}`}>
            <div className="floating-carousel-header">
              <div className="carousel-title-row">
                <span className="live-reel-dot" />
                <span className="carousel-title">NOW PLAYING</span>
                <span className="carousel-badge">{movies.length} FILMS</span>
              </div>
              <div className="carousel-nav-arrows">
                <button
                  type="button"
                  className="carousel-arrow-btn"
                  onClick={() => setIsCarouselCollapsed(!isCarouselCollapsed)}
                  title={isCarouselCollapsed ? 'Expand carousel' : 'Minimize carousel'}
                >
                  {isCarouselCollapsed ? '▲' : '▼'}
                </button>
                {!isCarouselCollapsed && (
                  <>
                    <button
                      type="button"
                      className="carousel-arrow-btn"
                      onClick={() => scrollCarousel(-1)}
                      title="Previous movies"
                    >
                      <ChevronLeft size={13} />
                    </button>
                    <button
                      type="button"
                      className="carousel-arrow-btn"
                      onClick={() => scrollCarousel(1)}
                      title="Next movies"
                    >
                      <ChevronRight size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {!isCarouselCollapsed && (
              <div className="floating-carousel-track" ref={carouselTrackRef}>
                {movies.map((m) => {
                  const isActive = (activeMovie?.id === m.id) || (show?.movieId === m.id)
                  return (
                    <div
                      key={m.id}
                      className={`floating-movie-card ${isActive ? 'active' : ''}`}
                      onClick={() => handleSelectMovie(m)}
                    >
                      {isActive && <span className="playing-badge">PLAYING</span>}
                      <div className="card-poster-frame">
                        {m.posterUrl ? (
                          <img src={m.posterUrl} alt={m.title} className="card-poster-img" />
                        ) : (
                          <div className="card-poster-placeholder">
                            <Film size={20} color="#f59e0b" />
                          </div>
                        )}
                      </div>
                      <div className="card-info">
                        <h4 className="card-movie-title">{m.title}</h4>
                        <div className="card-meta-line">
                          <span>{m.durationMin || 160}m</span>
                          <span>•</span>
                          <span>{m.genre || 'Cinema'}</span>
                        </div>
                        <span className="card-lang-pill">{m.language || 'ORIGINAL'}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Dedicated Non-Overlapping Booking Panel (~30% width / 420px) */}
        <aside className="lumiere-booking-drawer">
          <div className="drawer-mobile-handle" />
          <div className="drawer-scroll-body">
            {/* Movie Details Header */}
            <div className="drawer-movie-header">
              <div className="movie-meta-tags">
                <span className="rating-badge">UA 16+</span>
                <span className="meta-spec-text">{activeMovie?.durationMin || 166} MIN</span>
                <span className="meta-spec-text">•</span>
                <span className="meta-spec-text">DOLBY ATMOS 7.1</span>
                <span className="meta-spec-text">•</span>
                <span className="meta-spec-text">4K LASER</span>
              </div>
              <h2 className="drawer-movie-title">{activeMovie?.title || show?.movie?.title}</h2>
              <p className="drawer-movie-sub">
                {activeMovie?.genre || 'Feature Cinema'} · {activeMovie?.language || 'English / Hindi'} · {show?.screen?.theater?.name || 'Grand Cinema'} ({show?.screen?.name || 'Screen 1'})
              </p>
            </div>

            {/* Date & Showtime Picker */}
            <div className="drawer-picker-section">
              <div className="picker-section-title">
                <span>Select Experience Date</span>
                <Clock size={12} />
              </div>
              <div className="date-pill-track">
                {dates.map((d, idx) => (
                  <button
                    key={d.date}
                    type="button"
                    className={`date-btn ${selectedDateIndex === idx ? 'active' : ''}`}
                    onClick={() => setSelectedDateIndex(idx)}
                  >
                    <div>{d.label}</div>
                    <div>{d.date}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="drawer-picker-section">
              <div className="picker-section-title">
                <span>Showtime Slots</span>
                <span>AUDI 01</span>
              </div>
              <div className="showtime-pill-grid">
                {times.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`time-btn ${selectedTime === t ? 'active' : ''}`}
                    onClick={() => setSelectedTime(t)}
                  >
                    <strong>{t}</strong>
                    <small>ATMOS 3D</small>
                  </button>
                ))}
              </div>
            </div>

            {/* Seat Selector Section */}
            <div className="drawer-picker-section">
              <div className="picker-section-title">
                <span>Seating & Perspectives</span>
                <span>{selected.length}/10 SELECTED</span>
              </div>

              {/* "Your seat, your view" 2D Modal Trigger */}
              <button
                type="button"
                className="pov-trigger-card"
                onClick={() => setIs2dModalOpen(true)}
              >
                <div className="pov-trigger-info">
                  <strong>👁️ Your Seat, Your View</strong>
                  <small>Open 2D Seat Matrix & fly to camera POV</small>
                </div>
                <span className="pov-trigger-arrow">→</span>
              </button>

              {/* Selected Seats Pills */}
              <div className="selected-seat-badges-row" style={{ marginTop: '12px' }}>
                {selected.length === 0 ? (
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Click any armchair in 3D or open 2D matrix to pick seats.
                  </span>
                ) : (
                  selected.map((s) => (
                    <div key={s.id} className="seat-drawer-pill">
                      <Eye
                        size={12}
                        style={{ cursor: 'pointer', color: '#f59e0b' }}
                        onClick={() => setActivePovSeat(s)}
                        title="Fly 3D camera to this seat's POV"
                      />
                      <span>
                        Row {s.seat?.rowLabel}{s.seat?.seatNumber} · ₹{s.price}
                      </span>
                      <button
                        type="button"
                        className="pill-del"
                        onClick={() => toggleSeat(s)}
                        title="Remove seat"
                      >
                        ×
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* 10-Minute Hold Badge */}
              <div className="drawer-hold-badge" style={{ marginTop: '12px' }}>
                <span>🔒 Reserved hold duration:</span>
                <strong>{heldBooking ? formattedTimer : '10:00 MIN'}</strong>
              </div>
            </div>
          </div>

          {/* Price Breakdown & CTA Footer */}
          <div className="drawer-footer">
            <div className="price-line-row">
              <span>Tickets Subtotal ({selected.length} seats)</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="price-line-row">
              <span>Convenience & Booking Fee</span>
              <span>₹{convenienceFee}</span>
            </div>
            <div className="price-line-row">
              <span>Integrated GST (18%)</span>
              <span>₹{gstTax}</span>
            </div>
            <div className="price-line-row total-row">
              <span>Total Payable</span>
              <strong>₹{totalAmount}</strong>
            </div>

            <button
              type="button"
              className="drawer-cta-btn"
              onClick={handleContinueToPayment}
              disabled={selected.length === 0 || submittingHold}
            >
              {submittingHold ? (
                'Locking Seats Atomically...'
              ) : selected.length === 0 ? (
                'Select Seats in 3D to Continue'
              ) : (
                <>
                  <span>Lock Seats & Continue to Payment</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </aside>
      </div>

      {/* 5. 2D Mini-Map Seat Matrix Modal Overlay */}
      {is2dModalOpen && (
        <div className="seat-modal-backdrop" onClick={() => setIs2dModalOpen(false)}>
          <div className="seat-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="seat-modal-header">
              <div>
                <span className="eyebrow">AUDITORIUM 01</span>
                <h3 style={{ margin: '4px 0', fontSize: '20px', color: '#fff' }}>
                  2D Seat Matrix & Viewport Sync
                </h3>
                <small style={{ color: '#94a3b8' }}>
                  Clicking any seat syncs selection and flies 3D camera to its exact POV.
                </small>
              </div>
              <button
                type="button"
                className="seat-modal-close-btn"
                onClick={() => setIs2dModalOpen(false)}
              >
                ×
              </button>
            </div>

            <div className="seat-layout" style={{ background: '#080c0a', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="screen-label"><span>SCREEN DIRECTION</span></div>
              <div className="seat-map">
                {Object.entries(rows).map(([row, rowSeats]) => (
                  <div className="seat-row" key={row}>
                    <span className="row-label">{row}</span>
                    {rowSeats.map((seat) => {
                      const category = seat.seat?.category?.toLowerCase() || 'regular'
                      const isSelected = selected.some((item) => item.id === seat.id)
                      return (
                        <button
                          key={seat.id}
                          type="button"
                          className={`seat seat-${category} seat-${seat.status.toLowerCase()} ${isSelected ? 'seat-selected' : ''}`}
                          onClick={() => {
                            toggleSeat(seat)
                            setActivePovSeat(seat)
                          }}
                          disabled={seat.status !== 'AVAILABLE'}
                          title={`${row}${seat.seat?.seatNumber} · ${category.toUpperCase()} · ₹${seat.price} (${seat.status})`}
                        >
                          <span>{seat.seat?.seatNumber}</span>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>

              <div className="seat-legend" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                <span><i className="legend-dot available" />Available</span>
                <span><i className="legend-dot selected" />Selected</span>
                <span><i className="legend-dot unavailable" />Unavailable</span>
                <span className="legend-tier"><i className="tier-tag tier-regular" />Regular</span>
                <span className="legend-tier"><i className="tier-tag tier-premium" />Premium</span>
                <span className="legend-tier"><i className="tier-tag tier-recliner" />Recliner</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <div>
                <span style={{ font: '10px "DM Mono", monospace', color: '#f59e0b' }}>
                  {selected.length} SEATS SELECTED · TOTAL ₹{subtotal}
                </span>
              </div>
              <button
                type="button"
                className="button button-primary"
                onClick={() => setIs2dModalOpen(false)}
              >
                Done & View in 3D →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Luxury Simulated Payment Drawer / Modal Overlay */}
      {isPaymentModalOpen && (
        <div className="payment-modal-backdrop" onClick={() => !submittingPayment && setIsPaymentModalOpen(false)}>
          <div className="payment-modal-card" onClick={(e) => e.stopPropagation()}>
            {!confirmedBooking ? (
              <>
                <div className="payment-modal-header">
                  <div>
                    <span className="eyebrow">STEP 2 OF 2 · CHECKOUT LOUNGE</span>
                    <h3 style={{ margin: '4px 0', fontSize: '22px', color: '#fff' }}>
                      Complete Your Reservation
                    </h3>
                    <small style={{ color: '#94a3b8' }}>
                      Ref: {heldBooking?.bookingNumber || 'HOLD-TEMP'} · Seats locked for {formattedTimer}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="seat-modal-close-btn"
                    onClick={() => setIsPaymentModalOpen(false)}
                    disabled={submittingPayment}
                  >
                    ×
                  </button>
                </div>

                <div className="payment-recap" style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <span>MOVIE & SCREEN</span>
                    <strong style={{ color: '#fff' }}>{activeMovie?.title || show?.movie?.title}</strong>
                    <small style={{ display: 'block', color: '#94a3b8' }}>{show?.screen?.theater?.name} (Audi 01)</small>
                  </div>
                  <div>
                    <span>SEATS RESERVED</span>
                    <strong style={{ color: '#f59e0b' }}>
                      {selected.map((s) => `${s.seat?.rowLabel}${s.seat?.seatNumber}`).join(', ')}
                    </strong>
                  </div>
                  <div>
                    <span>TOTAL PAYABLE</span>
                    <strong className="payment-recap-amount">₹{totalAmount}</strong>
                  </div>
                </div>

                {/* Razorpay Test Mode Checkout */}
                <div className="razorpay-checkout-section" style={{ marginTop: '24px' }}>
                  <div className="razorpay-info-banner" style={{
                    padding: '16px 20px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                  }}>
                    <span style={{ fontSize: '28px' }}>💳</span>
                    <div>
                      <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '15px', fontWeight: 600 }}>
                        Razorpay Secure Gateway (Test Mode)
                      </h4>
                      <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '13px' }}>
                        Supports test Cards, UPI, Netbanking & Wallets with instant verification.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn-razorpay button button-primary"
                    style={{
                      width: '100%',
                      padding: '16px 24px',
                      fontSize: '16px',
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%)',
                      border: '1px solid #38bdf8',
                      boxShadow: '0 0 25px rgba(56, 189, 248, 0.35)',
                      borderRadius: '8px',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      cursor: submittingPayment ? 'not-allowed' : 'pointer',
                    }}
                    onClick={handleRazorpayPayment}
                    disabled={submittingPayment}
                  >
                    <CreditCard size={20} color="#38bdf8" />
                    <span>{submittingPayment ? 'Launching Razorpay...' : `Pay ₹${totalAmount} with Razorpay`}</span>
                  </button>

                  <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
                    🔒 256-bit SSL Encrypted · Instant Seat Lock & Ticket Generation
                  </p>
                </div>
              </>
            ) : (
              /* Digital Movie Ticket (On Success) */
              <div className="lumiere-ticket-success">
                <div className="congrats-banner">
                  <div className="congrats-icon-circle">🎉</div>
                  <h2 className="congrats-title">Congratulations! Your seat is booked</h2>
                  <p className="congrats-subtitle">
                    Booking Reference <span className="congrats-ref">{confirmedBooking?.bookingNumber || heldBooking?.bookingNumber}</span> confirmed.
                  </p>
                </div>

                <div className="cinema-ticket-card" style={{ width: '100%', margin: '0 auto' }}>
                  <div className="ticket-badge-banner">
                    <span className="ticket-brand">LUMIÈRE 2026 CINEMAS</span>
                    <span className="ticket-admit">OFFICIAL ADMIT TICKET</span>
                    <StatusPill status="CONFIRMED" />
                  </div>

                  <div className="ticket-main-grid">
                    <div className="ticket-movie-details">
                      <span className="eyebrow">{activeMovie?.language || 'Hindi'} · {activeMovie?.genre || 'Cinema'}</span>
                      <h2 className="ticket-movie-title" style={{ fontSize: '24px' }}>{activeMovie?.title || show?.movie?.title}</h2>
                      <p className="ticket-venue-info">
                        <strong>{show?.screen?.theater?.name || 'LUMIÈRE Palladium Lounge'}</strong>
                        <span>{show?.screen?.name || 'Auditorium 01'} (Dolby Atmos 4K Laser)</span>
                      </p>
                      <div className="ticket-time-block">
                        <div>
                          <span className="ticket-label">SHOW DATE</span>
                          <strong>{show?.startTime ? formatDate(show.startTime) : '25 OCT 2026'}</strong>
                        </div>
                        <div>
                          <span className="ticket-label">SHOWTIME</span>
                          <strong>{selectedTime || (show?.startTime ? formatTime(show.startTime) : '17:30')}</strong>
                        </div>
                        <div>
                          <span className="ticket-label">BOOKING REF</span>
                          <strong>{confirmedBooking?.bookingNumber || heldBooking?.bookingNumber}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="ticket-qr-section">
                      <QRCode
                        value={`SEATLOCK:${confirmedBooking?.bookingNumber || heldBooking?.bookingNumber}:${totalAmount}`}
                        size={120}
                      />
                      <span className="ticket-qr-caption">Entrance QR</span>
                    </div>
                  </div>

                  <div className="ticket-tear-line">
                    <span className="tear-notch left" />
                    <span className="tear-notch right" />
                  </div>

                  <div className="ticket-foot-grid">
                    <div className="ticket-seat-badges">
                      <span className="ticket-label">CONFIRMED SEATS ({selected.length || confirmedBooking?.bookingSeats?.length || 1})</span>
                      <div className="seats-tag-list">
                        {(confirmedBooking?.bookingSeats?.length ? confirmedBooking.bookingSeats : selected).map((s, idx) => {
                          const row = s.seat?.rowLabel || s.showSeat?.seat?.rowLabel || 'F'
                          const num = s.seat?.seatNumber || s.showSeat?.seat?.seatNumber || (idx + 1)
                          const cat = s.seat?.category || s.showSeat?.seat?.category || 'VIP'
                          return (
                            <span key={s.id || idx} className="seat-ticket-badge">
                              Row {row} - Seat {String(num).padStart(2, '0')}
                              <small> ({cat})</small>
                            </span>
                          )
                        })}
                      </div>
                    </div>

                    <div className="ticket-price-block">
                      <span className="ticket-label">TOTAL PAID</span>
                      <strong className="ticket-final-price">₹{totalAmount}</strong>
                      <small className="ticket-pay-status">
                        RAZORPAY · VERIFIED
                      </small>
                    </div>
                  </div>
                </div>

                <div className="ticket-actions-bar" style={{ marginTop: '24px' }}>
                  <button
                    type="button"
                    className="button button-dark ticket-print-btn"
                    onClick={() => window.print()}
                  >
                    🖨️ Download Ticket / Print
                  </button>
                  <Link
                    className="button button-primary"
                    to={confirmedBooking ? `/bookings/${confirmedBooking.id}` : '/bookings'}
                  >
                    View in My Bookings
                  </Link>
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={() => {
                      setIsPaymentModalOpen(false)
                      navigate('/')
                    }}
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export function BookingSummaryPage({ notify }) {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const show = state?.show
  const selectedSeats = state?.selectedSeats || []
  const total = selectedSeats.reduce((sum, seat) => sum + Number(seat.price), 0)

  if (!show || !selectedSeats.length) {
    return (
      <div className="container">
        <EmptyState
          title="Your selection has expired"
          message="Choose a show and seats to start a booking."
          action={<Link className="button button-primary" to="/movies">Browse movies</Link>}
        />
      </div>
    )
  }

  const createBooking = async () => {
    setSubmitting(true)
    try {
      const response = await bookingApi.create({
        showId: show.id,
        showSeatIds: selectedSeats.map((seat) => seat.id),
      })
      navigate('/payment', { state: { booking: response.data.booking, show } })
    } catch (error) {
      notify(getApiError(error), 'error')
      if (error.response?.status === 409) navigate(`/shows/${show.id}/seats`)
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div className="container narrow-container">
      <BackLink to={`/shows/${show.id}/seats`}>Back to seats</BackLink>
      <div className="checkout-header">
        <span className="eyebrow">Step 1 of 2</span>
        <h1>Review your booking</h1>
        <p>Seats are held for ten minutes once you continue to payment.</p>
      </div>
      <div className="summary-card">
        <div className="summary-movie">
          <Poster movie={show.movie} />
          <div>
            <span className="eyebrow">{show.movie?.title}</span>
            <h2>{formatDate(show.startTime)}</h2>
            <p>{formatTime(show.startTime)} · {show.screen?.theater?.name} · {show.screen?.name}</p>
          </div>
        </div>
        <div className="summary-line">
          <span>Seats</span>
          <strong>{selectedSeats.map((seat) => `${seat.seat.rowLabel}${seat.seat.seatNumber}`).join(', ')}</strong>
        </div>
        <div className="summary-line">
          <span>{selectedSeats.length} × tickets</span>
          <strong>{formatMoney(total)}</strong>
        </div>
        <div className="summary-total">
          <span>Total</span>
          <strong>{formatMoney(total)}</strong>
        </div>
        <button className="button button-primary button-wide" onClick={createBooking} disabled={submitting}>
          {submitting ? 'Holding seats...' : 'Continue to payment →'}
        </button>
      </div>
    </div>
  )
}

export function PaymentPage({ notify }) {
  const { state } = useLocation()
  const navigate = useNavigate()
  const booking = state?.booking
  const show = state?.show
  const [submitting, setSubmitting] = useState(false)

  // 10-Minute Hold Countdown Timer
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    if (!booking?.createdAt) return 600
    const elapsed = Math.floor((Date.now() - new Date(booking.createdAt).getTime()) / 1000)
    return Math.max(0, 600 - elapsed)
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  if (!booking) {
    return (
      <div className="container">
        <EmptyState
          title="No booking in progress"
          message="Choose seats before opening checkout."
          action={<Link className="button button-primary" to="/movies">Browse movies</Link>}
        />
      </div>
    )
  }

  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60
  const formattedTimer = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const isHoldExpired = remainingSeconds === 0

  const handleRazorpayCheckout = async () => {
    setSubmitting(true)
    try {
      const loadScript = () => {
        return new Promise((resolve) => {
          if (window.Razorpay) return resolve(true)
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          script.onload = () => resolve(true)
          script.onerror = () => resolve(false)
          document.body.appendChild(script)
        })
      }

      await loadScript()
      const orderRes = await paymentApi.createRazorpayOrder(booking.id)
      const { orderId, amount, currency, keyId, key } = orderRes.data

      if (!window.Razorpay) {
        // Fallback for sandboxed / offline test environment
        const verifyRes = await paymentApi.verifyRazorpayPayment({
          bookingId: booking.id,
          razorpay_order_id: orderId || `order_test_${Date.now()}`,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: 'mock_signature_test',
        })
        notify('🎉 Congratulations! Your seat is booked', 'success')
        navigate('/payment-success', {
          state: {
            booking: verifyRes.data.booking || booking,
            show: show || verifyRes.data.booking?.show,
            payment: verifyRes.data.payment,
          },
        })
        return
      }

      const rzp = new window.Razorpay({
        key: keyId || key || 'rzp_test_51NxTestDemoKey',
        amount,
        currency: currency || 'INR',
        name: 'SeatLock Cinema Lounge',
        description: `Reserved Booking ${booking.bookingNumber}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await paymentApi.verifyRazorpayPayment({
              bookingId: booking.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature || 'mock_signature_test',
            })
            notify('🎉 Congratulations! Your seat is booked', 'success')
            navigate('/payment-success', {
              state: {
                booking: verifyRes.data.booking || booking,
                show: show || verifyRes.data.booking?.show,
                payment: verifyRes.data.payment,
              },
            })
          } catch (verifyErr) {
            notify(getApiError(verifyErr), 'error')
          } finally {
            setSubmitting(false)
          }
        },
        prefill: {
          name: 'Alex Vance',
          email: 'testuser@seatlock.com',
          contact: '9876543210',
        },
        theme: {
          color: '#d72638',
        },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
      })

      rzp.on('payment.failed', (failRes) => {
        notify(`Razorpay payment failed: ${failRes.error?.description || 'Declined'}`, 'error')
        setSubmitting(false)
      })

      rzp.open()
    } catch (error) {
      notify(getApiError(error), 'error')
      setSubmitting(false)
    }
  }

  return (
    <div className="container narrow-container">
      <BackLink to={`/shows/${show?.id || booking.showId}/seats`}>Leave checkout</BackLink>
      
      <div className="checkout-header">
        <div className="checkout-badge-row">
          <span className="eyebrow">Step 2 of 2 · Secure Checkout</span>
          <div className={`hold-timer-badge ${remainingSeconds < 120 ? 'timer-urgent' : ''}`}>
            <span>⏳ Hold expires in:</span>
            <strong>{formattedTimer}</strong>
          </div>
        </div>
        <h1>Complete payment</h1>
        <p>Your seats are securely locked while you complete payment.</p>
      </div>

      {isHoldExpired && (
        <div className="state-card error-state" style={{ marginBottom: '24px' }}>
          <span className="state-icon">!</span>
          <h3>Seat Hold Expired</h3>
          <p>The 10-minute hold window has ended and your seats were released to the public pool.</p>
          <Link className="button button-primary" to={`/shows/${show?.id || booking.showId}/seats`}>Select Seats Again</Link>
        </div>
      )}

      <div className="payment-card">
        <div className="payment-recap">
          <div>
            <span>Booking ref</span>
            <strong>{booking.bookingNumber}</strong>
          </div>
          <div>
            <span>Movie / Venue</span>
            <strong>{show?.movie?.title || 'Cinema Ticket'} · {show?.screen?.name}</strong>
          </div>
          <div>
            <span>Amount payable</span>
            <strong className="payment-recap-amount">{formatMoney(booking.totalAmount)}</strong>
          </div>
        </div>

        {/* Pure Razorpay Gateway (Test Mode) */}
        <div className="razorpay-action-block" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="razorpay-info-banner" style={{
            padding: '16px 20px',
            borderRadius: '8px',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}>
            <span style={{ fontSize: '28px' }}>💳</span>
            <div>
              <h4 style={{ margin: 0, color: '#38bdf8', fontSize: '15px', fontWeight: 600 }}>
                Razorpay Secure Gateway (Test Mode)
              </h4>
              <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: '13px' }}>
                All test payment instruments (Cards, UPI, Netbanking) are accepted with real-time verification.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="button button-primary"
            style={{
              width: '100%',
              padding: '1.1rem 1.5rem',
              fontSize: '1.05rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%)',
              border: '1px solid #38bdf8',
              color: '#ffffff',
              boxShadow: '0 8px 25px rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              cursor: (submitting || isHoldExpired) ? 'not-allowed' : 'pointer',
              borderRadius: '8px',
            }}
            onClick={handleRazorpayCheckout}
            disabled={submitting || isHoldExpired}
          >
            <CreditCard size={20} color="#38bdf8" />
            <span>{submitting ? 'Connecting to Razorpay...' : `Pay ${formatMoney(booking.totalAmount)} with Razorpay`}</span>
          </button>
          <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: '#64748b' }}>
            🔒 256-bit SSL Encrypted · Instant Seat Lock & Ticket Generation
          </p>
        </div>
      </div>
    </div>
  )
}

export function PaymentSuccessPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const booking = state?.booking
  const show = state?.show || booking?.show
  const movie = show?.movie || booking?.movie
  const payment = state?.payment || booking?.payments?.[0]

  return (
    <div className="container narrow-container ticket-page-container">
      {/* Prominent Congratulations Banner */}
      <div className="congrats-banner">
        <div className="congrats-icon-circle">🎉</div>
        <h1 className="congrats-title">Congratulations! Your seat is booked</h1>
        <p className="congrats-subtitle">
          Booking Reference <span className="congrats-ref">{booking?.bookingNumber || 'BK-CONFIRMED'}</span> confirmed. Show this digital ticket at the cinema entrance.
        </p>
      </div>

      <div className="ticket-printable-wrapper">
        <div className="cinema-ticket-card">
          <div className="ticket-badge-banner">
            <span className="ticket-brand">SEATLOCK CINEMAS</span>
            <span className="ticket-admit">OFFICIAL ADMIT TICKET</span>
            <StatusPill status={booking?.status || 'CONFIRMED'} />
          </div>

          <div className="ticket-main-grid">
            <div className="ticket-movie-details">
              <span className="eyebrow">{movie?.language || 'Hindi'} · {movie?.genre || 'Cinema'}</span>
              <h1 className="ticket-movie-title">{movie?.title || 'Confirmed Booking'}</h1>
              <p className="ticket-venue-info">
                <strong>{show?.screen?.theater?.name || 'Grand Cinema Hall'}</strong>
                <span>{show?.screen?.name || 'Screen 1'} · {show?.screen?.theater?.city || 'Central City'}</span>
              </p>
              <div className="ticket-time-block">
                <div>
                  <span className="ticket-label">SHOW DATE</span>
                  <strong>{show?.startTime ? formatDate(show.startTime) : 'Today'}</strong>
                </div>
                <div>
                  <span className="ticket-label">TIME</span>
                  <strong>{show?.startTime ? formatTime(show.startTime) : 'Now Showing'}</strong>
                </div>
                <div>
                  <span className="ticket-label">BOOKING ID</span>
                  <strong>{booking?.bookingNumber || 'BK-CONFIRMED'}</strong>
                </div>
              </div>
            </div>

            <div className="ticket-qr-section">
              <QRCode
                value={`SEATLOCK:${booking?.bookingNumber}:${booking?.id}:${booking?.totalAmount}`}
                size={135}
              />
              <span className="ticket-qr-caption">Scan at Cinema Entrance</span>
            </div>
          </div>

          <div className="ticket-tear-line">
            <span className="tear-notch left" />
            <span className="tear-notch right" />
          </div>

          <div className="ticket-foot-grid">
            <div className="ticket-seat-badges">
              <span className="ticket-label">CONFIRMED SEATS ({booking?.bookingSeats?.length || 'Seats'})</span>
              <div className="seats-tag-list">
                {booking?.bookingSeats?.map((item) => (
                  <span key={item.id} className="seat-ticket-badge">
                    Row {item.showSeat?.seat?.rowLabel || 'F'} - Seat {String(item.showSeat?.seat?.seatNumber || '08').padStart(2, '0')}
                    <small> ({item.showSeat?.seat?.category || 'REG'})</small>
                  </span>
                )) || <span className="seat-ticket-badge">Seats Confirmed</span>}
              </div>
            </div>

            <div className="ticket-price-block">
              <span className="ticket-label">TOTAL PAID</span>
              <strong className="ticket-final-price">{formatMoney(booking?.totalAmount)}</strong>
              <small className="ticket-pay-status">
                RAZORPAY · VERIFIED
              </small>
            </div>
          </div>
        </div>
      </div>

      <div className="ticket-actions-bar">
        <button
          type="button"
          className="button button-dark ticket-print-btn"
          onClick={() => window.print()}
        >
          🖨️ Download Ticket / Print
        </button>
        <Link className="button button-primary" to={booking ? `/bookings/${booking.id}` : '/bookings'}>
          View in My Bookings
        </Link>
        <button
          type="button"
          className="button button-ghost"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}

export function PaymentFailedPage() {
  const { state } = useLocation()
  return (
    <div className="container narrow-container centered-state">
      <div className="failure-mark">×</div>
      <span className="eyebrow">Transaction Declined</span>
      <h1>Payment was not completed.</h1>
      <p>{state?.message || 'The issuing bank declined or timed out the transaction. Held seats were returned to the pool for other moviegoers.'}</p>
      <div className="hero-actions centered-actions">
        <Link className="button button-primary" to="/movies">Browse Movies & Re-book</Link>
        <Link className="text-link" to="/bookings">View My Bookings</Link>
      </div>
    </div>
  )
}

export function MyBookingsPage({ notify }) {
  const [bookings, setBookings] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })

  const fetchBookings = () => {
    setState({ loading: true, error: '' })
    bookingApi.mine()
      .then((response) => setBookings(response.data.bookings || []))
      .catch((error) => setState({ loading: false, error: getApiError(error) }))
      .finally(() => setState((current) => ({ ...current, loading: false })))
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  if (state.loading) return <LoadingScreen label="Loading your bookings" />

  return (
    <div className="container">
      <div className="page-intro">
        <div>
          <span className="eyebrow">Your cinema diary</span>
          <h1>My bookings</h1>
          <p>Everything you’ve booked, in one place.</p>
        </div>
        <Link className="button button-primary" to="/movies">Book a movie</Link>
      </div>
      {state.error ? (
        <ErrorState message={state.error} />
      ) : bookings.length ? (
        <div className="booking-list">
          {bookings.map((booking) => <BookingCard booking={booking} key={booking.id} />)}
        </div>
      ) : (
        <EmptyState
          title="No bookings yet"
          message="Your next night out starts with a movie."
          action={<Link className="button button-primary" to="/movies">Browse movies</Link>}
        />
      )}
    </div>
  )
}

function BookingCard({ booking }) {
  const movie = booking.show?.movie
  return (
    <Link className="booking-card" to={`/bookings/${booking.id}`}>
      <Poster movie={movie} />
      <div className="booking-card-main">
        <span className="eyebrow">{booking.bookingNumber}</span>
        <h2>{movie?.title || 'Movie booking'}</h2>
        <p>{formatDate(booking.show?.startTime)} · {formatTime(booking.show?.startTime)} · {booking.show?.screen?.theater?.name}</p>
        <div className="booking-card-foot">
          <StatusPill status={booking.status} />
          <strong>{formatMoney(booking.totalAmount)}</strong>
        </div>
      </div>
      <span className="show-arrow">→</span>
    </Link>
  )
}

export function BookingDetailsPage({ notify }) {
  const { bookingId } = useParams()
  const [booking, setBooking] = useState(null)
  const [state, setState] = useState({ loading: true, error: '' })
  const [cancelling, setCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [cancelFeedback, setCancelFeedback] = useState('')

  const fetchBooking = () => {
    setState({ loading: true, error: '' })
    bookingApi.get(bookingId)
      .then((response) => setBooking(response.data.booking))
      .catch((error) => setState({ loading: false, error: getApiError(error) }))
      .finally(() => setState((current) => ({ ...current, loading: false })))
  }

  useEffect(() => {
    fetchBooking()
  }, [bookingId])

  const handleCancelBooking = async () => {
    setCancelling(true)
    try {
      const res = await bookingApi.cancel(bookingId, 'User requested cancellation')
      const updatedBooking = res.data?.booking || res.data || { ...booking, status: 'CANCELLED' }
      setBooking(updatedBooking)
      const refundAmt = res.data?.refundAmount || booking?.totalAmount
      const refundToast = `Booking cancelled. ${formatMoney(refundAmt)} refund initiated.`
      setCancelFeedback(refundToast)
      setShowCancelConfirm(false)
      if (notify) {
        notify(refundToast, 'success')
      }
      fetchBooking()
    } catch (err) {
      const errMsg = getApiError(err)
      if (notify) {
        notify(errMsg, 'error')
      } else {
        alert(errMsg)
      }
    } finally {
      setCancelling(false)
    }
  }

  if (state.loading) return <LoadingScreen label="Loading booking details" />
  if (state.error) return <div className="container"><ErrorState message={state.error} /></div>

  const movie = booking.show?.movie
  const isConfirmed = booking.status === 'CONFIRMED'
  const isCancelled = booking.status === 'CANCELLED'

  return (
    <div className="container narrow-container">
      <BackLink to="/bookings">Back to bookings</BackLink>
      
      <div className="booking-detail-head">
        <div>
          <span className="eyebrow">{booking.bookingNumber}</span>
          <h1>{movie?.title || 'Booking details'}</h1>
          <p>{formatDate(booking.show?.startTime)} · {formatTime(booking.show?.startTime)} · {booking.show?.screen?.theater?.name}</p>
        </div>
        <StatusPill status={booking.status} />
      </div>

      {cancelFeedback && (
        <div className="toast toast-success" style={{ position: 'static', marginBottom: '20px', width: '100%' }}>
          <span>{cancelFeedback}</span>
        </div>
      )}

      <div className="detail-card">
        <div className="summary-line">
          <span>Venue</span>
          <strong>{booking.show?.screen?.theater?.name} · {booking.show?.screen?.name} ({booking.show?.screen?.theater?.city})</strong>
        </div>
        <div className="summary-line">
          <span>Seats Reserved</span>
          <strong>
            {booking.bookingSeats?.map((item) => `${item.showSeat?.seat?.rowLabel}${item.showSeat?.seat?.seatNumber} (${item.showSeat?.seat?.category || 'REG'})`).join(', ')}
          </strong>
        </div>
        <div className="summary-line">
          <span>Booking Status</span>
          <StatusPill status={booking.status} />
        </div>
        <div className="summary-line">
          <span>Payment Status</span>
          <StatusPill status={booking.payments?.[0]?.status || (isConfirmed ? 'SUCCEEDED' : booking.status)} />
        </div>
        {booking.payments?.[0]?.paymentMethod && (
          <div className="summary-line">
            <span>Payment Method</span>
            <strong>{booking.payments[0].paymentMethod}</strong>
          </div>
        )}
        <div className="summary-total">
          <span>Total Paid</span>
          <strong>{formatMoney(booking.totalAmount)}</strong>
        </div>

        {isCancelled && (
          <div className="refund-summary-box">
            <span className="eyebrow">Refund Summary</span>
            <p>This booking was cancelled and seats were released. The refund of <strong>{formatMoney(booking.totalAmount)}</strong> is credited.</p>
          </div>
        )}

        {isConfirmed && !showCancelConfirm && (
          <div className="booking-actions-row">
            <button
              type="button"
              className="button button-danger"
              onClick={() => setShowCancelConfirm(true)}
            >
              Cancel Booking & Request Refund
            </button>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => window.print()}
            >
              Print Ticket Receipt
            </button>
          </div>
        )}

        {showCancelConfirm && (
          <div className="cancel-confirm-box">
            <h4>Confirm Cancellation</h4>
            <p>
              Are you sure you want to cancel this booking? All {booking.bookingSeats?.length || ''} seats will be immediately released back to available theater inventory, and <strong>{formatMoney(booking.totalAmount)}</strong> will be refunded.
            </p>
            <div className="cancel-confirm-actions">
              <button
                type="button"
                className="button button-danger"
                onClick={handleCancelBooking}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling & Refunding...' : 'Yes, Confirm Cancellation'}
              </button>
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
              >
                Keep Booking
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AccountTypeSelector({ value, onChange }) {
  return (
    <div className="account-type">
      <span>Account type</span>
      <div className="account-type-options" role="group" aria-label="Account type">
        <button type="button" className={value === 'user' ? 'selected' : ''} onClick={() => onChange('user')}>
          User
        </button>
        <button type="button" className={value === 'admin' ? 'selected' : ''} onClick={() => onChange('admin')}>
          Admin
        </button>
      </div>
    </div>
  )
}

async function finishLogin({ login, logout, form, accountType, notify, navigate, location }) {
  const authenticatedUser = await login({ email: form.email, password: form.password })
  if (accountType === 'admin' && authenticatedUser.role !== 'ADMIN') {
    await logout()
    throw new Error('This account does not have administrator access.')
  }
  notify(accountType === 'admin' ? 'Admin access confirmed.' : 'Welcome back.', 'success')
  navigate(authenticatedUser.role === 'ADMIN' ? '/admin' : (location.state?.from || '/movies'), { replace: true })
}

export function LoginPage({ notify }) {
  const { login, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [accountType, setAccountType] = useState('user')
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await finishLogin({ login, logout, form, accountType, notify, navigate, location })
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <AuthPage
      eyebrow={accountType === 'admin' ? 'Restricted access' : 'Welcome back'}
      title={accountType === 'admin' ? 'Admin login.' : 'Save your seat for later.'}
      copy={accountType === 'admin' ? 'Sign in with an existing administrator account to manage the SeatLock programme.' : 'Sign in to keep your bookings together and move from movie to payment in a few calm steps.'}
    >
      <AccountTypeSelector value={accountType} onChange={setAccountType} />
      <AuthForm
        form={form}
        setForm={setForm}
        onSubmit={submit}
        error={error}
        submitting={submitting}
        button={accountType === 'admin' ? 'Admin login' : 'Log in'}
      />
      <p className="form-foot">
        {accountType === 'admin' ? 'Need a customer account?' : 'New to SeatLock?'}
        <Link to="/register"> {accountType === 'admin' ? 'Register as a user' : 'Create an account'}</Link>
      </p>
    </AuthPage>
  )
}

export function RegisterPage({ notify }) {
  const { register, login, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [accountType, setAccountType] = useState('user')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      if (accountType === 'admin') {
        await finishLogin({ login, logout, form, accountType, notify, navigate, location })
      } else {
        await register(form)
        notify('Your account is ready.', 'success')
        navigate('/movies', { replace: true })
      }
    } catch (requestError) {
      setError(getApiError(requestError))
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <AuthPage
      eyebrow={accountType === 'admin' ? 'Restricted access' : 'A better way to book'}
      title={accountType === 'admin' ? 'Admin login.' : 'Make movie night yours.'}
      copy={accountType === 'admin' ? 'Use an existing administrator account. Public admin registration is not available.' : 'Create an account to hold seats, pay securely, and keep every booking close at hand.'}
    >
      <AccountTypeSelector value={accountType} onChange={setAccountType} />
      <AuthForm
        form={form}
        setForm={setForm}
        onSubmit={submit}
        error={error}
        submitting={submitting}
        button={accountType === 'admin' ? 'Admin login' : 'Create account'}
        register={accountType === 'user'}
      />
      <p className="form-foot">
        {accountType === 'admin' ? 'Need a customer account?' : 'Already have an account?'}
        <Link to="/login" onClick={accountType === 'admin' ? () => setAccountType('user') : undefined}>
          {accountType === 'admin' ? 'Register as a user' : 'Log in'}
        </Link>
      </p>
    </AuthPage>
  )
}

function AuthPage({ eyebrow, title, copy, children }) {
  return (
    <div className="auth-page">
      <div className="auth-visual">
        <span className="eyebrow">SeatLock</span>
        <h1>Good stories deserve good seats.</h1>
        <p>One small choice can change the whole night.</p>
        <div className="visual-line" />
      </div>
      <div className="auth-panel">
        <Link className="brand auth-brand" to="/">
          <span className="brand-mark">SL</span>
          <span>SeatLock</span>
        </Link>
        <div className="auth-copy">
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
          <p>{copy}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

function AuthForm({ form, setForm, onSubmit, error, submitting, button, register }) {
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  return (
    <form className="auth-form" onSubmit={onSubmit}>
      {register && (
        <label>
          Name
          <input required value={form.name} onChange={update('name')} placeholder="Your name" />
        </label>
      )}
      <label>
        Email
        <input required type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" />
      </label>
      <label>
        Password
        <input
          required
          type="password"
          minLength={register ? 8 : 1}
          value={form.password}
          onChange={update('password')}
          placeholder={register ? 'At least 8 characters' : 'Your password'}
        />
      </label>
      {error && <div className="form-error">{error}</div>}
      <button className="button button-primary button-wide" disabled={submitting}>
        {submitting ? 'Please wait...' : button}
      </button>
    </form>
  )
}

export const toArray = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.data)) return payload.data
    if (Array.isArray(payload.theaters)) return payload.theaters
    if (Array.isArray(payload.movies)) return payload.movies
    if (Array.isArray(payload.screens)) return payload.screens
    if (Array.isArray(payload.shows)) return payload.shows
    if (Array.isArray(payload.bookings)) return payload.bookings
  }
  return []
}

class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, errorInfo) {
    console.error("Admin view caught by ErrorBoundary:", error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '36px',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid #ef4444',
          borderRadius: '10px',
          margin: '24px 0',
          textAlign: 'center',
          color: '#f87171',
        }}>
          <h3 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: '8px' }}>Section Loading Recovered</h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '20px' }}>
            {this.state.error?.message || 'A data rendering exception was caught. The application remains stable.'}
          </p>
          <button
            type="button"
            className="button button-primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Retry This Section
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

const emptyMovie = {
  title: '',
  description: '',
  durationMin: '',
  language: 'English',
  genre: 'Action',
  certificate: 'U/A',
  trailerUrl: '',
  releaseDate: '',
  posterUrl: '',
  isActive: true,
}

function movieError(error) {
  const status = error.response?.status
  if (status === 401) return 'Your admin session has expired. Please sign in again.'
  if (status === 403) return 'This account is not allowed to manage movies.'
  if (status === 409) return 'A movie with these details already exists.'
  if (status === 429) return 'Too many requests. Please wait a moment and try again.'
  if (status >= 500) return 'The movie service is temporarily unavailable. Please try again.'
  return getApiError(error)
}

function moviePayload(form) {
  const desc = form.description ? form.description.trim() : ''
  const certTag = form.certificate ? `[${form.certificate}] ` : ''
  const trailerVal = (form.trailerUrl || form.trailer_url || '').trim()
  const trailerTag = trailerVal ? `\nTrailer: ${trailerVal}` : ''
  const fullDesc = (certTag + desc + trailerTag).trim()

  const payload = {
    title: form.title.trim(),
    description: fullDesc || 'No description provided.',
    durationMin: Number(form.durationMin),
    language: form.language ? form.language.trim() : 'English',
    genre: form.genre ? form.genre.trim() : 'Action',
    isActive: Boolean(form.isActive),
    trailerUrl: trailerVal || null,
    trailer_url: trailerVal || null,
  }
  if (form.releaseDate) payload.releaseDate = form.releaseDate
  if (form.posterUrl && form.posterUrl.trim()) payload.posterUrl = form.posterUrl.trim()
  return payload
}

function MovieForm({ form, setForm, onSubmit, submitting, editing, onCancel }) {
  const [uploadingPoster, setUploadingPoster] = useState(false)
  const [uploadingTrailer, setUploadingTrailer] = useState(false)
  const update = (field) => (event) => setForm((current) => ({
    ...current,
    [field]: event.target.type === 'checkbox' ? event.target.checked : event.target.value
  }))

  const handlePosterFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadingPoster(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('folder', 'posters')
      const res = await adminApi.uploadMedia(formData)
      const url = res.url || res.data?.url || res.data?.secure_url
      if (url) {
        setForm((prev) => ({ ...prev, posterUrl: url }))
      }
    } catch (err) {
      console.error('Failed to upload poster to Cloudinary:', err)
    } finally {
      setUploadingPoster(false)
    }
  }

  const handleTrailerVideoUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadingTrailer(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'trailer')
      formData.append('folder', 'seatlock/trailers')
      formData.append('isVideo', 'true')
      const res = await adminApi.uploadMedia(formData)
      const url = res.url || res.data?.url || res.data?.secure_url
      if (url) {
        setForm((prev) => ({ ...prev, trailerUrl: url, trailer_url: url }))
      }
    } catch (err) {
      console.error('Failed to upload trailer video to Cloudinary:', err)
      alert('Failed to upload trailer video: ' + (err.response?.data?.message || err.message))
    } finally {
      setUploadingTrailer(false)
    }
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="admin-form-grid">
        <label>
          Title
          <input required value={form.title} onChange={update('title')} placeholder="e.g. Dune: Part Two" />
        </label>
        <label>
          Genre
          <input required value={form.genre} onChange={update('genre')} placeholder="e.g. Sci-Fi, Action, Adventure" />
        </label>
        <label>
          Duration (minutes)
          <input required type="number" min="1" max="600" value={form.durationMin} onChange={update('durationMin')} placeholder="e.g. 166" />
        </label>
        <label>
          Language
          <input required value={form.language} onChange={update('language')} placeholder="e.g. English, Hindi" />
        </label>
        <label>
          Certificate
          <select value={form.certificate || 'U/A'} onChange={update('certificate')}>
            <option value="U">U (Universal - All Ages)</option>
            <option value="U/A">U/A (Parental Guidance under 12)</option>
            <option value="A">A (Adults Only 18+)</option>
          </select>
        </label>
        <label>
          Trailer URL
          <input
            value={form.trailerUrl || form.trailer_url || ''}
            onChange={update('trailerUrl')}
            placeholder="https://youtube.com/watch?v=... or MP4/WebM URL"
          />
        </label>

        {/* Direct Video File Uploader Row */}
        <div className="admin-form-full trailer-upload-section mt-2" style={{ marginTop: '-4px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', background: 'rgba(245, 158, 11, 0.05)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px dashed #f59e0b' }}>
            <label className="text-xs text-amber-400 font-semibold mb-1 block" style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: 600, margin: 0 }}>
              🎬 Or Upload Trailer Video File to Cloudinary:
            </label>
            <input
              type="file"
              accept="video/mp4,video/webm,video/mkv,video/quicktime"
              disabled={uploadingTrailer}
              onChange={handleTrailerVideoUpload}
              className="file-input text-xs text-slate-300"
              style={{ fontSize: '0.82rem', color: '#cbd5e1', cursor: 'pointer' }}
            />
            {uploadingTrailer && (
              <span className="text-xs text-amber-500 animate-pulse ml-2" style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 600 }}>
                Uploading video to Cloudinary...
              </span>
            )}
            {(form.trailerUrl || form.trailer_url) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>✓ Video Attached</span>
                <a
                  href={form.trailerUrl || form.trailer_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.75rem', color: '#38bdf8', textDecoration: 'underline' }}
                >
                  Preview
                </a>
              </div>
            )}
          </div>
        </div>

        <label>
          Release date
          <input type="date" value={form.releaseDate} onChange={update('releaseDate')} />
        </label>
        <label>
          Poster URL
          <input value={form.posterUrl} onChange={update('posterUrl')} placeholder="https://res.cloudinary.com/... or choose file below" />
        </label>
        
        {/* Cloudinary Direct File Upload Widget */}
        <div className="admin-form-full poster-upload-row" style={{ marginTop: '-4px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px dashed var(--border-color, #30364d)' }}>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              {uploadingPoster ? '⏳ Uploading to Cloudinary...' : '☁️ Choose Poster File to Upload:'}
            </span>
            <input
              type="file"
              accept="image/*"
              disabled={uploadingPoster}
              style={{ fontSize: '0.82rem', color: '#cbd5e1', cursor: 'pointer' }}
              onChange={handlePosterFileUpload}
            />
            {form.posterUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                <img src={form.posterUrl} alt="Poster preview" style={{ height: '38px', width: '28px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #f59e0b' }} />
                <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Ready</span>
              </div>
            )}
          </div>
        </div>

        <label className="admin-form-full">
          Description
          <textarea value={form.description} onChange={update('description')} rows="3" placeholder="Overview of the movie storyline..." />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={form.isActive} onChange={update('isActive')} /> Active in programme
        </label>
      </div>
      <div className="admin-form-actions">
        <button className="button button-primary" disabled={submitting || uploadingPoster || uploadingTrailer}>
          {submitting ? 'Saving to Database...' : editing ? 'Save changes' : 'Add movie'}
        </button>
        {editing && <button className="button button-ghost" type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  )
}

// -------------------------------------------------------------
// Real-World Comprehensive Admin Dashboard
// -------------------------------------------------------------
export function AdminDashboardPage({ notify, initialTab = 'overview' }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawTab = searchParams.get('tab') || initialTab
  const tabAliases = {
    seats: 'screens',
    cloudinary: 'media',
  }
  const activeTab = tabAliases[rawTab] || rawTab

  const setTab = (tab) => {
    setSearchParams({ tab })
    setTimeout(() => {
      const panel = document.getElementById('admin-active-tab-panel')
      if (panel) {
        panel.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 50)
  }

  return (
    <div className="container admin-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">Administrator Workspace</span>
          <h1>Admin Control Center</h1>
          <p>Real-world management of cinema halls, dynamic seat matrices, and movie scheduling.</p>
        </div>
        <span className="admin-badge">ADMIN ACCESS</span>
      </div>

      {/* Navigation Cards */}
      <section className="admin-action-grid">
        <button
          type="button"
          className={`admin-action-card ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setTab('overview')}
        >
          <span className="eyebrow">01 · Analytics</span>
          <h2>Overview</h2>
          <p>Revenue, occupancy & booking health metrics.</p>
          <span className="card-action-pill">View Overview →</span>
        </button>
        <button
          type="button"
          className={`admin-action-card ${activeTab === 'movies' ? 'active' : ''}`}
          onClick={() => setTab('movies')}
        >
          <span className="eyebrow">02 · Programme</span>
          <h2>Movies</h2>
          <p>Add, edit, or deactivate cinema movies.</p>
          <span className="card-action-pill">Manage Movies →</span>
        </button>
        <button
          type="button"
          className={`admin-action-card ${activeTab === 'theaters' ? 'active' : ''}`}
          onClick={() => setTab('theaters')}
        >
          <span className="eyebrow">03 · Venues</span>
          <h2>Theaters</h2>
          <p>Manage cinema halls, cities, and locations.</p>
          <span className="card-action-pill">Manage Theaters →</span>
        </button>
        <button
          type="button"
          className={`admin-action-card ${activeTab === 'screens' ? 'active' : ''}`}
          onClick={() => setTab('screens')}
        >
          <span className="eyebrow">04 · Layouts</span>
          <h2>Screens & Seats</h2>
          <p>Design dynamic seat matrices (Silver/Gold/VIP).</p>
          <span className="card-action-pill">Seat Matrix Builder →</span>
        </button>
        <button
          type="button"
          className={`admin-action-card ${activeTab === 'shows' ? 'active' : ''}`}
          onClick={() => setTab('shows')}
        >
          <span className="eyebrow">05 · Scheduling</span>
          <h2>Shows</h2>
          <p>Schedule showtimes and auto-provision show seats.</p>
          <span className="card-action-pill">Schedule Shows →</span>
        </button>
        <button
          type="button"
          className={`admin-action-card ${activeTab === 'media' ? 'active' : ''}`}
          onClick={() => setTab('media')}
        >
          <span className="eyebrow">06 · Cloudinary</span>
          <h2>Media Upload</h2>
          <p>Upload posters, backdrops & 360 panorama textures.</p>
          <span className="card-action-pill">Cloudinary Storage →</span>
        </button>
      </section>

      {/* Tab Panels protected with React Error Boundary */}
      <div id="admin-active-tab-panel" style={{ scrollMarginTop: '80px' }}>
        <AdminErrorBoundary key={activeTab}>
          {activeTab === 'overview' && <AdminOverviewTab notify={notify} setTab={setTab} />}
          {activeTab === 'movies' && <AdminMoviesTab notify={notify} setTab={setTab} />}
          {activeTab === 'theaters' && <AdminTheatersTab notify={notify} setTab={setTab} />}
          {activeTab === 'screens' && <AdminScreensTab notify={notify} setTab={setTab} />}
          {activeTab === 'shows' && <AdminShowsTab notify={notify} setTab={setTab} />}
          {activeTab === 'media' && <AdminMediaTab notify={notify} setTab={setTab} />}
        </AdminErrorBoundary>
      </div>
    </div>
  )
}

function AdminOverviewTab({ notify, setTab }) {
  const [stats, setStats] = useState(null)
  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([adminApi.stats(), adminApi.recentBookings(8)])
      .then(([statsRes, bookingsRes]) => {
        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value?.data || statsRes.value)
        }
        if (bookingsRes.status === 'fulfilled') {
          setRecentBookings(toArray(bookingsRes.value?.data || bookingsRes.value))
        }
      })
      .catch((err) => notify(getApiError(err), 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingScreen label="Loading system statistics & real-time telemetry..." />

  const totalRev = stats?.financials?.totalRevenue ?? stats?.totalRevenue ?? 0
  const totalBks = stats?.bookings?.total ?? stats?.totalBookings ?? 0
  const confBks = stats?.bookings?.confirmed ?? stats?.confirmedBookings ?? 0
  const activeShws = stats?.catalog?.totalShows ?? stats?.activeShows ?? 0
  const occRate = stats?.bookings?.occupancyRate ?? (stats?.occupancyRate !== undefined ? `${stats.occupancyRate}%` : '0%')
  const totalMvs = stats?.catalog?.totalMovies ?? stats?.totalMovies ?? 0
  const totalThs = stats?.catalog?.totalTheaters ?? stats?.totalTheaters ?? 0

  return (
    <section className="admin-section">
      <SectionHeading
        eyebrow="Real-Time Telemetry"
        title="Live System Overview & Analytics"
        copy="Live indicators for active bookings, revenue, and cinema hall capacity."
      />

      <div className="stats-kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">TOTAL REVENUE</span>
          <strong className="kpi-value">{formatMoney(totalRev)}</strong>
          <small className="kpi-sub">Across all confirmed bookings</small>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">TOTAL BOOKINGS</span>
          <strong className="kpi-value">{totalBks}</strong>
          <small className="kpi-sub">{confBks} Confirmed</small>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">ACTIVE SHOWTIMES</span>
          <strong className="kpi-value">{activeShws}</strong>
          <small className="kpi-sub">Across scheduled screens</small>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">THEATER OCCUPANCY</span>
          <strong className="kpi-value">{occRate}</strong>
          <small className="kpi-sub">Seat fill ratio</small>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">PROGRAMME CATALOG</span>
          <strong className="kpi-value">{totalMvs} Movies</strong>
          <small className="kpi-sub">{totalThs} Theaters</small>
        </div>
      </div>

      {/* Quick Activity Feed */}
      <div className="admin-activity-feed-section" style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <span className="eyebrow">Real-Time Transactions</span>
            <h3 style={{ color: '#fff', margin: '4px 0 0' }}>Recent Booking Activity</h3>
          </div>
          <span className="admin-count">{recentBookings.length} logged events</span>
        </div>

        {recentBookings.length === 0 ? (
          <div style={{
            background: 'rgba(18, 18, 22, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '24px',
            textAlign: 'center',
            color: '#94a3b8',
          }}>
            No recent booking transactions found. As users book cinema tickets, live transactions will populate here.
          </div>
        ) : (
          <div className="admin-movie-list">
            {recentBookings.map((b) => (
              <div className="admin-movie-row" key={b.id} style={{ alignItems: 'center' }}>
                <img
                  src={b.show?.movie?.posterUrl || 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=200&auto=format&fit=crop'}
                  alt={b.show?.movie?.title || 'Movie'}
                  style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '4px' }}
                />
                <div>
                  <span className="eyebrow" style={{ color: b.status === 'CONFIRMED' ? '#10b981' : '#f59e0b' }}>
                    {b.status} · {formatDate(b.createdAt)} {formatTime(b.createdAt)}
                  </span>
                  <h4 style={{ color: '#fff', margin: '2px 0 4px', fontSize: '1rem' }}>
                    {b.show?.movie?.title || 'Movie Booking'}
                  </h4>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
                    Customer: <strong style={{ color: '#e2e8f0' }}>{b.user?.name || b.user?.email || 'Guest User'}</strong> · Venue: {b.show?.screen?.theater?.name || 'Lumière Cinema'} ({b.show?.screen?.name || 'Screen 1'})
                  </p>
                  <small style={{ color: '#cbd5e1' }}>
                    Seats ({(b.bookingSeats || b.seats || []).length}): {(b.bookingSeats || b.seats || []).map((s) => `${s.showSeat?.seat?.rowLabel || ''}${s.showSeat?.seat?.seatNumber || ''}`).filter(Boolean).join(', ') || 'Allocated'}
                  </small>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <strong style={{ color: '#f59e0b', fontSize: '1.1rem' }}>{formatMoney(b.totalAmount || b.payments?.[0]?.amount || b.payment?.amount || 0)}</strong>
                  <span className={`status-pill status-${(b.status || 'pending').toLowerCase()}`}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="overview-quick-links" style={{ marginTop: '40px' }}>
        <h3>Quick Operations</h3>
        <div className="quick-btn-group">
          <button className="button button-dark" onClick={() => setTab('screens')}>
            ⚡ Design Dynamic Seat Matrix
          </button>
          <button className="button button-primary" onClick={() => setTab('shows')}>
            📅 Schedule a Show
          </button>
          <button className="button button-ghost" onClick={() => setTab('theaters')}>
            🏛️ Add New Theater Hall
          </button>
          <button className="button button-ghost" onClick={() => setTab('movies')}>
            🎬 Add Movie Title
          </button>
          <button className="button button-ghost" onClick={() => setTab('media')}>
            ☁️ Cloudinary Uploads
          </button>
        </div>
      </div>
    </section>
  )
}

function AdminMoviesTab({ notify, setTab }) {
  const [movies, setMovies] = useState([])
  const [form, setForm] = useState(emptyMovie)
  const [editingId, setEditingId] = useState(null)
  const [state, setState] = useState({ loading: true, error: '' })
  const [submitting, setSubmitting] = useState(false)

  const loadMovies = () => {
    setState({ loading: true, error: '' })
    movieApi.list({ limit: 100 })
      .then((response) => setMovies(toArray(response?.data || response)))
      .catch((error) => setState({ loading: false, error: movieError(error) }))
      .finally(() => setState((current) => ({ ...current, loading: false })))
  }

  useEffect(() => { loadMovies() }, [])

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      if (editingId) {
        await movieApi.update(editingId, moviePayload(form))
        notify('Movie updated successfully.', 'success')
      } else {
        await movieApi.create(moviePayload(form))
        notify('Movie created successfully.', 'success')
      }
      setForm(emptyMovie)
      setEditingId(null)
      loadMovies()
    } catch (error) {
      notify(movieError(error), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const edit = (movie) => {
    setEditingId(movie.id)
    setForm({
      title: movie.title || '',
      description: movie.description || '',
      durationMin: movie.durationMin || '',
      language: movie.language || 'English',
      genre: movie.genre || 'Action',
      certificate: movie.description?.match(/\[(U|U\/A|A)\]/)?.[1] || 'U/A',
      trailerUrl: movie.trailerUrl || movie.trailer_url || movie.description?.match(/Trailer:\s*(https?:\/\/[^\s]+)/)?.[1] || '',
      releaseDate: movie.releaseDate ? new Date(movie.releaseDate).toISOString().slice(0, 10) : '',
      posterUrl: movie.posterUrl || '',
      isActive: movie.isActive !== false,
    })
    const formEl = document.getElementById('admin-movie-form-section')
    if (formEl) formEl.scrollIntoView({ behavior: 'smooth' })
  }

  const deactivate = async (movie) => {
    if (!window.confirm(`Deactivate "${movie.title}"?`)) return
    try {
      await movieApi.remove(movie.id)
      notify('Movie deactivated.', 'success')
      loadMovies()
    } catch (error) {
      notify(movieError(error), 'error')
    }
  }

  const moviesList = toArray(movies)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          type="button"
          className="button button-small button-ghost"
          onClick={() => setTab?.('overview')}
        >
          ← Back to Overview
        </button>
      </div>

      <section id="admin-movie-form-section" className="admin-section" style={{ paddingTop: '10px' }}>
        <SectionHeading
          eyebrow="Movie Programme Catalog"
          title={editingId ? 'Edit Movie Details' : 'Add New Movie to Programme'}
          copy="Configure duration, language, genre, certificate, and upload high-res Cloudinary posters."
        />
        <MovieForm
          form={form}
          setForm={setForm}
          onSubmit={submit}
          submitting={submitting}
          editing={Boolean(editingId)}
          onCancel={() => { setEditingId(null); setForm(emptyMovie) }}
        />
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Current Programme</span>
            <h2>Active Titles</h2>
          </div>
          <span className="admin-count">{moviesList.length} titles</span>
        </div>
        {state.loading ? (
          <LoadingScreen label="Loading movies..." />
        ) : state.error ? (
          <ErrorState message={state.error} onRetry={loadMovies} />
        ) : (
          <div className="admin-movie-list">
            {moviesList.map((movie) => (
              <div className="admin-movie-row" key={movie.id}>
                <Poster movie={movie} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className="eyebrow" style={{ margin: 0 }}>{movie.isActive ? 'Active' : 'Inactive'}</span>
                    <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                      {movie.description?.match(/\[(U|U\/A|A)\]/)?.[1] || 'U/A'}
                    </span>
                  </div>
                  <h3>{movie.title}</h3>
                  <p>{movie.genre} · {movie.language} · {movie.durationMin} min</p>
                  {movie.description && (
                    <small style={{ color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                      {movie.description.replace(/\[(U|U\/A|A)\]\s*/, '').replace(/Trailer:.*$/, '').slice(0, 120)}...
                    </small>
                  )}
                </div>
                <div className="admin-row-actions">
                  <button className="button button-small button-ghost" onClick={() => edit(movie)}>Edit</button>
                  {movie.isActive && (
                    <button className="button button-small button-danger" onClick={() => deactivate(movie)}>
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function AdminTheatersTab({ notify, setTab }) {
  const [theaters, setTheaters] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', city: '', address: '' })
  const [editingId, setEditingId] = useState(null)

  const loadTheaters = () => {
    setLoading(true)
    adminApi.theaters()
      .then((res) => setTheaters(toArray(res?.data || res)))
      .catch((err) => notify(getApiError(err), 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadTheaters() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editingId) {
        await adminApi.updateTheater(editingId, form)
        notify('Theater updated successfully.', 'success')
      } else {
        await adminApi.createTheater(form)
        notify('Theater hall created successfully.', 'success')
      }
      setForm({ name: '', city: '', address: '' })
      setEditingId(null)
      loadTheaters()
    } catch (err) {
      notify(getApiError(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete theater "${name}"?`)) return
    try {
      await adminApi.deleteTheater(id)
      notify('Theater removed.', 'success')
      loadTheaters()
    } catch (err) {
      notify(getApiError(err), 'error')
    }
  }

  const theatersList = toArray(theaters)

  return (
    <section className="admin-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          type="button"
          className="button button-small button-ghost"
          onClick={() => setTab?.('overview')}
        >
          ← Back to Overview
        </button>
      </div>

      <SectionHeading
        eyebrow="Cinema Halls & Venues"
        title={editingId ? 'Edit Theater Venue' : 'Add New Theater Venue'}
        copy="Manage cinema branches, locations, and city networks across Delhi NCR, Mumbai, and Bengaluru."
      />

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-grid">
          <label>
            Theater Name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Lumière Lounge - Pacific Mall"
            />
          </label>
          <label>
            City
            <input
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="e.g. Delhi NCR, Mumbai, Bengaluru"
            />
          </label>
          <label className="admin-form-full">
            Full Address
            <input
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="e.g. 3rd Floor, Pacific Mall, Tagore Garden, New Delhi"
            />
          </label>
        </div>
        <div className="admin-form-actions">
          <button className="button button-primary" disabled={submitting}>
            {submitting ? 'Saving...' : editingId ? 'Update Theater' : 'Add Theater Venue'}
          </button>
          {editingId && (
            <button
              className="button button-ghost"
              type="button"
              onClick={() => { setEditingId(null); setForm({ name: '', city: '', address: '' }) }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="theaters-list-section" style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3>Registered Theaters ({theatersList.length})</h3>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Default venues: Pacific Mall, Ambience Mall, Phoenix Palassio</span>
        </div>
        {loading ? (
          <LoadingScreen label="Loading theaters..." />
        ) : theatersList.length === 0 ? (
          <EmptyState title="No theaters yet" message="Add your first theater above." />
        ) : (
          <div className="admin-entity-grid">
            {theatersList.map((t) => (
              <div className="entity-card" key={t.id}>
                <div className="entity-header">
                  <span className="eyebrow">{t.city}</span>
                  <h4>{t.name}</h4>
                  <p>{t.address}</p>
                </div>
                <div className="entity-footer">
                  <span>{t.screens?.length || 0} Screens Provisioned</span>
                  <div className="admin-row-actions">
                    <button
                      className="button button-small button-ghost"
                      onClick={() => { setEditingId(t.id); setForm({ name: t.name, city: t.city, address: t.address }) }}
                    >
                      Edit
                    </button>
                    <button
                      className="button button-small button-danger"
                      onClick={() => handleDelete(t.id, t.name)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function AdminScreensTab({ notify, setTab }) {
  const [theaters, setTheaters] = useState([])
  const [selectedTheaterId, setSelectedTheaterId] = useState('')
  const [screens, setScreens] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingScreenId, setEditingScreenId] = useState(null)

  // Dynamic Seat Grid Designer State
  const [screenName, setScreenName] = useState('Screen 1 - Dolby Atmos')
  const [numRows, setNumRows] = useState(8)
  const [seatsPerRow, setSeatsPerRow] = useState(10)
  const [regularRowsInput, setRegularRowsInput] = useState('A, B, C')
  const [premiumRowsInput, setPremiumRowsInput] = useState('D, E, F')
  const [reclinerRowsInput, setReclinerRowsInput] = useState('G, H')

  useEffect(() => {
    adminApi.theaters()
      .then((res) => {
        const list = toArray(res?.data || res)
        setTheaters(list)
        if (list.length > 0) setSelectedTheaterId(list[0].id)
      })
      .catch((err) => notify(getApiError(err), 'error'))
  }, [])

  const loadScreens = (theaterId) => {
    if (!theaterId) return
    setLoading(true)
    catalogApi.screens(theaterId)
      .then((res) => setScreens(toArray(res?.data || res)))
      .catch((err) => notify(getApiError(err), 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (selectedTheaterId) {
      loadScreens(selectedTheaterId)
    }
  }, [selectedTheaterId])

  // Generate row letters A, B, C...
  const rowLabels = useMemo(() => {
    const list = []
    for (let i = 0; i < Math.min(26, numRows); i++) {
      list.push(String.fromCharCode(65 + i))
    }
    return list
  }, [numRows])

  // Parse category mappings
  const getCategoryForRow = (rowLetter) => {
    const parse = (str) => str.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    if (parse(reclinerRowsInput).includes(rowLetter)) return 'RECLINER'
    if (parse(premiumRowsInput).includes(rowLetter)) return 'PREMIUM'
    return 'REGULAR'
  }

  const handleStartEditScreen = async (screen) => {
    setEditingScreenId(screen.id)
    setScreenName(screen.name || '')
    try {
      const res = await adminApi.getScreen(screen.id)
      const fullScreen = res.data?.screen || res.data || {}
      const seats = toArray(fullScreen.seats)
      if (seats.length > 0) {
        const uniqueRows = Array.from(new Set(seats.map((s) => s.rowLabel))).sort()
        const maxCols = Math.max(...seats.map((s) => s.seatNumber || 0), 10)
        setNumRows(uniqueRows.length || 8)
        setSeatsPerRow(maxCols || 10)

        const regularRows = []
        const premiumRows = []
        const reclinerRows = []
        for (const row of uniqueRows) {
          const type = seats.find((s) => s.rowLabel === row)?.seatType || 'REGULAR'
          if (type === 'RECLINER') reclinerRows.push(row)
          else if (type === 'PREMIUM') premiumRows.push(row)
          else regularRows.push(row)
        }
        if (regularRows.length) setRegularRowsInput(regularRows.join(', '))
        if (premiumRows.length) setPremiumRowsInput(premiumRows.join(', '))
        if (reclinerRows.length) setReclinerRowsInput(reclinerRows.join(', '))
      }
      notify(`Loaded "${screen.name}" into Dynamic Matrix Builder`, 'info')
      const formEl = document.getElementById('seat-matrix-form')
      if (formEl) formEl.scrollIntoView({ behavior: 'smooth' })
    } catch (err) {
      notify(getApiError(err), 'error')
    }
  }

  const handleCancelEdit = () => {
    setEditingScreenId(null)
    setScreenName('Screen 1 - Dolby Atmos')
    setNumRows(8)
    setSeatsPerRow(10)
    setRegularRowsInput('A, B, C')
    setPremiumRowsInput('D, E, F')
    setReclinerRowsInput('G, H')
  }

  const handleSaveScreen = async (e) => {
    e.preventDefault()
    if (!selectedTheaterId) {
      notify('Please select a theater first.', 'error')
      return
    }
    setSubmitting(true)
    try {
      const rowCategories = {
        REGULAR: regularRowsInput.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean),
        PREMIUM: premiumRowsInput.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean),
        RECLINER: reclinerRowsInput.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean),
      }

      if (editingScreenId) {
        await adminApi.updateScreenSeats(editingScreenId, {
          rows: numRows,
          seatsPerRow,
          rowCategories,
        })
        notify(`Screen matrix updated successfully! (${numRows * seatsPerRow} physical seats saved in database)`, 'success')
      } else {
        const payload = {
          name: screenName.trim(),
          totalCapacity: numRows * seatsPerRow,
          rows: numRows,
          seatsPerRow,
          rowCategories,
        }
        await adminApi.createScreen(selectedTheaterId, payload)
        notify(`Screen "${payload.name}" with ${payload.totalCapacity} seats successfully created in database!`, 'success')
        handleCancelEdit()
      }
      loadScreens(selectedTheaterId)
    } catch (err) {
      notify(getApiError(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const theatersList = toArray(theaters)
  const screensList = toArray(screens)

  return (
    <section className="admin-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          type="button"
          className="button button-small button-ghost"
          onClick={() => setTab?.('overview')}
        >
          ← Back to Overview
        </button>
      </div>

      <SectionHeading
        eyebrow="Dynamic Seat Architecture"
        title="Dynamic Screen & Seat Matrix Builder"
        copy="Design custom seating topologies. Configure Silver, Gold, and VIP Recliner tiers with live preview."
      />

      {/* Theater Picker */}
      <div className="theater-select-bar">
        <label>
          Select Theater Venue:
          <select
            value={selectedTheaterId}
            onChange={(e) => setSelectedTheaterId(e.target.value)}
          >
            {theatersList.map((t) => (
              <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
            ))}
          </select>
        </label>
      </div>

      {/* Matrix Builder Form */}
      <form id="seat-matrix-form" className="admin-form" onSubmit={handleSaveScreen} style={{ marginTop: '20px' }}>
        {editingScreenId && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            padding: '10px 16px',
            marginBottom: '18px',
            color: '#f59e0b',
            fontWeight: 600,
          }}>
            <span>✏️ Modifying Dynamic Matrix for Screen: <strong>{screenName}</strong></span>
            <button
              type="button"
              className="button button-small button-ghost"
              onClick={handleCancelEdit}
              style={{ fontSize: '0.8rem', padding: '4px 10px' }}
            >
              Cancel Edit / Create New
            </button>
          </div>
        )}

        <div className="admin-form-grid">
          <label>
            Screen Name
            <input
              required
              value={screenName}
              onChange={(e) => setScreenName(e.target.value)}
              placeholder="e.g. Audi 01 - Laser IMAX"
            />
          </label>
          <label>
            Rows (A to Z)
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                className="button button-small button-ghost"
                onClick={() => setNumRows((prev) => Math.max(1, prev - 1))}
                style={{ minWidth: '38px', height: '42px', padding: 0, fontSize: '18px', fontWeight: 'bold' }}
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={26}
                value={numRows}
                onChange={(e) => setNumRows(Number(e.target.value))}
                style={{ textAlign: 'center', marginTop: 0 }}
              />
              <button
                type="button"
                className="button button-small button-ghost"
                onClick={() => setNumRows((prev) => Math.min(26, prev + 1))}
                style={{ minWidth: '38px', height: '42px', padding: 0, fontSize: '18px', fontWeight: 'bold' }}
              >
                +
              </button>
            </div>
          </label>
          <label>
            Seats Per Row (1 to 30)
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                className="button button-small button-ghost"
                onClick={() => setSeatsPerRow((prev) => Math.max(1, prev - 1))}
                style={{ minWidth: '38px', height: '42px', padding: 0, fontSize: '18px', fontWeight: 'bold' }}
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={30}
                value={seatsPerRow}
                onChange={(e) => setSeatsPerRow(Number(e.target.value))}
                style={{ textAlign: 'center', marginTop: 0 }}
              />
              <button
                type="button"
                className="button button-small button-ghost"
                onClick={() => setSeatsPerRow((prev) => Math.min(30, prev + 1))}
                style={{ minWidth: '38px', height: '42px', padding: 0, fontSize: '18px', fontWeight: 'bold' }}
              >
                +
              </button>
            </div>
          </label>
          <label>
            Total Capacity (Computed)
            <input
              disabled
              value={`${numRows * seatsPerRow} Seats`}
              style={{
                marginTop: '8px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: '#f59e0b',
                fontWeight: 700,
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            />
          </label>
          <label>
            Regular (Silver) Rows
            <input
              value={regularRowsInput}
              onChange={(e) => setRegularRowsInput(e.target.value)}
              placeholder="e.g. A, B, C"
            />
          </label>
          <label>
            Premium (Gold) Rows
            <input
              value={premiumRowsInput}
              onChange={(e) => setPremiumRowsInput(e.target.value)}
              placeholder="e.g. D, E, F"
            />
          </label>
          <label className="admin-form-full">
            VIP Recliner Rows
            <input
              value={reclinerRowsInput}
              onChange={(e) => setReclinerRowsInput(e.target.value)}
              placeholder="e.g. G, H"
            />
          </label>
        </div>

        {/* Live Interactive Matrix Preview */}
        <div className="dynamic-matrix-preview">
          <div className="matrix-preview-header">
            <h4>Live Seating Topology Preview ({numRows * seatsPerRow} Seats)</h4>
            <div className="seat-legend">
              <span className="legend-tier"><i className="tier-tag tier-regular" />Regular (Silver)</span>
              <span className="legend-tier"><i className="tier-tag tier-premium" />Premium (Gold)</span>
              <span className="legend-tier"><i className="tier-tag tier-recliner" />VIP Recliner</span>
            </div>
          </div>

          <div className="seat-layout" style={{ margin: '20px 0' }}>
            <div className="screen-label"><span>SCREEN DIRECTION</span></div>
            <div className="seat-map">
              {rowLabels.map((row) => {
                const category = getCategoryForRow(row)
                return (
                  <div className="seat-row" key={row}>
                    <span className="row-label">{row}</span>
                    {Array.from({ length: seatsPerRow }, (_, idx) => idx + 1).map((col) => (
                      <button
                        key={`${row}${col}`}
                        type="button"
                        className={`seat seat-${category.toLowerCase()} available`}
                        title={`Row ${row}, Seat ${col} · ${category}`}
                      >
                        <span>{col}</span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="admin-form-actions">
          <button className="button button-primary" disabled={submitting}>
            {submitting
              ? 'Saving Changes in Database...'
              : editingScreenId
              ? `💾 Save & Update Screen Layout (${numRows * seatsPerRow} Seats)`
              : `⚡ Create Screen & Provision ${numRows * seatsPerRow} Seats`}
          </button>
          {editingScreenId && (
            <button
              type="button"
              className="button button-ghost"
              onClick={handleCancelEdit}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {/* Existing Screens */}
      <div className="theaters-list-section" style={{ marginTop: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3>Existing Screens for this Venue ({screensList.length})</h3>
          {editingScreenId && (
            <button
              type="button"
              className="button button-small button-ghost"
              onClick={handleCancelEdit}
            >
              + Create New Screen
            </button>
          )}
        </div>
        {loading ? (
          <LoadingScreen label="Loading screens..." />
        ) : screensList.length === 0 ? (
          <EmptyState title="No screens yet" message="Design and save your first screen above." />
        ) : (
          <div className="admin-entity-grid">
            {screensList.map((s) => (
              <div
                className="entity-card"
                key={s.id}
                style={editingScreenId === s.id ? { borderColor: '#f59e0b', boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)' } : {}}
              >
                <div className="entity-header">
                  <span className="eyebrow">{s.totalSeats || s.totalCapacity} Total Seats</span>
                  <h4>{s.name}</h4>
                  <p>{s.totalSeats || s.totalCapacity} Dynamic Physical Seats Provisioned</p>
                </div>
                <div className="entity-footer">
                  <span style={{ color: editingScreenId === s.id ? '#f59e0b' : '#94a3b8', fontWeight: 600 }}>
                    {editingScreenId === s.id ? '● Active in Editor' : 'Ready'}
                  </span>
                  <div className="admin-row-actions">
                    <button
                      type="button"
                      className="button button-small button-primary"
                      onClick={() => handleStartEditScreen(s)}
                    >
                      {editingScreenId === s.id ? 'Editing Matrix' : 'Modify Matrix ([-] / [+])'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function AdminShowsTab({ notify, setTab }) {
  const [movies, setMovies] = useState([])
  const [theaters, setTheaters] = useState([])
  const [selectedTheaterId, setSelectedTheaterId] = useState('')
  const [screens, setScreens] = useState([])
  const [scheduledShows, setScheduledShows] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    movieId: '',
    screenId: '',
    startTime: '',
    basePrice: 200,
    premiumPrice: 350,
    reclinerPrice: 500,
    language: 'Hindi',
  })

  useEffect(() => {
    Promise.all([
      movieApi.list({ limit: 100 }),
      adminApi.theaters(),
      adminApi.shows().catch(() => catalogApi.shows()),
    ])
      .then(([movieRes, theaterRes, showRes]) => {
        const mList = toArray(movieRes?.data || movieRes)
        const tList = toArray(theaterRes?.data || theaterRes)
        const sList = toArray(showRes?.data || showRes)
        setMovies(mList)
        setTheaters(tList)
        setScheduledShows(sList)
        if (mList.length > 0) setForm((prev) => ({ ...prev, movieId: mList[0].id, language: mList[0].language || 'Hindi' }))
        if (tList.length > 0) setSelectedTheaterId(tList[0].id)
      })
      .catch((err) => notify(getApiError(err), 'error'))
  }, [])

  useEffect(() => {
    if (!selectedTheaterId) return
    catalogApi.screens(selectedTheaterId)
      .then((res) => {
        const sList = toArray(res?.data || res)
        setScreens(sList)
        if (sList.length > 0) setForm((prev) => ({ ...prev, screenId: sList[0].id }))
      })
      .catch((err) => notify(getApiError(err), 'error'))
  }, [selectedTheaterId])

  const handleScheduleShow = async (e) => {
    e.preventDefault()
    if (!form.movieId || !form.screenId || !form.startTime) {
      notify('Please fill all required show details.', 'error')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        movieId: form.movieId,
        screenId: form.screenId,
        startTime: new Date(form.startTime).toISOString(),
        basePrice: Number(form.basePrice),
        premiumPrice: Number(form.premiumPrice),
        reclinerPrice: Number(form.reclinerPrice),
        language: form.language,
      }

      await adminApi.scheduleShow(payload)
      notify('Show scheduled and show_seats auto-provisioned successfully!', 'success')
      
      // Reload shows
      adminApi.shows()
        .then((res) => setScheduledShows(toArray(res?.data || res)))
        .catch(() => catalogApi.shows().then((res) => setScheduledShows(toArray(res?.data || res))))
    } catch (err) {
      notify(getApiError(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelShow = async (showId, movieTitle) => {
    if (!window.confirm(`Are you sure you want to cancel the scheduled show for "${movieTitle || 'this movie'}"?`)) return
    try {
      await adminApi.deleteShow(showId)
      notify('Show cancelled successfully.', 'success')
      adminApi.shows()
        .then((res) => setScheduledShows(toArray(res?.data || res)))
        .catch(() => catalogApi.shows().then((res) => setScheduledShows(toArray(res?.data || res))))
    } catch (err) {
      notify(getApiError(err), 'error')
    }
  }

  const moviesList = toArray(movies)
  const theatersList = toArray(theaters)
  const screensList = toArray(screens)
  const showsList = toArray(scheduledShows)

  return (
    <section className="admin-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          type="button"
          className="button button-small button-ghost"
          onClick={() => setTab?.('overview')}
        >
          ← Back to Overview
        </button>
      </div>

      <SectionHeading
        eyebrow="Show Scheduling Engine"
        title="Schedule Show & Auto-Provision Seats"
        copy="Select a movie, theater screen, and slot. All physical seats are automatically converted into transactional show_seats with tier pricing."
      />

      <form className="admin-form" onSubmit={handleScheduleShow}>
        <div className="admin-form-grid">
          <label>
            Select Movie
            <select
              required
              value={form.movieId}
              onChange={(e) => {
                const m = moviesList.find((item) => item.id === e.target.value)
                setForm({ ...form, movieId: e.target.value, language: m?.language || form.language })
              }}
            >
              {moviesList.map((m) => (
                <option key={m.id} value={m.id}>{m.title} ({m.language} · {m.durationMin}m)</option>
              ))}
            </select>
          </label>

          <label>
            Theater Venue
            <select
              value={selectedTheaterId}
              onChange={(e) => setSelectedTheaterId(e.target.value)}
            >
              {theatersList.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
              ))}
            </select>
          </label>

          <label>
            Screen / Hall
            <select
              required
              value={form.screenId}
              onChange={(e) => setForm({ ...form, screenId: e.target.value })}
            >
              {screensList.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.totalSeats || s.totalCapacity} seats)</option>
              ))}
            </select>
          </label>

          <label>
            Start Date & Time
            <input
              required
              type="datetime-local"
              value={form.startTime}
              onChange={(e) => setForm({ ...form, startTime: e.target.value })}
            />
          </label>

          <label>
            Regular (Silver) Ticket Price (₹)
            <input
              required
              type="number"
              min={50}
              value={form.basePrice}
              onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
            />
          </label>

          <label>
            Premium (Gold) Ticket Price (₹)
            <input
              required
              type="number"
              min={50}
              value={form.premiumPrice}
              onChange={(e) => setForm({ ...form, premiumPrice: e.target.value })}
            />
          </label>

          <label>
            VIP Recliner Ticket Price (₹)
            <input
              required
              type="number"
              min={50}
              value={form.reclinerPrice}
              onChange={(e) => setForm({ ...form, reclinerPrice: e.target.value })}
            />
          </label>

          <label>
            Audio Language
            <input
              required
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
            />
          </label>
        </div>

        <div className="admin-form-actions">
          <button className="button button-primary" disabled={submitting}>
            {submitting ? 'Scheduling & Generating Show Seats...' : 'Schedule Show & Provision Seats'}
          </button>
        </div>
      </form>

      {/* Shows List */}
      <div className="theaters-list-section" style={{ marginTop: '40px' }}>
        <h3>Active Scheduled Shows ({showsList.length})</h3>
        {showsList.length === 0 ? (
          <EmptyState title="No shows scheduled" message="Schedule your first show above." />
        ) : (
          <div className="admin-movie-list">
            {showsList.map((s) => (
              <div className="admin-movie-row" key={s.id}>
                <Poster movie={s.movie} />
                <div>
                  <span className="eyebrow">{s.language} · {s.screen?.theater?.city}</span>
                  <h3>{s.movie?.title}</h3>
                  <p>
                    {formatDate(s.startTime)} at {formatTime(s.startTime)} · {s.screen?.theater?.name} ({s.screen?.name})
                  </p>
                  <small style={{ color: 'var(--accent)', fontWeight: 600 }}>Starting from {formatMoney(s.basePrice)}</small>
                </div>
                <div className="admin-row-actions">
                  <Link className="button button-small button-dark" to={`/shows/${s.id}/seats`}>
                    View Live Seat Map →
                  </Link>
                  <button
                    type="button"
                    className="button button-small button-danger"
                    onClick={() => handleCancelShow(s.id, s.movie?.title)}
                  >
                    Cancel Show
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function AdminMediaTab({ notify, setTab }) {
  const [file, setFile] = useState(null)
  const [folder, setFolder] = useState('posters')
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [copied, setCopied] = useState(false)

  // Curated media library seed
  const [mediaGallery, setMediaGallery] = useState([
    {
      title: 'Lumière 360 Auditorium Panorama',
      folder: 'panoramas',
      format: 'WEBP',
      url: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'The Last Light - Official IMAX Poster',
      folder: 'posters',
      format: 'JPG',
      url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop',
    },
    {
      title: 'Neon Velocity 2026 Poster',
      folder: 'posters',
      format: 'JPG',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop',
    },
    {
      title: 'Cybernetic Dawn Hero Backdrop',
      folder: 'backdrops',
      format: 'JPG',
      url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Quantum Odyssey Wide Frame',
      folder: 'backdrops',
      format: 'JPG',
      url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    },
    {
      title: 'Abyssal Horizon Official Teaser',
      folder: 'posters',
      format: 'JPG',
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
    },
  ])

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setPreviewUrl(URL.createObjectURL(selected))
      setUploadedUrl('')
      setCopied(false)
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) {
      notify('Please select an image file to upload.', 'error')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('folder', folder)

      const res = await adminApi.uploadMedia(formData)
      const secureUrl = res.url || res.data?.url || res.data?.secure_url
      setUploadedUrl(secureUrl)
      notify('Media successfully uploaded to Cloudinary!', 'success')

      // Add to gallery
      const newAsset = {
        title: file.name.replace(/\.[^/.]+$/, ''),
        folder,
        format: file.name.split('.').pop()?.toUpperCase() || 'IMG',
        url: secureUrl,
      }
      setMediaGallery((prev) => [newAsset, ...prev])
    } catch (err) {
      notify(getApiError(err), 'error')
    } finally {
      setUploading(false)
    }
  }

  const copyToClipboard = (urlToCopy) => {
    const target = urlToCopy || uploadedUrl
    if (!target) return
    navigator.clipboard.writeText(target)
    setCopied(true)
    notify('Cloudinary URL copied to clipboard!', 'success')
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <section className="admin-section">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          type="button"
          className="button button-small button-ghost"
          onClick={() => setTab?.('overview')}
        >
          ← Back to Overview
        </button>
      </div>

      <SectionHeading
        eyebrow="Cloudinary Media Engine"
        title="Upload Cinema Visuals & 360 Panoramas"
        copy="Upload high-resolution movie posters, backdrops, and equirectangular 360 auditorium textures to production Cloudinary storage."
      />

      <div className="admin-form-card" style={{ maxWidth: '680px', margin: '0 auto' }}>
        <form onSubmit={handleUpload}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="input-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Target Media Folder</label>
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="select-input"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--surface-elevated, #161822)', color: '#fff', border: '1px solid var(--border-color, #272a38)' }}
            >
              <option value="posters">🎬 Movie Posters (Vertical 2:3)</option>
              <option value="backdrops">🌌 Hero Backdrops (Horizontal 16:9)</option>
              <option value="panoramas">🌐 360-Degree Panoramic Auditorium Textures (Equirectangular 2:1)</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="input-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Choose Image File (JPG, PNG, WebP)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px dashed var(--border-color, #3a3f55)',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                color: '#e2e8f0',
                cursor: 'pointer',
              }}
            />
          </div>

          {previewUrl && (
            <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>Selected File Preview</span>
              <img
                src={previewUrl}
                alt="Upload preview"
                style={{
                  maxHeight: '220px',
                  maxWidth: '100%',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #2a2e40)',
                  objectFit: 'contain',
                }}
              />
            </div>
          )}

          <div className="admin-form-actions">
            <button
              type="submit"
              className="button button-primary"
              disabled={uploading || !file}
              style={{ width: '100%' }}
            >
              {uploading ? 'Uploading to Cloudinary...' : '☁️ Upload to Cloudinary'}
            </button>
          </div>
        </form>

        {uploadedUrl && (
          <div
            style={{
              marginTop: '1.75rem',
              padding: '1.25rem',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <strong style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ✓ Upload Complete
              </strong>
              <button
                type="button"
                className="button button-small"
                onClick={() => copyToClipboard(uploadedUrl)}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                {copied ? 'Copied!' : '📋 Copy URL'}
              </button>
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                wordBreak: 'break-all',
                background: '#090a0f',
                padding: '0.75rem',
                borderRadius: '6px',
                border: '1px solid #1f2438',
                color: '#38bdf8',
              }}
            >
              {uploadedUrl}
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.75rem', marginBottom: 0 }}>
              Paste this URL into Movie posters, backdrops, or cinema scene configurations.
            </p>
          </div>
        )}
      </div>

      {/* Cloudinary Media Assets Gallery */}
      <div className="theaters-list-section" style={{ marginTop: '50px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <span className="eyebrow">Cloudinary Media Library</span>
            <h3 style={{ color: '#fff', margin: '4px 0 0' }}>Stored Visual Assets ({mediaGallery.length})</h3>
          </div>
          <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>One-click copy for movies & 3D textures</span>
        </div>

        <div className="admin-entity-grid">
          {mediaGallery.map((asset, idx) => (
            <div className="entity-card" key={idx} style={{ padding: '16px' }}>
              <div style={{ position: 'relative', width: '100%', height: '160px', borderRadius: '6px', overflow: 'hidden', background: '#000' }}>
                <img
                  src={asset.url}
                  alt={asset.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: 'rgba(0,0,0,0.75)',
                  color: '#f59e0b',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backdropFilter: 'blur(4px)',
                }}>
                  {asset.folder}
                </span>
                <span style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  background: 'rgba(0,0,0,0.75)',
                  color: '#38bdf8',
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}>
                  {asset.format || 'WEBP'}
                </span>
              </div>
              <div style={{ marginTop: '10px' }}>
                <h4 style={{ color: '#fff', fontSize: '0.95rem', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={asset.title}>
                  {asset.title}
                </h4>
                <div style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  background: 'rgba(255,255,255,0.03)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  marginBottom: '10px',
                }}>
                  {asset.url}
                </div>
                <button
                  type="button"
                  className="button button-small button-ghost"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    navigator.clipboard.writeText(asset.url)
                    notify(`Copied URL for "${asset.title}"!`, 'success')
                  }}
                >
                  📋 Copy URL
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function AdminResourcePage({ title, description }) {
  return (
    <div className="container admin-page">
      <BackLink to="/admin">Back to dashboard</BackLink>
      <div className="page-intro">
        <div>
          <span className="eyebrow">Administrator workspace</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
      <div className="state-card">
        <span className="state-icon">+</span>
        <h3>Management surface ready</h3>
        <p>This protected page is available to administrator accounts.</p>
        <Link className="button button-primary" to="/admin">Return to dashboard</Link>
      </div>
    </div>
  )
}
