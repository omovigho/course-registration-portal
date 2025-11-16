import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import api, { API_BASE_URL, AUTH_STORAGE_KEYS, registerAuthInterceptors } from '../api/api.js';

const AuthContext = createContext({
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: () => {},
  refreshSession: async () => {},
  updateStoredUser: () => {},
  refreshUser: async () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const persistTokens = useCallback((tokens) => {
    if (!tokens) {
      return;
    }

    if (tokens.access_token) {
      localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, tokens.access_token);
      setAccessToken(tokens.access_token);
    }
    if (tokens.refresh_token) {
      localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, tokens.refresh_token);
      setRefreshToken(tokens.refresh_token);
    }
  }, []);

  const persistUser = useCallback((payload) => {
    if (!payload) {
      setUser(null);
      localStorage.removeItem(AUTH_STORAGE_KEYS.user);
      return;
    }

    setUser((prev) => {
      const nextUser = { ...(prev ?? {}), ...payload };
      localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(nextUser));
      return nextUser;
    });
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
    localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
    localStorage.removeItem(AUTH_STORAGE_KEYS.user);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const { data } = await api.get('/users/me');
      persistUser(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch current user', error);
      return null;
    }
  }, [persistUser]);

  const refreshSession = useCallback(async () => {
    const storedRefresh =
      refreshToken ?? localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);

    if (!storedRefresh) {
      throw new Error('Missing refresh token');
    }

    const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: storedRefresh
    });

    persistTokens(data);
    return data;
  }, [persistTokens, refreshToken]);

  const login = useCallback(
    async ({ email, password }) => {
      const { data } = await api.post('/auth/login', { email, password });
      persistTokens(data);
      const userData = await fetchCurrentUser();
      return userData;
    },
    [fetchCurrentUser, persistTokens]
  );

  const signup = useCallback(
    async ({ email, password, full_name }) => {
      const payload = { email, password, full_name };
      const { data } = await api.post('/auth/signup', payload);
      return data;
    },
    []
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const updateStoredUser = useCallback(
    (nextUser) => {
      persistUser(nextUser);
    },
    [persistUser]
  );

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const storedAccess = localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
        const storedRefresh = localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
        const storedUser = localStorage.getItem(AUTH_STORAGE_KEYS.user);

        if (storedAccess) {
          setAccessToken(storedAccess);
        }
        if (storedRefresh) {
          setRefreshToken(storedRefresh);
        }
        if (storedUser) {
          try {
            persistUser(JSON.parse(storedUser));
          } catch (error) {
            console.warn('Failed to parse stored user payload', error);
            persistUser(null);
          }
        }

        if (storedAccess) {
          await fetchCurrentUser();
        }
      } catch (error) {
        console.error('Bootstrap auth error', error);
        clearSession();
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [clearSession, fetchCurrentUser, persistUser]);

  useEffect(() => {
    registerAuthInterceptors({
      getAccessToken: () => localStorage.getItem(AUTH_STORAGE_KEYS.accessToken),
      onRefresh: refreshSession,
      onRefreshSuccess: persistTokens,
      onSignOut: clearSession
    });
  }, [clearSession, persistTokens, refreshSession]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      refreshToken,
      loading,
      login,
      signup,
      logout,
      refreshSession,
      updateStoredUser,
      refreshUser: fetchCurrentUser
    }),
    [
      accessToken,
      loading,
      login,
      logout,
      refreshSession,
      refreshToken,
      signup,
      fetchCurrentUser,
      updateStoredUser,
      user
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => React.useContext(AuthContext);

export default AuthContext;
