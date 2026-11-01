import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../services/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    authApi.getCurrentUser()
      .then(({ user: restoredUser }) => { if (active) setUser(restoredUser); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const register = async (payload) => {
    const data = await authApi.register(payload);
    setUser(data.user);
    return data.user;
  };

  const login = async (payload) => {
    const data = await authApi.login(payload);
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    try { await authApi.logout(); }
    finally { setUser(null); }
  };

  const value = useMemo(() => ({ user, loading, register, login, logout }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
