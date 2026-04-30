import { Component } from 'react';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-neutral-100)] p-6">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <span className="text-3xl">!</span>
            </div>
            <h1 className="text-xl font-bold text-[var(--color-primary)] mb-2 text-center">
              Ceva nu a funcționat
            </h1>
            <p className="text-sm text-[var(--color-neutral-400)] mb-4 text-center">
              A apărut o eroare neașteptată. Te rugăm să reîncarci pagina.
            </p>

            {this.state.error && (
              <details className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-left">
                <summary className="cursor-pointer text-sm font-semibold text-red-700">
                  Detalii eroare (click pentru deschidere)
                </summary>
                <pre className="mt-2 text-xs text-red-900 overflow-x-auto whitespace-pre-wrap">
                  {this.state.error.message}
                  {this.state.error.stack && '\n\n' + this.state.error.stack}
                </pre>
              </details>
            )}

            <button
              onClick={() => window.location.reload()}
              className="w-full px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-light)] transition-colors cursor-pointer"
            >
              Reîncarcă pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
