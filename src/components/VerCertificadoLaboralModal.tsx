import React from 'react';
import { CertificadoLaboralData, formatMonedaCOPCertificado } from '../utils/generadorCertificados';
import { Printer, X, FileText, ShieldCheck } from 'lucide-react';

interface VerCertificadoLaboralModalProps {
  certificado: CertificadoLaboralData;
  onClose: () => void;
}

export const VerCertificadoLaboralModal: React.FC<VerCertificadoLaboralModalProps> = ({
  certificado,
  onClose
}) => {
  const handleImprimir = () => {
    window.print();
  };

  const nombreEmpresa = certificado.empresa.razonSocial || certificado.empresa.nombreComercial || 'Empresa Registrada';
  const nitCompleto = certificado.empresa.nit
    ? `NIT ${certificado.empresa.nit}${certificado.empresa.digitoVerificacion ? `-${certificado.empresa.digitoVerificacion}` : ''}`
    : '';

  const direccionCompleta = [
    certificado.empresa.contacto?.direccion,
    certificado.empresa.contacto?.ciudad,
    certificado.empresa.contacto?.departamento
  ].filter(Boolean).join(', ');

  const telefonosEmail = [
    certificado.empresa.contacto?.telefonoFijo || certificado.empresa.contacto?.celular,
    certificado.empresa.contacto?.emailCorporativo || certificado.empresa.contacto?.emailContactoGH
  ].filter(Boolean).join(' · ');

  return (
    <div className="fixed inset-0 z-50 bg-[#18235C]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-[#8FA7D6] my-auto flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#18235C] text-white px-6 py-4 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <FileText className="w-5 h-5 text-[#00FF00]" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Certificado Laboral Autogenerado</h3>
              <span className="text-[11px] text-[#8FA7D6] block">
                Documento Oficial autorizado y firmado electrónicamente — Código: <strong className="font-mono text-white">{certificado.codigoVerificacion}</strong>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-imprimir-pdf-certificado"
              onClick={handleImprimir}
              className="px-3 py-1.5 bg-[#00FF00] hover:bg-emerald-400 text-[#18235C] font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg text-lg font-bold cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-12 overflow-y-auto space-y-6 text-[#282829] bg-white text-xs sm:text-sm font-serif leading-relaxed" id="area-impresion-certificado">
          {/* Header Institucional de la Empresa */}
          <div className="flex items-start justify-between border-b-2 border-[#18235C] pb-4 font-sans gap-4">
            <div className="flex items-center gap-3">
              {certificado.empresa.identidadVisual?.logoUrl ? (
                <img
                  src={certificado.empresa.identidadVisual.logoUrl}
                  alt={certificado.empresa.nombreComercial || 'Logo'}
                  className="max-h-16 w-auto max-w-[170px] object-contain shrink-0"
                />
              ) : (
                <div className="w-12 h-12 bg-[#18235C] text-[#00FF00] font-black text-xl flex items-center justify-center rounded-xl shrink-0 shadow-xs">
                  {nombreEmpresa.charAt(0)}
                </div>
              )}
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-[#18235C] tracking-wide uppercase">
                  {nombreEmpresa}
                </h1>
                {nitCompleto && (
                  <p className="text-xs text-slate-700 font-bold font-mono">
                    {nitCompleto} · Dirección General de Gestión Humana
                  </p>
                )}
                {direccionCompleta && (
                  <p className="text-[11px] text-slate-500">
                    {direccionCompleta}
                  </p>
                )}
                {telefonosEmail && (
                  <p className="text-[10px] text-slate-500 font-mono">
                    {telefonosEmail}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right font-mono text-[10px] text-slate-500 space-y-1 shrink-0">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold uppercase block text-[9px]">
                Documento Autorizado
              </span>
              <div>Verificación: <strong>{certificado.codigoVerificacion}</strong></div>
              <div>Fecha: {certificado.fechaEmision}</div>
            </div>
          </div>

          {/* Título Principal */}
          <div className="text-center py-4 font-sans space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-[#18235C] uppercase tracking-wider leading-relaxed">
              EL SUSCRITO {certificado.firmanteCargo.toUpperCase()} DE {nombreEmpresa.toUpperCase()}
            </h2>
            <h3 className="text-base sm:text-lg font-extrabold text-emerald-800 uppercase tracking-widest pt-2">
              CERTIFICA:
            </h3>
          </div>

          {/* Cuerpo del Certificado Laboral */}
          <div className="space-y-4 text-justify leading-relaxed">
            <p>
              Que el(la) señor(a) <strong className="text-[#18235C] font-sans font-bold uppercase">{certificado.empleado.nombre}</strong>, identificado(a) con Cédula de Ciudadanía número <strong className="font-mono font-bold">{certificado.empleado.documento}</strong> expedida en Colombia, labora para nuestra organización bajo la modalidad de contrato de trabajo <strong className="font-bold text-[#18235C]">{certificado.tipoContrato}</strong> desde el <strong className="font-bold">{certificado.fechaIngreso}</strong>, prestando sus servicios en el Centro de Trabajo / Sede <strong className="font-bold text-[#18235C]">{certificado.centroTrabajoNombre}</strong> ({certificado.centroTrabajoCiudad}), desempeñando actualmente las funciones correspondientes al cargo de:
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-sans my-3 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 uppercase font-bold block text-[10px]">Denominación del Cargo</span>
                  <strong className="text-[#18235C] text-sm">{certificado.cargoNombre}</strong>
                </div>
                <div>
                  <span className="text-slate-500 uppercase font-bold block text-[10px]">Asignación Salarial Mensual Básica</span>
                  <strong className="text-emerald-800 text-sm">{formatMonedaCOPCertificado(certificado.salarioBasicoCOP)}</strong>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200 text-slate-700 text-[11px]">
                Son: <strong>{certificado.salarioBasicoTexto}</strong>.
              </div>
            </div>

            <p>
              Para constancia de lo anterior, y a solicitud expresa del interesado(a), se expide la presente certificación con destino a: <strong className="font-sans font-bold text-[#18235C]">{certificado.entidadDestino || certificado.motivoDestino}</strong>, en la ciudad de {certificado.centroTrabajoCiudad || certificado.empresa.contacto?.ciudad || 'Bogotá D.C.'}, a los {certificado.fechaEmision}.
            </p>
          </div>

          {/* Firma Electrónica y Sello */}
          <div className="pt-10 flex items-end justify-between font-sans border-t border-slate-200 text-xs">
            <div className="space-y-2">
              <div className="w-52 h-12 border-b-2 border-[#18235C] flex items-end pb-1 font-mono text-[10px] text-emerald-700 italic">
                [Firma Electrónica Autorizada]
              </div>
              <div>
                <strong className="block text-[#18235C] font-bold uppercase text-xs">{certificado.firmanteNombre}</strong>
                <span className="text-slate-600 block text-[11px] font-medium">{certificado.firmanteCargo}</span>
                <span className="text-slate-500 block text-[10px] font-bold">{nombreEmpresa}</span>
              </div>
            </div>

            {/* Código QR de Verificación CST */}
            <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl text-center text-[9px] text-slate-500 space-y-1">
              <div className="w-16 h-16 bg-[#18235C] mx-auto rounded-lg flex items-center justify-center text-white text-[10px] font-mono font-bold shadow-2xs">
                QR CST
              </div>
              <span className="block font-bold text-[#18235C]">Validez Digital CST</span>
              <span className="font-mono">Cód: {certificado.codigoVerificacion.slice(-8)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs shrink-0 print:hidden">
          <span className="text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Certificado emitido con validez jurídica según Art. 57 CST y Ley 527 de 1999 de Firma Digital.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-lg cursor-pointer transition-colors"
          >
            Cerrar Vista Previa
          </button>
        </div>
      </div>
    </div>
  );
};
