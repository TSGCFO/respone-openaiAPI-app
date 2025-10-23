'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Chat-specific error boundary for handling errors in the chat interface
 * Provides contextual error messages for chat-related failures
 */
class ChatErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log chat-specific errors
    console.error('Chat component error:', error);
    
    // Check for specific error types
    if (error.message?.includes('OpenAI') || error.message?.includes('API')) {
      console.error('API communication error in chat');
    } else if (error.message?.includes('WebSocket') || error.message?.includes('connection')) {
      console.error('Connection error in chat');
    }
  }

  render() {
    if (this.state.hasError) {
      const isConnectionError = this.state.error?.message?.toLowerCase().includes('connection') ||
                               this.state.error?.message?.toLowerCase().includes('network');
      const isAPIError = this.state.error?.message?.toLowerCase().includes('api') ||
                        this.state.error?.message?.toLowerCase().includes('openai');

      return (
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-50">
          <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full">
            <div className="flex flex-col items-center text-center">
              {/* Error icon with purple theme */}
              <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <svg 
                  className="w-7 h-7 text-purple-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
                  />
                </svg>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {isConnectionError ? 'Connection Issue' : 
                 isAPIError ? 'Service Unavailable' : 
                 'Chat Error'}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {isConnectionError ? 
                  'Unable to connect to the chat service. Please check your internet connection.' :
                 isAPIError ? 
                  'The AI service is temporarily unavailable. Please try again in a moment.' :
                  'Something went wrong with the chat. Please refresh to continue.'}
              </p>

              {/* Development error details */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="w-full text-left mb-4">
                  <summary className="cursor-pointer text-xs text-purple-600 hover:text-purple-700">
                    Debug info
                  </summary>
                  <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {this.state.error.message}
                  </pre>
                </details>
              )}

              <div className="flex gap-2 w-full">
                <button
                  onClick={() => this.setState({ hasError: false, error: null })}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-full text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1"
                  aria-label="Try again"
                >
                  Try Again
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-full text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
                  aria-label="Refresh"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ChatErrorBoundary;