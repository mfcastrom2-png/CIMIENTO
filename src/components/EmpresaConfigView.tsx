import React, { useState } from 'react';
import {
  Building2,
  Save,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Globe,
  Briefcase,
  UserCheck,
  HardHat,
  RefreshCw,
  Building,
  RotateCcw,
  Sparkles,
  Info,
  Upload,
  Image as ImageIcon,
  Trash2,
  HardDrive,
  Plus,
  Edit3
} from 'lucide-react';
import { ConfiguracionEmpresa, UsuarioSistema, CentroTrabajo } from '../types';
import { initialEmpresa, uid } from '../data/initialData';
import { 
  CCF_COLOMBIA, 
  DEPARTAMENTOS_COLOMBIA, 
  getMunicipiosPorDepartamento, 
  getDepartamentoPorMunicipio 
} from '../data/colombiaData';
import { formatDriveDirectUrl, isGoogleDriveUrl } from '../utils/driveUtils';

interface EmpresaConfigViewProps {
  empresa: ConfiguracionEmpresa;
  onUpdateEmpresa: (empresa: ConfiguracionEmpresa) => Promise<void>;
  currentUser?: UsuarioSistema | null;
  isSuperAdmin?: boolean;
}

// Algoritmo oficial DIAN Módulo 11 para cálculo del Dígito de Verificación de NIT en Colombia
export function calcularDigitoVerificacionNIT(nitStr: string): string {
  const nitLimpio = (nitStr || '').replace(/\D/g, '');
  if (!nitLimpio) return '';

  const primos = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  let suma = 0;
  const longitud = nitLimpio.length;

  for (let i = 0; i < longitud; i++) {
    const digito = parseInt(nitLimpio[longitud - 1 - i], 10);
    suma += digito * primos[i];
  }

  const residuo = suma % 11;
  if (residuo === 0 || residuo === 1) {
    return residuo.toString();
  }
  return (11 - residuo).toString();
}

const NIVELES_RIESGO_ARL = [
  { nivel: 'I', tarifa: '0.522%', descripcion: 'Riesgo Mínimo (Comercial, financiero, oficinas, actividades administrativas)' },
  { nivel: 'II', tarifa: '1.044%', descripcion: 'Riesgo Bajo (Manufactura ligera, droguerías, comercio al por menor)' },
  { nivel: 'III', tarifa: '2.436%', descripcion: 'Riesgo Medio (Procesos industriales, alimentos, talleres automotrices)' },
  { nivel: 'IV', tarifa: '4.350%', descripcion: 'Riesgo Alto (Transporte, obras civiles, manufactura pesada, aceites)' },
  { nivel: 'V', tarifa: '6.960%', descripcion: 'Riesgo Máximo (Telecomunicaciones en alturas, minería, construcción, tendido de fibra/redes)' }
] as const;

const ARL_LIST = [
  'Seguros Bolívar',
  'Sura ARL',
  'Positiva Compañía de Seguros',
  'Colmena Seguros',
  'Axa Colpatria ARL',
  'La Equidad Seguros ARL',
  'Aurora Seguros de Vida'
];

const CCF_LIST = CCF_COLOMBIA;

