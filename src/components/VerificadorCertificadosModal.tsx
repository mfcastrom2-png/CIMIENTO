import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Building2,
  Calendar,
  User,
  Lock,
  Award
} from 'lucide-react';
import {
  verificarAutenticidadCertificado,
  RegistroCertificadoVerificable,
  obtenerCertificadosLocales,
  esTipoCertificadoPermitido
} from '../services/verificacionCertificadosService';

interface VerificadorCertificadosModalProps {
  isOpen: boolean;
  onClose: () => void;
  codigoInicial?: string;
}

export const VerificadorCertificadosModal: React.FC<VerificadorCertificadosModalProps> = ({
  isOpen,
  onClose,
  codigoInicial = ''
}) => {
  const [codigoBusqueda, setCodigoBusqueda] = useState(codigoInicial);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState<RegistroCertificadoVerificable | null>(null);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (codigoInicial) {
        setCodigoBusqueda(codigoInicial);
        ejecutarVerificacion(codigoInicial);
      } else {
        setResultado(null);
        setErrorBusqueda(null);
      }
    }
  }, [isOpen, codigoInicial]);

  if (!isOpen) return null;

  const ejecutarVerificacion = async (codigo: string) => {
    const term = codigo.trim();
    if (!term) {
      setErrorBusqueda('Por favor ingrese el código de verificación o radicado oficial.');
      setResultado(null);
      return;
    }

    if (term.toUpperCase().startsWith('ACTA-')) {
      setResultado(null);
      setErrorBusqueda('Este verificador de autenticidad valida exclusivamente Diplomas SST y Certificados Laborales.');
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
        setErrorBusqueda(`No se encontró ningún Diploma SST o Certificado Laboral registrado con el código "${term}".`);
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

  return (
    <div className="fixed inset-0 z-50 bg-[#18235C]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#8FA7D6] overflow-hidden my-auto flex flex-col">
        {/* Header Institucional */}
        <div className="bg-[#18235C] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#00FF00]/10 rounded-xl border border-[#00FF00]/30">
              <ShieldCheck className="w-6 h-6 text-[#00FF00]" />
            </div>
            <div>
              <h2 className="font-extrabold text-base leading-tight">
                Verificador de Autenticidad: Diploma SST y Certificado Laboral
              </h2>
              <span className="text-[11px] text-[#8FA7D6] block">
                Validación de Firma Digital y Código QR Oficial · Ley 527 de 1999 & Art. 57 CST
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Buscador de Código */}
          <form onSubmit={handleBuscar} className="space-y-2">
            <label className="block font-bold text-[#18235C] text-xs">
              Ingrese el Código de Verificación o Token del Documento:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={codigoBusqueda}
                  onChange={e => setCodigoBusqueda(e.target.value)}
                  placeholder="Ej: DIP-SST-2026-3391 o CERT-2026-774120..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#8FA7D6] bg-slate-50 focus:bg-white text-xs font-mono font-bold text-[#18235C] focus:outline-none focus:border-[#18235C]"
                />
              </div>
              <button
                type="submit"
                disabled={cargando}
                className="px-5 py-2.5 bg-[#18235C] hover:bg-[#101740] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <ShieldCheck className="w-4 h-4 text-[#00FF00]" />
                <span>{cargando ? 'Verificando...' : 'Verificar'}</span>
              </button>
            </div>
          </form>

          {/* Error Message */}
          {errorBusqueda && (
            <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-xs">Documento No Encontrado o Inválido</strong>
                <span className="text-[11px] leading-relaxed">{errorBusqueda}</span>
              </div>
            </div>
          )}

          {/* Resultado de Validación Exitosa */}
          {resultado && (
            <div className="p-5 bg-emerald-50/70 rounded-2xl border-2 border-emerald-400 shadow-xs space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-emerald-950 uppercase tracking-wide">
                      DOCUMENTO AUTÉNTICO Y VIGENTE
                    </h3>
                    <span className="text-[10px] text-emerald-800 font-medium">
                      Emitido oficialmente por {resultado.emisorRazonSocial}
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-mono font-bold rounded-full uppercase tracking-wider">
                  {resultado.estado}
                </span>
              </div>

              {/* Ficha de Detalles del Certificado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tipo de Documento</span>
                  <strong className="text-[#18235C] text-sm block flex items-center gap-1.5">
                    {resultado.tipoDocumento === 'Diploma SST' ? (
                      <Award className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                    <span>{resultado.tipoDocumento}</span>
                  </strong>
                  <span className="text-[10px] font-mono text-slate-500">Cód: {resultado.codigoVerificacion}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Titular del Certificado</span>
                  <strong className="text-[#18235C] text-sm block">{resultado.titularNombre}</strong>
                  <span className="text-[10px] font-mono text-slate-600">Doc: {resultado.titularDocumento}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Emisor / Entidad Legal</span>
                  <strong className="text-slate-800 text-xs block">{resultado.emisorRazonSocial}</strong>
                  <span className="text-[10px] font-mono text-slate-500">NIT: {resultado.emisorNit}</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha de Emisión & Firmante</span>
                  <strong className="text-slate-800 text-xs block">{resultado.fechaEmision}</strong>
                  <span className="text-[10px] text-slate-600">Por: {resultado.firmanteNombre} ({resultado.firmanteCargo})</span>
                </div>
              </div>

              {/* Token Criptográfico de Integridad */}
              <div className="bg-white/80 p-3 rounded-xl border border-emerald-300 flex items-center justify-between gap-2 text-[10px] font-mono">
                <div className="flex items-center gap-1.5 text-emerald-900">
                  <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Hash Criptográfico SHA-256:</span>
                  <strong className="text-emerald-950 font-bold">{resultado.hashIntegridad}</strong>
                </div>
                <span className="text-emerald-700 font-bold text-[9px] uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded">
                  Firma Válida
                </span>
              </div>
            </div>
          )}

          {/* Accesos rápidos exclusivos: Diploma SST y Certificado Laboral */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Pruebas Rápidas de Verificación Institucional:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const cod = 'DIP-SST-2026-3391';
                  setCodigoBusqueda(cod);
                  ejecutarVerificacion(cod);
                }}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-[#18235C] hover:text-white text-[#18235C] rounded-lg font-mono text-[11px] font-semibold border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Award className="w-3 h-3 text-blue-600" />
                <span>Diploma SST (DIP-SST-3391)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const cod = 'CERT-901458789-2026-774120';
                  setCodigoBusqueda(cod);
                  ejecutarVerificacion(cod);
                }}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-[#18235C] hover:text-white text-[#18235C] rounded-lg font-mono text-[11px] font-semibold border border-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <FileText className="w-3 h-3 text-emerald-600" />
                <span>Certificado Laboral (CERT-2026-774120)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <span className="text-slate-500 text-[11px]">
            Conforme a la Ley 527 de 1999 de la República de Colombia.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar Verificador
          </button>
        </div>
      </div>
    </div>
  );
};
