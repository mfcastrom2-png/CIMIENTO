import React, { useState } from 'react';
import { SolicitudEntregaEPP, ConfiguracionEmpresa } from '../types';
import { initialEmpresa } from '../data/initialData';
import { imprimirDocumento, descargarElementoComoPdf } from '../utils/printUtils';
import {
  FileText,
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  HardHat,
  Building2,
  Calendar,
  Award,
  Download,
  FileDown,
  PenTool
} from 'lucide-react';
import { CodigoQRVerificacion } from './CodigoQRVerificacion';
import { FirmaDigitalStamp } from './FirmaDigitalStamp';
import { HerramientaFirmaDigitalModal, DatosFirmaDigital } from './HerramientaFirmaDigitalModal';
import { registrarCertificadoEmitido, generarHashIntegridadDocumento } from '../services/verificacionCertificadosService';

interface ActaEntregaEppModalProps {
  solicitud: SolicitudEntregaEPP;
  empresa?: ConfiguracionEmpresa;
  onClose: () => void;
}

export const ActaEntregaEppModal: React.FC<ActaEntregaEppModalProps> = ({ solicitud, empresa = initialEmpresa, onClose }) => {
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [modalFirmaOpen, setModalFirmaOpen] = useState(false);
  const [firmanteActualTipo, setFirmanteActualTipo] = useState<'colaborador' | 'responsable'>('colaborador');
  const [firmaColaborador, setFirmaColaborador] = useState<DatosFirmaDigital | null>(null);
  const [firmaResponsable, setFirmaResponsable] = useState<DatosFirmaDigital | null>(null);

  const codigoVerificacion = solicitud.actaEntregaNumero || `ACTA-EPP-${solicitud.id.slice(-6).toUpperCase()}`;
  const nombreArchivo = `Acta_Entrega_EPP_${codigoVerificacion}_${solicitud.empleadoNombre.replace(/\s+/g, '_')}`;

  const handleDescargarPdf = async () => {
    setDescargandoPdf(true);
    try {
      await registrarCertificadoEmitido({
        codigoVerificacion,
        tipoDocumento: 'Acta de Entrega de EPP',
        titularNombre: solicitud.empleadoNombre,
        titularDocumento: 'Documento Registrado',
        titularCargo: solicitud.eppNombre,
        fechaEmision: solicitud.fechaEntrega || new Date().toLocaleDateString('es-CO'),
        fechaRegistroISO: new Date().toISOString(),
        emisorRazonSocial: empresa?.razonSocial || empresa?.nombreComercial || 'Empresa',
        emisorNit: `${empresa?.nit || 'NIT'}-${empresa?.digitoVerificacion || ''}`,
        firmanteNombre: firmaResponsable?.firmanteNombre || solicitud.responsableEntrega || 'Responsable SG-SST',
        firmanteCargo: 'Responsable SG-SST / Almacén',
        hashIntegridad: generarHashIntegridadDocumento({ codigo: codigoVerificacion, elemento: solicitud.eppNombre, cant: solicitud.cantidad }),
        estado: 'VIGENTE_AUTENTICO',
        firmaDigitalUrl: firmaColaborador?.dataUrl || firmaResponsable?.dataUrl
      });
      await descargarElementoComoPdf('area-impresion-acta-epp', nombreArchivo);
    } finally {
      setDescargandoPdf(false);
    }
  };

  const handleImprimir = () => {
    imprimirDocumento(nombreArchivo, 'area-impresion-acta-epp');
  };

  const abrirModalFirmar = (tipo: 'colaborador' | 'responsable') => {
    setFirmanteActualTipo(tipo);
    setModalFirmaOpen(true);
  };

  const handleGuardarFirma = (firma: DatosFirmaDigital) => {
    if (firmanteActualTipo === 'colaborador') {
      setFirmaColaborador(firma);
    } else {
      setFirmaResponsable(firma);
    }
    setModalFirmaOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-[#8FA7D6] max-w-3xl w-full overflow-hidden my-8">
        
        {/* Header Actions (hidden during print) */}
        <div className="bg-[#FFFFFF] border-b border-[#8FA7D6] px-6 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <HardHat className="w-4 h-4 text-[#18235C]" />
            <span className="text-xs font-bold text-[#18235C]">
              Acta Oficial de Entrega de Elementos de Protección Personal (EPP)
            </span>
            <span className="text-[10px] bg-[#18235C]/10 text-[#18235C] px-2 py-0.5 rounded font-mono font-semibold">
              {solicitud.actaEntregaNumero || 'ACT-EPP-OFICIAL'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDescargarPdf}
              disabled={descargandoPdf}
              className="px-3 py-1.5 bg-[#00FF00] hover:bg-emerald-400 text-[#18235C] font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Exportar archivo PDF directamente"
            >
              <FileDown className={`w-3.5 h-3.5 ${descargandoPdf ? 'animate-bounce' : ''}`} />
              <span>{descargandoPdf ? 'Generando PDF...' : 'Exportar a PDF'}</span>
            </button>
            <button
              onClick={handleImprimir}
              className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#282829] hover:text-[#18235C] rounded-lg hover:bg-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="documento-imprimible p-8 sm:p-10 space-y-6 text-[#18235C] print:p-0 print:m-0 text-xs leading-relaxed" id="area-impresion-acta-epp">
          
          {/* Institutional Document Header */}
          <div className="border-2 border-[#18235C] rounded-lg p-4 bg-[#FFFFFF]/50">
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-3 border-r border-[#8FA7D6] pr-3 flex flex-col items-center text-center">
                {empresa?.identidadVisual?.logoUrl ? (
                  <img
                    src={empresa.identidadVisual.logoUrl}
                    alt={empresa.nombreComercial || 'Logo'}
                    className="max-h-12 w-auto object-contain mb-1"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[#18235C] text-[#E2B765] flex items-center justify-center font-serif text-xl font-bold mb-1">
                    {empresa?.nombreComercial ? empresa.nombreComercial.charAt(0) : 'B'}
                  </div>
                )}
                <span className="font-bold text-xs tracking-tight">{empresa?.razonSocial || empresa?.nombreComercial || 'Empresa'}</span>
                {empresa?.nit && (
                  <span className="text-[10px] text-[#282829]">
                    NIT: {empresa.nit}{empresa.digitoVerificacion ? `-${empresa.digitoVerificacion}` : ''}
                  </span>
                )}
              </div>
              <div className="col-span-6 text-center px-2">
                <div className="text-[11px] font-semibold text-[#282829] uppercase tracking-wider">
                  SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO
                </div>
                <h2 className="text-sm font-bold font-serif text-[#18235C] uppercase">
                  REGISTRO Y CONSTANCIA INDIVIDUAL DE ENTREGA DE ELEMENTOS DE PROTECCIÓN PERSONAL (EPP)
                </h2>
                <div className="text-[10px] text-[#282829] mt-0.5">
                  Conforme a la Resolución 2400 de 1979 • Decreto 1072 de 2015 (Art. 2.2.4.6.24)
                </div>
              </div>
              <div className="col-span-3 border-l border-[#8FA7D6] pl-3 text-right text-[10px] space-y-1">
                <div>Código: <strong>SST-FOR-EPP-04</strong></div>
                <div>Versión: <strong>03</strong></div>
                <div>Fecha Acta: <strong>{solicitud.fechaEntrega || new Date().toISOString().slice(0, 10)}</strong></div>
                <div>Acta N°: <strong className="text-[#18235C]">{solicitud.actaEntregaNumero || 'ACT-EPP-2026-001'}</strong></div>
              </div>
            </div>
          </div>

          {/* Employee Identification */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#18235C] border-b border-[#8FA7D6] pb-1 mb-2">
              1. Identificación del Colaborador Receptor
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FFFFFF] p-3 rounded-lg border border-[#8FA7D6]">
              <div>
                <span className="text-[10px] text-[#282829] block">Nombre Completo</span>
                <span className="font-bold text-xs">{solicitud.empleadoNombre}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#282829] block">Cargo Desempeñado</span>
                <span className="font-medium text-xs">{solicitud.cargoNombre}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#282829] block">Fecha de Solicitud</span>
                <span className="font-medium text-xs">{solicitud.fechaSolicitud}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#282829] block">Fecha de Entrega Efectiva</span>
                <span className="font-bold text-xs text-[#18235C]">{solicitud.fechaEntrega || 'Al momento'}</span>
              </div>
            </div>
          </div>

          {/* EPP Technical Specifications Table */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#18235C] border-b border-[#8FA7D6] pb-1 mb-2">
              2. Detalle del Elemento de Protección Suministrado
            </div>
            <div className="border border-[#8FA7D6] rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FFFFFF] text-[#282829] border-b border-[#8FA7D6]">
                  <tr>
                    <th className="py-2 px-3">Código</th>
                    <th className="py-2 px-3">Elemento de Protección Personal</th>
                    <th className="py-2 px-3">Categoría</th>
                    <th className="py-2 px-3">Talla / Serie / Lote</th>
                    <th className="py-2 px-3 text-center">Cant.</th>
                    <th className="py-2 px-3">Motivo Entrega</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]">
                  <tr>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#18235C]">{solicitud.eppCodigo}</td>
                    <td className="py-2.5 px-3 font-semibold">{solicitud.eppNombre}</td>
                    <td className="py-2.5 px-3 text-[#282829]">{solicitud.eppCategoria}</td>
                    <td className="py-2.5 px-3">
                      <div>Talla: <strong>{solicitud.talla}</strong></div>
                      {solicitud.loteOSerie && (
                        <div className="text-[10px] font-mono text-[#282829]">Lote/Serie: {solicitud.loteOSerie}</div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold">{solicitud.cantidad}</td>
                    <td className="py-2.5 px-3 text-[#282829]">{solicitud.motivo}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {solicitud.observacionesEntrega && (
              <div className="mt-2 p-2 bg-[#FFFFFF] rounded border border-[#8FA7D6] text-[11px] text-[#282829]">
                <strong>Observaciones de Almacén / Entrega:</strong> {solicitud.observacionesEntrega}
              </div>
            )}
          </div>

          {/* Legal Worker Commitment Clauses (Resolución 2400 / Decreto 1072) */}
          <div className="bg-[#FFFFFF] p-3.5 rounded-lg border border-[#8FA7D6] space-y-2 text-[11px] text-[#282829]">
            <div className="font-bold text-[#18235C] text-xs uppercase flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#18235C]" />
              3. Declaración de Recepción y Compromiso del Trabajador
            </div>
            <p>
              Yo, <strong>{solicitud.empleadoNombre}</strong>, manifiesto que he recibido en perfecto estado de funcionamiento, 
              limpieza y conservación los Elementos de Protección Personal (EPP) descritos en la presente acta, 
              y me comprometo expresamente a:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Usar obligatoria y permanentemente los EPPs durante la jornada laboral en las actividades que entrañen riesgo.</li>
              <li>Velar por su adecuado mantenimiento, cuidado, aseo y almacenamiento seguro.</li>
              <li>No alterar, modificar ni transferir a terceros los elementos asignados para uso personal.</li>
              <li>Reportar de manera oportuna e inmediata al responsable del SG-SST cualquier daño, fisura o deterioro para su reposición.</li>
            </ul>
          </div>

          {/* Formal Signatures and QR Authenticity Section */}
          <div className="pt-6 border-t border-[#8FA7D6]/30">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
              {/* Firma Colaborador */}
              <div className="sm:col-span-5">
                <FirmaDigitalStamp
                  firma={firmaColaborador}
                  firmanteDefault={{
                    nombre: solicitud.empleadoNombre,
                    cargo: 'Colaborador (Recibí Conforme EPP)',
                    documento: 'C.C. Registrada'
                  }}
                  labelCargo="Firma de Constancia de Entrega y Recibo"
                  onOpenFirmarModal={() => abrirModalFirmar('colaborador')}
                />
              </div>

              {/* Código QR de Autenticidad */}
              <div className="sm:col-span-2 flex justify-center">
                <CodigoQRVerificacion
                  codigoVerificacion={codigoVerificacion}
                  tipoDocumento="Acta de Entrega de EPP"
                  titularNombre={solicitud.empleadoNombre}
                  size={75}
                />
              </div>

              {/* Firma Responsable SG-SST / Almacén */}
              <div className="sm:col-span-5">
                <FirmaDigitalStamp
                  firma={firmaResponsable}
                  firmanteDefault={{
                    nombre: solicitud.responsableEntrega || 'Responsable SG-SST',
                    cargo: 'Responsable SG-SST / Almacén',
                    documento: 'Licencia SST Vigente'
                  }}
                  labelCargo="Autorizado según Resolución 0312 de 2019"
                  onOpenFirmarModal={() => abrirModalFirmar('responsable')}
                />
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
              <span>Cód. Verificación: {codigoVerificacion}</span>
              <span>Acta de EPP con validez jurídica según Ley 527/1999 y Decreto 1072/2015</span>
            </div>
          </div>

        </div>

      </div>

      {/* Modal de Firma Digital */}
      <HerramientaFirmaDigitalModal
        isOpen={modalFirmaOpen}
        onClose={() => setModalFirmaOpen(false)}
        onSaveSignature={handleGuardarFirma}
        tituloDocumento={`Acta de Entrega de EPP: ${solicitud.eppNombre}`}
        firmanteSugerido={{
          nombre: firmanteActualTipo === 'colaborador' ? solicitud.empleadoNombre : (solicitud.responsableEntrega || 'Responsable SST'),
          cargo: firmanteActualTipo === 'colaborador' ? 'Colaborador' : 'Responsable SG-SST',
          documento: ''
        }}
      />
    </div>
  );
};
