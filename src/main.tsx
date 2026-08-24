import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    console.error('App crashed:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', fontFamily: 'sans-serif' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 40, maxWidth: 480, width: '100%', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontWeight: 800, fontSize: 18, marginBottom: 8, color: '#0f172a' }}>Something went wrong</h2>
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
              {this.state.error?.message || 'An unexpected error occurred. Please refresh the page.'}
            </p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/dashboard'; }}
              style={{ background: '#1B4B82', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
