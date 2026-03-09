import { createSlice } from '@reduxjs/toolkit';

const user = localStorage.getItem('user');
const token = localStorage.getItem('token');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: user ? JSON.parse(user) : null,
    token: token || null,
    isAuthenticated: Boolean(user && token)
  },
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
