import React, { createContext, useContext, useState, useEffect } from 'react';
import { UsuarioSistema, Role, RolSistema } from '../types';
import { auth, db, cerrarSesion, obtenerPerfilUsuario } from '../lib/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { obtenerPermisosPorDefecto } from '../data/usuariosYVotacionesData';

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
    let unsubscribeDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
        unsubscribeDoc = null;
      }

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

        const rolNormalizado = (profile.rol as RolSistema) || 'empleado';
        const permisosRaw = (Array.isArray(profile.permisos) && profile.permisos.length > 0)
          ? profile.permisos
          : obtenerPermisosPorDefecto(rolNormalizado);
        const permisosFiltrados = rolNormalizado === 'empleado'
          ? permisosRaw.filter(p => p !== 'documentos')
          : permisosRaw;

        const profileNormalizado: UsuarioSistema = {
          ...profile,
          rol: rolNormalizado,
          permisos: permisosFiltrados
        };

        setCurrentUser(profileNormalizado);
        setUserRoleState(profileNormalizado.rol === 'empleado' ? 'empleado' : 'admin');

        // Suscripción en tiempo real: Inactivación o eliminación expulsa de inmediato (SEC-B05)
        unsubscribeDoc = onSnapshot(doc(db, 'usuarios', user.uid), async (docSnap) => {
          if (!docSnap.exists()) {
            await cerrarSesion();
            setCurrentUser(null);
            setUserRoleState('empleado');
            return;
          }
          const data = docSnap.data() as UsuarioSistema;
          if (data.estado !== 'activo') {
            await cerrarSesion();
            setCurrentUser(null);
            setUserRoleState('empleado');
            return;
          }
          const rolDoc = (data.rol as RolSistema) || 'empleado';
          const permisosRawDoc = (Array.isArray(data.permisos) && data.permisos.length > 0)
            ? data.permisos
            : obtenerPermisosPorDefecto(rolDoc);
          const permisosFiltradosDoc = rolDoc === 'empleado'
            ? permisosRawDoc.filter(p => p !== 'documentos')
            : permisosRawDoc;

          const dataNormalizada: UsuarioSistema = {
            ...data,
            rol: rolDoc,
            permisos: permisosFiltradosDoc
          };
          setCurrentUser(dataNormalizada);
          setUserRoleState(dataNormalizada.rol === 'empleado' ? 'empleado' : 'admin');
        }, (err) => {
          if (import.meta.env.DEV) {
            console.debug('Listener de usuario cerrado:', err);
          }
        });
      } catch (err) {
        console.warn('Error al verificar perfil institucional:', err);
        setCurrentUser(null);
        setUserRoleState('empleado');
      }
    });

    return () => {
      if (unsubscribeDoc) {
        unsubscribeDoc();
      }
      unsubscribeAuth();
    };
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
    const rolNormalizado = (usuario.rol as RolSistema) || 'empleado';
    const permisosRaw = (Array.isArray(usuario.permisos) && usuario.permisos.length > 0)
      ? usuario.permisos
      : obtenerPermisosPorDefecto(rolNormalizado);
    const permisosFiltrados = rolNormalizado === 'empleado'
      ? permisosRaw.filter(p => p !== 'documentos')
      : permisosRaw;

    const usuarioNormalizado: UsuarioSistema = {
      ...usuario,
      rol: rolNormalizado,
      permisos: permisosFiltrados
    };
    setCurrentUser(usuarioNormalizado);
    setUserRoleState(usuarioNormalizado.rol === 'empleado' ? 'empleado' : 'admin');
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
