import { createSlice } from '@reduxjs/toolkit';
import { safeLocalStorage } from '../utils/browserStorage';

const isStoredTokenExpired = (token) => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = JSON.parse(atob(padded));
    const exp = Number(decoded?.exp);
    if (!Number.isFinite(exp)) return false;
    return exp <= Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
};

const getStoredTheme = () => {
  const storedTheme = safeLocalStorage.getItem('app_theme');
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  const rawUser = safeLocalStorage.getItem('user');
  if (rawUser) {
    try {
      const parsedUser = JSON.parse(rawUser);
      if (parsedUser?.theme === 'dark') return 'dark';
    } catch {
      // Ignore malformed persisted user payloads and fall back to light.
    }
  }

  return 'light';
};

const getStoredAuthState = () => {
  const rawToken = safeLocalStorage.getItem('token');
  const rawUser = safeLocalStorage.getItem('user');

  if (!rawToken || !rawUser) {
    return { user: null, token: null, isAuthenticated: false };
  }

  try {
    const parsedUser = JSON.parse(rawUser);
    if (!parsedUser || typeof parsedUser !== 'object') {
      throw new Error('Invalid user payload in storage');
    }
    if (isStoredTokenExpired(rawToken)) {
      throw new Error('Stored token expired');
    }

    return {
      user: parsedUser,
      token: rawToken,
      isAuthenticated: true
    };
  } catch {
    safeLocalStorage.removeItem('user');
    safeLocalStorage.removeItem('token');
    return { user: null, token: null, isAuthenticated: false };
  }
};

const storedTheme = getStoredTheme();
if (!safeLocalStorage.getItem('app_theme')) {
  safeLocalStorage.setItem('app_theme', storedTheme);
}
const storedAuth = {
  ...getStoredAuthState(),
  theme: storedTheme
};

const authSlice = createSlice({
  name: 'auth',
  initialState: storedAuth,
  reducers: {
    setCredentials: (state, action) => {
      const { user: authUser, token: authToken } = action.payload;
      const nextTheme = authUser?.theme === 'dark' || authUser?.theme === 'light'
        ? authUser.theme
        : state.theme === 'dark' || state.theme === 'light'
          ? state.theme
          : 'light';

      state.theme = nextTheme;
      state.user = authUser ? { ...authUser, theme: nextTheme } : authUser;
      if (authToken) {
        state.token = authToken;
        safeLocalStorage.setItem('token', authToken);
      }
      state.isAuthenticated = Boolean(state.user && state.token);
      safeLocalStorage.setItem('user', JSON.stringify(state.user));
      safeLocalStorage.setItem('app_theme', nextTheme);
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      safeLocalStorage.removeItem('user');
      safeLocalStorage.removeItem('token');
    },
    toggleTheme: (state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      state.theme = nextTheme;
      if (state.user) {
        state.user.theme = nextTheme;
        safeLocalStorage.setItem('user', JSON.stringify(state.user));
      }
      safeLocalStorage.setItem('app_theme', nextTheme);
    }
  }
});

export const { setCredentials, clearCredentials, toggleTheme } = authSlice.actions;
export default authSlice.reducer;
