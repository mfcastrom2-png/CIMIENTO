import React, { useState } from 'react';
import {
  Empleado,
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
  X,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Phone,
  Printer,
  Edit,
  ArrowRight
} from 'lucide-react';
import { uid } from '../../data/initialData';
import { DEPARTAMENTOS_COLOMBIA, NIVELES_EDUCATIVOS, ESTADOS_CIVILES } from '../../data/colombiaData';
import { generarTextoNotificacionHojaVidaCompletada } from '../../services/vinculacionService';

interface ModalDiligenciarHojaVidaProps {
  empleado: Empleado;
  onClose: () => void;
  onGuardarHojaVida: (empleadoActualizado: Empleado) => Promise<void> | void;
  esVistaCandidato?: boolean;
}

export const ModalDiligenciarHojaVida: React.FC<ModalDiligenciarHojaVidaProps> = ({
  empleado,
  onClose,
  onGuardarHojaVida,
  esVistaCandidato = false
}) => {
  // Pestaña activa del formulario o visualización de Hoja de Vida
  const [tabHv, setTabHv] = useState<'personal' | 'residencia' | 'estudios' | 'experiencia' | 'declaracion'>('personal');

  // Identificar si el colaborador se encuentra en etapa inicial de Pre-selección
  const estaEnPreseleccion = Boolean(
    (
      empleado.vinculacion?.etapaActual === 'pre_seleccion' ||
      empleado.estadoLaboral === 'Pre-selección' ||
      empleado.laboral?.estado === 'Pre-selección'
    ) &&
    empleado.vinculacion?.etapaActual !== 'hoja_vida_completada' &&
    empleado.vinculacion?.etapaActual !== 'pendiente_firma_contrato' &&
    empleado.vinculacion?.etapaActual !== 'contrato_firmado' &&
    empleado.vinculacion?.etapaActual !== 'vinculado_activo' &&
    !empleado.activo &&
    empleado.estadoLaboral !== 'Activo' &&
    empleado.laboral?.estado !== 'Activo'
  );

  // Si ya está seleccionado/vinculado, inicia por defecto en modo de visualización de datos registrados
  const [modoEdicion, setModoEdicion] = useState<boolean>(estaEnPreseleccion);

  // Datos Personales (SIN datos de prueba falsos)
  const [fechaNacimiento, setFechaNacimiento] = useState(empleado.persona?.fechaNacimiento || '');
  const [lugarNacimiento, setLugarNacimiento] = useState(empleado.persona?.lugarNacimiento || '');
  const [genero, setGenero] = useState(
    empleado.persona?.genero && empleado.persona.genero !== 'No especificado' ? empleado.persona.genero : 'Femenino'
  );
  const [estadoCivil, setEstadoCivil] = useState(empleado.persona?.estadoCivil || 'Soltero(a)');
  const [nacionalidad, setNacionalidad] = useState(empleado.persona?.nacionalidad || 'Colombiana');
  const [rhGrupo, setRhGrupo] = useState('O+');

  // Residencia y Contacto
  const [direccion, setDireccion] = useState(
    empleado.contacto?.direccion && empleado.contacto.direccion !== 'Pendiente por candidato'
      ? empleado.contacto.direccion
      : ''
  );
  const [barrio, setBarrio] = useState(empleado.contacto?.barrio || '');
  const [departamento, setDepartamento] = useState(empleado.contacto?.departamento || 'Bogotá D.C.');
  const [ciudad, setCiudad] = useState(empleado.contacto?.ciudad || 'Bogotá D.C.');
  const [celular, setCelular] = useState(empleado.contacto?.celular || empleado.telefono || '');
  const [correoPersonal, setCorreoPersonal] = useState(empleado.contacto?.correoPersonal || empleado.email || '');

  // Contacto de Emergencia
  const [contactoEmergenciaNombre, setContactoEmergenciaNombre] = useState(
    empleado.contacto?.contactoEmergenciaNombre && empleado.contacto.contactoEmergenciaNombre !== 'Pendiente por candidato'
      ? empleado.contacto.contactoEmergenciaNombre
      : ''
  );
  const [contactoEmergenciaParentesco, setContactoEmergenciaParentesco] = useState(
    empleado.contacto?.contactoEmergenciaParentesco || 'Cónyuge / Pareja'
  );
  const [contactoEmergenciaTelefono, setContactoEmergenciaTelefono] = useState(
    empleado.contacto?.contactoEmergenciaTelefono || ''
  );

  // Formación Académica (SIN datos de prueba)
  const [estudios, setEstudios] = useState<EstudioAcademicoEmpleado[]>(
    empleado.estudios && empleado.estudios.length > 0 ? empleado.estudios : []
  );

  // Experiencia Laboral (SIN datos de prueba)
  const [experiencias, setExperiencias] = useState<ExperienciaLaboralEmpleado[]>(
    empleado.experiencias && empleado.experiencias.length > 0 ? empleado.experiencias : []
  );

  // Declaraciones legales
  const [aceptaHabeasData, setAceptaHabeasData] = useState(true);
  const [declaraVeracidad, setDeclaraVeracidad] = useState(true);

  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Agregar nuevo estudio
  const handleAgregarEstudio = () => {
    const nuevo: EstudioAcademicoEmpleado = {
      id: uid(),
      nivelEducativo: 'Técnico',
      programa: '',
      tituloObtenido: '',
      institucion: '',
      ciudad: ciudad || 'Bogotá D.C.',
      fechaInicio: '',
      fechaFin: '',
      estado: 'Graduado'
    };
    setEstudios([...estudios, nuevo]);
  };

  const handleEliminarEstudio = (id: string) => {
    setEstudios(estudios.filter(e => e.id !== id));
  };

  const handleActualizarEstudio = (id: string, campo: keyof EstudioAcademicoEmpleado, valor: any) => {
    setEstudios(estudios.map(e => (e.id === id ? { ...e, [campo]: valor } : e)));
  };

  // Agregar nueva experiencia
  const handleAgregarExperiencia = () => {
    const nueva: ExperienciaLaboralEmpleado = {
      id: uid(),
      empresa: '',
      cargo: '',
      fechaIngreso: '',
      fechaRetiro: '',
      funcionesPrincipales: ''
    };
    setExperiencias([...experiencias, nueva]);
  };

  const handleEliminarExperiencia = (id: string) => {
    setExperiencias(experiencias.filter(e => e.id !== id));
  };

  const handleActualizarExperiencia = (id: string, campo: keyof ExperienciaLaboralEmpleado, valor: any) => {
    setExperiencias(experiencias.map(e => (e.id === id ? { ...e, [campo]: valor } : e)));
  };

  // Guardar Hoja de Vida
  const handleGuardarFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (!direccion.trim()) {
      setErrorValidacion('Debe ingresar la dirección de residencia.');
      setTabHv('residencia');
      return;
    }

    if (!contactoEmergenciaNombre.trim() || !contactoEmergenciaTelefono.trim()) {
      setErrorValidacion('Debe completar el nombre y teléfono del contacto de emergencia.');
      setTabHv('residencia');
      return;
    }

    if (!aceptaHabeasData || !declaraVeracidad) {
      setErrorValidacion('Debe aceptar las autorizaciones legales de veracidad y tratamiento de datos personales (Ley 1581 de 2012).');
      setTabHv('declaracion');
      return;
    }

    setGuardando(true);

    try {
      const fechaHoy = new Date().toISOString();

      // Generar notificación interna para Gestión Humana
      const notifGH = generarTextoNotificacionHojaVidaCompletada({
        candidatoNombre: empleado.nombre,
        candidatoDocumento: empleado.documento,
        cargoNombre: empleado.laboral?.cargoNombre
      });

      const nuevaNotificacion: NotificacionVinculacion = {
        id: uid(),
        fecha: fechaHoy,
        destinatario: 'administrador_gh',
        destinatarioNombre: 'Dirección de Gestión Humana',
        destinatarioEmail: 'gestionhumana@bgroup.com.co',
        tipo: 'hoja_vida_enviada',
        asunto: notifGH.asunto,
        mensaje: notifGH.cuerpo,
        leido: false,
        canal: 'Portal'
      };

      const vinculacionActualizada = {
        ...(empleado.vinculacion || {
          etapaActual: 'hoja_vida_completada' as const,
          fechaRegistroCandidato: fechaHoy,
          notificaciones: []
        }),
        etapaActual: 'hoja_vida_completada' as const,
        fechaHojaVidaCompletada: fechaHoy,
        notificaciones: [nuevaNotificacion, ...(empleado.vinculacion?.notificaciones || [])]
      };

      // Resumen de formación y experiencia
      const formacionResumen =
        estudios.length > 0
          ? `${estudios[0].nivelEducativo}: ${estudios[0].tituloObtenido || estudios[0].programa} (${estudios[0].institucion})`
          : empleado.formacion || 'Formación académica registrada';

      const experienciaResumen =
        experiencias.length > 0
          ? `${experiencias[0].cargo} en ${experiencias[0].empresa}`
          : empleado.experiencia || 'Experiencia previa registrada';

      const empleadoActualizado: Empleado = {
        ...empleado,
        formacion: formacionResumen,
        experiencia: experienciaResumen,
        persona: {
          ...(empleado.persona || {
            tipoDocumento: empleado.tipoDocumento || 'CC',
            numeroDocumento: empleado.documento,
            primerNombre: empleado.nombre.split(' ')[0] || '',
            primerApellido: empleado.nombre.split(' ')[1] || '',
            nacionalidad: 'Colombiana'
          }),
          fechaNacimiento,
          lugarNacimiento,
          genero,
          estadoCivil,
          nacionalidad
        },
        contacto: {
          direccion: direccion.trim(),
          barrio: barrio.trim(),
          departamento,
          ciudad,
          celular: celular.trim(),
          correoPersonal: correoPersonal.trim(),
          contactoEmergenciaNombre: contactoEmergenciaNombre.trim(),
          contactoEmergenciaParentesco: contactoEmergenciaParentesco.trim(),
          contactoEmergenciaTelefono: contactoEmergenciaTelefono.trim()
        },
        estudios,
        experiencias,
        vinculacion: vinculacionActualizada,
        historialLaboral: [
          {
            id: uid(),
            fechaHora: fechaHoy,
            usuario: esVistaCandidato ? 'Candidato (Portal)' : 'Administrador GH',
            accion: 'CAMBIO_DATOS',
            titulo: 'Hoja de Vida Diligenciada y Acreditada',
            motivo: 'Registro de datos sociodemográficos, formación académica, experiencia laboral y autorizaciones de ley.',
            valorNuevo: `Etapa: Hoja de Vida Completada (${estudios.length} títulos, ${experiencias.length} experiencias)`
          },
          ...(empleado.historialLaboral || [])
        ]
      };

      await onGuardarHojaVida(empleadoActualizado);
      onClose();
    } catch (err: any) {
      console.error('Error al guardar Hoja de Vida:', err);
      setErrorValidacion(err?.message || 'Error al guardar la Hoja de Vida.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#18235C] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#F59E0B] border border-white/10">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-white">
                  Hoja de Vida Digital del Colaborador
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    estaEnPreseleccion
                      ? 'bg-purple-500/20 text-purple-200 border-purple-400/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  }`}
                >
                  {estaEnPreseleccion
                    ? 'Etapa 1: Pre-selección'
                    : empleado.activo
                    ? 'Colaborador Activo · Seleccionado'
                    : 'Candidato Seleccionado'}
                </span>
                {!modoEdicion && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/10 text-slate-200">
                    Modo Consulta
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Colaborador: <strong className="text-white">{empleado.nombre}</strong> · C.C.{' '}
                <strong className="font-mono text-[#F59E0B]">{empleado.documento}</strong>
                {empleado.laboral?.cargoNombre && ` · Cargo: ${empleado.laboral.cargoNombre}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!modoEdicion && !esVistaCandidato && (
              <button
                type="button"
                onClick={() => setModoEdicion(true)}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                title="Habilitar edición de la Hoja de Vida"
              >
                <Edit className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Modificar Información</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Imprimir Hoja de Vida"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de pestañas */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 flex items-center gap-2 overflow-x-auto text-xs font-bold py-2 shrink-0">
          <button
            type="button"
            onClick={() => setTabHv('personal')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              tabHv === 'personal' ? 'bg-[#18235C] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Datos Personales</span>
          </button>

          <button
            type="button"
            onClick={() => setTabHv('residencia')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              tabHv === 'residencia' ? 'bg-[#18235C] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>2. Residencia & Emergencia</span>
          </button>

          <button
            type="button"
            onClick={() => setTabHv('estudios')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              tabHv === 'estudios' ? 'bg-[#18235C] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>3. Formación Académica ({estudios.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTabHv('experiencia')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              tabHv === 'experiencia' ? 'bg-[#18235C] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>4. Experiencia Previa ({experiencias.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTabHv('declaracion')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              tabHv === 'declaracion' ? 'bg-[#18235C] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>5. Habeas Data & Veracidad</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* CONDICIONAL: MODO CONSULTA (YA SELECCIONADO) O MODO EDICIÓN (PRE-SELECCIÓN) */}
        {/* ========================================================================= */}
        {!modoEdicion ? (
          /* MODO CONSULTA / VISUALIZACIÓN DE DATOS REGISTRADOS */
          <div className="p-6 space-y-5 overflow-y-auto flex-1 text-xs text-slate-700">
            {/* Aviso informativo de datos registrados */}
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed text-emerald-950">
                <strong>Hoja de Vida Formalizada:</strong> El colaborador ya ha sido seleccionado en el proceso de vinculación. A continuación se muestran los datos personales, académicos y laborales registrados en el expediente digital.
              </div>
            </div>

            {/* TAB 1: DATOS PERSONALES (CONSULTA) */}
            {tabHv === 'personal' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-500 block font-semibold">Tipo y Número de Documento</span>
                    <span className="font-bold text-[#18235C] text-sm font-mono">
                      {empleado.persona?.tipoDocumento || empleado.tipoDocumento || 'CC'} {empleado.documento}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-500 block font-semibold">Fecha de Nacimiento</span>
                    <span className="font-bold text-slate-800 text-sm font-mono">
                      {empleado.persona?.fechaNacimiento || 'No registrada'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-500 block font-semibold">Lugar de Nacimiento</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {empleado.persona?.lugarNacimiento || 'No registrado'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-500 block font-semibold">Nacionalidad</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {empleado.persona?.nacionalidad || 'Colombiana'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-500 block font-semibold">Género</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {empleado.persona?.genero || 'No especificado'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-500 block font-semibold">Estado Civil</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {empleado.persona?.estadoCivil || 'Soltero(a)'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: RESIDENCIA Y CONTACTO (CONSULTA) */}
            {tabHv === 'residencia' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl sm:col-span-2 space-y-1">
                    <span className="text-[10px] text-slate-500 block font-semibold">Dirección de Residencia</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {empleado.contacto?.direccion && empleado.contacto.direccion !== 'Pendiente por candidato'
                        ? empleado.contacto.direccion
                        : 'No registrada'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-500 block font-semibold">Barrio</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {empleado.contacto?.barrio || 'No especificado'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-500 block font-semibold">Ciudad / Municipio</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {empleado.contacto?.ciudad || 'Bogotá D.C.'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-500 block font-semibold">Departamento</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {empleado.contacto?.departamento || 'Bogotá D.C.'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] text-slate-500 block font-semibold">Celular de Contacto</span>
                    <span className="font-bold text-slate-800 text-sm font-mono">
                      {empleado.contacto?.celular || empleado.telefono || 'No registrado'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl sm:col-span-3 space-y-1">
                    <span className="text-[10px] text-slate-500 block font-semibold">Correo Electrónico Personal</span>
                    <span className="font-bold text-[#18235C] text-sm">
                      {empleado.contacto?.correoPersonal || empleado.email || 'No registrado'}
                    </span>
                  </div>
                </div>

                {/* Contacto de Emergencia */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <h4 className="font-bold text-xs text-[#18235C] flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Contacto de Emergencia Registrado (Decreto 1072/2015)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Nombre Completo</span>
                      <span className="font-bold text-slate-800">
                        {empleado.contacto?.contactoEmergenciaNombre || 'No registrado'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Parentesco</span>
                      <span className="font-bold text-slate-800">
                        {empleado.contacto?.contactoEmergenciaParentesco || 'No registrado'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-500 block">Teléfono de Emergencia</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {empleado.contacto?.contactoEmergenciaTelefono || 'No registrado'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FORMACIÓN ACADÉMICA (CONSULTA) */}
            {tabHv === 'estudios' && (
              <div className="space-y-3 animate-fadeIn">
                {(empleado.estudios || []).length > 0 ? (
                  (empleado.estudios || []).map((est, idx) => (
                    <div key={est.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-[#18235C] text-sm">
                          {est.tituloObtenido || est.programa}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          {est.nivelEducativo || 'Estudio'} · {est.estado || 'Graduado'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <p><strong className="text-slate-600">Institución:</strong> <span className="text-slate-900">{est.institucion}</span></p>
                        {est.fechaGraduacion && (
                          <p><strong className="text-slate-600">Fecha Graduación:</strong> <span className="font-mono text-slate-900">{est.fechaGraduacion}</span></p>
                        )}
                        {est.tarjetaProfesional && (
                          <p><strong className="text-slate-600">Tarjeta Prof.:</strong> <span className="font-mono text-slate-900">{est.tarjetaProfesional}</span></p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-1">
                    <GraduationCap className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-slate-700 font-bold">Sin formación académica adicional registrada en el formulario digital.</p>
                    <p className="text-slate-500 text-[11px]">Perfil base en expediente: {empleado.formacion || 'Bachiller / Técnico'}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: EXPERIENCIA LABORAL (CONSULTA) */}
            {tabHv === 'experiencia' && (
              <div className="space-y-3 animate-fadeIn">
                {(empleado.experiencias || []).length > 0 ? (
                  (empleado.experiencias || []).map((exp, idx) => (
                    <div key={exp.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-[#18235C] text-sm">{exp.cargo}</span>
                        <span className="text-slate-500 font-mono text-[11px]">
                          {exp.fechaIngreso} — {exp.fechaRetiro || 'Actual'}
                        </span>
                      </div>
                      <p><strong className="text-slate-600">Empresa / Empleador:</strong> <span className="font-bold text-slate-900">{exp.empresa}</span></p>
                      {exp.funcionesPrincipales && (
                        <p className="text-slate-700 leading-relaxed text-xs pt-1">
                          <strong className="text-slate-600">Funciones:</strong> {exp.funcionesPrincipales}
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-1">
                    <History className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-slate-700 font-bold">Sin trayectoria previa adicional registrada en el formulario digital.</p>
                    <p className="text-slate-500 text-[11px]">Trayectoria base en expediente: {empleado.experiencia || 'No especificada'}</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: HABEAS DATA & TRAZABILIDAD (CONSULTA) */}
            {tabHv === 'declaracion' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <span className="font-bold text-[#18235C] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Tratamiento de Datos Personales & Declaración Juramentada</span>
                  </span>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    El colaborador autorizó expresamente el tratamiento de sus datos personales conforme a la <strong>Ley 1581 de 2012</strong> y declaró la veracidad de la información conforme al <strong>Art. 62 del Código Sustantivo del Trabajo (CST)</strong>.
                  </p>
                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 font-mono space-y-1">
                    <p>• Fecha de Radicación: {empleado.vinculacion?.fechaHojaVidaCompletada ? new Date(empleado.vinculacion.fechaHojaVidaCompletada).toLocaleString('es-CO') : 'Formalizado en sistema'}</p>
                    <p>• Etapa Actual del Flujo: {empleado.vinculacion?.etapaActual || 'vinculado_activo'}</p>
                    <p>• Estado de Vinculación: {empleado.activo ? 'ACTIVO' : 'EN PROCESO CONTRACTUAL'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botones inferiores del modo consulta */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          /* MODO FORMULARIO: PRE-SELECCIÓN O EDICIÓN HABILITADA */
          <form onSubmit={handleGuardarFinal} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
            {errorValidacion && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorValidacion}</span>
              </div>
            )}

            {/* TAB 1: DATOS PERSONALES */}
            {tabHv === 'personal' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="font-bold text-[#18235C] block">Información Demográfica Básica:</span>
                  <span className="text-[11px] text-slate-500">
                    Los datos deben coincidir con su cédula de ciudadanía o documento de identidad oficial.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fecha de Nacimiento *</label>
                    <input
                      type="date"
                      required
                      value={fechaNacimiento}
                      onChange={e => setFechaNacimiento(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Lugar de Nacimiento (Ciudad) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Bogotá D.C."
                      value={lugarNacimiento}
                      onChange={e => setLugarNacimiento(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nacionalidad *</label>
                    <input
                      type="text"
                      required
                      value={nacionalidad}
                      onChange={e => setNacionalidad(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Género *</label>
                    <select
                      value={genero}
                      onChange={e => setGenero(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                    >
                      <option value="Femenino">Femenino</option>
                      <option value="Masculino">Masculino</option>
                      <option value="No binario">No binario</option>
                      <option value="Prefiero no decir">Prefiero no decir</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Estado Civil *</label>
                    <select
                      value={estadoCivil}
                      onChange={e => setEstadoCivil(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                    >
                      {ESTADOS_CIVILES.map(ec => (
                        <option key={ec} value={ec}>{ec}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Grupo Sanguíneo y RH *</label>
                    <select
                      value={rhGrupo}
                      onChange={e => setRhGrupo(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold font-mono"
                    >
                      {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(rh => (
                        <option key={rh} value={rh}>{rh}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="button"
                    onClick={() => setTabHv('residencia')}
                    className="px-4 py-2 bg-[#18235C] text-white font-bold rounded-xl cursor-pointer hover:bg-[#1E3A8A] transition-colors"
                  >
                    Continuar a Residencia y Contacto →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: RESIDENCIA Y CONTACTO */}
            {tabHv === 'residencia' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Dirección de Residencia Actual *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Calle 100 # 19-61 Apto 402"
                      value={direccion}
                      onChange={e => setDireccion(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Barrio *</label>
                    <input
                      type="text"
                      placeholder="Ej. Chapinero Central"
                      value={barrio}
                      onChange={e => setBarrio(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Departamento *</label>
                    <select
                      value={departamento}
                      onChange={e => {
                        setDepartamento(e.target.value);
                        const dep = DEPARTAMENTOS_COLOMBIA.find(d => d.nombre === e.target.value);
                        if (dep && dep.municipios && dep.municipios.length > 0) {
                          setCiudad(dep.municipios[0]);
                        }
                      }}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                    >
                      {DEPARTAMENTOS_COLOMBIA.map(d => (
                        <option key={d.nombre} value={d.nombre}>{d.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ciudad / Municipio *</label>
                    <input
                      type="text"
                      required
                      value={ciudad}
                      onChange={e => setCiudad(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Celular de Contacto *</label>
                    <input
                      type="tel"
                      required
                      placeholder="300 123 4567"
                      value={celular}
                      onChange={e => setCelular(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold font-mono"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block font-bold text-slate-700 mb-1">Correo Electrónico Personal *</label>
                    <input
                      type="email"
                      required
                      placeholder="colaborador@correo.com"
                      value={correoPersonal}
                      onChange={e => setCorreoPersonal(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                    />
                  </div>
                </div>

                {/* Contacto de Emergencia */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="font-bold text-xs text-[#18235C] flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Contacto en Caso de Emergencia (Obligatorio Decreto 1072 de 2015)</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nombre de allegado o familiar"
                        value={contactoEmergenciaNombre}
                        onChange={e => setContactoEmergenciaNombre(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Parentesco *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Cónyuge, Padre, Hermano"
                        value={contactoEmergenciaParentesco}
                        onChange={e => setContactoEmergenciaParentesco(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Teléfono / Celular *</label>
                      <input
                        type="tel"
                        required
                        placeholder="300 000 0000"
                        value={contactoEmergenciaTelefono}
                        onChange={e => setContactoEmergenciaTelefono(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setTabHv('personal')}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setTabHv('estudios')}
                    className="px-4 py-2 bg-[#18235C] text-white font-bold rounded-xl cursor-pointer"
                  >
                    Continuar a Formación Académica →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: FORMACIÓN ACADÉMICA */}
            {tabHv === 'estudios' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#18235C]">Títulos y Formación Académica</h4>
                    <p className="text-[11px] text-slate-500">
                      Registre su educación básica, técnica, tecnológica, profesional o posgrados.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAgregarEstudio}
                    className="px-3.5 py-1.5 rounded-xl bg-[#18235C] hover:bg-[#1E3A8A] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Estudio</span>
                  </button>
                </div>

                {estudios.length === 0 && (
                  <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-2">
                    <GraduationCap className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-slate-700 font-bold text-xs">No hay estudios académicos registrados aún.</p>
                    <p className="text-slate-500 text-[11px]">Haga clic en el botón superior para incluir su formación académica.</p>
                    <button
                      type="button"
                      onClick={handleAgregarEstudio}
                      className="mt-2 px-3.5 py-2 bg-[#18235C] hover:bg-[#1E3A8A] text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Primer Estudio</span>
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  {estudios.map((est, idx) => (
                    <div key={est.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-[#18235C]">Título o Formación #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleEliminarEstudio(est.id)}
                          className="text-rose-600 hover:text-rose-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                          title="Eliminar este registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Nivel Educativo *</label>
                          <select
                            value={est.nivelEducativo}
                            onChange={e => handleActualizarEstudio(est.id, 'nivelEducativo', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                          >
                            {NIVELES_EDUCATIVOS.map(ne => (
                              <option key={ne} value={ne}>{ne}</option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-semibold text-slate-700 mb-1">Título Obtenido / Programa *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Bachiller Académico, Técnico en Redes..."
                            value={est.tituloObtenido}
                            onChange={e => handleActualizarEstudio(est.id, 'tituloObtenido', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-semibold text-slate-700 mb-1">Institución Educativa *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. SENA, Universidad Nacional, Colegio..."
                            value={est.institucion}
                            onChange={e => handleActualizarEstudio(est.id, 'institucion', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Fecha de Graduación</label>
                          <input
                            type="date"
                            value={est.fechaGraduacion || ''}
                            onChange={e => handleActualizarEstudio(est.id, 'fechaGraduacion', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setTabHv('residencia')}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setTabHv('experiencia')}
                    className="px-4 py-2 bg-[#18235C] text-white font-bold rounded-xl cursor-pointer"
                  >
                    Continuar a Experiencia Laboral →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: EXPERIENCIA LABORAL */}
            {tabHv === 'experiencia' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#18235C]">Experiencia Laboral Previa</h4>
                    <p className="text-[11px] text-slate-500">
                      Registre sus empleos o contratos anteriores más relevantes (si aplica).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAgregarExperiencia}
                    className="px-3.5 py-1.5 rounded-xl bg-[#18235C] hover:bg-[#1E3A8A] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Experiencia</span>
                  </button>
                </div>

                {experiencias.length === 0 && (
                  <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-2">
                    <History className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-slate-700 font-bold text-xs">No hay experiencia previa registrada.</p>
                    <p className="text-slate-500 text-[11px]">Si cuenta con trayectoria laboral, agréguela con el botón superior.</p>
                    <button
                      type="button"
                      onClick={handleAgregarExperiencia}
                      className="mt-2 px-3.5 py-2 bg-[#18235C] hover:bg-[#1E3A8A] text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Experiencia Laboral</span>
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  {experiencias.map((exp, idx) => (
                    <div key={exp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <span className="font-bold text-[#18235C]">Experiencia Laboral #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleEliminarExperiencia(exp.id)}
                          className="text-rose-600 hover:text-rose-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                          title="Eliminar este empleo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Empresa / Empleador *</label>
                          <input
                            type="text"
                            required
                            placeholder="Nombre de la empresa"
                            value={exp.empresa}
                            onChange={e => handleActualizarExperiencia(exp.id, 'empresa', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Cargo Desempeñado *</label>
                          <input
                            type="text"
                            required
                            placeholder="Ej. Técnico, Auxiliar, Coordinador..."
                            value={exp.cargo}
                            onChange={e => handleActualizarExperiencia(exp.id, 'cargo', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Fecha de Ingreso</label>
                          <input
                            type="date"
                            value={exp.fechaIngreso}
                            onChange={e => handleActualizarExperiencia(exp.id, 'fechaIngreso', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">Fecha de Retiro</label>
                          <input
                            type="date"
                            value={exp.fechaRetiro}
                            onChange={e => handleActualizarExperiencia(exp.id, 'fechaRetiro', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block font-semibold text-slate-700 mb-1">Funciones Principales</label>
                          <textarea
                            rows={2}
                            placeholder="Breve resumen de responsabilidades desempeñadas..."
                            value={exp.funcionesPrincipales}
                            onChange={e => handleActualizarExperiencia(exp.id, 'funcionesPrincipales', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-3">
                  <button
                    type="button"
                    onClick={() => setTabHv('estudios')}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    ← Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() => setTabHv('declaracion')}
                    className="px-4 py-2 bg-[#18235C] text-white font-bold rounded-xl cursor-pointer"
                  >
                    Continuar a Autorizaciones Legales →
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: AUTORIZACIONES LEGALES Y VERACIDAD */}
            {tabHv === 'declaracion' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
                  <span className="font-black text-indigo-950 flex items-center gap-1.5 text-xs">
                    <ShieldCheck className="w-4 h-4 text-indigo-700" />
                    <span>Tratamiento de Datos Personales (Ley 1581 de 2012) & Veracidad</span>
                  </span>
                  <p className="text-[11px] text-indigo-900 leading-relaxed">
                    De conformidad con la Ley Estatutaria 1581 de 2012, el Decreto 1377 de 2013 y el Código Sustantivo del Trabajo (CST), la información suministrada será utilizada exclusivamente para el proceso de selección, formalización de contrato individual de trabajo, afiliaciones a la Seguridad Social Integral (EPS, ARL, AFP, CCF) y conformación del expediente laboral digital único.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aceptaHabeasData}
                      onChange={e => setAceptaHabeasData(e.target.checked)}
                      className="mt-0.5 rounded text-[#18235C] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-slate-800 leading-snug">
                      <strong>Autorización Expresa de Habeas Data:</strong> Autorizo a la empresa para recolectar, almacenar, procesar y transmitir mis datos personales suministrados para fines contractuales, laborales y de seguridad social.
                    </span>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={declaraVeracidad}
                      onChange={e => setDeclaraVeracidad(e.target.checked)}
                      className="mt-0.5 rounded text-[#18235C] w-4 h-4 cursor-pointer"
                    />
                    <span className="text-xs text-slate-800 leading-snug">
                      <strong>Declaración de Veracidad (Art. 62 CST):</strong> Declaro bajo la gravedad de juramento que toda la información consignada en esta Hoja de Vida es verídica, exacta y susceptible de comprobación documental. Entiendo que la inexactitud en los datos constituye justa causa para la terminación unilateral del contrato de trabajo.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setTabHv('experiencia')}
                    className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
                  >
                    ← Anterior
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{guardando ? 'Guardando Hoja de Vida...' : 'Finalizar y Guardar Hoja de Vida'}</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
