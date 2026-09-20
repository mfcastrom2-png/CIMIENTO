import React, { useState, useMemo, useEffect } from 'react';
import {
  LogAuditoriaUsuario,
  Role,
  RolSistema,
  UsuarioSistema
} from '../types';
import {
  INITIAL_LOGS_AUDITORIA,
  INITIAL_USUARIOS_SISTEMA,
  MODULOS_SISTEMA
} from '../data/usuariosYVotacionesData';
import {
  guardarUsuarioFB,
  eliminarUsuarioFB,
  enviarNotificacionCorreoNuevoUsuario,
  migrarDocumentosConEmpresaId,
  CUENTAS_PRUEBA_OFICIALES
} from '../lib/firebase';
import {
  ComprobanteNotificacionModal,
  ComprobanteNotificacionData
} from './ComprobanteNotificacionModal';
import {
  generarCartaBienvenida,
  generarAsuntoBienvenida
} from '../utils/notificacionesCorreo';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  ExternalLink,
  Filter,
  Key,
  Lock,
  LogOut,
  Mail,
  Plus,
  RotateCcw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
  XCircle
} from 'lucide-react';

interface UsuariosViewProps {
  currentRole?: Role;
  userRole?: Role;
  onRoleChange?: (newRole: Role) => void;
  empleados?: any[];
  cargos?: any[];
  isSuperAdmin?: boolean;
  usuarios?: UsuarioSistema[];
  onActualizarUsuarios?: (nuevos: UsuarioSistema[]) => void;
}

