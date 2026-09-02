import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(160deg, var(--beige) 0%, var(--white) 100%)', padding: 24
        }}>
          <div style={{ textAlign: 'center', maxWidth: 400 }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>😔</div>
            <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              We're sorry for the inconvenience. Please refresh the page or try again later.
            </p>
            <button className="btn btn--primary" onClick={() => window.location.reload()}>
              Refresh page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
