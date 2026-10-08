import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface CodigoQRVerificacionProps {
  codigoVerificacion: string;
  tipoDocumento?: string;
  titularNombre?: string;
  titularDocumento?: string;
  fechaEmision?: string;
  size?: number;
  className?: string;
  showText?: boolean;
}

export const CodigoQRVerificacion: React.FC<CodigoQRVerificacionProps> = ({
  codigoVerificacion,
  tipoDocumento = 'Certificado Laboral',
  titularNombre,
  titularDocumento,
  fechaEmision,
  size = 90,
  className = '',
  showText = true
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const generarQR = async () => {
      try {
        // Generar URL institucional de validación pública
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bgroup-talento-humano.co';
        const urlVerificacion = `${baseUrl}/verificar?codigo=${encodeURIComponent(codigoVerificacion)}`;

        const dataUrl = await QRCode.toDataURL(urlVerificacion, {
          width: size * 2,
          margin: 1,
          color: {
            dark: '#18235C',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'M'
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.warn('Error generando código QR de verificación:', err);
      }
    };

    generarQR();
  }, [codigoVerificacion, size]);

  return (
    <div className={`flex flex-col items-center justify-center text-center p-2 bg-white rounded-xl border border-slate-200 shadow-2xs ${className}`}>
      {qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt={`Código QR de Verificación ${codigoVerificacion}`}
          style={{ width: `${size}px`, height: `${size}px` }}
          className="object-contain block mx-auto"
        />
      ) : (
        <div
          style={{ width: `${size}px`, height: `${size}px` }}
          className="bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-[9px] text-slate-400 font-mono"
        >
          Generando...
        </div>
      )}

      {showText && (
        <div className="mt-1 space-y-0.5 font-sans leading-tight">
          <span className="text-[9px] font-extrabold text-[#18235C] block uppercase tracking-wider">
            Autenticidad Digital
          </span>
          <span className="text-[8px] font-mono text-slate-500 block">
            Cód: {codigoVerificacion.slice(-10)}
          </span>
          <span className="text-[7.5px] text-emerald-700 font-bold block">
            Ley 527/1999 CST
          </span>
        </div>
      )}
    </div>
  );
};
