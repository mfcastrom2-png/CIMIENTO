import React, { useState } from 'react';
import {
  Database,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HardHat,
  Users,
  ShieldAlert,
  X,
  FileSpreadsheet,
  Cloud
} from 'lucide-react';
import {
  limpiarDatosDePruebaEnNube,
  cargarCatalogoBaseEppEnNube,
  guardarEmpleadoFB
} from '../lib/firebase';
import { Empleado, ItemInventarioEPP, Cargo } from '../types';

interface GestionDatosModalProps {
  onClose: () => void;
  empleadosCount: number;
  inventarioCount: number;
  solicitudesCount: number;
  cargos: Cargo[];
  onDatosLimpiados: () => void;
  onCatalogoCargado: () => void;
  onEmpleadosImportados: (nuevos: Empleado[]) => void;
}

export const GestionDatosModal: React.FC<GestionDatosModalProps> = ({
  onClose,
  empleadosCount,
  inventarioCount,
  solicitudesCount,
  cargos,
  onDatosLimpiados,
  onCatalogoCargado,
  onEmpleadosImportados
}) => {
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [confirmLimpieza, setConfirmLimpieza] = useState(false);

  const handleLimpiarDatos = async () => {
    setLoading(true);
    setMensaje(null);
    try {
      await limpiarDatosDePruebaEnNube();
      onDatosLimpiados();
      setMensaje({
        tipo: 'success',
        texto: 'Se eliminaron exitosamente todos los registros de prueba. La base de datos está limpia para producción.'
      });
      setConfirmLimpieza(false);
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: 'Error al limpiar datos: ' + (err.message || 'Compruebe su conexión.')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCargarCatalogoEpp = async () => {
    setLoading(true);
    setMensaje(null);
    try {
      await cargarCatalogoBaseEppEnNube();
      onCatalogoCargado();
      setMensaje({
        tipo: 'success',
        texto: 'Catálogo de EPPs reglamentarios cargado con stock en 0. Listo para ingresar conteos físicos.'
      });
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: 'Error al cargar catálogo EPP: ' + (err.message || 'Error en Firebase.')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportarCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      try {
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) {
          setMensaje({ tipo: 'error', texto: 'El archivo CSV debe tener al menos una fila de encabezados y un registro.' });
          return;
        }

        const nuevosEmpleados: Empleado[] = [];
        // Formato esperado: Nombre,Documento,Email,Telefono,Salario,TipoContrato
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
          if (parts.length >= 2) {
            const empId = `emp-${Date.now()}-${i}`;
            const primerCargo = cargos[0]?.id || 'c1';
            const nuevo: Empleado = {
              id: empId,
              nombre: parts[0] || `Colaborador ${i}`,
              cargoId: primerCargo,
              documento: parts[1] || `CC-${100000 + i}`,
              email: parts[2] || '',
              telefono: parts[3] || '',
              formacion: 'Bachiller / Técnico',
              experiencia: '1 año en el sector',
              contrato: {
                tipo: parts[5] || 'Término Indefinido',
                inicio: new Date().toISOString().slice(0, 10),
                fin: 'Indefinido',
                salario: parts[4] ? `$ ${Number(parts[4]).toLocaleString('es-CO')}` : '$ 2.000.000'
              },
              familia: [],
              activo: true
            };
            nuevosEmpleados.push(nuevo);
            await guardarEmpleadoFB(nuevo);
          }
        }

        onEmpleadosImportados(nuevosEmpleados);
        setMensaje({
          tipo: 'success',
          texto: `Se importaron e integraron exitosamente ${nuevosEmpleados.length} colaboradores a la base de datos en la nube.`
        });
      } catch (err: any) {
        setMensaje({ tipo: 'error', texto: 'Error al procesar CSV: ' + err.message });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs">
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] max-w-2xl w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header: fondo #18235C, títulos en #FFFFFF */}
        <div className="bg-[#18235C] px-6 py-4 flex items-center justify-between border-b border-[#101740]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#8FA7D6] text-[#18235C] flex items-center justify-center font-bold">
              <Database className="w-5 h-5 text-[#18235C]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Gestión de Datos y Preparación para Producción</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00FF00] text-[#18235C] flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-[#18235C]" />
                  Firebase Cloud
                </span>
              </h3>
              <p className="text-xs text-[#8FA7D6]">
                Herramientas para purgar datos de prueba y cargar información real de su organización.
              </p>
            </div>
          </div>
          {/* Botón de cierre: icono o botón en #8FA7D6 o #FFFFFF */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8FA7D6] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 bg-[#FFFFFF]">
          {/* Mensaje de estado */}
          {mensaje && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
                mensaje.tipo === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border border-rose-300'
              }`}
            >
              {mensaje.tipo === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#00FF00]" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              )}
              <div className="font-medium">{mensaje.texto}</div>
            </div>
          )}

          {/* Estado actual de la base de datos */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-[#FFFFFF] rounded-xl border border-[#8FA7D6] text-xs">
            <div>
              <div className="text-[#282829] font-medium">Colaboradores en Base</div>
              <div className="text-2xl font-extrabold text-[#18235C] mt-0.5">
                {empleadosCount}
              </div>
            </div>
            <div>
              <div className="text-[#282829] font-medium">Artículos EPP Almacén</div>
              <div className="text-2xl font-extrabold text-[#18235C] mt-0.5">
                {inventarioCount}
              </div>
            </div>
            <div>
              <div className="text-[#282829] font-medium">Solicitudes Registradas</div>
              <div className="text-2xl font-extrabold text-[#18235C] mt-0.5">
                {solicitudesCount}
              </div>
            </div>
          </div>

          {/* Acciones de Preparación de Producción */}
          <div className="space-y-4 text-xs">
            
            {/* Opción 1: Limpiar Datos de Prueba */}
            <div className="p-4 rounded-xl border border-[#8FA7D6]/50 bg-[#FFFFFF] space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-[#18235C] flex items-center gap-1.5 text-sm">
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>1. Limpiar Datos de Prueba (Recomendado para inicio real)</span>
                  </div>
                  <p className="text-[#282829] text-xs leading-relaxed">
                    Elimina los colaboradores ficticios (&ldquo;Juan Pérez&rdquo;, &ldquo;Carlos Mendivelso de ejemplo&rdquo;), 
                    solicitudes de prueba y evaluaciones de prueba, dejando la base de datos en 0 lista para cargar la nómina real.
                  </p>
                </div>
              </div>

              {!confirmLimpieza ? (
                <button
                  type="button"
                  onClick={() => setConfirmLimpieza(true)}
                  disabled={loading}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-rose-200"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Iniciar Limpieza de Datos de Prueba</span>
                </button>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800 text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>¿Confirmas que deseas eliminar los datos de prueba?</span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    Esta acción vaciará los empleados ficticios de la base de datos en la nube manteniendo usuarios de administración.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleLimpiarDatos}
                      disabled={loading}
                      className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs transition-colors"
                    >
                      {loading ? 'Limpiando base...' : 'Sí, Limpiar Base Ahora'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmLimpieza(false)}
                      className="px-3.5 py-1.5 bg-[#FFFFFF] border border-[#8FA7D6] text-[#18235C] font-bold rounded-lg text-xs hover:bg-[#8FA7D6]/15"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Opción 2: Cargar Catálogo Base EPP con stock en 0 */}
            <div className="p-4 rounded-xl border border-[#8FA7D6]/50 bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="font-bold text-[#18235C] flex items-center gap-1.5 text-sm">
                  <HardHat className="w-4 h-4 text-[#18235C]" />
                  <span>2. Cargar Catálogo Base de EPPs Reglamentarios</span>
                </div>
                <p className="text-[#282829] text-xs">
                  Carga las 6 referencias certificadas (Casco tipo I, Gafas UV, Guantes nitrilo, Botas dieléctricas, Tapones NRR27 y Mascarilla N95) con stock en 0 para ingresar existencias de bodega.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCargarCatalogoEpp}
                disabled={loading}
                className="shrink-0 px-3.5 py-2 bg-[#18235C] hover:bg-[#101740] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00FF00]' : 'text-[#00FF00]'}`} />
                <span>Cargar EPPs (Stock 0)</span>
              </button>
            </div>

            {/* Opción 3: Importar Empleados desde CSV */}
            <div className="p-4 rounded-xl border border-[#8FA7D6]/50 bg-[#FFFFFF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="font-bold text-[#18235C] flex items-center gap-1.5 text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-[#8FA7D6]" />
                  <span>3. Carga Masiva de Empleados desde CSV</span>
                </div>
                <p className="text-[#282829] text-xs">
                  Sube un archivo delimitado por comas con formato: <code className="font-mono bg-[#8FA7D6]/20 px-1 py-0.5 rounded text-[#18235C]">Nombre,Cédula,Email,Teléfono,Salario,TipoContrato</code>
                </p>
              </div>
              <label className="shrink-0 px-3.5 py-2 bg-[#8FA7D6] hover:bg-white border border-[#8FA7D6] text-[#18235C] font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-[#18235C]" />
                <span>Subir Archivo CSV</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleImportarCsv}
                  className="hidden"
                />
              </label>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#8FA7D6]/30 flex items-center justify-between text-xs bg-[#FFFFFF]">
          <span className="text-[#282829]">
            Proyecto Firebase: <code className="font-mono text-[#18235C] font-bold">gen-lang-client-0929693234</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#FFFFFF] hover:bg-[#8FA7D6]/15 border border-[#8FA7D6] text-[#18235C] font-bold rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
