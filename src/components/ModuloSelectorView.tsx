import React from 'react';
import {
  Users,
  Briefcase,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Lock,
  Building2,
  HardHat,
  Receipt,
  FileCheck2,
  ArrowRight,
  LogOut,
  Layers,
  CircleDollarSign
} from 'lucide-react';
import { UsuarioSistema, ConfiguracionEmpresa, ModuloSistema } from '../types';
import { LogoCimientoHumano, LogoCimientoComercial } from './logos/LogosModulos';
import { CorporateLogo } from './CorporateLogo';

interface ModuloSelectorViewProps {
  currentUser: UsuarioSistema;
  empresa?: ConfiguracionEmpresa;
  onSeleccionarModulo: (modulo: ModuloSistema) => void;
  onLogout: () => void;
}

export const ModuloSelectorView: React.FC<ModuloSelectorViewProps> = ({
  currentUser,
  empresa,
  onSeleccionarModulo,
  onLogout
}) => {
  const rol = currentUser.rol || 'empleado';
  // Los roles empleados solo podrán ver las opciones comerciales si tienen roles administrativos
  const esAdmin = rol === 'superadmin' || rol === 'admin_gh';
  const puedeVerComercial = esAdmin;

  const nombreUsuario = currentUser.nombre || currentUser.email || 'Colaborador';
  const nombreEmpresa = empresa?.nombreComercial || 'B GROUP INGENIERIA S.A.S.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F26] via-[#101740] to-[#18235C] text-white flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative overflow-hidden select-none">
      
      {/* Fondo decorativo con nodos de telecomunicaciones */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#38BDF8] blur-[120px]" />
        <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-[#F59E0B] blur-[140px]" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-[#10B981] blur-[130px]" />
      </div>

      {/* ENCABEZADO SUPERIOR */}
      <header className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-2xl shadow-md border border-white/20">
            <CorporateLogo
              logoUrl={empresa?.identidadVisual?.logoUrl}
              nombreComercial={nombreEmpresa}
              size="md"
              imageClassName="max-h-10 w-auto"
            />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#38BDF8] block">
              PLATAFORMA INTEGRAL EMPRESARIAL
            </span>
            <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">
              {nombreEmpresa}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold text-slate-200 block truncate max-w-[200px]">
              {nombreUsuario}
            </span>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/10 text-[#38BDF8] inline-block border border-white/10">
              Rol: {rol === 'superadmin' ? 'Super Administrador' : rol === 'admin_gh' ? 'Administrador GH' : 'Colaborador'}
            </span>
          </div>

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-rose-600/80 text-white text-xs font-semibold transition-all border border-white/10 cursor-pointer shadow-sm hover:border-rose-400"
            title="Cerrar Sesión Segura"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* CONTENIDO CENTRAL: HUB DE SELECCIÓN DE MÓDULOS */}
      <main className="relative z-10 max-w-5xl mx-auto w-full my-auto py-8 text-center space-y-8">
        
        {/* Titular */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18235C]/80 border border-[#8FA7D6]/40 text-[#8FA7D6] text-xs font-bold shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>PORTAL CENTRAL DE OPERACIONES · SELECCIONE EL MÓDULO</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Ecosistema Corporativo <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#38BDF8] via-[#60A5FA] to-[#F59E0B]">CIMIENTO</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Plataforma unificada para la gestión del capital humano y las operaciones comerciales de alta disponibilidad técnica.
          </p>
        </div>

        {/* TARJETAS DE MÓDULOS */}
        <div className={`grid grid-cols-1 ${puedeVerComercial ? 'md:grid-cols-2' : 'max-w-md mx-auto'} gap-6 sm:gap-8 text-left`}>
          
          {/* MÓDULO 1: CIMIENTO HUMANO */}
          <div
            onClick={() => onSeleccionarModulo('humano')}
            className="group relative bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/15 hover:border-[#38BDF8]/70 hover:shadow-2xl hover:shadow-[#0284C7]/20 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
          >
            {/* Acento superior de color azul/cian institucional */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#38BDF8] via-[#60A5FA] to-[#34D399]" />
            
            <div>
              <div className="flex items-center justify-between mb-5">
                <LogoCimientoHumano size={64} className="group-hover:scale-110 transition-transform drop-shadow-lg" />
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#38BDF8]/20 text-[#38BDF8] border border-[#38BDF8]/40">
                  Gestión Humana & SST
                </span>
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight mb-2 group-hover:text-[#38BDF8] transition-colors">
                CIMIENTO HUMANO
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                Gestión integral del talento, SG-SST (Res. 0312/2019), nómina electrónica CST, entregas de EPP, plan de capacitaciones, evaluaciones y expedientes digitales.
              </p>

              <div className="space-y-2 mb-6 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                  <span>Nómina, Liquidaciones y Prestaciones Sociales</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
                  <span>Seguridad y Salud en el Trabajo (21 Estándares)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#60A5FA]" />
                  <span>Dotación EPP, Copasst, Exámenes Médicos y Diplomas</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-[#18235C] via-[#1E3A8A] to-[#0284C7] hover:from-[#1E3A8A] hover:to-[#0284C7] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#0284C7]/25 group-hover:gap-3 transition-all cursor-pointer border border-[#60A5FA]/30"
            >
              <span>Ingresar a Cimiento Humano</span>
              <ArrowRight className="w-4 h-4 text-[#38BDF8] group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* MÓDULO 2: CIMIENTO COMERCIAL (Solo visible con roles administrativos) */}
          {puedeVerComercial ? (
            <div
              onClick={() => onSeleccionarModulo('comercial')}
              className="group relative bg-gradient-to-br from-white/10 to-white/[0.03] backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-white/15 hover:border-[#F59E0B]/70 hover:shadow-2xl hover:shadow-[#F59E0B]/20 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
            >
              {/* Acento superior de color ámbar/dorado comercial */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#10B981]" />

              <div>
                <div className="flex items-center justify-between mb-5">
                  <LogoCimientoComercial size={64} className="group-hover:scale-110 transition-transform drop-shadow-lg" />
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#F59E0B]/20 text-[#FBBF24] border border-[#F59E0B]/40">
                    Comercial & Recaudo
                  </span>
                </div>

                <h2 className="text-2xl font-black text-white tracking-tight mb-2 group-hover:text-[#FBBF24] transition-colors">
                  CIMIENTO COMERCIAL
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mb-6 leading-relaxed">
                  Terminal de cajero, subida masiva de saldos, recaudo multicanal (WhatsApp/Email/Nativo), arqueo inmutable de caja y contratos con firma digital en Google Drive.
                </p>

                <div className="space-y-2 mb-6 text-xs text-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                    <span>Caja & Cobros con Comprobante (WhatsApp / Correo / Móvil)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span>Subida Masiva de Saldos e Importación de Cartera</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]" />
                    <span>Firma Digital de Contratos en Drive & Arqueo Inmutable</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-[#78350F] via-[#92400E] to-[#D97706] hover:from-[#92400E] hover:to-[#B45309] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#F59E0B]/25 group-hover:gap-3 transition-all cursor-pointer border border-[#F59E0B]/40"
              >
                <span>Ingresar a Cimiento Comercial</span>
                <ArrowRight className="w-4 h-4 text-[#FDE68A] group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          ) : (
            /* Si es empleado sin rol administrativo: Notificación informativa de perfil protegido */
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between opacity-80">
              <div>
                <div className="flex items-center gap-3 mb-4 text-[#8FA7D6]">
                  <Lock className="w-6 h-6 text-[#8FA7D6]" />
                  <span className="text-xs font-bold uppercase tracking-wider">Acceso Restringido</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Módulos Administrativos</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Las funciones comerciales y de facturación están reservadas para roles administrativos y comerciales asignados. Su sesión actual tiene acceso habilitado al portal de <strong>CIMIENTO HUMANO</strong>.
                </p>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* PIE DE PÁGINA */}
      <footer className="relative z-10 text-center py-4 text-xs text-slate-400 border-t border-white/10 max-w-7xl mx-auto w-full">
        <p>
          B GROUP INGENIERIA S.A.S. · Red Operativa & Conectividad Empresarial · Versión Institucional 2026
        </p>
      </footer>
    </div>
  );
};
