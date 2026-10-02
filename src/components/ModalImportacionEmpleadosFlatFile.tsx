import React, { useState, useRef } from 'react';
import {
  Empleado,
  Cargo,
  AreaOrganizacion,
  UsuarioSistema
} from '../types';
import {
  parsearTextoCsvEmpleados,
  generarPlantillaCsvEmpleados,
  ResultadoParseoEmpleados,
  ENCABEZADOS_CSV_EMPLEADOS
} from '../services/importacionEmpleadosService';
import { guardarEmpleadoFB, registrarEventoAuditoria } from '../lib/firebase';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Check,
  X,
  Users,
  Database,
  RefreshCw,
  ShieldCheck,
  Building2,
  DollarSign
} from 'lucide-react';

interface ModalImportacionEmpleadosFlatFileProps {
  cargos: Cargo[];
  areas: AreaOrganizacion[];
  empleadosExistentes: Empleado[];
  currentUser?: UsuarioSistema | null;
  onClose: () => void;
  onImportados: (nuevosEmpleados: Empleado[]) => Promise<void> | void;
}

export const ModalImportacionEmpleadosFlatFile: React.FC<ModalImportacionEmpleadosFlatFileProps> = ({
  cargos,
  areas,
  empleadosExistentes,
  currentUser,
  onClose,
  onImportados
}) => {
  const [textoPegado, setTextoPegado] = useState('');
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [resultadoParseo, setResultadoParseo] = useState<ResultadoParseoEmpleados | null>(null);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardarEnFirestore, setGuardarEnFirestore] = useState(true);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manejar descarga de plantilla oficial
  const handleDescargarPlantilla = () => {
    const csvContent = '\uFEFF' + generarPlantillaCsvEmpleados();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Plantilla_Importacion_Empleados_BGroup_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Procesar archivo seleccionado
  const handleSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNombreArchivo(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const contenido = event.target?.result as string;
      setTextoPegado(contenido);
      procesarTexto(contenido);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const procesarTexto = (contenido: string) => {
    if (!contenido.trim()) {
      setResultadoParseo(null);
      return;
    }
    const res = parsearTextoCsvEmpleados(contenido, cargos, areas, empleadosExistentes);
    setResultadoParseo(res);
  };

  // Cargar Lote de Prueba de Empleados
  const handleCargarPrueba = () => {
    const csvPrueba = generarPlantillaCsvEmpleados();
    setTextoPegado(csvPrueba);
    setNombreArchivo('Lote_Prueba_Colaboradores_2026.csv');
    procesarTexto(csvPrueba);
  };

  // Confirmar importación
  const handleConfirmarImportacion = async () => {
    if (!resultadoParseo || resultadoParseo.items.length === 0) {
      setMensajeError('No hay registros válidos para importar.');
      return;
    }

    setGuardando(true);
    setMensajeError(null);

    try {
      const nuevos = resultadoParseo.items;

      // 1. Guardar en Firestore si aplica
      if (guardarEnFirestore) {
        for (const emp of nuevos) {
          await guardarEmpleadoFB(emp);
        }
      }

      // 2. Registrar evento de auditoría
      await registrarEventoAuditoria(
        'IMPORTACION_MASIVA_EMPLEADOS',
        'empleados',
        `Importación masiva exitosa de ${nuevos.length} colaboradores desde archivo plano CSV.`,
        currentUser || null,
        `lote-${Date.now()}`,
        { cantidad: nuevos.length }
      );

      // 3. Notificar al componente padre
      await onImportados(nuevos);

      setMensajeExito(`¡Importación exitosa! Se han vinculado ${nuevos.length} colaboradores al censo de la empresa.`);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Error importando empleados:', err);
      setMensajeError(err?.message || 'Ocurrió un error al importar los colaboradores.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-scale-up">
        {/* Cabecera */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#18235C] text-white">
                ARCHIVO PLANO CSV / EXCEL
              </span>
              <span className="text-xs text-slate-500">Importación Masiva de Expedientes</span>
            </div>
            <h3 className="text-xl font-extrabold text-[#18235C]">
              Importar Censo de Empleados por Archivo Plano
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Carga masiva de la estructura de talento humano conforme a los estándares de la DIAN y el CST.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-lg cursor-pointer">
            ✕
          </button>
        </div>

        {/* Alertas */}
        {mensajeExito && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {mensajeError && (
          <div className="p-3.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{mensajeError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Panel Entrada Archivo */}
          <div className="lg:col-span-2 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#18235C] flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-[#18235C]" />
                1. Seleccionar o Pegar Datos
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDescargarPlantilla}
                  className="text-[11px] font-bold text-[#18235C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Plantilla CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleCargarPrueba}
                  className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Cargar Ejemplo</span>
                </button>
              </div>
            </div>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#8FA7D6] hover:border-[#18235C] bg-white rounded-xl p-5 text-center cursor-pointer transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleSeleccionarArchivo}
                className="hidden"
              />
              <Upload className="w-7 h-7 text-[#18235C] mx-auto mb-1" />
              <p className="text-xs font-bold text-[#18235C]">
                Sube tu archivo .CSV o .TSV de colaboradores
              </p>
              <p className="text-[10px] text-slate-500">
                {nombreArchivo ? `Archivo activo: ${nombreArchivo}` : 'Formatos: .csv separado por comas o punto y coma'}
              </p>
            </div>

            <textarea
              value={textoPegado}
              onChange={(e) => {
                setTextoPegado(e.target.value);
                procesarTexto(e.target.value);
              }}
              placeholder="O copia y pega aquí las columnas directamente desde Excel (Ctrl+V)..."
              rows={3}
              className="w-full p-2.5 font-mono text-xs border border-slate-300 rounded-lg bg-white resize-y"
            />
          </div>

          {/* Opciones Importación */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <span className="font-bold text-xs text-[#18235C] block mb-2">
                2. Configuración de Importación
              </span>

              <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={guardarEnFirestore}
                  onChange={(e) => setGuardarEnFirestore(e.target.checked)}
                  className="mt-0.5 rounded text-[#18235C]"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Sincronizar en Firestore</span>
                  <span className="text-[10px] text-slate-500">Guarda automáticamente los expedientes en la nube.</span>
                </div>
              </label>
            </div>

            <button
              type="button"
              onClick={handleConfirmarImportacion}
              disabled={!resultadoParseo || resultadoParseo.items.length === 0 || guardando}
              className="w-full py-2.5 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className={`w-4 h-4 text-emerald-400 ${guardando ? 'animate-spin' : ''}`} />
              <span>
                {guardando
                  ? 'Importando...'
                  : `Importar ${resultadoParseo?.items.length || 0} Colaboradores`}
              </span>
            </button>
          </div>
        </div>

        {/* Grilla Previsualización */}
        {resultadoParseo && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#18235C]">
              <div className="flex items-center gap-2">
                <span>Previsualización y Validación DIAN:</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px]">
                  {resultadoParseo.resumen.validos} Válidos
                </span>
                {resultadoParseo.errores.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px]">
                    {resultadoParseo.errores.length} Errores
                  </span>
                )}
              </div>

              <input
                type="text"
                placeholder="Filtrar por nombre o cédula..."
                value={filtroBusqueda}
                onChange={(e) => setFiltroBusqueda(e.target.value)}
                className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-normal"
              />
            </div>

            {/* Errores */}
            {resultadoParseo.errores.length > 0 && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
                <strong>Se detectaron errores en el archivo plano:</strong>
                <ul className="list-disc list-inside text-[11px] space-y-0.5">
                  {resultadoParseo.errores.slice(0, 4).map((err, idx) => (
                    <li key={idx}>Fila {err.fila} ({err.columna}): {err.mensaje}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tabla */}
            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#18235C] text-white text-[11px] sticky top-0">
                  <tr>
                    <th className="py-2 px-3">Documento DIAN</th>
                    <th className="py-2 px-3">Colaborador</th>
                    <th className="py-2 px-3">Cargo / Área</th>
                    <th className="py-2 px-3 text-right">Salario Básico</th>
                    <th className="py-2 px-3">Correo Corporativo</th>
                    <th className="py-2 px-3 text-center">Estado DIAN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs font-mono">
                  {resultadoParseo.items
                    .filter(item => {
                      if (!filtroBusqueda.trim()) return true;
                      const q = filtroBusqueda.toLowerCase();
                      return item.nombre.toLowerCase().includes(q) || item.documento.includes(q);
                    })
                    .map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-800">C.C. {item.documento}</td>
                        <td className="py-2 px-3 font-sans font-bold text-slate-900">{item.nombre}</td>
                        <td className="py-2 px-3 font-sans text-slate-600">
                          {item.laboral?.cargoNombre} ({item.laboral?.areaNombre})
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-800">
                          ${(item.salarioBase || 0).toLocaleString('es-CO')}
                        </td>
                        <td className="py-2 px-3 font-sans text-slate-600">{item.email}</td>
                        <td className="py-2 px-3 text-center font-sans">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            DIAN Ok
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
