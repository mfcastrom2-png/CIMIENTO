import React, { useState, useMemo, useEffect } from 'react';
import {
  Empleado,
  Cargo,
  AreaOrganizacion,
  ProcesoOrganizacion,
  CentroTrabajo,
  ConfiguracionEmpresa,
  ContratoLaboralDigital,
  NotificacionVinculacion
} from '../../types';
import {
  Briefcase,
  Layers,
  DollarSign,
  FileText,
  Calendar,
  Building,
  ShieldCheck,
  AlertTriangle,
  X,
  Check,
  Send,
  Clock,
  MapPin,
  Sparkles,
  GitFork,
  ArrowRight
} from 'lucide-react';
import { uid } from '../../data/initialData';
import { useCompanySyncOptional } from '../../context/SyncContext';
import { TIPOS_CONTRATO_COLOMBIA, MODALIDADES_TRABAJO, JORNADAS_LABORALES, BANCOS_COLOMBIA } from '../../data/colombiaData';
import {
  calcularPeriodoPruebaAutomaticoCST,
  generarCodigoContratoLaboral,
  obtenerSiguienteConsecutivoContratoLaboral,
  normalizarCodigoContratoLaboral,
  generarTextoNotificacionContratoListo,
  despacharNotificacionVinculacion
} from '../../services/vinculacionService';

interface ModalDefinirContratoVinculacionProps {
  empleado: Empleado;
  cargos: Cargo[];
  areas?: AreaOrganizacion[];
  procesos?: ProcesoOrganizacion[];
  centrosTrabajo?: CentroTrabajo[];
  empleados?: Empleado[];
  empresa?: ConfiguracionEmpresa;
  onClose: () => void;
  onContratoDefinido: (empleadoActualizado: Empleado) => Promise<void> | void;
}

