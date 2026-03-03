import { createSlice } from '@reduxjs/toolkit';

const user = localStorage.getItem('user');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: user ? JSON.parse(user) : null,
    isAuthenticated: Boolean(user)
  },
  reducers: {
    setCredentials: (state, action) => {
      const { user: authUser } = action.payload;
      state.user = authUser;
      state.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(authUser));
    },
    clearCredentials: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
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
