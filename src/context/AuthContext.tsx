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
  const [userRoleState, setUserRoleState] = useState<Role>('empleado');

  const isSuperAdmin =
    currentUser?.rol === 'superadmin';

  const isRealAdmin =
    isSuperAdmin ||
    currentUser?.rol === 'admin_gh';

  // Setter seguro con protección estricta contra escalación de privilegios
  const setUserRole: React.Dispatch<React.SetStateAction<Role>> = (valueOrFn) => {
    // Si el usuario autenticado es empleado, NUNCA permitir adoptar rol admin
    if (currentUser?.rol === 'empleado') {
      console.warn('[Seguridad RBAC] Intento de escalación de privilegios bloqueado: un colaborador no puede adoptar rol administrador.');
      setUserRoleState('empleado');
      return;
    }

    // Solo los administradores legítimos (superadmin / admin_gh) pueden alternar para simular vista de empleado
    if (!isRealAdmin) {
      console.warn('[Seguridad RBAC] Solo administradores pueden alternar la vista de prueba.');
      setUserRoleState('empleado');
      return;
    }

    setUserRoleState(valueOrFn);
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setFbUser(user);
      setAuthReady(true);
      if (!user) {
        setCurrentUser(null);
        setUserRoleState('empleado');
        return;
      }

      try {
        const profile = await obtenerPerfilUsuario(user.uid, user.email || undefined);
        if (!profile || profile.estado !== 'activo') {
          await cerrarSesion();
          setCurrentUser(null);
          setUserRoleState('empleado');
          return;
        }

        setCurrentUser(profile);
        // Asignar rol inicial basado estrictamente en el perfil oficial de la base de datos
        setUserRoleState(profile.rol === 'empleado' ? 'empleado' : 'admin');
      } catch (err) {
        console.warn('Error al verificar perfil institucional:', err);
        setCurrentUser(null);
        setUserRoleState('empleado');
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
    setUserRoleState('empleado');
  };

  const loginSuccess = (usuario: UsuarioSistema) => {
    setCurrentUser(usuario);
    setUserRoleState(usuario.rol === 'empleado' ? 'empleado' : 'admin');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole: userRoleState,
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
