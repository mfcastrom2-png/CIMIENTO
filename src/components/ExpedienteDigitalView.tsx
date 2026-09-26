import React, { useState } from 'react';
import {
  Empleado,
  Cargo,
  AreaOrganizacion,
  UsuarioSistema,
  Solicitud,
  EvaluacionDesempeno,
  DocumentoExpedienteEmpleado
} from '../types';
import {
  ArrowLeft,
  User,
  MapPin,
  Briefcase,
  Layers,
  DollarSign,
  ShieldCheck,
  GraduationCap,
  History,
  HardHat,
  FileText,
  Printer,
  Edit,
  Power,
  Trash2,
  Key,
  ExternalLink,
  Download,
  Eye,
  Plus,
  AlertTriangle,
  Lock,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  Award
} from 'lucide-react';
import { uid } from '../data/initialData';

interface ExpedienteDigitalViewProps {
  empleado: Empleado;
  cargos: Cargo[];
  areas?: AreaOrganizacion[];
  currentUser?: UsuarioSistema | null;
  solicitudes?: Solicitud[];
  evaluaciones?: EvaluacionDesempeno[];
  onVolver: () => void;
  onEditar: (emp: Empleado) => void;
  onGestionarEstado: (emp: Empleado) => void;
  onEliminar?: (emp: Empleado) => void;
  onActualizarEmpleado?: (emp: Empleado) => Promise<void> | void;
  onVincularUsuario?: (emp: Empleado) => void;
  usuarioVinculado?: UsuarioSistema | null;
  initialTab?: string;
}

