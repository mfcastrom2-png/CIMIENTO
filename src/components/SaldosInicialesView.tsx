import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Empleado,
  Cargo,
  SaldoInicialEmpleadoNomina,
  Role,
  UsuarioSistema,
  ConfiguracionEmpresa,
  ControlVacacionesEmpleado,
  NovedadNominaEmpleado
} from '../types';
import {
  parsearTextoCsvOClipboard,
  generarPlantillaCsvSaldos,
  generarLotePruebaSaldos,
  obtenerSaldosInicialesLocal,
  guardarSaldosInicialesLocal,
  agregarOActualizarSaldosLocal,
  eliminarSaldoInicialLocal,
  limpiarTodosSaldosInicialesLocal,
  generarNovedadesDesdeSaldosIniciales,
  sincronizarOSincronizarYCrearEmpleadosDesdeSaldos,
  calcularProvisionMensualVacaciones,
  calcularPasivosLaboralesCompletos,
  ResultadoParseoSaldos,
  ENCABEZADOS_CSV_SALDOS
} from '../services/saldosInicialesService';
import {
  guardarSaldosInicialesLoteFB,
  obtenerSaldosInicialesFB,
  eliminarSaldoInicialFB,
  registrarEventoAuditoria
} from '../lib/firebase';
import * as XLSX from 'xlsx';
import { descargarPlantillaExcelSaldosNomina } from '../utils/excelTemplateUtils';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Search,
  Trash2,
  Eye,
  RefreshCw,
  Plus,
  ArrowRight,
  Database,
  ShieldCheck,
  Building2,
  DollarSign,
  Palmtree,
  Receipt,
  FileText,
  Printer,
  Copy,
  Check,
  CreditCard,
  UserCheck,
  UserX,
  ExternalLink,
  Info,
  Calendar,
  Layers,
  PenTool
} from 'lucide-react';
import { CodigoQRVerificacion } from './CodigoQRVerificacion';
import { FirmaDigitalStamp } from './FirmaDigitalStamp';
import { HerramientaFirmaDigitalModal, DatosFirmaDigital } from './HerramientaFirmaDigitalModal';
import { registrarCertificadoEmitido, generarHashIntegridadDocumento } from '../services/verificacionCertificadosService';

interface SaldosInicialesViewProps {
  empleados: Empleado[];
  cargos: Cargo[];
  userRole?: Role;
  currentUser?: UsuarioSistema | null;
  empresa?: ConfiguracionEmpresa;
  onNavigate?: (view: string) => void;
  isSuperAdmin?: boolean;
}

