import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Logotipo Vectorial Exclusivo para CIMIENTO HUMANO
 * Simboliza la interconexión humana, telecomunicaciones, SG-SST y talento
 */
export const LogoCimientoHumano: React.FC<LogoProps> = ({ className = '', size = 56 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 ${className}`}
    >
      <defs>
        <linearGradient id="humanoGradBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#18235C" />
          <stop offset="50%" stopColor="#1E3A8A" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id="humanoGradAccent" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <filter id="humanoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Escudo / Base redondeada */}
      <rect x="6" y="6" width="88" height="88" rx="24" fill="url(#humanoGradBg)" />
      <rect x="7" y="7" width="86" height="86" rx="23" stroke="#60A5FA" strokeWidth="2" strokeOpacity="0.4" />

      {/* Red de conexiones / Nodos de fibra */}
      <path d="M28 62 L50 42 L72 62" stroke="#93C5FD" strokeWidth="2.5" strokeDasharray="3 3" strokeOpacity="0.6" />
      <path d="M36 32 L50 42 L64 32" stroke="#38BDF8" strokeWidth="2.5" strokeOpacity="0.8" />
      <path d="M50 42 L50 78" stroke="url(#humanoGradAccent)" strokeWidth="3" />

      {/* Círculo central: Figura humana estilizada (cabeza y torso) */}
      <circle cx="50" cy="30" r="10" fill="url(#humanoGradAccent)" filter="url(#humanoGlow)" />
      
      {/* Nodos de equipo laterales */}
      <circle cx="28" cy="46" r="6" fill="#38BDF8" />
      <circle cx="72" cy="46" r="6" fill="#38BDF8" />

      {/* Ondas de conexión / Red institucional */}
      <path
        d="M26 70 C 34 58, 66 58, 74 70"
        stroke="white"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="50" cy="74" r="5" fill="#34D399" />

      {/* Isotipo Cimiento: Anillos de cimentación sólida */}
      <path d="M22 84 L78 84" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.8" />
      <path d="M32 90 L68 90" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  );
};

/**
 * Logotipo Vectorial Exclusivo para CIMIENTO COMERCIAL
 * Simboliza recaudación, terminal comercial, flujo transaccional y telecomunicaciones
 */
export const LogoCimientoComercial: React.FC<LogoProps> = ({ className = '', size = 56 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-300 ${className}`}
    >
      <defs>
        <linearGradient id="comercialGradBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B132B" />
          <stop offset="50%" stopColor="#1C2541" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
        <linearGradient id="comercialGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="comercialEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <filter id="comercialGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Escudo / Base redondeada comercial */}
      <rect x="6" y="6" width="88" height="88" rx="24" fill="url(#comercialGradBg)" />
      <rect x="7" y="7" width="86" height="86" rx="23" stroke="#F59E0B" strokeWidth="2" strokeOpacity="0.4" />

      {/* Torre / Antena emisora con señal comercial */}
      <path d="M50 20 L50 68" stroke="url(#comercialGold)" strokeWidth="3" strokeLinecap="round" />
      <path d="M38 32 C 44 26, 56 26, 62 32" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.7" />
      <path d="M30 40 C 40 30, 60 30, 70 40" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.4" />

      {/* Símbolo de valor / moneda comercial y fibra tecnológica */}
      <circle cx="50" cy="54" r="16" fill="#064E3B" stroke="url(#comercialGold)" strokeWidth="2.5" />
      <circle cx="50" cy="54" r="12" stroke="url(#comercialEmerald)" strokeWidth="1.5" strokeDasharray="3 2" />

      {/* Signo de Recaudo / Peso ($) estilizado de alta definición */}
      <path
        d="M50 44 L50 64 M46 48 C 46 46, 54 46, 54 50 C 54 54, 46 54, 46 58 C 46 62, 54 62, 54 60"
        stroke="url(#comercialGold)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#comercialGlow)"
      />

      {/* Flechas de flujo transaccional / Recaudo & Facturación */}
      <path
        d="M26 62 L20 68 L26 74 M22 68 L40 68"
        stroke="#34D399"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M74 62 L80 68 L74 74 M78 68 L60 68"
        stroke="#FBBF24"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Base sólida de cimiento comercial */}
      <path d="M22 84 L78 84" stroke="url(#comercialGold)" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 90 L68 90" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.8" />
    </svg>
  );
};
