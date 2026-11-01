import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authApi from '../services/authApi.js';
import { SESSION_EXPIRED_MESSAGE } from '../services/session.js';
import { connectRealtime, disconnectRealtime } from '../services/realtime.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const redirectingRef = useRef(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleSessionExpired = () => {
      if (redirectingRef.current || window.location.pathname === '/login' || window.location.pathname === '/register') return;
      redirectingRef.current = true;
      setUser(null);
      disconnectRealtime();
      sessionStorage.setItem('pantrypal-session-message', SESSION_EXPIRED_MESSAGE);
      navigate('/login', {
        replace: true,
        state: {
          from: `${window.location.pathname}${window.location.search}${window.location.hash}`,
          sessionExpired: true,
        },
      });
    };
    window.addEventListener('pantrypal:session-expired', handleSessionExpired);
    return () => window.removeEventListener('pantrypal:session-expired', handleSessionExpired);
  }, [navigate]);

  useEffect(() => {
    if (user) connectRealtime();
    else disconnectRealtime();
    return () => disconnectRealtime();
  }, [user]);

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
    redirectingRef.current = false;
    setUser(data.user);
    return data.user;
  };

  const login = async (payload) => {
    const data = await authApi.login(payload);
    redirectingRef.current = false;
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    redirectingRef.current = false;
    try { await authApi.logout(); }
    finally { setUser(null); }
  };

  const deleteAccount = async (payload) => {
    const data = await authApi.deleteAccount(payload);
    redirectingRef.current = false;
    setUser(null);
    return data;
  };

  const value = useMemo(() => ({ user, loading, register, login, logout, deleteAccount }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
