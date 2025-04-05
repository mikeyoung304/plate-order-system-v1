import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";
// import * as serviceWorkerRegistration from './serviceWorkerRegistration'; // Remove import as file doesn't exist

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);

root.render(
  // <React.StrictMode> // Temporarily disable StrictMode for debugging
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>,
  // </React.StrictMode> // Temporarily disable StrictMode for debugging
);
