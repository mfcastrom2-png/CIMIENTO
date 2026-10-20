import React, { useState, useMemo } from 'react';
import {
  Empleado,
  ConfiguracionEmpresa,
  EstudioAcademicoEmpleado,
  ExperienciaLaboralEmpleado,
  NotificacionVinculacion
} from '../../types';
import {
  FileText,
  User,
  MapPin,
  GraduationCap,
  History,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ArrowRight,
  Send,
  Download,
  Lock,
  Phone,
  Mail,
  Calendar,
  Sparkles
} from 'lucide-react';
import { uid } from '../../data/initialData';
import { DEPARTAMENTOS_COLOMBIA, NIVELES_EDUCATIVOS, ESTADOS_CIVILES } from '../../data/colombiaData';
import { CorporateLogo } from '../CorporateLogo';
import {
  generarTextoNotificacionHojaVidaCompletada,
  despacharNotificacionVinculacion
} from '../../services/vinculacionService';

interface PortalCandidatoPublicoViewProps {
  empleados: Empleado[];
  documentoInicial?: string;
  empresa?: ConfiguracionEmpresa;
  onActualizarEmpleado: (empleado: Empleado) => Promise<void> | void;
  onIrALogin?: () => void;
}

export const PortalCandidatoPublicoView: React.FC<PortalCandidatoPublicoViewProps> = ({
  empleados,
  documentoInicial = '',
  empresa,
  onActualizarEmpleado,
  onIrALogin
}) => {
  const [docBusqueda, setDocBusqueda] = useState(documentoInicial);
  const [docConsultado, setDocConsultado] = useState(documentoInicial);

  const candidato = useMemo(() => {
    if (!docConsultado) return null;
    const docLimpio = docConsultado.trim().replace(/\D/g, '');
    return empleados.find(
      e =>
        e.documento?.replace(/\D/g, '') === docLimpio ||
        e.codigo?.replace(/\D/g, '') === docLimpio ||
        e.persona?.numeroDocumento?.replace(/\D/g, '') === docLimpio
    ) || null;
  }, [empleados, docConsultado]);

  // Pestañas del formulario
  const [tabActual, setTabActual] = useState<'personal' | 'residencia' | 'estudios' | 'experiencia' | 'declaracion'>('personal');

  // Datos personales
  const [fechaNacimiento, setFechaNacimiento] = useState(candidato?.persona?.fechaNacimiento || '1995-05-15');
  const [lugarNacimiento, setLugarNacimiento] = useState(candidato?.persona?.lugarNacimiento || 'Bogotá D.C.');
  const [genero, setGenero] = useState(candidato?.persona?.genero || 'Masculino');
  const [estadoCivil, setEstadoCivil] = useState(candidato?.persona?.estadoCivil || 'Soltero(a)');
  const [nacionalidad, setNacionalidad] = useState(candidato?.persona?.nacionalidad || 'Colombiana');
  const [rhGrupo, setRhGrupo] = useState('O+');

  // Residencia y contacto
  const [direccion, setDireccion] = useState(
    candidato?.contacto?.direccion && candidato.contacto.direccion !== 'Pendiente por candidato'
      ? candidato.contacto.direccion
      : ''
  );
  const [barrio, setBarrio] = useState(candidato?.contacto?.barrio || '');
  const [departamento, setDepartamento] = useState(candidato?.contacto?.departamento || 'Bogotá D.C.');
  const [ciudad, setCiudad] = useState(candidato?.contacto?.ciudad || 'Bogotá D.C.');
  const [celular, setCelular] = useState(candidato?.contacto?.celular || candidato?.telefono || '');
  const [correoPersonal, setCorreoPersonal] = useState(candidato?.contacto?.correoPersonal || candidato?.email || '');

  // Contacto de emergencia
  const [contactoEmergenciaNombre, setContactoEmergenciaNombre] = useState(
    candidato?.contacto?.contactoEmergenciaNombre && candidato.contacto.contactoEmergenciaNombre !== 'Pendiente por candidato'
      ? candidato.contacto.contactoEmergenciaNombre
      : ''
  );
  const [contactoEmergenciaParentesco, setContactoEmergenciaParentesco] = useState(
    candidato?.contacto?.contactoEmergenciaParentesco || 'Familiar'
  );
  const [contactoEmergenciaTelefono, setContactoEmergenciaTelefono] = useState(
    candidato?.contacto?.contactoEmergenciaTelefono || ''
  );

  // Formación académica
  const [estudios, setEstudios] = useState<EstudioAcademicoEmpleado[]>(() => {
    if (candidato?.estudios && candidato.estudios.length > 0) return candidato.estudios;
    return [
      {
        id: uid(),
        nivelEducativo: 'Tecnólogo',
        programa: 'Redes y Telecomunicaciones',
        tituloObtenido: 'Tecnólogo en Redes y Telecomunicaciones',
        institucion: 'SENA',
        fechaInicio: '2019-02-01',
        fechaFin: '2021-11-20',
        fechaGraduacion: '2021-11-20',
        estado: 'Graduado',
        tarjetaProfesional: ''
      }
    ];
  });

  // Trayectoria laboral
  const [experiencias, setExperiencias] = useState<ExperienciaLaboralEmpleado[]>(() => {
    if (candidato?.experiencias && candidato.experiencias.length > 0) return candidato.experiencias;
    return [
      {
        id: uid(),
        empresa: 'Soluciones Ópticas SAS',
        cargo: 'Técnico de Conectividad',
        fechaIngreso: '2022-01-15',
        fechaRetiro: '2025-12-20',
        funcionesPrincipales: 'Instalación de acometidas de fibra óptica y pruebas de reflectometría.'
      }
    ];
  });

  // Habeas Data & Declaración Jurada
  const [autorizaHabeasData, setAutorizaHabeasData] = useState(false);
  const [declaraBajoJuramento, setDeclaraBajoJuramento] = useState(false);

  // Estados de interfaz
  const [guardando, setGuardando] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const nombreEmpresa = empresa?.razonSocial || empresa?.nombreComercial || 'B GROUP INGENIERIA S.A.S.';
  const nitEmpresa = empresa?.nit ? `NIT: ${empresa.nit}` : 'NIT: 900.995.99-2';

  // Manejo de estudios
  const handleAddEstudio = () => {
    setEstudios(prev => [
      ...prev,
      {
        id: uid(),
        nivelEducativo: 'Profesional',
        programa: '',
        tituloObtenido: '',
        institucion: '',
        fechaInicio: '',
        fechaFin: '',
        fechaGraduacion: '',
        estado: 'Graduado'
      }
    ]);
  };

  const handleUpdateEstudio = (id: string, campo: keyof EstudioAcademicoEmpleado, valor: any) => {
    setEstudios(prev => prev.map(e => (e.id === id ? { ...e, [campo]: valor } : e)));
  };

  const handleRemoveEstudio = (id: string) => {
    setEstudios(prev => prev.filter(e => e.id !== id));
  };

  // Manejo de experiencias
  const handleAddExperiencia = () => {
    setExperiencias(prev => [
      ...prev,
      {
        id: uid(),
        empresa: '',
        cargo: '',
        fechaIngreso: '',
        fechaRetiro: '',
        funcionesPrincipales: ''
      }
    ]);
  };

  const handleUpdateExperiencia = (id: string, campo: keyof ExperienciaLaboralEmpleado, valor: any) => {
    setExperiencias(prev => prev.map(e => (e.id === id ? { ...e, [campo]: valor } : e)));
  };

  const handleRemoveExperiencia = (id: string) => {
    setExperiencias(prev => prev.filter(e => e.id !== id));
  };

  // Envío final de Hoja de Vida
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (!candidato) {
      setErrorValidacion('No se encontró el registro del candidato. Verifique su número de documento.');
      return;
    }

    if (!direccion.trim()) {
      setErrorValidacion('Debe ingresar su dirección de residencia.');
      setTabActual('residencia');
      return;
    }

    if (!celular.trim() || celular.replace(/\D/g, '').length < 10) {
      setErrorValidacion('Debe ingresar un número de celular de contacto válido (mínimo 10 dígitos).');
      setTabActual('residencia');
      return;
    }

    if (!contactoEmergenciaNombre.trim() || !contactoEmergenciaTelefono.trim()) {
      setErrorValidacion('Debe diligenciar los datos completos del contacto de emergencia.');
      setTabActual('residencia');
      return;
    }

    if (estudios.length === 0 || !estudios[0].tituloObtenido.trim()) {
      setErrorValidacion('Debe registrar al menos un título o estudio académico.');
      setTabActual('estudios');
      return;
    }

    if (!autorizaHabeasData || !declaraBajoJuramento) {
      setErrorValidacion('Debe autorizar el tratamiento de datos personales y declarar la veracidad de la información.');
      setTabActual('declaracion');
      return;
    }

    setGuardando(true);
    try {
      const fechaHoy = new Date().toISOString();

      // Generar notificación institucional para el Administrador de Gestión Humana
      const notifGHInfo = generarTextoNotificacionHojaVidaCompletada({
        candidatoNombre: candidato.nombre,
        candidatoDocumento: candidato.documento,
        cargoNombre: candidato.laboral?.cargoNombre
      });

      const emailDestinoGH =
        (empresa?.contacto as any)?.emailCorporativo ||
        (empresa?.contacto as any)?.emailContactoGH ||
        'gh@bgroup.com.co';

      const notifParaAdmin: NotificacionVinculacion = {
        id: uid(),
        fecha: fechaHoy,
        destinatario: 'administrador_gh',
        destinatarioNombre: 'Administrador de Gestión Humana',
        destinatarioEmail: emailDestinoGH,
        tipo: 'hoja_vida_enviada',
        asunto: notifGHInfo.asunto,
        mensaje: notifGHInfo.cuerpo,
        leido: false,
        canal: 'Correo'
      };

      const notificacionesActualizadas = [
        notifParaAdmin,
        ...(candidato.vinculacion?.notificaciones || [])
      ];

      const empleadoActualizado: Empleado = {
        ...candidato,
        formacion: estudios[0]?.tituloObtenido || candidato.formacion,
        experiencia: experiencias.map(ex => `${ex.cargo} en ${ex.empresa}`).join(' • ') || candidato.experiencia,
        email: correoPersonal.trim().toLowerCase() || candidato.email,
        telefono: celular.trim() || candidato.telefono,
        persona: {
          ...(candidato.persona || {
            tipoDocumento: candidato.tipoDocumento || 'CC',
            numeroDocumento: candidato.documento,
            primerNombre: candidato.nombre.split(' ')[0] || 'Candidato',
            primerApellido: candidato.nombre.split(' ')[1] || 'Postulado',
            nacionalidad: 'Colombiana'
          }),
          fechaNacimiento,
          lugarNacimiento,
          genero,
          estadoCivil,
          nacionalidad
        },
        contacto: {
          ...(candidato.contacto || {}),
          direccion: direccion.trim(),
          barrio: barrio.trim(),
          departamento,
          ciudad,
          celular: celular.trim(),
          correoPersonal: correoPersonal.trim().toLowerCase(),
          contactoEmergenciaNombre: contactoEmergenciaNombre.trim(),
          contactoEmergenciaParentesco: contactoEmergenciaParentesco.trim(),
          contactoEmergenciaTelefono: contactoEmergenciaTelefono.trim()
        },
        estudios,
        experiencias,
        vinculacion: {
          ...(candidato.vinculacion || {
            fechaRegistroCandidato: fechaHoy,
            elementosExpedientePendientes: {
              afiliacionEps: false,
              afiliacionPension: false,
              afiliacionArl: false,
              afiliacionCaja: false,
              examenIngresoSst: false,
              dotacionEpp: false,
              creacionUsuario: false
            }
          }),
          etapaActual: 'hoja_vida_completada',
          fechaHojaVidaCompletada: fechaHoy,
          notificaciones: notificacionesActualizadas
        },
        historialLaboral: [
          {
            id: uid(),
            fechaHora: new Date().toLocaleString('es-CO'),
            usuario: candidato.nombre,
            accion: 'CAMBIO_DATOS',
            titulo: 'Hoja de Vida Digital Diligenciada por el Candidato',
            motivo: 'Diligenciamiento autónomo en el portal institucional (Decreto 1072/2015 y Ley 1581/2012).',
            valorNuevo: `Estado del flujo: hoja_vida_completada. ${estudios.length} títulos, ${experiencias.length} experiencias registradas.`
          },
          ...(candidato.historialLaboral || [])
        ]
      };

      await onActualizarEmpleado(empleadoActualizado);

      // Despachar notificación al correo de Gestión Humana
      try {
        await despacharNotificacionVinculacion({
          destinatarioEmail: notifParaAdmin.destinatarioEmail,
          destinatarioNombre: notifParaAdmin.destinatarioNombre,
          asunto: notifParaAdmin.asunto,
          cuerpo: notifParaAdmin.mensaje,
          tipo: 'hoja_vida_enviada'
        });
      } catch (errCorreo) {
        console.warn('Aviso de notificación GH:', errCorreo);
      }

      setGuardadoExitoso(true);
    } catch (err: any) {
      console.error('Error al guardar hoja de vida:', err);
      setErrorValidacion(err?.message || 'Ocurrió un error al procesar el envío de su hoja de vida.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 font-sans">
      {/* Cabecera Corporativa */}
      <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sm:px-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CorporateLogo size="md" showTextFallback={false} />
            <div>
              <h1 className="text-base font-black text-white tracking-tight">{nombreEmpresa}</h1>
              <p className="text-[11px] font-mono text-[#F59E0B]">{nitEmpresa} · Portal de Vinculación y Selección</p>
            </div>
          </div>
          {onIrALogin && (
            <button
              onClick={onIrALogin}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold transition-colors cursor-pointer"
            >
              Acceso Funcionarios
            </button>
          )}
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {!candidato ? (
          <div className="max-w-md mx-auto my-12 bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/60 text-purple-400 border border-purple-800/50 flex items-center justify-center mx-auto">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Consulta de Candidato</h2>
            <p className="text-xs text-slate-400">
              Ingrese su número de documento de identidad (Cédula de Ciudadanía, CE o Pasaporte) para acceder a su formulario de Hoja de Vida.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Número de documento..."
                value={docBusqueda}
                onChange={e => setDocBusqueda(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white text-center focus:outline-hidden focus:border-purple-500"
              />
              <button
                type="button"
                onClick={() => setDocConsultado(docBusqueda)}
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Continuar al Formulario
              </button>
            </div>
          </div>
        ) : guardadoExitoso ? (
          <div className="max-w-xl mx-auto my-12 bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-700/50 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">¡Hoja de Vida Enviada Exitosamente!</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Estimado(a) <strong>{candidato.nombre}</strong>, su Hoja de Vida institucional ha quedado debidamente radicada en el sistema de Talento Humano de <strong>{nombreEmpresa}</strong>.
              </p>
            </div>
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-left text-xs text-slate-300 space-y-2 font-mono">
              <p><strong>Candidato:</strong> {candidato.nombre}</p>
              <p><strong>Documento:</strong> {candidato.documento}</p>
              <p><strong>Cargo Postulado:</strong> {candidato.laboral?.cargoNombre || 'Colaborador'}</p>
              <p><strong>Fecha y Hora de Envío:</strong> {new Date().toLocaleString('es-CO')}</p>
              <p className="text-emerald-400"><strong>Estado:</strong> Hoja de Vida Completada — Etapa 2 de Vinculación</p>
            </div>
            <div className="p-3 bg-purple-950/40 border border-purple-800/40 rounded-xl text-xs text-purple-200">
              <Sparkles className="w-4 h-4 inline mr-1 text-[#F59E0B]" />
              El equipo de Selección y Contratación revisará su información para formalizar la asignación salarial y remitirle a este mismo correo el <strong>Contrato Individual de Trabajo para su firma digital</strong> (Ley 527 de 1999).
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
            {/* Header del Formulario */}
            <div className="p-6 bg-gradient-to-r from-purple-950/80 via-slate-900 to-slate-900 border-b border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-900/60 text-purple-300 border border-purple-700/50 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                    Proceso de Vinculación Laboral · Etapa 1: Pre-selección
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Hoja de Vida Digital del Aspirante
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Candidato: <strong>{candidato.nombre}</strong> · {candidato.tipoDocumento || 'CC'} {candidato.documento} · Postulado a:{' '}
                    <span className="text-[#F59E0B] font-bold">{candidato.laboral?.cargoNombre || 'Cargo Asignado'}</span>
                  </p>
                </div>
              </div>

              {/* Barra de pestañas */}
              <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'personal', label: '1. Datos Personales', icon: User },
                  { id: 'residencia', label: '2. Residencia & Contacto', icon: MapPin },
                  { id: 'estudios', label: '3. Formación Académica', icon: GraduationCap },
                  { id: 'experiencia', label: '4. Experiencia Laboral', icon: History },
                  { id: 'declaracion', label: '5. Habeas Data & Firma', icon: ShieldCheck }
                ].map(t => {
                  const Icon = t.icon;
                  const isActive = tabActual === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTabActual(t.id as any)}
                      className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                          : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs text-slate-300">
              {errorValidacion && (
                <div className="p-4 bg-rose-950/60 border border-rose-800 text-rose-200 rounded-xl flex items-center gap-2.5 animate-fadeIn">
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                  <span className="font-semibold">{errorValidacion}</span>
                </div>
              )}

              {/* SECCIÓN 1: DATOS PERSONALES */}
              {tabActual === 'personal' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Fecha de Nacimiento *</label>
                      <input
                        type="date"
                        required
                        value={fechaNacimiento}
                        onChange={e => setFechaNacimiento(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Lugar de Nacimiento *</label>
                      <input
                        type="text"
                        required
                        value={lugarNacimiento}
                        onChange={e => setLugarNacimiento(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Nacionalidad *</label>
                      <input
                        type="text"
                        required
                        value={nacionalidad}
                        onChange={e => setNacionalidad(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Género *</label>
                      <select
                        value={genero}
                        onChange={e => setGenero(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      >
                        <option value="Masculino">Masculino</option>
                        <option value="Femenino">Femenino</option>
                        <option value="No binario">No binario</option>
                        <option value="Prefiero no decir">Prefiero no decir</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Estado Civil *</label>
                      <select
                        value={estadoCivil}
                        onChange={e => setEstadoCivil(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      >
                        {ESTADOS_CIVILES.map(ec => (
                          <option key={ec} value={ec}>{ec}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Grupo Sanguíneo y RH *</label>
                      <select
                        value={rhGrupo}
                        onChange={e => setRhGrupo(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                      >
                        {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => setTabActual('residencia')}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>Siguiente: Residencia & Contacto</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* SECCIÓN 2: RESIDENCIA Y CONTACTO */}
              {tabActual === 'residencia' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-300 mb-1">Dirección de Residencia Actual *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Calle 100 # 19-61 Apto 402"
                        value={direccion}
                        onChange={e => setDireccion(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Barrio *</label>
                      <input
                        type="text"
                        placeholder="Ej. Chico Norte"
                        value={barrio}
                        onChange={e => setBarrio(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Departamento *</label>
                      <select
                        value={departamento}
                        onChange={e => {
                          setDepartamento(e.target.value);
                          const dep = DEPARTAMENTOS_COLOMBIA.find(d => d.nombre === e.target.value);
                          if (dep && dep.municipios && dep.municipios.length > 0) {
                            setCiudad(dep.municipios[0]);
                          }
                        }}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      >
                        {DEPARTAMENTOS_COLOMBIA.map(d => (
                          <option key={d.nombre} value={d.nombre}>{d.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Ciudad / Municipio *</label>
                      <input
                        type="text"
                        required
                        value={ciudad}
                        onChange={e => setCiudad(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-300 mb-1">Celular de Contacto *</label>
                      <input
                        type="tel"
                        required
                        value={celular}
                        onChange={e => setCelular(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-bold text-slate-300 mb-1">Correo Electrónico Personal *</label>
                      <input
                        type="email"
                        required
                        value={correoPersonal}
                        onChange={e => setCorreoPersonal(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                      />
                    </div>
                  </div>

                  {/* Contacto de Emergencia */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                    <h3 className="font-bold text-sm text-[#F59E0B] flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>Contacto en Caso de Emergencia (Obligatorio Decreto 1072/2015)</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Nombre Completo *</label>
                        <input
                          type="text"
                          required
                          value={contactoEmergenciaNombre}
                          onChange={e => setContactoEmergenciaNombre(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Parentesco *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej. Cónyuge, Madre, Hermano"
                          value={contactoEmergenciaParentesco}
                          onChange={e => setContactoEmergenciaParentesco(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-300 mb-1">Teléfono / Celular *</label>
                        <input
                          type="tel"
                          required
                          value={contactoEmergenciaTelefono}
                          onChange={e => setContactoEmergenciaTelefono(e.target.value)}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setTabActual('personal')}
                      className="px-4 py-2 border border-slate-700 rounded-xl text-slate-400 hover:text-white"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => setTabActual('estudios')}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>Siguiente: Formación Académica</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* SECCIÓN 3: FORMACIÓN ACADÉMICA */}
              {tabActual === 'estudios' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-400">Registre sus títulos de bachillerato, técnicos, tecnológicos o universitarios:</p>
                    <button
                      type="button"
                      onClick={handleAddEstudio}
                      className="px-3 py-1.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Título</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {estudios.map((est, idx) => (
                      <div key={est.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-purple-400">Título / Estudio #{idx + 1}</span>
                          {estudios.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveEstudio(est.id)}
                              className="text-rose-400 hover:text-rose-300 font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-slate-400 mb-1">Nivel Educativo</label>
                            <select
                              value={est.nivelEducativo}
                              onChange={e => handleUpdateEstudio(est.id, 'nivelEducativo', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                            >
                              {NIVELES_EDUCATIVOS.map(ne => (
                                <option key={ne} value={ne}>{ne}</option>
                              ))}
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-slate-400 mb-1">Título Obtenido / Carrera *</label>
                            <input
                              type="text"
                              required
                              value={est.tituloObtenido}
                              onChange={e => handleUpdateEstudio(est.id, 'tituloObtenido', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-slate-400 mb-1">Institución Educativa *</label>
                            <input
                              type="text"
                              required
                              value={est.institucion}
                              onChange={e => handleUpdateEstudio(est.id, 'institucion', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 mb-1">Fecha de Graduación</label>
                            <input
                              type="date"
                              value={est.fechaGraduacion || ''}
                              onChange={e => handleUpdateEstudio(est.id, 'fechaGraduacion', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setTabActual('residencia')}
                      className="px-4 py-2 border border-slate-700 rounded-xl text-slate-400 hover:text-white"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => setTabActual('experiencia')}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>Siguiente: Experiencia Laboral</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* SECCIÓN 4: EXPERIENCIA LABORAL */}
              {tabActual === 'experiencia' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <p className="text-slate-400">Registre sus empleos o contratos anteriores más relevantes:</p>
                    <button
                      type="button"
                      onClick={handleAddExperiencia}
                      className="px-3 py-1.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Experiencia</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {experiencias.map((exp, idx) => (
                      <div key={exp.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-purple-400">Experiencia Laboral #{idx + 1}</span>
                          {experiencias.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveExperiencia(exp.id)}
                              className="text-rose-400 hover:text-rose-300 font-bold"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-400 mb-1">Empresa / Razón Social *</label>
                            <input
                              type="text"
                              required
                              value={exp.empresa}
                              onChange={e => handleUpdateExperiencia(exp.id, 'empresa', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 mb-1">Cargo Desempeñado *</label>
                            <input
                              type="text"
                              required
                              value={exp.cargo}
                              onChange={e => handleUpdateExperiencia(exp.id, 'cargo', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-slate-400 mb-1">Funciones Principales</label>
                            <textarea
                              rows={2}
                              value={exp.funcionesPrincipales}
                              onChange={e => handleUpdateExperiencia(exp.id, 'funcionesPrincipales', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setTabActual('estudios')}
                      className="px-4 py-2 border border-slate-700 rounded-xl text-slate-400 hover:text-white"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => setTabActual('declaracion')}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>Siguiente: Habeas Data & Firma</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* SECCIÓN 5: DECLARACIÓN Y ENVÍO */}
              {tabActual === 'declaracion' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                    <h3 className="font-bold text-sm text-[#F59E0B] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Autorización de Datos Personales y Declaración Jurada</span>
                    </h3>

                    <label className="flex items-start gap-2.5 text-xs text-slate-300 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        required
                        checked={autorizaHabeasData}
                        onChange={e => setAutorizaHabeasData(e.target.checked)}
                        className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>
                        Autorizo de manera libre, previa, expresa e informada a <strong>{nombreEmpresa}</strong> para recolectar, almacenar y tratar mis datos personales y sensibles suministrados en esta Hoja de Vida, exclusivamente con fines de selección, verificación de referencias, vinculación laboral y afiliación al Sistema de Seguridad Social Integral conforme a la <strong>Ley 1581 de 2012</strong> y el Decreto 1377 de 2013.
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 text-xs text-slate-300 font-semibold cursor-pointer pt-2 border-t border-slate-800">
                      <input
                        type="checkbox"
                        required
                        checked={declaraBajoJuramento}
                        onChange={e => setDeclaraBajoJuramento(e.target.checked)}
                        className="mt-0.5 rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>
                        Declaro bajo la gravedad del juramento que toda la información consignada en esta Hoja de Vida es verídica, fidedigna y susceptible de comprobación. Comprendo que cualquier falsedad u omisión facultará a la empresa para terminar el proceso de vinculación o el contrato de trabajo con justa causa conforme al <strong>Art. 62 del Código Sustantivo del Trabajo (CST)</strong>.
                      </span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <button
                      type="button"
                      onClick={() => setTabActual('experiencia')}
                      className="px-4 py-2 border border-slate-700 rounded-xl text-slate-400 hover:text-white"
                    >
                      Anterior
                    </button>
                    <button
                      type="submit"
                      disabled={guardando || !autorizaHabeasData || !declaraBajoJuramento}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl flex items-center gap-2 shadow-lg shadow-purple-900/40 cursor-pointer disabled:opacity-50 transition-all text-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span>{guardando ? 'Enviando Hoja de Vida...' : 'Guardar y Radicar Hoja de Vida Digital'}</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </main>

      {/* Pie de Página */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3 text-center text-[11px] text-slate-500">
        Plataforma Institucional de Gestión del Talento Humano · {nombreEmpresa} · Cumplimiento CST, Dec. 1072/2015 y Ley 1581/2012
      </footer>
    </div>
  );
};