export const SaldosInicialesView: React.FC<SaldosInicialesViewProps> = ({
  empleados,
  cargos,
  userRole = 'admin',
  currentUser,
  empresa,
  onNavigate,
  isSuperAdmin = false
}) => {
  // Tabs principales del módulo
  const [tabActiva, setTabActiva] = useState<'carga' | 'listado' | 'normativa'>('carga');

  // Estado de saldos almacenados
  const [saldosGuardados, setSaldosGuardados] = useState<SaldoInicialEmpleadoNomina[]>(() => {
    return obtenerSaldosInicialesLocal();
  });
  const [cargandoNube, setCargandoNube] = useState(false);
  const [guardandoLote, setGuardandoLote] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Estado del flujo de carga masiva
  const [textoPegado, setTextoPegado] = useState('');
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [resultadoParseo, setResultadoParseo] = useState<ResultadoParseoSaldos | null>(null);
  const [modoVisualizacion, setModoVisualizacion] = useState<'todos' | 'validos' | 'con_advertencia' | 'con_error'>('todos');
  const [filtroVistaPrevia, setFiltroVistaPrevia] = useState('');

  // Opciones de impacto contable
  const [impactarNomina, setImpactarNomina] = useState(true);
  const [impactarVacaciones, setImpactarVacaciones] = useState(true);
  const [impactarExpedientes, setImpactarExpedientes] = useState(true);
  const [guardarEnFirestore, setGuardarEnFirestore] = useState(true);

  // Búsqueda y filtrado en lista de saldos registrados
  const [busquedaRegistrados, setBusquedaRegistrados] = useState('');
  const [filtroVinculado, setFiltroVinculado] = useState<'TODOS' | 'VINCULADOS' | 'NO_VINCULADOS'>('TODOS');

  // Modales
  const [saldoSeleccionadoDetalle, setSaldoSeleccionadoDetalle] = useState<SaldoInicialEmpleadoNomina | null>(null);
  const [saldoParaCertificado, setSaldoParaCertificado] = useState<SaldoInicialEmpleadoNomina | null>(null);
  const [modalNuevoManualOpen, setModalNuevoManualOpen] = useState(false);
  const [modalConfirmarLimpiarTodo, setModalConfirmarLimpiarTodo] = useState(false);

  // Estados de Firma Digital y QR en Certificado de Saldos
  const [modalFirmaCertificadoOpen, setModalFirmaCertificadoOpen] = useState(false);
  const [tipoFirmanteCertificado, setTipoFirmanteCertificado] = useState<'emisor' | 'colaborador'>('emisor');
  const [firmaCertificadoEmisor, setFirmaCertificadoEmisor] = useState<DatosFirmaDigital | null>(null);
  const [firmaCertificadoColaborador, setFirmaCertificadoColaborador] = useState<DatosFirmaDigital | null>(null);

  // Copiado temporal en portapapeles
  const [copiadoPlantilla, setCopiadoPlantilla] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar saldos desde Firestore al montar
  useEffect(() => {
    let montado = true;
    const cargarDesdeFB = async () => {
      try {
        const saldosFB = await obtenerSaldosInicialesFB();
        if (montado && saldosFB && saldosFB.length > 0) {
          // Fusionar con los locales
          const combinados = agregarOActualizarSaldosLocal(saldosFB);
          setSaldosGuardados(combinados);
        }
      } catch (err) {
        console.warn('Fallback a almacenamiento local para saldos iniciales:', err);
      }
    };
    cargarDesdeFB();
    return () => {
      montado = false;
    };
  }, []);

  // Limpieza automática de mensajes de notificación
  useEffect(() => {
    if (mensajeExito) {
      const timer = setTimeout(() => setMensajeExito(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [mensajeExito]);

  useEffect(() => {
    if (mensajeError) {
      const timer = setTimeout(() => setMensajeError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [mensajeError]);

  // Mapa rápido de colaboradores para cruces
  const mapaEmpleadosPorDoc = useMemo(() => {
    const mapa = new Map<string, Empleado>();
    empleados.forEach(emp => {
      const doc = (emp.documento || '').replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
      if (doc) mapa.set(doc, emp);
    });
    return mapa;
  }, [empleados]);

  // Métricas Consolidadas de los saldos guardados
  const metricas = useMemo(() => {
    const total = saldosGuardados.length;
    let vinculados = 0;
    let pasivosCOP = 0;
    let diasVac = 0;
    let totalProvisionMensualVacCOP = 0;
    let totalProvisionMensualPrestacionesCOP = 0;
    let carteraCOP = 0;
    let ingresosAnoCOP = 0;

    saldosGuardados.forEach(s => {
      if (s.empleadoId || mapaEmpleadosPorDoc.has(s.documento.replace(/[^0-9a-zA-Z]/g, '').toLowerCase())) {
        vinculados++;
      }
      const desglose = calcularPasivosLaboralesCompletos(s);
      pasivosCOP += desglose.totalPasivosAcumuladosCOP;
      totalProvisionMensualVacCOP += desglose.provisionMensualVacaciones;
      totalProvisionMensualPrestacionesCOP += desglose.totalProvisionMensualCOP;
      diasVac += s.vacacionesDiasPendientes || 0;
      carteraCOP += (s.prestamoEmpresaSaldoCOP || 0) +
                    (s.libranzaSaldoCOP || 0) +
                    (s.embargoJudicialSaldoCOP || 0);
      ingresosAnoCOP += s.ingresosLaboralesAcumuladosAnoCOP || 0;
    });

    return {
      total,
      vinculados,
      noVinculados: total - vinculados,
      pasivosCOP,
      totalProvisionMensualVacCOP,
      totalProvisionMensualPrestacionesCOP,
      diasVac,
      carteraCOP,
      ingresosAnoCOP
    };
  }, [saldosGuardados, mapaEmpleadosPorDoc]);

  // Manejador de descarga de plantilla Excel oficial
  const handleDescargarPlantilla = () => {
    descargarPlantillaExcelSaldosNomina();
  };

  // Manejador de carga de archivo (Excel o CSV)
  const handleSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setNombreArchivo(file.name);
    const esExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (esExcel) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const buffer = event.target?.result as ArrayBuffer;
          const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
          const sheet = wb.Sheets[wb.SheetNames[0]];
          const csv = XLSX.utils.sheet_to_csv(sheet);
          setTextoPegado(csv);
          procesarTexto(csv);
        } catch (err) {
          console.error('Error parseando excel de saldos:', err);
          setMensajeError('No se pudo leer el archivo Excel de saldos iniciales.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const contenido = event.target?.result as string;
        setTextoPegado(contenido);
        procesarTexto(contenido);
      };
      reader.readAsText(file, 'UTF-8');
    }
  };

  // Procesar texto CSV / Clipboard
  const procesarTexto = (contenido: string) => {
    if (!contenido.trim()) {
      setResultadoParseo(null);
      return;
    }
    const res = parsearTextoCsvOClipboard(contenido, empleados);
    setResultadoParseo(res);
  };

  // Cargar dataset de prueba colombiana
  const handleCargarLotePrueba = () => {
    const saldosPrueba = generarLotePruebaSaldos(empleados);
    const encabezados = ENCABEZADOS_CSV_SALDOS.join(',');
    const filasCsv = saldosPrueba.map(s => [
      s.documento,
      s.nombreCompleto,
      s.cargoNombre || '',
      s.fechaIngreso || '2024-01-15',
      s.fechaCorteSaldos,
      s.vacacionesDiasPendientes,
      s.vacacionesValorAcumuladoCOP,
      s.cesantiasSaldoAcumuladoCOP,
      s.interesesCesantiasAcumuladoCOP,
      s.primaServiciosBaseSemestreCOP,
      s.diasTrabajadosSemestrePrima,
      s.ingresosLaboralesAcumuladosAnoCOP,
      s.saludAportesAcumuladosAnoCOP,
      s.pensionAportesAcumuladosAnoCOP,
      s.fspAportesAcumuladosAnoCOP,
      s.retencionFuenteAcumuladaAnoCOP,
      s.cesantiasPagadasAnoCOP,
      s.prestamoEmpresaSaldoCOP,
      s.prestamoEmpresaCuotaMensualCOP,
      s.libranzaSaldoCOP,
      s.libranzaCuotaMensualCOP,
      s.embargoJudicialSaldoCOP,
      s.otrasDeduccionesFijasMensualCOP,
      s.observaciones || ''
    ].join(','));

    const csvGenerado = [encabezados, ...filasCsv].join('\r\n');
    setTextoPegado(csvGenerado);
    setNombreArchivo('Lote_Prueba_Demo_Colombia_2026.csv');
    procesarTexto(csvGenerado);
  };

  // Aplicar e impactar saldos en todo el sistema
  const handleConfirmarYAplicar = async () => {
    if (!resultadoParseo || resultadoParseo.items.length === 0) {
      setMensajeError('No hay registros válidos para cargar.');
      return;
    }

    setGuardandoLote(true);
    setMensajeError(null);
    setMensajeExito(null);

    try {
      const itemsParaGuardar = resultadoParseo.items.map(item => ({
        ...item,
        aplicadoEnNomina: impactarNomina,
        aplicadoEnVacaciones: impactarVacaciones,
        creadoPor: currentUser?.nombre || 'Administrador GH',
        fechaRegistro: new Date().toISOString()
      }));

      // 1. Guardar localmente
      const actualizados = agregarOActualizarSaldosLocal(itemsParaGuardar);
      setSaldosGuardados(actualizados);

      // 2. Impactar en Vacaciones si está marcado
      if (impactarVacaciones && typeof window !== 'undefined') {
        try {
          const rawVac = localStorage.getItem('bgroup_vacaciones_controles');
          let controles: ControlVacacionesEmpleado[] = rawVac ? JSON.parse(rawVac) : [];
          if (!Array.isArray(controles)) controles = [];

          const mapaControles = new Map<string, ControlVacacionesEmpleado>();
          controles.forEach(c => mapaControles.set(c.empleadoId, c));

          itemsParaGuardar.forEach(item => {
            const emp = item.empleadoId ? empleados.find(e => e.id === item.empleadoId) : mapaEmpleadosPorDoc.get(item.documento.replace(/[^0-9a-zA-Z]/g, '').toLowerCase());
            if (emp) {
              const existente = mapaControles.get(emp.id);
              const diasPend = item.vacacionesDiasPendientes;
              const diasCausados = (existente?.diasVacacionesCausados || diasPend) > diasPend ? (existente?.diasVacacionesCausados || diasPend) : diasPend;
              const diasDisfrutados = Math.max(0, diasCausados - diasPend);

              const nuevoControl: ControlVacacionesEmpleado = {
                empleadoId: emp.id,
                empleadoNombre: emp.nombre,
                documento: emp.documento,
                cargoNombre: emp.laboral?.cargoNombre || emp.cargoId || 'Colaborador',
                fechaIngreso: item.fechaIngreso || emp.laboral?.fechaIngreso || emp.contrato?.inicio || '2024-01-01',
                diasLaboradosTotal: existente?.diasLaboradosTotal || Math.round((diasCausados * 360) / 15),
                diasVacacionesCausados: diasCausados,
                diasDisfrutadosAcumulados: diasDisfrutados,
                diasEnSolicitud: existente?.diasEnSolicitud || 0,
                diasPendientesDisfrute: diasPend,
                periodosAcumulados: Math.round((diasPend / 15) * 100) / 100,
                estadoAlerta: diasPend >= 30 ? 'Crítico (≥ 2 periodos)' : diasPend >= 15 ? '1 periodo' : 'Al día',
                provisionAcumuladaCOP: item.vacacionesValorAcumuladoCOP,
                ultimoPeriodoDisfrutado: 'Corte Inicial'
              };
              mapaControles.set(emp.id, nuevoControl);
            }
          });

          localStorage.setItem('bgroup_vacaciones_controles', JSON.stringify(Array.from(mapaControles.values())));
        } catch (e) {
          console.error('Error aplicando saldos en control de vacaciones:', e);
        }
      }

      // 3. Impactar Novedades de Nómina si está marcado (Deducciones de préstamos y libranzas)
      if (impactarNomina && typeof window !== 'undefined') {
        try {
          const novedadesGeneradas = generarNovedadesDesdeSaldosIniciales(itemsParaGuardar);
          const rawNov = localStorage.getItem('bgroup_novedades_por_periodo');
          let novedadesPorPeriodo: Record<string, Record<string, NovedadNominaEmpleado>> = rawNov ? JSON.parse(rawNov) : {};
          if (!novedadesPorPeriodo || typeof novedadesPorPeriodo !== 'object') novedadesPorPeriodo = {};

          // Inyectar en el período activo o actual (ej. 2026-03)
          const periodoCodigo = '2026-03';
          if (!novedadesPorPeriodo[periodoCodigo]) novedadesPorPeriodo[periodoCodigo] = {};

          Object.entries(novedadesGeneradas).forEach(([empId, novParcial]) => {
            const novActual: NovedadNominaEmpleado = novedadesPorPeriodo[periodoCodigo][empId] || {
              diasTrabajados: 30,
              horasExtrasDiurnas: 0,
              horasExtrasNocturnas: 0,
              horasFestivasDiurnas: 0,
              horasFestivasNocturnas: 0,
              recargoNocturnoOrdinario: 0,
              comisiones: 0,
              bonificacionesSalariales: 0,
              bonificacionesNoSalariales: 0,
              incapacidadDias: 0,
              licenciaRemuneradaDias: 0,
              prestamosYDeducciones: 0,
              otrasDeduccionesTexto: ''
            };

            novedadesPorPeriodo[periodoCodigo][empId] = {
              ...novActual,
              prestamosYDeducciones: (novActual.prestamosYDeducciones || 0) + (novParcial.prestamosYDeducciones || 0),
              otrasDeduccionesTexto: [novActual.otrasDeduccionesTexto, novParcial.otrasDeduccionesTexto].filter(Boolean).join(' | ')
            };
          });

          localStorage.setItem('bgroup_novedades_por_periodo', JSON.stringify(novedadesPorPeriodo));
        } catch (e) {
          console.error('Error inyectando novedades de deducción en nómina:', e);
        }
      }

      // 4. Sincronizar e Impactar Censo de Empleados si está marcado
      if (impactarExpedientes && typeof window !== 'undefined') {
        try {
          const resSync = sincronizarOSincronizarYCrearEmpleadosDesdeSaldos(itemsParaGuardar, empleados, cargos);
          localStorage.setItem('bgroup_empleados', JSON.stringify(resSync.empleadosActualizados));
          window.dispatchEvent(new Event('bgroup_empleados_updated'));
        } catch (e) {
          console.error('Error sincronizando censo de empleados:', e);
        }
      }

      // 5. Guardar en Firestore si está marcado
      if (guardarEnFirestore) {
        await guardarSaldosInicialesLoteFB(itemsParaGuardar);
      }

      // 6. Registrar evento de auditoría
      await registrarEventoAuditoria(
        'CARGA_MASIVA_SALDOS',
        'saldos_iniciales',
        `Carga e integración masiva exitosa de saldos iniciales para ${itemsParaGuardar.length} colaborador(es).`,
        currentUser || null,
        `lote-${Date.now()}`,
        {
          cantidad: itemsParaGuardar.length,
          impactoNomina: impactarNomina,
          impactoVacaciones: impactarVacaciones,
          pasivosTotales: resultadoParseo.resumen.totalPasivosCOP
        }
      );

      setMensajeExito(`¡Operación exitosa! Se procesaron y consolidaron los saldos iniciales de ${itemsParaGuardar.length} colaborador(es). Se crearon/actualizaron las fichas en el Módulo de Empleados, pasivos y novedades de nómina.`);
      setTextoPegado('');
      setNombreArchivo(null);
      setResultadoParseo(null);
      setTabActiva('listado');
    } catch (err: any) {
      console.error('Error al aplicar saldos iniciales:', err);
      setMensajeError(err?.message || 'Ocurrió un error al persistir los saldos iniciales.');
    } finally {
      setGuardandoLote(false);
    }
  };

  // Sincronizar todos los saldos registrados con el censo del módulo de empleados
  const handleSincronizarCensoDirecto = () => {
    if (saldosGuardados.length === 0) {
      setMensajeError('No hay saldos registrados para sincronizar.');
      return;
    }
    try {
      const resSync = sincronizarOSincronizarYCrearEmpleadosDesdeSaldos(saldosGuardados, empleados, cargos);
      if (typeof window !== 'undefined') {
        localStorage.setItem('bgroup_empleados', JSON.stringify(resSync.empleadosActualizados));
        window.dispatchEvent(new Event('bgroup_empleados_updated'));
      }
      setMensajeExito(`¡Sincronización con Módulo de Empleados exitosa! ${resSync.creadosContador} colaborador(es) nuevos creados en el Censo y ${resSync.actualizadosContador} actualizados.`);
    } catch (err) {
      console.error('Error al sincronizar censo:', err);
      setMensajeError('Ocurrió un error al sincronizar con el censo de empleados.');
    }
  };

  // Eliminar saldo individual
  const handleEliminarSaldo = async (id: string, nombre: string) => {
    if (!window.confirm(`¿Está seguro de eliminar el registro de saldos iniciales de "${nombre}"?`)) {
      return;
    }
    try {
      const restantes = eliminarSaldoInicialLocal(id);
      setSaldosGuardados(restantes);
      await eliminarSaldoInicialFB(id);
      await registrarEventoAuditoria(
        'ELIMINAR_SALDO_INICIAL',
        'saldos_iniciales',
        `Eliminación del registro de saldo inicial ID: ${id} (${nombre})`,
        currentUser || null,
        id
      );
      setMensajeExito(`Registro de saldo de "${nombre}" eliminado correctamente.`);
    } catch (err) {
      console.error('Error eliminando saldo inicial:', err);
      setMensajeError('No se pudo eliminar el registro seleccionado.');
    }
  };

  // Limpiar todos los saldos registrados
  const handleLimpiarTodosSaldos = async () => {
    try {
      limpiarTodosSaldosInicialesLocal();
      setSaldosGuardados([]);
      setModalConfirmarLimpiarTodo(false);
      await registrarEventoAuditoria(
        'LIMPIEZA_TOTAL_SALDOS',
        'saldos_iniciales',
        'Limpieza total del repositorio local de saldos iniciales de nómina.',
        currentUser || null,
        'todos'
      );
      setMensajeExito('Se han restablecido los saldos iniciales.');
    } catch (err) {
      console.error('Error limpiando saldos:', err);
      setMensajeError('Error al restablecer saldos iniciales.');
    }
  };

  // Exportar saldos registrados a CSV
  const handleExportarSaldosRegistrados = () => {
    if (saldosGuardados.length === 0) return;
    const encabezados = ENCABEZADOS_CSV_SALDOS.join(';');
    const filas = saldosGuardados.map(s => [
      `"${s.documento}"`,
      `"${s.nombreCompleto}"`,
      `"${s.cargoNombre || ''}"`,
      `"${s.fechaIngreso || ''}"`,
      `"${s.fechaCorteSaldos}"`,
      s.vacacionesDiasPendientes,
      s.vacacionesValorAcumuladoCOP,
      s.cesantiasSaldoAcumuladoCOP,
      s.interesesCesantiasAcumuladoCOP,
      s.primaServiciosBaseSemestreCOP,
      s.diasTrabajadosSemestrePrima,
      s.ingresosLaboralesAcumuladosAnoCOP,
      s.saludAportesAcumuladosAnoCOP,
      s.pensionAportesAcumuladosAnoCOP,
      s.fspAportesAcumuladosAnoCOP,
      s.retencionFuenteAcumuladaAnoCOP,
      s.cesantiasPagadasAnoCOP,
      s.prestamoEmpresaSaldoCOP,
      s.prestamoEmpresaCuotaMensualCOP,
      s.libranzaSaldoCOP,
      s.libranzaCuotaMensualCOP,
      s.embargoJudicialSaldoCOP,
      s.otrasDeduccionesFijasMensualCOP,
      `"${(s.observaciones || '').replace(/"/g, '""')}"`
    ].join(';'));

    const csvContent = '\uFEFF' + [encabezados, ...filas].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Consolidado_Saldos_Iniciales_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filtrado de la vista previa de validación
  const itemsVistaPreviaFiltrados = useMemo(() => {
    if (!resultadoParseo) return [];
    return resultadoParseo.items.filter(item => {
      if (filtroVistaPrevia.trim()) {
        const query = filtroVistaPrevia.toLowerCase();
        const match = item.documento.toLowerCase().includes(query) ||
                      item.nombreCompleto.toLowerCase().includes(query) ||
                      (item.cargoNombre || '').toLowerCase().includes(query);
        if (!match) return false;
      }
      return true;
    });
  }, [resultadoParseo, filtroVistaPrevia]);

  // Filtrado de saldos registrados en tabla
  const saldosRegistradosFiltrados = useMemo(() => {
    return saldosGuardados.filter(s => {
      const estaVinculado = Boolean(s.empleadoId || mapaEmpleadosPorDoc.has(s.documento.replace(/[^0-9a-zA-Z]/g, '').toLowerCase()));
      if (filtroVinculado === 'VINCULADOS' && !estaVinculado) return false;
      if (filtroVinculado === 'NO_VINCULADOS' && estaVinculado) return false;

      if (busquedaRegistrados.trim()) {
        const query = busquedaRegistrados.toLowerCase();
        const match = s.documento.toLowerCase().includes(query) ||
                      s.nombreCompleto.toLowerCase().includes(query) ||
                      (s.cargoNombre || '').toLowerCase().includes(query);
        if (!match) return false;
      }
      return true;
    });
  }, [saldosGuardados, filtroVinculado, busquedaRegistrados, mapaEmpleadosPorDoc]);

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#8FA7D6]">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#18235C] text-white tracking-wide">
              FINANZAS & GH
            </span>
            <span className="text-xs text-slate-500 font-medium">Corte de Pasivos Laborales y Novedades</span>
          </div>
          <h1 className="font-extrabold text-2xl sm:text-3xl text-[#18235C] tracking-tight mt-1 flex items-center gap-2.5">
            <Database className="w-8 h-8 text-[#18235C]" />
            <span>Carga Masiva de Saldos Iniciales</span>
          </h1>
          <p className="text-xs text-[#282829] mt-1 max-w-3xl">
            Módulo unificado para migración y empalme histórico de nómina y expedientes laborales. Registra días de vacaciones pendientes (Art. 186 CST), pasivos acumulados de cesantías e intereses, prima de servicios, acumulados tributarios DIAN (Frm 220) y cartera activa de préstamos/libranzas.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleDescargarPlantilla}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Descargar libro oficial Microsoft Excel (.xlsx) estructurado con columnas y ejemplos"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Descargar Plantilla Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={handleCargarLotePrueba}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Cargar un lote de prueba con colaboradores del censo"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Cargar Lote de Prueba</span>
          </button>

          <button
            type="button"
            onClick={handleSincronizarCensoDirecto}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Sincronizar todos los saldos iniciales con el Módulo de Empleados (crea/actualiza fichas automáticamente)"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-700" />
            <span>Sincronizar Censo Empleados</span>
          </button>

          <button
            type="button"
            onClick={() => setModalNuevoManualOpen(true)}
            className="px-3.5 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-extrabold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#8FA7D6]" />
            <span>Nuevo Saldo Individual</span>
          </button>
        </div>
      </div>

      {/* Alertas de Notificación */}
      {mensajeExito && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-medium flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
          <button onClick={() => setMensajeExito(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">×</button>
        </div>
      )}

      {mensajeError && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 text-xs font-medium flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{mensajeError}</span>
          </div>
          <button onClick={() => setMensajeError(null)} className="text-rose-700 hover:text-rose-900 font-bold">×</button>
        </div>
      )}

      {/* KPI Cards de Pasivos y Cartera */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-[#8FA7D6] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Colaboradores</span>
            <UserCheck className="w-4 h-4 text-[#18235C]" />
          </div>
          <div className="text-2xl font-black text-[#18235C]">{metricas.total}</div>
          <div className="text-[10px] text-emerald-700 font-medium">
            {metricas.vinculados} vinculados ({metricas.noVinculados} ref.)
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#8FA7D6] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Pasivos Prestacionales</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-black text-emerald-800">
            ${metricas.pasivosCOP.toLocaleString('es-CO')}
          </div>
          <span className="text-[10px] text-slate-400">Cesantías + Int + Prima + Vac</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#8FA7D6] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Provisión Vacaciones</span>
            <Palmtree className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-black text-amber-700">
            ${metricas.totalProvisionMensualVacCOP.toLocaleString('es-CO')}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">4.17% mensual s/básico CST</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#8FA7D6] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Vacaciones Pendientes</span>
            <Calendar className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700">
            {metricas.diasVac.toFixed(1)} <span className="text-xs font-semibold text-slate-500">días</span>
          </div>
          <span className="text-[10px] text-slate-400">Art. 186 CST histórico</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#8FA7D6] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Cartera Activa Préstamos</span>
            <CreditCard className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg font-black text-indigo-800">
            ${metricas.carteraCOP.toLocaleString('es-CO')}
          </div>
          <span className="text-[10px] text-slate-400">Préstamos + Libranzas</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-[#8FA7D6] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold">Carga Mensual Prestaciones</span>
            <Receipt className="w-4 h-4 text-[#18235C]" />
          </div>
          <div className="text-lg font-black text-[#18235C]">
            ${metricas.totalProvisionMensualPrestacionesCOP.toLocaleString('es-CO')}
          </div>
          <span className="text-[10px] text-slate-400">21.83% mensual (Ley CST)</span>
        </div>
      </div>

      {/* Navegación por Pestañas */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          type="button"
          onClick={() => setTabActiva('carga')}
          className={`px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            tabActiva === 'carga'
              ? 'border-[#18235C] text-[#18235C] bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-4 h-4 text-[#8FA7D6]" />
          <span>Carga Masiva & Validación</span>
          {resultadoParseo && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-[#18235C] text-white">
              {resultadoParseo.items.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('listado')}
          className={`px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            tabActiva === 'listado'
              ? 'border-[#18235C] text-[#18235C] bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-4 h-4 text-[#8FA7D6]" />
          <span>Saldos Registrados en el Sistema</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
            {saldosGuardados.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTabActiva('normativa')}
          className={`px-4 py-2.5 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            tabActiva === 'normativa'
              ? 'border-[#18235C] text-[#18235C] bg-white'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-[#8FA7D6]" />
          <span>Guía de Empalme & Marco Legal</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: CARGA MASIVA Y VALIDACIÓN INTERACTIVA */}
      {/* ========================================================= */}
      {tabActiva === 'carga' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel de Entrada: Archivo o Copiar-Pegar */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-[#8FA7D6] shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#18235C]" />
                  <h3 className="font-extrabold text-sm text-[#18235C]">
                    1. Importación por Archivo o Copiar-Pegar de Excel
                  </h3>
                </div>
                {nombreArchivo && (
                  <span className="text-[11px] font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                    {nombreArchivo}
                  </span>
                )}
              </div>

              {/* Zona Drag & Drop / File Input */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#8FA7D6] hover:border-emerald-600 bg-slate-50/60 hover:bg-emerald-50/20 rounded-xl p-6 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.txt,.tsv"
                  onChange={handleSeleccionarArchivo}
                  className="hidden"
                />
                <FileSpreadsheet className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-[#18235C]">
                  Haz clic aquí para seleccionar tu archivo Excel (.xlsx / .xls) o CSV
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Formatos admitidos: Microsoft Excel (.xlsx, .xls) o archivo plano .csv (separado por coma o punto y coma)
                </p>
              </div>

              {/* O bien, Pegar directamente desde Excel */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-700">
                    O pega aquí directamente las celdas copiadas de tu hoja de cálculo:
                  </label>
                  {textoPegado && (
                    <button
                      type="button"
                      onClick={() => {
                        setTextoPegado('');
                        setNombreArchivo(null);
                        setResultadoParseo(null);
                      }}
                      className="text-[11px] text-rose-600 hover:text-rose-800 font-bold"
                    >
                      Limpiar contenido
                    </button>
                  )}
                </div>
                <textarea
                  value={textoPegado}
                  onChange={(e) => {
                    setTextoPegado(e.target.value);
                    procesarTexto(e.target.value);
                  }}
                  placeholder="Pega aquí las filas copiadas desde Excel (Ctrl+V). Detectamos automáticamente columnas separadas por tabulación o comas..."
                  rows={4}
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#18235C] focus:border-[#18235C] resize-y"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  {textoPegado ? `${textoPegado.split(/\r?\n/).filter(Boolean).length} línea(s) detectada(s)` : 'Esperando datos para procesar'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => procesarTexto(textoPegado)}
                    disabled={!textoPegado.trim()}
                    className="px-3.5 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white font-bold rounded-lg disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    Revalidar Datos
                  </button>
                </div>
              </div>
            </div>

            {/* Panel Lateral: Parámetros de Impacto e Integración */}
            <div className="bg-white rounded-xl border border-[#8FA7D6] shadow-2xs p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-extrabold text-sm text-[#18235C]">
                    2. Opciones de Impacto Contable
                  </h3>
                </div>

                <p className="text-xs text-slate-600 mb-4">
                  Selecciona cómo afectará este corte de saldos iniciales a los diferentes módulos operativos:
                </p>

                <div className="space-y-3">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={impactarNomina}
                      onChange={(e) => setImpactarNomina(e.target.checked)}
                      className="mt-0.5 rounded text-[#18235C] focus:ring-[#18235C]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Impactar Novedades de Nómina
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Crea deducciones automáticas por cuotas de préstamos, libranzas y embargos para el período activo.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={impactarVacaciones}
                      onChange={(e) => setImpactarVacaciones(e.target.checked)}
                      className="mt-0.5 rounded text-[#18235C] focus:ring-[#18235C]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Impactar Control de Vacaciones (Art. 186 CST)
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Actualiza la matriz de días causados, pendientes y provisión monetaria acumulada en talento humano.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={impactarExpedientes}
                      onChange={(e) => setImpactarExpedientes(e.target.checked)}
                      className="mt-0.5 rounded text-[#18235C] focus:ring-[#18235C]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Vincular a Expedientes Digitales
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Guarda los pasivos y acumulados históricos en el perfil 360° de cada colaborador del censo.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={guardarEnFirestore}
                      onChange={(e) => setGuardarEnFirestore(e.target.checked)}
                      className="mt-0.5 rounded text-[#18235C] focus:ring-[#18235C]"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Sincronizar en Firestore & Auditoría
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Persiste en la nube de Firebase y emite registro inmutable en el Libro Mayor de Auditoría.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Botón de Confirmación Principal */}
              <div className="pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleConfirmarYAplicar}
                  disabled={!resultadoParseo || resultadoParseo.items.length === 0 || guardandoLote}
                  className="w-full py-3 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className={`w-4 h-4 text-emerald-400 ${guardandoLote ? 'animate-spin' : ''}`} />
                  <span>
                    {guardandoLote
                      ? 'Procesando e impactando...'
                      : `Confirmar e Integrar (${resultadoParseo?.items.length || 0} Registros)`}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Grilla de Validación y Previsualización */}
          {resultadoParseo && (
            <div className="bg-white rounded-xl border border-[#8FA7D6] shadow-2xs p-5 space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <h3 className="font-extrabold text-sm text-[#18235C] flex items-center gap-2">
                    <span>3. Matriz de Validación y Auditoría Previa</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      {resultadoParseo.resumen.validas} Válidos
                    </span>
                    {resultadoParseo.advertencias.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        {resultadoParseo.advertencias.length} Advertencias
                      </span>
                    )}
                    {resultadoParseo.errores.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                        {resultadoParseo.errores.length} Errores
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Verifica la coherencia de los pasivos y cruce con el censo de colaboradores antes de aplicar el lote.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar por cédula o nombre..."
                      value={filtroVistaPrevia}
                      onChange={(e) => setFiltroVistaPrevia(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#18235C]"
                    />
                  </div>
                </div>
              </div>

              {/* Errores Críticos si los hay */}
              {resultadoParseo.errores.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-1">
                  <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <span>Se detectaron {resultadoParseo.errores.length} error(es) en las filas del archivo:</span>
                  </div>
                  <ul className="text-[11px] text-rose-700 list-disc list-inside space-y-0.5">
                    {resultadoParseo.errores.slice(0, 5).map((err, idx) => (
                      <li key={idx}>
                        Fila {err.fila} ({err.columna}): {err.mensaje} {err.valor && `(Valor: "${err.valor}")`}
                      </li>
                    ))}
                    {resultadoParseo.errores.length > 5 && (
                      <li>...y {resultadoParseo.errores.length - 5} error(es) adicional(es).</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Tabla de Previsualización */}
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#101740] text-white text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Colaborador / Documento</th>
                      <th className="py-2.5 px-3">Cruce Censo</th>
                      <th className="py-2.5 px-3 text-right">Vacaciones (Días / Pasivo)</th>
                      <th className="py-2.5 px-3 text-right">Provisión Vac (4.17%)</th>
                      <th className="py-2.5 px-3 text-right">Cesantías + Int ($)</th>
                      <th className="py-2.5 px-3 text-right">Prima Serv ($)</th>
                      <th className="py-2.5 px-3 text-right">Total Pasivos COP</th>
                      <th className="py-2.5 px-3 text-center">Corte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                    {itemsVistaPreviaFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-500 font-sans">
                          No se encontraron registros que coincidan con la búsqueda.
                        </td>
                      </tr>
                    ) : (
                      itemsVistaPreviaFiltrados.map((item, idx) => {
                        const empVinculado = item.empleadoId ? empleados.find(e => e.id === item.empleadoId) : mapaEmpleadosPorDoc.get(item.documento.replace(/[^0-9a-zA-Z]/g, '').toLowerCase());
                        const desglose = calcularPasivosLaboralesCompletos(item);
                        const cesTotal = item.cesantiasSaldoAcumuladoCOP + item.interesesCesantiasAcumuladoCOP;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2 px-3 font-sans">
                              <div className="font-bold text-slate-900">{item.nombreCompleto}</div>
                              <div className="text-[10px] text-slate-500 font-mono">C.C. {item.documento} · {item.cargoNombre}</div>
                            </td>
                            <td className="py-2 px-3 font-sans">
                              {empVinculado ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>Vinculado</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200" title="No figura en el censo activo; se guardará como saldo referencial">
                                  <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                  <span>Referencial</span>
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span className="font-bold text-amber-700">{item.vacacionesDiasPendientes} d</span>
                              <div className="text-[10px] text-slate-500">${item.vacacionesValorAcumuladoCOP.toLocaleString('es-CO')}</div>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span className="font-bold text-emerald-700">
                                ${(item.provisionMensualVacacionesCOP || desglose.provisionMensualVacaciones).toLocaleString('es-CO')}
                              </span>
                              <div className="text-[10px] text-slate-400">4.17% s/básico</div>
                            </td>
                            <td className="py-2 px-3 text-right">
                              <span className="font-bold text-slate-800">${cesTotal.toLocaleString('es-CO')}</span>
                              <div className="text-[10px] text-slate-500">Int: ${item.interesesCesantiasAcumuladoCOP.toLocaleString('es-CO')}</div>
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-800">
                              ${(item.primaServiciosValorAcumuladoCOP || desglose.pasivoPrimaAcumulado).toLocaleString('es-CO')}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-indigo-900">
                              ${desglose.totalPasivosAcumuladosCOP.toLocaleString('es-CO')}
                            </td>
                            <td className="py-2 px-3 text-center text-slate-500 font-sans text-[10px]">
                              {item.fechaCorteSaldos}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: SALDOS REGISTRADOS EN EL SISTEMA */}
      {/* ========================================================= */}
      {tabActiva === 'listado' && (
        <div className="bg-white rounded-xl border border-[#8FA7D6] shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-extrabold text-base text-[#18235C] flex items-center gap-2">
                <Database className="w-5 h-5 text-[#18235C]" />
                <span>Historial de Saldos Iniciales Registrados</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                  {saldosGuardados.length} en base de datos
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cortes contables oficiales que alimentan el devengo de prestaciones y nómina activa.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleExportarSaldosRegistrados}
                disabled={saldosGuardados.length === 0}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-[#18235C] border border-[#8FA7D6] text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-[#18235C]" />
                <span>Exportar Consolidado CSV</span>
              </button>

              {saldosGuardados.length > 0 && (
                <button
                  type="button"
                  onClick={() => setModalConfirmarLimpiarTodo(true)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Restablecer Todo</span>
                </button>
              )}
            </div>
          </div>

          {/* Filtros de la Tabla */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar por cédula, nombre o cargo..."
                  value={busquedaRegistrados}
                  onChange={(e) => setBusquedaRegistrados(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#18235C]"
                />
              </div>

              <select
                value={filtroVinculado}
                onChange={(e) => setFiltroVinculado(e.target.value as any)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white"
              >
                <option value="TODOS">Todos los colaboradores</option>
                <option value="VINCULADOS">Solo vinculados al censo</option>
                <option value="NO_VINCULADOS">Solo referenciales</option>
              </select>
            </div>

            <span className="text-xs text-slate-500 font-medium">
              Mostrando {saldosRegistradosFiltrados.length} de {saldosGuardados.length} registros
            </span>
          </div>

          {/* Tabla de Saldos Registrados */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#18235C] text-white text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Colaborador / Cédula</th>
                  <th className="py-2.5 px-3">Cargo / Fecha Ingreso</th>
                  <th className="py-2.5 px-3 text-right">Vacaciones Pendientes</th>
                  <th className="py-2.5 px-3 text-right">Provisión Vac (4.17%)</th>
                  <th className="py-2.5 px-3 text-right">Cesantías + Int ($)</th>
                  <th className="py-2.5 px-3 text-right">Prima Serv ($)</th>
                  <th className="py-2.5 px-3 text-right">Total Pasivos COP</th>
                  <th className="py-2.5 px-3 text-center">Fecha Corte</th>
                  <th className="py-2.5 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {saldosRegistradosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <Database className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700">No hay saldos iniciales registrados</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Utiliza la pestaña "Carga Masiva" para subir tu archivo CSV o pulsa "Cargar Lote de Prueba".
                      </p>
                    </td>
                  </tr>
                ) : (
                  saldosRegistradosFiltrados.map((item) => {
                    const empVinculado = item.empleadoId ? empleados.find(e => e.id === item.empleadoId) : mapaEmpleadosPorDoc.get(item.documento.replace(/[^0-9a-zA-Z]/g, '').toLowerCase());
                    const desglose = calcularPasivosLaboralesCompletos(item);
                    const cesTotal = item.cesantiasSaldoAcumuladoCOP + item.interesesCesantiasAcumuladoCOP;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{item.nombreCompleto}</div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>C.C. {item.documento}</span>
                            {empVinculado ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Censo
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                                Ref
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-slate-600">
                          <div>{item.cargoNombre || 'Colaborador'}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Ingreso: {item.fechaIngreso || 'No registrada'}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <span className="font-bold text-amber-700">{item.vacacionesDiasPendientes} días</span>
                          <div className="text-[11px] text-slate-500 font-mono">
                            ${item.vacacionesValorAcumuladoCOP.toLocaleString('es-CO')}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className="font-bold text-emerald-700">
                            ${(item.provisionMensualVacacionesCOP || desglose.provisionMensualVacaciones).toLocaleString('es-CO')}
                          </span>
                          <div className="text-[10px] text-slate-400 font-sans">
                            4.17% mensual
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className="font-bold text-slate-800">${cesTotal.toLocaleString('es-CO')}</span>
                          <div className="text-[10px] text-slate-500">
                            Int: ${item.interesesCesantiasAcumuladoCOP.toLocaleString('es-CO')}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className="font-bold text-slate-800">
                            ${(item.primaServiciosValorAcumuladoCOP || desglose.pasivoPrimaAcumulado).toLocaleString('es-CO')}
                          </span>
                          <div className="text-[10px] text-slate-500">
                            {item.diasTrabajadosSemestrePrima || 180}d ({item.semestrePrimaActual || '1er Sem'})
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className="font-bold text-indigo-900">
                            ${desglose.totalPasivosAcumuladosCOP.toLocaleString('es-CO')}
                          </span>
                          <div className="text-[10px] text-slate-500">
                            Prov: ${desglose.totalProvisionMensualCOP.toLocaleString('es-CO')}/m
                          </div>
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-600">
                          {item.fechaCorteSaldos}
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSaldoSeleccionadoDetalle(item)}
                              className="p-1 text-slate-600 hover:text-[#18235C] hover:bg-slate-100 rounded transition-colors"
                              title="Ver ficha técnica completa del saldo"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setSaldoParaCertificado(item)}
                              className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                              title="Generar Certificado Oficial de Empalme Contable"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEliminarSaldo(item.id, item.nombreCompleto)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Eliminar este saldo inicial"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: GUÍA DE EMPALME Y NORMATIVA LEGAL COLOMBIANA */}
      {/* ========================================================= */}
      {tabActiva === 'normativa' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#8FA7D6] shadow-2xs p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#18235C]">
              <Palmtree className="w-5 h-5 text-amber-600" />
              <h3 className="font-extrabold text-sm">Provisión Mensual y Pasivo de Vacaciones (Art. 186 y 192 CST - 4.17%)</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Los colaboradores tienen derecho a <strong>15 días hábiles continuos de descanso remunerado</strong> por cada año de servicios laborados.
            </p>
            <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 text-xs text-amber-950 space-y-1 font-mono">
              <div className="font-bold font-sans text-amber-900">Fórmula Legal Mensual de Causación:</div>
              <div>Provisión Mensual = Salario Básico × (15 días / 360 días) = Salario Básico × 4.1667% ≈ <strong>4.17%</strong></div>
              <div>Causación de Días por Mes Comercial (30d) = <strong>1.25 días hábiles</strong> (15 días / 12 meses)</div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Regla Clave:</strong> De conformidad con el Art. 192 del CST, el <em>Auxilio de Transporte NO forma parte</em> de la base salarial de vacaciones. Para trabajadores con <strong>Salario Integral</strong>, la provisión de vacaciones aplica sobre el salario básico pactado, al ser un descanso remunerado de ley.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[#8FA7D6] shadow-2xs p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#18235C]">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-sm">Cesantías e Intereses (Art. 249 CST / Ley 52 de 1975)</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Las cesantías corresponden a un mes de salario por cada año laborado (<strong>8.33% mensual</strong>), causadas proporcionalmente. Los intereses corresponden al <strong>12% anual</strong> (1.0% mensual) sobre el saldo de cesantías causado.
            </p>
            <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 text-xs text-emerald-950 space-y-1 font-mono">
              <div>Cesantías Mensuales = Base Computable (Salario + Aux. Transp + Recargos) × <strong>8.33%</strong></div>
              <div>Intereses Mensuales = Cesantías Mensuales × <strong>1.0%</strong> (12% anual)</div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              En este módulo, el campo <code className="font-mono text-slate-800 bg-slate-100 px-1 rounded">cesantiasSaldoAcumuladoCOP</code> refleja el pasivo pendiente por consignar a fondos (14 de Feb) o liquidar, permitiendo un empalme contable exacto sin duplicar causaciones.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-[#8FA7D6] shadow-2xs p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#18235C]">
              <Receipt className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-sm">Prima de Servicios y Carga Consolidada (Art. 306 CST - 21.83%)</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              La prima de servicios equivale a un mes de salario por cada año de servicios (<strong>8.33% mensual</strong>), pagadera en dos cuotas semestrales (Junio y Diciembre).
            </p>
            <div className="bg-blue-50/70 p-3 rounded-lg border border-blue-200 text-xs text-blue-950 space-y-1 font-mono">
              <div className="font-bold font-sans text-blue-900">Total Carga Prestacional Mensual CST:</div>
              <div>Cesantías (8.33%) + Intereses (1.00%) + Prima (8.33%) + Vacaciones (4.17%) = <strong>21.83% mensual</strong></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#8FA7D6] shadow-2xs p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#18235C]">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-sm">Préstamos, Libranzas y Acumulados DIAN</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Al parametrizar préstamos de la empresa, libranzas con entidades financieras o embargos judiciales, el sistema crea automáticamente las novedades recurrentes de nómina para que sean
              deducidas de forma periódica respetando los topes de inembargabilidad del salario y el salario mínimo legal vigente (SMMLV).
            </p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Asimismo, los acumulados tributarios alimentan el cálculo de Retención en la Fuente y el Certificado de Ingresos y Retenciones (Formulario 220 DIAN).
            </p>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: DETALLE COMPLETO DEL SALDO INICIAL */}
      {/* ========================================================= */}
      {saldoSeleccionadoDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-start justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-mono uppercase bg-blue-50 text-blue-800 px-2 py-0.5 rounded font-bold">
                  Ficha Técnica de Empalme
                </span>
                <h3 className="text-lg font-extrabold text-[#18235C] mt-1">
                  {saldoSeleccionadoDetalle.nombreCompleto}
                </h3>
                <p className="text-xs text-slate-500">
                  C.C. {saldoSeleccionadoDetalle.documento} · {saldoSeleccionadoDetalle.cargoNombre}
                </p>
              </div>
              <button
                onClick={() => setSaldoSeleccionadoDetalle(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            {(() => {
              const desglose = calcularPasivosLaboralesCompletos(saldoSeleccionadoDetalle);
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-bold">Salario Básico</span>
                      <span className="font-mono font-bold text-slate-900">${(saldoSeleccionadoDetalle.salarioBasico || desglose.salarioBasico).toLocaleString('es-CO')}</span>
                      <span className="text-[10px] text-slate-500 block">{saldoSeleccionadoDetalle.tipoSalario || 'Ordinario'}</span>
                    </div>
                    <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200">
                      <span className="text-[10px] text-amber-700 block font-bold">Vacaciones Pendientes</span>
                      <span className="font-bold text-amber-800">{saldoSeleccionadoDetalle.vacacionesDiasPendientes} días</span>
                      <span className="text-[10px] text-amber-900 font-mono block">${saldoSeleccionadoDetalle.vacacionesValorAcumuladoCOP.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-200">
                      <span className="text-[10px] text-emerald-700 block font-bold">Provisión Mensual Vac.</span>
                      <span className="font-bold text-emerald-800 font-mono">${desglose.provisionMensualVacaciones.toLocaleString('es-CO')}</span>
                      <span className="text-[10px] text-emerald-700 font-medium block">4.17% s/básico (Art. 186)</span>
                    </div>
                    <div className="bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-200">
                      <span className="text-[10px] text-indigo-700 block font-bold">Total Pasivo Consolidado</span>
                      <span className="font-bold text-indigo-900 font-mono">${desglose.totalPasivosAcumuladosCOP.toLocaleString('es-CO')}</span>
                      <span className="text-[10px] text-indigo-700 block">Carga: ${desglose.totalProvisionMensualCOP.toLocaleString('es-CO')}/mes</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-bold">Cesantías Acumuladas</span>
                      <span className="font-mono font-bold text-slate-800">${saldoSeleccionadoDetalle.cesantiasSaldoAcumuladoCOP.toLocaleString('es-CO')}</span>
                      <span className="text-[10px] text-slate-500 block">Prov: ${desglose.provisionMensualCesantias.toLocaleString('es-CO')}/mes (8.33%)</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-bold">Intereses Cesantías</span>
                      <span className="font-mono font-bold text-slate-800">${saldoSeleccionadoDetalle.interesesCesantiasAcumuladoCOP.toLocaleString('es-CO')}</span>
                      <span className="text-[10px] text-slate-500 block">Prov: ${desglose.provisionMensualIntereses.toLocaleString('es-CO')}/mes (1.0%)</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-bold">Prima Semestre Actual (CST)</span>
                      <span className="font-mono font-bold text-indigo-900">
                        ${(saldoSeleccionadoDetalle.primaServiciosValorAcumuladoCOP || desglose.pasivoPrimaAcumulado).toLocaleString('es-CO')}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Base: ${(saldoSeleccionadoDetalle.primaServiciosBaseSemestreCOP || 0).toLocaleString('es-CO')} ({saldoSeleccionadoDetalle.diasTrabajadosSemestrePrima || 180}d)
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-bold">Préstamo Empresa</span>
                      <span className="font-mono font-bold text-slate-800">${saldoSeleccionadoDetalle.prestamoEmpresaSaldoCOP.toLocaleString('es-CO')}</span>
                      <span className="text-[10px] text-slate-500 block">Cuota: ${saldoSeleccionadoDetalle.prestamoEmpresaCuotaMensualCOP.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-bold">Libranzas Activas</span>
                      <span className="font-mono font-bold text-slate-800">${saldoSeleccionadoDetalle.libranzaSaldoCOP.toLocaleString('es-CO')}</span>
                      <span className="text-[10px] text-slate-500 block">Cuota: ${saldoSeleccionadoDetalle.libranzaCuotaMensualCOP.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block font-bold">Fecha de Corte Oficial</span>
                      <span className="font-mono font-bold text-slate-800">{saldoSeleccionadoDetalle.fechaCorteSaldos}</span>
                      <span className="text-[10px] text-slate-500 block">Ingreso: {saldoSeleccionadoDetalle.fechaIngreso || 'No registrada'}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Bloque Tributario */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 space-y-1.5 text-xs">
              <h4 className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                <Receipt className="w-3.5 h-3.5 text-blue-700" />
                <span>Acumulados Gravables Año en Curso (Formulario 220 DIAN)</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px] pt-1">
                <div>
                  <span className="text-[9px] text-slate-500 block font-sans">Ingresos Laborales:</span>
                  <span className="font-bold text-slate-900">${saldoSeleccionadoDetalle.ingresosLaboralesAcumuladosAnoCOP.toLocaleString('es-CO')}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block font-sans">Aportes Salud:</span>
                  <span className="font-bold text-slate-900">${saldoSeleccionadoDetalle.saludAportesAcumuladosAnoCOP.toLocaleString('es-CO')}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block font-sans">Aportes Pensión:</span>
                  <span className="font-bold text-slate-900">${saldoSeleccionadoDetalle.pensionAportesAcumuladosAnoCOP.toLocaleString('es-CO')}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block font-sans">Retención Practicada:</span>
                  <span className="font-bold text-slate-900">${saldoSeleccionadoDetalle.retencionFuenteAcumuladaAnoCOP.toLocaleString('es-CO')}</span>
                </div>
              </div>
            </div>

            {saldoSeleccionadoDetalle.observaciones && (
              <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <strong className="text-slate-800">Observaciones contables: </strong>
                {saldoSeleccionadoDetalle.observaciones}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  const s = saldoSeleccionadoDetalle;
                  setSaldoSeleccionadoDetalle(null);
                  setSaldoParaCertificado(s);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Generar Certificado</span>
              </button>
              <button
                type="button"
                onClick={() => setSaldoSeleccionadoDetalle(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CERTIFICADO OFICIAL DE EMPALME CONTABLE */}
      {/* ========================================================= */}
      {saldoParaCertificado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 space-y-6 shadow-2xl border border-slate-200 text-slate-900 animate-scale-up">
            {/* Membrete Oficial */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#18235C]">
              <div>
                <h2 className="text-lg font-black tracking-tight text-[#18235C]">
                  {empresa?.nombreComercial || empresa?.razonSocial || 'EMPRESA INSTITUCIONAL S.A.S.'}
                </h2>
                <p className="text-xs text-slate-500 font-mono">
                  NIT: {empresa?.nit || '901.458.987'}-{empresa?.digitoVerificacion || '1'} · Dirección de Gestión Humana & Nómina
                </p>
              </div>
              <div className="text-right">
                <span className="px-2.5 py-1 bg-slate-100 rounded text-xs font-mono font-bold text-slate-800">
                  ACTA DE EMPALME #{saldoParaCertificado.id.toUpperCase()}
                </span>
                <div className="text-[10px] text-slate-400 mt-1">
                  Fecha Expedición: {new Date().toLocaleDateString('es-CO')}
                </div>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-[#18235C] uppercase tracking-wide">
                Certificado de Corte y Saldos Iniciales de Nómina
              </h3>
              <p className="text-xs text-slate-600">
                Conforme al Código Sustantivo del Trabajo (CST), Ley 52 de 1975, Estatuto Tributario y Ley 1527 de 2012
              </p>
            </div>

            <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              La Dirección de Gestión Humana y Compensación certifica que, con fecha de corte oficial a{' '}
              <strong className="text-slate-900">{saldoParaCertificado.fechaCorteSaldos}</strong>, el colaborador{' '}
              <strong className="text-slate-900">{saldoParaCertificado.nombreCompleto}</strong>, identificado con documento{' '}
              <strong className="text-slate-900">C.C. {saldoParaCertificado.documento}</strong>, en el cargo de{' '}
              <strong className="text-slate-900">{saldoParaCertificado.cargoNombre || 'Colaborador'}</strong>, registra en libros los siguientes saldos y pasivos consolidados:
            </div>

            {/* Cuadro de Pasivos y Saldos */}
            {(() => {
              const desglose = calcularPasivosLaboralesCompletos(saldoParaCertificado);
              return (
                <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#18235C] text-white text-[11px]">
                      <tr>
                        <th className="py-2 px-3">Concepto Laboral / Pasivo</th>
                        <th className="py-2 px-3">Unidad / Base Computable</th>
                        <th className="py-2 px-3 text-right">Provisión Mensual ($)</th>
                        <th className="py-2 px-3 text-right">Pasivo Consolidado ($ COP)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono text-[11px]">
                      <tr>
                        <td className="py-2 px-3 font-sans font-medium text-slate-800">Vacaciones Remuneradas (Art. 186/192 CST)</td>
                        <td className="py-2 px-3">{saldoParaCertificado.vacacionesDiasPendientes} días pendientes</td>
                        <td className="py-2 px-3 text-right text-emerald-700 font-bold">${desglose.provisionMensualVacaciones.toLocaleString('es-CO')} <span className="font-sans text-[10px] text-slate-500">(4.17%)</span></td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">${saldoParaCertificado.vacacionesValorAcumuladoCOP.toLocaleString('es-CO')}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-sans font-medium text-slate-800">Cesantías Causadas Pendientes (Art. 249 CST)</td>
                        <td className="py-2 px-3">Base: ${desglose.baseSalarioCesantias.toLocaleString('es-CO')}</td>
                        <td className="py-2 px-3 text-right text-slate-700">${desglose.provisionMensualCesantias.toLocaleString('es-CO')} <span className="font-sans text-[10px] text-slate-500">(8.33%)</span></td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">${saldoParaCertificado.cesantiasSaldoAcumuladoCOP.toLocaleString('es-CO')}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-sans font-medium text-slate-800">Intereses sobre Cesantías (Ley 52/1975)</td>
                        <td className="py-2 px-3">12% anual sobre cesantías</td>
                        <td className="py-2 px-3 text-right text-slate-700">${desglose.provisionMensualIntereses.toLocaleString('es-CO')} <span className="font-sans text-[10px] text-slate-500">(1.0%)</span></td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">${saldoParaCertificado.interesesCesantiasAcumuladoCOP.toLocaleString('es-CO')}</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-sans font-medium text-slate-800">
                          Prima de Servicios ({saldoParaCertificado.semestrePrimaActual || 'Semestre Actual'} - Art. 306 CST)
                        </td>
                        <td className="py-2 px-3">{saldoParaCertificado.diasTrabajadosSemestrePrima || 180} días computables</td>
                        <td className="py-2 px-3 text-right text-slate-700">${desglose.provisionMensualPrima.toLocaleString('es-CO')} <span className="font-sans text-[10px] text-slate-500">(8.33%)</span></td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          ${(saldoParaCertificado.primaServiciosValorAcumuladoCOP || desglose.pasivoPrimaAcumulado).toLocaleString('es-CO')}
                        </td>
                      </tr>
                      <tr className="bg-slate-100 font-bold font-sans">
                        <td className="py-2 px-3 text-slate-900" colSpan={2}>TOTAL PASIVOS Y CARGA PRESTACIONAL</td>
                        <td className="py-2 px-3 text-right font-mono text-[#18235C] font-black">
                          ${desglose.totalProvisionMensualCOP.toLocaleString('es-CO')}/mes
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-800 font-black">
                          ${desglose.totalPasivosAcumuladosCOP.toLocaleString('es-CO')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })()}

            {/* Firmas de Auditoría y Validación Digital con QR */}
            <div className="pt-6 border-t border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                {/* Firma Responsable Nómina */}
                <div className="sm:col-span-5">
                  <FirmaDigitalStamp
                    firma={firmaCertificadoEmisor}
                    firmanteDefault={{
                      nombre: currentUser?.nombre || 'Dirección de Nómina y Compensación',
                      cargo: 'Responsable de Nómina y Compensación',
                      documento: currentUser?.documento || ''
                    }}
                    labelCargo="Firma de Certificación y Validación Contable"
                    onOpenFirmarModal={() => {
                      setTipoFirmanteCertificado('emisor');
                      setModalFirmaCertificadoOpen(true);
                    }}
                  />
                </div>

                {/* Código QR de Validación de Autenticidad */}
                <div className="sm:col-span-2 flex justify-center">
                  <CodigoQRVerificacion
                    codigoVerificacion={`SALDO-${saldoParaCertificado.id.toUpperCase()}-2026`}
                    tipoDocumento="Certificado de Saldo y Pasivos"
                    titularNombre={saldoParaCertificado.nombreCompleto}
                    size={75}
                  />
                </div>

                {/* Firma Colaborador */}
                <div className="sm:col-span-5">
                  <FirmaDigitalStamp
                    firma={firmaCertificadoColaborador}
                    firmanteDefault={{
                      nombre: saldoParaCertificado.nombreCompleto,
                      cargo: saldoParaCertificado.cargoNombre || 'Colaborador Titular',
                      documento: saldoParaCertificado.documento
                    }}
                    labelCargo="Firma de Notificación y Enterado de Saldos"
                    onOpenFirmarModal={() => {
                      setTipoFirmanteCertificado('colaborador');
                      setModalFirmaCertificadoOpen(true);
                    }}
                  />
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>Cód. Verificación: SALDO-{saldoParaCertificado.id.toUpperCase()}-2026</span>
                <span>Certificado oficial con validez jurídica según Ley 527/1999 de Firma Digital</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 print:hidden">
              <button
                type="button"
                onClick={async () => {
                  await registrarCertificadoEmitido({
                    codigoVerificacion: `SALDO-${saldoParaCertificado.id.toUpperCase()}-2026`,
                    tipoDocumento: 'Certificado de Saldo y Pasivos',
                    titularNombre: saldoParaCertificado.nombreCompleto,
                    titularDocumento: saldoParaCertificado.documento,
                    titularCargo: saldoParaCertificado.cargoNombre || 'Colaborador',
                    fechaEmision: new Date().toLocaleDateString('es-CO'),
                    fechaRegistroISO: new Date().toISOString(),
                    emisorRazonSocial: empresa?.razonSocial || empresa?.nombreComercial || 'Empresa',
                    emisorNit: `${empresa?.nit || 'NIT'}-${empresa?.digitoVerificacion || ''}`,
                    firmanteNombre: firmaCertificadoEmisor?.firmanteNombre || currentUser?.nombre || 'Gestión Humana & Nómina',
                    firmanteCargo: 'Responsable de Nómina y Compensación',
                    hashIntegridad: generarHashIntegridadDocumento({ id: saldoParaCertificado.id, doc: saldoParaCertificado.documento }),
                    estado: 'VIGENTE_AUTENTICO',
                    firmaDigitalUrl: firmaCertificadoEmisor?.dataUrl || firmaCertificadoColaborador?.dataUrl
                  });
                  window.print();
                }}
                className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / Guardar en PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setSaldoParaCertificado(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>

          {/* Modal de Firma Digital para Certificado de Saldos */}
          <HerramientaFirmaDigitalModal
            isOpen={modalFirmaCertificadoOpen}
            onClose={() => setModalFirmaCertificadoOpen(false)}
            onSaveSignature={(firma) => {
              if (tipoFirmanteCertificado === 'emisor') {
                setFirmaCertificadoEmisor(firma);
              } else {
                setFirmaCertificadoColaborador(firma);
              }
              setModalFirmaCertificadoOpen(false);
            }}
            tituloDocumento={`Certificado de Saldos: ${saldoParaCertificado.nombreCompleto}`}
            firmanteSugerido={{
              nombre: tipoFirmanteCertificado === 'emisor' ? (currentUser?.nombre || 'Gestión Humana') : saldoParaCertificado.nombreCompleto,
              cargo: tipoFirmanteCertificado === 'emisor' ? 'Responsable de Nómina' : (saldoParaCertificado.cargoNombre || 'Colaborador'),
              documento: tipoFirmanteCertificado === 'emisor' ? '' : saldoParaCertificado.documento
            }}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: NUEVO SALDO INDIVIDUAL MANUAL */}
      {/* ========================================================= */}
      {modalNuevoManualOpen && (
        <ModalNuevoSaldoManual
          empleados={empleados}
          currentUser={currentUser}
          onClose={() => setModalNuevoManualOpen(false)}
          onGuardado={(nuevo) => {
            const actualizados = agregarOActualizarSaldosLocal([nuevo]);
            setSaldosGuardados(actualizados);
            setMensajeExito(`Saldo inicial de "${nuevo.nombreCompleto}" registrado exitosamente.`);
            setModalNuevoManualOpen(false);
          }}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL: CONFIRMAR RESTABLECIMIENTO TOTAL */}
      {/* ========================================================= */}
      {modalConfirmarLimpiarTodo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-rose-200 animate-scale-up">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-extrabold text-slate-900">
                ¿Restablecer todos los saldos iniciales?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Esta acción eliminará los {saldosGuardados.length} registros de saldos iniciales almacenados en el sistema.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalConfirmarLimpiarTodo(false)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLimpiarTodosSaldos}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
              >
                Sí, restablecer todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Subcomponente: Formulario modal para registrar un saldo inicial individual
 */
interface ModalNuevoSaldoManualProps {
  empleados: Empleado[];
  currentUser?: UsuarioSistema | null;
  onClose: () => void;
  onGuardado: (saldo: SaldoInicialEmpleadoNomina) => void;
}

const ModalNuevoSaldoManual: React.FC<ModalNuevoSaldoManualProps> = ({
  empleados,
  currentUser,
  onClose,
  onGuardado
}) => {
  const [empleadoSeleccionadoId, setEmpleadoSeleccionadoId] = useState('');
  const [documento, setDocumento] = useState('');
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [cargoNombre, setCargoNombre] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('2024-01-15');
  const [fechaCorteSaldos, setFechaCorteSaldos] = useState('2026-02-28');
  const [salarioBasico, setSalarioBasico] = useState<number>(2000000);
  const [tipoSalario, setTipoSalario] = useState<string>('Ordinario');
  const [tipoContrato, setTipoContrato] = useState<string>('Término indefinido');

  // Prestaciones
  const [vacacionesDias, setVacacionesDias] = useState<number>(0);
  const [vacacionesCOP, setVacacionesCOP] = useState<number>(0);
  const [cesantiasCOP, setCesantiasCOP] = useState<number>(0);
  const [interesesCesantiasCOP, setInteresesCesantiasCOP] = useState<number>(0);
  const [primaCOP, setPrimaCOP] = useState<number>(0);
  const [diasPrima, setDiasPrima] = useState<number>(60);

  // Provisión mensual calculada automáticamente (4.17% del salario básico)
  const provisionMensualVacacionesCalculada = useMemo(() => {
    return calcularProvisionMensualVacaciones(salarioBasico, 0, 0.0417, tipoContrato, tipoSalario);
  }, [salarioBasico, tipoContrato, tipoSalario]);

  // Tributario
  const [ingresosAno, setIngresosAno] = useState<number>(0);
  const [saludAno, setSaludAno] = useState<number>(0);
  const [pensionAno, setPensionAno] = useState<number>(0);
  const [fspAno, setFspAno] = useState<number>(0);
  const [retencionAno, setRetencionAno] = useState<number>(0);

  // Préstamos
  const [prestamoSaldo, setPrestamoSaldo] = useState<number>(0);
  const [prestamoCuota, setPrestamoCuota] = useState<number>(0);
  const [libranzaSaldo, setLibranzaSaldo] = useState<number>(0);
  const [libranzaCuota, setLibranzaCuota] = useState<number>(0);
  const [observaciones, setObservaciones] = useState('');

  // Al seleccionar un empleado del censo
  const handleSeleccionarEmpleado = (empId: string) => {
    setEmpleadoSeleccionadoId(empId);
    const emp = empleados.find(e => e.id === empId);
    if (emp) {
      setDocumento(emp.documento || '');
      setNombreCompleto(emp.nombre || '');
      setCargoNombre(emp.laboral?.cargoNombre || emp.cargoId || '');
      setFechaIngreso(emp.laboral?.fechaIngreso || emp.contrato?.inicio || '2024-01-15');
      const salario = emp.compensacion?.salarioBasico || emp.salarioBase || 2000000;
      setSalarioBasico(salario);
      setTipoSalario(emp.compensacion?.tipoSalario || 'Ordinario');
      setTipoContrato(emp.laboral?.tipoContrato || emp.contrato?.tipo || 'Término indefinido');
      setVacacionesCOP(Math.round((salario / 30) * vacacionesDias));
    }
  };

  // Recalcular valor acumulado de vacaciones al cambiar días o salario
  const handleCambioDiasVacaciones = (dias: number) => {
    setVacacionesDias(dias);
    setVacacionesCOP(Math.round((salarioBasico / 30) * dias));
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!documento.trim() || !nombreCompleto.trim()) {
      alert('Documento y nombre son obligatorios');
      return;
    }

    const provCes = Math.round(salarioBasico * 0.0833);
    const provInt = Math.round(provCes * 0.12);
    const provPri = Math.round(salarioBasico * 0.0833);
    const pasivosLaboralesEmpleado = (Number(vacacionesCOP) || 0) + (Number(cesantiasCOP) || 0) + (Number(interesesCesantiasCOP) || 0) + (Number(primaCOP) || 0);
    const provMensualTotal = provisionMensualVacacionesCalculada + provCes + provInt + provPri;

    const docLimpio = documento.replace(/[^0-9a-zA-Z]/g, '').toLowerCase();
    const nuevo: SaldoInicialEmpleadoNomina = {
      id: `saldo-${docLimpio || Date.now()}`,
      empleadoId: empleadoSeleccionadoId || undefined,
      documento,
      nombreCompleto,
      cargoNombre,
      fechaIngreso,
      fechaCorteSaldos,
      salarioBasico: Number(salarioBasico) || 0,
      tipoSalario,
      tipoContrato,
      vacacionesDiasPendientes: Number(vacacionesDias) || 0,
      vacacionesValorAcumuladoCOP: Number(vacacionesCOP) || 0,
      provisionMensualVacacionesCOP: provisionMensualVacacionesCalculada,
      cesantiasSaldoAcumuladoCOP: Number(cesantiasCOP) || 0,
      provisionMensualCesantiasCOP: provCes,
      interesesCesantiasAcumuladoCOP: Number(interesesCesantiasCOP) || 0,
      provisionMensualInteresesCOP: provInt,
      primaServiciosBaseSemestreCOP: Number(primaCOP) || salarioBasico,
      diasTrabajadosSemestrePrima: Number(diasPrima) || 60,
      primaServiciosValorAcumuladoCOP: Number(primaCOP) || 0,
      provisionMensualPrimaCOP: provPri,
      totalPasivosLaboralesCOP: pasivosLaboralesEmpleado,
      totalProvisionMensualPrestacionesCOP: provMensualTotal,
      ingresosLaboralesAcumuladosAnoCOP: Number(ingresosAno) || 0,
      saludAportesAcumuladosAnoCOP: Number(saludAno) || 0,
      pensionAportesAcumuladosAnoCOP: Number(pensionAno) || 0,
      fspAportesAcumuladosAnoCOP: Number(fspAno) || 0,
      retencionFuenteAcumuladaAnoCOP: Number(retencionAno) || 0,
      cesantiasPagadasAnoCOP: 0,
      prestamoEmpresaSaldoCOP: Number(prestamoSaldo) || 0,
      prestamoEmpresaCuotaMensualCOP: Number(prestamoCuota) || 0,
      libranzaSaldoCOP: Number(libranzaSaldo) || 0,
      libranzaCuotaMensualCOP: Number(libranzaCuota) || 0,
      embargoJudicialSaldoCOP: 0,
      otrasDeduccionesFijasMensualCOP: 0,
      observaciones: observaciones || undefined,
      creadoPor: currentUser?.nombre || 'Administrador GH',
      fechaRegistro: new Date().toISOString(),
      aplicadoEnNomina: true,
      aplicadoEnVacaciones: true
    };

    onGuardado(nuevo);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-scale-up">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#18235C]" />
            <h3 className="text-base font-extrabold text-[#18235C]">
              Registrar Saldo Inicial Individual
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold">✕</button>
        </div>

        <form onSubmit={handleGuardar} className="space-y-4 text-xs">
          {/* Selector de Empleado Opcional */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Vincular con Colaborador del Censo (Opcional):
            </label>
            <select
              value={empleadoSeleccionadoId}
              onChange={(e) => handleSeleccionarEmpleado(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="">-- Seleccionar o escribir manualmente abajo --</option>
              {empleados.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.nombre} (C.C. {emp.documento})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Cédula / Documento *</label>
              <input
                type="text"
                required
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg"
                placeholder="Ej. 1020892411"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg"
                placeholder="Nombre del colaborador"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Cargo</label>
              <input
                type="text"
                value={cargoNombre}
                onChange={(e) => setCargoNombre(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg"
                placeholder="Ej. Coordinador"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Salario Básico ($ COP) *</label>
              <input
                type="number"
                required
                value={salarioBasico}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setSalarioBasico(val);
                  setVacacionesCOP(Math.round((val / 30) * vacacionesDias));
                }}
                className="w-full p-2 border border-slate-300 rounded-lg font-mono font-bold"
                placeholder="2000000"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Fecha de Ingreso</label>
              <input
                type="date"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Fecha de Corte Saldos</label>
              <input
                type="date"
                value={fechaCorteSaldos}
                onChange={(e) => setFechaCorteSaldos(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Pasivos Laborales y Provisión Mensual de Vacaciones 4.17% */}
          <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 block text-xs">Pasivos de Prestaciones Sociales (CST)</span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Provisión Mensual Vacaciones (4.17%): ${provisionMensualVacacionesCalculada.toLocaleString('es-CO')}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-slate-600 block">Vacaciones Días</label>
                <input
                  type="number"
                  step="0.5"
                  value={vacacionesDias}
                  onChange={(e) => handleCambioDiasVacaciones(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 block">Vacaciones $ COP (Acum.)</label>
                <input
                  type="number"
                  value={vacacionesCOP}
                  onChange={(e) => setVacacionesCOP(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 block">Cesantías $ COP</label>
                <input
                  type="number"
                  value={cesantiasCOP}
                  onChange={(e) => setCesantiasCOP(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 block">Intereses Cesantías $</label>
                <input
                  type="number"
                  value={interesesCesantiasCOP}
                  onChange={(e) => setInteresesCesantiasCOP(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 border border-slate-300 rounded text-xs"
                />
              </div>
            </div>
          </div>

          {/* Préstamos y Libranzas */}
          <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-2">
            <span className="font-bold text-indigo-900 block text-xs">Préstamos y Libranzas Activas</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[10px] text-slate-600 block">Saldo Préstamo Empresa</label>
                <input
                  type="number"
                  value={prestamoSaldo}
                  onChange={(e) => setPrestamoSaldo(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 block">Cuota Mensual Préstamo</label>
                <input
                  type="number"
                  value={prestamoCuota}
                  onChange={(e) => setPrestamoCuota(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 block">Saldo Libranza Banco</label>
                <input
                  type="number"
                  value={libranzaSaldo}
                  onChange={(e) => setLibranzaSaldo(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-600 block">Cuota Mensual Libranza</label>
                <input
                  type="number"
                  value={libranzaCuota}
                  onChange={(e) => setLibranzaCuota(parseFloat(e.target.value) || 0)}
                  className="w-full p-1.5 border border-slate-300 rounded text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Observaciones / Notas de Auditoría</label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-xs"
              placeholder="Ej. Saldo validado con balance de prueba"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs"
            >
              Guardar Saldo Inicial
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
