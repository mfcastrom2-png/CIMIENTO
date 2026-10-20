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
  Phone
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
  // Pestaña activa del formulario de Hoja de Vida
  const [tabHv, setTabHv] = useState<'personal' | 'residencia' | 'estudios' | 'experiencia' | 'declaracion'>('personal');

  // Datos Personales
  const [fechaNacimiento, setFechaNacimiento] = useState(empleado.persona?.fechaNacimiento || '1995-05-15');
  const [lugarNacimiento, setLugarNacimiento] = useState(empleado.persona?.lugarNacimiento || 'Bogotá D.C.');
  const [genero, setGenero] = useState(empleado.persona?.genero || 'Masculino');
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

  // Formación Académica
  const [estudios, setEstudios] = useState<EstudioAcademicoEmpleado[]>(
    empleado.estudios && empleado.estudios.length > 0
      ? empleado.estudios
      : [
          {
            id: uid(),
            nivelEducativo: 'Profesional',
            programa: 'Ingeniería de Sistemas / Telecomunicaciones',
            tituloObtenido: 'Ingeniero(a)',
            institucion: 'Universidad Nacional de Colombia',
            ciudad: 'Bogotá D.C.',
            fechaInicio: '2016-01-15',
            fechaFin: '2021-06-20',
            fechaGraduacion: '2021-07-15',
            estado: 'Graduado'
          }
        ]
  );

  // Experiencia Laboral
  const [experiencias, setExperiencias] = useState<ExperienciaLaboralEmpleado[]>(
    empleado.experiencias && empleado.experiencias.length > 0
      ? empleado.experiencias
      : [
          {
            id: uid(),
            empresa: 'Servicios Tecnológicos de Colombia S.A.S.',
            cargo: 'Especialista de Redes y Soporte',
            fechaIngreso: '2022-01-15',
            fechaRetiro: '2025-12-20',
            mesesExperiencia: 48,
            funcionesPrincipales: 'Configuración de enlaces de telecomunicaciones, atención de incidencias técnicas y supervisión de infraestructura.'
          }
        ]
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
      fechaInicio: '2020-01-15',
      fechaFin: '2022-06-30',
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
      fechaIngreso: '2023-01-15',
      fechaRetiro: '2024-12-31',
      mesesExperiencia: 24,
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

  const handleGuardarFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (!direccion.trim()) {
      setErrorValidacion('Debe ingresar su dirección de residencia.');
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
      const formacionResumen = estudios.length > 0
        ? `${estudios[0].nivelEducativo}: ${estudios[0].tituloObtenido || estudios[0].programa} (${estudios[0].institucion})`
        : 'Formación académica registrada';

      const experienciaResumen = experiencias.length > 0
        ? `${experiencias[0].cargo} en ${experiencias[0].empresa}`
        : 'Experiencia previa registrada';

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
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Hoja de Vida & Datos de Vinculación Laboral
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Etapa 1: Pre-selección
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Candidato: <strong className="text-white">{empleado.nombre}</strong> · C.C. <strong className="font-mono text-[#F59E0B]">{empleado.documento}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
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
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>5. Habeas Data & Veracidad</span>
          </button>
        </div>

        {/* Contenido */}
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
                      <option key={ec} value={ec}>
                        {ec}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Grupo Sanguíneo & RH *</label>
                  <select
                    value={rhGrupo}
                    onChange={e => setRhGrupo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold"
                  >
                    <option value="O+">O Positivo (O+)</option>
                    <option value="O-">O Negativo (O-)</option>
                    <option value="A+">A Positivo (A+)</option>
                    <option value="A-">A Negativo (A-)</option>
                    <option value="B+">B Positivo (B+)</option>
                    <option value="B-">B Negativo (B-)</option>
                    <option value="AB+">AB Positivo (AB+)</option>
                    <option value="AB-">AB Negativo (AB-)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setTabHv('residencia')}
                  className="px-4 py-2 bg-[#18235C] text-white font-bold rounded-xl cursor-pointer"
                >
                  Continuar a Residencia & Contacto →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: RESIDENCIA Y CONTACTO */}
          {tabHv === 'residencia' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-[#18235C] block">Domicilio Habitual & Residencia:</span>
                <span className="text-[11px] text-slate-500">
                  Lugar donde se prestará el servicio o residencia principal del trabajador.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Dirección Completa de Residencia *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Carrera 15 # 93-47 Apto 402"
                    value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Barrio / Sector</label>
                  <input
                    type="text"
                    placeholder="Ej. Chicó Norte"
                    value={barrio}
                    onChange={e => setBarrio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Departamento *</label>
                  <select
                    value={departamento}
                    onChange={e => {
                      setDepartamento(e.target.value);
                      const dep = DEPARTAMENTOS_COLOMBIA.find(d => d.nombre === e.target.value);
                      if (dep && dep.municipios && dep.municipios.length > 0) setCiudad(dep.municipios[0]);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    {DEPARTAMENTOS_COLOMBIA.map(d => (
                      <option key={d.nombre} value={d.nombre}>
                        {d.nombre}
                      </option>
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
                  <label className="block font-bold text-slate-700 mb-1">Celular Personal *</label>
                  <input
                    type="tel"
                    required
                    value={celular}
                    onChange={e => setCelular(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              {/* Contacto de Emergencia */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                  <Phone className="w-3.5 h-3.5 text-amber-700" />
                  <span>Contacto de Emergencia Obligatorio (CST & SG-SST) *</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Gloria Martínez"
                      value={contactoEmergenciaNombre}
                      onChange={e => setContactoEmergenciaNombre(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Parentesco *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Madre / Cónyuge / Hermano"
                      value={contactoEmergenciaParentesco}
                      onChange={e => setContactoEmergenciaParentesco(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Teléfono / Celular *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej. 3123456789"
                      value={contactoEmergenciaTelefono}
                      onChange={e => setContactoEmergenciaTelefono(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono"
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
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <span className="font-bold text-[#18235C] block">Estudios, Títulos & Formación:</span>
                  <span className="text-[11px] text-slate-500">
                    Registre su nivel educativo más alto y estudios relevantes para el cargo.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAgregarEstudio}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Estudio</span>
                </button>
              </div>

              {estudios.map((est, idx) => (
                <div key={est.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">
                      #{idx + 1} — {est.nivelEducativo || 'Nivel Educativo'}
                    </span>
                    {estudios.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleEliminarEstudio(est.id)}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                        title="Eliminar este estudio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-0.5">Nivel Educativo</label>
                      <select
                        value={est.nivelEducativo}
                        onChange={e => handleActualizarEstudio(est.id, 'nivelEducativo', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold"
                      >
                        {NIVELES_EDUCATIVOS.map(n => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-600 mb-0.5">Título Obtenido / Programa *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Ingeniero de Telecomunicaciones / Bachiller"
                        value={est.tituloObtenido}
                        onChange={e => handleActualizarEstudio(est.id, 'tituloObtenido', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-bold text-slate-600 mb-0.5">Institución Educativa *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Universidad Distrital / SENA / Colegio"
                        value={est.institucion}
                        onChange={e => handleActualizarEstudio(est.id, 'institucion', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-0.5">Estado</label>
                      <select
                        value={est.estado}
                        onChange={e => handleActualizarEstudio(est.id, 'estado', e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold"
                      >
                        <option value="Graduado">Graduado</option>
                        <option value="En curso">En curso</option>
                        <option value="Aplazado">Aplazado</option>
                        <option value="Incompleto">Incompleto</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

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
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                  <span className="font-bold text-[#18235C] block">Trayectoria & Experiencia Laboral Previa:</span>
                  <span className="text-[11px] text-slate-500">
                    Indique empleadores anteriores, funciones y logros para verificación de antecedentes.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAgregarExperiencia}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Agregar Experiencia</span>
                </button>
              </div>

              {experiencias.map((exp, idx) => (
                <div key={exp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">
                      #{idx + 1} — {exp.empresa || 'Empresa Empleadora'}
                    </span>
                    {experiencias.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleEliminarExperiencia(exp.id)}
                        className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                        title="Eliminar esta experiencia"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-0.5">Empresa / Razón Social *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Compañía de Redes S.A.S."
                        value={exp.empresa}
                        onChange={e => handleActualizarExperiencia(exp.id, 'empresa', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-0.5">Cargo Desempeñado *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Técnico de Fibra Óptica"
                        value={exp.cargo}
                        onChange={e => handleActualizarExperiencia(exp.id, 'cargo', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-0.5">Fecha de Ingreso</label>
                      <input
                        type="date"
                        value={exp.fechaIngreso}
                        onChange={e => handleActualizarExperiencia(exp.id, 'fechaIngreso', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-0.5">Fecha de Retiro</label>
                      <input
                        type="date"
                        value={exp.fechaRetiro}
                        onChange={e => handleActualizarExperiencia(exp.id, 'fechaRetiro', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-0.5">Meses de Experiencia</label>
                      <input
                        type="number"
                        min="1"
                        value={exp.mesesExperiencia || 12}
                        onChange={e => handleActualizarExperiencia(exp.id, 'mesesExperiencia', Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-0.5">Funciones Principales y Responsabilidades</label>
                    <textarea
                      rows={2}
                      value={exp.funcionesPrincipales}
                      onChange={e => handleActualizarExperiencia(exp.id, 'funcionesPrincipales', e.target.value)}
                      placeholder="Describa brevemente las actividades desarrolladas en este cargo..."
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>
              ))}

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
                    className="mt-0.5 rounded text-[#18235C] w-4 h-4"
                  />
                  <span className="text-xs text-slate-800 leading-snug">
                    <strong>Autorización Expresa de Habeas Data:</strong> Autorizo a B GROUP INGENIERIA S.A.S. para recolectar, almacenar, procesar y transmitir mis datos personales suministrados para fines contractuales, laborales y de seguridad social.
                  </span>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={declaraVeracidad}
                    onChange={e => setDeclaraVeracidad(e.target.checked)}
                    className="mt-0.5 rounded text-[#18235C] w-4 h-4"
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
                  <span>{guardando ? 'Guardando Hoja de Vida...' : 'Finalizar y Enviar Hoja de Vida a Gestión Humana'}</span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
