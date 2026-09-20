import React from 'react';
import { SolicitudEntregaEPP } from '../types';
import {
  FileText,
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
  HardHat,
  Building2,
  Calendar,
  Award
} from 'lucide-react';

interface ActaEntregaEppModalProps {
  solicitud: SolicitudEntregaEPP;
  onClose: () => void;
}

export const ActaEntregaEppModal: React.FC<ActaEntregaEppModalProps> = ({ solicitud, onClose }) => {
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
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Descargar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#282829] hover:text-[#18235C] rounded-lg hover:bg-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 sm:p-10 space-y-6 text-[#18235C] print:p-0 print:m-0 text-xs leading-relaxed">
          
          {/* Institutional Document Header */}
          <div className="border-2 border-[#18235C] rounded-lg p-4 bg-[#FFFFFF]/50">
            <div className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-3 border-r border-[#8FA7D6] pr-3 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-lg bg-[#18235C] text-[#E2B765] flex items-center justify-center font-serif text-xl font-bold mb-1">
                  B
                </div>
                <span className="font-bold text-xs tracking-tight">B GROUP INGENIERIA S.A.S.</span>
                <span className="text-[10px] text-[#282829]">NIT: 900.995.99-2</span>
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

          {/* Formal Signatures Section */}
          <div className="grid grid-cols-2 gap-8 pt-6">
            <div className="border-t-2 border-[#18235C] pt-2 text-center">
              <div className="font-bold text-xs text-[#18235C]">{solicitud.empleadoNombre}</div>
              <div className="text-[10px] text-[#282829]">Firma del Colaborador (Recibí Conforme)</div>
              <div className="text-[10px] text-[#282829] font-mono">
                C.C. Registrada en Hoja de Vida
              </div>
              <div className="text-[10px] text-[#18235C] font-semibold mt-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Firmado y verificado digitalmente</span>
              </div>
            </div>

            <div className="border-t-2 border-[#18235C] pt-2 text-center">
              <div className="font-bold text-xs text-[#18235C]">{solicitud.responsableEntrega || 'Julián Castro (Vigía SST)'}</div>
              <div className="text-[10px] text-[#282829]">Responsable SG-SST / Entrega de Almacén</div>
              <div className="text-[10px] text-[#282829]">B GROUP INGENIERIA S.A.S.</div>
              <div className="text-[10px] text-[#18235C] font-semibold mt-1 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Autorizado bajo Res. 0312 de 2019</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
