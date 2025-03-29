import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  maxRetries?: number;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  isMaxRetries: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isMaxRetries: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      isMaxRetries: false
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    this.setState(prevState => {
      const newRetryCount = prevState.retryCount + 1;
      const newIsMaxRetries = newRetryCount >= maxRetries;
      return {
        hasError: true,
        retryCount: newRetryCount,
        isMaxRetries: newIsMaxRetries
      };
    });
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isMaxRetries: false
    });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    const { children, fallback, maxRetries = 3 } = this.props;
    const { hasError, error, errorInfo, retryCount, isMaxRetries } = this.state;

    if (hasError && error) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>Something went wrong</h2>
            <div className="error-details">
              <p className="error-message">{error.message}</p>
              {process.env.NODE_ENV === 'development' && errorInfo && (
                <pre className="error-stack">
                  {error.stack}
                  {errorInfo.componentStack}
                </pre>
              )}
            </div>
            <div className="error-actions">
              <button
                className={`btn btn-primary ${isMaxRetries ? 'disabled' : ''}`}
                onClick={this.handleRetry}
                disabled={isMaxRetries}
                data-testid="retry-button"
                aria-disabled={isMaxRetries}
              >
                Try again ({retryCount}/{maxRetries})
                {isMaxRetries && <span> - Max retries reached</span>}
              </button>
              <button 
                className="btn btn-secondary"
                onClick={this.handleReset}
              >
                Reset
              </button>
              <button 
                className="btn btn-secondary"
                onClick={this.handleRefresh}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default ErrorBoundary; 