export const EmpresaConfigView: React.FC<EmpresaConfigViewProps> = ({
  empresa: empresaProp,
  onUpdateEmpresa,
  currentUser,
  isSuperAdmin = false
}) => {
  const [formData, setFormData] = useState<ConfiguracionEmpresa>(() => {
    return empresaProp || initialEmpresa;
  });

  const [tabActiva, setTabActiva] = useState<'legal' | 'representante' | 'contacto' | 'seguridad' | 'sst' | 'identidad' | 'centros'>('legal');
  const [guardando, setGuardando] = useState(false);
  const [modalConfirmReset, setModalConfirmReset] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Estado para gestión de Centros de Trabajo (Sedes Operativas)
  const [modalCentroOpen, setModalCentroOpen] = useState(false);
  const [ctAEditar, setCtAEditar] = useState<CentroTrabajo | null>(null);
  const [ctNombre, setCtNombre] = useState('');
  const [ctCodigo, setCtCodigo] = useState('');
  const [ctClaseRiesgo, setCtClaseRiesgo] = useState<'I' | 'II' | 'III' | 'IV' | 'V'>('I');
  const [ctDepartamento, setCtDepartamento] = useState('Cundinamarca');
  const [ctCiudad, setCtCiudad] = useState('Bogotá D.C.');
  const [ctDireccion, setCtDireccion] = useState('');
  const [ctTelefono, setCtTelefono] = useState('');
  const [ctEsPrincipal, setCtEsPrincipal] = useState(false);

  const handleAbrirModalCentro = (ct?: CentroTrabajo) => {
    if (ct) {
      setCtAEditar(ct);
      setCtNombre(ct.nombre);
      setCtCodigo(ct.codigo || '');
      setCtClaseRiesgo(ct.claseRiesgoARL);
      setCtDepartamento(ct.departamento);
      setCtCiudad(ct.ciudad);
      setCtDireccion(ct.direccion);
      setCtTelefono(ct.telefono || '');
      setCtEsPrincipal(ct.esSedePrincipal || false);
    } else {
      setCtAEditar(null);
      setCtNombre('');
      setCtCodigo(`CT-${formData.nit.slice(-3) || '001'}-0${(formData.centrosTrabajo?.length || 0) + 1}`);
      setCtClaseRiesgo('V');
      setCtDepartamento(formData.contacto?.departamento || 'Cundinamarca');
      setCtCiudad(formData.contacto?.ciudad || 'Bogotá D.C.');
      setCtDireccion('');
      setCtTelefono(formData.contacto?.telefonoFijo || '');
      setCtEsPrincipal(false);
    }
    setModalCentroOpen(true);
  };

  const handleGuardarCentroTrabajo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctNombre.trim()) return;

    const listaActual = formData.centrosTrabajo || [];
    let nuevaLista: CentroTrabajo[];

    if (ctEsPrincipal) {
      // Si se marca como principal, desmarcar otras
      listaActual.forEach(c => c.esSedePrincipal = false);
    }

    if (ctAEditar) {
      nuevaLista = listaActual.map(c => {
        if (c.id === ctAEditar.id) {
          return {
            ...c,
            nombre: ctNombre.trim(),
            codigo: ctCodigo.trim(),
            claseRiesgoARL: ctClaseRiesgo,
            departamento: ctDepartamento,
            ciudad: ctCiudad,
            direccion: ctDireccion.trim(),
            telefono: ctTelefono.trim(),
            esSedePrincipal: ctEsPrincipal
          };
        }
        return c;
      });
    } else {
      const nuevoCT: CentroTrabajo = {
        id: uid(),
        nombre: ctNombre.trim(),
        codigo: ctCodigo.trim(),
        claseRiesgoARL: ctClaseRiesgo,
        departamento: ctDepartamento,
        ciudad: ctCiudad,
        direccion: ctDireccion.trim(),
        telefono: ctTelefono.trim(),
        esSedePrincipal: ctEsPrincipal
      };
      nuevaLista = [...listaActual, nuevoCT];
    }

    setFormData(prev => ({
      ...prev,
      centrosTrabajo: nuevaLista
    }));
    setModalCentroOpen(false);
  };

  const handleEliminarCentroTrabajo = (id: string) => {
    setFormData(prev => ({
      ...prev,
      centrosTrabajo: (prev.centrosTrabajo || []).filter(c => c.id !== id)
    }));
  };

  // Verificación dinámica del DV
  const dvCalculado = calcularDigitoVerificacionNIT(formData.nit);
  const dvCoincide = !formData.nit || (formData.digitoVerificacion === dvCalculado);

  const handleCalcularDV = () => {
    if (dvCalculado) {
      setFormData(prev => ({ ...prev, digitoVerificacion: dvCalculado }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeError(null);
    setMensajeExito(null);

    if (!formData.razonSocial.trim()) {
      setMensajeError('La razón social de la empresa es obligatoria.');
      setTabActiva('legal');
      return;
    }

    if (!formData.nit.trim()) {
      setMensajeError('El NIT de la empresa es obligatorio.');
      setTabActiva('legal');
      return;
    }

    setGuardando(true);
    try {
      const empresaParaGuardar: ConfiguracionEmpresa = {
        ...formData,
        fechaActualizacion: new Date().toISOString().slice(0, 10),
        actualizadoPor: currentUser?.nombre || 'Administrador GH'
      };

      await onUpdateEmpresa(empresaParaGuardar);
      setMensajeExito('Los datos básicos de la empresa se han guardado y sincronizado exitosamente.');
      setTimeout(() => setMensajeExito(null), 5000);
    } catch (err: any) {
      setMensajeError('Ocurrió un error al persistir los datos de la empresa: ' + (err?.message || 'Error en servidor'));
    } finally {
      setGuardando(false);
    }
  };

  const handleRestablecerValores = () => {
    setModalConfirmReset(true);
  };

  const handleConfirmarReset = () => {
    setFormData(initialEmpresa);
    setModalConfirmReset(false);
    setMensajeExito('Valores iniciales restaurados. Recuerde hacer clic en Guardar Cambios para confirmar.');
    setTimeout(() => setMensajeExito(null), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera Principal del Módulo */}
      <div className="bg-white p-6 rounded-2xl border border-[#8FA7D6] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#18235C] text-white flex items-center justify-center shrink-0 shadow-md">
            <Building2 className="w-6 h-6 text-[#00FF00]" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                Modelo Uni-Empresa Activo
              </span>
              <span className="text-xs text-slate-500 font-mono">
                NIT: {formData.nit}-{formData.digitoVerificacion}
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#18235C] tracking-tight">
              Datos Básicos & Configuración de la Empresa
            </h1>
            <p className="text-xs sm:text-sm text-[#282829] mt-0.5 max-w-2xl">
              Información legal, institucional y de seguridad social de la organización titular para la cual se activa el ecosistema de Gestión Humana y SG-SST.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleRestablecerValores}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Restablecer datos sugeridos de B Group"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Valores Sugeridos</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={guardando}
            className="px-5 py-2 text-xs font-bold bg-[#18235C] hover:bg-[#101740] text-white rounded-lg flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {guardando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#00FF00]" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-[#00FF00]" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Alertas de Feedback */}
      {mensajeExito && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
          <button
            onClick={() => setMensajeExito(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {mensajeError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center justify-between shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{mensajeError}</span>
          </div>
          <button
            onClick={() => setMensajeError(null)}
            className="text-rose-700 hover:text-rose-950 font-bold px-2 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Ficha Resumen Ejecutivo de la Empresa */}
      <div className="bg-[#18235C] text-white p-5 sm:p-6 rounded-2xl shadow-lg border border-[#101740]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-white/10 border-2 border-[#00FF00]/60 flex items-center justify-center font-black text-2xl text-[#00FF00] shrink-0 shadow-inner">
              {formData.nombreComercial ? formData.nombreComercial.charAt(0) : 'B'}
            </div>
            <div>
              <span className="text-[10px] text-[#00FF00] font-bold uppercase tracking-widest block">
                {formData.tipoSociedad || 'Sociedad Comercial'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black font-serif tracking-tight leading-tight">
                {formData.razonSocial || 'Nombre de la Organización'}
              </h2>
              <div className="text-xs text-[#8FA7D6] flex flex-wrap items-center gap-3 mt-1">
                <span>NIT: <strong>{formData.nit}-{formData.digitoVerificacion}</strong></span>
                <span>•</span>
                <span>{formData.contacto?.ciudad}, {formData.contacto?.departamento}</span>
                <span>•</span>
                <span>ARL: <strong>{formData.seguridadSocial?.arl} (Clase {formData.seguridadSocial?.nivelRiesgoPrincipal})</strong></span>
              </div>
            </div>
          </div>

          <div className="bg-[#101740]/80 p-3.5 rounded-xl border border-[#8FA7D6]/30 text-xs space-y-1 lg:max-w-xs shrink-0">
            <div className="text-[10px] text-[#8FA7D6] uppercase font-bold">Representante Legal:</div>
            <div className="font-bold text-white truncate">{formData.representanteLegal?.nombre}</div>
            <div className="text-[11px] text-[#8FA7D6]">{formData.representanteLegal?.cargo}</div>
            <div className="text-[10px] text-[#8FA7D6] font-mono">{formData.contacto?.emailCorporativo}</div>
          </div>
        </div>
      </div>

      {/* Pestañas de Navegación por Secciones */}
      <div className="bg-white rounded-2xl border border-[#8FA7D6] shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-[#8FA7D6] px-4 pt-3 flex flex-wrap gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setTabActiva('legal')}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              tabActiva === 'legal'
                ? 'bg-white border-[#18235C] text-[#18235C] shadow-2xs font-extrabold'
                : 'border-transparent text-[#282829]/70 hover:text-[#18235C]'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>1. Razón Social & Legal</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('representante')}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              tabActiva === 'representante'
                ? 'bg-white border-[#18235C] text-[#18235C] shadow-2xs font-extrabold'
                : 'border-transparent text-[#282829]/70 hover:text-[#18235C]'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>2. Representante Legal</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('contacto')}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              tabActiva === 'contacto'
                ? 'bg-white border-[#18235C] text-[#18235C] shadow-2xs font-extrabold'
                : 'border-transparent text-[#282829]/70 hover:text-[#18235C]'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>3. Ubicación & Contacto</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('seguridad')}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              tabActiva === 'seguridad'
                ? 'bg-white border-[#18235C] text-[#18235C] shadow-2xs font-extrabold'
                : 'border-transparent text-[#282829]/70 hover:text-[#18235C]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>4. Seguridad Social & ARL</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('sst')}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              tabActiva === 'sst'
                ? 'bg-white border-[#18235C] text-[#18235C] shadow-2xs font-extrabold'
                : 'border-transparent text-[#282829]/70 hover:text-[#18235C]'
            }`}
          >
            <HardHat className="w-4 h-4" />
            <span>5. Parámetros SG-SST</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('identidad')}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              tabActiva === 'identidad'
                ? 'bg-white border-[#18235C] text-[#18235C] shadow-2xs font-extrabold'
                : 'border-transparent text-[#282829]/70 hover:text-[#18235C]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>6. Identidad & Misión</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('centros')}
            className={`px-4 py-2.5 rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              tabActiva === 'centros'
                ? 'bg-white border-[#18235C] text-[#18235C] shadow-2xs font-extrabold'
                : 'border-transparent text-[#282829]/70 hover:text-[#18235C]'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>7. Centros de Trabajo / Sedes (SG-SST)</span>
          </button>
        </div>

        {/* Formulario Principal */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs">
          
          {/* SECCIÓN 1: DATOS LEGALES E IDENTIFICACIÓN */}
          {tabActiva === 'legal' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-[#18235C] flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#18235C]" />
                  Identificación Tributaria, Razón Social y Registro Mercantil
                </h3>
                <p className="text-[11px] text-slate-500">
                  Datos oficiales registrados ante la DIAN y la Cámara de Comercio de Colombia.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#18235C] mb-1">
                    Razón Social Oficial (Nombre Legal Registrado) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.razonSocial}
                    onChange={e => setFormData({ ...formData, razonSocial: e.target.value })}
                    placeholder="Ej: B GROUP INGENIERIA S.A.S."
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold text-sm text-[#18235C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Nombre Comercial / Sigla Breve
                  </label>
                  <input
                    type="text"
                    value={formData.nombreComercial}
                    onChange={e => setFormData({ ...formData, nombreComercial: e.target.value })}
                    placeholder="Ej: B GROUP"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold text-[#18235C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    NIT (Número de Identificación Tributaria) *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.nit}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData({
                          ...formData,
                          nit: val,
                          digitoVerificacion: calcularDigitoVerificacionNIT(val) || formData.digitoVerificacion
                        });
                      }}
                      placeholder="901.458.789"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono font-bold text-sm text-[#18235C]"
                    />
                    <div className="w-14">
                      <input
                        type="text"
                        maxLength={1}
                        value={formData.digitoVerificacion}
                        onChange={e => setFormData({ ...formData, digitoVerificacion: e.target.value })}
                        placeholder="DV"
                        title="Dígito de Verificación DIAN"
                        className="w-full px-2 py-2 text-center bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono font-extrabold text-sm text-[#18235C]"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] mt-1 text-slate-500">
                    <span>DV calculado DIAN: <strong>{dvCalculado || '—'}</strong></span>
                    {!dvCoincide && (
                      <button
                        type="button"
                        onClick={handleCalcularDV}
                        className="text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                      >
                        Aplicar DV ({dvCalculado})
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Tipo de Sociedad</label>
                  <select
                    value={formData.tipoSociedad}
                    onChange={e => setFormData({ ...formData, tipoSociedad: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium text-[#18235C]"
                  >
                    <option value="Sociedad por Acciones Simplificada (S.A.S.)">Sociedad por Acciones Simplificada (S.A.S.)</option>
                    <option value="Sociedad Anónima (S.A.)">Sociedad Anónima (S.A.)</option>
                    <option value="Sociedad Limitada (Ltda.)">Sociedad Limitada (Ltda.)</option>
                    <option value="Empresa Unipersonal (E.U.)">Empresa Unipersonal (E.U.)</option>
                    <option value="Sociedad en Comandita">Sociedad en Comandita</option>
                    <option value="Persona Natural con Negocio">Persona Natural con Negocio</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Tipo de Persona</label>
                  <select
                    value={formData.tipoPersona}
                    onChange={e => setFormData({ ...formData, tipoPersona: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium text-[#18235C]"
                  >
                    <option value="Jurídica">Persona Jurídica</option>
                    <option value="Natural">Persona Natural</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Cámara de Comercio</label>
                  <input
                    type="text"
                    value={formData.camaraComercio || ''}
                    onChange={e => setFormData({ ...formData, camaraComercio: e.target.value })}
                    placeholder="Ej: Cámara de Comercio de Bogotá"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Matrícula Mercantil</label>
                  <input
                    type="text"
                    value={formData.matriculaMercantil || ''}
                    onChange={e => setFormData({ ...formData, matriculaMercantil: e.target.value })}
                    placeholder="No. de Matrícula"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Fecha de Constitución</label>
                  <input
                    type="date"
                    value={formData.fechaConstitucion || ''}
                    onChange={e => setFormData({ ...formData, fechaConstitucion: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#18235C] mb-1">
                    Actividad Económica Principal (según RUT)
                  </label>
                  <input
                    type="text"
                    value={formData.actividadEconomica}
                    onChange={e => setFormData({ ...formData, actividadEconomica: e.target.value })}
                    placeholder="Ej: Actividades de ingeniería, telecomunicaciones y transmisión de datos"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Código CIIU Principal</label>
                  <input
                    type="text"
                    value={formData.codigoCiiu}
                    onChange={e => setFormData({ ...formData, codigoCiiu: e.target.value })}
                    placeholder="Ej: 6110"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 2: REPRESENTANTE LEGAL */}
          {tabActiva === 'representante' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-[#18235C] flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#18235C]" />
                  Representación Legal y Firmas Autorizadas
                </h3>
                <p className="text-[11px] text-slate-500">
                  Firma autorizada para contratos laborales, actas de SG-SST y reportes oficiales ante autoridades laborales (CST / Mintrabajo / UGPP).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#18235C] mb-1">
                    Nombre Completo del Representante Legal *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.representanteLegal?.nombre || ''}
                    onChange={e => setFormData({
                      ...formData,
                      representanteLegal: {
                        ...formData.representanteLegal,
                        nombre: e.target.value
                      }
                    })}
                    placeholder="Ej: Mauricio Castro Mendoza"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold text-sm text-[#18235C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Cargo Oficial</label>
                  <input
                    type="text"
                    value={formData.representanteLegal?.cargo || ''}
                    onChange={e => setFormData({
                      ...formData,
                      representanteLegal: {
                        ...formData.representanteLegal,
                        cargo: e.target.value
                      }
                    })}
                    placeholder="Ej: Gerente General"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Tipo de Documento</label>
                  <select
                    value={formData.representanteLegal?.tipoDocumento || 'C.C.'}
                    onChange={e => setFormData({
                      ...formData,
                      representanteLegal: {
                        ...formData.representanteLegal,
                        tipoDocumento: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium"
                  >
                    <option value="C.C.">Cédula de Ciudadanía (C.C.)</option>
                    <option value="C.E.">Cédula de Extranjería (C.E.)</option>
                    <option value="Pasaporte">Pasaporte</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Número de Documento</label>
                  <input
                    type="text"
                    value={formData.representanteLegal?.numeroDocumento || ''}
                    onChange={e => setFormData({
                      ...formData,
                      representanteLegal: {
                        ...formData.representanteLegal,
                        numeroDocumento: e.target.value
                      }
                    })}
                    placeholder="Ej: 79.845.120"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Teléfono Directo</label>
                  <input
                    type="text"
                    value={formData.representanteLegal?.telefono || ''}
                    onChange={e => setFormData({
                      ...formData,
                      representanteLegal: {
                        ...formData.representanteLegal,
                        telefono: e.target.value
                      }
                    })}
                    placeholder="+57 (601) 745-8900"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#18235C] mb-1">Correo Electrónico Institucional</label>
                  <input
                    type="email"
                    value={formData.representanteLegal?.email || ''}
                    onChange={e => setFormData({
                      ...formData,
                      representanteLegal: {
                        ...formData.representanteLegal,
                        email: e.target.value
                      }
                    })}
                    placeholder="gerencia@bgroup.com.co"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 3: UBICACIÓN Y CONTACTO */}
          {tabActiva === 'contacto' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-[#18235C] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#18235C]" />
                  Sede Principal, Dirección Postal y Canales de Comunicación
                </h3>
                <p className="text-[11px] text-slate-500">
                  Ubicación legal de la sede operativa principal y vías de notificación oficial.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#18235C] mb-1">
                    Dirección Física Principal *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contacto?.direccion || ''}
                    onChange={e => setFormData({
                      ...formData,
                      contacto: {
                        ...formData.contacto,
                        direccion: e.target.value
                      }
                    })}
                    placeholder="Ej: Carrera 7 No. 71-21, Torre B, Piso 8"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold text-[#18235C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Departamento (Colombia) *</label>
                  <select
                    value={formData.contacto?.departamento || 'Cundinamarca'}
                    onChange={e => {
                      const nuevoDep = e.target.value;
                      const munList = getMunicipiosPorDepartamento(nuevoDep);
                      setFormData({
                        ...formData,
                        contacto: {
                          ...formData.contacto,
                          departamento: nuevoDep,
                          ciudad: munList.length > 0 ? munList[0] : ''
                        }
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold text-[#18235C]"
                  >
                    {DEPARTAMENTOS_COLOMBIA.map(d => (
                      <option key={d.nombre} value={d.nombre}>{d.nombre}</option>
                    ))}
                    {formData.contacto?.departamento && !DEPARTAMENTOS_COLOMBIA.some(d => d.nombre === formData.contacto?.departamento) && (
                      <option value={formData.contacto.departamento}>{formData.contacto.departamento}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Ciudad / Municipio (Colombia) *</label>
                  <select
                    value={formData.contacto?.ciudad || ''}
                    onChange={e => setFormData({
                      ...formData,
                      contacto: {
                        ...formData.contacto,
                        ciudad: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
                  >
                    {(() => {
                      const dep = formData.contacto?.departamento || 'Cundinamarca';
                      const munis = getMunicipiosPorDepartamento(dep);
                      const currentVal = formData.contacto?.ciudad;
                      const hasCurrent = currentVal && munis.includes(currentVal);
                      return (
                        <>
                          {currentVal && !hasCurrent && (
                            <option value={currentVal}>{currentVal}</option>
                          )}
                          {munis.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </>
                      );
                    })()}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">País</label>
                  <input
                    type="text"
                    value={formData.contacto?.pais || 'Colombia'}
                    onChange={e => setFormData({
                      ...formData,
                      contacto: {
                        ...formData.contacto,
                        pais: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Código Postal</label>
                  <input
                    type="text"
                    value={formData.contacto?.codigoPostal || ''}
                    onChange={e => setFormData({
                      ...formData,
                      contacto: {
                        ...formData.contacto,
                        codigoPostal: e.target.value
                      }
                    })}
                    placeholder="110221"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Teléfono Fijo / PBX</label>
                  <input
                    type="text"
                    value={formData.contacto?.telefonoFijo || ''}
                    onChange={e => setFormData({
                      ...formData,
                      contacto: {
                        ...formData.contacto,
                        telefonoFijo: e.target.value
                      }
                    })}
                    placeholder="+57 (601) 745-8900"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Línea Celular Corporativa</label>
                  <input
                    type="text"
                    value={formData.contacto?.celular || ''}
                    onChange={e => setFormData({
                      ...formData,
                      contacto: {
                        ...formData.contacto,
                        celular: e.target.value
                      }
                    })}
                    placeholder="+57 310 892 4567"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Sitio Web Oficial</label>
                  <input
                    type="url"
                    value={formData.contacto?.sitioWeb || ''}
                    onChange={e => setFormData({
                      ...formData,
                      contacto: {
                        ...formData.contacto,
                        sitioWeb: e.target.value
                      }
                    })}
                    placeholder="https://www.bgroup.com.co"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Correo Electrónico General</label>
                  <input
                    type="email"
                    value={formData.contacto?.emailCorporativo || ''}
                    onChange={e => setFormData({
                      ...formData,
                      contacto: {
                        ...formData.contacto,
                        emailCorporativo: e.target.value
                      }
                    })}
                    placeholder="contacto@bgroup.com.co"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Correo de Gestión Humana</label>
                  <input
                    type="email"
                    value={formData.contacto?.emailContactoGH || ''}
                    onChange={e => setFormData({
                      ...formData,
                      contacto: {
                        ...formData.contacto,
                        emailContactoGH: e.target.value
                      }
                    })}
                    placeholder="gestionhumana@bgroup.com.co"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 4: SEGURIDAD SOCIAL Y ARL */}
          {tabActiva === 'seguridad' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-[#18235C] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#18235C]" />
                  Entidades de Seguridad Social Integral y Clasificación de Riesgo ARL
                </h3>
                <p className="text-[11px] text-slate-500">
                  Configuración patronal de aportes de ley (Decreto 1295 de 1994, Decreto 1072 de 2015).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    ARL Afiliada (Administradora de Riesgos Laborales) *
                  </label>
                  <select
                    value={formData.seguridadSocial?.arl || ''}
                    onChange={e => setFormData({
                      ...formData,
                      seguridadSocial: {
                        ...formData.seguridadSocial,
                        arl: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
                  >
                    {ARL_LIST.map(arl => (
                      <option key={arl} value={arl}>{arl}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Clase de Riesgo Principal de la Empresa *
                  </label>
                  <select
                    value={formData.seguridadSocial?.nivelRiesgoPrincipal || 'V'}
                    onChange={e => setFormData({
                      ...formData,
                      seguridadSocial: {
                        ...formData.seguridadSocial,
                        nivelRiesgoPrincipal: e.target.value as any
                      }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-extrabold text-[#18235C]"
                  >
                    {NIVELES_RIESGO_ARL.map(r => (
                      <option key={r.nivel} value={r.nivel}>
                        Clase {r.nivel} — Tarifa Cotización: {r.tarifa}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Caja de Compensación Familiar (CCF) *
                  </label>
                  <select
                    value={formData.seguridadSocial?.cajaCompensacion || ''}
                    onChange={e => setFormData({
                      ...formData,
                      seguridadSocial: {
                        ...formData.seguridadSocial,
                        cajaCompensacion: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
                  >
                    {formData.seguridadSocial?.cajaCompensacion && !CCF_LIST.includes(formData.seguridadSocial.cajaCompensacion) && (
                      <option value={formData.seguridadSocial.cajaCompensacion}>{formData.seguridadSocial.cajaCompensacion}</option>
                    )}
                    {CCF_LIST.map(ccf => (
                      <option key={ccf} value={ccf}>{ccf}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Código de Póliza / Afiliación ARL</label>
                  <input
                    type="text"
                    value={formData.seguridadSocial?.codigoArl || ''}
                    onChange={e => setFormData({
                      ...formData,
                      seguridadSocial: {
                        ...formData.seguridadSocial,
                        codigoArl: e.target.value
                      }
                    })}
                    placeholder="ARL-BOLIVAR-01"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">EPS Institucional Preferente</label>
                  <input
                    type="text"
                    value={formData.seguridadSocial?.epsPrincipal || ''}
                    onChange={e => setFormData({
                      ...formData,
                      seguridadSocial: {
                        ...formData.seguridadSocial,
                        epsPrincipal: e.target.value
                      }
                    })}
                    placeholder="Sanitas EPS, Sura EPS, etc."
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Fondo de Cesantías Matriz</label>
                  <input
                    type="text"
                    value={formData.seguridadSocial?.fondoCesantiasPrincipal || ''}
                    onChange={e => setFormData({
                      ...formData,
                      seguridadSocial: {
                        ...formData.seguridadSocial,
                        fondoCesantiasPrincipal: e.target.value
                      }
                    })}
                    placeholder="Protección, Porvenir, etc."
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium"
                  />
                </div>
              </div>

              {/* Guía Informativa de Riesgos ARL */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4 space-y-2">
                <span className="font-bold text-[#18235C] flex items-center gap-1.5 text-xs">
                  <Info className="w-4 h-4 text-blue-600" />
                  Tabla Legal de Tarifas de Cotización a Riesgos Laborales (Decreto 1772 de 1994 / 1072 de 2015)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-[11px] pt-1">
                  {NIVELES_RIESGO_ARL.map(r => (
                    <div
                      key={r.nivel}
                      className={`p-2.5 rounded-lg border text-center ${
                        formData.seguridadSocial?.nivelRiesgoPrincipal === r.nivel
                          ? 'bg-[#18235C] text-white border-[#18235C]'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <div className="font-bold">Clase {r.nivel}</div>
                      <div className="font-mono text-xs text-[#00FF00] font-black">{r.tarifa}</div>
                      <p className="text-[10px] mt-1 opacity-80 line-clamp-2">{r.descripcion}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 5: PARÁMETROS DEL SG-SST */}
          {tabActiva === 'sst' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-[#18235C] flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-[#18235C]" />
                  Responsable del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Resolución 0312 de 2019 del Ministerio del Trabajo de Colombia.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#18235C] mb-1">
                    Profesional Responsable del SG-SST *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sst?.responsableSST || ''}
                    onChange={e => setFormData({
                      ...formData,
                      sst: {
                        ...formData.sst,
                        responsableSST: e.target.value
                      }
                    })}
                    placeholder="Ej: Ing. Sandra Patricia Gómez"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">
                    Estándares Mínimos Aplicables (Res. 0312)
                  </label>
                  <select
                    value={formData.sst?.estandaresAplicables || '21'}
                    onChange={e => setFormData({
                      ...formData,
                      sst: {
                        ...formData.sst,
                        estandaresAplicables: e.target.value as any
                      }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
                  >
                    <option value="7">7 Estándares (Hasta 10 trabajadores, Riesgo I, II, III)</option>
                    <option value="21">21 Estándares (11 a 50 trabajadores o Riesgo IV, V)</option>
                    <option value="60">60 Estándares (&gt; 50 trabajadores o Unidades Críticas)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Número de Licencia en SST</label>
                  <input
                    type="text"
                    value={formData.sst?.numeroLicenciaSST || ''}
                    onChange={e => setFormData({
                      ...formData,
                      sst: {
                        ...formData.sst,
                        numeroLicenciaSST: e.target.value
                      }
                    })}
                    placeholder="SST-BOG-2022-8941"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Vigencia de la Licencia</label>
                  <input
                    type="date"
                    value={formData.sst?.vigenciaLicenciaSST || ''}
                    onChange={e => setFormData({
                      ...formData,
                      sst: {
                        ...formData.sst,
                        vigenciaLicenciaSST: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Contacto de Emergencias SST / Médico</label>
                  <input
                    type="text"
                    value={formData.sst?.contactoEmergenciaSST || ''}
                    onChange={e => setFormData({
                      ...formData,
                      sst: {
                        ...formData.sst,
                        contactoEmergenciaSST: e.target.value
                      }
                    })}
                    placeholder="+57 320 456 7890"
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 6: IDENTIDAD CORPORATIVA Y POLÍTICAS */}
          {tabActiva === 'identidad' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-bold text-[#18235C] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Identidad Visual, Cultura y Declaraciones Estratégicas
                </h3>
                <p className="text-[11px] text-slate-500">
                  Logo institucional, lema corporativo y políticas que se reflejan en diplomas, desprendibles y portales.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2 space-y-4">
                  {/* Selector y Carga de Logo */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-[#8FA7D6] space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-[#18235C] text-xs">
                        Logo Corporativo Oficial (Soporta Formato Rectangular) *
                      </label>
                      {formData.identidadVisual?.logoUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            identidadVisual: {
                              ...formData.identidadVisual,
                              logoUrl: ''
                            }
                          })}
                          className="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Quitar Logo</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Opción A: Cargar archivo local */}
                      <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-[#8FA7D6] hover:border-[#18235C] bg-white rounded-lg cursor-pointer transition-colors text-center group">
                        <Upload className="w-5 h-5 text-[#18235C] mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold text-[#18235C]">Cargar archivo desde equipo</span>
                        <span className="text-[10px] text-slate-500">PNG, JPG, SVG, WebP (Rectangular)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const base64 = ev.target?.result as string;
                                setFormData({
                                  ...formData,
                                  identidadVisual: {
                                    ...formData.identidadVisual,
                                    logoUrl: base64
                                  }
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      {/* Opción B: Pegar enlace web o Google Drive */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-700 block">O ingresar Enlace / Google Drive:</span>
                        <div className="relative flex items-center">
                          <input
                            type="url"
                            value={formData.identidadVisual?.logoUrl || ''}
                            onChange={e => {
                              const rawVal = e.target.value;
                              const converted = isGoogleDriveUrl(rawVal) ? formatDriveDirectUrl(rawVal) : rawVal;
                              setFormData({
                                ...formData,
                                identidadVisual: {
                                  ...formData.identidadVisual,
                                  logoUrl: converted
                                }
                              });
                            }}
                            placeholder="https://drive.google.com/... o https://..."
                            className="w-full px-2.5 py-1.5 bg-white border border-[#8FA7D6] rounded text-xs font-mono"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 block leading-tight">
                          Admite enlaces públicos de Google Drive o URLs web directas.
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-lg text-[11px] text-emerald-900 flex items-start gap-2">
                      <ImageIcon className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span>
                        <strong>Logo Rectangular:</strong> El logo cargado se adaptará de forma proporcional y se incluirá automáticamente en la cabecera de todos los <strong>certificados laborales, contratos, diplomas de capacitación, actas electorales COPASST y reportes imprimibles</strong>.
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#18235C] mb-1 text-xs">
                      Lema Institucional / Eslogan Corporativo
                    </label>
                    <input
                      type="text"
                      value={formData.identidadVisual?.lemaInstitucional || ''}
                      onChange={e => setFormData({
                        ...formData,
                        identidadVisual: {
                          ...formData.identidadVisual,
                          lemaInstitucional: e.target.value
                        }
                      })}
                      placeholder="Ej: Ingeniería y Conectividad con Excelencia Humana"
                      className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold text-[#18235C] text-xs"
                    />
                  </div>
                </div>

                {/* Previsualización del Logo / Membrete Rectangular */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 mb-2">
                    Vista Previa del Membrete
                  </span>
                  <div className="w-full min-h-[100px] p-3 bg-white rounded-lg border border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                    {formData.identidadVisual?.logoUrl ? (
                      <img
                        src={formData.identidadVisual.logoUrl}
                        alt="Logo de la empresa"
                        className="max-h-20 w-auto max-w-full object-contain"
                        onError={(e) => {
                          (e.target as any).src = 'https://via.placeholder.com/200x60?text=Formato+No+Valido';
                        }}
                      />
                    ) : (
                      <div className="px-6 py-3 rounded-lg bg-[#18235C] text-[#00FF00] font-black text-xl flex items-center justify-center border-2 border-[#8FA7D6] shadow-xs">
                        {formData.nombreComercial ? formData.nombreComercial.toUpperCase() : 'B GROUP INGENIERIA'}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-slate-700 mt-2 font-bold">{formData.nombreComercial || formData.razonSocial}</span>
                  <span className="text-[10px] text-slate-500 font-mono">NIT {formData.nit}-{formData.digitoVerificacion}</span>
                </div>

                <div className="md:col-span-3">
                  <label className="block font-bold text-[#18235C] mb-1">Misión Corporativa</label>
                  <textarea
                    rows={2}
                    value={formData.identidadVisual?.mision || ''}
                    onChange={e => setFormData({
                      ...formData,
                      identidadVisual: {
                        ...formData.identidadVisual,
                        mision: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block font-bold text-[#18235C] mb-1">Visión Corporativa</label>
                  <textarea
                    rows={2}
                    value={formData.identidadVisual?.vision || ''}
                    onChange={e => setFormData({
                      ...formData,
                      identidadVisual: {
                        ...formData.identidadVisual,
                        vision: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block font-bold text-[#18235C] mb-1">Política Integrada del SG-SST</label>
                  <textarea
                    rows={3}
                    value={formData.identidadVisual?.politicaSST || ''}
                    onChange={e => setFormData({
                      ...formData,
                      identidadVisual: {
                        ...formData.identidadVisual,
                        politicaSST: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-sans"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 7: CENTROS DE TRABAJO Y SEDES OPERATIVAS */}
          {tabActiva === 'centros' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-200 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#18235C] flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    Catálogo Oficial de Centros de Trabajo, Sedes y Frentes Operativos (SG-SST)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Defina las ubicaciones geográficas y clases de riesgo ARL. Estos centros se vinculan directamente a la <strong>Pestaña 1 del Manual de Cargos</strong> y al SG-SST.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAbrirModalCentro()}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Crear Centro de Trabajo</span>
                </button>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Impacto Organizacional:</strong> Los Centros de Trabajo parametrizados aquí permiten seleccionar la ubicación exacta en el <strong>Manual de Cargos (Pestaña 1)</strong> y garantizan el cumplimiento de cotización ARL por centro de trabajo según Decreto 1072 de 2015.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(formData.centrosTrabajo || []).map(ct => (
                  <div
                    key={ct.id}
                    className="p-4 bg-white border border-[#8FA7D6] rounded-xl shadow-2xs space-y-2 relative group hover:border-[#18235C] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 block">{ct.codigo || 'Sede'}</span>
                        <h4 className="font-bold text-[#18235C] text-sm leading-tight flex items-center gap-1.5">
                          {ct.nombre}
                          {ct.esSedePrincipal && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 text-[9px] font-bold rounded uppercase">
                              Principal
                            </span>
                          )}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#18235C] text-[#00FF00] shrink-0 font-mono">
                        Riesgo {ct.claseRiesgoARL}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1 border-t border-slate-100 pt-2">
                      <div className="flex items-center gap-1 text-[11px]">
                        <MapPin className="w-3 h-3 text-[#18235C] shrink-0" />
                        <span className="font-semibold text-slate-800">{ct.ciudad}, {ct.departamento}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 pl-4">{ct.direccion || 'Sin dirección registrada'}</div>
                      {ct.telefono && (
                        <div className="text-[10px] text-slate-500 pl-4 font-mono">Tel: {ct.telefono}</div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handleAbrirModalCentro(ct)}
                        className="p-1 text-blue-700 hover:bg-blue-50 rounded flex items-center gap-1 font-semibold cursor-pointer text-[11px]"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarCentroTrabajo(ct.id)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded flex items-center gap-1 font-semibold cursor-pointer text-[11px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                ))}

                {(formData.centrosTrabajo || []).length === 0 && (
                  <div className="col-span-full py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 space-y-2">
                    <Building2 className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-bold text-xs">No hay Centros de Trabajo registrados.</p>
                    <p className="text-[11px]">Haga clic en "+ Crear Centro de Trabajo" para adicionar sedes u operativas.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botones de Pie de Formulario */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              Última actualización: <strong>{formData.fechaActualizacion || 'Hoy'}</strong> por {formData.actualizadoPor || 'Admin'}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRestablecerValores}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Restablecer
              </button>

              <button
                type="submit"
                disabled={guardando}
                className="px-6 py-2 bg-[#18235C] hover:bg-[#101740] text-white font-bold rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-[#00FF00]" />
                    <span>Guardando Configuración...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-[#00FF00]" />
                    <span>Guardar Configuración de la Empresa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de Confirmación de Restablecimiento */}
      {modalConfirmReset && (
        <div className="fixed inset-0 z-50 bg-[#18235C]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#8FA7D6] space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-base font-bold text-[#18235C]">¿Restablecer datos de la empresa?</h4>
            </div>
            <p className="text-xs text-[#282829] leading-relaxed">
              Esta acción cargará los valores institucionales estándar de <strong>B GROUP INGENIERIA S.A.S.</strong> en el formulario. Los cambios se harán permanentes al hacer clic en <em>Guardar Configuración</em>.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setModalConfirmReset(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarReset}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm cursor-pointer"
              >
                Sí, Restablecer Datos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear / Editar Centro de Trabajo */}
      {modalCentroOpen && (
        <div className="fixed inset-0 z-50 bg-[#18235C]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#8FA7D6] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-[#18235C]">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h4 className="text-base font-bold">
                  {ctAEditar ? 'Modificar Centro de Trabajo' : 'Crear Nuevo Centro de Trabajo'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setModalCentroOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarCentroTrabajo} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Código *</label>
                  <input
                    type="text"
                    required
                    value={ctCodigo}
                    onChange={e => setCtCodigo(e.target.value)}
                    placeholder="Ej: CT-BOG-01"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono font-bold"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-[#18235C] mb-1">Nombre del Centro de Trabajo / Sede *</label>
                  <input
                    type="text"
                    required
                    value={ctNombre}
                    onChange={e => setCtNombre(e.target.value)}
                    placeholder="Ej: Centro Operativo y Laboratorio FTTH"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Clase de Riesgo ARL *</label>
                  <select
                    value={ctClaseRiesgo}
                    onChange={e => setCtClaseRiesgo(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold"
                  >
                    <option value="I">Clase I (0.522% - Mínimo: Oficinas / Admin)</option>
                    <option value="II">Clase II (1.044% - Bajo: Comercio)</option>
                    <option value="III">Clase III (2.436% - Medio: Procesos)</option>
                    <option value="IV">Clase IV (4.350% - Alto: Operaciones)</option>
                    <option value="V">Clase V (6.960% - Máximo: Alturas / FTTH / Minería)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Teléfono de Sede</label>
                  <input
                    type="text"
                    value={ctTelefono}
                    onChange={e => setCtTelefono(e.target.value)}
                    placeholder="+57 (601) ..."
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Departamento *</label>
                  <select
                    value={ctDepartamento}
                    onChange={e => {
                      const dep = e.target.value;
                      setCtDepartamento(dep);
                      const muns = getMunicipiosPorDepartamento(dep);
                      if (muns.length > 0) setCtCiudad(muns[0]);
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold text-[#18235C]"
                  >
                    {DEPARTAMENTOS_COLOMBIA.map(d => (
                      <option key={d.nombre} value={d.nombre}>{d.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Ciudad / Municipio *</label>
                  <select
                    value={ctCiudad}
                    onChange={e => setCtCiudad(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
                  >
                    {getMunicipiosPorDepartamento(ctDepartamento).map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#18235C] mb-1">Dirección Física *</label>
                <input
                  type="text"
                  required
                  value={ctDireccion}
                  onChange={e => setCtDireccion(e.target.value)}
                  placeholder="Ej: Calle 13 No. 68-45, Zona Industrial"
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold"
                />
              </div>

              <div className="pt-1 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ctEsPrincipalCheck"
                  checked={ctEsPrincipal}
                  onChange={e => setCtEsPrincipal(e.target.checked)}
                  className="w-4 h-4 text-[#18235C] rounded"
                />
                <label htmlFor="ctEsPrincipalCheck" className="font-bold text-xs text-[#18235C] cursor-pointer">
                  Establecer como Sede Principal de la Compañía
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalCentroOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm cursor-pointer flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{ctAEditar ? 'Actualizar Centro' : 'Guardar Centro de Trabajo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
