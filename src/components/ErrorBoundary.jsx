import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You can also log the error to an error reporting service here
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isAuthError = this.state.error?.message?.includes('auth') || 
                         this.state.error?.message?.includes('token') ||
                         this.state.errorInfo?.componentStack?.includes('AuthContext');
      
      const isNetworkError = this.state.error?.message?.includes('fetch') ||
                            this.state.error?.message?.includes('network') ||
                            this.state.error?.message?.includes('timeout');

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="text-center">
              {/* Error Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>

              {/* Error Title */}
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                {isAuthError ? 'Authentication Error' : 
                 isNetworkError ? 'Connection Error' : 
                 'Something went wrong'}
              </h3>

              {/* Error Description */}
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                {isAuthError ? 'There was an issue with your login session. Please sign in again.' :
                 isNetworkError ? 'Unable to connect to the server. Please check your connection and try again.' :
                 'The application encountered an unexpected error. You can try refreshing the page or going back to the home page.'}
              </p>

              {/* Error Details (Development) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left mb-6 p-4 bg-slate-100 dark:bg-slate-700 rounded-md">
                  <summary className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer mb-2">
                    Error Details (Dev Only)
                  </summary>
                  <pre className="text-xs text-slate-600 dark:text-slate-400 whitespace-pre-wrap overflow-auto max-h-32">
                    {this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {isAuthError ? (
                  <button
                    onClick={() => window.location.href = '/signin'}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Sign In Again
                  </button>
                ) : (
                  <button
                    onClick={this.handleRetry}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Try Again {this.state.retryCount > 0 && `(${this.state.retryCount + 1})`}
                  </button>
                )}
                
                <div className="flex space-x-3">
                  <button
                    onClick={this.handleReload}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Reload Page
                  </button>
                  <button
                    onClick={this.handleGoHome}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    Go Home
                  </button>
                </div>
              </div>

              {/* Retry Count */}
              {this.state.retryCount > 2 && (
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                  If the problem persists, please contact support.
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
