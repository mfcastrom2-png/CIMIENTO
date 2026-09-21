import React, { createContext, useContext, useState, useEffect } from 'react';
import { UsuarioSistema, Role } from '../types';
import { auth, cerrarSesion, obtenerPerfilUsuario } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  currentUser: UsuarioSistema | null;
  userRole: Role;
  fbUser: FirebaseUser | null;
  authReady: boolean;
  isSuperAdmin: boolean;
  logout: () => Promise<void>;
  loginSuccess: (usuario: UsuarioSistema) => void;
  setCurrentUser: React.Dispatch<React.SetStateAction<UsuarioSistema | null>>;
  setUserRole: React.Dispatch<React.SetStateAction<Role>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UsuarioSistema | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [fbUser, setFbUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<Role>('admin');

  const isSuperAdmin =
    currentUser?.rol === 'superadmin' ||
    currentUser?.email?.toLowerCase() === 'mf.castrom2@gmail.com';

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setFbUser(user);
      setAuthReady(true);
      if (!user) {
        setCurrentUser(null);
        return;
      }

      try {
        const profile = await obtenerPerfilUsuario(user.uid);
        if (!profile || profile.estado !== 'activo') {
          await cerrarSesion();
          setCurrentUser(null);
          return;
        }

        setCurrentUser(profile);
        setUserRole(profile.rol === 'empleado' ? 'empleado' : 'admin');
      } catch (err) {
        console.warn('Error al verificar perfil institucional:', err);
        setCurrentUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const logout = async () => {
    try {
      await cerrarSesion();
    } catch (e) {
      console.warn('Error al cerrar sesión:', e);
    }
    setCurrentUser(null);
  };

  const loginSuccess = (usuario: UsuarioSistema) => {
    setCurrentUser(usuario);
    setUserRole(usuario.rol === 'empleado' ? 'empleado' : 'admin');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole,
        fbUser,
        authReady,
        isSuperAdmin,
        logout,
        loginSuccess,
        setCurrentUser,
        setUserRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