export const ModalDefinirContratoVinculacion: React.FC<ModalDefinirContratoVinculacionProps> = ({
  empleado,
  cargos,
  areas = [],
  procesos = [],
  centrosTrabajo = [],
  empleados = [],
  empresa,
  onClose,
  onContratoDefinido
}) => {
  // Pestaña interna
  const [tabContrato, setTabContrato] = useState<'estructura' | 'salario' | 'contrato'>('estructura');

  // Respaldo dinámico desde SyncContext para alimentar siempre desde "Estructura Orgánica & Cargos"
  const companySync = useCompanySyncOptional();

  const listaProcesos = useMemo(() => {
    return (procesos && procesos.length > 0) ? procesos : (companySync?.procesos || []);
  }, [procesos, companySync?.procesos]);

  const listaAreas = useMemo(() => {
    return (areas && areas.length > 0) ? areas : (companySync?.areas || []);
  }, [areas, companySync?.areas]);

  const listaCargos = useMemo(() => {
    return (cargos && cargos.length > 0) ? cargos : (companySync?.cargos || []);
  }, [cargos, companySync?.cargos]);

  const listaCentros = useMemo(() => {
    return (centrosTrabajo && centrosTrabajo.length > 0) ? centrosTrabajo : [];
  }, [centrosTrabajo]);

  const listaEmpleados = useMemo(() => {
    return (empleados && empleados.length > 0) ? empleados : (companySync?.empleados || []);
  }, [empleados, companySync?.empleados]);

  // Helpers para relacionar un cargo con su proceso y área orgánica
  const obtenerProcesoDeCargo = (cargo: Cargo | undefined): ProcesoOrganizacion | undefined => {
    if (!cargo) return undefined;
    if (cargo.procesoId) {
      const p = listaProcesos.find(proc => proc.id === cargo.procesoId);
      if (p) return p;
    }
    const procNombre = cargo.procesoNombre || cargo.ficha?.identificacion?.proceso;
    if (procNombre) {
      const p = listaProcesos.find(proc => proc.nombre.toLowerCase().trim() === procNombre.toLowerCase().trim());
      if (p) return p;
    }
    const areaNombre = cargo.ficha?.identificacion?.area;
    const areaObj = listaAreas.find(a => a.id === cargo.areaId || (areaNombre && a.nombre.toLowerCase().trim() === areaNombre.toLowerCase().trim()));
    if (areaObj) {
      if (areaObj.procesoId) {
        const p = listaProcesos.find(proc => proc.id === areaObj.procesoId);
        if (p) return p;
      }
      if (areaObj.procesoNombre) {
        const p = listaProcesos.find(proc => proc.nombre.toLowerCase().trim() === areaObj.procesoNombre?.toLowerCase().trim());
        if (p) return p;
      }
    }
    return undefined;
  };

  const obtenerAreaDeCargo = (cargo: Cargo | undefined): AreaOrganizacion | undefined => {
    if (!cargo) return undefined;
    if (cargo.areaId) {
      const a = listaAreas.find(ar => ar.id === cargo.areaId);
      if (a) return a;
    }
    const areaNombre = cargo.ficha?.identificacion?.area;
    if (areaNombre) {
      const a = listaAreas.find(ar => ar.nombre.toLowerCase().trim() === areaNombre.toLowerCase().trim());
      if (a) return a;
    }
    return undefined;
  };

  // 1. Estructura Orgánica - Estados iniciales
  const [cargoId, setCargoId] = useState<string>(() => {
    if (empleado.cargoId) return empleado.cargoId;
    return listaCargos.length > 0 ? listaCargos[0].id : '';
  });

  const [procesoId, setProcesoId] = useState<string>(() => {
    const cargoBase = listaCargos.find(c => c.id === (empleado.cargoId || ''));
    if (cargoBase) {
      const p = obtenerProcesoDeCargo(cargoBase);
      if (p) return p.id;
    }
    return listaProcesos.length > 0 ? listaProcesos[0].id : '';
  });

  const [areaId, setAreaId] = useState<string>(() => {
    if (empleado.areaId) return empleado.areaId;
    const cargoBase = listaCargos.find(c => c.id === (empleado.cargoId || ''));
    if (cargoBase) {
      const a = obtenerAreaDeCargo(cargoBase);
      if (a) return a.id;
    }
    return listaAreas.length > 0 ? listaAreas[0].id : '';
  });

  const [centroTrabajoId, setCentroTrabajoId] = useState(listaCentros.length > 0 ? listaCentros[0].id : '');
  const [jefeInmediatoId, setJefeInmediatoId] = useState(empleado.laboral?.jefeInmediatoId || '');
  const [modalidadTrabajo, setModalidadTrabajo] = useState<'Presencial' | 'Híbrida' | 'Trabajo remoto' | 'Teletrabajo'>(
    empleado.laboral?.modalidadTrabajo || 'Presencial'
  );
  const [lugarTrabajo, setLugarTrabajo] = useState(empleado.laboral?.lugarTrabajo || empleado.contacto?.ciudad || 'Bogotá D.C.');
  const [filtrarPorProceso, setFiltrarPorProceso] = useState<boolean>(true);

  // Sincronización reactiva si las listas cargan asincrónicamente desde la nube
  useEffect(() => {
    if (!cargoId && listaCargos.length > 0) {
      setCargoId(listaCargos[0].id);
    }
    if (!procesoId && listaProcesos.length > 0) {
      setProcesoId(listaProcesos[0].id);
    }
    if (!areaId && listaAreas.length > 0) {
      setAreaId(listaAreas[0].id);
    }
  }, [listaCargos, listaProcesos, listaAreas]);

  // Áreas asociadas al Proceso seleccionado
  const areasFiltradas = useMemo(() => {
    if (!procesoId) return listaAreas;
    const proc = listaProcesos.find(p => p.id === procesoId);
    if (!proc) return listaAreas;
    const matching = listaAreas.filter(a => {
      return a.procesoId === procesoId || (proc.nombre && a.procesoNombre?.toLowerCase().trim() === proc.nombre.toLowerCase().trim());
    });
    return matching.length > 0 ? matching : listaAreas;
  }, [listaAreas, listaProcesos, procesoId]);

  // Cargos asociados al Proceso y Área seleccionados
  const cargosFiltrados = useMemo(() => {
    if (!filtrarPorProceso || !procesoId) return listaCargos;
    const proc = listaProcesos.find(p => p.id === procesoId);
    if (!proc) return listaCargos;

    const matching = listaCargos.filter(c => {
      // Coincidencia directa por proceso
      if (c.procesoId === procesoId) return true;
      if (c.procesoNombre && proc.nombre && c.procesoNombre.toLowerCase().trim() === proc.nombre.toLowerCase().trim()) return true;
      if (c.ficha?.identificacion?.proceso && proc.nombre && c.ficha.identificacion.proceso.toLowerCase().trim() === proc.nombre.toLowerCase().trim()) return true;

      // Coincidencia por área asociada
      const cArea = obtenerAreaDeCargo(c);
      if (cArea) {
        if (cArea.procesoId === procesoId) return true;
        if (proc.nombre && cArea.procesoNombre?.toLowerCase().trim() === proc.nombre.toLowerCase().trim()) return true;
        if (areaId && cArea.id === areaId) return true;
      }
      return false;
    });

    return matching.length > 0 ? matching : listaCargos;
  }, [filtrarPorProceso, procesoId, areaId, listaCargos, listaProcesos, listaAreas]);

  // 2. Asignación Salarial
  const cargoActual = listaCargos.find(c => c.id === cargoId);
  const salarioInicial = cargoActual?.salarioReferencia || empleado.salarioBase || 1600000;

  const [salarioBasico, setSalarioBasico] = useState<number>(salarioInicial);
  const [tipoSalario, setTipoSalario] = useState<'Ordinario' | 'Integral' | 'Por comisión'>('Ordinario');
  const [aplicaAuxilioTransporte, setAplicaAuxilioTransporte] = useState<boolean>(true);
  const [periodicidadPago, setPeriodicidadPago] = useState<'Quincenal' | 'Mensual'>('Quincenal');
  const [banco, setBanco] = useState(empleado.compensacion?.banco || 'Bancolombia');
  const [tipoCuenta, setTipoCuenta] = useState<'Ahorros' | 'Corriente'>('Ahorros');
  const [numeroCuenta, setNumeroCuenta] = useState(empleado.compensacion?.numeroCuenta || '');

  // 3. Condiciones y Término del Contrato
  const [tipoContrato, setTipoContrato] = useState(empleado.laboral?.tipoContrato || 'Contrato a Término Fijo');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [duracionMeses, setDuracionMeses] = useState<number>(6);
  const [fechaFin, setFechaFin] = useState<string>(() => {
    const f = new Date();
    f.setMonth(f.getMonth() + 6);
    f.setDate(f.getDate() - 1);
    return f.toISOString().slice(0, 10);
  });

  // Periodo de prueba automático bajo CST (Modelo B GROUP: 30 días calendario)
  const [periodoPruebaDias, setPeriodoPruebaDias] = useState<number>(() =>
    calcularPeriodoPruebaAutomaticoCST(tipoContrato, 6)
  );

  const [jornadaLaboral, setJornadaLaboral] = useState(
    'Tiempo completo (42 hrs semanales - Ley 2101)'
  );
  const [clausulaConfidencialidad, setClausulaConfidencialidad] = useState(true);
  const [clausulaExclusividad, setClausulaExclusividad] = useState(false);
  const [observacionesContrato, setObservacionesContrato] = useState(
    'Contrato individual de trabajo celebrado con estricta sujeción a las disposiciones del Código Sustantivo del Trabajo (CST).'
  );

  const [despacharNotificacionEmail, setDespacharNotificacionEmail] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Consecutivo oficial del contrato: inicia en 0001 (ej. CTR-BGROUP-2026-0001)
  const codigoContratoPrevisto = useMemo(() => {
    const codigoExistente = empleado.vinculacion?.contratoDigital?.codigoContrato;
    if (
      codigoExistente &&
      !codigoExistente.includes('0368') &&
      !codigoExistente.includes('368') &&
      !codigoExistente.endsWith('-001')
    ) {
      return normalizarCodigoContratoLaboral(codigoExistente);
    }
    const siguienteConsecutivo = obtenerSiguienteConsecutivoContratoLaboral(listaEmpleados);
    return generarCodigoContratoLaboral(siguienteConsecutivo);
  }, [empleado.vinculacion?.contratoDigital?.codigoContrato, listaEmpleados]);

  // Manejador bidireccional al seleccionar un Proceso Organizacional
  const handleSeleccionarProceso = (nuevoProcesoId: string) => {
    setProcesoId(nuevoProcesoId);
    const proc = listaProcesos.find(p => p.id === nuevoProcesoId);
    if (proc) {
      // Sugerir o filtrar áreas
      const matchingAreas = listaAreas.filter(a =>
        a.procesoId === nuevoProcesoId || (proc.nombre && a.procesoNombre?.toLowerCase().trim() === proc.nombre.toLowerCase().trim())
      );
      if (matchingAreas.length > 0) {
        setAreaId(matchingAreas[0].id);
      }

      // Sugerir primer cargo del proceso
      const matchingCargos = listaCargos.filter(c => {
        if (c.procesoId === nuevoProcesoId) return true;
        if (c.procesoNombre && proc.nombre && c.procesoNombre.toLowerCase().trim() === proc.nombre.toLowerCase().trim()) return true;
        if (c.ficha?.identificacion?.proceso && proc.nombre && c.ficha.identificacion.proceso.toLowerCase().trim() === proc.nombre.toLowerCase().trim()) return true;
        const cArea = obtenerAreaDeCargo(c);
        if (cArea && (cArea.procesoId === nuevoProcesoId || (proc.nombre && cArea.procesoNombre?.toLowerCase().trim() === proc.nombre.toLowerCase().trim()))) return true;
        return false;
      });

      if (matchingCargos.length > 0) {
        const c = matchingCargos[0];
        setCargoId(c.id);
        if (c.salarioReferencia && c.salarioReferencia > 0) {
          setSalarioBasico(c.salarioReferencia);
        }
      }
    }
  };

  // Manejador bidireccional al seleccionar un Área / Departamento
  const handleSeleccionarArea = (nuevaAreaId: string) => {
    setAreaId(nuevaAreaId);
    const a = listaAreas.find(ar => ar.id === nuevaAreaId);
    if (a) {
      if (a.procesoId) {
        setProcesoId(a.procesoId);
      } else if (a.procesoNombre) {
        const p = listaProcesos.find(pr => pr.nombre.toLowerCase().trim() === a.procesoNombre?.toLowerCase().trim());
        if (p) setProcesoId(p.id);
      }

      // Filtrar cargos que coincidan con esta área
      const matchingCargos = listaCargos.filter(c => {
        if (c.areaId === nuevaAreaId) return true;
        if (c.ficha?.identificacion?.area && a.nombre && c.ficha.identificacion.area.toLowerCase().trim() === a.nombre.toLowerCase().trim()) return true;
        return false;
      });

      if (matchingCargos.length > 0) {
        const c = matchingCargos[0];
        setCargoId(c.id);
        if (c.salarioReferencia && c.salarioReferencia > 0) {
          setSalarioBasico(c.salarioReferencia);
        }
      }
    }
  };

  // Manejador bidireccional al seleccionar un Cargo Oficial
  const handleSeleccionarCargo = (nuevoCargoId: string) => {
    setCargoId(nuevoCargoId);
    const c = listaCargos.find(cg => cg.id === nuevoCargoId);
    if (c) {
      // Auto-seleccionar área
      const a = obtenerAreaDeCargo(c);
      if (a) {
        setAreaId(a.id);
      }
      // Auto-seleccionar proceso
      const p = obtenerProcesoDeCargo(c);
      if (p) {
        setProcesoId(p.id);
      }
      // Actualizar salario de referencia
      if (c.salarioReferencia && c.salarioReferencia > 0) {
        setSalarioBasico(c.salarioReferencia);
      }
    }
  };

  // Al cambiar tipo de contrato o duración, recalcular periodo de prueba automáticamente
  const handleCambiarTipoContrato = (nuevoTipo: string) => {
    setTipoContrato(nuevoTipo);
    const dias = calcularPeriodoPruebaAutomaticoCST(nuevoTipo, duracionMeses);
    setPeriodoPruebaDias(dias);
  };

  const handleCambiarDuracionMeses = (meses: number) => {
    setDuracionMeses(meses);
    const inicio = new Date(fechaInicio);
    inicio.setMonth(inicio.getMonth() + meses);
    setFechaFin(inicio.toISOString().slice(0, 10));
    const dias = calcularPeriodoPruebaAutomaticoCST(tipoContrato, meses);
    setPeriodoPruebaDias(dias);
  };

  // Nombres descriptivos calculados desde las listas efectivas
  const areaSeleccionada = listaAreas.find(a => a.id === areaId);
  const procesoSeleccionado = listaProcesos.find(p => p.id === procesoId);
  const centroSeleccionado = listaCentros.find(ct => ct.id === centroTrabajoId);
  const jefeSeleccionado = listaEmpleados.find(e => e.id === jefeInmediatoId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    if (!cargoId) {
      setErrorValidacion('Debe seleccionar un Cargo oficial de la estructura orgánica.');
      setTabContrato('estructura');
      return;
    }

    if (!salarioBasico || salarioBasico < 1300000) {
      setErrorValidacion('El salario básico mensual debe ser igual o superior al Salario Mínimo Legal Vigente (CST).');
      setTabContrato('salario');
      return;
    }

    if (!fechaInicio) {
      setErrorValidacion('Debe especificar la fecha de inicio del contrato laboral.');
      setTabContrato('contrato');
      return;
    }

    setGuardando(true);

    try {
      const fechaHoy = new Date().toISOString();
      const codigoContrato = codigoContratoPrevisto;

      // Guardar el correlativo oficial para trazabilidad secuencial
      try {
        const match = codigoContrato.match(/CTR-BGROUP-\d{4}-(\d+)/);
        if (match && match[1]) {
          localStorage.setItem('consecutivo_contratos_laborales_bgroup', String(parseInt(match[1], 10)));
        }
      } catch {
        // Ignorar fallos de localStorage
      }

      // Crear objeto del Contrato Laboral Digital en estado 'Pendiente Firma'
      const nuevoContratoDigital: ContratoLaboralDigital = {
        id: uid(),
        codigoContrato,
        tipoContrato,
        cargoId,
        cargoNombre: cargoActual?.nombre || 'Cargo Asignado',
        areaId,
        areaNombre: areaSeleccionada?.nombre || 'Área Organizacional',
        procesoId,
        procesoNombre: procesoSeleccionado?.nombre || undefined,
        centroTrabajoId,
        centroTrabajoNombre: centroSeleccionado?.nombre || undefined,
        jefeInmediatoId,
        jefeInmediatoNombre: jefeSeleccionado?.nombre || undefined,
        salarioBasico,
        tipoSalario,
        aplicaAuxilioTransporte,
        fechaInicio,
        fechaFin: tipoContrato.toLowerCase().includes('fijo') ? fechaFin : undefined,
        duracionMeses: tipoContrato.toLowerCase().includes('fijo') ? duracionMeses : undefined,
        periodoPruebaDias,
        jornadaLaboral,
        modalidadTrabajo,
        lugarTrabajo,
        clausulaConfidencialidad,
        clausulaExclusividad,
        estado: 'Pendiente Firma',
        observaciones: observacionesContrato.trim()
      };

      // Generar notificación institucional para el candidato
      const notifCandidato = generarTextoNotificacionContratoListo({
        candidatoNombre: empleado.nombre,
        candidatoDocumento: empleado.documento,
        codigoContrato,
        cargoNombre: cargoActual?.nombre || 'Cargo Asignado',
        tipoContrato,
        salarioBasico,
        empresa
      });

      const nuevaNotif: NotificacionVinculacion = {
        id: uid(),
        fecha: fechaHoy,
        destinatario: 'candidato',
        destinatarioNombre: empleado.nombre,
        destinatarioEmail: empleado.email,
        destinatarioTelefono: empleado.telefono,
        tipo: 'contrato_listo_firma',
        asunto: notifCandidato.asunto,
        mensaje: notifCandidato.cuerpo,
        leido: false,
        canal: 'Correo',
        enlaceAccion: notifCandidato.enlace
      };

      // Despachar correo electrónico real al candidato si está habilitado
      if (despacharNotificacionEmail && empleado.email) {
        await despacharNotificacionVinculacion({
          destinatarioEmail: empleado.email,
          destinatarioNombre: empleado.nombre,
          asunto: notifCandidato.asunto,
          cuerpo: notifCandidato.cuerpo,
          tipo: 'contrato_listo_firma'
        });
      }

      // Actualizar el empleado con la nueva estructura orgánica, salario y contrato
      const empleadoActualizado: Empleado = {
        ...empleado,
        cargoId,
        areaId,
        salarioBase: salarioBasico,
        laboral: {
          ...(empleado.laboral || {
            codigoInterno: empleado.documento,
            fechaIngreso: fechaInicio,
            fechaInicioLaboral: fechaInicio,
            fechaInicioContrato: fechaInicio,
            estado: 'Preingreso'
          }),
          cargoId,
          cargoNombre: cargoActual?.nombre || 'Cargo Asignado',
          areaId,
          areaNombre: areaSeleccionada?.nombre || 'Área Asignada',
          jefeInmediatoId,
          jefeInmediatoNombre: jefeSeleccionado?.nombre || undefined,
          tipoContrato,
          fechaInicioContrato: fechaInicio,
          fechaTerminacionContrato: tipoContrato.toLowerCase().includes('fijo') ? fechaFin : undefined,
          jornadaLaboral,
          modalidadTrabajo,
          lugarTrabajo,
          estado: 'Preingreso'
        },
        contrato: {
          tipo: tipoContrato,
          inicio: fechaInicio,
          fin: tipoContrato.toLowerCase().includes('fijo') ? fechaFin : '',
          salario: String(salarioBasico)
        },
        compensacion: {
          salarioBasico,
          tipoSalario,
          periodicidadPago,
          auxilioTransporte: aplicaAuxilioTransporte,
          formaPago: 'Transferencia bancaria',
          banco,
          tipoCuenta,
          numeroCuenta,
          historialVigencias: [
            {
              id: uid(),
              salarioAnterior: 0,
              nuevoSalario: salarioBasico,
              tipoSalario,
              fechaVigencia: fechaInicio,
              fechaRegistro: fechaHoy,
              motivoCambio: 'Asignación salarial inicial en proceso de vinculación laboral',
              aplicaAuxilioTransporte
            }
          ]
        },
        vinculacion: {
          ...(empleado.vinculacion || {
            fechaRegistroCandidato: fechaHoy,
            notificaciones: []
          }),
          etapaActual: 'pendiente_firma_contrato',
          fechaContratoGenerado: fechaHoy,
          contratoDigital: nuevoContratoDigital,
          notificaciones: [nuevaNotif, ...(empleado.vinculacion?.notificaciones || [])]
        },
        historialLaboral: [
          {
            id: uid(),
            fechaHora: fechaHoy,
            usuario: 'Administrador GH',
            accion: 'CAMBIO_CONTRATO',
            titulo: `Generación de Contrato Laboral (${codigoContrato})`,
            motivo: `Asociación a estructura orgánica en ${cargoActual?.nombre} (${areaSeleccionada?.nombre || 'Área'}). Salario: $${salarioBasico.toLocaleString('es-CO')}. Tipo: ${tipoContrato}.`,
            valorNuevo: `Estado: Pendiente de Firma Digital por el Colaborador`
          },
          ...(empleado.historialLaboral || [])
        ]
      };

      await onContratoDefinido(empleadoActualizado);
      onClose();
    } catch (err: any) {
      console.error('Error al definir contrato:', err);
      setErrorValidacion(err?.message || 'Error al guardar condiciones contractuales.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 max-h-[94vh] flex flex-col animate-fadeIn">
        {/* Cabecera */}
        <div className="bg-[#18235C] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#F59E0B] border border-white/10">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Asociación a Estructura Orgánica, Salario & Contrato
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Etapa 2: Definición Contractual (GH)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Candidato: <strong className="text-white">{empleado.nombre}</strong> · C.C. <strong className="font-mono text-[#F59E0B]">{empleado.documento}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas del Proceso */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 flex items-center gap-2 overflow-x-auto text-xs font-bold py-2 shrink-0">
          <button
            type="button"
            onClick={() => setTabContrato('estructura')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              tabContrato === 'estructura' ? 'bg-[#18235C] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Estructura Orgánica & Cargo</span>
          </button>

          <button
            type="button"
            onClick={() => setTabContrato('salario')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              tabContrato === 'salario' ? 'bg-[#18235C] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Asignación Salarial & Compensación</span>
          </button>

          <button
            type="button"
            onClick={() => setTabContrato('contrato')}
            className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              tabContrato === 'contrato' ? 'bg-[#18235C] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>3. Términos Contractuales & Periodo de Prueba</span>
          </button>
        </div>

        {/* Contenido */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
          {errorValidacion && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* TAB 1: ESTRUCTURA ORGÁNICA */}
          {tabContrato === 'estructura' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 leading-relaxed text-xs">
                <strong className="block text-blue-950 font-bold mb-0.5">Alineación con la Estructura Orgánica Institucional:</strong>
                Seleccione el <strong>Proceso</strong>, el <strong>Área</strong> y el <strong>Cargo Oficial</strong> registrados en el módulo de <em>Estructura Orgánica & Cargos</em>. Al elegir cualquiera de ellos, los campos se sincronizan bidireccionalmente y cargan el salario de referencia oficial.
              </div>

              {/* Paso 1: Proceso Organizacional */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#18235C] text-white flex items-center justify-center text-[10px] font-extrabold">1</span>
                    <label className="font-bold text-xs text-[#18235C]">Proceso Organizacional (Mapa de Macroprocesos) *</label>
                  </div>
                  {procesoSeleccionado && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-300">
                      Macroproceso {procesoSeleccionado.tipo}
                    </span>
                  )}
                </div>

                <div>
                  <select
                    value={procesoId}
                    onChange={e => handleSeleccionarProceso(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-xs text-slate-800"
                  >
                    <optgroup label="Macroprocesos Estratégicos">
                      {listaProcesos
                        .filter(p => p.tipo?.toLowerCase().includes('estrateg'))
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} ({p.codigo || 'PE'})
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Macroprocesos Misionales / Operativos">
                      {listaProcesos
                        .filter(p => p.tipo?.toLowerCase().includes('mision') || p.tipo?.toLowerCase().includes('operat'))
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} ({p.codigo || 'PM'})
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Macroprocesos de Apoyo / Soporte">
                      {listaProcesos
                        .filter(p => p.tipo?.toLowerCase().includes('apoyo') || p.tipo?.toLowerCase().includes('soport'))
                        .map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} ({p.codigo || 'PA'})
                          </option>
                        ))}
                    </optgroup>
                    {/* Fallback para procesos sin tipo específico */}
                    {listaProcesos.filter(
                      p =>
                        !p.tipo?.toLowerCase().includes('estrateg') &&
                        !p.tipo?.toLowerCase().includes('mision') &&
                        !p.tipo?.toLowerCase().includes('operat') &&
                        !p.tipo?.toLowerCase().includes('apoyo') &&
                        !p.tipo?.toLowerCase().includes('soport')
                    ).length > 0 && (
                      <optgroup label="Otros Procesos">
                        {listaProcesos
                          .filter(
                            p =>
                              !p.tipo?.toLowerCase().includes('estrateg') &&
                              !p.tipo?.toLowerCase().includes('mision') &&
                              !p.tipo?.toLowerCase().includes('operat') &&
                              !p.tipo?.toLowerCase().includes('apoyo') &&
                              !p.tipo?.toLowerCase().includes('soport')
                          )
                          .map(p => (
                            <option key={p.id} value={p.id}>
                              {p.nombre}
                            </option>
                          ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              {/* Paso 2 y Paso 3: Área y Cargo Oficial */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Paso 2: Área */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#18235C] text-white flex items-center justify-center text-[10px] font-extrabold">2</span>
                      <label className="font-bold text-xs text-[#18235C]">Área o Departamento *</label>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {areasFiltradas.length} {areasFiltradas.length === 1 ? 'área' : 'áreas'}
                    </span>
                  </div>

                  <select
                    value={areaId}
                    onChange={e => handleSeleccionarArea(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-xs text-slate-800"
                  >
                    {areasFiltradas.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.nombre} {a.codigo ? `(${a.codigo})` : ''}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 block">
                    Vinculada al proceso: {areaSeleccionada?.procesoNombre || procesoSeleccionado?.nombre || 'General'}
                  </span>
                </div>

                {/* Paso 3: Cargo Oficial */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#18235C] text-white flex items-center justify-center text-[10px] font-extrabold">3</span>
                      <label className="font-bold text-xs text-[#18235C]">Cargo Oficial de la Estructura *</label>
                    </div>
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filtrarPorProceso}
                        onChange={e => setFiltrarPorProceso(e.target.checked)}
                        className="rounded text-[#18235C]"
                      />
                      <span>Filtrar por proceso</span>
                    </label>
                  </div>

                  <select
                    value={cargoId}
                    onChange={e => handleSeleccionarCargo(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-xs text-slate-800"
                  >
                    {cargosFiltrados.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.ficha?.identificacion?.codigo ? `(${c.ficha.identificacion.codigo})` : ''} {c.nivel ? `— Nivel: ${c.nivel}` : ''}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-slate-500 block">
                    {cargoActual?.salarioReferencia && cargoActual.salarioReferencia > 0
                      ? `Salario de referencia en catálogo: $${cargoActual.salarioReferencia.toLocaleString('es-CO')} COP`
                      : 'Sin salario de referencia predefinido'}
                  </span>
                </div>
              </div>

              {/* Panel de Confirmación de Alineación Orgánica */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-200 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#18235C] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Alineación Jerárquica Seleccionada:</span>
                </span>
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-800 font-semibold">
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                    {procesoSeleccionado?.tipo || 'Macroproceso'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-[#18235C] font-bold shadow-2xs">
                    {procesoSeleccionado?.nombre || 'Proceso no seleccionado'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 shadow-2xs">
                    {areaSeleccionada?.nombre || 'Área general'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="px-2.5 py-1 rounded-lg bg-[#18235C] text-white font-bold shadow-2xs flex items-center gap-1.5">
                    <Briefcase className="w-3 h-3 text-[#F59E0B]" />
                    <span>{cargoActual?.nombre || 'Cargo Asignado'}</span>
                    {cargoActual?.ficha?.identificacion?.codigo && (
                      <span className="text-[10px] text-blue-200 font-mono">
                        ({cargoActual.ficha.identificacion.codigo})
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Información complementaria de puesto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Centro de Trabajo / Sede *</label>
                  <select
                    value={centroTrabajoId}
                    onChange={e => setCentroTrabajoId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-xs"
                  >
                    {listaCentros.map(ct => (
                      <option key={ct.id} value={ct.id}>
                        {ct.nombre} ({ct.ciudad})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jefe Inmediato / Reporta a</label>
                  <select
                    value={jefeInmediatoId}
                    onChange={e => setJefeInmediatoId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-xs"
                  >
                    <option value="">-- Sin jefe asignado / Reporta a Dirección General --</option>
                    {listaEmpleados
                      .filter(emp => emp.id !== empleado.id)
                      .map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nombre} ({emp.laboral?.cargoNombre || 'Líder'})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Modalidad de Trabajo *</label>
                  <select
                    value={modalidadTrabajo}
                    onChange={e => setModalidadTrabajo(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-xs"
                  >
                    {MODALIDADES_TRABAJO.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ciudad o Lugar de Labores *</label>
                  <input
                    type="text"
                    value={lugarTrabajo}
                    onChange={e => setLugarTrabajo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setTabContrato('salario')}
                  className="px-4 py-2 bg-[#18235C] text-white font-bold rounded-xl cursor-pointer"
                >
                  Continuar a Asignación Salarial →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ASIGNACIÓN SALARIAL */}
          {tabContrato === 'salario' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 leading-relaxed">
                <strong className="block text-emerald-950 font-bold mb-0.5">Asignación Económica & Salarial (Art. 127 CST):</strong>
                Estipule el salario básico devengado en pesos colombianos (COP), periodicidad y elegibilidad al auxilio de transporte legal.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Salario Básico Mensual (COP) *</label>
                  <input
                    type="number"
                    min="1300000"
                    step="50000"
                    required
                    value={salarioBasico}
                    onChange={e => {
                      const s = Number(e.target.value);
                      setSalarioBasico(s);
                      // Si supera 2 SMMLV (~2.847.000 COP), desmarcar automáticamente auxilio de transporte
                      if (s > 2847000) setAplicaAuxilioTransporte(false);
                      else setAplicaAuxilioTransporte(true);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-emerald-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Naturaleza del Salario</label>
                  <select
                    value={tipoSalario}
                    onChange={e => setTipoSalario(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="Ordinario">Ordinario (CST Art. 132)</option>
                    <option value="Integral">Integral (&gt; 13 SMMLV - Art. 132 CST)</option>
                    <option value="Por comisión">Por Comisión / Mixto</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Periodicidad de Liquidación</label>
                  <select
                    value={periodicidadPago}
                    onChange={e => setPeriodicidadPago(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="Quincenal">Quincenal (Días 15 y 30)</option>
                    <option value="Mensual">Mensual (Día 30)</option>
                  </select>
                </div>
              </div>

              {/* Auxilio de Transporte */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={aplicaAuxilioTransporte}
                    onChange={e => setAplicaAuxilioTransporte(e.target.checked)}
                    className="rounded text-[#18235C] w-4 h-4"
                  />
                  <span>
                    Aplica Auxilio de Transporte Legal (Ley 15 de 1959 — Obligatorio para remuneraciones hasta 2 SMMLV)
                  </span>
                </label>
                <span className="text-[11px] text-slate-500 block ml-6 mt-0.5">
                  Valor fijado por decreto nacional para el periodo fiscal ($162.000 COP aprox.).
                </span>
              </div>

              {/* Información de Pago y Cuenta Bancaria */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block text-xs">
                  Dispersión de Nómina Bancaria (Opcional en esta etapa):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Entidad Bancaria</label>
                    <select
                      value={banco}
                      onChange={e => setBanco(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold"
                    >
                      {BANCOS_COLOMBIA.map(b => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Tipo de Cuenta</label>
                    <select
                      value={tipoCuenta}
                      onChange={e => setTipoCuenta(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold"
                    >
                      <option value="Ahorros">Cuenta de Ahorros</option>
                      <option value="Corriente">Cuenta Corriente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Número de Cuenta</label>
                    <input
                      type="text"
                      placeholder="Ej. 10293847561"
                      value={numeroCuenta}
                      onChange={e => setNumeroCuenta(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-3">
                <button
                  type="button"
                  onClick={() => setTabContrato('estructura')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  onClick={() => setTabContrato('contrato')}
                  className="px-4 py-2 bg-[#18235C] text-white font-bold rounded-xl cursor-pointer"
                >
                  Continuar a Términos del Contrato →
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: TÉRMINOS DEL CONTRATO & PERIODO DE PRUEBA */}
          {tabContrato === 'contrato' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-950 leading-relaxed">
                <strong className="block text-amber-950 font-bold mb-0.5">Modalidad Contractual & Cláusulas del CST:</strong>
                Determine el tipo de contrato, duración, periodo de prueba conforme a los artículos 76 a 80 del Código Sustantivo del Trabajo y jornada legal.
              </div>

              {/* Indicador de Consecutivo Oficial (inicia en 0001) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-[#18235C]" />
                  <span>Consecutivo Oficial de Contrato (Inicia en <strong>0001</strong>):</span>
                </div>
                <span className="font-mono font-bold text-sm text-[#18235C] bg-white px-2.5 py-0.5 rounded-lg border border-slate-300 shadow-sm">
                  {codigoContratoPrevisto}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Tipo de Contrato Individual de Trabajo *</label>
                  <select
                    value={tipoContrato}
                    onChange={e => handleCambiarTipoContrato(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-[#18235C]"
                  >
                    {TIPOS_CONTRATO_COLOMBIA.map(tc => (
                      <option key={tc} value={tc}>
                        {tc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Inicio de Labores *</label>
                  <input
                    type="date"
                    required
                    value={fechaInicio}
                    onChange={e => setFechaInicio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  />
                </div>
              </div>

              {/* Si es término fijo u obra */}
              {tipoContrato.toLowerCase().includes('fijo') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Duración Pactada (Meses)</label>
                    <input
                      type="number"
                      min="1"
                      max="36"
                      value={duracionMeses}
                      onChange={e => handleCambiarDuracionMeses(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fecha de Vencimiento del Plazo</label>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={e => setFechaFin(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Periodo de Prueba y Jornada */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Periodo de Prueba (Días Calendario)</span>
                    <span className="text-[10px] text-blue-700 font-bold">Art. 78 CST</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={periodoPruebaDias}
                    onChange={e => setPeriodoPruebaDias(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-blue-900"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Calculado automáticamente: Máx 60 días o la 5ta parte del contrato si es &lt; 1 año.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jornada Laboral Ordinaria</label>
                  <select
                    value={jornadaLaboral}
                    onChange={e => setJornadaLaboral(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    {JORNADAS_LABORALES.map(j => (
                      <option key={j} value={j}>
                        {j}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cláusulas Especiales */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 text-xs block">Cláusulas Especiales del Contrato:</span>
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={clausulaConfidencialidad}
                    onChange={e => setClausulaConfidencialidad(e.target.checked)}
                    className="rounded text-[#18235C] w-4 h-4"
                  />
                  <span>
                    <strong>Cláusula de Confidencialidad y Propiedad Intelectual:</strong> Reserva estricta sobre secretos industriales y tecnológicos.
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    checked={clausulaExclusividad}
                    onChange={e => setClausulaExclusividad(e.target.checked)}
                    className="rounded text-[#18235C] w-4 h-4"
                  />
                  <span>
                    <strong>Cláusula de Exclusividad Laboral (Art. 26 CST):</strong> Prestación de servicios de forma exclusiva para la organización.
                  </span>
                </label>
              </div>

              {/* Notificación al correo del candidato */}
              <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-indigo-950">
                  <input
                    type="checkbox"
                    checked={despacharNotificacionEmail}
                    onChange={e => setDespacharNotificacionEmail(e.target.checked)}
                    className="rounded text-[#18235C] w-4 h-4"
                  />
                  <span>
                    Despachar notificación y correo electrónico al candidato ({empleado.email}) para la firma digital del contrato.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setTabContrato('salario')}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  ← Anterior
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2.5 rounded-xl bg-[#18235C] hover:bg-[#1E3A8A] text-white font-extrabold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4 text-[#F59E0B]" />
                  <span>
                    {guardando
                      ? 'Generando Contrato...'
                      : 'Guardar Condiciones & Generar Contrato para Firma Digital'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
