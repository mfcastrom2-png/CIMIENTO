import React, { useState } from 'react';
import {
  ENCABEZADOS_CSV_EMPLEADOS,
  generarPlantillaCsvEmpleados
} from '../services/importacionEmpleadosService';
import {
  ENCABEZADOS_CSV_SALDOS,
  generarPlantillaCsvSaldos
} from '../services/saldosInicialesService';
import {
  FileText,
  Download,
  Copy,
  Check,
  Database,
  HelpCircle,
  FileSpreadsheet,
  X,
  Code,
  ShieldCheck,
  Receipt,
  Palmtree,
  DollarSign,
  Info
} from 'lucide-react';

interface EspecificacionArchivosPlanosModalProps {
  onClose: () => void;
}

export const EspecificacionArchivosPlanosModal: React.FC<EspecificacionArchivosPlanosModalProps> = ({
  onClose
}) => {
  const [pestanaActiva, setPestanaActiva] = useState<'empleados' | 'saldos'>('empleados');
  const [copiadoEncabezado, setCopiadoEncabezado] = useState(false);

  // Descarga de Plantilla de Empleados
  const handleDescargarEmpleados = () => {
    const csvContent = '\uFEFF' + generarPlantillaCsvEmpleados();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Plantilla_Oficial_Censo_Empleados_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Descarga de Plantilla de Saldos Iniciales
  const handleDescargarSaldos = () => {
    const csvContent = '\uFEFF' + generarPlantillaCsvSaldos();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Plantilla_Oficial_Saldos_Iniciales_Nomina_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copiar encabezados al portapapeles
  const handleCopiarEncabezados = (encabezados: string[]) => {
    navigator.clipboard.writeText(encabezados.join(','));
    setCopiadoEncabezado(true);
    setTimeout(() => setCopiadoEncabezado(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-scale-up">
        {/* Cabecera */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#18235C] text-white">
                ESPECIFICACIÓN TÉCNICA
              </span>
              <span className="text-xs text-slate-500 font-medium">Archivos Planos CSV / TSV de Importación</span>
            </div>
            <h3 className="text-xl font-extrabold text-[#18235C]">
              Estructura de Archivos Planos para Migración e Integración
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Definición oficial de campos, formatos de fecha (AAAA-MM-DD), moneda (COP) y reglas de validación DIAN/CST.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer">
            ✕
          </button>
        </div>

        {/* Pestañas de Selección de Archivo Plano */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setPestanaActiva('empleados')}
            className={`px-4 py-2 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              pestanaActiva === 'empleados'
                ? 'border-[#18235C] text-[#18235C] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-[#8FA7D6]" />
            <span>1. Archivo Plano: Censo de Empleados ({ENCABEZADOS_CSV_EMPLEADOS.length} Columnas)</span>
          </button>

          <button
            type="button"
            onClick={() => setPestanaActiva('saldos')}
            className={`px-4 py-2 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
              pestanaActiva === 'saldos'
                ? 'border-[#18235C] text-[#18235C] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4 text-[#8FA7D6]" />
            <span>2. Archivo Plano: Saldos Iniciales de Nómina ({ENCABEZADOS_CSV_SALDOS.length} Columnas)</span>
          </button>
        </div>

        {/* CONTENIDO ARCHIVO PLANO 1: EMPLEADOS */}
        {pestanaActiva === 'empleados' && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <strong className="text-slate-900 font-bold block">Plantilla del Censo Digital de Colaboradores:</strong>
                <span className="text-slate-600 text-[11px]">
                  Crea los expedientes 360° con datos personales, laborales, salario, seguridad social y concepto médico SST.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopiarEncabezados(ENCABEZADOS_CSV_EMPLEADOS)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  {copiadoEncabezado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiadoEncabezado ? '¡Copiado!' : 'Copiar Encabezado'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDescargarEmpleados}
                  className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#00FF00]" />
                  <span>Descargar CSV Ejemplo</span>
                </button>
              </div>
            </div>

            {/* Código en Bloque */}
            <div className="space-y-1">
              <span className="font-bold text-slate-700 text-[11px]">Línea de Encabezado Unificada (Header CSV):</span>
              <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-lg overflow-x-auto select-all">
                {ENCABEZADOS_CSV_EMPLEADOS.join(',')}
              </pre>
            </div>

            {/* Tabla de Diccionario de Datos */}
            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#18235C] text-white text-[11px] uppercase sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Columna CSV</th>
                    <th className="py-2 px-3">Requerido</th>
                    <th className="py-2 px-3">Tipo de Dato / Estándar</th>
                    <th className="py-2 px-3">Ejemplo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px] font-mono">
                  <tr><td className="py-1.5 px-3 font-bold text-slate-900">tipoDocumento</td><td className="py-1.5 px-3 text-emerald-700 font-bold">Sí *</td><td className="py-1.5 px-3 font-sans">Código DIAN (CC, CE, NIT, PPT)</td><td className="py-1.5 px-3 text-slate-600">CC</td></tr>
                  <tr><td className="py-1.5 px-3 font-bold text-slate-900">documento</td><td className="py-1.5 px-3 text-emerald-700 font-bold">Sí *</td><td className="py-1.5 px-3 font-sans">Numérico C.C. 6 a 10 dígitos (Sin puntos)</td><td className="py-1.5 px-3 text-slate-600">1019034789</td></tr>
                  <tr><td className="py-1.5 px-3 font-bold text-slate-900">primerNombre</td><td className="py-1.5 px-3 text-emerald-700 font-bold">Sí *</td><td className="py-1.5 px-3 font-sans">Texto sin símbolos</td><td className="py-1.5 px-3 text-slate-600">Carlos</td></tr>
                  <tr><td className="py-1.5 px-3 font-bold text-slate-900">primerApellido</td><td className="py-1.5 px-3 text-emerald-700 font-bold">Sí *</td><td className="py-1.5 px-3 font-sans">Texto sin símbolos</td><td className="py-1.5 px-3 text-slate-600">Restrepo</td></tr>
                  <tr><td className="py-1.5 px-3 font-bold text-slate-900">correoCorporativo</td><td className="py-1.5 px-3 text-emerald-700 font-bold">Sí *</td><td className="py-1.5 px-3 font-sans">Email RFC 5322 (DIAN)</td><td className="py-1.5 px-3 text-slate-600">carlos.restrepo@bgroup.com.co</td></tr>
                  <tr><td className="py-1.5 px-3 font-bold text-slate-900">fechaIngreso</td><td className="py-1.5 px-3 text-emerald-700 font-bold">Sí *</td><td className="py-1.5 px-3 font-sans">Fecha AAAA-MM-DD</td><td className="py-1.5 px-3 text-slate-600">2024-03-15</td></tr>
                  <tr><td className="py-1.5 px-3 font-bold text-slate-900">salarioBasico</td><td className="py-1.5 px-3 text-emerald-700 font-bold">Sí *</td><td className="py-1.5 px-3 font-sans">Numérico COP (≥ SMMLV $1.750.905)</td><td className="py-1.5 px-3 text-slate-600">2850000</td></tr>
                  <tr><td className="py-1.5 px-3 font-bold text-slate-900">cargoNombre</td><td className="py-1.5 px-3 text-emerald-700 font-bold">Sí *</td><td className="py-1.5 px-3 font-sans">Nombre del cargo en manual</td><td className="py-1.5 px-3 text-slate-600">Técnico de Redes</td></tr>
                  <tr><td className="py-1.5 px-3 font-bold text-slate-900">eps / arl / pensiones</td><td className="py-1.5 px-3 text-slate-500">Opcional</td><td className="py-1.5 px-3 font-sans">Nombre de administradora de ley</td><td className="py-1.5 px-3 text-slate-600">SURA EPS / Positiva ARL</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONTENIDO ARCHIVO PLANO 2: SALDOS INICIALES */}
        {pestanaActiva === 'saldos' && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <strong className="text-slate-900 font-bold block">Plantilla de Empalme Contable de Saldos Iniciales:</strong>
                <span className="text-slate-600 text-[11px]">
                  Carga los pasivos acumulados de vacaciones (Art. 186 CST), cesantías, prima, acumulados DIAN (Frm 220) y cuotas de préstamos.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopiarEncabezados(ENCABEZADOS_CSV_SALDOS)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  {copiadoEncabezado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiadoEncabezado ? '¡Copiado!' : 'Copiar Encabezado'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDescargarSaldos}
                  className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-[#00FF00]" />
                  <span>Descargar CSV Ejemplo</span>
                </button>
              </div>
            </div>

            {/* Código en Bloque */}
            <div className="space-y-1">
              <span className="font-bold text-slate-700 text-[11px]">Línea de Encabezado Unificada (Header CSV):</span>
              <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-lg overflow-x-auto select-all">
                {ENCABEZADOS_CSV_SALDOS.join(',')}
              </pre>
            </div>

            {/* Tabla de Diccionario de Datos */}
            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#18235C] text-white text-[11px] uppercase sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Columna CSV</th>
                    <th className="py-2 px-3">Tipo de Dato</th>
                    <th className="py-2 px-3">Descripción Contable / Norma</th>
                    <th className="py-2 px-3">Valor Ejemplo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px] font-mono">
                  <tr><td className="py-1.5 px-3 font-bold text-slate-900">documento</td><td className="py-1.5 px-3">Texto</td><td className="py-1.5 px-3 font-sans">Cédula del colaborador para cruce unívoco</td><td className="py-1.5 px-3 text-slate-600">1020892411</td></tr>
                  <tr><td className="py-1.5 px-3 font-bold text-slate-900">fechaCorteSaldos</td><td className="py-1.5 px-3">Fecha AAAA-MM-DD</td><td className="py-1.5 px-3 font-sans">Fecha de corte del balance de empalme</td><td className="py-1.5 px-3 text-slate-600">2026-02-28</td></tr>
                  <tr><td className="py-1.5 px-3 font-bold text-slate-900">vacacionesDiasPendientes</td><td className="py-1.5 px-3">Numérico Días</td><td className="py-1.5 px-3 font-sans">Días de descanso pendientes (Art. 186 CST)</td><td className="py-1.5 px-3 text-slate-600">18.5</td></tr>
                  <tr><td className="py-1.5 px-3 font-bold text-slate-900">vacacionesValorAcumuladoCOP</td><td className="py-1.5 px-3">Numérico COP</td><td className="py-1.5 px-3 font-sans">Provisión monetaria de vacaciones</td><td className="py-1.5 px-3 text-slate-600">1285000</td></tr>
                  <tr><td className="py-1.5 px-3 font-bold text-slate-900">cesantiasSaldoAcumuladoCOP</td><td className="py-1.5 px-3">Numérico COP</td><td className="py-1.5 px-3 font-sans">Saldo de cesantías causado (Art. 249 CST)</td><td className="py-1.5 px-3 text-slate-600">1750905</td></tr>
                  <tr><td className="py-1.5 px-3 font-bold text-slate-900">interesesCesantiasAcumuladoCOP</td><td className="py-1.5 px-3">Numérico COP</td><td className="py-1.5 px-3 font-sans">Intereses sobre cesantías 12% (Ley 52/75)</td><td className="py-1.5 px-3 text-slate-600">210108</td></tr>
                  <tr><td className="py-1.5 px-3 font-bold text-slate-900">primaServiciosBaseSemestreCOP</td><td className="py-1.5 px-3">Numérico COP</td><td className="py-1.5 px-3 font-sans">Prima de servicios del semestre (Art. 306)</td><td className="py-1.5 px-3 text-slate-600">875452</td></tr>
                  <tr><td className="py-1.5 px-3 font-bold text-slate-900">ingresosLaboralesAcumuladosAnoCOP</td><td className="py-1.5 px-3">Numérico COP</td><td className="py-1.5 px-3 font-sans">Acumulado tributario ingresos (Frm 220 DIAN)</td><td className="py-1.5 px-3 text-slate-600">42500000</td></tr>
                  <tr><td className="py-1.5 px-3 font-bold text-slate-900">prestamoEmpresaCuotaMensualCOP</td><td className="py-1.5 px-3">Numérico COP</td><td className="py-1.5 px-3 font-sans">Cuota periódica para deducción en nómina</td><td className="py-1.5 px-3 text-slate-600">150000</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pie del Modal */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            Entendido y Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
