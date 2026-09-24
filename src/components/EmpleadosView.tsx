import React, { useState, useMemo } from 'react';
import {
  Cargo,
  Empleado,
  EvaluacionDesempeno,
  Solicitud,
  ItemInventarioEPP,
  SolicitudEntregaEPP,
  Role,
  UsuarioSistema
} from '../types';
import {
  Users,
  Plus,
  ArrowLeft,
  Mail,
  Phone,
  Briefcase,
  FileText,
  Calendar,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  HardHat,
  ShieldCheck,
  FileCheck,
  Package,
  Printer,
  Eye,
  Warehouse,
  Key,
  Lock,
  RefreshCw,
  Send,
  UserCheck,
  UserMinus,
  UserX,
  AlertTriangle,
  Trash2,
  Power,
  Shield,
  ExternalLink,
  Search,
  ChevronDown,
  Layers
} from 'lucide-react';
import { uid } from '../data/initialData';
import { INITIAL_INVENTARIO_EPP, INITIAL_SOLICITUDES_ENTREGA_EPP } from '../data/eppData';
import { SolicitarEppModal } from './SolicitarEppModal';
import { EntregarEppModal } from './EntregarEppModal';
import { ActaEntregaEppModal } from './ActaEntregaEppModal';
import { ModalGestionEstadoEmpleado } from './ModalGestionEstadoEmpleado';
import { ModalEliminarEmpleado } from './ModalEliminarEmpleado';
import {
  ComprobanteNotificacionModal,
  ComprobanteNotificacionData
} from './ComprobanteNotificacionModal';
import {
  generarCartaBienvenida,
  generarAsuntoBienvenida
} from '../utils/notificacionesCorreo';

interface EmpleadosViewProps {
  empleados: Empleado[];
  cargos: Cargo[];
  solicitudes: Solicitud[];
  evaluaciones: EvaluacionDesempeno[];
  onAddEmpleado: (
    nuevo: Empleado,
    opciones?: { crearUsuario?: boolean; passwordTemporal?: string }
  ) => Promise<{ usuarioCreado?: UsuarioSistema; passwordTemporal?: string; resultadoEnvio?: any } | void> | void;
  onOpenEvaluacionDetalle: (evaluacionId: string) => void;
  inventarioEpp?: ItemInventarioEPP[];
  solicitudesEpp?: SolicitudEntregaEPP[];
  onActualizarInventario?: (nuevo: ItemInventarioEPP[]) => void;
  onActualizarSolicitudes?: (nuevas: SolicitudEntregaEPP[]) => void;
  userRole?: Role;
  usuarios?: UsuarioSistema[];
  hayMasNube?: boolean;
  cargandoMasNube?: boolean;
  onCargarMasNube?: () => Promise<void>;
  cargandoNube?: boolean;
  onRefrescarNube?: () => Promise<void>;
  onUpdateEmpleado?: (empleado: Empleado) => Promise<void> | void;
  onDeleteEmpleado?: (id: string) => Promise<void> | void;
  isSuperAdmin?: boolean;
  currentUser?: UsuarioSistema | null;
}