export const ExpedienteDigitalView: React.FC<ExpedienteDigitalViewProps> = ({
  empleado,
  cargos,
  areas = [],
  currentUser,
  solicitudes = [],
  evaluaciones = [],
  onVolver,
  onEditar,
  onGestionarEstado,
  onEliminar,
  onActualizarEmpleado,
  onVincularUsuario,
  usuarioVinculado,
  initialTab = 'general'
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [docModalPreview, setDocModalPreview] = useState<DocumentoExpedienteEmpleado | null>(null);
  const [modalSubirDoc, setModalSubirDoc] = useState(false);
  const [nuevoDocTipo, setNuevoDocTipo] = useState<any>('Documento de Identidad');
  const [nuevoDocNombre, setNuevoDocNombre] = useState('');
  const [nuevoDocObs, setNuevoDocObs] = useState('');

  const cargoNombre = cargos.find(c => c.id === empleado.cargoId)?.nombre || 'Cargo no definido';
  const areaNombre = areas.find(a => a.id === empleado.areaId)?.nombre || empleado.laboral?.areaNombre || 'Operaciones';

  // Verificar si rol es restringido de ver datos médicos confidenciales (solo admin_gh, responsable_sst y superadmin tienen acceso completo)
  const puedeVerSSTConfidencial =
    currentUser?.rol === 'superadmin' ||
    currentUser?.rol === 'admin_gh' ||
    currentUser?.rol === 'responsable_sst';
  const esRolNomina = !puedeVerSSTConfidencial;

  const estadoBadge = () => {
    const st = empleado.laboral?.estado || (empleado.activo ? 'Activo' : 'Inactivo');
    const colorMap: Record<string, string> = {
      Activo: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      Preingreso: 'bg-blue-50 text-blue-800 border-blue-300',
      Vacaciones: 'bg-indigo-50 text-indigo-800 border-indigo-300',
      Licencia: 'bg-purple-50 text-purple-800 border-purple-300',
      Suspensión: 'bg-amber-50 text-amber-800 border-amber-300',
      Inactivo: 'bg-yellow-50 text-yellow-800 border-yellow-300',
      Retirado: 'bg-rose-50 text-rose-800 border-rose-300'
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${colorMap[st] || 'bg-slate-100 text-slate-800 border-slate-300'}`}>
        <span className="w-2 h-2 rounded-full bg-current" />
        {st}
      </span>
    );
  };

  const handleSubirDocumento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoDocNombre.trim()) return;

    const nuevo: DocumentoExpedienteEmpleado = {
      id: uid(),
      tipoDocumento: nuevoDocTipo,
      nombreArchivo: nuevoDocNombre.trim(),
      fechaCarga: new Date().toISOString().slice(0, 10),
      usuarioCarga: currentUser?.nombre || 'Administrador GH',
      urlArchivo: '#',
      estado: 'Vigente',
      observaciones: nuevoDocObs.trim() || undefined
    };

    const docsActualizados = [nuevo, ...(empleado.documentos || [])];
    const empleadoActualizado: Empleado = {
      ...empleado,
      documentos: docsActualizados
    };

    if (onActualizarEmpleado) {
      await onActualizarEmpleado(empleadoActualizado);
    }
    setNuevoDocNombre('');
    setNuevoDocObs('');
    setModalSubirDoc(false);
  };

  const tabs = [
    { id: 'general', label: '1. Identificación', icon: User },
    { id: 'contacto', label: '2. Contacto & Residencia', icon: MapPin },
    { id: 'laboral', label: '3. Información Laboral', icon: Briefcase },
    { id: 'estructura', label: '4. Cargo & Estructura', icon: Layers },
    { id: 'compensacion', label: '5. Compensación', icon: DollarSign },
    { id: 'seguridadSocial', label: '6. Seguridad Social', icon: ShieldCheck },
    { id: 'academica', label: '7. Formación Académica', icon: GraduationCap },
    { id: 'experiencia', label: '8. Experiencia Laboral', icon: History },
    { id: 'sst', label: '9. Información SST', icon: HardHat },
    { id: 'documentos', label: `10. Documentos (${(empleado.documentos || []).length})`, icon: FileText },
    { id: 'historial', label: `Historial Laboral (${(empleado.historialLaboral || []).length})`, icon: Clock },
    { id: 'solicitudes', label: `Solicitudes (${solicitudes.length})`, icon: Calendar }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header del Expediente */}
      <div className="bg-white rounded-xl border border-[#8FA7D6] p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={onVolver}
              className="p-2.5 rounded-lg border border-[#8FA7D6] bg-[#F8FAFC] hover:bg-white text-[#18235C] transition-colors cursor-pointer"
              title="Volver a la Gestión de Empleados"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5">
              {empleado.persona?.fotoUrl ? (
                <img
                  src={empleado.persona.fotoUrl}
                  alt={empleado.nombre}
                  className="w-16 h-16 rounded-full object-cover border-2 border-[#18235C] shadow-xs"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[#18235C] text-[#8FA7D6] font-bold text-xl flex items-center justify-center border-2 border-[#8FA7D6]/40 shadow-xs">
                  {empleado.nombre.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl font-extrabold text-[#18235C] tracking-tight">
                    {empleado.nombre}
                  </h1>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-[#18235C] border border-[#8FA7D6]/40">
                    {empleado.codigo || empleado.codigoInterno || 'S/C'}
                  </span>
                  {estadoBadge()}
                </div>
                <p className="text-xs text-[#282829] mt-0.5">
                  <span className="font-semibold text-[#18235C]">{cargoNombre}</span> · Área: <span className="font-semibold">{areaNombre}</span> · Documento: <span className="font-mono font-semibold">{empleado.persona?.tipoDocumento || empleado.tipoDocumento || 'CC'} {empleado.documento}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Acciones principales */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onEditar(empleado)}
              className="px-3.5 py-1.5 rounded-lg bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5 text-[#8FA7D6]" />
              <span>Editar Expediente</span>
            </button>

            <button
              onClick={() => onGestionarEstado(empleado)}
              className="px-3 py-1.5 rounded-lg border border-[#8FA7D6] bg-white hover:bg-slate-50 text-[#18235C] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
            >
              <Power className="w-3.5 h-3.5 text-amber-600" />
              <span>Gestionar Estado</span>
            </button>

            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-lg border border-[#8FA7D6] bg-white hover:bg-slate-50 text-[#18235C] transition-colors cursor-pointer"
              title="Imprimir Expediente Digital"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-[#8FA7D6]/40 pb-px text-xs">
        {tabs.map(t => {
          const Icon = t.icon;
          const isAct = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3 py-2 font-bold rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                isAct
                  ? 'bg-white text-[#18235C] border-t-2 border-[#18235C] border-x border-t-[#18235C] shadow-2xs'
                  : 'text-slate-600 hover:text-[#18235C] hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isAct ? 'text-[#18235C]' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl border border-[#8FA7D6] p-6 shadow-xs min-h-[400px]">
        {/* TAB 1: IDENTIFICACIÓN */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-[#18235C] border-b border-slate-200 pb-2">
              Expediente Digital – Pestaña 1: Identificación y Datos Personales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Tipo y Número de Documento:</span>
                <span className="text-[#18235C] font-bold text-sm font-mono">
                  {empleado.persona?.tipoDocumento || empleado.tipoDocumento || 'CC'} {empleado.documento}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Nombres Completos:</span>
                <span className="text-[#18235C] font-bold">
                  {empleado.persona?.primerNombre || empleado.nombre.split(' ')[0]} {empleado.persona?.segundoNombre || ''}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Apellidos Completos:</span>
                <span className="text-[#18235C] font-bold">
                  {empleado.persona?.primerApellido || ''} {empleado.persona?.segundoApellido || ''}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Fecha de Nacimiento:</span>
                <span className="text-slate-800 font-semibold">{empleado.persona?.fechaNacimiento || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Lugar de Nacimiento:</span>
                <span className="text-slate-800 font-semibold">{empleado.persona?.lugarNacimiento || 'Bogotá D.C.'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Nacionalidad:</span>
                <span className="text-slate-800 font-semibold">{empleado.persona?.nacionalidad || 'Colombiana'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Sexo / Género:</span>
                <span className="text-slate-800 font-semibold">{empleado.persona?.genero || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Estado Civil:</span>
                <span className="text-slate-800 font-semibold">{empleado.persona?.estadoCivil || 'Soltero(a)'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Código Interno:</span>
                <span className="text-[#18235C] font-bold font-mono">{empleado.codigo || empleado.codigoInterno || '—'}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONTACTO & RESIDENCIA */}
        {activeTab === 'contacto' && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-[#18235C] border-b border-slate-200 pb-2">
              Expediente Digital – Pestaña 2: Contacto y Residencia Familiar
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Dirección Residencial:</span>
                <span className="text-slate-800 font-bold">{empleado.contacto?.direccion || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Departamento:</span>
                <span className="text-slate-800 font-semibold">{empleado.contacto?.departamento || 'Cundinamarca'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Ciudad / Municipio:</span>
                <span className="text-slate-800 font-semibold">{empleado.contacto?.ciudad || 'Bogotá D.C.'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Barrio:</span>
                <span className="text-slate-800 font-semibold">{empleado.contacto?.barrio || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Teléfono Celular:</span>
                <span className="text-[#18235C] font-bold font-mono">{empleado.contacto?.celular || empleado.telefono || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Correo Electrónico Personal:</span>
                <span className="text-slate-800 font-medium">{empleado.contacto?.correoPersonal || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 md:col-span-3">
                <span className="text-slate-500 block font-semibold">Correo Corporativo Institucional:</span>
                <span className="text-[#18235C] font-bold text-sm">{empleado.contacto?.correoCorporativo || empleado.email || '—'}</span>
              </div>
            </div>

            {/* Contacto Emergencia */}
            <div className="mt-4 p-4 rounded-xl border border-rose-200 bg-rose-50/60 space-y-2">
              <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                <span>Contacto Autorizado para Emergencias (SST)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div>
                  <span className="text-rose-900/80 block font-semibold">Nombre:</span>
                  <span className="text-rose-950 font-bold">{empleado.contacto?.contactoEmergenciaNombre || 'No registrado'}</span>
                </div>
                <div>
                  <span className="text-rose-900/80 block font-semibold">Parentesco:</span>
                  <span className="text-rose-950 font-bold">{empleado.contacto?.contactoEmergenciaParentesco || '—'}</span>
                </div>
                <div>
                  <span className="text-rose-900/80 block font-semibold">Teléfono de Emergencia:</span>
                  <span className="text-rose-950 font-bold font-mono">{empleado.contacto?.contactoEmergenciaTelefono || '—'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INFORMACIÓN LABORAL */}
        {activeTab === 'laboral' && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-[#18235C] border-b border-slate-200 pb-2">
              Expediente Digital – Pestaña 3: Información Laboral y Contractual
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Tipo de Contrato:</span>
                <span className="text-[#18235C] font-bold">{empleado.laboral?.tipoContrato || empleado.contrato?.tipo || 'Término indefinido'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Fecha de Ingreso:</span>
                <span className="text-slate-800 font-bold">{empleado.laboral?.fechaIngreso || empleado.contrato?.inicio || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Fecha de Vencimiento:</span>
                <span className="text-slate-800 font-semibold">{empleado.laboral?.fechaTerminacionContrato || empleado.contrato?.fin || 'Indefinido'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Modalidad de Trabajo:</span>
                <span className="text-slate-800 font-bold">{empleado.laboral?.modalidadTrabajo || 'Presencial'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Jornada Laboral:</span>
                <span className="text-slate-800 font-semibold">{empleado.laboral?.jornadaLaboral || 'Tiempo completo ordinario'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Sede / Lugar de Trabajo:</span>
                <span className="text-slate-800 font-semibold">{empleado.laboral?.lugarTrabajo || 'Sede Central - Bogotá'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Centro de Costos:</span>
                <span className="text-slate-800 font-mono font-semibold">{empleado.laboral?.centroCostos || 'CC-OPERACIONES'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Estado del Empleado:</span>
                <div>{estadoBadge()}</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CARGO & ESTRUCTURA */}
        {activeTab === 'estructura' && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-[#18235C] border-b border-slate-200 pb-2">
              Expediente Digital – Pestaña 4: Cargo y Estructura Organizacional
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Cargo Vigente:</span>
                <span className="text-[#18235C] font-bold text-sm">{cargoNombre}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Área / Dependencia:</span>
                <span className="text-slate-800 font-bold">{areaNombre}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Jefe Inmediato:</span>
                <span className="text-slate-800 font-bold">{empleado.laboral?.jefeInmediatoNombre || 'Dirección de Operaciones'}</span>
              </div>
            </div>

            {/* Historial de Cargos */}
            <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="font-bold text-xs text-[#18235C] uppercase tracking-wider flex items-center gap-1.5">
                <History className="w-4 h-4 text-[#18235C]" />
                <span>Historial de Cargos y Movimientos Internos</span>
              </h4>
              {(empleado.historialCargos || []).length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  El colaborador se mantiene en su cargo original desde la vinculación. Al realizar una promoción o traslado, el sistema conservará la vigencia histórica sin sobrescribir los datos previos.
                </p>
              ) : (
                <div className="divide-y divide-slate-200">
                  {empleado.historialCargos?.map((hc, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-[#18235C]">{hc.cargoNombre}</strong> · Área: {hc.areaNombre}
                        <div className="text-[11px] text-slate-500">Motivo: {hc.motivoCambio}</div>
                      </div>
                      <div className="text-right font-mono text-[11px] text-slate-600">
                        {hc.fechaInicio} ➔ {hc.fechaFin || 'Presente'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: COMPENSACIÓN */}
        {activeTab === 'compensacion' && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-[#18235C] border-b border-slate-200 pb-2">
              Expediente Digital – Pestaña 5: Compensación, Vigencias y Dispersión
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <span className="text-emerald-900 block font-semibold">Salario Básico Mensual:</span>
                <span className="text-emerald-950 font-extrabold text-base font-mono">
                  ${(empleado.compensacion?.salarioBasico || empleado.salarioBase || 0).toLocaleString('es-CO')} COP
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Tipo de Salario:</span>
                <span className="text-slate-800 font-bold">{empleado.compensacion?.tipoSalario || 'Ordinario'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Periodicidad de Pago:</span>
                <span className="text-slate-800 font-bold">{empleado.compensacion?.periodicidadPago || 'Quincenal'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Auxilio Legal de Transporte:</span>
                <span className={`font-bold ${empleado.compensacion?.auxilioTransporte ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {empleado.compensacion?.auxilioTransporte ? 'Sí aplica (Ley 15/1959)' : 'No aplica'}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Forma de Pago:</span>
                <span className="text-slate-800 font-semibold">{empleado.compensacion?.formaPago || 'Transferencia bancaria'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Entidad Bancaria:</span>
                <span className="text-[#18235C] font-bold">{empleado.compensacion?.banco || 'Bancolombia'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Tipo y Número de Cuenta:</span>
                <span className="text-[#18235C] font-mono font-bold">
                  {empleado.compensacion?.tipoCuenta || 'Ahorros'} · {empleado.compensacion?.numeroCuenta || '—'}
                </span>
              </div>
            </div>

            {/* Vigencias Salariales */}
            <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h4 className="font-bold text-xs text-[#18235C] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#18235C]" />
                <span>Historial Inmutable de Vigencias Salariales (CST)</span>
              </h4>
              {(empleado.compensacion?.historialVigencias || []).length === 0 ? (
                <p className="text-xs text-slate-500 italic">
                  Salario inicial de vinculación vigente. Toda modificación salarial posterior generará un registro con fecha, salario previo, motivo y usuario auditor.
                </p>
              ) : (
                <div className="divide-y divide-slate-200">
                  {empleado.compensacion?.historialVigencias.map((v, i) => (
                    <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-emerald-800 text-sm">
                          ${v.nuevoSalario.toLocaleString('es-CO')}
                        </span>
                        <span className="text-slate-500 ml-2">(Antes: ${v.salarioAnterior.toLocaleString('es-CO')})</span>
                        <div className="text-[11px] text-slate-600">Motivo: {v.motivoCambio} · Registrado por: {v.usuarioRegistro}</div>
                      </div>
                      <div className="text-right font-mono text-[11px] text-slate-500">
                        Vigencia desde: {v.fechaVigencia}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: SEGURIDAD SOCIAL */}
        {activeTab === 'seguridadSocial' && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-[#18235C] border-b border-slate-200 pb-2">
              Expediente Digital – Pestaña 6: Afiliaciones a Seguridad Social Integral
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">EPS (Salud):</span>
                <span className="text-[#18235C] font-bold text-sm">{empleado.seguridadSocial?.eps || 'SURA EPS'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">AFP (Fondo de Pensiones):</span>
                <span className="text-[#18235C] font-bold text-sm">{empleado.seguridadSocial?.fondoPensiones || 'Protección'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">ARL (Riesgos Laborales):</span>
                <span className="text-[#18235C] font-bold text-sm">{empleado.seguridadSocial?.arl || 'Positiva Compañía de Seguros'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Nivel de Riesgo ARL:</span>
                <span className="text-amber-900 font-bold font-mono">{empleado.seguridadSocial?.nivelRiesgoArl || 'V (6.960%)'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Caja de Compensación Familiar:</span>
                <span className="text-slate-800 font-bold">{empleado.seguridadSocial?.cajaCompensacion || 'Compensar'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Fondo de Cesantías:</span>
                <span className="text-slate-800 font-bold">{empleado.seguridadSocial?.fondoCesantias || 'Porvenir'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Fecha de Afiliación:</span>
                <span className="text-slate-800 font-semibold">{empleado.seguridadSocial?.fechaAfiliacion || empleado.laboral?.fechaIngreso || '—'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Estado de Afiliación:</span>
                <span className="text-emerald-700 font-bold">{empleado.seguridadSocial?.estadoAfiliacion || 'Activa'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block font-semibold">Tipo de Cotizante:</span>
                <span className="text-slate-800 font-semibold">{empleado.seguridadSocial?.tipoAfiliacion || 'Cotizante Dependiente'}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: INFORMACIÓN ACADÉMICA */}
        {activeTab === 'academica' && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-[#18235C] border-b border-slate-200 pb-2">
              Expediente Digital – Pestaña 7: Formación Académica y Títulos
            </h3>
            {(empleado.estudios || []).length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-500 text-xs">
                No registra títulos formales cargados.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {empleado.estudios?.map((est, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#18235C] text-sm">{est.tituloObtenido}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        {est.nivelEducativo}
                      </span>
                    </div>
                    <p className="text-slate-700 font-semibold">{est.institucion} {est.ciudad ? `· ${est.ciudad}` : ''}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span>Período: {est.fechaInicio} al {est.fechaFin}</span>
                      {est.tarjetaProfesional && (
                        <span className="text-slate-800 font-bold">TP: {est.tarjetaProfesional}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 8: EXPERIENCIA LABORAL */}
        {activeTab === 'experiencia' && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-[#18235C] border-b border-slate-200 pb-2">
              Expediente Digital – Pestaña 8: Experiencia Laboral y Trayectoria
            </h3>
            {(empleado.experiencias || []).length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-lg text-center text-slate-500 text-xs">
                No registra historial de experiencias laborales previas.
              </div>
            ) : (
              <div className="space-y-3">
                {empleado.experiencias?.map((exp, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-sm text-[#18235C]">{exp.cargo}</strong>
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px]">
                        {exp.mesesExperiencia || 12} meses de trayectoria
                      </span>
                    </div>
                    <div className="text-slate-700 font-semibold">{exp.empresa} ({exp.fechaIngreso} al {exp.fechaRetiro})</div>
                    <p className="text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                      {exp.funcionesPrincipales}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 9: INFORMACIÓN SST */}
        {activeTab === 'sst' && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-[#18235C] border-b border-slate-200 pb-2 flex items-center justify-between">
              <span>Expediente Digital – Pestaña 9: Seguridad y Salud en el Trabajo (SG-SST)</span>
              <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                Confidencialidad Médica (Res. 2346/2007)
              </span>
            </h3>

            {esRolNomina ? (
              <div className="p-6 bg-amber-50 rounded-xl border border-amber-200 text-center space-y-2">
                <Lock className="w-8 h-8 text-amber-600 mx-auto" />
                <h4 className="font-bold text-sm text-amber-950">Acceso Restringido a Información Médica Sensible</h4>
                <p className="text-xs text-amber-800 max-w-md mx-auto">
                  Por disposición legal del Ministerio de Trabajo y la Resolución 2346 de 2007, el módulo de Nómina tiene acceso únicamente a certificados de aptitud pero no al expediente médico ocupacional detallado.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-emerald-950 block">Concepto de Aptitud Laboral Vigente:</span>
                    <span className="font-semibold text-emerald-800">{empleado.sst?.conceptoAptitudVigente || 'Apto sin restricciones'}</span>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-[#18235C] uppercase tracking-wider">
                    Exámenes Médicos Ocupacionales Realizados
                  </h4>
                  {(empleado.sst?.examenesOcupacionales || []).map((ex, i) => (
                    <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#18235C]">Examen Ocupacional de {ex.tipoExamen}</span>
                        <span className="font-mono text-slate-500">{ex.fecha}</span>
                      </div>
                      <p className="text-slate-700"><strong>IPS Evaluadora:</strong> {ex.entidadIps}</p>
                      <p className="text-slate-700"><strong>Concepto:</strong> {ex.conceptoAptitud}</p>
                      {ex.restricciones && <p className="text-slate-700"><strong>Restricciones:</strong> {ex.restricciones}</p>}
                      {ex.recomendaciones && <p className="text-slate-700"><strong>Recomendaciones:</strong> {ex.recomendaciones}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 10: DOCUMENTOS */}
        {activeTab === 'documentos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-base text-[#18235C]">
                Expediente Digital – Pestaña 10: Repositorio de Documentos
              </h3>
              <button
                type="button"
                onClick={() => setModalSubirDoc(true)}
                className="px-3 py-1.5 rounded-lg bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adjuntar Documento</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600 bg-slate-50">
                    <th className="py-2.5 px-3 font-semibold">Tipo Documental</th>
                    <th className="py-2.5 px-3 font-semibold">Archivo</th>
                    <th className="py-2.5 px-3 font-semibold">Fecha Carga</th>
                    <th className="py-2.5 px-3 font-semibold">Estado</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(empleado.documentos || []).map((doc, idx) => (
                    <tr key={doc.id || idx} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3 font-bold text-[#18235C]">{doc.tipoDocumento}</td>
                      <td className="py-3 px-3 text-slate-700 font-mono text-[11px]">{doc.nombreArchivo}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono">{doc.fechaCarga}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {doc.estado || 'Vigente'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDocModalPreview(doc)}
                            className="p-1 text-[#18235C] hover:bg-slate-100 rounded cursor-pointer"
                            title="Visualizar documento"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => alert(`Descargando ${doc.nombreArchivo}...`)}
                            className="p-1 text-[#18235C] hover:bg-slate-100 rounded cursor-pointer"
                            title="Descargar documento"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(empleado.documentos || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No hay documentos adjuntos en el expediente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 11: HISTORIAL LABORAL */}
        {activeTab === 'historial' && (
          <div className="space-y-4">
            <h3 className="font-bold text-base text-[#18235C] border-b border-slate-200 pb-2 flex items-center justify-between">
              <span>Expediente Digital – Historial Laboral y Bitácora de Eventos</span>
              <span className="text-[11px] font-semibold text-slate-500">Inmutable · Auditoría Permanente</span>
            </h3>

            <div className="space-y-3">
              {(empleado.historialLaboral || []).map((ev, i) => (
                <div key={ev.id || i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#18235C] text-sm">{ev.titulo}</span>
                    <span className="font-mono text-slate-500 text-[11px]">{ev.fechaHora}</span>
                  </div>
                  <p className="text-slate-700"><strong>Acción:</strong> {ev.accion} · <strong>Usuario:</strong> {ev.usuario}</p>
                  {ev.motivo && <p className="text-slate-600 italic"><strong>Motivo:</strong> {ev.motivo}</p>}
                  {ev.valorAnterior && <p className="text-slate-500"><strong>Antes:</strong> {ev.valorAnterior}</p>}
                  {ev.valorNuevo && <p className="text-[#18235C] font-semibold"><strong>Nuevo:</strong> {ev.valorNuevo}</p>}
                </div>
              ))}
              {(empleado.historialLaboral || []).length === 0 && (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No hay eventos registrados en la bitácora aún.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 12: SOLICITUDES & EVALUACIONES */}
        {activeTab === 'solicitudes' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-base text-[#18235C] border-b border-slate-200 pb-2 mb-3">
                Solicitudes y Novedades del Colaborador
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600 bg-slate-50">
                      <th className="py-2.5 px-3">Tipo</th>
                      <th className="py-2.5 px-3">Fechas</th>
                      <th className="py-2.5 px-3">Motivo</th>
                      <th className="py-2.5 px-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {solicitudes.map(s => (
                      <tr key={s.id}>
                        <td className="py-2.5 px-3 font-bold text-[#18235C]">{s.tipo}</td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">{s.inicio} al {s.fin}</td>
                        <td className="py-2.5 px-3 text-slate-700">{s.motivo}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            s.estado === 'Aprobada' ? 'bg-emerald-50 text-emerald-800' :
                            s.estado === 'Rechazada' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-800'
                          }`}>
                            {s.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {solicitudes.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-500">Sin solicitudes registradas.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Subir Documento */}
      {modalSubirDoc && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#8FA7D6] max-w-md w-full p-5 shadow-xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-[#18235C]">Adjuntar Documento al Expediente</h3>
            <form onSubmit={handleSubirDocumento} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tipo de Documento *</label>
                <select
                  value={nuevoDocTipo}
                  onChange={e => setNuevoDocTipo(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="Documento de Identidad">Documento de Identidad</option>
                  <option value="Hoja de Vida">Hoja de Vida</option>
                  <option value="Contrato Laboral">Contrato Laboral</option>
                  <option value="Otrosí">Otrosí</option>
                  <option value="Certificado Académico">Certificado Académico</option>
                  <option value="Certificación Laboral">Certificación Laboral</option>
                  <option value="Afiliación EPS">Afiliación EPS</option>
                  <option value="Afiliación AFP">Afiliación AFP</option>
                  <option value="Afiliación ARL">Afiliación ARL</option>
                  <option value="Examen Ocupacional">Examen Ocupacional</option>
                  <option value="Certificación Bancaria">Certificación Bancaria</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del Archivo / Referencia *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Contrato_Laboral_2026.pdf"
                  value={nuevoDocNombre}
                  onChange={e => setNuevoDocNombre(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  placeholder="Notas adicionales..."
                  value={nuevoDocObs}
                  onChange={e => setNuevoDocObs(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalSubirDoc(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-[#18235C] hover:bg-[#101740] text-white font-bold"
                >
                  Guardar Documento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Preview Documento */}
      {docModalPreview && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-[#8FA7D6] max-w-lg w-full p-6 shadow-xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-bold text-sm text-[#18235C]">{docModalPreview.nombreArchivo}</h3>
              <button onClick={() => setDocModalPreview(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg space-y-2 font-mono text-[11px]">
              <p><strong>Tipo:</strong> {docModalPreview.tipoDocumento}</p>
              <p><strong>Fecha de Carga:</strong> {docModalPreview.fechaCarga}</p>
              <p><strong>Usuario Responsable:</strong> {docModalPreview.usuarioCarga}</p>
              <p><strong>Estado:</strong> {docModalPreview.estado}</p>
              {docModalPreview.observaciones && <p><strong>Observaciones:</strong> {docModalPreview.observaciones}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDocModalPreview(null)}
                className="px-3.5 py-1.5 rounded border border-slate-300 text-slate-700"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => alert(`Descargando ${docModalPreview.nombreArchivo}...`)}
                className="px-4 py-1.5 rounded bg-[#18235C] hover:bg-[#101740] text-white font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
