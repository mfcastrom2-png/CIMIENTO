import React, { useState } from 'react';
import { Cargo, Empleado, EvaluacionDesempeno, ConfiguracionEmpresa } from '../types';
import { exportarContenedorAPDF } from '../utils/printUtils';
import { useCompanySyncOptional } from '../context/SyncContext';
import {
  FileText,
  FileDown,
  Printer,
  Sliders,
  Eye,
  ShieldCheck,
  PenTool,
  QrCode
} from 'lucide-react';
import {
  PrevisualizacionImpresionModal,
  SeccionImprimible
} from './PrevisualizacionImpresionModal';
import { CodigoQRVerificacion } from './CodigoQRVerificacion';
import { FirmaDigitalStamp } from './FirmaDigitalStamp';
import { HerramientaFirmaDigitalModal, DatosFirmaDigital } from './HerramientaFirmaDigitalModal';
import { registrarCertificadoEmitido, generarHashIntegridadDocumento } from '../services/verificacionCertificadosService';
import { ReporteConsolidadoEvaluacionesModal } from './ReporteConsolidadoEvaluacionesModal';
import { ReporteConsolidadoCapacitacionesModal } from './ReporteConsolidadoCapacitacionesModal';
import { CAPACITACIONES_INICIALES } from '../data/capacitacionesData';

interface DocumentosViewProps {
  cargos: Cargo[];
  empleados: Empleado[];
  evaluaciones: EvaluacionDesempeno[];
  onOpenEvaluacionDetalle?: (evaluacionId: string) => void;
  empresa?: ConfiguracionEmpresa;
}

