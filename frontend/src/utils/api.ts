import axios from 'axios';

// Create an axios instance with the correct backend URL and API path
const api = axios.create({
  baseURL: 'http://localhost:10000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api; 