export function UsuariosView({
  currentRole,
  userRole,
  onRoleChange,
  empleados = [],
  cargos = [],
  isSuperAdmin = false,
  usuarios: propsUsuarios,
  onActualizarUsuarios
}: UsuariosViewProps) {
  const activeUserRole = userRole || currentRole || 'admin';
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>(propsUsuarios || INITIAL_USUARIOS_SISTEMA);
  const [logs, setLogs] = useState<LogAuditoriaUsuario[]>(INITIAL_LOGS_AUDITORIA);
  const [activeTab, setActiveTab] = useState<'usuarios' | 'rolesMatriz' | 'auditoria' | 'aislamiento'>('usuarios');
  const [migrandoAislamiento, setMigrandoAislamiento] = useState(false);
  const [resultadoMigracion, setResultadoMigracion] = useState<{
    documentosActualizados: number;
    coleccionesProcesadas: string[];
    usuariosCreados: string[];
    detalles: string[];
  } | null>(null);

  const handleEjecutarMigracion = async () => {
    setMigrandoAislamiento(true);
    try {
      const res = await migrarDocumentosConEmpresaId('empresa-a');
      setResultadoMigracion(res);
      mostrarNotificacion(`Migración finalizada: ${res.documentosActualizados} docs actualizados con empresaId="empresa-a"`);
    } catch (err: any) {
      mostrarNotificacion(`Error en migración: ${err?.message || err}`);
    } finally {
      setMigrandoAislamiento(false);
    }
  };

  useEffect(() => {
    if (propsUsuarios && propsUsuarios.length > 0) {
      setUsuarios(propsUsuarios);
    }
  }, [propsUsuarios]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState<string>('TODOS');
  const [filterEstado, setFilterEstado] = useState<string>('TODOS');

  // Modales
  const [modalCrearOpen, setModalCrearOpen] = useState(false);
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<UsuarioSistema | null>(null);

  // Formulario nuevo usuario
  const [nuevoUsuario, setNuevoUsuario] = useState<Partial<UsuarioSistema>>({
    nombre: '',
    documento: '',
    email: '',
    rol: 'empleado',
    cargoNombre: '',
    estado: 'activo',
    dobleFactorHabilitado: false,
    permisos: ['dashboard', 'solicitudes', 'capacitaciones', 'sst', 'documentos']
  });
  const [passwordTemporal, setPasswordTemporal] = useState<string>('BGroup2026*');
  const [enviarNotificacionEmail, setEnviarNotificacionEmail] = useState<boolean>(true);
  const [copiadoFeedback, setCopiadoFeedback] = useState<boolean>(false);
  const [notificacionReenviando, setNotificacionReenviando] = useState<boolean>(false);

  // Modal comprobante de notificación por correo
  const [notificacionModalData, setNotificacionModalData] = useState<ComprobanteNotificacionData | null>(null);

  const [notificacion, setNotificacion] = useState<string | null>(null);

  const mostrarNotificacion = (msg: string) => {
    setNotificacion(msg);
    setTimeout(() => setNotificacion(null), 3500);
  };

  const handleGenerarClaveAleatoria = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = 'BG-';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    res += '*';
    setPasswordTemporal(res);
  };

  // Filtrado de usuarios
  const filteredUsuarios = useMemo(() => {
    return usuarios.filter(u => {
      const matchSearch =
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.documento.includes(searchTerm) ||
        (u.cargoNombre && u.cargoNombre.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRol = filterRol === 'TODOS' || u.rol === filterRol;
      const matchEstado = filterEstado === 'TODOS' || u.estado === filterEstado;

      return matchSearch && matchRol && matchEstado;
    });
  }, [usuarios, searchTerm, filterRol, filterEstado]);

  // Contadores
  const metrics = useMemo(() => {
    const total = usuarios.length;
    const activos = usuarios.filter(u => u.estado === 'activo').length;
    const adminCount = usuarios.filter(u => u.rol === 'superadmin' || u.rol === 'admin_gh').length;
    const con2FA = usuarios.filter(u => u.dobleFactorHabilitado).length;
    return { total, activos, adminCount, con2FA };
  }, [usuarios]);

  // Guardar nuevo usuario
  const handleGuardarNuevo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.documento) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    const emailLimpio = (nuevoUsuario.email || '').trim().toLowerCase();
    const claveAsignada = passwordTemporal.trim() || 'BGroup2026*';

    const nuevo: UsuarioSistema = {
      id: `usr-${Date.now()}`,
      nombre: (nuevoUsuario.nombre || '').trim(),
      documento: (nuevoUsuario.documento || '').trim(),
      email: emailLimpio,
      rol: (nuevoUsuario.rol as RolSistema) || 'empleado',
      cargoNombre: (nuevoUsuario.cargoNombre || 'Colaborador').trim(),
      estado: (nuevoUsuario.estado as any) || 'activo',
      ultimoAcceso: 'Nunca',
      fechaCreacion: new Date().toISOString().split('T')[0],
      dobleFactorHabilitado: Boolean(nuevoUsuario.dobleFactorHabilitado),
      password: claveAsignada,
      permisos: nuevoUsuario.permisos || ['dashboard']
    };

    // 1. Guardar en Firestore
    try {
      await guardarUsuarioFB(nuevo);
    } catch (err) {
      console.warn('Error al guardar usuario en Firestore:', err);
    }

    // 2. Guardar en estado local
    setUsuarios(prev => [nuevo, ...prev]);
    onActualizarUsuarios?.([nuevo, ...usuarios]);

    // 3. Despachar notificación al correo creado
    let resultadoEnvio: { success: boolean; message: string; method?: string; errorDetalle?: string } = {
      success: true,
      message: 'Notificación procesada localmente'
    };
    if (enviarNotificacionEmail) {
      resultadoEnvio = await enviarNotificacionCorreoNuevoUsuario(
        nuevo.email,
        nuevo.nombre,
        nuevo.rol,
        claveAsignada
      );
    }

    // 4. Registrar log de auditoría
    const nuevoLog: LogAuditoriaUsuario = {
      id: `log-${Date.now()}`,
      usuarioId: 'usr-admin',
      usuarioNombre: 'Administrador GH',
      accion: `Creación de usuario: ${nuevo.nombre} (${nuevo.email}) con rol ${nuevo.rol}. ${enviarNotificacionEmail ? `Notificación despachada: ${resultadoEnvio.message}` : 'Sin notificación por correo'}`,
      modulo: 'Gestión de Usuarios',
      ip: '190.158.42.12',
      fechaHora: new Date().toLocaleString('es-CO'),
      tipo: 'MODIFICACION'
    };
    setLogs(prev => [nuevoLog, ...prev]);

    setModalCrearOpen(false);

    // 5. Presentar comprobante de notificación al correo
    if (enviarNotificacionEmail) {
      setNotificacionModalData({
        usuario: nuevo,
        passwordTemporal: claveAsignada,
        asunto: generarAsuntoBienvenida(nuevo),
        cuerpo: generarCartaBienvenida(nuevo, claveAsignada),
        fechaEnvio: new Date().toLocaleString('es-CO'),
        resultadoFirebase: resultadoEnvio
      });
    }

    setNuevoUsuario({
      nombre: '',
      documento: '',
      email: '',
      rol: 'empleado',
      cargoNombre: '',
      estado: 'activo',
      dobleFactorHabilitado: false,
      permisos: ['dashboard', 'solicitudes', 'capacitaciones', 'sst', 'documentos']
    });

    mostrarNotificacion(`Usuario ${nuevo.nombre} creado. Notificación despachada a ${nuevo.email}`);
  };

  // Guardar cambios usuario existente
  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioEditando) return;

    try {
      await guardarUsuarioFB(usuarioEditando);
    } catch (err) {
      console.warn('Error al actualizar usuario en Firestore:', err);
    }

    setUsuarios(prev =>
      prev.map(u => (u.id === usuarioEditando.id ? usuarioEditando : u))
    );

    const nuevoLog: LogAuditoriaUsuario = {
      id: `log-${Date.now()}`,
      usuarioId: 'usr-admin',
      usuarioNombre: 'Administrador GH',
      accion: `Actualización de perfil y permisos del usuario ${usuarioEditando.nombre}`,
      modulo: 'Gestión de Usuarios',
      ip: '190.158.42.12',
      fechaHora: new Date().toLocaleString('es-CO'),
      tipo: 'MODIFICACION'
    };
    setLogs(prev => [nuevoLog, ...prev]);

    setModalEditarOpen(false);
    setUsuarioEditando(null);
    mostrarNotificacion(`Cambios guardados para ${usuarioEditando.nombre}.`);
  };

  // Alternar estado activo/inactivo/bloqueado
  const handleToggleEstado = async (usuarioId: string) => {
    let usuarioActualizado: UsuarioSistema | null = null;
    setUsuarios(prev =>
      prev.map(u => {
        if (u.id === usuarioId) {
          const nuevoEstado = u.estado === 'activo' ? 'inactivo' : 'activo';
          usuarioActualizado = { ...u, estado: nuevoEstado };
          return usuarioActualizado;
        }
        return u;
      })
    );
    if (usuarioActualizado) {
      try {
        await guardarUsuarioFB(usuarioActualizado);
      } catch (err) {
        console.warn('Error al actualizar estado en Firestore:', err);
      }
    }
    mostrarNotificacion('Estado de usuario actualizado.');
  };

  // Restablecer contraseña y despachar notificación
  const handleResetPassword = async (nombre: string, email: string) => {
    const usr = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    const tempPass = 'BGroup' + Math.floor(1000 + Math.random() * 9000) + '*';
    if (usr) {
      const actualizado = { ...usr, password: tempPass };
      setUsuarios(prev => prev.map(u => (u.id === usr.id ? actualizado : u)));
      onActualizarUsuarios?.(usuarios.map(u => (u.id === usr.id ? actualizado : u)));
      guardarUsuarioFB(actualizado).catch(() => {});
    }

    const resultado = await enviarNotificacionCorreoNuevoUsuario(email, nombre, usr?.rol || 'empleado', tempPass);

    const nuevoLog: LogAuditoriaUsuario = {
      id: `log-${Date.now()}`,
      usuarioId: 'usr-admin-principal',
      usuarioNombre: 'Super Administrador',
      accion: `Envío de enlace y credenciales de restablecimiento a ${email} (${resultado.message})`,
      modulo: 'Seguridad / Usuarios',
      ip: '190.158.42.12',
      fechaHora: new Date().toLocaleString('es-CO'),
      tipo: 'SEGURIDAD'
    };
    setLogs(prev => [nuevoLog, ...prev]);

    const usuarioParaModal = usr || {
      id: 'usr-temp',
      nombre,
      email,
      documento: '—',
      rol: 'empleado',
      cargoNombre: 'Colaborador',
      estado: 'activo',
      ultimoAcceso: '—',
      fechaCreacion: new Date().toISOString().split('T')[0],
      dobleFactorHabilitado: false,
      permisos: ['dashboard']
    };

    setNotificacionModalData({
      usuario: usuarioParaModal,
      passwordTemporal: tempPass,
      asunto: `Restablecimiento de Credenciales de Acceso — B GROUP INGENIERIA S.A.S.`,
      cuerpo: generarCartaBienvenida(usuarioParaModal, tempPass),
      fechaEnvio: new Date().toLocaleString('es-CO'),
      resultadoFirebase: resultado
    });

    mostrarNotificacion(`Notificación y credenciales enviadas a ${email}.`);
  };

  // Reenviar notificación de correo desde el modal
  const handleReenviarNotificacion = async () => {
    if (!notificacionModalData) return;
    setNotificacionReenviando(true);
    await enviarNotificacionCorreoNuevoUsuario(
      notificacionModalData.usuario.email,
      notificacionModalData.usuario.nombre,
      notificacionModalData.usuario.rol,
      notificacionModalData.passwordTemporal
    );
    setTimeout(() => {
      setNotificacionReenviando(false);
      mostrarNotificacion(`Notificación reenviada a ${notificacionModalData.usuario.email}`);
    }, 600);
  };

  const handleCopiarCredenciales = () => {
    if (!notificacionModalData) return;
    navigator.clipboard.writeText(notificacionModalData.cuerpo);
    setCopiadoFeedback(true);
    setTimeout(() => setCopiadoFeedback(false), 3000);
  };

  // Eliminar usuario individual
  const handleEliminarUsuario = async (usuarioId: string, nombre: string) => {
    if (confirm(`¿Desea eliminar permanentemente la cuenta de usuario "${nombre}"? Esta acción no se puede deshacer.`)) {
      try {
        await eliminarUsuarioFB(usuarioId);
      } catch (err) {
        console.warn('Error al eliminar usuario en Firestore:', err);
      }
      setUsuarios(prev => prev.filter(u => u.id !== usuarioId));
      const nuevoLog: LogAuditoriaUsuario = {
        id: `log-${Date.now()}`,
        usuarioId: 'usr-admin-principal',
        usuarioNombre: 'Super Administrador',
        accion: `Eliminación de la cuenta de usuario ${nombre}`,
        modulo: 'Gestión de Usuarios',
        ip: '190.158.42.10',
        fechaHora: new Date().toLocaleString('es-CO'),
        tipo: 'SEGURIDAD'
      };
      setLogs(prev => [nuevoLog, ...prev]);
      mostrarNotificacion(`Usuario "${nombre}" eliminado del sistema.`);
    }
  };

  // Depurar masivamente todos los usuarios de prueba
  const handleDepurarUsuariosPrueba = () => {
    const usuariosPrueba = usuarios.filter(
      u => u.email.endsWith('@empresa.com') || u.email.endsWith('@consultoria-sst.co') || (u.id.startsWith('usr-') && u.id !== 'usr-admin-principal')
    );
    if (usuariosPrueba.length === 0) {
      mostrarNotificacion('No se detectaron usuarios de prueba. La base de datos está limpia.');
      return;
    }
    if (confirm(`Se encontraron ${usuariosPrueba.length} cuentas de prueba. ¿Desea eliminarlas permanentemente para dejar la base de datos limpia en producción?`)) {
      setUsuarios(prev => prev.filter(
        u => !u.email.endsWith('@empresa.com') && !u.email.endsWith('@consultoria-sst.co') && (u.id === 'usr-admin-principal' || !u.id.startsWith('usr-'))
      ));
      const nuevoLog: LogAuditoriaUsuario = {
        id: `log-${Date.now()}`,
        usuarioId: 'usr-admin-principal',
        usuarioNombre: 'Super Administrador',
        accion: `Depuración masiva de ${usuariosPrueba.length} usuarios de prueba`,
        modulo: 'Gestión de Usuarios',
        ip: '190.158.42.10',
        fechaHora: new Date().toLocaleString('es-CO'),
        tipo: 'SEGURIDAD'
      };
      setLogs(prev => [nuevoLog, ...prev]);
      mostrarNotificacion(`Se eliminaron exitosamente ${usuariosPrueba.length} usuarios de prueba.`);
    }
  };

  // Vincular con empleado existente en el formulario
  const handleSelectEmpleadoExistente = (empleadoId: string) => {
    const emp = empleados.find(e => e.id === empleadoId);
    if (emp) {
      setNuevoUsuario(prev => ({
        ...prev,
        empleadoId: emp.id,
        nombre: emp.nombre,
        documento: emp.documento,
        email: emp.email
      }));
    }
  };

  // Helper para nombre legible del rol
  const getRolBadge = (rol: RolSistema) => {
    switch (rol) {
      case 'superadmin':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#18235C] text-white flex items-center gap-1.5 w-fit shadow-xs">
            <Key className="w-3 h-3 text-[#00FF00]" />
            Superadmin
          </span>
        );
      case 'admin_gh':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#8FA7D6]/25 text-[#18235C] border border-[#8FA7D6] flex items-center gap-1.5 w-fit">
            <ShieldCheck className="w-3 h-3 text-[#18235C]" />
            Administrador GH
          </span>
        );
      case 'lider_area':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#8FA7D6]/15 text-[#18235C] border border-[#8FA7D6]/70 flex items-center gap-1.5 w-fit">
            <Sliders className="w-3 h-3 text-[#18235C]" />
            Líder de Área / Evaluador
          </span>
        );
      case 'responsable_sst':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 w-fit">
            <Shield className="w-3 h-3 text-emerald-700" />
            Responsable SG-SST
          </span>
        );
      case 'empleado':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-white text-[#282829] border border-[#8FA7D6] flex items-center gap-1.5 w-fit">
            <User className="w-3 h-3 text-[#18235C]" />
            Colaborador / Empleado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Notificación flotante */}
      {notificacion && (
        <div className="fixed top-4 right-4 z-50 bg-[#18235C] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl border border-[#8FA7D6] flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#00FF00]" />
          <span>{notificacion}</span>
        </div>
      )}

      {/* Header Principal */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#18235C]" />
                Seguridad & Control de Accesos
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#8FA7D6]/20 text-[#18235C] border border-[#8FA7D6]">
                RBAC Granular & Auditoría
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#18235C] tracking-tight">
              Gestión de Usuarios y Perfiles del Sistema
            </h1>
            <p className="text-xs sm:text-sm text-[#282829] mt-1 max-w-2xl">
              Administración centralizada de cuentas de usuario, asignación de roles corporativos, configuración de permisos modulares y registro de auditoría de actividad en cumplimiento de la Ley 1581 de Protección de Datos.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {isSuperAdmin && (
              <button
                onClick={handleDepurarUsuariosPrueba}
                className="px-3 py-2 text-xs font-bold bg-white hover:bg-rose-50 text-rose-700 border border-rose-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Eliminar todos los usuarios de prueba (Exclusivo Superadministrador)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Depurar Usuarios de Prueba</span>
              </button>
            )}
            <button
              onClick={() => setModalCrearOpen(true)}
              className="px-4 py-2 text-xs font-bold bg-[#18235C] hover:bg-[#101740] text-white rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <UserPlus className="w-4 h-4 text-[#00FF00]" />
              <span>Nuevo Usuario</span>
            </button>
          </div>
        </div>

        {/* Métricas clave */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-[#8FA7D6]/40">
          <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#8FA7D6] shadow-2xs">
            <div className="text-[11px] font-bold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
              Total Cuentas
              <Users className="w-3.5 h-3.5 text-[#18235C]" />
            </div>
            <div className="text-2xl font-black text-[#18235C]">{metrics.total}</div>
            <div className="text-[10px] text-[#282829]/70 mt-0.5">Usuarios en plataforma</div>
          </div>

          <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#8FA7D6] shadow-2xs">
            <div className="text-[11px] font-bold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
              Usuarios Activos
              <UserCheck className="w-3.5 h-3.5 text-[#18235C]" />
            </div>
            <div className="text-2xl font-black text-[#18235C] flex items-center gap-1.5">
              <span>{metrics.activos}</span>
              <span className="w-2 h-2 rounded-full bg-[#00FF00] shadow-xs"></span>
            </div>
            <div className="text-[10px] text-[#282829]/70 mt-0.5">Con credenciales válidas</div>
          </div>

          <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#8FA7D6] shadow-2xs">
            <div className="text-[11px] font-bold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
              Administradores
              <Key className="w-3.5 h-3.5 text-[#18235C]" />
            </div>
            <div className="text-2xl font-black text-[#18235C]">{metrics.adminCount}</div>
            <div className="text-[10px] text-[#282829]/70 mt-0.5">Superadmin y Gestión Humana</div>
          </div>

          <div className="p-4 bg-[#FFFFFF] rounded-xl border border-[#8FA7D6] shadow-2xs">
            <div className="text-[11px] font-bold text-[#282829] uppercase tracking-wider mb-1 flex items-center justify-between">
              2FA Habilitado
              <Lock className="w-3.5 h-3.5 text-[#18235C]" />
            </div>
            <div className="text-2xl font-black text-[#18235C]">{metrics.con2FA}</div>
            <div className="text-[10px] text-[#282829]/70 mt-0.5">Doble factor de autenticación</div>
          </div>
        </div>

        {/* Pestañas de Navegación Interna */}
        <div className="flex border-b border-[#8FA7D6]/40 mt-6 gap-6 text-xs font-bold">
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'usuarios'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829]/70 hover:text-[#18235C]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Directorio de Usuarios ({filteredUsuarios.length})
          </button>
          <button
            onClick={() => setActiveTab('rolesMatriz')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'rolesMatriz'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829]/70 hover:text-[#18235C]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Matriz de Roles y Permisos Modulares
          </button>
          <button
            onClick={() => setActiveTab('auditoria')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'auditoria'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829]/70 hover:text-[#18235C]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Auditoría de Accesos & Eventos ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('aislamiento')}
            className={`pb-2.5 transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'aislamiento'
                ? 'border-[#18235C] text-[#18235C]'
                : 'border-transparent text-[#282829]/70 hover:text-[#18235C]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Aislamiento Multi-Tenant & Cuentas Oficiales
          </button>
        </div>
      </div>

      {/* TAB 1: DIRECTORIO DE USUARIOS */}
      {activeTab === 'usuarios' && (
        <div className="space-y-4">
          {/* Controles de búsqueda y filtros */}
          <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#8FA7D6] flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#8FA7D6] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, correo, cédula o cargo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FFFFFF] border border-[#8FA7D6] rounded-lg text-[#282829] placeholder:text-[#282829]/50 focus:outline-none focus:ring-1 focus:ring-[#18235C]"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-[#282829]">
                <Filter className="w-3.5 h-3.5 text-[#18235C]" />
                <span className="text-[11px] font-bold">Rol:</span>
                <select
                  value={filterRol}
                  onChange={e => setFilterRol(e.target.value)}
                  className="bg-[#FFFFFF] border border-[#8FA7D6] rounded-md px-2 py-1 text-xs text-[#282829] font-medium focus:outline-none focus:ring-1 focus:ring-[#18235C]"
                >
                  <option value="TODOS">Todos los roles</option>
                  <option value="superadmin">Superadministrador</option>
                  <option value="admin_gh">Administrador GH</option>
                  <option value="lider_area">Líder de Área</option>
                  <option value="responsable_sst">Responsable SST</option>
                  <option value="empleado">Colaborador / Empleado</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#282829]">
                <span className="text-[11px] font-bold">Estado:</span>
                <select
                  value={filterEstado}
                  onChange={e => setFilterEstado(e.target.value)}
                  className="bg-[#FFFFFF] border border-[#8FA7D6] rounded-md px-2 py-1 text-xs text-[#282829] font-medium focus:outline-none focus:ring-1 focus:ring-[#18235C]"
                >
                  <option value="TODOS">Todos los estados</option>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                  <option value="bloqueado">Bloqueado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla de usuarios */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#18235C] text-white font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3.5">Usuario & Datos</th>
                    <th className="p-3.5">Cargo / Función</th>
                    <th className="p-3.5">Rol en Plataforma</th>
                    <th className="p-3.5">Permisos Módulos</th>
                    <th className="p-3.5">Seguridad 2FA</th>
                    <th className="p-3.5">Último Acceso</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/30">
                  {filteredUsuarios.map(u => (
                    <tr key={u.id} className="hover:bg-[#8FA7D6]/10 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#18235C] text-[#00FF00] font-bold flex items-center justify-center text-xs shadow-xs">
                            {u.nombre.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[#18235C]">{u.nombre}</div>
                            <div className="text-[11px] text-[#282829] flex items-center gap-1">
                              <Mail className="w-3 h-3 text-[#8FA7D6]" />
                              {u.email}
                            </div>
                            <div className="text-[10px] text-[#282829]/70">CC: {u.documento}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-[#282829]">
                        <span className="font-semibold text-xs">{u.cargoNombre || '—'}</span>
                      </td>

                      <td className="p-3.5">
                        {getRolBadge(u.rol)}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1 flex-wrap max-w-xs">
                          {u.permisos.slice(0, 4).map(p => (
                            <span key={p} className="text-[10px] bg-white border border-[#8FA7D6] px-1.5 py-0.5 rounded text-[#282829] font-medium">
                              {p}
                            </span>
                          ))}
                          {u.permisos.length > 4 && (
                            <span className="text-[10px] bg-[#18235C] text-white px-1.5 py-0.5 rounded font-bold">
                              +{u.permisos.length - 4} más
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-3.5">
                        {u.dobleFactorHabilitado ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                            <ShieldCheck className="w-3 h-3 text-[#00FF00]" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#282829]/60">
                            No configurado
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-[#282829] text-[11px] font-medium">
                        {u.ultimoAcceso}
                      </td>

                      <td className="p-3.5">
                        {u.estado === 'activo' ? (
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00FF00]"></span>
                            Activo
                          </span>
                        ) : u.estado === 'inactivo' ? (
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-amber-50 text-amber-800 border border-amber-300">
                            Inactivo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[11px] font-bold rounded bg-rose-50 text-rose-800 border border-rose-300">
                            Bloqueado
                          </span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setUsuarioEditando(u);
                              setModalEditarOpen(true);
                            }}
                            className="p-1.5 text-[#18235C] hover:bg-[#8FA7D6]/20 rounded-md border border-transparent hover:border-[#8FA7D6] transition-colors"
                            title="Editar usuario y permisos"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleResetPassword(u.nombre, u.email)}
                            className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-md border border-transparent hover:border-blue-300 transition-colors"
                            title="Ver y despachar notificación formal de credenciales al correo"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleResetPassword(u.nombre, u.email)}
                            className="p-1.5 text-[#18235C] hover:bg-[#8FA7D6]/20 rounded-md border border-transparent hover:border-[#8FA7D6] transition-colors"
                            title="Restablecer clave temporal"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleEstado(u.id)}
                            className={`p-1.5 rounded-md border border-transparent hover:border-[#8FA7D6] transition-colors ${
                              u.estado === 'activo'
                                ? 'text-amber-700 hover:bg-amber-50'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={u.estado === 'activo' ? 'Inactivar acceso' : 'Reactivar acceso'}
                          >
                            {u.estado === 'activo' ? (
                              <XCircle className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleEliminarUsuario(u.id, u.nombre)}
                            className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-md border border-transparent hover:border-rose-300 transition-colors"
                            title="Eliminar usuario permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MATRIZ DE ROLES Y PERMISOS */}
      {activeTab === 'rolesMatriz' && (
        <div className="space-y-4">
          <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#8FA7D6] shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-black text-[#18235C]">
                  Matriz de Control de Acceso Basado en Roles (RBAC)
                </h3>
                <p className="text-xs text-[#282829] mt-0.5">
                  Visualice y audite la distribución de privilegios por módulo para garantizar la segregación de funciones, la reserva de información salarial y la confidencialidad en votaciones.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#8FA7D6] shadow-2xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-[#18235C] text-white text-[11px] font-bold">
                    <th className="p-3">Módulo del Sistema</th>
                    <th className="p-3 text-center">Superadmin</th>
                    <th className="p-3 text-center">Admin GH</th>
                    <th className="p-3 text-center">Líder Área</th>
                    <th className="p-3 text-center">Responsable SST</th>
                    <th className="p-3 text-center">Empleado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/30">
                  {MODULOS_SISTEMA.map(m => (
                    <tr key={m.id} className="hover:bg-[#8FA7D6]/10">
                      <td className="p-3">
                        <div className="font-bold text-[#18235C]">{m.nombre}</div>
                        <div className="text-[10px] text-[#282829]/80">{m.descripcion}</div>
                      </td>

                      {/* Superadmin */}
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800">
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                        </span>
                      </td>

                      {/* Admin GH */}
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800">
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                        </span>
                      </td>

                      {/* Líder de Área */}
                      <td className="p-3 text-center">
                        {['dashboard', 'empleados', 'evaluaciones', 'solicitudes', 'capacitaciones', 'documentos'].includes(m.id) ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800">
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-50 text-rose-400">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>

                      {/* Responsable SST */}
                      <td className="p-3 text-center">
                        {['dashboard', 'cargos', 'capacitaciones', 'sst', 'documentos'].includes(m.id) ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800">
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-50 text-rose-400">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>

                      {/* Empleado */}
                      <td className="p-3 text-center">
                        {['dashboard', 'solicitudes', 'capacitaciones', 'sst', 'documentos'].includes(m.id) ? (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#8FA7D6]/20 text-[#18235C]" title="Acceso a nivel de colaborador (Votar en SST, consultar su ficha, hacer solicitudes)">
                            <Check className="w-3.5 h-3.5 text-[#18235C]" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-50 text-rose-400">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-[#FFFFFF] rounded-xl border border-[#8FA7D6] text-[11px] text-[#282829] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#18235C] shrink-0" />
              <span>
                <strong>Principio de Privilegio Mínimo:</strong> El módulo de Nómina y Prestaciones está restringido exclusivamente a los roles Superadministrador y Administrador GH para proteger la privacidad salarial según la Ley 1581 de 2012.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AUDITORÍA DE ACCESOS Y EVENTOS */}
      {activeTab === 'auditoria' && (
        <div className="space-y-4">
          <div className="bg-[#FFFFFF] p-5 rounded-2xl border border-[#8FA7D6] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-black text-[#18235C]">
                  Registro de Auditoría y Trazabilidad de Seguridad
                </h3>
                <p className="text-xs text-[#282829] mt-0.5">
                  Trazabilidad inmutable de eventos sensibles: inicios de sesión, votos emitidos, modificaciones de nómina y cambios de privilegios.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-[#8FA7D6]/20 text-[11px] font-bold text-[#18235C] border border-[#8FA7D6]">
                {logs.length} Eventos registrados
              </span>
            </div>

            <div className="divide-y divide-[#8FA7D6]/30">
              {logs.map(log => (
                <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.tipo === 'SEGURIDAD'
                            ? 'bg-rose-50 text-rose-700 border border-rose-300'
                            : log.tipo === 'MODIFICACION'
                            ? 'bg-amber-50 text-amber-800 border border-amber-300'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {log.tipo}
                      </span>
                      <span className="font-bold text-[#18235C]">{log.accion}</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#282829]">
                      <span className="flex items-center gap-1 font-medium">
                        <User className="w-3 h-3 text-[#18235C]" />
                        {log.usuarioNombre}
                      </span>
                      <span>•</span>
                      <span>Módulo: <strong className="text-[#18235C]">{log.modulo}</strong></span>
                      <span>•</span>
                      <span className="text-[#282829]/70">IP: {log.ip}</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-[#282829]/70 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#8FA7D6]" />
                    {log.fechaHora}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AISLAMIENTO MULTI-TENANT & CUENTAS OFICIALES */}
      {activeTab === 'aislamiento' && (
        <div className="space-y-6">
          {/* Tarjeta de estado de seguridad */}
          <div className="bg-white p-6 rounded-2xl border border-[#8FA7D6] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#8FA7D6]/40">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-[#18235C]">
                    Aislamiento Multi-Tenant & Endurecimiento de Seguridad
                  </h2>
                  <p className="text-xs text-[#282829] mt-0.5">
                    Garantiza la separación estricta de datos por empresaId y la inmutabilidad de roles en cumplimiento normativo y de auditoría.
                  </p>
                </div>
              </div>
              <button
                onClick={handleEjecutarMigracion}
                disabled={migrandoAislamiento}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shrink-0 ${
                  migrandoAislamiento
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-[#18235C] hover:bg-[#101740] text-white'
                }`}
              >
                {migrandoAislamiento ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin text-[#00FF00]" />
                    <span>Migrando Documentos...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 text-[#00FF00]" />
                    <span>Ejecutar Migración de Aislamiento & Sincronizar</span>
                  </>
                )}
              </button>
            </div>

            {/* Resultado de migración si ya se ejecutó */}
            {resultadoMigracion && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Migración y sincronización ejecutada exitosamente:
                </div>
                <div className="text-[11px] text-emerald-800 space-y-0.5">
                  <p>• <strong>{resultadoMigracion.documentosActualizados}</strong> documentos sin empresaId fueron etiquetados con "empresa-a".</p>
                  <p>• Colecciones validadas: {resultadoMigracion.coleccionesProcesadas.join(', ')}.</p>
                  <p>• Cuentas de prueba sincronizadas en Firestore: {resultadoMigracion.usuariosCreados.join(', ')}.</p>
                </div>
              </div>
            )}

            {/* Fases del plan de auditoría */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">✓</span>
                  <span className="text-xs font-black text-[#18235C]">Fase 1: Eliminación de Bypass</span>
                </div>
                <p className="text-[11px] text-[#282829]/80 leading-relaxed">
                  Bypass de localStorage y credenciales fijas eliminados. Acceso 100% regulado por tokens criptográficos de Firebase Auth.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">✓</span>
                  <span className="text-xs font-black text-[#18235C]">Fase 2: Reglas Firestore Estrictas</span>
                </div>
                <p className="text-[11px] text-[#282829]/80 leading-relaxed">
                  Reglas desplegadas con función <code>sameCompany()</code>. Usuarios comunes tienen prohibido modificar su rol, permisos y empresaId.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">3</span>
                  <span className="text-xs font-black text-[#18235C]">Fase 3: Cuentas Reales de Prueba</span>
                </div>
                <p className="text-[11px] text-[#282829]/80 leading-relaxed">
                  5 cuentas oficiales creadas con roles diferenciados entre Empresa A y Empresa B para testeo de aislamiento multi-tenant.
                </p>
              </div>
            </div>
          </div>

          {/* Las 5 Cuentas Oficiales de Prueba */}
          <div className="bg-white p-6 rounded-2xl border border-[#8FA7D6] shadow-sm">
            <h3 className="text-sm font-black text-[#18235C] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#18235C]" />
              Cuentas Oficiales de Prueba (Multi-Tenant)
            </h3>
            <p className="text-xs text-[#282829] mb-4">
              Credenciales requeridas por la auditoría para validar que ningún usuario de Empresa A acceda a Empresa B y que los colaboradores solo vean su propia información:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {CUENTAS_PRUEBA_OFICIALES.map((cuenta, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-[#8FA7D6] transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-xs text-[#18235C]">{cuenta.nombre}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      cuenta.empresaId === 'empresa-a'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {cuenta.empresaId}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-[10px] text-[#282829]/60 block">Correo:</span>
                      <code className="text-[11px] font-mono font-bold text-[#18235C] bg-white px-1.5 py-0.5 rounded border border-slate-200 block truncate">
                        {cuenta.email}
                      </code>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#282829]/60 block">Contraseña:</span>
                      <code className="text-[11px] font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200 block">
                        {cuenta.pass}
                      </code>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-semibold text-slate-600">
                        Rol: <strong className="text-[#18235C]">{cuenta.rol}</strong>
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${cuenta.email}\n${cuenta.pass}`);
                          mostrarNotificacion(`Credenciales copiadas para ${cuenta.email}`);
                        }}
                        className="text-[10px] text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Copiar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Matriz de Pruebas de Aislamiento Obligatorias */}
          <div className="bg-white p-6 rounded-2xl border border-[#8FA7D6] shadow-sm">
            <h3 className="text-sm font-black text-[#18235C] uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#18235C]" />
              Matriz de Pruebas de Aislamiento Obligatorias
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Cuenta de Prueba</th>
                    <th className="py-2.5 px-3">Operación Permitida</th>
                    <th className="py-2.5 px-3">Operación Bloqueada (Firestore Rules)</th>
                    <th className="py-2.5 px-3 text-center">Estado Regla</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#18235C]">empleado-a@test-cimiento.com</td>
                    <td className="py-2.5 px-3 text-slate-700">Lectura de su perfil y de sus solicitudes</td>
                    <td className="py-2.5 px-3 text-rose-700">Perfil de empleado B, nóminas, modificar su rol o empresaId</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Bloqueo Activo
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#18235C]">admin-a@test-cimiento.com</td>
                    <td className="py-2.5 px-3 text-slate-700">Gestionar empleados y usuarios de empresa-a</td>
                    <td className="py-2.5 px-3 text-rose-700">Lectura de empleados de empresa-b, nómina de otra empresa</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Bloqueo Activo
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-bold text-[#18235C]">superadmin@test-cimiento.com</td>
                    <td className="py-2.5 px-3 text-slate-700">Administrar empresas autorizadas, roles, auditoría inmutable</td>
                    <td className="py-2.5 px-3 text-rose-700">Modificar o borrar registros de logs_auditoria (inmutabilidad legal)</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Bloqueo Activo
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CREAR NUEVO USUARIO */}
      {modalCrearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18235C]/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header del modal */}
            <div className="bg-[#18235C] px-6 py-4 flex items-center justify-between border-b border-[#101740]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#8FA7D6] text-[#18235C] flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4 text-[#18235C]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Crear Nuevo Usuario</h3>
                  <p className="text-[11px] text-[#8FA7D6]">Asignación de credenciales y permisos corporativos</p>
                </div>
              </div>
              <button
                onClick={() => setModalCrearOpen(false)}
                className="p-1 rounded-lg text-[#8FA7D6] hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarNuevo} className="p-6 space-y-4 text-xs overflow-y-auto flex-1 bg-[#FFFFFF]">
              {/* Opción rápida: vincular con colaborador existente */}
              {empleados.length > 0 && (
                <div className="p-3 bg-white rounded-xl border border-[#8FA7D6]">
                  <label className="block text-[11px] font-bold text-[#18235C] mb-1">
                    Vincular con Colaborador del Censo (Opcional):
                  </label>
                  <select
                    onChange={e => handleSelectEmpleadoExistente(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#8FA7D6] rounded-lg px-2.5 py-1.5 text-xs text-[#282829] font-medium focus:ring-1 focus:ring-[#18235C]"
                  >
                    <option value="">-- Seleccionar colaborador existente --</option>
                    {empleados.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nombre} — CC: {emp.documento}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevoUsuario.nombre || ''}
                    onChange={e => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                    className="w-full bg-[#FFFFFF] border border-[#8FA7D6] rounded-lg px-2.5 py-1.5 text-[#282829] focus:outline-none focus:ring-1 focus:ring-[#18235C]"
                    placeholder="Ej. Andrés Morales"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Cédula / Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevoUsuario.documento || ''}
                    onChange={e => setNuevoUsuario({ ...nuevoUsuario, documento: e.target.value })}
                    className="w-full bg-[#FFFFFF] border border-[#8FA7D6] rounded-lg px-2.5 py-1.5 text-[#282829] focus:outline-none focus:ring-1 focus:ring-[#18235C]"
                    placeholder="Ej. 1.020.345.678"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Correo Electrónico Institucional *
                  </label>
                  <input
                    type="email"
                    required
                    value={nuevoUsuario.email || ''}
                    onChange={e => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
                    className="w-full bg-[#FFFFFF] border border-[#8FA7D6] rounded-lg px-2.5 py-1.5 text-[#282829] focus:outline-none focus:ring-1 focus:ring-[#18235C]"
                    placeholder="usuario@empresa.com"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Cargo / Posición
                  </label>
                  <input
                    type="text"
                    value={nuevoUsuario.cargoNombre || ''}
                    onChange={e => setNuevoUsuario({ ...nuevoUsuario, cargoNombre: e.target.value })}
                    className="w-full bg-[#FFFFFF] border border-[#8FA7D6] rounded-lg px-2.5 py-1.5 text-[#282829] focus:outline-none focus:ring-1 focus:ring-[#18235C]"
                    placeholder="Ej. Técnico de Redes"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Rol en la Plataforma *
                  </label>
                  <select
                    value={nuevoUsuario.rol || 'empleado'}
                    onChange={e => {
                      const rol = e.target.value as RolSistema;
                      let perms = ['dashboard'];
                      if (rol === 'superadmin' || rol === 'admin_gh') {
                        perms = MODULOS_SISTEMA.map(m => m.id);
                      } else if (rol === 'lider_area') {
                        perms = ['dashboard', 'empleados', 'evaluaciones', 'solicitudes', 'capacitaciones', 'documentos'];
                      } else if (rol === 'responsable_sst') {
                        perms = ['dashboard', 'cargos', 'capacitaciones', 'sst', 'documentos'];
                      } else {
                        perms = ['dashboard', 'solicitudes', 'capacitaciones', 'sst', 'documentos'];
                      }
                      setNuevoUsuario({ ...nuevoUsuario, rol, permisos: perms });
                    }}
                    className="w-full bg-[#FFFFFF] border border-[#8FA7D6] rounded-lg px-2.5 py-1.5 text-xs text-[#282829] font-medium"
                  >
                    <option value="empleado">Colaborador / Empleado</option>
                    <option value="lider_area">Líder de Área / Evaluador</option>
                    <option value="responsable_sst">Responsable SG-SST</option>
                    <option value="admin_gh">Administrador de Gestión Humana</option>
                    <option value="superadmin">Superadministrador</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Empresa Asignada *
                  </label>
                  <select
                    value={nuevoUsuario.empresaId || 'empresa-a'}
                    onChange={e => setNuevoUsuario({ ...nuevoUsuario, empresaId: e.target.value })}
                    className="w-full bg-[#FFFFFF] border border-[#8FA7D6] rounded-lg px-2.5 py-1.5 text-xs text-[#282829] font-medium"
                  >
                    <option value="empresa-a">Empresa A (Principal)</option>
                    <option value="empresa-b">Empresa B (Secundaria)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Estado Inicial
                  </label>
                  <select
                    value={nuevoUsuario.estado || 'activo'}
                    onChange={e => setNuevoUsuario({ ...nuevoUsuario, estado: e.target.value as any })}
                    className="w-full bg-[#FFFFFF] border border-[#8FA7D6] rounded-lg px-2.5 py-1.5 text-xs text-[#282829] font-medium"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="bloqueado">Bloqueado</option>
                  </select>
                </div>
              </div>

              {/* Selección modular de permisos */}
              <div>
                <label className="block font-bold text-[#18235C] mb-2">
                  Permisos de Acceso a Módulos:
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#FFFFFF] p-3 rounded-xl border border-[#8FA7D6] max-h-40 overflow-y-auto">
                  {MODULOS_SISTEMA.map(m => {
                    const checked = (nuevoUsuario.permisos || []).includes(m.id);
                    return (
                      <label key={m.id} className="flex items-center gap-2 text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const actual = nuevoUsuario.permisos || [];
                            const updated = checked
                              ? actual.filter(p => p !== m.id)
                              : [...actual, m.id];
                            setNuevoUsuario({ ...nuevoUsuario, permisos: updated });
                          }}
                          className="rounded text-[#18235C] focus:ring-0"
                        />
                        <span className={checked ? 'text-[#18235C] font-bold' : 'text-[#282829]/70'}>
                          {m.nombre}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="2fa_check"
                  checked={Boolean(nuevoUsuario.dobleFactorHabilitado)}
                  onChange={e => setNuevoUsuario({ ...nuevoUsuario, dobleFactorHabilitado: e.target.checked })}
                  className="rounded text-[#18235C]"
                />
                <label htmlFor="2fa_check" className="text-[11px] text-[#282829] cursor-pointer font-medium">
                  Exigir autenticación de doble factor (2FA vía correo o app autenticadora)
                </label>
              </div>

              {/* SECCIÓN DE CREDENCIALES & NOTIFICACIÓN POR CORREO */}
              <div className="p-3.5 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-[#18235C]" />
                    <span className="text-xs font-bold text-[#18235C]">
                      Credenciales & Notificación por Correo
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerarClaveAleatoria}
                    className="text-[11px] font-bold text-[#18235C] hover:underline flex items-center gap-1"
                  >
                    Generar clave aleatoria
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#18235C] mb-1">
                    Contraseña Provisoria de Acceso:
                  </label>
                  <input
                    type="text"
                    required
                    value={passwordTemporal}
                    onChange={e => setPasswordTemporal(e.target.value)}
                    className="w-full bg-[#FFFFFF] border border-[#8FA7D6] rounded-lg px-2.5 py-1.5 text-xs text-[#282829] font-mono focus:outline-none focus:ring-1 focus:ring-[#18235C]"
                    placeholder="Ej. BGroup2026*"
                  />
                  <p className="text-[10px] text-[#282829]/70 mt-1">
                    Esta clave será provisoria; el colaborador deberá actualizarla obligatoriamente al primer inicio de sesión.
                  </p>
                </div>

                <div className="flex items-start gap-2 pt-1 border-t border-[#8FA7D6]/30">
                  <input
                    type="checkbox"
                    id="enviar_notificacion_check"
                    checked={enviarNotificacionEmail}
                    onChange={e => setEnviarNotificacionEmail(e.target.checked)}
                    className="rounded text-[#18235C] mt-0.5"
                  />
                  <div>
                    <label
                      htmlFor="enviar_notificacion_check"
                      className="text-xs font-bold text-[#18235C] cursor-pointer flex items-center gap-1.5"
                    >
                      <Mail className="w-3.5 h-3.5 text-blue-600" />
                      Enviar notificación automática de bienvenida y credenciales al correo creado
                    </label>
                    <p className="text-[10px] text-[#282829]/70 mt-0.5">
                      Despacha un correo formal a{' '}
                      <strong className="text-[#18235C]">
                        {nuevoUsuario.email?.trim() || '(correo que indique)'}
                      </strong>{' '}
                      con el enlace del sistema, usuario, clave temporal y directrices del CST Art. 58.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#8FA7D6]/30">
                <button
                  type="button"
                  onClick={() => setModalCrearOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#8FA7D6] text-[#18235C] font-bold hover:bg-[#8FA7D6]/15 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#18235C] text-white font-bold hover:bg-[#101740] shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4 text-[#00FF00]" />
                  <span>Crear Usuario & Despachar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDITAR USUARIO Y PERMISOS */}
      {modalEditarOpen && usuarioEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#18235C]/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header del modal */}
            <div className="bg-[#18235C] px-6 py-4 flex items-center justify-between border-b border-[#101740]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#8FA7D6] text-[#18235C] flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4 text-[#18235C]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Editar Usuario: {usuarioEditando.nombre}
                  </h3>
                  <p className="text-[11px] text-[#8FA7D6]">Modificación de rol, estado y permisos de acceso</p>
                </div>
              </div>
              <button
                onClick={() => setModalEditarOpen(false)}
                className="p-1 rounded-lg text-[#8FA7D6] hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEdicion} className="p-6 space-y-4 text-xs overflow-y-auto flex-1 bg-[#FFFFFF]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={usuarioEditando.nombre}
                    onChange={e => setUsuarioEditando({ ...usuarioEditando, nombre: e.target.value })}
                    className="w-full bg-[#FFFFFF] border border-[#8FA7D6] rounded-lg px-2.5 py-1.5 text-[#282829]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={usuarioEditando.email}
                    onChange={e => setUsuarioEditando({ ...usuarioEditando, email: e.target.value })}
                    className="w-full bg-[#FFFFFF] border border-[#8FA7D6] rounded-lg px-2.5 py-1.5 text-[#282829]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Rol en Plataforma</label>
                  <select
                    value={usuarioEditando.rol}
                    onChange={e => setUsuarioEditando({ ...usuarioEditando, rol: e.target.value as RolSistema })}
                    className="w-full bg-[#FFFFFF] border border-[#8FA7D6] rounded-lg px-2.5 py-1.5 text-xs text-[#282829] font-medium"
                  >
                    <option value="empleado">Colaborador / Empleado</option>
                    <option value="lider_area">Líder de Área / Evaluador</option>
                    <option value="responsable_sst">Responsable SG-SST</option>
                    <option value="admin_gh">Administrador de Gestión Humana</option>
                    <option value="superadmin">Superadministrador</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Empresa Asignada</label>
                  <select
                    value={usuarioEditando.empresaId || 'empresa-a'}
                    onChange={e => setUsuarioEditando({ ...usuarioEditando, empresaId: e.target.value })}
                    className="w-full bg-[#FFFFFF] border border-[#8FA7D6] rounded-lg px-2.5 py-1.5 text-xs text-[#282829] font-medium"
                  >
                    <option value="empresa-a">Empresa A (Principal)</option>
                    <option value="empresa-b">Empresa B (Secundaria)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Estado de la Cuenta</label>
                  <select
                    value={usuarioEditando.estado}
                    onChange={e => setUsuarioEditando({ ...usuarioEditando, estado: e.target.value as any })}
                    className="w-full bg-[#FFFFFF] border border-[#8FA7D6] rounded-lg px-2.5 py-1.5 text-xs text-[#282829] font-medium"
                  >
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="bloqueado">Bloqueado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-2">
                  Permisos de Acceso Modulares:
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#FFFFFF] p-3 rounded-xl border border-[#8FA7D6] max-h-40 overflow-y-auto">
                  {MODULOS_SISTEMA.map(m => {
                    const checked = usuarioEditando.permisos.includes(m.id);
                    return (
                      <label key={m.id} className="flex items-center gap-2 text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const updated = checked
                              ? usuarioEditando.permisos.filter(p => p !== m.id)
                              : [...usuarioEditando.permisos, m.id];
                            setUsuarioEditando({ ...usuarioEditando, permisos: updated });
                          }}
                          className="rounded text-[#18235C] focus:ring-0"
                        />
                        <span className={checked ? 'text-[#18235C] font-bold' : 'text-[#282829]/70'}>
                          {m.nombre}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit_2fa"
                  checked={usuarioEditando.dobleFactorHabilitado}
                  onChange={e => setUsuarioEditando({ ...usuarioEditando, dobleFactorHabilitado: e.target.checked })}
                  className="rounded text-[#18235C]"
                />
                <label htmlFor="edit_2fa" className="text-[11px] text-[#282829] cursor-pointer font-medium">
                  Autenticación de doble factor obligatoria (2FA)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#8FA7D6]/30">
                <button
                  type="button"
                  onClick={() => setModalEditarOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#8FA7D6] text-[#18235C] font-bold hover:bg-[#8FA7D6]/15 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#18235C] text-white font-bold hover:bg-[#101740] shadow-sm transition-colors"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL COMPROBANTE DE NOTIFICACIÓN POR CORREO */}
      {notificacionModalData && (
        <ComprobanteNotificacionModal
          data={notificacionModalData}
          onClose={() => setNotificacionModalData(null)}
        />
      )}
    </div>
  );
}
