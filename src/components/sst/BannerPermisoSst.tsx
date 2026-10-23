import React from 'react';
import { Lock, ShieldAlert, AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { Role, UsuarioSistema } from '../../types';
import { obtenerEtiquetaRolSST } from '../../utils/sstAuthUtils';

interface BannerPermisoSstProps {
  currentUser?: UsuarioSistema | null;
  userRole?: Role;
  modulo?: string;
  moduloNombre?: string;
  accionIntentada?: string;
  className?: string;
}

export const BannerPermisoSst: React.FC<BannerPermisoSstProps> = ({
  currentUser,
  userRole,
  modulo,
  moduloNombre,
  accionIntentada,
  className = ''
}) => {
  const nombreModulo = moduloNombre || modulo || 'Seguridad y Salud en el Trabajo (SG-SST)';
  const rolEtiqueta = obtenerEtiquetaRolSST(currentUser?.rol);
  const nombreUsuario = currentUser?.nombre || 'Usuario en Sesión';
  const rolCodigo = currentUser?.rol || userRole || 'sin rol';

  return (
    <div
      role="alert"
      className={`p-4 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-900 shadow-xs relative overflow-hidden ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 border border-amber-400/40">
          <Lock className="w-5 h-5 text-amber-700" />
        </div>

        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <span>Acceso en Modo Lectura — Protección de Registros SG-SST</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-200/80 text-amber-900 border border-amber-300">
                Solo Consulta
              </span>
            </h4>

            <span className="text-[11px] font-semibold text-amber-800 bg-white/70 px-2 py-0.5 rounded border border-amber-200">
              Res. 0312 de 2019 / Dec. 1072 de 2015
            </span>
          </div>

          <p className="text-xs text-amber-800 leading-relaxed">
            Para <strong>crear, editar o eliminar registros</strong> en {nombreModulo}
            {accionIntentada ? ` (intento de ${accionIntentada})` : ''}, se requiere
            contar con el rol institucional <strong className="font-mono bg-white/80 px-1 py-0.2 rounded border border-amber-300">responsable_sst</strong> o <strong className="font-mono bg-white/80 px-1 py-0.2 rounded border border-amber-300">admin_gh</strong>.
          </p>

          <div className="pt-1 flex flex-wrap items-center gap-3 text-[11px] text-amber-900/80">
            <span className="flex items-center gap-1">
              <span className="font-semibold text-amber-950">Usuario:</span>
              <span className="font-medium">{nombreUsuario}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="font-semibold text-amber-950">Rol Asignado:</span>
              <span className="font-bold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                {rolEtiqueta} ({rolCodigo})
              </span>
            </span>
            <span>•</span>
            <span className="text-amber-800 italic">
              Usted dispone de acceso irrestricto para consultar, auditar e imprimir informes oficiales.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
