import React, { useState } from 'react';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Users,
  DollarSign,
  ArrowRight,
  RefreshCw,
  Search
} from 'lucide-react';
import { ClienteComercial } from '../../types';
import { importarSaldosMasivos } from '../../services/comercialService';
import {
  descargarPlantillaExcelSaldos,
  parsearExcelSaldos,
  procesarFilasMatrizSaldos
} from '../../utils/excelTemplateUtils';

interface SubidaMasivaSaldosViewProps {
  onImportacionCompletada?: () => void;
}

export const SubidaMasivaSaldosView: React.FC<SubidaMasivaSaldosViewProps> = ({
  onImportacionCompletada
}) => {
  const [textoPegado, setTextoPegado] = useState('');
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [clientesValidados, setClientesValidados] = useState<ClienteComercial[]>([]);
  const [erroresValidacion, setErroresValidacion] = useState<string[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<{ importados: number; actualizados: number } | null>(null);

  // Parsear texto (pegado directo de filas de Excel o Google Sheets)
  const procesarTextoImportacion = (texto: string) => {
    setTextoPegado(texto);
    setResultado(null);
    const lineas = texto.trim().split('\n').filter(l => l.trim().length > 0);
    if (lineas.length === 0) {
      setClientesValidados([]);
      setErroresValidacion([]);
      return;
    }

    // Dividir filas tabuladas o separadas
    const matrizFilas = lineas.map(linea => {
      const sep = linea.includes('\t') ? '\t' : linea.includes(';') ? ';' : ',';
      return linea.split(sep).map(c => c.trim().replace(/^["']|["']$/g, ''));
    });

    const { clientes, errores } = procesarFilasMatrizSaldos(matrizFilas);
    setClientesValidados(clientes);
    setErroresValidacion(errores);
  };

  const handleArchivoSeleccionado = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNombreArchivo(file.name);
    setResultado(null);
    const esExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (esExcel) {
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const buffer = ev.target?.result as ArrayBuffer;
          const { clientes, errores } = parsearExcelSaldos(buffer);
          setClientesValidados(clientes);
          setErroresValidacion(errores);
          setTextoPegado('');
        } catch (err) {
          console.error('Error procesando archivo Excel:', err);
          setErroresValidacion(['No se pudo leer el archivo Excel. Asegúrese de que sea un archivo .xlsx válido.']);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = ev => {
        const contenido = ev.target?.result as string;
        procesarTextoImportacion(contenido);
      };
      reader.readAsText(file);
    }
  };

  const ejecutarImportacion = async () => {
    if (clientesValidados.length === 0) return;
    setProcesando(true);
    try {
      const res = await importarSaldosMasivos(clientesValidados);
      setResultado(res);
      setClientesValidados([]);
      setTextoPegado('');
      setNombreArchivo('');
      if (onImportacionCompletada) onImportacionCompletada();
    } catch (err) {
      console.error('Error importando saldos:', err);
    } finally {
      setProcesando(false);
    }
  };

  const totalSaldos = clientesValidados.reduce((acc, c) => acc + c.saldoPendiente, 0);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-800">Subida Masiva de Saldos</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Plantilla Excel Oficial (.xlsx)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cargue carteras de clientes, estados de cuenta y saldos pendientes directamente en formato Microsoft Excel (.xlsx).
            </p>
          </div>
        </div>

        <button
          onClick={descargarPlantillaExcelSaldos}
          className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-2 border border-emerald-300 shadow-xs transition-all cursor-pointer"
          title="Descargar libro de Microsoft Excel (.xlsx) estructurado con columnas y ejemplos"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Descargar Plantilla Excel (.xlsx)</span>
        </button>
      </div>

      {/* Resultado de importación previa */}
      {resultado && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">¡Subida Masiva Exitosa!</p>
              <p className="text-xs text-emerald-700">
                Se registraron {resultado.importados} clientes nuevos y se actualizaron {resultado.actualizados} saldos existentes en la cartera.
              </p>
            </div>
          </div>
          <button
            onClick={() => setResultado(null)}
            className="text-xs font-bold text-emerald-800 underline cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Zona de Carga / Pegado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Opción A: Subir Archivo Excel */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Upload className="w-4 h-4 text-emerald-700" />
              Opción 1: Cargar Archivo Excel (.xlsx / .xls)
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Recomendado
            </span>
          </div>
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 hover:border-emerald-600 bg-slate-50 hover:bg-emerald-50/20 rounded-2xl cursor-pointer transition-colors text-center group">
            <FileSpreadsheet className="w-10 h-10 text-emerald-600 group-hover:scale-110 mb-2 transition-transform" />
            <span className="text-xs font-bold text-slate-700">Haga clic para examinar o arrastre el archivo Excel</span>
            <span className="text-[11px] text-slate-500 mt-1">Archivos compatibles: Microsoft Excel (.xlsx, .xls) y CSV</span>
            {nombreArchivo && (
              <span className="mt-2 text-xs font-mono font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-md">
                Archivo seleccionado: {nombreArchivo}
              </span>
            )}
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.txt"
              onChange={handleArchivoSeleccionado}
              className="hidden"
            />
          </label>
        </div>

        {/* Opción B: Pegar datos directamente de Excel */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            Opción 2: Pegar celdas copiadas de Excel / Sheets
          </h3>
          <textarea
            rows={5}
            value={textoPegado}
            onChange={e => procesarTextoImportacion(e.target.value)}
            placeholder="Copie filas en Excel (Ctrl+C) y péguelas aquí directamente (Ctrl+V)..."
            className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-700 focus:bg-white focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Errores de validación */}
      {erroresValidacion.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1 text-xs">
          <div className="flex items-center gap-2 font-bold mb-1">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Se detectaron {erroresValidacion.length} advertencias en las filas:</span>
          </div>
          {erroresValidacion.slice(0, 5).map((err, i) => (
            <p key={i} className="text-rose-700">• {err}</p>
          ))}
          {erroresValidacion.length > 5 && (
            <p className="text-rose-600 font-semibold italic">...y {erroresValidacion.length - 5} observaciones más.</p>
          )}
        </div>
      )}

      {/* Previsualización antes de importar */}
      {clientesValidados.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Previsualización de Saldos a Importar ({clientesValidados.length} registros válidos)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verifique los datos antes de aplicar los cambios en la cartera general.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Cartera</span>
                <span className="text-base font-black text-emerald-600 font-mono">${totalSaldos.toLocaleString('es-CO')}</span>
              </div>
              <button
                onClick={ejecutarImportacion}
                disabled={procesando}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {procesando ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Importando...</span>
                  </>
                ) : (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    <span>Confirmar e Importar Saldos</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-72 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Identificación</th>
                  <th className="py-2.5 px-3">Cliente / Razón Social</th>
                  <th className="py-2.5 px-3">Plan Contratado</th>
                  <th className="py-2.5 px-3">Saldo a Registrar</th>
                  <th className="py-2.5 px-3">Vencimiento</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {clientesValidados.slice(0, 50).map((cli, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono font-bold text-slate-800">{cli.codigo}</td>
                    <td className="py-2 px-3 font-mono text-slate-600">{cli.identificacion}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800 truncate max-w-[200px]">{cli.nombre}</td>
                    <td className="py-2 px-3 text-slate-600">{cli.planServicio}</td>
                    <td className="py-2 px-3 font-mono font-bold text-emerald-600">${cli.saldoPendiente.toLocaleString('es-CO')}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{cli.fechaVencimiento}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cli.saldoPendiente > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {cli.estado}
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
  );
};
