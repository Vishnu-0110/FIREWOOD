const getStorage = (storageName) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window[storageName] || null;
  } catch {
    return null;
  }
};

const createStorageAdapter = (storageName) => ({
  getItem(key) {
    try {
      return getStorage(storageName)?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    try {
      getStorage(storageName)?.setItem(key, String(value));
      return true;
    } catch {
      return false;
    }
  },
  removeItem(key) {
    try {
      getStorage(storageName)?.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
});

export const safeLocalStorage = createStorageAdapter('localStorage');
export const safeSessionStorage = createStorageAdapter('sessionStorage');
