import React, { Component } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[GlobalErrorBoundary] Caught unhandled React error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="global-error-boundary-screen" style={{
          minHeight: '100vh',
          background: '#08080a',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          boxSizing: 'border-box',
        }}>
          <div style={{
            maxWidth: '540px',
            width: '100%',
            background: 'rgba(18, 18, 22, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            padding: '40px 32px',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 25px rgba(225, 29, 72, 0.15)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'rgba(225, 29, 72, 0.12)',
              border: '1px solid rgba(225, 29, 72, 0.4)',
              color: '#f43f5e',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 20px',
            }}>
              <AlertTriangle size={30} />
            </div>

            <h2 style={{
              fontSize: '22px',
              fontWeight: 800,
              margin: '0 0 10px',
              letterSpacing: '-0.02em',
              color: '#ffffff',
            }}>
              Something went wrong
            </h2>

            <p style={{
              fontSize: '14px',
              color: '#94a3b8',
              lineHeight: 1.6,
              margin: '0 0 24px',
            }}>
              The application encountered an unexpected runtime error. We've preserved your workspace; you can reload this view or return to the main lobby.
            </p>

            {this.state.error && (
              <div style={{
                background: '#0d0d12',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '24px',
                textAlign: 'left',
              }}>
                <span style={{ font: '10px "DM Mono", monospace', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '6px' }}>
                  Diagnostics
                </span>
                <code style={{
                  fontSize: '12px',
                  color: '#f87171',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace',
                }}>
                  {String(this.state.error?.message || this.state.error)}
                </code>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#000000',
                  fontWeight: 700,
                  fontSize: '13px',
                  padding: '11px 22px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'opacity 0.2s',
                }}
              >
                <RefreshCw size={15} />
                <span>Reload Page</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  padding: '11px 22px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.2s',
                }}
              >
                <Home size={15} />
                <span>Return to Lobby</span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

