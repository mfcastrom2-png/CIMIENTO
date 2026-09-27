import React from 'react';
import { ExternalLink, Link2, HardDrive, Check } from 'lucide-react';
import { isGoogleDriveUrl, formatDriveViewUrl } from '../../utils/driveUtils';

interface DriveLinkFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  className?: string;
}

export const DriveLinkField: React.FC<DriveLinkFieldProps> = ({
  label,
  value,
  onChange,
  placeholder = 'https://drive.google.com/file/d/.../view?usp=sharing',
  required = false,
  helpText = 'Pega el enlace de Google Drive con acceso de lectura para visualizar el soporte sin costos de hosting.',
  className = ''
}) => {
  const isDrive = isGoogleDriveUrl(value);
  const finalViewUrl = formatDriveViewUrl(value);

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-[#18235C]">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
        {value && (
          <a
            href={finalViewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 hover:underline cursor-pointer"
            title="Abrir enlace en pestaña nueva"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Ver archivo en Drive</span>
          </a>
        )}
      </div>

      <div className="relative flex items-center">
        <div className="absolute left-2.5 text-slate-400 pointer-events-none">
          {isDrive ? (
            <HardDrive className="w-4 h-4 text-emerald-600" />
          ) : (
            <Link2 className="w-4 h-4" />
          )}
        </div>
        <input
          type="url"
          required={required}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-8 pr-20 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded-lg text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-[#18235C]"
        />
        {isDrive && (
          <div className="absolute right-2 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-0.5">
            <Check className="w-3 h-3" />
            <span>Drive</span>
          </div>
        )}
      </div>

      {helpText && (
        <p className="text-[10px] text-slate-500 leading-tight">
          {helpText}
        </p>
      )}
    </div>
  );
};
