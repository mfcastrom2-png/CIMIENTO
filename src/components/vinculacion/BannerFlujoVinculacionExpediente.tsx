import React, { useState } from 'react';
import {
  Empleado,
  EtapaVinculacion,
  ConfiguracionEmpresa
} from '../../types';
import {
  UserCheck,
  FileText,
  Briefcase,
  PenTool,
  CheckCircle2,
  Clock,
  AlertCircle,
  Bell,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  Send,
  Building2,
  Check,
  ArrowRight
} from 'lucide-react';

interface BannerFlujoVinculacionExpedienteProps {
  empleado: Empleado;
  onAbrirDiligenciarHv: () => void;
  onAbrirDefinirContrato: () => void;
  onAbrirFirmaContrato: () => void;
  onAbrirNotificaciones: () => void;
  onFinalizarVinculacion: () => void;
  onIrAPestana: (tabId: string) => void;
  esEmpleado?: boolean;
}

export const BannerFlujoVinculacionExpediente: React.FC<BannerFlujoVinculacionExpedienteProps> = ({
  empleado,
  onAbrirDiligenciarHv,
  onAbrirDefinirContrato,
  onAbrirFirmaContrato,
  onAbrirNotificaciones,
  onFinalizarVinculacion,
  onIrAPestana,
  esEmpleado = false
}) => {
  const vinculacion = empleado.vinculacion;
  const etapa: EtapaVinculacion = vinculacion?.etapaActual || (empleado.activo ? 'vinculado_activo' : 'pre_seleccion');
  const esActivo = empleado.activo && etapa === 'vinculado_activo';

  // Permitir colapsar si ya está activo
  const [colapsado, setColapsado] = useState(esActivo);

  const totalNotificaciones = vinculacion?.notificaciones?.length || 0;

  // Pasos del flujo
  const pasos = [
    {
      id: 'pre_seleccion',
      numero: 1,
      titulo: 'Pre-selección & Hoja de Vida',
      descripcion: 'Diligenciamiento de datos personales, estudios y experiencia.',
      completado: etapa !== 'pre_seleccion',
      enCurso: etapa === 'pre_seleccion'
    },
    {
      id: 'hoja_vida_completada',
      numero: 2,
      titulo: 'Estructura & Contrato',
      descripcion: 'Asociación a cargo, área, salario y tipo de contrato por GH.',
      completado: etapa === 'pendiente_firma_contrato' || etapa === 'contrato_firmado' || etapa === 'vinculado_activo',
      enCurso: etapa === 'hoja_vida_completada'
    },
    {
      id: 'pendiente_firma_contrato',
      numero: 3,
      titulo: 'Firma Digital de Contrato',
      descripcion: 'Suscripción electrónica del contrato laboral bajo Ley 527/1999.',
      completado: etapa === 'contrato_firmado' || etapa === 'vinculado_activo',
      enCurso: etapa === 'pendiente_firma_contrato'
    },
    {
      id: 'contrato_firmado',
      numero: 4,
      titulo: 'Formalización de Vinculación',
      descripcion: 'Afiliaciones de seguridad social, examen SST y pase a Activo.',
      completado: etapa === 'vinculado_activo',
      enCurso: etapa === 'contrato_firmado'
    }
  ];

  return (
    <div className="bg-white rounded-2xl border-2 border-[#18235C]/20 shadow-sm overflow-hidden text-xs">
      {/* Barra superior de estado */}
      <div className="bg-gradient-to-r from-[#18235C] to-[#1E3A8A] text-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#F59E0B] border border-white/10 shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-white">
                Flujo de Contratación & Vinculación Laboral (CST)
              </h3>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  etapa === 'vinculado_activo'
                    ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400/40'
                    : etapa === 'contrato_firmado'
                    ? 'bg-blue-500/30 text-blue-200 border-blue-400/40'
                    : etapa === 'pendiente_firma_contrato'
                    ? 'bg-amber-500/30 text-amber-200 border-amber-400/40'
                    : 'bg-indigo-500/30 text-indigo-200 border-indigo-400/40'
                }`}
              >
                {etapa === 'vinculado_activo'
                  ? '✓ Vinculación Completada (Activo)'
                  : etapa === 'contrato_firmado'
                  ? 'Etapa 4: Contrato Firmado · Formalización Final'
                  : etapa === 'pendiente_firma_contrato'
                  ? 'Etapa 3: Pendiente Firma Digital de Contrato'
                  : etapa === 'hoja_vida_completada'
                  ? 'Etapa 2: Hoja de Vida Lista · Definir Cargo & Salario'
                  : 'Etapa 1: Pre-selección · Pendiente Hoja de Vida'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Gestión integral desde la postulación inicial hasta la suscripción contractual y formalización del expediente.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onAbrirNotificaciones}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/10 cursor-pointer transition-colors"
            title="Ver buzón de notificaciones enviadas y despachadas"
          >
            <Bell className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Notificaciones ({totalNotificaciones})</span>
          </button>

          {esActivo && (
            <button
              type="button"
              onClick={() => setColapsado(!colapsado)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              title={colapsado ? 'Ver detalle del flujo' : 'Ocultar detalle'}
            >
              {colapsado ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {!colapsado && (
        <div className="p-5 space-y-5 bg-slate-50/50">
          {/* Stepper Gráfico de las 4 Etapas */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {pasos.map((paso) => {
              const estaCompletado = paso.completado;
              const estaEnCurso = paso.enCurso;

              return (
                <div
                  key={paso.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    estaCompletado
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                      : estaEnCurso
                      ? 'bg-indigo-50/90 border-[#18235C] shadow-xs text-[#18235C] ring-2 ring-[#18235C]/20'
                      : 'bg-white border-slate-200 text-slate-400 opacity-80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                        estaCompletado
                          ? 'bg-emerald-600 text-white'
                          : estaEnCurso
                          ? 'bg-[#18235C] text-white animate-pulse'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {estaCompletado ? '✓' : paso.numero}
                    </span>

                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        estaCompletado
                          ? 'bg-emerald-200/60 text-emerald-800'
                          : estaEnCurso
                          ? 'bg-indigo-200/80 text-indigo-900'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {estaCompletado ? 'Completado' : estaEnCurso ? 'Paso Actual' : 'Pendiente'}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-xs mb-0.5">{paso.titulo}</h4>
                  <p className="text-[10px] leading-snug">{paso.descripcion}</p>
                </div>
              );
            })}
          </div>

          {/* Panel de Acción Contextual según la Etapa Actual */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* ETAPA 1: PRE-SELECCIÓN */}
            {etapa === 'pre_seleccion' && (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
                    <strong className="text-sm font-black text-[#18235C]">
                      Etapa 1: Pendiente de Diligenciamiento de Hoja de Vida
                    </strong>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Se ha enviado la invitación formal al correo <strong>{empleado.email}</strong>. El candidato puede diligenciar su información personal, académica y laboral desde el portal seguro, o el administrador puede asistirlo directamente.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={onAbrirDiligenciarHv}
                    className="px-4 py-2 rounded-xl bg-[#18235C] hover:bg-[#1E3A8A] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <FileText className="w-4 h-4 text-[#F59E0B]" />
                    <span>Diligenciar Hoja de Vida</span>
                  </button>
                </div>
              </>
            )}

            {/* ETAPA 2: HOJA DE VIDA COMPLETADA */}
            {etapa === 'hoja_vida_completada' && (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <strong className="text-sm font-black text-[#18235C]">
                      Etapa 2: Hoja de Vida Completada — Proceda a Definir Condiciones
                    </strong>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    El candidato ha suministrado su información de Hoja de Vida. El Administrador de Gestión Humana debe asociar el colaborador en la estructura orgánica, asignar el salario y fijar el tipo de contrato. Al guardar, se enviará automáticamente la notificación para la firma digital.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={onAbrirDiligenciarHv}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Revisar Hoja de Vida</span>
                  </button>

                  <button
                    type="button"
                    onClick={onAbrirDefinirContrato}
                    className="px-4 py-2 rounded-xl bg-[#18235C] hover:bg-[#1E3A8A] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <Briefcase className="w-4 h-4 text-[#F59E0B]" />
                    <span>Definir Estructura, Salario & Contrato</span>
                  </button>
                </div>
              </>
            )}

            {/* ETAPA 3: PENDIENTE FIRMA DIGITAL */}
            {etapa === 'pendiente_firma_contrato' && (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <strong className="text-sm font-black text-amber-900">
                      Etapa 3: Contrato Generado — Pendiente Firma Digital del Candidato
                    </strong>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Las condiciones contractuales fueron guardadas y se despachó la notificación al correo del colaborador. El contrato puede ser firmado digitalmente de forma remota o en ventanilla presencial con rúbrica táctil (Ley 527 de 1999).
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={onAbrirDefinirContrato}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>Editar Términos</span>
                  </button>

                  <button
                    type="button"
                    onClick={onAbrirFirmaContrato}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                  >
                    <PenTool className="w-4 h-4" />
                    <span>Abrir Contrato & Firmar Digitalmente</span>
                  </button>
                </div>
              </>
            )}

            {/* ETAPA 4: CONTRATO FIRMADO · FORMALIZACIÓN */}
            {etapa === 'contrato_firmado' && (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <strong className="text-sm font-black text-emerald-900">
                      Etapa 4: ¡Contrato Firmado! — Formalización Final del Expediente
                    </strong>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    El colaborador ha suscrito digitalmente el contrato laboral con sello SHA-256. Gestión Humana debe revisar los elementos finales (seguridad social, examen SST de ingreso y dotación) y pulsar "Finalizar Vinculación" para activarlo plenamente.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={onAbrirFirmaContrato}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Ver Contrato Firmado</span>
                  </button>

                  <button
                    type="button"
                    onClick={onFinalizarVinculacion}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finalizar Vinculación & Activar Colaborador</span>
                  </button>
                </div>
              </>
            )}

            {/* ETAPA 5: VINCULADO ACTIVO */}
            {etapa === 'vinculado_activo' && (
              <>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <strong className="text-sm font-black text-emerald-900">
                      Colaborador Activo & Vinculación Laboral Formalizada
                    </strong>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    El expediente digital se encuentra formalizado y en plena vigencia contractual conforme al Código Sustantivo del Trabajo (CST).
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={onAbrirFirmaContrato}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center gap-1.5 border border-indigo-200 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span>Ver Contrato Laboral CST</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Checklist de Elementos Restantes del Expediente (Para etapa 3 y 4) */}
          {(etapa === 'contrato_firmado' || etapa === 'pendiente_firma_contrato') && (
            <div className="p-3.5 bg-slate-100/70 rounded-2xl border border-slate-200 text-slate-700">
              <span className="font-bold text-slate-800 block text-xs mb-2">
                Checklist de Elementos del Expediente para Formalización Final:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => onIrAPestana('seguridadSocial')}
                  className="p-2 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 text-left flex items-center justify-between cursor-pointer"
                >
                  <span className="font-semibold truncate">1. Seguridad Social (EPS/ARL)</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => onIrAPestana('sst')}
                  className="p-2 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 text-left flex items-center justify-between cursor-pointer"
                >
                  <span className="font-semibold truncate">2. Examen Médico Ingreso</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => onIrAPestana('documentos')}
                  className="p-2 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 text-left flex items-center justify-between cursor-pointer"
                >
                  <span className="font-semibold truncate">3. Soportes & Documentos</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => onIrAPestana('saldosIniciales')}
                  className="p-2 bg-white rounded-xl border border-slate-200 hover:border-indigo-400 text-left flex items-center justify-between cursor-pointer"
                >
                  <span className="font-semibold truncate">4. Saldos / Empalme Nómina</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
