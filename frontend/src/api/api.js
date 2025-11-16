import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

export const AUTH_STORAGE_KEYS = {
  accessToken: 'uniben_access_token',
  refreshToken: 'uniben_refresh_token',
  user: 'uniben_user'
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

let authHandlers = {
  getAccessToken: null,
  onRefresh: null,
  onRefreshSuccess: null,
  onSignOut: null
};

let refreshPromise = null;

export const registerAuthInterceptors = ({
  getAccessToken,
  onRefresh,
  onRefreshSuccess,
  onSignOut
}) => {
  authHandlers = {
    getAccessToken,
    onRefresh,
    onRefreshSuccess,
    onSignOut
  };
};

api.interceptors.request.use((config) => {
  const token = authHandlers.getAccessToken?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;

    if (status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = authHandlers.onRefresh?.();
        }

        const tokenPayload = await refreshPromise;
        refreshPromise = null;

        if (tokenPayload?.access_token) {
          authHandlers.onRefreshSuccess?.(tokenPayload);
          originalRequest.headers.Authorization = `Bearer ${tokenPayload.access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        refreshPromise = null;
        authHandlers.onSignOut?.();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
