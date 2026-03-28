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

const storedAuth = getStoredAuthState();

const authSlice = createSlice({
  name: 'auth',
  initialState: storedAuth,
  reducers: {
    setCredentials: (state, action) => {
      const { user: authUser, token: authToken } = action.payload;
      state.user = authUser;
      if (authToken) {
        state.token = authToken;
        localStorage.setItem('token', authToken);
      }
      state.isAuthenticated = Boolean(state.user && state.token);
      localStorage.setItem('user', JSON.stringify(authUser));
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    },
    toggleTheme: (state) => {
      if (state.user) {
        const nextTheme = state.user.theme === 'dark' ? 'light' : 'dark';
        state.user.theme = nextTheme;
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    }
  }
});

export const { setCredentials, clearCredentials, toggleTheme } = authSlice.actions;
export default authSlice.reducer;
