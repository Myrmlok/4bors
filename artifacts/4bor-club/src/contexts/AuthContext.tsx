import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useGetMe, getGetMeQueryKey, setAuthTokenGetter, User } from '@workspace/api-client-react';
import { useLocation } from 'wouter';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
  setToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require auth
const PUBLIC_PATHS = ['/login', '/register'];

// Set up the token getter for customFetch immediately
setAuthTokenGetter(() => {
  return localStorage.getItem('club_token');
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [token, setTokenState] = useState<string | null>(localStorage.getItem('club_token'));

  const isPublic = PUBLIC_PATHS.some((p) => location === p || location.startsWith(p + '/'));

  const { data: user, isLoading, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      queryKey: getGetMeQueryKey(),
    },
  });

  // Redirect to /login when token is invalid/expired
  useEffect(() => {
    if (error) {
      setTokenState(null);
      localStorage.removeItem('club_token');
      if (!isPublic) setLocation('/login');
    }
  }, [error, isPublic, setLocation]);

  // Redirect to /login when there is no token and not on a public page
  useEffect(() => {
    if (!token && !isPublic) {
      setLocation('/login');
    }
  }, [token, isPublic, setLocation]);

  const setToken = (newToken: string) => {
    localStorage.setItem('club_token', newToken);
    setTokenState(newToken);
  };

  const logout = () => {
    localStorage.removeItem('club_token');
    setTokenState(null);
    setLocation('/login');
  };

  return (
    <AuthContext.Provider value={{ user: user || null, isLoading, logout, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
