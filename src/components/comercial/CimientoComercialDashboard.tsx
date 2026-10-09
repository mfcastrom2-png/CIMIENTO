import React, { useState, useEffect } from 'react';
import {
  Wallet,
  CreditCard,
  FileSpreadsheet,
  PenTool,
  Lock,
  ArrowLeft,
  LayoutDashboard,
  Users,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Layers,
  Building2,
  HardDrive
} from 'lucide-react';
import { UsuarioSistema, ConfiguracionEmpresa } from '../../types';
import { LogoCimientoComercial } from '../logos/LogosModulos';
import { CorporateLogo } from '../CorporateLogo';
import { CajaGestionView } from './CajaGestionView';
import { CobroRecaudoView } from './CobroRecaudoView';
import { SubidaMasivaSaldosView } from './SubidaMasivaSaldosView';
import { ContratosClientesView } from './ContratosClientesView';
import { ArqueoCajaView } from './ArqueoCajaView';
import {
  obtenerClientesComerciales,
  obtenerCajasTurnos,
  obtenerPagosRecaudos,
  obtenerContratosClientes
} from '../../services/comercialService';

interface CimientoComercialDashboardProps {
  currentUser: UsuarioSistema;
  empresa?: ConfiguracionEmpresa;
  onVolverAHumano: () => void;
  onLogout: () => void;
}

type TabComercial = 'cajero' | 'cobros' | 'saldos' | 'contratos' | 'arqueos';

export const CimientoComercialDashboard: React.FC<CimientoComercialDashboardProps> = ({
  currentUser,
  empresa,
  onVolverAHumano,
  onLogout
}) => {
  const [tabActiva, setTabActiva] = useState<TabComercial>('cobros');
  const [metricas, setMetricas] = useState({
    totalRecaudoHoy: 0,
    clientesEnMora: 0,
    contratosActivos: 0,
    cajaAbierta: false
  });

  const cargarMetricas = async () => {
    const [cls, cjs, pgs, cnts] = await Promise.all([
      obtenerClientesComerciales(),
      obtenerCajasTurnos(),
      obtenerPagosRecaudos(),
      obtenerContratosClientes()
    ]);

    const hoyStr = new Date().toISOString().split('T')[0];
    const recaudoHoy = pgs
      .filter(p => p.fecha.startsWith(hoyStr))
      .reduce((sum, p) => sum + p.monto, 0);

    const mora = cls.filter(c => c.saldoPendiente > 0).length;
    const cajaActiva = cjs.some(c => c.estado === 'Abierta');

    setMetricas({
      totalRecaudoHoy: recaudoHoy,
      clientesEnMora: mora,
      contratosActivos: cnts.length,
      cajaAbierta: cajaActiva
    });
  };

  useEffect(() => {
    cargarMetricas();
  }, [tabActiva]);

  const tabs = [
    { id: 'cobros' as TabComercial, label: 'Cobro & Recaudo', icon: CreditCard, color: 'text-emerald-600' },
    { id: 'cajero' as TabComercial, label: 'Terminal de Cajero', icon: Wallet, color: 'text-blue-600' },
    { id: 'saldos' as TabComercial, label: 'Subida Masiva de Saldos', icon: FileSpreadsheet, color: 'text-amber-600' },
    { id: 'contratos' as TabComercial, label: 'Contratos & Firma Drive', icon: PenTool, color: 'text-indigo-600' },
    { id: 'arqueos' as TabComercial, label: 'Arqueos Inmutables', icon: Lock, color: 'text-rose-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none">
      
      {/* BARRA SUPERIOR INSTITUCIONAL */}
      <header className="bg-[#18235C] text-white border-b border-[#101740] shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo y Nombre del Módulo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onVolverAHumano}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#38BDF8] transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Volver a Cimiento Humano"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Cimiento Humano</span>
            </button>

            <div className="h-6 w-px bg-white/20 hidden sm:block" />

            <div className="flex items-center gap-2.5">
              <LogoCimientoComercial size={36} className="shrink-0" />
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#F59E0B] block leading-tight">
                  MÓDULO DE RECAUDO & CARTERA
                </span>
                <span className="text-sm font-black text-white tracking-tight block leading-tight">
                  CIMIENTO COMERCIAL
                </span>
              </div>
            </div>
          </div>

          {/* Logo Corporativo y Usuario */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <CorporateLogo
                logoUrl={empresa?.identidadVisual?.logoUrl}
                nombreComercial={empresa?.nombreComercial}
                size="sm"
                imageClassName="max-h-7 w-auto"
                showTextFallback={false}
              />
              <span className="text-xs font-bold text-white truncate max-w-[140px]">
                {empresa?.nombreComercial || 'B GROUP'}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-200 block truncate max-w-[140px]">
                {currentUser.nombre || currentUser.email}
              </span>
              <span className="text-[10px] text-[#F59E0B] font-bold block">
                {currentUser.rol === 'superadmin' ? 'Superadmin' : 'Administrador'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* SUBBARRA CON MÉTRICAS RÁPIDAS Y PESTAÑAS */}
      <div className="bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Métricas Comerciales */}
          <div className="py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                $
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Recaudo Hoy</span>
                <span className="font-black text-emerald-600 font-mono text-sm">${metricas.totalRecaudoHoy.toLocaleString('es-CO')}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Clientes en Mora</span>
                <span className="font-black text-rose-600 text-sm">{metricas.clientesEnMora} suscripciones</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Contratos Firmados</span>
                <span className="font-black text-indigo-600 text-sm">{metricas.contratosActivos} expedientes</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${metricas.cajaAbierta ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Estado Cajero</span>
                <span className={`font-black text-sm ${metricas.cajaAbierta ? 'text-emerald-600' : 'text-slate-600'}`}>
                  {metricas.cajaAbierta ? 'Turno Abierto' : 'Cerrada'}
                </span>
              </div>
            </div>
          </div>

          {/* Navegación por pestañas */}
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2">
            {tabs.map(t => {
              const Icon = t.icon;
              const activa = tabActiva === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTabActiva(t.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${activa ? 'bg-[#18235C] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
                >
                  <Icon className={`w-4 h-4 ${activa ? 'text-[#F59E0B]' : t.color}`} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {tabActiva === 'cobros' && (
          <CobroRecaudoView
            currentUser={currentUser}
            empresa={empresa}
            onPagoRegistrado={cargarMetricas}
          />
        )}

        {tabActiva === 'cajero' && (
          <CajaGestionView
            currentUser={currentUser}
            onActualizar={cargarMetricas}
          />
        )}

        {tabActiva === 'saldos' && (
          <SubidaMasivaSaldosView
            onImportacionCompletada={cargarMetricas}
          />
        )}

        {tabActiva === 'contratos' && (
          <ContratosClientesView
            currentUser={currentUser}
            empresa={empresa}
          />
        )}

        {tabActiva === 'arqueos' && (
          <ArqueoCajaView
            currentUser={currentUser}
            empresa={empresa}
          />
        )}
      </main>

      {/* PIE DE PÁGINA */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-[11px] text-slate-500">
        <p>
          CIMIENTO COMERCIAL · B GROUP INGENIERIA S.A.S. · Terminal de Facturación, Recaudo y Contratos Electrónicos 2026
        </p>
      </footer>
    </div>
  );
};
