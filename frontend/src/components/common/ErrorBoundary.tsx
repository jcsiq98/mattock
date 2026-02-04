import { Component, type ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[300px] flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-danger-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-danger-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h2>
            <p className="text-slate-500 mb-6">
              We encountered an unexpected error. Please try again or refresh the page.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="btn-primary"
              >
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Try Again
              </button>
              <button
                onClick={this.handleRefresh}
                className="btn-secondary"
              >
                Refresh Page
              </button>
            </div>
            {this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">
                  Show error details
                </summary>
                <div className="mt-2 p-3 bg-slate-100 rounded-lg">
                  <p className="text-xs font-mono text-slate-600 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Inline error display component for non-critical errors
 */
export function ErrorMessage({ 
  message, 
  onRetry 
}: { 
  message: string; 
  onRetry?: () => void;
}) {
  return (
    <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-danger-700 font-medium">Error</p>
          <p className="text-danger-600 text-sm mt-1">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm font-medium text-danger-700 hover:text-danger-800 flex items-center gap-1"
            >
              <ArrowPathIcon className="w-4 h-4" />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

