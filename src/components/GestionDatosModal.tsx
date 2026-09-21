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
  Cloud,
  GraduationCap,
  GitFork,
  PackageCheck,
  Check
} from 'lucide-react';
import {
  limpiarDatosDePruebaEnNube,
  limpiarBaseEppFB,
  limpiarCapacitacionesFB,
  limpiarEstructuraOrganicaFB,
  cargarCatalogoBaseEppEnNube,
  guardarEmpleadoFB,
  guardarEmpleadosLoteFB
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
  onLimpiarEpp?: () => void;
  onLimpiarCapacitaciones?: () => void;
  onLimpiarEstructura?: () => void;
  isSuperAdmin?: boolean;
}

export const GestionDatosModal: React.FC<GestionDatosModalProps> = ({
  onClose,
  empleadosCount,
  inventarioCount,
  solicitudesCount,
  cargos,
  onDatosLimpiados,
  onCatalogoCargado,
  onEmpleadosImportados,
  onLimpiarEpp,
  onLimpiarCapacitaciones,
  onLimpiarEstructura,
  isSuperAdmin = true
}) => {
  if (!isSuperAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl border border-rose-300 max-w-md w-full p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-900">Acceso Restringido</h3>
              <p className="text-xs text-rose-700">Exclusivo Superadministrador</p>
            </div>
          </div>
          <p className="text-xs text-[#282829]/80 leading-relaxed">
            Las funciones de depuración, formateo y vaciado de bases de datos para paso a producción están reservadas exclusivamente para el perfil de Superadministrador.
          </p>
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#18235C] text-white text-xs font-bold rounded-lg hover:bg-[#101740] transition-colors"
            >
              Entendido / Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [confirmLimpiezaGlobal, setConfirmLimpiezaGlobal] = useState(false);
  const [confirmLimpiezaEpp, setConfirmLimpiezaEpp] = useState(false);
  const [confirmLimpiezaCap, setConfirmLimpiezaCap] = useState(false);
  const [confirmLimpiezaOrg, setConfirmLimpiezaOrg] = useState(false);

  // 1. Limpieza Global Completa de Producción
  const handleLimpiarDatosGlobal = async () => {
    setLoading(true);
    setMensaje(null);
    try {
      await limpiarDatosDePruebaEnNube();
      onDatosLimpiados();
      if (onLimpiarEpp) onLimpiarEpp();
      if (onLimpiarCapacitaciones) onLimpiarCapacitaciones();
      if (onLimpiarEstructura) onLimpiarEstructura();
      setMensaje({
        tipo: 'success',
        texto: 'Se eliminaron exitosamente todos los registros de prueba de todas las bases de datos (Empleados, EPP, Capacitaciones, Evaluaciones). El sistema está listo para producción.'
      });
      setConfirmLimpiezaGlobal(false);
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: 'Error al ejecutar limpieza global: ' + (err.message || 'Compruebe su conexión.')
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Limpieza Específica de EPP (Almacén e Inventario de Seguridad)
  const handleLimpiarEpp = async () => {
    setLoading(true);
    setMensaje(null);
    try {
      await limpiarBaseEppFB();
      if (onLimpiarEpp) onLimpiarEpp();
      setMensaje({
        tipo: 'success',
        texto: 'Base de datos de EPP depurada exitosamente: se eliminaron todas las solicitudes/actas de entrega y se restablecieron las existencias en stock a 0.'
      });
      setConfirmLimpiezaEpp(false);
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: 'Error al depurar base de datos EPP: ' + (err.message || 'Error en Firebase.')
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. Limpieza Específica de Capacitaciones
  const handleLimpiarCapacitaciones = async () => {
    setLoading(true);
    setMensaje(null);
    try {
      await limpiarCapacitacionesFB();
      if (onLimpiarCapacitaciones) onLimpiarCapacitaciones();
      setMensaje({
        tipo: 'success',
        texto: 'Base de datos de Capacitaciones depurada: se eliminaron las asistencias, exámenes y participantes de prueba. El plan de capacitación queda listo para convocatorias reales.'
      });
      setConfirmLimpiezaCap(false);
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: 'Error al depurar capacitaciones: ' + (err.message || 'Error en Firebase.')
      });
    } finally {
      setLoading(false);
    }
  };

  // 4. Limpieza Específica de Estructura Orgánica
  const handleLimpiarEstructura = async () => {
    setLoading(true);
    setMensaje(null);
    try {
      await limpiarEstructuraOrganicaFB();
      if (onLimpiarEstructura) onLimpiarEstructura();
      setMensaje({
        tipo: 'success',
        texto: 'Estructura orgánica y cargos depurados: se desvincularon colaboradores de prueba y se restableció la jerarquía de cargos al esquema corporativo oficial.'
      });
      setConfirmLimpiezaOrg(false);
    } catch (err: any) {
      setMensaje({
        tipo: 'error',
        texto: 'Error al depurar estructura orgánica: ' + (err.message || 'Error en Firebase.')
      });
    } finally {
      setLoading(false);
    }
  };

  // 5. Cargar Catálogo Base de EPPs Reglamentarios
  const handleCargarCatalogoEpp = async () => {
    setLoading(true);
    setMensaje(null);
    try {
      await cargarCatalogoBaseEppEnNube();
      onCatalogoCargado();
      setMensaje({
        tipo: 'success',
        texto: 'Catálogo de EPPs reglamentarios cargado con existencias en 0. Listo para ingresar conteos físicos de almacén.'
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

  // 6. Carga Masiva de Empleados desde CSV
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
          }
        }

        // Persistencia 100% atómica de todos los empleados mediante writeBatch
        if (nuevosEmpleados.length > 0) {
          await guardarEmpleadosLoteFB(nuevosEmpleados);
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
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#8FA7D6] max-w-3xl w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header Institucional B GROUP */}
        <div className="bg-[#18235C] px-6 py-4 flex items-center justify-between border-b border-[#101740]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#101740] border border-[#8FA7D6]/60 flex items-center justify-center font-bold text-[#00FF00]">
              <Database className="w-5 h-5 text-[#00FF00]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Inicialización y Mantenimiento de Bases de Datos</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00FF00] text-[#18235C] flex items-center gap-1">
                  <Cloud className="w-3 h-3 text-[#18235C]" />
                  Firebase Cloud
                </span>
              </h3>
              <p className="text-xs text-[#8FA7D6]">
                Herramientas corporativas para administración y acondicionamiento operativo de las bases de datos en la nube.
              </p>
            </div>
          </div>
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
              className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                mensaje.tipo === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border border-rose-300'
              }`}
            >
              {mensaje.tipo === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              )}
              <div className="font-semibold">{mensaje.texto}</div>
            </div>
          )}

          {/* Estado actual de las bases de datos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#F8FAFC] rounded-xl border border-[#8FA7D6]/60 text-xs">
            <div>
              <div className="text-[#282829]/70 font-medium">Colaboradores</div>
              <div className="text-xl font-extrabold text-[#18235C] mt-0.5">
                {empleadosCount}
              </div>
            </div>
            <div>
              <div className="text-[#282829]/70 font-medium">EPPs en Almacén</div>
              <div className="text-xl font-extrabold text-[#18235C] mt-0.5">
                {inventarioCount}
              </div>
            </div>
            <div>
              <div className="text-[#282829]/70 font-medium">Solicitudes/Actas</div>
              <div className="text-xl font-extrabold text-[#18235C] mt-0.5">
                {solicitudesCount}
              </div>
            </div>
            <div>
              <div className="text-[#282829]/70 font-medium">Cargos Orgánicos</div>
              <div className="text-xl font-extrabold text-[#18235C] mt-0.5">
                {cargos.length}
              </div>
            </div>
          </div>

          {/* Acciones de Depuración Modular */}
          <div className="space-y-3.5 text-xs">
            
            {/* SECCIÓN 1: DEPURAR EPP */}
            <div className="p-4 rounded-xl border border-[#8FA7D6] bg-white space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-[#18235C] flex items-center gap-1.5 text-sm">
                    <HardHat className="w-4 h-4 text-[#18235C]" />
                    <span>Inicializar Base de Datos de EPPs (Almacén e Inventario)</span>
                  </div>
                  <p className="text-[#282829]/80 text-xs">
                    Reinicia las solicitudes y actas de entrega, y coloca las existencias de inventario en 0 para registro de conteo físico en bodega.
                  </p>
                </div>
                {!confirmLimpiezaEpp ? (
                  <button
                    type="button"
                    onClick={() => setConfirmLimpiezaEpp(true)}
                    disabled={loading}
                    className="shrink-0 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs flex items-center gap-1.5 border border-rose-300 transition-colors shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Inicializar EPPs</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLimpiarEpp}
                      disabled={loading}
                      className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs transition-colors"
                    >
                      {loading ? 'Limpiando...' : 'Confirmar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmLimpiezaEpp(false)}
                      className="px-2.5 py-1.5 bg-white border border-[#8FA7D6] text-[#18235C] font-bold rounded-lg text-xs hover:bg-[#8FA7D6]/10"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: DEPURAR CAPACITACIONES */}
            <div className="p-4 rounded-xl border border-[#8FA7D6] bg-white space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-[#18235C] flex items-center gap-1.5 text-sm">
                    <GraduationCap className="w-4 h-4 text-[#18235C]" />
                    <span>Inicializar Base de Datos de Capacitaciones</span>
                  </div>
                  <p className="text-[#282829]/80 text-xs">
                    Reinicia las listas de asistencia y registros de evaluación, dejando el catálogo de cursos listo para convocatorias del personal.
                  </p>
                </div>
                {!confirmLimpiezaCap ? (
                  <button
                    type="button"
                    onClick={() => setConfirmLimpiezaCap(true)}
                    disabled={loading}
                    className="shrink-0 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs flex items-center gap-1.5 border border-rose-300 transition-colors shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Inicializar Capacitaciones</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLimpiarCapacitaciones}
                      disabled={loading}
                      className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs transition-colors"
                    >
                      {loading ? 'Limpiando...' : 'Confirmar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmLimpiezaCap(false)}
                      className="px-2.5 py-1.5 bg-white border border-[#8FA7D6] text-[#18235C] font-bold rounded-lg text-xs hover:bg-[#8FA7D6]/10"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 3: DEPURAR ESTRUCTURA ORGÁNICA */}
            <div className="p-4 rounded-xl border border-[#8FA7D6] bg-white space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-[#18235C] flex items-center gap-1.5 text-sm">
                    <GitFork className="w-4 h-4 text-[#18235C]" />
                    <span>Restablecer Estructura Orgánica y Organigrama</span>
                  </div>
                  <p className="text-[#282829]/80 text-xs">
                    Restaura la estructura de cargos corporativos oficiales de B GROUP INGENIERIA S.A.S.
                  </p>
                </div>
                {!confirmLimpiezaOrg ? (
                  <button
                    type="button"
                    onClick={() => setConfirmLimpiezaOrg(true)}
                    disabled={loading}
                    className="shrink-0 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs flex items-center gap-1.5 border border-rose-300 transition-colors shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Restablecer Estructura</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleLimpiarEstructura}
                      disabled={loading}
                      className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs transition-colors"
                    >
                      {loading ? 'Limpiando...' : 'Confirmar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmLimpiezaOrg(false)}
                      className="px-2.5 py-1.5 bg-white border border-[#8FA7D6] text-[#18235C] font-bold rounded-lg text-xs hover:bg-[#8FA7D6]/10"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 4: LIMPIEZA GLOBAL COMPLETA */}
            <div className="p-4 rounded-xl border border-rose-300 bg-rose-50/40 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="font-bold text-[#18235C] flex items-center gap-1.5 text-sm">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Inicialización General del Sistema (Todos los Módulos)</span>
                  </div>
                  <p className="text-[#282829]/80 text-xs leading-relaxed">
                    Formatea las tablas operativas de colaboradores, solicitudes, evaluaciones, inventarios y movimientos en un solo paso, preservando la parametrización institucional y las cuentas maestras de administración.
                  </p>
                </div>
              </div>

              {!confirmLimpiezaGlobal ? (
                <button
                  type="button"
                  onClick={() => setConfirmLimpiezaGlobal(true)}
                  disabled={loading}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                  <span>Ejecutar Inicialización General</span>
                </button>
              ) : (
                <div className="p-3 bg-white border border-rose-300 rounded-lg space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-rose-800 text-xs">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>¿Confirma la inicialización general de todas las bases de datos?</span>
                  </div>
                  <p className="text-[11px] text-rose-700">
                    Esta acción formateará los registros operativos en la nube para colaboradores, EPPs, capacitaciones y solicitudes.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleLimpiarDatosGlobal}
                      disabled={loading}
                      className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs transition-colors"
                    >
                      {loading ? 'Procesando...' : 'Sí, Inicializar Todo Ahora'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmLimpiezaGlobal(false)}
                      className="px-3.5 py-1.5 bg-white border border-[#8FA7D6] text-[#18235C] font-bold rounded-lg text-xs hover:bg-[#8FA7D6]/15"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SECCIÓN 5: CARGAR CATÁLOGO BASE EPP CON STOCK EN 0 */}
            <div className="p-4 rounded-xl border border-[#8FA7D6] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-bold text-[#18235C] flex items-center gap-1.5 text-sm">
                  <PackageCheck className="w-4 h-4 text-[#18235C]" />
                  <span>Cargar Catálogo Base de EPPs Reglamentarios</span>
                </div>
                <p className="text-[#282829]/80 text-xs">
                  Carga las 6 referencias certificadas (Casco tipo I, Gafas UV, Guantes nitrilo, Botas dieléctricas, Tapones NRR27 y Mascarilla N95) con existencias en 0.
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

            {/* SECCIÓN 6: IMPORTACIÓN DE EMPLEADOS CSV */}
            <div className="p-4 rounded-xl border border-[#8FA7D6] bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-bold text-[#18235C] flex items-center gap-1.5 text-sm">
                  <FileSpreadsheet className="w-4 h-4 text-[#18235C]" />
                  <span>Carga Masiva de Empleados desde CSV</span>
                </div>
                <p className="text-[#282829]/80 text-xs">
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
          <span className="text-[#282829]/80">
            Conectado a Firebase Cloud • <code className="font-mono text-[#18235C] font-bold">ai-studio-cimientogestinhu</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white font-bold rounded-lg transition-colors shadow-2xs"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
