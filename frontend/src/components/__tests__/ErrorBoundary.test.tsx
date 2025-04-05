import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorBoundary from "../ErrorBoundary";

// Mock console.error to avoid noise in test output
const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});

describe("ErrorBoundary", () => {
  const ThrowError = () => {
    throw new Error("Test error");
  };

  beforeEach(() => {
    // Reset console.error mock
    consoleError.mockClear();
  });

  afterAll(() => {
    consoleError.mockRestore();
  });

  test("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("Test content")).toBeInTheDocument();
  });

  test("renders error UI when there is an error", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  test("renders custom fallback when provided", () => {
    const CustomFallback = () => <div>Custom error UI</div>;

    render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByText("Custom error UI")).toBeInTheDocument();
  });

  test("handles retry button click", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    const retryButton = screen.getByText(/Try again/);
    fireEvent.click(retryButton);

    // Since the error is thrown immediately, it should still show error UI
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  test("handles reset button click", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    const resetButton = screen.getByText("Reset");
    fireEvent.click(resetButton);

    // Since the error is thrown immediately, it should still show error UI
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  test("handles refresh button click", () => {
    const reload = jest.fn();
    Object.defineProperty(window, "location", {
      value: { reload: reload },
      writable: true,
    });

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    const refreshButton = screen.getByText("Refresh Page");
    fireEvent.click(refreshButton);

    expect(reload).toHaveBeenCalled();
  });

  test("disables retry button after max retries", () => {
    render(
      <ErrorBoundary maxRetries={2}>
        <ThrowError />
      </ErrorBoundary>,
    );

    // Click retry button twice
    const retryButton = screen.getByTestId("retry-button");
    fireEvent.click(retryButton);
    fireEvent.click(retryButton);

    expect(retryButton).toBeDisabled();
    expect(screen.getByText(/Max retries reached/)).toBeInTheDocument();
  });

  test("calls onError prop when error occurs", () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
  });

  test("shows stack trace in development environment", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    const errorStack = screen.getByText((content) => {
      return (
        content.includes("Error: Test error") &&
        content.includes("at ThrowError")
      );
    });
    expect(errorStack).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  test("does not show stack trace in production environment", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.queryByText(/componentStack/)).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});