export const DocumentosView: React.FC<DocumentosViewProps> = ({
  cargos,
  empleados,
  evaluaciones,
  empresa
}) => {
  const [selectedDocType, setSelectedDocType] = useState<'ficha' | 'acta_eval'>('ficha');
  const [selectedCargoId, setSelectedCargoId] = useState<string>(cargos[0]?.id || '');
  const [selectedEmpleadoId, setSelectedEmpleadoId] = useState<string>(empleados[0]?.id || '');
  const [exportandoPdf, setExportandoPdf] = useState(false);
  const [modalPreviewOpen, setModalPreviewOpen] = useState(false);

  // Estados para Firma Digital
  const [modalFirmaOpen, setModalFirmaOpen] = useState(false);
  const [firmanteActualTipo, setFirmanteActualTipo] = useState<'emisor' | 'receptor'>('emisor');
  const [firmaEmisor, setFirmaEmisor] = useState<DatosFirmaDigital | null>(null);
  const [firmaReceptor, setFirmaReceptor] = useState<DatosFirmaDigital | null>(null);

  // Estados para Reportes Consolidados
  const [modalReporteEvalsOpen, setModalReporteEvalsOpen] = useState(false);
  const [modalReportePacOpen, setModalReportePacOpen] = useState(false);

  // Consumo dinámico del estado global con fallback a props
  const syncContext = useCompanySyncOptional();
  const empresaActiva = empresa || syncContext?.empresa;

  const razonSocial = empresaActiva?.razonSocial || empresaActiva?.nombreComercial || 'Empresa';
  const nit = empresaActiva?.nit || '';
  const digitoVerificacion = empresaActiva?.digitoVerificacion || '';
  const nitCompleto = nit ? `NIT ${nit}${digitoVerificacion ? `-${digitoVerificacion}` : ''}` : '';
  const direccion = (empresaActiva as any)?.direccion || empresaActiva?.contacto?.direccion || '';
  const ciudad = empresaActiva?.contacto?.ciudad || '';
  const departamento = empresaActiva?.contacto?.departamento || '';
  const ubicacionCompleta = [direccion, ciudad, departamento].filter(Boolean).join(', ');
  const logoUrl = empresaActiva?.identidadVisual?.logoUrl;

  const cargo = cargos.find(c => c.id === selectedCargoId) || cargos[0];
  const empleado = empleados.find(e => e.id === selectedEmpleadoId) || empleados[0];
  const empCargo = cargos.find(c => c.id === empleado?.cargoId);

  const codigoVerificacionDoc = selectedDocType === 'ficha'
    ? `MAN-${cargo?.ficha.identificacion.codigo || cargo?.id.toUpperCase() || 'GH01'}-2026`
    : `EVAL-${empleado?.documento || empleado?.id.toUpperCase() || 'E01'}-100PTS`;

  const nombreArchivoExportacion = selectedDocType === 'ficha'
    ? `Manual_Cargo_${cargo?.nombre || 'Ficha'}`
    : `Acta_Evaluacion_${empleado?.nombre || 'Empleado'}`;

  // Secciones configurables para la previsualización e impresión
  const seccionesFicha: SeccionImprimible[] = [
    {
      id: 'encabezado-ficha',
      nombre: '1. Encabezado e Identificación',
      descripcion: 'Razón social, NIT, código de manual, versión y modalidad.',
      requerido: true,
      seleccionado: true
    },
    {
      id: 'proposito-ficha',
      nombre: '2. Propósito Principal del Cargo',
      descripcion: 'Misión y objetivo estratégico del puesto.',
      seleccionado: true
    },
    {
      id: 'funciones-ficha',
      nombre: '3. Funciones y Responsabilidades',
      descripcion: 'Actividades esenciales, condiciones y resultados esperados.',
      seleccionado: true
    },
    {
      id: 'indicadores-ficha',
      nombre: '4. Indicadores de Gestión (50%)',
      descripcion: 'Fórmulas, metas cuantitativas y ponderaciones.',
      seleccionado: true
    },
    {
      id: 'competencias-ficha',
      nombre: '5. Competencias Requeridas (25%)',
      descripcion: 'Niveles de comportamiento y conductas observables.',
      seleccionado: true
    },
    {
      id: 'firmas-ficha',
      nombre: '6. Firmas, QR y Validación Digital',
      descripcion: 'Sello de aprobación de GH, código QR y compromiso del colaborador.',
      seleccionado: true
    }
  ];

  const seccionesActa: SeccionImprimible[] = [
    {
      id: 'encabezado-acta',
      nombre: '1. Encabezado y Datos del Colaborador',
      descripcion: 'Cédula, cargo, salario y período evaluado.',
      requerido: true,
      seleccionado: true
    },
    {
      id: 'consolidado-acta',
      nombre: '2. Consolidado Técnico (100 Pts)',
      descripcion: 'Puntajes de Indicadores, Competencias, SG-SST y Mejora.',
      seleccionado: true
    },
    {
      id: 'compromisos-acta',
      nombre: '3. Plan de Desarrollo y Compromisos',
      descripcion: 'Acuerdos de fortalecimiento técnico y capacitación.',
      seleccionado: true
    },
    {
      id: 'firmas-acta',
      nombre: '4. Firmas, QR y Constancia de Retroalimentación',
      descripcion: 'Firmas con firma digital, QR de validez y retroalimentación.',
      seleccionado: true
    }
  ];

  const seccionesActivas = selectedDocType === 'ficha' ? seccionesFicha : seccionesActa;

  const handleExportarPdfDirecto = async () => {
    setExportandoPdf(true);
    try {
      // Registrar certificado en el sistema para que sea verificable por QR
      await registrarCertificadoEmitido({
        codigoVerificacion: codigoVerificacionDoc,
        tipoDocumento: selectedDocType === 'ficha' ? 'Manual de Cargo y Funciones' : 'Acta de Evaluación de Desempeño',
        titularNombre: selectedDocType === 'ficha' ? (cargo?.nombre || 'Cargo Institucional') : (empleado?.nombre || 'Colaborador'),
        titularDocumento: selectedDocType === 'ficha' ? (cargo?.ficha.identificacion.codigo || 'GH-MC') : (empleado?.documento || 'CC'),
        titularCargo: selectedDocType === 'ficha' ? cargo?.nombre : empCargo?.nombre,
        fechaEmision: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
        fechaRegistroISO: new Date().toISOString(),
        emisorRazonSocial: razonSocial,
        emisorNit: nitCompleto,
        firmanteNombre: firmaEmisor?.firmanteNombre || empresaActiva?.representanteLegal?.nombre || 'Dirección de Gestión Humana',
        firmanteCargo: firmaEmisor?.firmanteCargo || 'Gestión Humana y Compensación',
        hashIntegridad: generarHashIntegridadDocumento({ codigo: codigoVerificacionDoc, tipo: selectedDocType, fecha: new Date().toISOString() }),
        estado: 'VIGENTE_AUTENTICO',
        firmaDigitalUrl: firmaEmisor?.dataUrl
      });

      await exportarContenedorAPDF('area-impresion-repositorio-documentos', nombreArchivoExportacion);
    } finally {
      setExportandoPdf(false);
    }
  };

  const abrirModalFirmar = (tipo: 'emisor' | 'receptor') => {
    setFirmanteActualTipo(tipo);
    setModalFirmaOpen(true);
  };

  const handleGuardarFirma = (firma: DatosFirmaDigital) => {
    if (firmanteActualTipo === 'emisor') {
      setFirmaEmisor(firma);
    } else {
      setFirmaReceptor(firma);
    }
    setModalFirmaOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#8FA7D6]/30 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#18235C]/10 text-[#18235C] border border-[#18235C]/20 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              Gestión Documental Oficial
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#8FA7D6]/15 text-[#18235C] border border-[#8FA7D6]/30">
              {razonSocial}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#18235C]">
            Repositorio y Generador de Documentos
          </h1>
          <p className="text-xs sm:text-sm text-[#282829]/70 mt-1 max-w-2xl">
            Generación formal, previsualización interactiva por secciones y exportación de manuales de cargos y actas de evaluación de 100 puntos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-previsualizar-impresion"
            onClick={() => setModalPreviewOpen(true)}
            className="px-3.5 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Abrir modal de previsualización y selección de secciones para imprimir"
          >
            <Printer className="w-4 h-4 text-[#00FF00]" />
            <span>Previsualizar e Imprimir</span>
          </button>

          <button
            id="btn-exportar-pdf-documento"
            onClick={handleExportarPdfDirecto}
            disabled={exportandoPdf}
            className="px-3.5 py-2 bg-[#00FF00] hover:bg-emerald-400 text-[#18235C] text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Exportar documento en formato PDF descargable"
          >
            <FileDown className={`w-4 h-4 ${exportandoPdf ? 'animate-bounce' : ''}`} />
            <span>{exportandoPdf ? 'Generando...' : 'Exportar a PDF'}</span>
          </button>
        </div>
      </div>

      {/* Control Selector (Hidden during print) */}
      <div className="bg-white p-4 rounded-xl border border-[#8FA7D6]/30 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8FA7D6]/20 pb-3">
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              id="tab-doc-ficha"
              onClick={() => setSelectedDocType('ficha')}
              className={`px-3.5 py-2 rounded-lg font-semibold transition-colors ${
                selectedDocType === 'ficha'
                  ? 'bg-[#18235C] text-white shadow-xs'
                  : 'bg-slate-100 text-[#282829]/70 hover:bg-[#8FA7D6]/20 hover:text-[#18235C]'
              }`}
            >
              Ficha Oficial de Manual de Cargo
            </button>
            <button
              id="tab-doc-acta"
              onClick={() => setSelectedDocType('acta_eval')}
              className={`px-3.5 py-2 rounded-lg font-semibold transition-colors ${
                selectedDocType === 'acta_eval'
                  ? 'bg-[#18235C] text-white shadow-xs'
                  : 'bg-slate-100 text-[#282829]/70 hover:bg-[#8FA7D6]/20 hover:text-[#18235C]'
              }`}
            >
              Acta de Evaluación Técnica de Desempeño
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalReporteEvalsOpen(true)}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#18235C] border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Generar informe consolidado de evaluaciones de desempeño en PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-700" />
              <span>Reporte Consolidado Evaluaciones</span>
            </button>
            <button
              type="button"
              onClick={() => setModalReportePacOpen(true)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Generar informe consolidado del Plan de Capacitaciones (PAC) en PDF"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-700" />
              <span>Reporte Consolidado PAC</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-[#8FA7D6]/20">
          {selectedDocType === 'ficha' ? (
            <div>
              <label className="block font-semibold text-[#18235C] mb-1">Seleccionar Cargo a Imprimir:</label>
              <select
                id="select-cargo-documento"
                value={selectedCargoId}
                onChange={e => setSelectedCargoId(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#8FA7D6]/40 bg-slate-50 text-[#282829] focus:outline-none focus:border-[#18235C]"
              >
                {cargos.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.ficha.identificacion.codigo || 'S/C'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-[#18235C] mb-1">Seleccionar Colaborador:</label>
              <select
                id="select-colaborador-documento"
                value={selectedEmpleadoId}
                onChange={e => setSelectedEmpleadoId(e.target.value)}
                className="w-full p-2 rounded-lg border border-[#8FA7D6]/40 bg-slate-50 text-[#282829] focus:outline-none focus:border-[#18235C]"
              >
                {empleados.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.nombre} — {cargos.find(c => c.id === e.cargoId)?.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Document Sheet Layout (Paper Preview) */}
      <div id="area-impresion-repositorio-documentos" className="documento-imprimible bg-white rounded-xl border border-[#8FA7D6]/40 p-8 sm:p-12 shadow-sm max-w-4xl mx-auto print:border-none print:shadow-none print:p-0">
        {/* Plantilla 1: Ficha de Cargo */}
        {selectedDocType === 'ficha' && cargo && (
          <div className="space-y-6 text-xs text-[#282829]">
            {/* Sección 1: Header Documento e Identificación */}
            <div data-seccion-id="encabezado-ficha" className="seccion-imprimible space-y-4">
              <div className="border-b-2 border-[#18235C] pb-4 flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={razonSocial}
                      className="max-h-16 w-auto max-w-[200px] object-contain shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-[#18235C] text-[#00FF00] font-black text-xl flex items-center justify-center rounded-lg shrink-0">
                      {razonSocial ? razonSocial.charAt(0).toUpperCase() : 'E'}
                    </div>
                  )}
                  <div>
                    <span className="text-lg sm:text-xl font-bold text-[#18235C] block">
                      {razonSocial} — GESTIÓN HUMANA
                    </span>
                    <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#282829]/80 font-medium">
                      {nitCompleto && <span>{nitCompleto}</span>}
                      {nitCompleto && ubicacionCompleta && <span>•</span>}
                      {ubicacionCompleta && <span>{ubicacionCompleta}</span>}
                    </div>
                    <span className="text-[11px] text-[#282829]/70 uppercase tracking-wider font-semibold block mt-0.5">
                      Manual Específico de Funciones y Competencias Laborales
                    </span>
                  </div>
                </div>
                <div className="text-right text-[11px] font-mono text-[#282829]/70 shrink-0">
                  <div>Código: {cargo.ficha.identificacion.codigo || 'GH-MC-001'}</div>
                  <div>Versión: {cargo.ficha.identificacion.version || '1.0'}</div>
                  <div>Fecha: {cargo.ficha.historial[0]?.fecha || '2026-09'}</div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#18235C]/5 to-transparent p-4 rounded-lg border border-[#8FA7D6]/30">
                <h2 className="text-lg font-bold text-[#18235C]">
                  {cargo.nombre}
                </h2>
                <div className="grid grid-cols-3 gap-2 mt-2 text-[11px] text-[#282829]/70">
                  <div>Área / Proceso: <strong className="text-[#18235C]">{cargo.ficha.identificacion.area || cargo.ficha.identificacion.proceso}</strong></div>
                  <div>Familia / Nivel: <strong className="text-[#18235C]">{cargo.ficha.identificacion.familia}</strong></div>
                  <div>Modalidad: <strong className="text-[#18235C]">{cargo.ficha.identificacion.modalidad}</strong></div>
                </div>
              </div>
            </div>

            {/* Sección 2: Propósito */}
            <div data-seccion-id="proposito-ficha" className="seccion-imprimible">
              <h3 className="font-bold text-[#18235C] text-sm uppercase tracking-wide border-b border-[#8FA7D6]/30 pb-1 mb-2">
                1. Propósito Principal del Cargo
              </h3>
              <p className="leading-relaxed bg-slate-50 p-3 rounded-lg border border-[#8FA7D6]/20">
                {cargo.ficha.proposito || 'Sin propósito especificado.'}
              </p>
            </div>

            {/* Sección 3: Funciones Esenciales */}
            <div data-seccion-id="funciones-ficha" className="seccion-imprimible">
              <h3 className="font-bold text-[#18235C] text-sm uppercase tracking-wide border-b border-[#8FA7D6]/30 pb-1 mb-2">
                2. Funciones Esenciales y Responsabilidades
              </h3>
              <div className="space-y-2">
                {cargo.ficha.funciones.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="font-bold text-[#18235C]">{i + 1}.</span>
                    <div className="flex-1">
                      <strong className="text-[#282829]">{f.texto}</strong>
                      <div className="text-[11px] text-[#282829]/70">
                        Condición: {f.condicion} · Resultado esperado: {f.resultado} (Criticidad: {f.criticidad})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sección 4: Indicadores de Gestión */}
            <div data-seccion-id="indicadores-ficha" className="seccion-imprimible">
              <h3 className="font-bold text-[#18235C] text-sm uppercase tracking-wide border-b border-[#8FA7D6]/30 pb-1 mb-2">
                3. Indicadores de Gestión (Base para Evaluación del 50%)
              </h3>
              <table className="w-full text-left border border-[#8FA7D6]/30 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-[#18235C] text-white">
                    <th className="p-2">Indicador</th>
                    <th className="p-2">Fórmula</th>
                    <th className="p-2">Meta</th>
                    <th className="p-2 text-right">Peso Sugerido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/20">
                  {cargo.ficha.indicadores.map((ind, i) => (
                    <tr key={i} className="hover:bg-[#8FA7D6]/10">
                      <td className="p-2 font-medium text-[#18235C]">{ind.nombre}</td>
                      <td className="p-2 font-mono text-[10px] text-[#282829]/70">{ind.formula}</td>
                      <td className="p-2">{ind.meta} {ind.unidad}</td>
                      <td className="p-2 font-bold text-[#18235C] text-right">{ind.pesoSugerido}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sección 5: Competencias Requeridas */}
            <div data-seccion-id="competencias-ficha" className="seccion-imprimible">
              <h3 className="font-bold text-[#18235C] text-sm uppercase tracking-wide border-b border-[#8FA7D6]/30 pb-1 mb-2">
                4. Competencias Requeridas (Base para Evaluación del 25%)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {cargo.ficha.competencias.map((cp, i) => (
                  <div key={i} className="p-2.5 bg-gradient-to-br from-[#18235C]/5 to-transparent rounded-lg border border-[#8FA7D6]/30">
                    <div className="flex justify-between font-bold">
                      <span className="text-[#18235C]">{cp.nombre}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-[#18235C]/10 text-[#18235C]">Nivel {cp.nivel}</span>
                    </div>
                    <span className="text-[10px] text-[#282829]/70 block mt-1">{cp.conductas}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sección 6: Firmas y Validación Digital con QR */}
            <div data-seccion-id="firmas-ficha" className="seccion-imprimible pt-8 border-t-2 border-[#18235C]/20">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-end">
                {/* Firma Emisor / Aprobador */}
                <div className="sm:col-span-5">
                  <FirmaDigitalStamp
                    firma={firmaEmisor}
                    firmanteDefault={{
                      nombre: empresaActiva?.representanteLegal?.nombre || 'Dirección de Gestión Humana',
                      cargo: 'Aprobado: Gestión Humana & Organización',
                      documento: empresaActiva?.representanteLegal?.numeroDocumento
                    }}
                    labelCargo="Firma de Validación y Aprobación Institucional"
                    onOpenFirmarModal={() => abrirModalFirmar('emisor')}
                  />
                </div>

                {/* Código QR de Validación de Autenticidad */}
                <div className="sm:col-span-2 flex justify-center">
                  <CodigoQRVerificacion
                    codigoVerificacion={codigoVerificacionDoc}
                    tipoDocumento="Manual de Cargo y Funciones"
                    titularNombre={cargo.nombre}
                    size={80}
                  />
                </div>

                {/* Firma Receptor / Colaborador */}
                <div className="sm:col-span-5">
                  <FirmaDigitalStamp
                    firma={firmaReceptor}
                    firmanteDefault={{
                      nombre: 'Colaborador Titular Asignado',
                      cargo: `Titular del Cargo: ${cargo.nombre}`,
                      documento: 'C.C. Registrada en Hoja de Vida'
                    }}
                    labelCargo="Firma de Enterado, Notificación y Compromiso"
                    onOpenFirmarModal={() => abrirModalFirmar('receptor')}
                  />
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>Cód. Verificación: {codigoVerificacionDoc}</span>
                <span>Documento oficial con validez jurídica según Ley 527 de 1999</span>
              </div>
            </div>
          </div>
        )}

        {/* Plantilla 2: Acta de Evaluación Técnica */}
        {selectedDocType === 'acta_eval' && (
          <div className="space-y-6 text-xs text-[#282829]">
            {/* Sección 1: Encabezado y Datos del Colaborador */}
            <div data-seccion-id="encabezado-acta" className="seccion-imprimible space-y-4">
              <div className="border-b-2 border-[#18235C] pb-4 flex justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={razonSocial}
                      className="max-h-16 w-auto max-w-[200px] object-contain shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-[#18235C] text-[#00FF00] font-black text-xl flex items-center justify-center rounded-lg shrink-0">
                      {razonSocial ? razonSocial.charAt(0).toUpperCase() : 'E'}
                    </div>
                  )}
                  <div>
                    <span className="text-lg sm:text-xl font-bold text-[#18235C] block">
                      ACTA DE EVALUACIÓN TÉCNICA DE DESEMPEÑO
                    </span>
                    <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-[#282829]/80 font-medium">
                      <span className="font-semibold text-[#18235C]">{razonSocial}</span>
                      {nitCompleto && <span>• {nitCompleto}</span>}
                      {ubicacionCompleta && <span>• {ubicacionCompleta}</span>}
                    </div>
                    <span className="text-[11px] text-[#282829]/70 uppercase tracking-wider font-semibold block mt-0.5">
                      Modelo Cuantitativo de 100 Puntos
                    </span>
                  </div>
                </div>
                <div className="text-right text-[11px] font-mono text-[#282829]/70 shrink-0">
                  <div>Fecha: {new Date().toLocaleDateString('es-CO')}</div>
                  <div>Período: 2026 - S1</div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-br from-[#18235C]/5 to-transparent rounded-lg border border-[#8FA7D6]/30 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>Colaborador: <strong className="block text-sm text-[#18235C]">{empleado.nombre}</strong></div>
                <div>Cargo: <strong className="block text-sm text-[#18235C]">{empCargo?.nombre}</strong></div>
                <div>Cédula: <strong className="block text-sm text-[#282829]">{empleado.documento}</strong></div>
                <div>Salario: <strong className="block text-sm text-[#282829]">{empleado.contrato.salario}</strong></div>
              </div>
            </div>

            {/* Sección 2: Consolidado Oficial de Calificación */}
            <div data-seccion-id="consolidado-acta" className="seccion-imprimible space-y-2">
              <h3 className="font-bold text-[#18235C] text-sm uppercase tracking-wide">
                Consolidado Oficial de Calificación Técnica
              </h3>
              <table className="w-full text-left border border-[#8FA7D6]/30 rounded-lg overflow-hidden">
                <thead className="bg-[#18235C] text-white">
                  <tr>
                    <th className="p-2.5">Componente Técnico</th>
                    <th className="p-2.5">Ponderación Máxima</th>
                    <th className="p-2.5">Puntaje Obtenido</th>
                    <th className="p-2.5">Estado / Cumplimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8FA7D6]/20">
                  <tr className="hover:bg-[#8FA7D6]/10">
                    <td className="p-2.5 font-medium text-[#18235C]">1. Resultados del Cargo (Indicadores Clave)</td>
                    <td className="p-2.5 font-mono">50 Puntos</td>
                    <td className="p-2.5 font-mono font-bold text-[#18235C]">43.5 Pts</td>
                    <td className="p-2.5 text-emerald-700 font-semibold">Superior (87%)</td>
                  </tr>
                  <tr className="hover:bg-[#8FA7D6]/10">
                    <td className="p-2.5 font-medium text-[#18235C]">2. Competencias Técnicas y Conductuales</td>
                    <td className="p-2.5 font-mono">25 Puntos</td>
                    <td className="p-2.5 font-mono font-bold text-[#18235C]">21.5 Pts</td>
                    <td className="p-2.5 text-emerald-700 font-semibold">Esperado (86%)</td>
                  </tr>
                  <tr className="hover:bg-[#8FA7D6]/10">
                    <td className="p-2.5 font-medium text-[#18235C]">3. SG-SST, Procedimientos y Normas</td>
                    <td className="p-2.5 font-mono">15 Puntos</td>
                    <td className="p-2.5 font-mono font-bold text-[#18235C]">14.0 Pts</td>
                    <td className="p-2.5 text-emerald-700 font-semibold">Excelente</td>
                  </tr>
                  <tr className="hover:bg-[#8FA7D6]/10">
                    <td className="p-2.5 font-medium text-[#18235C]">4. Desarrollo y Mejora Continua</td>
                    <td className="p-2.5 font-mono">10 Puntos</td>
                    <td className="p-2.5 font-mono font-bold text-[#18235C]">8.0 Pts</td>
                    <td className="p-2.5 text-emerald-700 font-semibold">Cumplido</td>
                  </tr>
                  <tr className="bg-[#18235C]/10 font-bold border-t-2 border-[#18235C]">
                    <td className="p-2.5 text-[#18235C]">TOTAL GENERAL CONSOLIDADO</td>
                    <td className="p-2.5">100 Puntos</td>
                    <td className="p-2.5 text-lg text-[#18235C]">87.0 Pts</td>
                    <td className="p-2.5 text-emerald-700 font-bold">SOBRESALIENTE</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Sección 3: Compromisos del Plan de Desarrollo */}
            <div data-seccion-id="compromisos-acta" className="seccion-imprimible p-4 bg-slate-50 rounded-lg border border-[#8FA7D6]/30 space-y-1">
              <strong className="block text-[#18235C]">Compromiso del Plan de Desarrollo:</strong>
              <p className="text-[#282829]/70">
                Se acuerda fortalecer la documentación técnica de tickets N2 y participar en el taller de escalamiento de incidencias antes del 30 de abril de 2026.
              </p>
            </div>

            {/* Sección 4: Firmas y Validación Digital con QR */}
            <div data-seccion-id="firmas-acta" className="seccion-imprimible pt-8 border-t-2 border-[#18235C]/20">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-end">
                {/* Firma Evaluador */}
                <div className="sm:col-span-5">
                  <FirmaDigitalStamp
                    firma={firmaEmisor}
                    firmanteDefault={{
                      nombre: 'Líder Evaluador / Jefe Inmediato',
                      cargo: 'Evaluador Responsable de Gestión de Desempeño',
                      documento: 'C.C. Registrada'
                    }}
                    labelCargo="Certifica veracidad de evidencias y calificaciones"
                    onOpenFirmarModal={() => abrirModalFirmar('emisor')}
                  />
                </div>

                {/* Código QR de Validación de Autenticidad */}
                <div className="sm:col-span-2 flex justify-center">
                  <CodigoQRVerificacion
                    codigoVerificacion={codigoVerificacionDoc}
                    tipoDocumento="Acta de Evaluación de Desempeño"
                    titularNombre={empleado.nombre}
                    size={80}
                  />
                </div>

                {/* Firma Colaborador Evaluado */}
                <div className="sm:col-span-5">
                  <FirmaDigitalStamp
                    firma={firmaReceptor}
                    firmanteDefault={{
                      nombre: empleado.nombre,
                      cargo: empCargo?.nombre || 'Colaborador Evaluado',
                      documento: empleado.documento
                    }}
                    labelCargo="Constancia de retroalimentación recibida"
                    onOpenFirmarModal={() => abrirModalFirmar('receptor')}
                  />
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>Cód. Autenticidad: {codigoVerificacionDoc}</span>
                <span>Acta técnica con validez jurídica según Ley 527 de 1999 de Firma Digital</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Previsualización y Configuración de Impresión por Secciones */}
      <PrevisualizacionImpresionModal
        isOpen={modalPreviewOpen}
        onClose={() => setModalPreviewOpen(false)}
        tituloDocumento={selectedDocType === 'ficha' ? `Manual de Cargo: ${cargo?.nombre}` : `Acta de Evaluación: ${empleado?.nombre}`}
        subtitulo={selectedDocType === 'ficha' ? (cargo?.ficha.identificacion.codigo || 'GH-MC-001') : (empCargo?.nombre || 'Evaluación')}
        nombreArchivo={nombreArchivoExportacion}
        elementoContenedorId="area-impresion-repositorio-documentos"
        seccionesDisponibles={seccionesActivas}
      />

      {/* Modal Herramienta de Firma Digital */}
      <HerramientaFirmaDigitalModal
        isOpen={modalFirmaOpen}
        onClose={() => setModalFirmaOpen(false)}
        onSaveSignature={handleGuardarFirma}
        tituloDocumento={selectedDocType === 'ficha' ? `Manual de Funciones: ${cargo?.nombre}` : `Acta de Evaluación: ${empleado?.nombre}`}
        firmanteSugerido={{
          nombre: firmanteActualTipo === 'emisor' ? (empresaActiva?.representanteLegal?.nombre || 'Gestión Humana') : (empleado?.nombre || 'Colaborador'),
          cargo: firmanteActualTipo === 'emisor' ? 'Dirección de Gestión Humana' : (empCargo?.nombre || 'Colaborador'),
          documento: firmanteActualTipo === 'emisor' ? (empresaActiva?.representanteLegal?.numeroDocumento || '') : (empleado?.documento || '')
        }}
      />

      {/* Modal Reporte Consolidado de Evaluaciones */}
      <ReporteConsolidadoEvaluacionesModal
        isOpen={modalReporteEvalsOpen}
        onClose={() => setModalReporteEvalsOpen(false)}
        evaluaciones={evaluaciones}
        empleados={empleados}
        cargos={cargos}
        empresa={empresaActiva}
      />

      {/* Modal Reporte Consolidado del Plan de Capacitaciones */}
      <ReporteConsolidadoCapacitacionesModal
        isOpen={modalReportePacOpen}
        onClose={() => setModalReportePacOpen(false)}
        capacitaciones={CAPACITACIONES_INICIALES}
        empleados={empleados}
        cargos={cargos}
        empresa={empresaActiva}
      />
    </div>
  );
};
