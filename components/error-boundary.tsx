'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Main error boundary component for catching application-wide errors
 * Provides fallback UI and error logging
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state to trigger error UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught error:', error);
      console.error('Error info:', errorInfo);
    }
    
    // In production, you would send this to an error reporting service
    // Example: logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback or default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with Material Design purple theme
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
            <div className="flex flex-col items-center text-center">
              {/* Error icon */}
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <svg 
                  className="w-8 h-8 text-purple-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h2>
              
              <p className="text-gray-600 mb-6">
                We encountered an unexpected error. Please try refreshing the page.
              </p>

              {/* Error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="w-full text-left mb-6">
                  <summary className="cursor-pointer text-sm text-purple-600 hover:text-purple-700 font-medium">
                    Show error details
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-100 p-3 rounded-lg overflow-auto max-h-40">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              <button
                onClick={() => window.location.reload()}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                aria-label="Refresh page"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;