import { createSlice } from '@reduxjs/toolkit';

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
  const storedTheme = localStorage.getItem('app_theme');
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  const rawUser = localStorage.getItem('user');
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
  const rawToken = localStorage.getItem('token');
  const rawUser = localStorage.getItem('user');

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
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return { user: null, token: null, isAuthenticated: false };
  }
};

const storedTheme = getStoredTheme();
if (!localStorage.getItem('app_theme')) {
  localStorage.setItem('app_theme', storedTheme);
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
        : state.theme || storedTheme;

      state.theme = nextTheme;
      state.user = authUser ? { ...authUser, theme: nextTheme } : authUser;
      if (authToken) {
        state.token = authToken;
        localStorage.setItem('token', authToken);
      }
      state.isAuthenticated = Boolean(state.user && state.token);
      localStorage.setItem('user', JSON.stringify(state.user));
      localStorage.setItem('app_theme', nextTheme);
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    toggleTheme: (state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      state.theme = nextTheme;
      if (state.user) {
        state.user.theme = nextTheme;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
      localStorage.setItem('app_theme', nextTheme);
    }
  }
});

export const { setCredentials, clearCredentials, toggleTheme } = authSlice.actions;
export default authSlice.reducer;
