import React, { useState, useMemo } from 'react';
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
  Sparkles
} from 'lucide-react';
import { uid } from '../../data/initialData';
import { TIPOS_CONTRATO_COLOMBIA, MODALIDADES_TRABAJO, JORNADAS_LABORALES, BANCOS_COLOMBIA } from '../../data/colombiaData';
import {
  calcularPeriodoPruebaAutomaticoCST,
  generarCodigoContratoLaboral,
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

  // 1. Estructura Orgánica
  const [cargoId, setCargoId] = useState(empleado.cargoId || (cargos.length > 0 ? cargos[0].id : ''));
  const [areaId, setAreaId] = useState(empleado.areaId || (areas.length > 0 ? areas[0].id : ''));
  const [procesoId, setProcesoId] = useState(procesos.length > 0 ? procesos[0].id : '');
  const [centroTrabajoId, setCentroTrabajoId] = useState(centrosTrabajo.length > 0 ? centrosTrabajo[0].id : '');
  const [jefeInmediatoId, setJefeInmediatoId] = useState(empleado.laboral?.jefeInmediatoId || '');
  const [modalidadTrabajo, setModalidadTrabajo] = useState<'Presencial' | 'Híbrida' | 'Trabajo remoto' | 'Teletrabajo'>(
    empleado.laboral?.modalidadTrabajo || 'Presencial'
  );
  const [lugarTrabajo, setLugarTrabajo] = useState(empleado.laboral?.lugarTrabajo || empleado.contacto?.ciudad || 'Bogotá D.C.');

  // 2. Asignación Salarial
  const cargoActual = cargos.find(c => c.id === cargoId);
  const salarioInicial = cargoActual?.salarioReferencia || empleado.salarioBase || 1600000;

  const [salarioBasico, setSalarioBasico] = useState<number>(salarioInicial);
  const [tipoSalario, setTipoSalario] = useState<'Ordinario' | 'Integral' | 'Por comisión'>('Ordinario');
  const [aplicaAuxilioTransporte, setAplicaAuxilioTransporte] = useState<boolean>(true);
  const [periodicidadPago, setPeriodicidadPago] = useState<'Quincenal' | 'Mensual'>('Quincenal');
  const [banco, setBanco] = useState(empleado.compensacion?.banco || 'Bancolombia');
  const [tipoCuenta, setTipoCuenta] = useState<'Ahorros' | 'Corriente'>('Ahorros');
  const [numeroCuenta, setNumeroCuenta] = useState(empleado.compensacion?.numeroCuenta || '');

  // 3. Condiciones y Término del Contrato
  const [tipoContrato, setTipoContrato] = useState(empleado.laboral?.tipoContrato || 'Contrato a Término Indefinido');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [duracionMeses, setDuracionMeses] = useState<number>(12);
  const [fechaFin, setFechaFin] = useState<string>(() => {
    const f = new Date();
    f.setFullYear(f.getFullYear() + 1);
    return f.toISOString().slice(0, 10);
  });

  // Periodo de prueba automático bajo CST
  const [periodoPruebaDias, setPeriodoPruebaDias] = useState<number>(() =>
    calcularPeriodoPruebaAutomaticoCST(tipoContrato, duracionMeses)
  );

  const [jornadaLaboral, setJornadaLaboral] = useState(
    'Jornada Ordinaria Completa (46 hrs semanales - Ley 2101 de 2021)'
  );
  const [clausulaConfidencialidad, setClausulaConfidencialidad] = useState(true);
  const [clausulaExclusividad, setClausulaExclusividad] = useState(false);
  const [observacionesContrato, setObservacionesContrato] = useState(
    'Contrato individual de trabajo celebrado con estricta sujeción a las disposiciones del Código Sustantivo del Trabajo (CST).'
  );

  const [despacharNotificacionEmail, setDespacharNotificacionEmail] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Al cambiar cargo, sugerir área y salario si están definidos
  const handleSeleccionarCargo = (nuevoCargoId: string) => {
    setCargoId(nuevoCargoId);
    const c = cargos.find(cg => cg.id === nuevoCargoId);
    if (c) {
      if (c.areaId) setAreaId(c.areaId);
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

  // Nombres descriptivos
  const areaSeleccionada = areas.find(a => a.id === areaId);
  const procesoSeleccionado = procesos.find(p => p.id === procesoId);
  const centroSeleccionado = centrosTrabajo.find(ct => ct.id === centroTrabajoId);
  const jefeSeleccionado = empleados.find(e => e.id === jefeInmediatoId);

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
      const codigoContrato = generarCodigoContratoLaboral(Math.floor(Math.random() * 800) + 100);

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
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 leading-relaxed">
                <strong className="block text-blue-950 font-bold mb-0.5">Ubicación en el Organigrama Institucional:</strong>
                Asocie al colaborador al cargo oficial, área o departamento, proceso corporativo y centro de trabajo donde desempeñará sus funciones.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cargo Oficial de la Estructura *</label>
                  <select
                    value={cargoId}
                    onChange={e => handleSeleccionarCargo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    {cargos.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.nivel ? `— Nivel: ${c.nivel}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Área / Departamento *</label>
                  <select
                    value={areaId}
                    onChange={e => setAreaId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Proceso Organizacional</label>
                  <select
                    value={procesoId}
                    onChange={e => setProcesoId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    {procesos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} ({p.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Centro de Trabajo / Sede</label>
                  <select
                    value={centroTrabajoId}
                    onChange={e => setCentroTrabajoId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    {centrosTrabajo.map(ct => (
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    <option value="">-- Sin jefe asignado / Gerencia --</option>
                    {empleados
                      .filter(emp => emp.id !== empleado.id)
                      .map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.nombre} ({emp.laboral?.cargoNombre || 'Líder'})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Modalidad de Trabajo</label>
                  <select
                    value={modalidadTrabajo}
                    onChange={e => setModalidadTrabajo(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                  >
                    {MODALIDADES_TRABAJO.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ciudad o Lugar de Labores</label>
                  <input
                    type="text"
                    value={lugarTrabajo}
                    onChange={e => setLugarTrabajo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
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
