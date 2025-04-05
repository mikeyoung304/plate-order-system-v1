import React from "react";

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
      isMaxRetries: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      isMaxRetries: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error);
      console.error("Component stack:", errorInfo.componentStack);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    this.setState((prevState) => {
      const newRetryCount = prevState.retryCount + 1;
      const newIsMaxRetries = newRetryCount >= maxRetries;
      return {
        hasError: true,
        retryCount: newRetryCount,
        isMaxRetries: newIsMaxRetries,
      };
    });
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isMaxRetries: false,
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

      // --- Simplified Fallback UI ---
      return (
        <div
          style={{
            padding: "20px",
            border: "2px solid red",
            margin: "20px",
            backgroundColor: "#fee",
          }}
        >
          <h1>Application Error</h1>
          <p>An error occurred while rendering this part of the application.</p>
          {process.env.NODE_ENV === "development" && error && (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
                backgroundColor: "#ddd",
                padding: "10px",
                marginTop: "10px",
              }}
            >
              Error: {error.message}
              {"\n\n"}
              Stack: {error.stack}
              {errorInfo && errorInfo.componentStack
                ? `\n\nComponent Stack: ${errorInfo.componentStack}`
                : ""}
            </pre>
          )}
          <button
            onClick={this.handleRefresh}
            style={{ marginTop: "10px", padding: "5px 10px" }}
          >
            Refresh Page
          </button>
        </div>
      );
      // --- End Simplified Fallback UI ---
    }

    return children;
  }
}

export default ErrorBoundary;