export const EmpleadosView: React.FC<EmpleadosViewProps> = ({
  empleados,
  cargos,
  solicitudes,
  evaluaciones,
  onAddEmpleado,
  onOpenEvaluacionDetalle,
  inventarioEpp,
  solicitudesEpp,
  onActualizarInventario,
  onActualizarSolicitudes,
  userRole = 'admin',
  usuarios = [],
  hayMasNube = false,
  cargandoMasNube = false,
  onCargarMasNube,
  cargandoNube = false,
  onRefrescarNube,
  onUpdateEmpleado,
  onDeleteEmpleado,
  isSuperAdmin = false,
  currentUser
}) => {
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'hv' | 'contrato' | 'historial' | 'evals' | 'epps'>('hv');
  const [modalOpen, setModalOpen] = useState(false);
  const [empleadoParaGestionarEstado, setEmpleadoParaGestionarEstado] = useState<Empleado | null>(null);
  const [empleadoParaEliminar, setEmpleadoParaEliminar] = useState<Empleado | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'activos' | 'inactivos' | 'retirados'>('TODOS');
  const [feedbackToast, setFeedbackToast] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  // Estado local para EPPs en caso de operar directamente desde el módulo de empleados
  const [inventario, setInventario] = useState<ItemInventarioEPP[]>(() => {
    const limpio = typeof window !== 'undefined' && localStorage.getItem('bgroup_datos_limpios') === 'true';
    if (limpio) return (inventarioEpp || []).map(i => ({ ...i, stockActual: 0 }));
    return inventarioEpp || INITIAL_INVENTARIO_EPP;
  });
  const [solicitudesEppList, setSolicitudesEppList] = useState<SolicitudEntregaEPP[]>(() => {
    const limpio = typeof window !== 'undefined' && localStorage.getItem('bgroup_datos_limpios') === 'true';
    if (limpio) return solicitudesEpp || [];
    return solicitudesEpp || INITIAL_SOLICITUDES_ENTREGA_EPP;
  });

  // Sincronizar con props cuando cambian
  React.useEffect(() => {
    if (inventarioEpp) setInventario(inventarioEpp);
  }, [inventarioEpp]);

  React.useEffect(() => {
    if (solicitudesEpp) setSolicitudesEppList(solicitudesEpp);
  }, [solicitudesEpp]);

  // Modales de EPP
  const [solicitarEppModalOpen, setSolicitarEppModalOpen] = useState(false);
  const [entregarEppModalOpen, setEntregarEppModalOpen] = useState(false);
  const [solicitudParaEntrega, setSolicitudParaEntrega] = useState<SolicitudEntregaEPP | null>(null);
  const [actaEntregaModalOpen, setActaEntregaModalOpen] = useState(false);
  const [solicitudParaActa, setSolicitudParaActa] = useState<SolicitudEntregaEPP | null>(null);

  // Paginación y búsqueda para escalabilidad (lotes de 25)
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [limiteVisible, setLimiteVisible] = useState(25);

  const getEstadoLaboral = (emp: Empleado): 'activo' | 'inactivo' | 'retirado' => {
    if (emp.estadoLaboral) return emp.estadoLaboral;
    if (emp.activo === false) return 'inactivo';
    return 'activo';
  };

  const canManageEmployees = Boolean(
    isSuperAdmin ||
    userRole === 'admin' ||
    currentUser?.rol === 'admin_gh' ||
    currentUser?.rol === 'superadmin'
  );

  const conteosEstado = useMemo(() => {
    let activos = 0;
    let inactivos = 0;
    let retirados = 0;
    empleados.forEach(e => {
      const st = getEstadoLaboral(e);
      if (st === 'activo') activos++;
      else if (st === 'inactivo') inactivos++;
      else if (st === 'retirado') retirados++;
    });
    return { activos, inactivos, retirados, total: empleados.length };
  }, [empleados]);

  const empleadosFiltrados = useMemo(() => {
    return empleados.filter(e => {
      const st = getEstadoLaboral(e);
      if (filtroEstado === 'activos' && st !== 'activo') return false;
      if (filtroEstado === 'inactivos' && st !== 'inactivo') return false;
      if (filtroEstado === 'retirados' && st !== 'retirado') return false;

      if (!filtroBusqueda.trim()) return true;
      const term = filtroBusqueda.toLowerCase();
      return (
        e.nombre.toLowerCase().includes(term) ||
        (e.documento && e.documento.toLowerCase().includes(term)) ||
        (e.email && e.email.toLowerCase().includes(term)) ||
        getCargoNombre(e.cargoId).toLowerCase().includes(term)
      );
    });
  }, [empleados, filtroBusqueda, filtroEstado, cargos]);

  const renderEstadoBadge = (emp: Empleado, size: 'sm' | 'md' = 'sm') => {
    const st = getEstadoLaboral(emp);
    if (st === 'activo') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-bold ${
            size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
          } bg-emerald-50 text-emerald-800 border border-emerald-300`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Activo
        </span>
      );
    }
    if (st === 'inactivo') {
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-bold ${
            size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
          } bg-amber-50 text-amber-800 border border-amber-300`}
          title={emp.motivoRetiro ? `Motivo: ${emp.motivoRetiro}` : 'Colaborador inactivo'}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Inactivo
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-bold ${
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
        } bg-rose-50 text-rose-800 border border-rose-300`}
        title={emp.motivoRetiro ? `Motivo: ${emp.motivoRetiro}` : 'Colaborador retirado'}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
        Retirado {emp.fechaRetiro ? `(${emp.fechaRetiro})` : ''}
      </span>
    );
  };

  const empleadosPaginados = useMemo(() => {
    return empleadosFiltrados.slice(0, limiteVisible);
  }, [empleadosFiltrados, limiteVisible]);

  const handleCrearSolicitudEpp = (nueva: SolicitudEntregaEPP) => {
    const actualizadas = [nueva, ...solicitudesEppList];
    setSolicitudesEppList(actualizadas);
    if (onActualizarSolicitudes) {
      onActualizarSolicitudes(actualizadas);
    }
  };

  const handleCompletarEntregaEpp = (
    solicitudId: string,
    datosEntrega: {
      fechaEntrega: string;
      responsableEntrega: string;
      loteOSerie: string;
      observacionesEntrega: string;
      actaNumero: string;
      proximaReposicionSugerida: string;
    }
  ) => {
    const solicitud = solicitudesEppList.find(s => s.id === solicitudId);
    if (!solicitud) return;

    // 1. Descontar stock
    const inventarioActualizado = inventario.map(item => {
      if (item.id === solicitud.eppId || item.codigo === solicitud.eppCodigo) {
        return {
          ...item,
          stockActual: Math.max(0, item.stockActual - solicitud.cantidad)
        };
      }
      return item;
    });
    setInventario(inventarioActualizado);
    if (onActualizarInventario) onActualizarInventario(inventarioActualizado);

    // 2. Actualizar solicitud con estado 'Entregada' y datos de entrega
    const solicitudesActualizadas: SolicitudEntregaEPP[] = solicitudesEppList.map(s => {
      if (s.id === solicitudId) {
        return {
          ...s,
          estado: 'Entregada' as const,
          fechaEntrega: datosEntrega.fechaEntrega,
          responsableEntrega: datosEntrega.responsableEntrega,
          loteOSerie: datosEntrega.loteOSerie,
          observacionesEntrega: datosEntrega.observacionesEntrega,
          actaEntregaNumero: datosEntrega.actaNumero,
          firmaConformidadTrabajador: true,
          proximaReposicionSugerida: datosEntrega.proximaReposicionSugerida
        };
      }
      return s;
    });

    setSolicitudesEppList(solicitudesActualizadas);
    if (onActualizarSolicitudes) onActualizarSolicitudes(solicitudesActualizadas);
    setEntregarEppModalOpen(false);
    setSolicitudParaEntrega(null);
  };

  // Form state
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cargoId, setCargoId] = useState(cargos[0]?.id || '');
  const [contratoTipo, setContratoTipo] = useState('Término indefinido');
  const [inicio, setInicio] = useState(new Date().toISOString().slice(0, 10));
  const [salario, setSalario] = useState('$3.000.000');
  const [formacion, setFormacion] = useState('');
  const [experiencia, setExperiencia] = useState('');

  // Asociación automática de usuario
  const [crearUsuarioSistema, setCrearUsuarioSistema] = useState<boolean>(true);
  const [passwordTemporal, setPasswordTemporal] = useState<string>('BGroup2026*');
  const [guardando, setGuardando] = useState<boolean>(false);
  const [comprobanteData, setComprobanteData] = useState<ComprobanteNotificacionData | null>(null);

  const handleGenerarClaveAleatoria = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    setPasswordTemporal(`BGroup${random}*`);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    if (crearUsuarioSistema && (!email.trim() || !email.includes('@'))) {
      alert('Para asociar y crear la cuenta de usuario con rol Empleado es obligatorio indicar un correo electrónico válido.');
      return;
    }

    setGuardando(true);

    const nuevo: Empleado = {
      id: uid('e'),
      nombre: nombre.trim(),
      documento: documento.trim(),
      email: email.trim(),
      telefono: telefono.trim(),
      cargoId: cargoId || cargos[0]?.id || 'c1',
      formacion: formacion.trim(),
      experiencia: experiencia.trim(),
      contrato: {
        tipo: contratoTipo,
        inicio: inicio || '—',
        fin: '—',
        salario: salario.trim()
      },
      familia: [],
      activo: true
    };

    try {
      const res = await onAddEmpleado(nuevo, {
        crearUsuario: crearUsuarioSistema,
        passwordTemporal: passwordTemporal.trim() || 'BGroup2026*'
      });

      setNombre('');
      setDocumento('');
      setEmail('');
      setTelefono('');
      setFormacion('');
      setExperiencia('');
      setModalOpen(false);

      if (res && res.usuarioCreado) {
        setComprobanteData({
          usuario: res.usuarioCreado,
          passwordTemporal: res.passwordTemporal || passwordTemporal,
          asunto: generarAsuntoBienvenida(res.usuarioCreado),
          cuerpo: generarCartaBienvenida(res.usuarioCreado, res.passwordTemporal || passwordTemporal),
          fechaEnvio: new Date().toLocaleString('es-CO'),
          resultadoFirebase: res.resultadoEnvio
        });
      }
    } catch (err) {
      console.error('Error al registrar empleado y usuario asociado:', err);
    } finally {
      setGuardando(false);
    }
  };

  const currentEmpleado = empleados.find(e => e.id === selectedEmpleadoId);
  const getCargoNombre = (id: string) => cargos.find(c => c.id === id)?.nombre || 'Cargo no definido';

  // Si hay un empleado seleccionado, mostramos la ficha en detalle
  if (currentEmpleado) {
    const empSolicitudes = (solicitudes || []).filter(s => s.empleadoId === currentEmpleado.id);
    const empEvals = (evaluaciones || []).filter(ev => ev.empleadoId === currentEmpleado.id);
    const aprobadas = empSolicitudes.filter(s => s.estado === 'Aprobada');
    const rechazadas = empSolicitudes.filter(s => s.estado === 'Rechazada');
    const pendientes = empSolicitudes.filter(s => s.estado === 'Pendiente');

    const empEpps = (solicitudesEppList || []).filter(s => s.empleadoId === currentEmpleado.id);
    const eppsEntregadosCount = empEpps.filter(s => s.estado === 'Entregada').length;
    const eppsPendientesCount = empEpps.filter(s => s.estado === 'Pendiente').length;
    const ultimoEppEntregado = empEpps
      .filter(s => s.estado === 'Entregada')
      .sort((a, b) => (b.fechaEntrega || '').localeCompare(a.fechaEntrega || ''))[0];
    const ultimaFechaEntrega = ultimoEppEntregado?.fechaEntrega || 'Sin entregas registradas';

    const usuarioVinculado = (usuarios || []).find(
      u => u.empleadoId === currentEmpleado.id ||
           (u.email && currentEmpleado.email && u.email.toLowerCase() === currentEmpleado.email.toLowerCase()) ||
           (u.documento && currentEmpleado.documento && u.documento === currentEmpleado.documento)
    );

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#8FA7D6]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedEmpleadoId(null)}
              className="p-2 rounded border border-[#8FA7D6] bg-white hover:bg-[#F8FAFC] text-[#282829] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#18235C]">
                {currentEmpleado.nombre}
              </h1>
              <p className="text-xs text-[#282829]/70">
                {getCargoNombre(currentEmpleado.cargoId)} · Documento: {currentEmpleado.documento}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {renderEstadoBadge(currentEmpleado, 'md')}

            {canManageEmployees && (
              <button
                type="button"
                onClick={() => setEmpleadoParaGestionarEstado(currentEmpleado)}
                className="text-xs px-3 py-1.5 rounded font-semibold bg-[#18235C] hover:bg-[#101740] text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="Cambiar estado: Activar, Inactivar o Retirar colaborador"
              >
                <Power className="w-3.5 h-3.5 text-[#8FA7D6]" />
                <span>Gestionar Estado / Novedad</span>
              </button>
            )}

            {canManageEmployees && onDeleteEmpleado && (
              <button
                type="button"
                onClick={() => setEmpleadoParaEliminar(currentEmpleado)}
                className="text-xs px-2.5 py-1.5 rounded font-semibold bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Eliminar expediente en caso de creación errónea o duplicada"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Eliminar</span>
              </button>
            )}

            {usuarioVinculado ? (
              <button
                type="button"
                onClick={() => {
                  setComprobanteData({
                    usuario: usuarioVinculado,
                    passwordTemporal: usuarioVinculado.password || 'BGroup2026*',
                    asunto: generarAsuntoBienvenida(usuarioVinculado),
                    cuerpo: generarCartaBienvenida(usuarioVinculado, usuarioVinculado.password || 'BGroup2026*'),
                    fechaEnvio: new Date().toLocaleString('es-CO'),
                    resultadoFirebase: {
                      success: true,
                      message: 'Cuenta de usuario vinculada con rol Empleado',
                      method: 'Firebase Auth & Firestore'
                    }
                  });
                }}
                className="text-xs px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Ver credenciales de acceso y opciones de entrega por correo"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cuenta Usuario Activa (Rol: Empleado)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  const res = await onAddEmpleado(currentEmpleado, {
                    crearUsuario: true,
                    passwordTemporal: 'BGroup2026*'
                  });
                  if (res && res.usuarioCreado) {
                    setComprobanteData({
                      usuario: res.usuarioCreado,
                      passwordTemporal: res.passwordTemporal || 'BGroup2026*',
                      asunto: generarAsuntoBienvenida(res.usuarioCreado),
                      cuerpo: generarCartaBienvenida(res.usuarioCreado, res.passwordTemporal || 'BGroup2026*'),
                      fechaEnvio: new Date().toLocaleString('es-CO'),
                      resultadoFirebase: res.resultadoEnvio
                    });
                  }
                }}
                className="text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-50 text-[#18235C] border border-blue-300 hover:bg-blue-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Vincular y crear cuenta de usuario con rol Empleado para este colaborador"
              >
                <Key className="w-3.5 h-3.5 text-[#18235C]" />
                <span>Vincular Usuario (Rol Empleado)</span>
              </button>
            )}
          </div>
        </div>

        {/* Banners informativos según el estado laboral */}
        {getEstadoLaboral(currentEmpleado) === 'retirado' && (
          <div className="p-4 bg-rose-50/90 border border-rose-300 rounded-lg flex items-start gap-3 shadow-2xs">
            <UserX className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-rose-950 text-sm">
                Colaborador Retirado / Contrato Finalizado
              </div>
              <p className="text-rose-900">
                Este colaborador fue desvinculado formalmente de la organización el <strong>{currentEmpleado.fechaRetiro || 'Fecha no registrada'}</strong>.
              </p>
              {currentEmpleado.motivoRetiro && (
                <p className="text-rose-900">
                  <strong>Causa Legal de Terminación:</strong> {currentEmpleado.motivoRetiro}
                </p>
              )}
              {currentEmpleado.observacionesRetiro && (
                <p className="text-rose-800 italic">
                  <strong>Observaciones / Paz y Salvo:</strong> {currentEmpleado.observacionesRetiro}
                </p>
              )}
            </div>
          </div>
        )}

        {getEstadoLaboral(currentEmpleado) === 'inactivo' && (
          <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-lg flex items-start gap-3 shadow-2xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-amber-950 text-sm">
                Colaborador Temporalmente Inactivo / Suspensión de Labores
              </div>
              <p className="text-amber-900">
                El colaborador cuenta con una novedad laboral que suspende temporalmente sus funciones. El contrato se mantiene vigente.
                {currentEmpleado.motivoRetiro ? ` Motivo: ${currentEmpleado.motivoRetiro}.` : ''}
              </p>
              {currentEmpleado.observacionesRetiro && (
                <p className="text-amber-800 italic">
                  <strong>Observaciones:</strong> {currentEmpleado.observacionesRetiro}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#8FA7D6]/30 text-xs">
          <button
            onClick={() => setActiveTab('hv')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'hv'
                ? 'text-[#18235C] border-b-2 border-[#18235C] bg-white'
                : 'text-[#282829]/70 hover:text-[#18235C]'
            }`}
          >
            Hoja de vida
          </button>
          <button
            onClick={() => setActiveTab('contrato')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'contrato'
                ? 'text-[#18235C] border-b-2 border-[#18235C] bg-white'
                : 'text-[#282829]/70 hover:text-[#18235C]'
            }`}
          >
            Contrato laboral
          </button>
          <button
            onClick={() => setActiveTab('historial')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'historial'
                ? 'text-[#18235C] border-b-2 border-[#18235C] bg-white'
                : 'text-[#282829]/70 hover:text-[#18235C]'
            }`}
          >
            Historial de solicitudes ({empSolicitudes.length})
          </button>
          <button
            onClick={() => setActiveTab('evals')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'evals'
                ? 'text-[#18235C] border-b-2 border-[#18235C] bg-white'
                : 'text-[#282829]/70 hover:text-[#18235C]'
            }`}
          >
            Evaluaciones técnicas ({empEvals.length})
          </button>
          <button
            onClick={() => setActiveTab('epps')}
            className={`px-4 py-2 font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'epps'
                ? 'text-[#18235C] border-b-2 border-[#18235C] bg-white'
                : 'text-[#282829]/70 hover:text-[#18235C]'
            }`}
          >
            <HardHat className="w-3.5 h-3.5" />
            <span>Dotaciones y EPP ({empEpps.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'hv' && (
          <div className="bg-white rounded border border-[#8FA7D6] p-5 space-y-4 shadow-xs">
            <h3 className="font-bold tracking-tight text-base font-medium text-[#18235C]">
              Datos Generales y Perfil
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-[#F8FAFC] rounded border border-[#8FA7D6]">
                <span className="text-[#282829] block mb-0.5 font-semibold">Correo corporativo</span>
                <span className="text-[#18235C] font-medium break-all">{currentEmpleado.email || '—'}</span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded border border-[#8FA7D6]">
                <span className="text-[#282829] block mb-0.5 font-semibold">Teléfono de contacto</span>
                <span className="text-[#18235C] font-medium">{currentEmpleado.telefono || '—'}</span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded border border-[#8FA7D6]">
                <span className="text-[#282829] block mb-0.5 font-semibold">Cargo formal</span>
                <span className="text-[#18235C] font-medium">{getCargoNombre(currentEmpleado.cargoId)}</span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded border border-[#8FA7D6]">
                <span className="text-[#282829] block mb-0.5 font-semibold">Núcleo familiar</span>
                <span className="text-[#18235C] font-medium">{(currentEmpleado.familia || []).length} personas</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#8FA7D6] space-y-3 text-xs">
              <div>
                <strong className="block text-[#18235C] mb-1">Formación Académica:</strong>
                <p className="text-[#282829] bg-[#F8FAFC] p-3 rounded border border-[#8FA7D6]">
                  {currentEmpleado.formacion || 'Sin registro detallado de formación.'}
                </p>
              </div>
              <div>
                <strong className="block text-[#18235C] mb-1">Experiencia y Trayectoria:</strong>
                <p className="text-[#282829] bg-[#F8FAFC] p-3 rounded border border-[#8FA7D6]">
                  {currentEmpleado.experiencia || 'Sin registro de experiencia previa.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contrato' && (
          <div className="bg-white rounded border border-[#8FA7D6] p-5 shadow-xs space-y-4">
            <h3 className="font-bold tracking-tight text-base font-medium text-[#18235C]">
              Condiciones Contractuales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs">
              <div className="p-3 bg-[#F8FAFC] rounded border border-[#8FA7D6]">
                <span className="text-[#282829] block mb-0.5 font-semibold">Tipo de Contrato</span>
                <span className="text-[#18235C] font-medium">{currentEmpleado.contrato.tipo}</span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded border border-[#8FA7D6]">
                <span className="text-[#282829] block mb-0.5 font-semibold">Salario Asignado</span>
                <span className="text-[#18235C] font-bold text-sm">{currentEmpleado.contrato.salario}</span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded border border-[#8FA7D6]">
                <span className="text-[#282829] block mb-0.5 font-semibold">Fecha de Inicio</span>
                <span className="text-[#18235C] font-medium">{currentEmpleado.contrato.inicio}</span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded border border-[#8FA7D6]">
                <span className="text-[#282829] block mb-0.5 font-semibold">Vencimiento / Término</span>
                <span className="text-[#18235C] font-medium">{currentEmpleado.contrato.fin || 'Indefinido'}</span>
              </div>
              <div className="p-3 bg-[#F8FAFC] rounded border border-[#8FA7D6]">
                <span className="text-[#282829] block mb-0.5 font-semibold">Estado del Contrato</span>
                <div>{renderEstadoBadge(currentEmpleado, 'sm')}</div>
              </div>
            </div>

            {(currentEmpleado.fechaRetiro || currentEmpleado.motivoRetiro || currentEmpleado.observacionesRetiro) && (
              <div className="p-4 rounded-lg border border-[#8FA7D6]/60 bg-[#F8FAFC] space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-[#18235C] uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Historial y Registro de Novedad Laboral</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs pt-1">
                  {currentEmpleado.fechaRetiro && (
                    <div>
                      <span className="text-slate-500 block font-medium">Fecha de Retiro / Desvinculación:</span>
                      <span className="font-semibold text-rose-800">{currentEmpleado.fechaRetiro}</span>
                    </div>
                  )}
                  {currentEmpleado.motivoRetiro && (
                    <div>
                      <span className="text-slate-500 block font-medium">Causa / Motivo:</span>
                      <span className="font-semibold text-slate-800">{currentEmpleado.motivoRetiro}</span>
                    </div>
                  )}
                  {currentEmpleado.observacionesRetiro && (
                    <div className="col-span-full">
                      <span className="text-slate-500 block font-medium">Observaciones de Gestión Humana:</span>
                      <span className="text-slate-700 italic">{currentEmpleado.observacionesRetiro}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'historial' && (
          <div className="bg-white rounded border border-[#8FA7D6] p-5 shadow-xs space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#8FA7D6/20] p-3 rounded text-center border border-[#18235C]/20">
                <span className="text-xl font-bold tracking-tight font-bold text-[#18235C]">{aprobadas.length}</span>
                <span className="text-xs text-[#18235C] block font-semibold">Aprobadas</span>
              </div>
              <div className="bg-[#F3E3DE] p-3 rounded text-center border border-[#A8503E]/20">
                <span className="text-xl font-bold tracking-tight font-bold text-[#A8503E]">{rechazadas.length}</span>
                <span className="text-xs text-[#A8503E] block font-semibold">Rechazadas</span>
              </div>
              <div className="bg-[#F5EAD4] p-3 rounded text-center border border-[#B5842A]/20">
                <span className="text-xl font-bold tracking-tight font-bold text-[#B5842A]">{pendientes.length}</span>
                <span className="text-xs text-[#B5842A] block font-semibold">Pendientes</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#8FA7D6] text-[#282829]">
                    <th className="py-2 px-3 font-semibold">Tipo</th>
                    <th className="py-2 px-3 font-semibold">Fechas</th>
                    <th className="py-2 px-3 font-semibold">Motivo</th>
                    <th className="py-2 px-3 font-semibold">Estado</th>
                    <th className="py-2 px-3 font-semibold">Decisión & Comentario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/60">
                  {empSolicitudes.map(s => (
                    <tr key={s.id} className="hover:bg-[#F8FAFC]/50">
                      <td className="py-2.5 px-3 font-medium text-[#18235C]">{s.tipo}</td>
                      <td className="py-2.5 px-3 text-[#282829]">{s.inicio} al {s.fin}</td>
                      <td className="py-2.5 px-3 text-[#282829]">{s.motivo}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.estado === 'Aprobada' ? 'bg-[#8FA7D6/20] text-[#18235C]' :
                          s.estado === 'Rechazada' ? 'bg-[#F3E3DE] text-[#A8503E]' : 'bg-[#F5EAD4] text-[#B5842A]'
                        }`}>
                          {s.estado}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#282829]">
                        {s.fechaDecision ? `${s.fechaDecision}: ${s.comentario || 'Sin comentario'}` : '—'}
                      </td>
                    </tr>
                  ))}
                  {empSolicitudes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-[#282829]">
                        No hay solicitudes registradas para este empleado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'evals' && (
          <div className="bg-white rounded border border-[#8FA7D6] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#8FA7D6]">
              <h3 className="font-bold tracking-tight text-base font-medium text-[#18235C]">
                Histórico de Evaluaciones de Desempeño
              </h3>
              <span className="text-xs text-[#282829]">
                Modelo técnico de 100 puntos derivado del cargo
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#8FA7D6] text-[#282829]">
                    <th className="py-2 px-3 font-semibold">Periodo</th>
                    <th className="py-2 px-3 font-semibold">Resultados (50%)</th>
                    <th className="py-2 px-3 font-semibold">Competencias (25%)</th>
                    <th className="py-2 px-3 font-semibold">Cumplimiento (15%)</th>
                    <th className="py-2 px-3 font-semibold">Desarrollo (10%)</th>
                    <th className="py-2 px-3 font-semibold">Total Final</th>
                    <th className="py-2 px-3 font-semibold">Clasificación</th>
                    <th className="py-2 px-3 font-semibold">Estado</th>
                    <th className="py-2 px-3 font-semibold text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/60">
                  {empEvals.map(ev => (
                    <tr key={ev.id} className="hover:bg-[#F8FAFC]/50">
                      <td className="py-2.5 px-3 font-bold text-[#18235C]">{ev.periodo}</td>
                      <td className="py-2.5 px-3 text-[#282829] font-mono">{ev.subtotalResultados} / 50</td>
                      <td className="py-2.5 px-3 text-[#282829] font-mono">{ev.subtotalCompetencias} / 25</td>
                      <td className="py-2.5 px-3 text-[#282829] font-mono">{ev.subtotalCumplimiento} / 15</td>
                      <td className="py-2.5 px-3 text-[#282829] font-mono">{ev.subtotalDesarrollo} / 10</td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold tracking-tight font-bold text-sm text-[#18235C]">
                          {ev.puntajeFinal} / 100
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#8FA7D6/20] text-[#18235C]">
                          {ev.clasificacion}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[11px] font-mono text-[#282829]">
                          {ev.estado}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onOpenEvaluacionDetalle(ev.id)}
                          className="px-2.5 py-1 rounded bg-[#18235C] hover:bg-[#101740] text-white text-xs font-semibold flex items-center gap-1 ml-auto"
                        >
                          <span>Ver auditoría</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {empEvals.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-6 text-center text-[#282829]">
                        No se han aplicado evaluaciones de desempeño todavía para este empleado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'epps' && (
          <div className="bg-white rounded border border-[#8FA7D6] p-5 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#8FA7D6]">
              <div>
                <h3 className="font-bold tracking-tight text-base font-medium text-[#18235C] flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-[#18235C]" />
                  <span>Control Individual de Dotación y Elementos de Protección Personal</span>
                </h3>
                <p className="text-xs text-[#282829] mt-0.5">
                  Registro histórico de asignaciones, reposiciones y actas firmadas (Res. 2400/1979 y Dec. 1072/2015).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSolicitarEppModalOpen(true)}
                  className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Solicitar Dotación / EPP</span>
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#FFFFFF] p-3.5 rounded-lg border border-[#8FA7D6]">
                <div className="flex items-center gap-2 text-xs text-[#282829] mb-1">
                  <ShieldCheck className="w-4 h-4 text-[#18235C]" />
                  <span>Entregas Conformes</span>
                </div>
                <div className="text-2xl font-bold font-bold tracking-tight text-[#18235C]">
                  {eppsEntregadosCount}
                </div>
                <span className="text-[11px] text-[#282829]">Con acta oficial y firma de entrega</span>
              </div>

              <div className="bg-[#FFFFFF] p-3.5 rounded-lg border border-[#8FA7D6]">
                <div className="flex items-center gap-2 text-xs text-[#282829] mb-1">
                  <Clock className="w-4 h-4 text-[#D97706]" />
                  <span>Solicitudes en Trámite</span>
                </div>
                <div className="text-2xl font-bold font-bold tracking-tight text-[#D97706]">
                  {eppsPendientesCount}
                </div>
                <span className="text-[11px] text-[#282829]">Pendientes por almacén / SST</span>
              </div>

              <div className="bg-[#FFFFFF] p-3.5 rounded-lg border border-[#8FA7D6]">
                <div className="flex items-center gap-2 text-xs text-[#282829] mb-1">
                  <Package className="w-4 h-4 text-[#18235C]" />
                  <span>Última Dotación Registrada</span>
                </div>
                <div className="text-sm font-semibold text-[#18235C] font-mono mt-1">
                  {ultimaFechaEntrega}
                </div>
                <span className="text-[11px] text-[#282829]">Registro más reciente en hoja de vida</span>
              </div>
            </div>

            {/* Table of Employee EPPs */}
            <div className="overflow-x-auto border border-[#8FA7D6] rounded">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#FFFFFF] border-b border-[#8FA7D6] text-[#282829]">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Elemento / Código</th>
                    <th className="py-2.5 px-3 font-semibold">Categoría</th>
                    <th className="py-2.5 px-3 font-semibold">Talla / Cant.</th>
                    <th className="py-2.5 px-3 font-semibold">Motivo</th>
                    <th className="py-2.5 px-3 font-semibold">Fecha Solicitud / Entrega</th>
                    <th className="py-2.5 px-3 font-semibold">Estado</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/60">
                  {empEpps.map(epp => (
                    <tr key={epp.id} className="hover:bg-[#F8FAFC]/50">
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#18235C]">{epp.eppNombre}</div>
                        <div className="text-[10px] font-mono text-[#282829]">{epp.eppCodigo}</div>
                      </td>
                      <td className="py-2.5 px-3 text-[#282829]">{epp.eppCategoria}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-[#18235C]">{epp.cantidad} u.</span>
                        {epp.talla && <span className="text-[#282829] ml-1">({epp.talla})</span>}
                      </td>
                      <td className="py-2.5 px-3 text-[#282829]">{epp.motivo}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#282829]">
                        <div>Sol: {epp.fechaSolicitud}</div>
                        {epp.fechaEntrega && (
                          <div className="text-[#18235C] font-semibold">Ent: {epp.fechaEntrega}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {epp.estado === 'Entregada' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#8FA7D6/20] text-[#18235C]">
                            Entregada
                          </span>
                        )}
                        {epp.estado === 'Pendiente' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Pendiente
                          </span>
                        )}
                        {epp.estado === 'Aprobada' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            Aprobada
                          </span>
                        )}
                        {epp.estado === 'Rechazada' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            Rechazada
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {epp.estado === 'Entregada' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSolicitudParaActa(epp);
                                setActaEntregaModalOpen(true);
                              }}
                              className="px-2 py-1 rounded bg-[#F8FAFC] hover:bg-[#8FA7D6/20] text-[#18235C] border border-[#8FA7D6] text-[11px] font-semibold flex items-center gap-1 transition-colors"
                              title="Ver e Imprimir Acta Oficial de Entrega"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Acta</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSolicitudParaEntrega(epp);
                                setEntregarEppModalOpen(true);
                              }}
                              className="px-2 py-1 rounded bg-[#18235C] hover:bg-[#101740] text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
                            >
                              <Package className="w-3 h-3" />
                              <span>Entregar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {empEpps.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#282829]">
                        <HardHat className="w-8 h-8 mx-auto mb-2 text-[#282829]/40" />
                        <p className="font-medium text-[#18235C]">No registra asignaciones de dotación o EPP</p>
                        <p className="text-xs text-[#282829] mt-0.5">
                          Haga clic en &ldquo;Solicitar Dotación / EPP&rdquo; para registrar una nueva entrega reglamentaria.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modales de Dotaciones y EPPs */}
        {solicitarEppModalOpen && currentEmpleado && (
          <SolicitarEppModal
            empleado={currentEmpleado}
            inventarioEpp={inventario}
            onClose={() => setSolicitarEppModalOpen(false)}
            onCrearSolicitud={handleCrearSolicitudEpp}
          />
        )}

        {entregarEppModalOpen && solicitudParaEntrega && (
          <EntregarEppModal
            solicitud={solicitudParaEntrega}
            inventarioEpp={inventario}
            onClose={() => {
              setEntregarEppModalOpen(false);
              setSolicitudParaEntrega(null);
            }}
            onConfirmarEntrega={handleCompletarEntregaEpp}
          />
        )}

        {actaEntregaModalOpen && solicitudParaActa && (
          <ActaEntregaEppModal
            solicitud={solicitudParaActa}
            onClose={() => {
              setActaEntregaModalOpen(false);
              setSolicitudParaActa(null);
            }}
          />
        )}
      </div>
    );
  }

  // Lista general de empleados
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#8FA7D6]">
        <div>
          <h1 className="font-bold tracking-tight text-3xl font-medium text-[#18235C]">
            Catálogo de Empleados
          </h1>
          <p className="text-sm text-[#282829] mt-1 max-w-2xl">
            Gestión de colaboradores, hojas de vida, asignación a manual de cargos y seguimiento histórico de desempeño.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onRefrescarNube && (
            <button
              type="button"
              onClick={() => onRefrescarNube()}
              disabled={cargandoNube}
              className="px-3 py-2 bg-white hover:bg-[#F8FAFC] text-[#18235C] border border-[#8FA7D6] text-xs font-semibold rounded flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
              title="Consultar lote actualizado de Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${cargandoNube ? 'animate-spin text-[#18235C]' : ''}`} />
              <span>{cargandoNube ? 'Consultando nube...' : 'Refrescar Nube'}</span>
            </button>
          )}
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo empleado</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded border border-[#8FA7D6] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#8FA7D6] flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => { setFiltroEstado('TODOS'); setLimiteVisible(25); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                filtroEstado === 'TODOS'
                  ? 'bg-[#18235C] text-white shadow-2xs'
                  : 'bg-[#F8FAFC] text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Todos ({conteosEstado.total})
            </button>
            <button
              type="button"
              onClick={() => { setFiltroEstado('activos'); setLimiteVisible(25); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                filtroEstado === 'activos'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Activos ({conteosEstado.activos})
            </button>
            <button
              type="button"
              onClick={() => { setFiltroEstado('inactivos'); setLimiteVisible(25); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                filtroEstado === 'inactivos'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Inactivos ({conteosEstado.inactivos})
            </button>
            <button
              type="button"
              onClick={() => { setFiltroEstado('retirados'); setLimiteVisible(25); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                filtroEstado === 'retirados'
                  ? 'bg-rose-700 text-white shadow-2xs'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              Retirados ({conteosEstado.retirados})
            </button>

            <span className="text-[11px] text-[#282829]/70 bg-[#8FA7D6]/20 px-2.5 py-1 rounded-full font-semibold ml-1">
              Mostrando {empleadosPaginados.length} de {empleadosFiltrados.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#282829]/50" />
              <input
                type="text"
                value={filtroBusqueda}
                onChange={e => {
                  setFiltroBusqueda(e.target.value);
                  setLimiteVisible(25); // Reiniciar paginación al buscar
                }}
                placeholder="Buscar por nombre, CC o cargo..."
                className="w-full pl-8 pr-3 py-1.5 bg-[#F8FAFC] border border-[#8FA7D6] rounded text-xs text-[#282829] focus:outline-hidden focus:ring-2 focus:ring-[#18235C]"
              />
            </div>
            {filtroBusqueda && (
              <button
                type="button"
                onClick={() => {
                  setFiltroBusqueda('');
                  setLimiteVisible(25);
                }}
                className="text-xs text-[#18235C] hover:underline font-semibold cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#8FA7D6] text-[#282829] bg-[#F8FAFC]/50">
                <th className="py-3 px-4 font-semibold">Nombre</th>
                <th className="py-3 px-4 font-semibold">Cargo Estructural</th>
                <th className="py-3 px-4 font-semibold">Tipo Contrato</th>
                <th className="py-3 px-4 font-semibold">Salario</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8FA7D6]/60">
              {empleadosPaginados.map(emp => (
                <tr key={emp.id} className="hover:bg-[#F8FAFC]/50">
                  <td className="py-3 px-4 font-medium text-[#18235C]">
                    <button
                      onClick={() => setSelectedEmpleadoId(emp.id)}
                      className="text-left hover:text-[#18235C] hover:underline cursor-pointer"
                    >
                      <div className="font-semibold text-sm text-[#18235C]">{emp.nombre}</div>
                      <div className="text-[11px] text-[#282829]">{emp.email || emp.documento}</div>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-[#18235C] font-medium">
                    {getCargoNombre(emp.cargoId)}
                  </td>
                  <td className="py-3 px-4 text-[#282829]">
                    {emp.contrato.tipo}
                  </td>
                  <td className="py-3 px-4 text-[#18235C] font-semibold">
                    {emp.contrato.salario}
                  </td>
                  <td className="py-3 px-4">
                    {renderEstadoBadge(emp, 'sm')}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedEmpleadoId(emp.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#18235C] hover:bg-[#8FA7D6]/10 rounded border border-[#8FA7D6]/40 cursor-pointer"
                      >
                        Ver expediente
                      </button>
                      {canManageEmployees && (
                        <button
                          type="button"
                          onClick={() => setEmpleadoParaGestionarEstado(emp)}
                          className="px-2.5 py-1 text-xs font-semibold bg-[#F8FAFC] text-slate-700 hover:bg-slate-200 rounded border border-slate-300 transition-colors cursor-pointer"
                          title="Cambiar estado: Activo, Inactivo o Retirado"
                        >
                          Estado
                        </button>
                      )}
                      {canManageEmployees && onDeleteEmpleado && (
                        <button
                          type="button"
                          onClick={() => setEmpleadoParaEliminar(emp)}
                          className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                          title="Eliminar expediente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {empleadosFiltrados.length === 0 && empleados.length > 0 && (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-[#282829]/70">
                    No se encontraron colaboradores que coincidan con <strong>"{filtroBusqueda}"</strong>.
                  </td>
                </tr>
              )}
              {empleados.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#8FA7D6]/20 text-[#18235C] flex items-center justify-center mb-3">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold tracking-tight text-base font-semibold text-[#18235C]">
                      Base de datos de nómina y personal activa
                    </h3>
                    <p className="text-xs text-[#282829] mt-1 max-w-md mx-auto">
                      Aún no hay colaboradores vinculados en el sistema. Comienza registrando la ficha del personal con el botón inferior.
                    </p>
                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      className="mt-4 px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-semibold rounded inline-flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Registrar Colaborador</span>
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Barra de Paginación y Cargar Más */}
        <div className="p-3.5 bg-[#F8FAFC] border-t border-[#8FA7D6] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#282829]/80 font-medium">
              Mostrando {empleadosPaginados.length} de {empleadosFiltrados.length} colaboradores
            </span>
            {hayMasNube && (
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Lotes pendientes en Firestore
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Botón de consulta paginada con cursor a Firestore */}
            {hayMasNube && onCargarMasNube && (
              <button
                type="button"
                onClick={() => onCargarMasNube()}
                disabled={cargandoMasNube}
                className="px-3 py-1.5 bg-[#101740] hover:bg-[#18235C] text-white rounded text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                title="Cargar los siguientes 25 registros de Firestore mediante cursor startAfter"
              >
                {cargandoMasNube ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                <span>{cargandoMasNube ? 'Consultando nube...' : 'Cargar más de la Nube (+25 con cursor)'}</span>
              </button>
            )}

            {limiteVisible < empleadosFiltrados.length && (
              <button
                type="button"
                onClick={() => setLimiteVisible(prev => prev + 25)}
                className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                Mostrar más locales (+25)
              </button>
            )}
            {limiteVisible < empleadosFiltrados.length ? (
              <button
                type="button"
                onClick={() => setLimiteVisible(empleadosFiltrados.length)}
                className="px-2.5 py-1.5 bg-white hover:bg-[#8FA7D6]/20 border border-[#8FA7D6] text-[#18235C] rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                Mostrar todos ({empleadosFiltrados.length})
              </button>
            ) : empleadosFiltrados.length > 25 ? (
              <button
                type="button"
                onClick={() => setLimiteVisible(25)}
                className="px-2.5 py-1.5 bg-white hover:bg-[#8FA7D6]/20 border border-[#8FA7D6] text-[#18235C] rounded text-xs font-semibold transition-colors cursor-pointer"
              >
                Restablecer a 25
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Modal Crear Empleado */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded border border-[#8FA7D6] max-w-xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold tracking-tight text-xl font-medium text-[#18235C] mb-1">
              Vincular Nuevo Empleado
            </h3>
            <p className="text-xs text-[#282829] mb-4">
              Ingresa los datos personales y contractuales para integrarlo a la estructura y modelo de evaluación.
            </p>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#282829] mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carlos Mendivelso"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    className="w-full p-2.5 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#282829] mb-1">Documento de Identidad *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1.019.034.789"
                    value={documento}
                    onChange={e => setDocumento(e.target.value)}
                    className="w-full p-2.5 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#282829] mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="nombre@empresa.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#282829] mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="318 000 0000"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    className="w-full p-2.5 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#282829] mb-1">Cargo a Asignar *</label>
                  <select
                    value={cargoId}
                    onChange={e => setCargoId(e.target.value)}
                    className="w-full p-2.5 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  >
                    {cargos.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.ficha.identificacion.codigo || 'S/C'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#282829] mb-1">Tipo de Contrato</label>
                  <select
                    value={contratoTipo}
                    onChange={e => setContratoTipo(e.target.value)}
                    className="w-full p-2.5 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  >
                    <option value="Término indefinido">Término indefinido</option>
                    <option value="Término fijo">Término fijo</option>
                    <option value="Prestación de servicios">Prestación de servicios</option>
                    <option value="Aprendizaje">Aprendizaje / Prácticas</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#282829] mb-1">Fecha de Ingreso</label>
                  <input
                    type="date"
                    value={inicio}
                    onChange={e => setInicio(e.target.value)}
                    className="w-full p-2.5 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#282829] mb-1">Salario Mensual</label>
                  <input
                    type="text"
                    placeholder="$0"
                    value={salario}
                    onChange={e => setSalario(e.target.value)}
                    className="w-full p-2.5 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#282829] mb-1">Formación Académica</label>
                <input
                  type="text"
                  placeholder="Título profesional, tecnólogo o especialización"
                  value={formacion}
                  onChange={e => setFormacion(e.target.value)}
                  className="w-full p-2.5 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#282829] mb-1">Experiencia Laboral Previa</label>
                <textarea
                  rows={3}
                  placeholder="Resumen de funciones y empresas anteriores..."
                  value={experiencia}
                  onChange={e => setExperiencia(e.target.value)}
                  className="w-full p-2.5 rounded border border-[#8FA7D6] bg-[#F8FAFC]"
                />
              </div>

              {/* Sección: Creación y Vinculación de Usuario del Sistema (Rol: Empleado) */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#18235C] text-white shrink-0 mt-0.5 shadow-2xs">
                    <Key className="w-4 h-4 text-[#00FF00]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-[#18235C]">
                        Acceso Institucional y Rol de Sistema
                      </h4>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                        Rol: Empleado
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Vincule de forma simultánea este colaborador a la base de usuarios de la plataforma y active sus credenciales institucionales.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-blue-200/80 space-y-3">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={crearUsuarioSistema}
                      onChange={e => setCrearUsuarioSistema(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#18235C] focus:ring-[#18235C] border-blue-300"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-[#18235C]">
                        Crear automáticamente cuenta de usuario con rol "Empleado"
                      </span>
                      <p className="text-[11px] text-slate-500">
                        El colaborador podrá iniciar sesión en la plataforma con su correo institucional y gestionar solicitudes, capacitaciones, dotaciones EPP y SG-SST.
                      </p>
                    </div>
                  </label>

                  {crearUsuarioSistema && (
                    <div className="pl-6 space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Contraseña Temporal Inicial
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={passwordTemporal}
                              onChange={e => setPasswordTemporal(e.target.value)}
                              placeholder="Ej: BGroup2026*"
                              className="w-full pl-8 pr-3 py-1.5 text-xs font-mono rounded-lg border border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleGenerarClaveAleatoria}
                            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-blue-300 bg-white hover:bg-blue-100/50 text-[#18235C] transition-colors flex items-center gap-1.5 shrink-0"
                            title="Generar clave aleatoria segura"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Generar</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white/90 border border-blue-200 text-[11px] text-slate-600 flex items-start gap-2">
                        <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <p>
                          Al registrar, se creará el usuario en <strong>Firebase Authentication</strong> y se abrirá el panel de despacho inmediato del correo con credenciales e instrucciones de bienvenida institucional.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#8FA7D6]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 text-[#282829] hover:bg-[#F8FAFC] rounded border border-[#8FA7D6]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 text-white bg-[#18235C] hover:bg-[#101740] rounded font-semibold transition-colors flex items-center gap-2 disabled:opacity-60"
                >
                  {guardando ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Registrando y Creando Usuario...</span>
                    </>
                  ) : (
                    <span>Registrar Empleado {crearUsuarioSistema ? 'y Usuario' : ''}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal comprobante y despacho de notificación por correo */}
      {comprobanteData && (
        <ComprobanteNotificacionModal
          data={comprobanteData}
          onClose={() => setComprobanteData(null)}
        />
      )}

      {/* Modal de Gestión de Estado Laboral (Activar, Inactivar o Retirar) */}
      {empleadoParaGestionarEstado && (
        <ModalGestionEstadoEmpleado
          empleado={empleadoParaGestionarEstado}
          cargoNombre={getCargoNombre(empleadoParaGestionarEstado.cargoId)}
          onClose={() => setEmpleadoParaGestionarEstado(null)}
          onGuardar={async (empleadoActualizado) => {
            if (onUpdateEmpleado) {
              await onUpdateEmpleado(empleadoActualizado);
            }
          }}
        />
      )}

      {/* Modal de Eliminación de Expediente */}
      {empleadoParaEliminar && (
        <ModalEliminarEmpleado
          empleado={empleadoParaEliminar}
          onClose={() => setEmpleadoParaEliminar(null)}
          onConfirmar={async (id) => {
            if (onDeleteEmpleado) {
              await onDeleteEmpleado(id);
              if (selectedEmpleadoId === id) {
                setSelectedEmpleadoId(null);
              }
            }
          }}
        />
      )}
    </div>
  );
};
