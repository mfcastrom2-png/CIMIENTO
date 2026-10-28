import React, { useState, useMemo, useEffect } from 'react';
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
  Sparkles,
  Printer,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { uid } from '../../data/initialData';
import { DEPARTAMENTOS_COLOMBIA, NIVELES_EDUCATIVOS, ESTADOS_CIVILES } from '../../data/colombiaData';
import { CorporateLogo } from '../CorporateLogo';
import {
  generarTextoNotificacionHojaVidaCompletada,
  despacharNotificacionVinculacion
} from '../../services/vinculacionService';
import {
  buscarCandidatoPreseleccionFB,
  guardarHojaVidaCandidatoFB
} from '../../lib/firebase';

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
  const [candidatoRemoto, setCandidatoRemoto] = useState<Empleado | null>(null);
  const [buscandoCandidatoNube, setBuscandoCandidatoNube] = useState(false);
  const [errorBusquedaNube, setErrorBusquedaNube] = useState<string | null>(null);

  useEffect(() => {
    if (documentoInicial) {
      setDocBusqueda(documentoInicial);
      setDocConsultado(documentoInicial);
    }
  }, [documentoInicial]);

  const candidatoLocal = useMemo(() => {
    if (!docConsultado) return null;
    const docLimpio = docConsultado.trim().replace(/\D/g, '');
    return (
      empleados.find(
        e =>
          e.documento?.replace(/\D/g, '') === docLimpio ||
          e.codigo?.replace(/\D/g, '') === docLimpio ||
          e.persona?.numeroDocumento?.replace(/\D/g, '') === docLimpio
      ) || null
    );
  }, [empleados, docConsultado]);

  const candidato = candidatoLocal || candidatoRemoto;

  useEffect(() => {
    if (!docConsultado) {
      setCandidatoRemoto(null);
      setErrorBusquedaNube(null);
      return;
    }

    if (candidatoLocal) {
      setCandidatoRemoto(null);
      setErrorBusquedaNube(null);
      return;
    }

    let activo = true;
    setBuscandoCandidatoNube(true);
    setErrorBusquedaNube(null);

    buscarCandidatoPreseleccionFB(docConsultado)
      .then(resultado => {
        if (!activo) return;
        setCandidatoRemoto(resultado);
      })
      .catch(err => {
        if (!activo) return;
        console.warn('Error al buscar candidato en la nube:', err);
        setErrorBusquedaNube('No fue posible consultar el servidor.');
      })
      .finally(() => {
        if (activo) setBuscandoCandidatoNube(false);
      });

    return () => {
      activo = false;
    };
  }, [docConsultado, candidatoLocal]);

  // Validar si la persona está en etapa de Pre-selección (habilitada para diligenciar la hoja de vida)
  // o si ya está seleccionada / vinculada (habilitada para ver sus datos registrados)
  const estaEnPreseleccion = Boolean(
    candidato &&
      (
        candidato.vinculacion?.etapaActual === 'pre_seleccion' ||
        candidato.estadoLaboral === 'Pre-selección' ||
        candidato.laboral?.estado === 'Pre-selección'
      ) &&
      candidato.vinculacion?.etapaActual !== 'hoja_vida_completada' &&
      candidato.vinculacion?.etapaActual !== 'pendiente_firma_contrato' &&
      candidato.vinculacion?.etapaActual !== 'contrato_firmado' &&
      candidato.vinculacion?.etapaActual !== 'vinculado_activo' &&
      !candidato.activo &&
      candidato.estadoLaboral !== 'Activo' &&
      candidato.laboral?.estado !== 'Activo'
  );

  const yaEstaSeleccionado = Boolean(candidato && !estaEnPreseleccion);

  // Pestañas del formulario o vista de consulta
  const [tabActual, setTabActual] = useState<'personal' | 'residencia' | 'estudios' | 'experiencia' | 'declaracion'>('personal');

  // Datos personales (SIN datos de prueba falsos)
  const [fechaNacimiento, setFechaNacimiento] = useState(candidato?.persona?.fechaNacimiento || '');
  const [lugarNacimiento, setLugarNacimiento] = useState(candidato?.persona?.lugarNacimiento || '');
  const [genero, setGenero] = useState(
    candidato?.persona?.genero && candidato.persona.genero !== 'No especificado' ? candidato.persona.genero : 'Femenino'
  );
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

  // Formación académica (SIN datos de prueba falsos)
  const [estudios, setEstudios] = useState<EstudioAcademicoEmpleado[]>(() => {
    return candidato?.estudios && candidato.estudios.length > 0 ? candidato.estudios : [];
  });

  // Trayectoria laboral (SIN datos de prueba falsos)
  const [experiencias, setExperiencias] = useState<ExperienciaLaboralEmpleado[]>(() => {
    return candidato?.experiencias && candidato.experiencias.length > 0 ? candidato.experiencias : [];
  });

  // Habeas Data & Declaración Jurada
  const [autorizaHabeasData, setAutorizaHabeasData] = useState(false);
  const [declaraBajoJuramento, setDeclaraBajoJuramento] = useState(false);

  // Estados de interfaz
  const [guardando, setGuardando] = useState(false);
  const [guardadoExitoso, setGuardadoExitoso] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Sincronizar estado cuando se carga o cambia el candidato consultado
  useEffect(() => {
    if (candidato) {
      setFechaNacimiento(candidato.persona?.fechaNacimiento || '');
      setLugarNacimiento(candidato.persona?.lugarNacimiento || '');
      setGenero(
        candidato.persona?.genero && candidato.persona.genero !== 'No especificado'
          ? candidato.persona.genero
          : 'Femenino'
      );
      setEstadoCivil(candidato.persona?.estadoCivil || 'Soltero(a)');
      setNacionalidad(candidato.persona?.nacionalidad || 'Colombiana');
      setRhGrupo('O+');
      setDireccion(
        candidato.contacto?.direccion && candidato.contacto.direccion !== 'Pendiente por candidato'
          ? candidato.contacto.direccion
          : ''
      );
      setBarrio(candidato.contacto?.barrio || '');
      setDepartamento(candidato.contacto?.departamento || 'Bogotá D.C.');
      setCiudad(candidato.contacto?.ciudad || 'Bogotá D.C.');
      setCelular(candidato.contacto?.celular || candidato.telefono || '');
      setCorreoPersonal(candidato.contacto?.correoPersonal || candidato.email || '');
      setContactoEmergenciaNombre(
        candidato.contacto?.contactoEmergenciaNombre && candidato.contacto.contactoEmergenciaNombre !== 'Pendiente por candidato'
          ? candidato.contacto.contactoEmergenciaNombre
          : ''
      );
      setContactoEmergenciaParentesco(candidato.contacto?.contactoEmergenciaParentesco || 'Familiar');
      setContactoEmergenciaTelefono(candidato.contacto?.contactoEmergenciaTelefono || '');
      setEstudios(candidato.estudios || []);
      setExperiencias(candidato.experiencias || []);
      setAutorizaHabeasData(false);
      setDeclaraBajoJuramento(false);
      setErrorValidacion(null);
    }
  }, [candidato]);

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

  // Envío final de Hoja de Vida (solo habilitado para candidatos en pre-selección)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (!candidato) {
      setErrorValidacion('No se encontró el registro del candidato. Verifique su número de documento.');
      return;
    }

    if (!estaEnPreseleccion) {
      setErrorValidacion('Este candidato ya no se encuentra en etapa de Pre-selección. Su hoja de vida ya fue registrada y seleccionada.');
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

      // 1. Guardar de forma directa y garantizada en Firestore
      try {
        await guardarHojaVidaCandidatoFB(empleadoActualizado);
      } catch (errFb) {
        console.warn('Advertencia al guardar hoja de vida en Firestore:', errFb);
      }

      // 2. Notificar actualización en estado React y sincronizar estado remoto
      await onActualizarEmpleado(empleadoActualizado);
      setCandidatoRemoto(empleadoActualizado);

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
        {buscandoCandidatoNube ? (
          /* INDICADOR DE CARGA EN NUBE */
          <div className="max-w-md mx-auto my-12 bg-slate-900 p-8 rounded-2xl border border-purple-500/30 text-center space-y-4 shadow-xl animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/70 text-purple-400 border border-purple-800/50 flex items-center justify-center mx-auto animate-spin">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Validando Registro de Pre-selección</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Consultando el expediente digital asociado al documento <span className="font-mono text-purple-300 font-bold">{docConsultado}</span> en el servidor institucional...
            </p>
          </div>
        ) : !docConsultado ? (
          /* BÚSQUEDA INICIAL DEL ASPIRANTE */
          <div className="max-w-md mx-auto my-12 bg-slate-900 p-6 rounded-2xl border border-slate-800 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-purple-950/60 text-purple-400 border border-purple-800/50 flex items-center justify-center mx-auto">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Consulta de Aspirante en Pre-selección</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ingrese su número de documento de identidad para ingresar al formulario de Hoja de Vida Digital o consultar sus antecedentes registrados.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Número de documento..."
                value={docBusqueda}
                onChange={e => setDocBusqueda(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') setDocConsultado(docBusqueda);
                }}
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
        ) : !candidato ? (
          /* DOCUMENTO NO ENCONTRADO O NO REGISTRADO */
          <div className="max-w-md mx-auto my-12 bg-slate-900 p-6 rounded-2xl border border-rose-800/60 text-center space-y-4 shadow-xl animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 text-rose-400 border border-rose-800/50 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">Aspirante No Registrado</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              El documento ingresado <strong className="font-mono text-rose-300">{docConsultado}</strong> no figura en la base de datos de pre-selección ni en la nómina institucional.
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 text-left space-y-1">
              <p>📌 <strong>Requisito de Acceso:</strong></p>
              <p>
                La Hoja de Vida Digital solo está habilitada para las personas que han sido registradas previamente en el proceso de vinculación laboral por el área de Talento Humano.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDocConsultado('');
                setDocBusqueda('');
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Intentar con otro documento
            </button>
          </div>
        ) : guardadoExitoso ? (
          /* PANTALLA DE ÉXITO TRAS DILIGENCIAR */
          <div className="max-w-xl mx-auto my-12 bg-slate-900 border border-emerald-500/30 rounded-2xl p-8 text-center space-y-5 shadow-2xl animate-fadeIn">
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
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setGuardadoExitoso(false);
                }}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Ver Datos Registrados
              </button>
            </div>
          </div>
        ) : yaEstaSeleccionado ? (
          /* ========================================================================= */
          /* MODO CONSULTA: EMPLEADO QUE YA FUE SELECCIONADO / VINCULADO               */
          /* "un empleado que ya está seleccionado si ingresa debe poder ver los datos */
          /*  registrados en la hoja de vida digital"                                  */
          /* ========================================================================= */
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden animate-fadeIn">
            {/* Header del Colaborador Seleccionado */}
            <div className="p-6 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900 border-b border-emerald-800/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-900/70 text-emerald-300 border border-emerald-600/50">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      {candidato.activo || candidato.laboral?.estado === 'Activo'
                        ? 'Colaborador Activo · Expediente Formalizado'
                        : 'Candidato Seleccionado · Proceso de Vinculación en Curso'}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Cód: {candidato.codigo || candidato.documento}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Hoja de Vida Digital — Datos Registrados
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Colaborador: <strong className="text-white">{candidato.nombre}</strong> · {candidato.persona?.tipoDocumento || candidato.tipoDocumento || 'CC'} {candidato.documento} · Cargo:{' '}
                    <span className="text-[#F59E0B] font-bold">{candidato.laboral?.cargoNombre || 'Colaborador Vinculado'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors shadow-xs"
                    title="Imprimir resumen de Hoja de Vida"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Imprimir Hoja de Vida</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDocConsultado('');
                      setDocBusqueda('');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-700/50 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Consultar otro documento
                  </button>
                </div>
              </div>

              {/* Noticia explicativa */}
              <div className="mt-4 p-3.5 bg-slate-950/70 border border-emerald-800/40 rounded-xl text-xs text-slate-300 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-white">Estado del Proceso:</strong> Usted ya ha superado la etapa de pre-selección y su Hoja de Vida Digital se encuentra formalizada en el expediente de <strong>{nombreEmpresa}</strong>. A continuación puede consultar la totalidad de la información demográfica, de residencia, académica y de experiencia registrada.
                </div>
              </div>

              {/* Barra de pestañas */}
              <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'personal', label: '1. Datos Personales', icon: User },
                  { id: 'residencia', label: '2. Residencia & Contacto', icon: MapPin },
                  { id: 'estudios', label: `3. Formación Académica (${(candidato.estudios || []).length})`, icon: GraduationCap },
                  { id: 'experiencia', label: `4. Experiencia Previa (${(candidato.experiencias || []).length})`, icon: History },
                  { id: 'declaracion', label: '5. Habeas Data & Trazabilidad', icon: ShieldCheck }
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
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
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

            {/* Contenido en Modo Visualización */}
            <div className="p-6 space-y-6 text-xs text-slate-300">
              {/* TAB 1: DATOS PERSONALES */}
              {tabActual === 'personal' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Tipo y Número de Documento</span>
                      <span className="text-white font-mono font-bold text-sm">
                        {candidato.persona?.tipoDocumento || candidato.tipoDocumento || 'CC'} {candidato.documento}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Fecha de Nacimiento</span>
                      <span className="text-white font-bold text-sm font-mono">
                        {candidato.persona?.fechaNacimiento || 'No registrada'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Lugar de Nacimiento</span>
                      <span className="text-white font-bold text-sm">
                        {candidato.persona?.lugarNacimiento || 'No registrado'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Nacionalidad</span>
                      <span className="text-white font-bold text-sm">
                        {candidato.persona?.nacionalidad || 'Colombiana'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Género</span>
                      <span className="text-white font-bold text-sm">
                        {candidato.persona?.genero && candidato.persona.genero !== 'No especificado'
                          ? candidato.persona.genero
                          : 'No especificado'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Estado Civil</span>
                      <span className="text-white font-bold text-sm">
                        {candidato.persona?.estadoCivil || 'Soltero(a)'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: RESIDENCIA Y CONTACTO */}
              {tabActual === 'residencia' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl sm:col-span-2 space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Dirección de Residencia</span>
                      <span className="text-white font-bold text-sm">
                        {candidato.contacto?.direccion && candidato.contacto.direccion !== 'Pendiente por candidato'
                          ? candidato.contacto.direccion
                          : 'No especificada'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Barrio</span>
                      <span className="text-white font-bold text-sm">
                        {candidato.contacto?.barrio || 'No especificado'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Ciudad / Municipio</span>
                      <span className="text-white font-bold text-sm">
                        {candidato.contacto?.ciudad || 'Bogotá D.C.'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Departamento</span>
                      <span className="text-white font-bold text-sm">
                        {candidato.contacto?.departamento || 'Bogotá D.C.'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Celular de Contacto</span>
                      <span className="text-white font-mono font-bold text-sm">
                        {candidato.contacto?.celular || candidato.telefono || 'No registrado'}
                      </span>
                    </div>
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl sm:col-span-3 space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold">Correo Electrónico Personal</span>
                      <span className="text-white font-bold text-sm">
                        {candidato.contacto?.correoPersonal || candidato.email || 'No registrado'}
                      </span>
                    </div>
                  </div>

                  {/* Contacto de Emergencia */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                    <h3 className="font-bold text-sm text-[#F59E0B] flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>Contacto en Caso de Emergencia (Decreto 1072 de 2015)</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-2.5 bg-slate-900 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Nombre del Contacto</span>
                        <span className="text-white font-semibold">
                          {candidato.contacto?.contactoEmergenciaNombre || 'No registrado'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Parentesco</span>
                        <span className="text-white font-semibold">
                          {candidato.contacto?.contactoEmergenciaParentesco || 'No registrado'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Teléfono de Emergencia</span>
                        <span className="text-white font-mono font-semibold">
                          {candidato.contacto?.contactoEmergenciaTelefono || 'No registrado'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FORMACIÓN ACADÉMICA */}
              {tabActual === 'estudios' && (
                <div className="space-y-3 animate-fadeIn">
                  {(candidato.estudios || []).length > 0 ? (
                    (candidato.estudios || []).map((est, idx) => (
                      <div key={est.id || idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-emerald-400 text-sm">
                            {est.tituloObtenido || est.programa}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            {est.nivelEducativo || 'Estudio'} · {est.estado || 'Graduado'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <p><strong className="text-slate-400">Institución:</strong> <span className="text-white">{est.institucion}</span></p>
                          {est.fechaGraduacion && (
                            <p><strong className="text-slate-400">Fecha de Graduación:</strong> <span className="text-white font-mono">{est.fechaGraduacion}</span></p>
                          )}
                          {est.tarjetaProfesional && (
                            <p><strong className="text-slate-400">Tarjeta Profesional:</strong> <span className="text-white font-mono">{est.tarjetaProfesional}</span></p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 bg-slate-950/60 border border-dashed border-slate-800 rounded-xl text-center space-y-1">
                      <GraduationCap className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="text-slate-300 font-semibold">Sin formación adicional registrada en el formulario digital.</p>
                      <p className="text-slate-500 text-[11px]">Perfil base: {candidato.formacion || 'Bachiller / Técnico'}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: EXPERIENCIA LABORAL */}
              {tabActual === 'experiencia' && (
                <div className="space-y-3 animate-fadeIn">
                  {(candidato.experiencias || []).length > 0 ? (
                    (candidato.experiencias || []).map((exp, idx) => (
                      <div key={exp.id || idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-white text-sm">{exp.cargo}</span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            {exp.fechaIngreso} — {exp.fechaRetiro || 'Actual'}
                          </span>
                        </div>
                        <p><strong className="text-slate-400">Empresa / Empleador:</strong> <span className="text-emerald-400 font-semibold">{exp.empresa}</span></p>
                        {exp.funcionesPrincipales && (
                          <p className="text-slate-300 leading-relaxed text-xs pt-1">
                            <strong className="text-slate-400">Funciones:</strong> {exp.funcionesPrincipales}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-6 bg-slate-950/60 border border-dashed border-slate-800 rounded-xl text-center space-y-1">
                      <History className="w-8 h-8 text-slate-500 mx-auto" />
                      <p className="text-slate-300 font-semibold">Sin trayectoria previa adicional registrada en el formulario digital.</p>
                      <p className="text-slate-500 text-[11px]">Trayectoria base: {candidato.experiencia || 'No especificada'}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: HABEAS DATA & TRAZABILIDAD */}
              {tabActual === 'declaracion' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                    <span className="font-bold text-emerald-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Tratamiento de Datos Personales & Declaración Juramentada</span>
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      El colaborador autorizó formalmente el tratamiento de sus datos personales conforme a la <strong>Ley 1581 de 2012</strong> y declaró la veracidad de la información conforme al <strong>Art. 62 del Código Sustantivo del Trabajo (CST)</strong>.
                    </p>
                    <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono space-y-1">
                      <p>• Fecha de Radicación: {candidato.vinculacion?.fechaHojaVidaCompletada ? new Date(candidato.vinculacion.fechaHojaVidaCompletada).toLocaleString('es-CO') : 'Formalizado en sistema'}</p>
                      <p>• Etapa del Expediente: {candidato.vinculacion?.etapaActual || 'vinculado_activo'}</p>
                      <p>• Estado de Contratación: {candidato.activo ? 'ACTIVO' : 'EN VINCULACIÓN'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* MODO FORMULARIO: ASPIRANTE EN PRE-SELECCIÓN (HABILITADO)                   */
          /* "solo esté habilitada para las personas que se registran en esta de        */
          /*  preselección"                                                             */
          /* ========================================================================= */
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden animate-fadeIn">
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

                <button
                  type="button"
                  onClick={() => {
                    setDocConsultado('');
                    setDocBusqueda('');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold self-start sm:self-auto cursor-pointer"
                >
                  Consultar otro documento
                </button>
              </div>

              {/* Barra de pestañas */}
              <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'personal', label: '1. Datos Personales', icon: User },
                  { id: 'residencia', label: '2. Residencia & Contacto', icon: MapPin },
                  { id: 'estudios', label: `3. Formación Académica (${estudios.length})`, icon: GraduationCap },
                  { id: 'experiencia', label: `4. Experiencia Laboral (${experiencias.length})`, icon: History },
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
                        placeholder="Ej. Bogotá D.C."
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
                        <option value="Femenino">Femenino</option>
                        <option value="Masculino">Masculino</option>
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
                        placeholder="300 123 4567"
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
                        placeholder="aspirante@ejemplo.com"
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
                          placeholder="Nombre del familiar o allegado"
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
                          placeholder="300 000 0000"
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
                      className="px-4 py-2 border border-slate-700 rounded-xl text-slate-400 hover:text-white cursor-pointer"
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

                  {estudios.length === 0 && (
                    <div className="p-8 bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl text-center space-y-2">
                      <GraduationCap className="w-8 h-8 text-purple-400 mx-auto" />
                      <p className="text-slate-300 font-semibold text-xs">No hay títulos académicos agregados aún.</p>
                      <p className="text-slate-500 text-[11px]">Haga clic en el botón para registrar su formación académica.</p>
                      <button
                        type="button"
                        onClick={handleAddEstudio}
                        className="mt-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Formación Académica</span>
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {estudios.map((est, idx) => (
                      <div key={est.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-purple-400">Título / Estudio #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEstudio(est.id)}
                            className="text-rose-400 hover:text-rose-300 font-bold p-1 cursor-pointer"
                            title="Eliminar este estudio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
                              placeholder="Ej. Bachiller Académico, Técnico en Sistemas..."
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
                              placeholder="Ej. Colegio / Universidad / SENA"
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
                      className="px-4 py-2 border border-slate-700 rounded-xl text-slate-400 hover:text-white cursor-pointer"
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
                    <p className="text-slate-400">Registre sus empleos o contratos anteriores más relevantes (si aplica):</p>
                    <button
                      type="button"
                      onClick={handleAddExperiencia}
                      className="px-3 py-1.5 bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700 rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Experiencia</span>
                    </button>
                  </div>

                  {experiencias.length === 0 && (
                    <div className="p-8 bg-slate-950/60 border border-dashed border-slate-800 rounded-2xl text-center space-y-2">
                      <History className="w-8 h-8 text-purple-400 mx-auto" />
                      <p className="text-slate-300 font-semibold text-xs">No hay experiencia previa registrada.</p>
                      <p className="text-slate-500 text-[11px]">Si cuenta con experiencia laboral previa, haga clic en el botón para agregarla.</p>
                      <button
                        type="button"
                        onClick={handleAddExperiencia}
                        className="mt-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Agregar Experiencia Laboral</span>
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {experiencias.map((exp, idx) => (
                      <div key={exp.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="font-bold text-purple-400">Experiencia Laboral #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExperiencia(exp.id)}
                            className="text-rose-400 hover:text-rose-300 font-bold p-1 cursor-pointer"
                            title="Eliminar esta experiencia"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-400 mb-1">Empresa / Empleador *</label>
                            <input
                              type="text"
                              required
                              placeholder="Nombre de la empresa"
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
                              placeholder="Ej. Auxiliar, Técnico, Asesor..."
                              value={exp.cargo}
                              onChange={e => handleUpdateExperiencia(exp.id, 'cargo', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">Fecha de Ingreso</label>
                            <input
                              type="date"
                              value={exp.fechaIngreso}
                              onChange={e => handleUpdateExperiencia(exp.id, 'fechaIngreso', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">Fecha de Retiro</label>
                            <input
                              type="date"
                              value={exp.fechaRetiro}
                              onChange={e => handleUpdateExperiencia(exp.id, 'fechaRetiro', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-slate-400 mb-1">Funciones Principales</label>
                            <textarea
                              rows={2}
                              placeholder="Breve resumen de responsabilidades desempeñadas..."
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
                      className="px-4 py-2 border border-slate-700 rounded-xl text-slate-400 hover:text-white cursor-pointer"
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
                      className="px-4 py-2 border border-slate-700 rounded-xl text-slate-400 hover:text-white cursor-pointer"
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
