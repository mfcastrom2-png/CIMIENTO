import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building2,
  Calendar,
  User,
  Lock,
  Award,
  Sparkles,
  LogIn
} from 'lucide-react';
import {
  verificarAutenticidadCertificado,
  RegistroCertificadoVerificable,
  obtenerCertificadosLocales,
  esTipoCertificadoPermitido
} from '../services/verificacionCertificadosService';
import { initialEmpresa } from '../data/initialData';
import { ConfiguracionEmpresa } from '../types';

interface VerificadorCertificadosViewProps {
  empresa?: ConfiguracionEmpresa;
  isPublicLanding?: boolean;
  onIrALogin?: () => void;
}

export const VerificadorCertificadosView: React.FC<VerificadorCertificadosViewProps> = ({
  empresa = initialEmpresa,
  isPublicLanding = false,
  onIrALogin
}) => {
  const [codigoBusqueda, setCodigoBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<RegistroCertificadoVerificable | null>(null);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [certificadosRecientes, setCertificadosRecientes] = useState<RegistroCertificadoVerificable[]>([]);

  useEffect(() => {
    // 1. Cargar lista local permitida (solo Diploma SST y Certificado Laboral)
    const locales = obtenerCertificadosLocales().filter(c => esTipoCertificadoPermitido(c.tipoDocumento));
    setCertificadosRecientes(locales);

    // 2. Verificar si hay un parámetro ?verificar= o ?codigo= en la URL
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const codigoUrl = urlParams.get('verificar') || urlParams.get('codigo');
      if (codigoUrl) {
        setCodigoBusqueda(codigoUrl);
        ejecutarVerificacion(codigoUrl);
      }
    }
  }, []);

  const ejecutarVerificacion = async (codigo: string) => {
    const term = codigo.trim();
    if (!term) {
      setErrorBusqueda('Por favor ingrese el código de verificación o radicado oficial.');
      setResultado(null);
      return;
    }

    // Comprobación de exclusión inmediata para actas u otros tipos no admitidos
    if (term.toUpperCase().startsWith('ACTA-')) {
      setResultado(null);
      setErrorBusqueda('Este verificador de autenticidad valida exclusivamente Diplomas SST y Certificados Laborales. Las actas de entrega no están sujetas a este verificador.');
      return;
    }

    setCargando(true);
    setErrorBusqueda(null);
    try {
      const res = await verificarAutenticidadCertificado(term);
      if (res && esTipoCertificadoPermitido(res.tipoDocumento)) {
        setResultado(res);
        setErrorBusqueda(null);
      } else {
        setResultado(null);
        setErrorBusqueda(`No se encontró ningún Diploma SST o Certificado Laboral registrado con el código "${term}". Verifique los caracteres ingresados.`);
      }
    } catch {
      setErrorBusqueda('Error al conectar con el servicio de validación de autenticidad.');
    } finally {
      setCargando(false);
    }
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    ejecutarVerificacion(codigoBusqueda);
  };

  const razonSocial = empresa?.razonSocial || empresa?.nombreComercial || 'B GROUP INGENIERIA S.A.S.';
  const nitCompleto = empresa?.nit ? `NIT ${empresa.nit}${empresa.digitoVerificacion ? `-${empresa.digitoVerificacion}` : ''}` : 'NIT 901.458.789-1';

  return (
    <div className={isPublicLanding ? "min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-white flex flex-col justify-between" : "space-y-6 max-w-4xl mx-auto pb-12"}>
      {/* Top Header para vista pública */}
      {isPublicLanding && (
        <header className="w-full bg-[#18235C] text-white border-b border-[#101740] shadow-md py-4 px-6">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {empresa?.identidadVisual?.logoUrl ? (
                <div className="bg-white p-1.5 rounded-lg border border-slate-200 flex items-center justify-center max-h-12 overflow-hidden shadow-xs">
                  <img
                    src={empresa.identidadVisual.logoUrl}
                    alt={empresa.nombreComercial || 'Logo'}
                    className="max-h-9 w-auto max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white text-[#18235C] font-extrabold flex items-center justify-center text-lg shadow-xs">
                  {empresa?.nombreComercial?.charAt(0) || 'B'}
                </div>
              )}
              <div>
                <h2 className="text-base font-bold leading-tight">{razonSocial}</h2>
                <span className="text-xs text-[#8FA7D6] font-mono">{nitCompleto} · Verificador Oficial</span>
              </div>
            </div>

            {onIrALogin && (
              <button
                type="button"
                onClick={onIrALogin}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-all cursor-pointer shadow-xs"
              >
                <LogIn className="w-4 h-4 text-[#00FF00]" />
                <span>Acceso a Colaboradores / Ingresar</span>
              </button>
            )}
          </div>
        </header>
      )}

      <div className={isPublicLanding ? "max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-6 my-auto" : "space-y-6"}>
        {/* Header Institucional */}
        <div className="text-center space-y-2 pb-4 border-b border-[#8FA7D6]/30">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Servicio Oficial de Validación de Autenticidad Digital</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#18235C]">
            Verificador de Autenticidad: Diploma SST y Certificado Laboral
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto">
            Valide en tiempo real la validez jurídica, integridad criptográfica y vigencia de <strong>Diplomas SST</strong> (Seguridad y Salud en el Trabajo) y <strong>Certificados Laborales</strong> expedidos por <strong>{razonSocial}</strong> bajo la <strong>Ley 527 de 1999</strong> y el <strong>Código Sustantivo del Trabajo (CST)</strong>.
          </p>

          {/* Categorías autorizadas */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="text-xs font-bold text-[#18235C]">Categorías admitidas:</span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
              <Award className="w-3.5 h-3.5 text-blue-600" />
              Diploma SST
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              Certificado Laboral
            </span>
          </div>
        </div>

        {/* Formulario de Búsqueda y Validación */}
        <div className="bg-white p-6 rounded-2xl border border-[#8FA7D6]/40 shadow-xs space-y-4">
          <form onSubmit={handleBuscar} className="space-y-3">
            <label className="block font-extrabold text-sm text-[#18235C]">
              Ingrese el Código de Verificación, Token SHA-256 o Radicado del Documento:
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={codigoBusqueda}
                  onChange={e => setCodigoBusqueda(e.target.value)}
                  placeholder="Ej: DIP-SST-2026-3391 o CERT-2026-774120..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-[#8FA7D6] bg-slate-50 focus:bg-white text-sm font-mono font-bold text-[#18235C] focus:outline-none focus:border-[#18235C]"
                />
              </div>
              <button
                type="submit"
                disabled={cargando}
                className="px-6 py-3 bg-[#18235C] hover:bg-[#101740] text-white font-extrabold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <ShieldCheck className="w-5 h-5 text-[#00FF00]" />
                <span>{cargando ? 'Validando...' : 'Verificar Autenticidad'}</span>
              </button>
            </div>
          </form>

          {/* Mensaje de Error */}
          {errorBusqueda && (
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 text-rose-800 flex items-start gap-3 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-xs">Documento No Encontrado o Categoría No Habilitada</strong>
                <span className="text-xs leading-relaxed">{errorBusqueda}</span>
              </div>
            </div>
          )}

          {/* Resultado Exitoso */}
          {resultado && (
            <div className="p-6 bg-emerald-50/80 rounded-2xl border-2 border-emerald-400 shadow-sm space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-emerald-950 uppercase tracking-wide">
                      DOCUMENTO OFICIAL AUTÉNTICO Y VIGENTE
                    </h3>
                    <span className="text-xs text-emerald-800 font-semibold">
                      Registrado y autenticado en la plataforma de {resultado.emisorRazonSocial}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-white text-[#18235C] text-xs font-bold rounded-full border border-emerald-300 shadow-2xs">
                    {resultado.tipoDocumento === 'Diploma SST' ? (
                      <Award className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>{resultado.tipoDocumento}</span>
                  </span>
                  <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-mono font-bold rounded-full uppercase tracking-wider">
                    {resultado.estado}
                  </span>
                </div>
              </div>

              {/* Grid de Atributos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tipo de Documento</span>
                  <strong className="text-[#18235C] text-sm block flex items-center gap-1.5">
                    {resultado.tipoDocumento === 'Diploma SST' ? (
                      <Award className="w-4 h-4 text-blue-600 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <span>{resultado.tipoDocumento}</span>
                  </strong>
                  <span className="text-xs font-mono text-slate-500">Radicado: {resultado.codigoVerificacion}</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Titular del Certificado</span>
                  <strong className="text-[#18235C] text-sm block flex items-center gap-1.5">
                    <User className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{resultado.titularNombre}</span>
                  </strong>
                  <span className="text-xs font-mono text-slate-600">Doc: {resultado.titularDocumento}</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Emisor Institucional</span>
                  <strong className="text-slate-800 text-xs block flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{resultado.emisorRazonSocial}</span>
                  </strong>
                  <span className="text-xs font-mono text-slate-500">NIT: {resultado.emisorNit}</span>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha de Emisión & Firmante</span>
                  <strong className="text-slate-800 text-xs block flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{resultado.fechaEmision}</span>
                  </strong>
                  <span className="text-xs text-slate-600">Firmado por: {resultado.firmanteNombre} ({resultado.firmanteCargo})</span>
                </div>
              </div>

              {/* Token Criptográfico */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-950">
                  <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Hash Criptográfico SHA-256:</span>
                  <strong className="font-bold">{resultado.hashIntegridad}</strong>
                </div>
                <span className="text-emerald-700 font-bold text-[10px] uppercase tracking-wider bg-emerald-100 px-2.5 py-1 rounded self-start sm:self-auto">
                  Firma y Rúbrica Válida
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Ejemplos de Verificación para Pruebas: Exclusivo Diploma SST y Certificado Laboral */}
        <div className="bg-white p-6 rounded-2xl border border-[#8FA7D6]/40 shadow-xs space-y-3">
          <span className="text-xs font-extrabold text-[#18235C] uppercase tracking-wider block">
            Ejemplos de Códigos Registrados para Consulta Rápida:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Diploma SST */}
            <button
              type="button"
              onClick={() => {
                const cod = 'DIP-SST-2026-3391';
                setCodigoBusqueda(cod);
                ejecutarVerificacion(cod);
              }}
              className="p-4 bg-slate-50 hover:bg-[#18235C] hover:text-white rounded-xl border border-slate-200 transition-all text-left space-y-1.5 group cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#18235C] group-hover:text-white">
                  <Award className="w-4 h-4 text-blue-600 group-hover:text-[#00FF00]" />
                  <span>Diploma SST</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 group-hover:bg-white/20 group-hover:text-white">
                  SG-SST
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500 group-hover:text-slate-200 block">
                DIP-SST-2026-3391
              </span>
              <p className="text-[11px] text-slate-500 group-hover:text-slate-300">
                Constancia y diploma de capacitación en Seguridad en Alturas y Prevención SG-SST.
              </p>
            </button>

            {/* 2. Certificado Laboral */}
            <button
              type="button"
              onClick={() => {
                const cod = 'CERT-901458789-2026-774120';
                setCodigoBusqueda(cod);
                ejecutarVerificacion(cod);
              }}
              className="p-4 bg-slate-50 hover:bg-[#18235C] hover:text-white rounded-xl border border-slate-200 transition-all text-left space-y-1.5 group cursor-pointer shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#18235C] group-hover:text-white">
                  <FileText className="w-4 h-4 text-emerald-600 group-hover:text-[#00FF00]" />
                  <span>Certificado Laboral</span>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 group-hover:bg-white/20 group-hover:text-white">
                  Gestión Humana
                </span>
              </div>
              <span className="text-xs font-mono text-slate-500 group-hover:text-slate-200 block">
                CERT-2026-774120
              </span>
              <p className="text-[11px] text-slate-500 group-hover:text-slate-300">
                Acreditación laboral oficial conforme al Código Sustantivo del Trabajo (Art. 57 CST).
              </p>
            </button>
          </div>
        </div>
      </div>

      {/* Footer para vista pública */}
      {isPublicLanding && (
        <footer className="w-full text-center py-4 text-slate-400 text-xs border-t border-slate-200 bg-white">
          <span>{razonSocial} · Plataforma de Talento Humano y Gobernanza Digital · Ley 527 de 1999</span>
        </footer>
      )}
    </div>
  );
};
