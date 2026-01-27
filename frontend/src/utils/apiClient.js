import axios from 'axios';
import { API_URL } from '../config';

/**
 * Centralized API client to eliminate duplicate axios configurations
 */
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for common request handling
apiClient.interceptors.request.use(
  (config) => {
    // Add any common request logic here (auth tokens, etc.)
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for common error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Common error handling
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access');
    } else if (error.response?.status >= 500) {
      // Handle server errors
      console.error('Server error:', error.response.data?.error || error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;