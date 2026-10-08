import React from 'react';
import { ShieldCheck, PenTool, CheckCircle2, Lock } from 'lucide-react';
import { DatosFirmaDigital } from './HerramientaFirmaDigitalModal';

interface FirmaDigitalStampProps {
  firma?: DatosFirmaDigital | null;
  firmanteDefault?: {
    nombre: string;
    cargo: string;
    documento?: string;
  };
  labelCargo?: string;
  onOpenFirmarModal?: () => void;
  readOnly?: boolean;
  className?: string;
}

export const FirmaDigitalStamp: React.FC<FirmaDigitalStampProps> = ({
  firma,
  firmanteDefault,
  labelCargo = 'Firma y Sello Autorizado',
  onOpenFirmarModal,
  readOnly = false,
  className = ''
}) => {
  const nombreFirmante = firma?.firmanteNombre || firmanteDefault?.nombre || 'Representante Autorizado';
  const cargoFirmante = firma?.firmanteCargo || firmanteDefault?.cargo || 'Dirección de Gestión Humana';
  const documentoFirmante = firma?.firmanteDocumento || firmanteDefault?.documento;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {firma?.dataUrl ? (
        <div className="space-y-1">
          {/* Imagen de la firma digital estampada */}
          <div className="relative border-b-2 border-[#18235C] pb-1 h-14 flex items-end">
            <img
              src={firma.dataUrl}
              alt={`Firma de ${nombreFirmante}`}
              className="max-h-12 w-auto max-w-full object-contain"
            />
            <div className="absolute right-0 bottom-1 flex items-center gap-1 text-[8px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-300">
              <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
              <span>{firma.hashFirma ? firma.hashFirma.slice(0, 16) : 'FIRMADO'}</span>
            </div>
          </div>

          <div>
            <strong className="block text-[#18235C] font-bold uppercase text-xs">
              {nombreFirmante}
            </strong>
            {documentoFirmante && (
              <span className="text-slate-600 block text-[10px] font-mono font-semibold">
                C.C. {documentoFirmante}
              </span>
            )}
            <span className="text-slate-600 block text-[11px] font-medium">
              {cargoFirmante}
            </span>
            <span className="text-[9px] text-emerald-700 font-mono block">
              Firmado digitalmente: {firma.fechaFirmaTexto}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="w-56 h-12 border-b-2 border-slate-400 flex items-end justify-between pb-1 font-mono text-[10px] text-slate-400 italic">
            <span>[Espacio para Firma Digital]</span>
            {!readOnly && onOpenFirmarModal && (
              <button
                type="button"
                onClick={onOpenFirmarModal}
                className="px-2 py-0.5 bg-[#18235C] hover:bg-[#101740] text-white font-sans text-[10px] font-bold rounded flex items-center gap-1 shadow-2xs cursor-pointer not-italic print:hidden"
                title="Firmar digitalmente este documento"
              >
                <PenTool className="w-3 h-3 text-[#00FF00]" />
                <span>Firmar Digital</span>
              </button>
            )}
          </div>
          <div>
            <strong className="block text-[#18235C] font-bold uppercase text-xs">
              {nombreFirmante}
            </strong>
            {documentoFirmante && (
              <span className="text-slate-500 block text-[10px] font-mono">
                C.C. {documentoFirmante}
              </span>
            )}
            <span className="text-slate-600 block text-[11px] font-medium">
              {cargoFirmante}
            </span>
            <span className="text-[9px] text-slate-400 block font-sans">
              {labelCargo}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
