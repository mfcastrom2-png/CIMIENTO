import React, { useState, useEffect } from 'react';
import { formatDriveDirectUrl, getDriveImageCandidates, isGoogleDriveUrl } from '../utils/driveUtils';

interface CorporateLogoProps {
  logoUrl?: string;
  nombreComercial?: string;
  className?: string;
  imageClassName?: string;
  showTextFallback?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const CorporateLogo: React.FC<CorporateLogoProps> = ({
  logoUrl,
  nombreComercial = 'B GROUP INGENIERIA S.A.S.',
  className = '',
  imageClassName = 'max-h-12 w-auto object-contain',
  showTextFallback = true,
  size = 'md'
}) => {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [candidates, setCandidates] = useState<string[]>([]);

  useEffect(() => {
    setCandidateIndex(0);
    setHasError(false);
    if (!logoUrl) {
      setCandidates([]);
      return;
    }

    if (isGoogleDriveUrl(logoUrl)) {
      setCandidates(getDriveImageCandidates(logoUrl));
    } else {
      setCandidates([logoUrl]);
    }
  }, [logoUrl]);

  const handleImageError = () => {
    if (candidateIndex + 1 < candidates.length) {
      // Intentar con el siguiente endpoint de Google Drive / CDN
      setCandidateIndex(prev => prev + 1);
    } else {
      // Agotados los candidatos, pasar a fallback corporativo
      setHasError(true);
    }
  };

  const currentSrc = candidates[candidateIndex];

  // Si hay URL válida y no han fallado todos los candidatos
  if (currentSrc && !hasError) {
    return (
      <div className={`flex items-center justify-center transition-all ${className}`}>
        <img
          src={currentSrc}
          alt={nombreComercial}
          className={`${imageClassName} transition-opacity duration-300`}
          referrerPolicy="no-referrer"
          loading="eager"
          onError={handleImageError}
        />
      </div>
    );
  }

  // Fallback de Marca Corporativa Vectorial
  const sizeClasses = {
    sm: { box: 'w-7 h-7 text-xs', title: 'text-xs', subtitle: 'text-[9px]' },
    md: { box: 'w-9 h-9 text-base', title: 'text-sm', subtitle: 'text-[10px]' },
    lg: { box: 'w-12 h-12 text-xl', title: 'text-base', subtitle: 'text-xs' },
    xl: { box: 'w-16 h-16 text-2xl', title: 'text-lg', subtitle: 'text-xs' }
  }[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`${sizeClasses.box} rounded-xl bg-gradient-to-br from-[#18235C] via-[#1E3A8A] to-[#0284C7] text-white flex items-center justify-center font-black shadow-md shrink-0 border border-white/20`}
        title={nombreComercial}
      >
        <span>B</span>
      </div>
      {showTextFallback && (
        <div className="text-left leading-tight">
          <span className={`font-black text-[#18235C] tracking-tight block ${sizeClasses.title}`}>
            {nombreComercial}
          </span>
          <span className={`text-slate-500 font-bold uppercase tracking-wider block ${sizeClasses.subtitle}`}>
            Telecomunicaciones & TIC
          </span>
        </div>
      )}
    </div>
  );
};
