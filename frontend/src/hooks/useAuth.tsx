import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService, AuthUser, AuthSession } from '../services/auth';

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const existing = AuthService.getSession();
    if (existing) {
      setSession(existing);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, pass: string) => {
    const sess = await AuthService.signIn(email, pass);
    setSession(sess);
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const sess = await AuthService.signUp(email, pass, name);
    setSession(sess);
  };

  const signOut = async () => {
    await AuthService.signOut();
    setSession(null);
  };

  const resetPassword = async (email: string) => {
    await AuthService.resetPassword(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
