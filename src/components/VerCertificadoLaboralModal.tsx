import React, { useState, useEffect } from 'react';
import { CertificadoLaboralData, formatMonedaCOPCertificado } from '../utils/generadorCertificados';
import { imprimirDocumento, descargarElementoComoPdf } from '../utils/printUtils';
import { Printer, X, FileText, ShieldCheck, Download, FileDown, CheckCircle2, PenTool } from 'lucide-react';
import { CodigoQRVerificacion } from './CodigoQRVerificacion';
import { HerramientaFirmaDigitalModal, DatosFirmaDigital } from './HerramientaFirmaDigitalModal';
import { FirmaDigitalStamp } from './FirmaDigitalStamp';
import { registrarCertificadoEmitido, generarHashIntegridadDocumento } from '../services/verificacionCertificadosService';

interface VerCertificadoLaboralModalProps {
  certificado: CertificadoLaboralData;
  onClose: () => void;
}

export const VerCertificadoLaboralModal: React.FC<VerCertificadoLaboralModalProps> = ({
  certificado,
  onClose
}) => {
  const [incluirSalario, setIncluirSalario] = useState<boolean>(true);
  const [descargandoPdf, setDescargandoPdf] = useState<boolean>(false);
  const [modalFirmaOpen, setModalFirmaOpen] = useState<boolean>(false);
  const [firmaDigital, setFirmaDigital] = useState<DatosFirmaDigital | null>(null);

  // Auto-registrar el certificado emitido en la base para validación pública inmediata
  useEffect(() => {
    const hash = generarHashIntegridadDocumento({
      codigo: certificado.codigoVerificacion,
      titular: certificado.empleado.nombre,
      doc: certificado.empleado.documento,
      cargo: certificado.cargoNombre,
      fecha: certificado.fechaEmision
    });

    registrarCertificadoEmitido({
      codigoVerificacion: certificado.codigoVerificacion,
      tipoDocumento: 'Certificado Laboral',
      titularNombre: certificado.empleado.nombre,
      titularDocumento: certificado.empleado.documento,
      titularCargo: certificado.cargoNombre,
      fechaEmision: certificado.fechaEmision,
      fechaRegistroISO: new Date().toISOString(),
      emisorRazonSocial: certificado.empresa.razonSocial || 'B GROUP INGENIERIA S.A.S.',
      emisorNit: `${certificado.empresa.nit || '901.458.789'}-${certificado.empresa.digitoVerificacion || '3'}`,
      firmanteNombre: certificado.firmanteNombre,
      firmanteCargo: certificado.firmanteCargo,
      hashIntegridad: hash,
      estado: 'VIGENTE_AUTENTICO',
      detallesEspecificos: {
        tipoContrato: certificado.tipoContrato,
        fechaIngreso: certificado.fechaIngreso,
        centroTrabajo: certificado.centroTrabajoNombre,
        salarioCOP: certificado.salarioBasicoCOP
      }
    });
  }, [certificado]);

  const nombreArchivo = `Certificado_Laboral_${certificado.empleado.nombre.replace(/\s+/g, '_')}_${certificado.codigoVerificacion}`;

  const handleDescargarPdf = async () => {
    setDescargandoPdf(true);
    try {
      await descargarElementoComoPdf('area-impresion-certificado', nombreArchivo);
    } finally {
      setDescargandoPdf(false);
    }
  };

  const handleImprimir = () => {
    imprimirDocumento(nombreArchivo, 'area-impresion-certificado');
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
                Documento Oficial con QR y Firma Digital — Código: <strong className="font-mono text-white">{certificado.codigoVerificacion}</strong>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer select-none bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-white/20 transition-colors">
              <input
                type="checkbox"
                checked={incluirSalario}
                onChange={e => setIncluirSalario(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="font-semibold text-[11px]">Incluir Salario</span>
            </label>
            <button
              type="button"
              id="btn-firmar-digital-certificado"
              onClick={() => setModalFirmaOpen(true)}
              className="px-3 py-1.5 bg-blue-950/80 hover:bg-blue-900 text-[#00FF00] font-bold rounded-lg text-xs flex items-center gap-1.5 border border-[#00FF00]/40 shadow-xs transition-all cursor-pointer"
              title="Abrir herramienta de firma digital para estampar trazo manual o tipográfico"
            >
              <PenTool className="w-4 h-4 text-[#00FF00]" />
              <span>{firmaDigital ? 'Firma Estampada' : 'Firmar Digital'}</span>
            </button>
            <button
              type="button"
              id="btn-descargar-pdf-certificado"
              onClick={handleDescargarPdf}
              disabled={descargandoPdf}
              className="px-3.5 py-1.5 bg-[#00FF00] hover:bg-emerald-400 text-[#18235C] font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
              title="Exportar archivo PDF directamente a su equipo"
            >
              <FileDown className={`w-4 h-4 ${descargandoPdf ? 'animate-bounce' : ''}`} />
              <span>{descargandoPdf ? 'Generando PDF...' : 'Exportar a PDF'}</span>
            </button>
            <button
              type="button"
              id="btn-imprimir-pdf-certificado"
              onClick={handleImprimir}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 border border-white/20 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir</span>
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
        <div className="documento-imprimible p-8 sm:p-12 overflow-y-auto space-y-6 text-[#282829] bg-white text-xs sm:text-sm font-serif leading-relaxed" id="area-impresion-certificado">
          {/* Header Institucional de la Empresa */}
          <div className="flex items-start justify-between border-b-2 border-[#18235C] pb-4 font-sans gap-4">
            <div className="flex items-center gap-3">
              {certificado.empresa.identidadVisual?.logoUrl ? (
                <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                  <img
                    src={certificado.empresa.identidadVisual.logoUrl}
                    alt={certificado.empresa.nombreComercial || 'Logo'}
                    className="max-h-16 w-auto max-w-[170px] object-contain shrink-0"
                  />
                </div>
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

            {incluirSalario ? (
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
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-sans my-3 text-xs">
                <span className="text-slate-500 uppercase font-bold block text-[10px]">Denominación del Cargo</span>
                <strong className="text-[#18235C] text-sm">{certificado.cargoNombre}</strong>
                <p className="text-[10px] text-slate-500 mt-1 italic">
                  (Constancia expedida sin divulgación de asignación salarial a solicitud expresa del trabajador, conforme al Art. 57 #7 del CST).
                </p>
              </div>
            )}

            <p>
              Para constancia de lo anterior, y a solicitud expresa del interesado(a), se expide la presente certificación con destino a: <strong className="font-sans font-bold text-[#18235C]">{certificado.entidadDestino || certificado.motivoDestino}</strong>, en la ciudad de {certificado.centroTrabajoCiudad || certificado.empresa.contacto?.ciudad || 'Bogotá D.C.'}, a los {certificado.fechaEmision}.
            </p>
          </div>

          {/* Firma Electrónica y Código QR Oficial */}
          <div className="pt-8 flex items-end justify-between font-sans border-t border-slate-200 text-xs gap-4">
            {/* Sello de Firma Digital */}
            <div className="flex-1 max-w-sm">
              <FirmaDigitalStamp
                firma={firmaDigital}
                firmanteDefault={{
                  nombre: certificado.firmanteNombre,
                  cargo: certificado.firmanteCargo,
                  documento: certificado.empresa.representanteLegal?.tipoDocumento ? `${certificado.empresa.representanteLegal.tipoDocumento} Firmante` : undefined
                }}
                labelCargo="Firma Autorizada · Gestión Humana"
                onOpenFirmarModal={() => setModalFirmaOpen(true)}
              />
            </div>

            {/* Código QR Auténtico de Verificación */}
            <div className="shrink-0">
              <CodigoQRVerificacion
                codigoVerificacion={certificado.codigoVerificacion}
                tipoDocumento="Certificado Laboral"
                titularNombre={certificado.empleado.nombre}
                titularDocumento={certificado.empleado.documento}
                fechaEmision={certificado.fechaEmision}
                size={84}
              />
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

      {/* Modal de Firma Digital Integrada */}
      <HerramientaFirmaDigitalModal
        isOpen={modalFirmaOpen}
        onClose={() => setModalFirmaOpen(false)}
        onSaveSignature={(firma) => setFirmaDigital(firma)}
        tituloDocumento={`Certificado Laboral - ${certificado.empleado.nombre}`}
        firmanteSugerido={{
          nombre: certificado.firmanteNombre,
          cargo: certificado.firmanteCargo
        }}
      />
    </div>
  );
};

