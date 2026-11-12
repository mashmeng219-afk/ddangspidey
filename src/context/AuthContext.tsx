import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider, checkIsOwner } from '../firebase';

interface AuthContextType {
  user: User | null;
  isOwner: boolean;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isOwner: false,
  loading: true,
  authError: null,
  clearAuthError: () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.email) {
        if (!checkIsOwner(currentUser.email)) {
          // 허용 목록에 없는 계정으로 로그인하면 즉시 로그아웃 처리하고 안내
          try {
            await signOut(auth);
          } catch {
            // ignore sign out error
          }
          setUser(null);
          setAuthError('접근 권한이 없습니다.');
          setLoading(false);
          return;
        }
      }
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isOwner = Boolean(user && user.email && checkIsOwner(user.email));

  const clearAuthError = () => setAuthError(null);

  const loginWithGoogle = async () => {
    try {
      setAuthError(null);
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user && !checkIsOwner(res.user.email)) {
        try {
          await signOut(auth);
        } catch {
          // ignore sign out error
        }
        setUser(null);
        const msg = '접근 권한이 없습니다.';
        setAuthError(msg);
        throw new Error(msg);
      }
    } catch (error) {
      console.error('Google Sign In failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setAuthError(null);
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isOwner,
        loading,
        authError,
        clearAuthError,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
