import React, { useMemo } from 'react';
import { EstandarMinimoSST, CicloPHVA } from '../../types';
import { CheckCircle2, AlertTriangle, AlertOctagon, MinusCircle } from 'lucide-react';

interface ProgresoEstandaresSstBarProps {
  estandares: EstandarMinimoSST[];
  filtroCiclo?: string;
  filtroEstado?: string;
  onSelectCiclo?: (ciclo: string) => void;
  onSelectEstado?: (estado: string) => void;
}

const CICLOS_PHVA: { id: CicloPHVA; label: string; colorBar: string }[] = [
  { id: 'Planear', label: 'Planear (P)', colorBar: 'bg-[#18235C]' },
  { id: 'Hacer', label: 'Hacer (H)', colorBar: 'bg-[#16A34A]' },
  { id: 'Verificar', label: 'Verificar (V)', colorBar: 'bg-[#D97706]' },
  { id: 'Actuar', label: 'Actuar (A)', colorBar: 'bg-[#4338CA]' }
];

export const ProgresoEstandaresSstBar: React.FC<ProgresoEstandaresSstBarProps> = ({
  estandares,
  filtroCiclo = 'TODOS',
  filtroEstado = 'TODOS',
  onSelectCiclo,
  onSelectEstado
}) => {
  const stats = useMemo(() => {
    const total = estandares.length;
    let cumplidos = 0;
    let noAplica = 0;
    let noCumplidos = 0;

    let pesoCumplido = 0;
    let pesoNoAplica = 0;
    let pesoTotal = 0;

    const porCiclo: Record<
      CicloPHVA,
      { total: number; completados: number; pesoObtenido: number; pesoMaximo: number }
    > = {
      Planear: { total: 0, completados: 0, pesoObtenido: 0, pesoMaximo: 0 },
      Hacer: { total: 0, completados: 0, pesoObtenido: 0, pesoMaximo: 0 },
      Verificar: { total: 0, completados: 0, pesoObtenido: 0, pesoMaximo: 0 },
      Actuar: { total: 0, completados: 0, pesoObtenido: 0, pesoMaximo: 0 }
    };

    estandares.forEach(est => {
      const peso = Number(est.pesoPorcentual) || 0;
      pesoTotal += peso;

      if (porCiclo[est.ciclo]) {
        porCiclo[est.ciclo].total += 1;
        porCiclo[est.ciclo].pesoMaximo += peso;
      }

      if (est.estado === 'CUMPLE') {
        cumplidos += 1;
        pesoCumplido += peso;
        if (porCiclo[est.ciclo]) {
          porCiclo[est.ciclo].completados += 1;
          porCiclo[est.ciclo].pesoObtenido += peso;
        }
      } else if (est.estado === 'NO_APLICA_JUSTIFICADO') {
        noAplica += 1;
        pesoNoAplica += peso;
        if (porCiclo[est.ciclo]) {
          porCiclo[est.ciclo].completados += 1;
          porCiclo[est.ciclo].pesoObtenido += peso;
        }
      } else {
        noCumplidos += 1;
      }
    });

    const completadosTotal = cumplidos + noAplica;
    const puntajeObtenido = Math.round((pesoCumplido + pesoNoAplica) * 10) / 10;
    const pesoMaximoRedondeado = Math.round(pesoTotal * 10) / 10 || 100;
    const pctPuntaje = Math.min(
      100,
      Math.round(((puntajeObtenido / pesoMaximoRedondeado) * 100) * 10) / 10
    );
    const pctCumplidoSegmento = Math.min(
      100,
      Math.round(((pesoCumplido / pesoMaximoRedondeado) * 100) * 10) / 10
    );
    const pctNoAplicaSegmento = Math.min(
      100 - pctCumplidoSegmento,
      Math.round(((pesoNoAplica / pesoMaximoRedondeado) * 100) * 10) / 10
    );

    const pctCantidad = total > 0 ? Math.round((completadosTotal / total) * 100) : 0;

    let nivel: 'CRÍTICO' | 'MODERADAMENTE ACEPTABLE' | 'ACEPTABLE' = 'ACEPTABLE';
    if (puntajeObtenido < 60) {
      nivel = 'CRÍTICO';
    } else if (puntajeObtenido <= 85) {
      nivel = 'MODERADAMENTE ACEPTABLE';
    }

    return {
      total,
      cumplidos,
      noAplica,
      noCumplidos,
      completadosTotal,
      puntajeObtenido,
      pesoMaximoRedondeado,
      pctPuntaje,
      pctCumplidoSegmento,
      pctNoAplicaSegmento,
      pctCantidad,
      nivel,
      porCiclo
    };
  }, [estandares]);

  const nivelVisual =
    stats.nivel === 'ACEPTABLE'
      ? {
          label: 'Nivel Aceptable (> 85%)',
          textClass: 'text-[#16A34A]',
          barClass: 'bg-[#16A34A]',
          surfaceClass: 'bg-emerald-50/70 border-emerald-200',
          Icon: CheckCircle2
        }
      : stats.nivel === 'MODERADAMENTE ACEPTABLE'
      ? {
          label: 'Moderadamente Aceptable (60% – 85%)',
          textClass: 'text-[#D97706]',
          barClass: 'bg-[#D97706]',
          surfaceClass: 'bg-amber-50/70 border-amber-200',
          Icon: AlertTriangle
        }
      : {
          label: 'Crítico (< 60% · Plan de Mejora Inmediato)',
          textClass: 'text-[#DC2626]',
          barClass: 'bg-[#DC2626]',
          surfaceClass: 'bg-rose-50/70 border-rose-200',
          Icon: AlertOctagon
        };

  const NivelIcon = nivelVisual.Icon;

  return (
    <section
      aria-label="Progreso de cumplimiento de los 21 estándares mínimos Resolución 0312 de 2019"
      className="bg-white rounded-xl border border-[#8FA7D6] p-4 sm:p-5 shadow-sm space-y-5"
    >
      {/* Encabezado del progreso */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-[#18235C]">Resolución 0312 de 2019</span>
            <span aria-hidden="true">·</span>
            <span>Seguimiento 21 Estándares Mínimos</span>
            <span aria-hidden="true">·</span>
            <span className={`inline-flex items-center gap-1 font-semibold ${nivelVisual.textClass}`}>
              <NivelIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{nivelVisual.label}</span>
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#18235C]">
            Avance de Cumplimiento SG-SST
          </h2>
        </div>

        {/* Métricas numéricas tabulares */}
        <div className="flex flex-wrap items-center gap-5 text-xs">
          <div>
            <span className="text-slate-500 block">Estándares acreditados</span>
            <span className="text-lg font-bold text-[#18235C] font-mono tabular-nums">
              {stats.completadosTotal} / {stats.total}
            </span>
            <span className="text-slate-500 ml-1.5 font-mono tabular-nums">
              ({stats.pctCantidad}%)
            </span>
          </div>
          <div className="h-8 w-px bg-slate-200 hidden sm:block" />
          <div>
            <span className="text-slate-500 block">Puntaje ponderado</span>
            <span className="text-lg font-bold text-[#18235C] font-mono tabular-nums">
              {stats.puntajeObtenido}%
            </span>
            <span className="text-slate-500 ml-1 font-mono tabular-nums">
              / {stats.pesoMaximoRedondeado}%
            </span>
          </div>
        </div>
      </div>

      {/* Barra principal de puntaje ponderado con umbrales legales (60% y 85%) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#18235C]">
            Ponderación normativa acumulada (0% – 100%)
          </span>
          <span className="font-mono tabular-nums font-semibold text-[#18235C]">
            {stats.pctPuntaje}% completado
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={stats.puntajeObtenido}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Puntaje ponderado SG-SST: ${stats.puntajeObtenido}% de 100%`}
          className="relative h-4 w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200"
        >
          <div className="flex h-full w-full">
            {stats.pctCumplidoSegmento > 0 && (
              <div
                style={{ width: `${stats.pctCumplidoSegmento}%` }}
                className={`h-full transition-all duration-300 ${
                  stats.nivel === 'CRÍTICO'
                    ? 'bg-[#DC2626]'
                    : stats.nivel === 'MODERADAMENTE ACEPTABLE'
                    ? 'bg-[#D97706]'
                    : 'bg-[#18235C]'
                }`}
                title={`Cumple: ${Math.round(stats.pctCumplidoSegmento * 10) / 10}%`}
              />
            )}
            {stats.pctNoAplicaSegmento > 0 && (
              <div
                style={{ width: `${stats.pctNoAplicaSegmento}%` }}
                className="h-full bg-[#B5842A] transition-all duration-300"
                title={`No aplica justificado: ${Math.round(stats.pctNoAplicaSegmento * 10) / 10}%`}
              />
            )}
          </div>

          {/* Marcadores de umbrales de la Res. 0312 */}
          <div
            style={{ left: '60%' }}
            className="absolute inset-y-0 w-0.5 bg-slate-700/60 pointer-events-none"
            title="Umbral Crítico / Moderadamente Aceptable (60%)"
          />
          <div
            style={{ left: '85%' }}
            className="absolute inset-y-0 w-0.5 bg-emerald-700/80 pointer-events-none"
            title="Umbral Aceptable Res. 0312 (85%)"
          />
        </div>

        {/* Escala de umbrales */}
        <div className="relative h-4 text-[11px] font-mono tabular-nums text-slate-500">
          <span className="absolute left-0">0%</span>
          <span
            style={{ left: '60%' }}
            className="absolute -translate-x-1/2 text-[#D97706] font-semibold whitespace-nowrap"
          >
            60% Mín. Moderado
          </span>
          <span
            style={{ left: '85%' }}
            className="absolute -translate-x-1/2 text-[#16A34A] font-semibold whitespace-nowrap"
          >
            85% Aceptable
          </span>
          <span className="absolute right-0">100%</span>
        </div>
      </div>

      {/* Barra segmentada por cantidad de estándares (21 ítems) + Filtros interactivos de estado */}
      <div className="space-y-2.5 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-[#18235C]">
            Distribución de los {stats.total} estándares por estado de verificación
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onSelectEstado && onSelectEstado(filtroEstado === 'CUMPLE' ? 'TODOS' : 'CUMPLE')
              }
              className={`px-2.5 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                filtroEstado === 'CUMPLE'
                  ? 'bg-[#18235C] text-white border-[#18235C]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  filtroEstado === 'CUMPLE' ? 'text-emerald-300' : 'text-[#16A34A]'
                }`}
              />
              <span>Cumple:</span>
              <span className="font-mono tabular-nums font-bold">{stats.cumplidos}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onSelectEstado &&
                onSelectEstado(
                  filtroEstado === 'NO_APLICA_JUSTIFICADO' ? 'TODOS' : 'NO_APLICA_JUSTIFICADO'
                )
              }
              className={`px-2.5 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                filtroEstado === 'NO_APLICA_JUSTIFICADO'
                  ? 'bg-[#B5842A] text-white border-[#B5842A]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <MinusCircle
                className={`w-3.5 h-3.5 ${
                  filtroEstado === 'NO_APLICA_JUSTIFICADO' ? 'text-white' : 'text-[#B5842A]'
                }`}
              />
              <span>No aplica:</span>
              <span className="font-mono tabular-nums font-bold">{stats.noAplica}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onSelectEstado && onSelectEstado(filtroEstado === 'NO_CUMPLE' ? 'TODOS' : 'NO_CUMPLE')
              }
              className={`px-2.5 py-1 rounded-md border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                filtroEstado === 'NO_CUMPLE'
                  ? 'bg-[#DC2626] text-white border-[#DC2626]'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <AlertOctagon
                className={`w-3.5 h-3.5 ${
                  filtroEstado === 'NO_CUMPLE' ? 'text-white' : 'text-[#DC2626]'
                }`}
              />
              <span>No cumple:</span>
              <span className="font-mono tabular-nums font-bold">{stats.noCumplidos}</span>
            </button>
          </div>
        </div>

        {/* 21 celdas individuales para trazabilidad visual 1:1 de cada estándar */}
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${Math.max(stats.total, 1)}, minmax(0, 1fr))` }}
          aria-label="Indicador visual individual de los 21 estándares"
        >
          {estandares.map(est => {
            const colorCelda =
              est.estado === 'CUMPLE'
                ? 'bg-[#16A34A] hover:bg-[#15803D]'
                : est.estado === 'NO_APLICA_JUSTIFICADO'
                ? 'bg-[#B5842A] hover:bg-[#9A6F21]'
                : 'bg-[#DC2626] hover:bg-[#B91C1C]';

            const estadoTexto =
              est.estado === 'CUMPLE'
                ? 'Cumple'
                : est.estado === 'NO_APLICA_JUSTIFICADO'
                ? 'No Aplica Justificado'
                : 'No Cumple';

            return (
              <div
                key={est.id}
                title={`Numeral ${est.numeral} (${est.ciclo}) · ${est.itemEstandar} · Peso ${est.pesoPorcentual}% · Estado: ${estadoTexto}`}
                className={`h-2.5 rounded-xs transition-colors ${colorCelda}`}
              />
            );
          })}
        </div>
      </div>

      {/* Desglose por Ciclo PHVA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-200">
        {CICLOS_PHVA.map(ciclo => {
          const data = stats.porCiclo[ciclo.id];
          const pctCiclo = data.total > 0 ? Math.round((data.completados / data.total) * 100) : 0;
          const pesoObt = Math.round(data.pesoObtenido * 10) / 10;
          const pesoMax = Math.round(data.pesoMaximo * 10) / 10;
          const activo = filtroCiclo === ciclo.id;

          return (
            <button
              key={ciclo.id}
              type="button"
              onClick={() => onSelectCiclo && onSelectCiclo(activo ? 'TODOS' : ciclo.id)}
              className={`text-left p-3 rounded-lg border transition-colors cursor-pointer space-y-2 ${
                activo
                  ? 'bg-[#18235C]/5 border-[#18235C] ring-1 ring-[#18235C]/20'
                  : 'bg-[#F8FAFC] border-slate-200 hover:border-[#8FA7D6]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-[#18235C]">{ciclo.label}</span>
                <span className="font-mono tabular-nums font-semibold text-slate-700">
                  {data.completados}/{data.total}
                </span>
              </div>

              <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  style={{ width: `${pctCiclo}%` }}
                  className={`h-full transition-all duration-300 ${ciclo.colorBar}`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                <span>{pctCiclo}% ítems</span>
                <span>
                  {pesoObt}% / {pesoMax}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
