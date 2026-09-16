import React, { useState, useMemo, useEffect } from 'react';
import {
  CandidatoVotacion,
  CertificadoVotoEmpleado,
  Empleado,
  ProcesoVotacionSST,
  Role
} from '../types';
import { INITIAL_PROCESOS_VOTACION } from '../data/usuariosYVotacionesData';
import {
  AlertCircle,
  Award,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Lock,
  Printer,
  QrCode,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Unlock,
  User,
  UserCheck,
  Users,
  Vote,
  X
} from 'lucide-react';

interface VotacionesSstViewProps {
  userRole?: Role;
  currentEmpleadoId?: string;
  empleados?: Empleado[];
}

export function VotacionesSstView({
  userRole = 'admin',
  currentEmpleadoId = 'e6', // Por defecto Carlos Mendivelso (empleado técnico que vota)
  empleados = []
}: VotacionesSstViewProps) {
  const [procesos, setProcesos] = useState<ProcesoVotacionSST[]>(() => {
    const limpio = typeof window !== 'undefined' && localStorage.getItem('bgroup_datos_limpios') === 'true';
    if (limpio || empleados.length === 0) {
      return [
        {
          id: 'elec-copasst-2026',
          tipo: 'COPASST',
          titulo: 'Elección de Representantes de los Trabajadores ante el COPASST',
          periodo: '2026 - 2028',
          fechaApertura: '2026-09-01 08:00',
          fechaCierre: '2026-12-31 17:00',
          estado: 'Abierta',
          censoElectoralTotal: empleados.length,
          candidatos: [],
          votosEnBlanco: 0,
          totalVotosEmitidos: 0,
          votantesRegistrados: [],
          juradosElectorales: [
            'Representante Legal / Gerencia',
            'Responsable del SG-SST',
            'Veedor Designado por Trabajadores'
          ],
          actaApertura: 'ACTA DE APERTURA: Proceso electoral de COPASST listo para inscripción de candidatos y sufragio de trabajadores reales.'
        },
        {
          id: 'elec-convivencia-2026',
          tipo: 'Comité de Convivencia',
          titulo: 'Elección de Representantes de los Trabajadores ante el Comité de Convivencia Laboral',
          periodo: '2026 - 2028',
          fechaApertura: '2026-09-01 08:00',
          fechaCierre: '2026-12-31 17:00',
          estado: 'Abierta',
          censoElectoralTotal: empleados.length,
          candidatos: [],
          votosEnBlanco: 0,
          totalVotosEmitidos: 0,
          votantesRegistrados: [],
          juradosElectorales: [
            'Representante de Gestión Humana',
            'Veedor Laboral'
          ],
          actaApertura: 'ACTA DE APERTURA: Proceso de elección para Comité de Convivencia Laboral listo para producción.'
        }
      ];
    }
    return INITIAL_PROCESOS_VOTACION;
  });

  // Sincronizar censo y votantes con la lista real de empleados
  useEffect(() => {
    const limpio = typeof window !== 'undefined' && localStorage.getItem('bgroup_datos_limpios') === 'true';
    if (limpio || empleados.length === 0) {
      const empIds = new Set(empleados.map(e => e.id));
      setProcesos(prev =>
        prev.map(p => ({
          ...p,
          censoElectoralTotal: empleados.length,
          votantesRegistrados: p.votantesRegistrados.filter(v => empIds.has(v.empleadoId))
        }))
      );
    }
  }, [empleados]);

  const [procesoIdActivo, setProcesoIdActivo] = useState<string>('elec-copasst-2026');

  // Selección en el tarjetón de votación
  const [candidatoSeleccionadoId, setCandidatoSeleccionadoId] = useState<string | null>(null);

  // Certificado activo para mostrar en modal o vista
  const [certificadoActivo, setCertificadoActivo] = useState<CertificadoVotoEmpleado | null>(null);

  // Modales administrativos
  const [modalActaAperturaOpen, setModalActaAperturaOpen] = useState(false);
  const [modalActaCierreOpen, setModalActaCierreOpen] = useState(false);

  // ID del empleado actualmente votando (permite al admin simular votar como otro empleado)
  const [voterEmpleadoId, setVoterEmpleadoId] = useState<string>(
    userRole === 'empleado' ? currentEmpleadoId : (empleados[0]?.id || '')
  );

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Proceso actualmente seleccionado
  const procesoActual = useMemo(() => {
    return procesos.find(p => p.id === procesoIdActivo) || procesos[0];
  }, [procesos, procesoIdActivo]);

  // Datos del empleado votante actual
  const empleadoVotante = useMemo(() => {
    return empleados.find(e => e.id === voterEmpleadoId) || empleados[0] || {
      id: voterEmpleadoId || 'usr-temp',
      nombre: 'Colaborador no registrado',
      documento: '—',
      email: '',
      salarioBase: 0,
      cargoId: ''
    };
  }, [empleados, voterEmpleadoId]);

  // Verificar si el votante actual ya sufragó en este proceso
  const votoRegistrado = useMemo(() => {
    return procesoActual.votantesRegistrados.find(v => v.empleadoId === voterEmpleadoId);
  }, [procesoActual, voterEmpleadoId]);

  // Escrutinio y cálculo de electos
  const escrutinio = useMemo(() => {
    const ordenados = [...procesoActual.candidatos].sort((a, b) => b.votosObtenidos - a.votosObtenidos);
    const principal = ordenados[0];
    const suplente = ordenados[1];
    const participacionPorcentaje =
      procesoActual.censoElectoralTotal > 0
        ? Math.round((procesoActual.totalVotosEmitidos / procesoActual.censoElectoralTotal) * 100)
        : 0;

    const quorumValido = participacionPorcentaje >= 50;

    return {
      candidatosOrdenados: ordenados,
      principalElecto: principal,
      suplenteElecto: suplente,
      participacionPorcentaje,
      quorumValido
    };
  }, [procesoActual]);

  // Acción: Emitir Voto
  const handleEmitirVoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidatoSeleccionadoId) {
      alert('Por favor seleccione una opción en el tarjetón electoral.');
      return;
    }

    if (votoRegistrado) {
      alert('Usted ya ha ejercido su voto en este proceso electoral.');
      return;
    }

    const codigoGenerado = `VOTO-${procesoActual.tipo === 'COPASST' ? 'COP' : 'CCL'}-2026-${voterEmpleadoId.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const fechaHora = new Date().toLocaleString('es-CO');

    // Actualizar proceso
    setProcesos(prev =>
      prev.map(proc => {
        if (proc.id === procesoActual.id) {
          const nuevosCandidatos = proc.candidatos.map(c => {
            if (c.id === candidatoSeleccionadoId) {
              return { ...c, votosObtenidos: c.votosObtenidos + 1 };
            }
            return c;
          });

          const nuevoBlanco = candidatoSeleccionadoId === 'BLANCO' ? proc.votosEnBlanco + 1 : proc.votosEnBlanco;

          return {
            ...proc,
            candidatos: nuevosCandidatos,
            votosEnBlanco: nuevoBlanco,
            totalVotosEmitidos: proc.totalVotosEmitidos + 1,
            votantesRegistrados: [
              ...proc.votantesRegistrados,
              {
                empleadoId: voterEmpleadoId,
                fechaHoraVoto: fechaHora,
                codigoCertificado: codigoGenerado
              }
            ]
          };
        }
        return proc;
      })
    );

    const certificado: CertificadoVotoEmpleado = {
      codigoCertificado: codigoGenerado,
      procesoId: procesoActual.id,
      tipoProceso: procesoActual.tipo,
      periodo: procesoActual.periodo,
      empleadoId: voterEmpleadoId,
      empleadoNombre: empleadoVotante.nombre,
      empleadoDocumento: empleadoVotante.documento,
      fechaHoraVoto: fechaHora,
      mesaVotacion: 'Mesa Digital Única - B GROUP INGENIERIA S.A.S.'
    };

    setCertificadoActivo(certificado);
    setCandidatoSeleccionadoId(null);
    showToast('¡Voto emitido y certificado generado con éxito!');
  };

  // Alternar apertura/cierre de urnas
  const handleToggleEstadoUrna = () => {
    setProcesos(prev =>
      prev.map(p => {
        if (p.id === procesoActual.id) {
          const nuevoEstado = p.estado === 'Abierta' ? 'Cerrada' : 'Abierta';
          return { ...p, estado: nuevoEstado };
        }
        return p;
      })
    );
    showToast(`Urna electoral ${procesoActual.estado === 'Abierta' ? 'cerrada' : 'reabierta'}.`);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-[#1E2A24] text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-lg border border-[#DCD6C8]/30 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#E2B765]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header General de Votaciones SST */}
      <div className="bg-white rounded-xl border border-[#DCD6C8] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2F5D50]/10 text-[#2F5D50] border border-[#2F5D50]/20 flex items-center gap-1">
                <Vote className="w-3.5 h-3.5" />
                Democracia Laboral & SG-SST
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F6F4EF] text-[#5B6A62] border border-[#DCD6C8]">
                Res. 2013/86 • Res. 652/12 • Res. 0312/19
              </span>
            </div>
            <h2 className="text-xl font-bold font-serif text-[#1E2A24]">
              Elecciones Electrónicas COPASST y Comité de Convivencia
            </h2>
            <p className="text-xs sm:text-sm text-[#5B6A62] mt-0.5 max-w-2xl">
              Proceso oficial de votación secreta y directa para la elección de los representantes de los trabajadores ante el Comité Paritario de SST y el Comité de Convivencia Laboral (Periodo 2026 - 2028).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            {/* Selector de Proceso Electoral */}
            <div className="bg-[#FAF8F5] p-1 rounded-lg border border-[#DCD6C8] flex text-xs font-semibold">
              <button
                onClick={() => {
                  setProcesoIdActivo('elec-copasst-2026');
                  setCandidatoSeleccionadoId(null);
                }}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  procesoIdActivo === 'elec-copasst-2026'
                    ? 'bg-[#2F5D50] text-white shadow-2xs'
                    : 'text-[#5B6A62] hover:text-[#1E2A24]'
                }`}
              >
                Elección COPASST
              </button>
              <button
                onClick={() => {
                  setProcesoIdActivo('elec-convivencia-2026');
                  setCandidatoSeleccionadoId(null);
                }}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  procesoIdActivo === 'elec-convivencia-2026'
                    ? 'bg-[#2F5D50] text-white shadow-2xs'
                    : 'text-[#5B6A62] hover:text-[#1E2A24]'
                }`}
              >
                Comité de Convivencia
              </button>
            </div>
          </div>
        </div>

        {/* Simulador rápido de votante para pruebas de usuario */}
        <div className="mt-5 pt-4 border-t border-[#DCD6C8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-[#FAF8F5] p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#2F5D50]" />
            <span className="font-semibold text-[#1E2A24]">
              Simular Votante Activo:
            </span>
            <select
              value={voterEmpleadoId}
              onChange={e => {
                setVoterEmpleadoId(e.target.value);
                setCandidatoSeleccionadoId(null);
              }}
              className="bg-white border border-[#DCD6C8] rounded px-2.5 py-1 text-xs text-[#1E2A24] font-medium"
            >
              {empleados.map(emp => {
                const yaVoto = procesoActual.votantesRegistrados.some(v => v.empleadoId === emp.id);
                return (
                  <option key={emp.id} value={emp.id}>
                    {emp.nombre} ({yaVoto ? 'Ya Votó' : 'Pendiente de Votar'})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="text-[11px] text-[#5B6A62]">
            {votoRegistrado ? (
              <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                Voto Registrado en este Proceso
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <Clock className="w-3 h-3 text-amber-700" />
                Habilitado para Votar Ahora
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: VISTA DE VOTACIÓN DEL EMPLEADO (TARJETÓN ELECTORAL) */}
      <div className="bg-white rounded-xl border border-[#DCD6C8] p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCD6C8] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#1E2A24] text-white">
                Tarjetón Electoral Oficial
              </span>
              <span className="text-xs font-semibold text-[#2F5D50]">
                {procesoActual.titulo}
              </span>
            </div>
            <div className="text-xs text-[#5B6A62] mt-1">
              Votante: <strong>{empleadoVotante.nombre}</strong> • CC: {empleadoVotante.documento} • Periodo {procesoActual.periodo}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
              procesoActual.estado === 'Abierta'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}>
              {procesoActual.estado === 'Abierta' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              Urna {procesoActual.estado}
            </span>
          </div>
        </div>

        {/* Si el colaborador YA VOTÓ en este proceso */}
        {votoRegistrado ? (
          <div className="p-6 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-4 text-center max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-emerald-950 font-serif">
                ¡Has ejercido tu derecho al voto con éxito!
              </h3>
              <p className="text-xs text-emerald-800 mt-1">
                Tu participación secreta ha sido registrada en el censo electoral con el código oficial de verificación:
              </p>
              <div className="inline-block font-mono text-xs font-bold bg-white px-3 py-1 rounded border border-emerald-300 mt-2 text-emerald-900">
                {votoRegistrado.codigoCertificado}
              </div>
              <div className="text-[11px] text-emerald-700 mt-1">
                Registrado el {votoRegistrado.fechaHoraVoto}
              </div>
            </div>

            <button
              onClick={() => {
                setCertificadoActivo({
                  codigoCertificado: votoRegistrado.codigoCertificado,
                  procesoId: procesoActual.id,
                  tipoProceso: procesoActual.tipo,
                  periodo: procesoActual.periodo,
                  empleadoId: voterEmpleadoId,
                  empleadoNombre: empleadoVotante.nombre,
                  empleadoDocumento: empleadoVotante.documento,
                  fechaHoraVoto: votoRegistrado.fechaHoraVoto,
                  mesaVotacion: 'Mesa Digital Única - B GROUP INGENIERIA S.A.S.'
                });
              }}
              className="px-4 py-2 bg-[#2F5D50] hover:bg-[#24493F] text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <FileCheck className="w-4 h-4" />
              <span>Ver e Imprimir Certificado Electoral</span>
            </button>
          </div>
        ) : procesoActual.estado !== 'Abierta' ? (
          <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center max-w-md mx-auto space-y-2">
            <Lock className="w-8 h-8 text-amber-700 mx-auto" />
            <h4 className="font-bold text-sm text-amber-900">La Urna se encuentra Cerrada</h4>
            <p className="text-xs text-amber-800">
              El proceso electoral ha finalizado o está en fase de escrutinio. Comuníquese con el jurado electoral de Gestión Humana.
            </p>
          </div>
        ) : (
          /* FORMULARIO DE VOTACIÓN ACTIVA (TARJETÓN) */
          <form onSubmit={handleEmitirVoto} className="space-y-4">
            <div className="text-xs text-[#5B6A62] bg-[#FAF8F5] p-3 rounded-lg border border-[#DCD6C8]">
              <strong>Instrucciones:</strong> Seleccione únicamente <strong>un (1) candidato</strong> o la opción de <strong>Voto en Blanco</strong> marcando la casilla correspondiente. Su voto es completamente confidencial y anónimo conforme a la ley colombiana.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {procesoActual.candidatos.length === 0 && (
                <div className="col-span-full p-6 bg-[#FAF8F5] border border-dashed border-[#DCD6C8] rounded-xl text-center">
                  <Vote className="w-8 h-8 text-[#2F5D50] mx-auto mb-2 opacity-70" />
                  <h4 className="font-bold text-sm text-[#1E2A24]">Urna de Producción Abierta</h4>
                  <p className="text-xs text-[#5B6A62] max-w-md mx-auto mt-1">
                    Los datos de prueba han sido limpiados. En cuanto se inscriban las planchas o candidatos oficiales de los trabajadores, aparecerán en este tarjetón.
                  </p>
                </div>
              )}
              {procesoActual.candidatos.map(cand => {
                const isSelected = candidatoSeleccionadoId === cand.id;
                return (
                  <div
                    key={cand.id}
                    onClick={() => setCandidatoSeleccionadoId(cand.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                      isSelected
                        ? 'border-[#2F5D50] bg-[#2F5D50]/5 ring-2 ring-[#2F5D50]/20 shadow-xs'
                        : 'border-[#DCD6C8] bg-white hover:border-[#2F5D50]/50 hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-[#1E2A24] text-white text-xs font-bold flex items-center justify-center">
                          {cand.numeroTarjeton}
                        </span>
                        <div>
                          <div className="font-bold text-xs text-[#1E2A24]">{cand.nombre}</div>
                          <div className="text-[10px] text-[#5B6A62]">{cand.cargo}</div>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected
                          ? 'border-[#2F5D50] bg-[#2F5D50] text-white'
                          : 'border-[#DCD6C8] bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>

                    <div className="text-[11px] text-[#5B6A62] bg-[#FAF8F5] p-2.5 rounded border border-[#DCD6C8]/60 mt-2 leading-relaxed">
                      <strong>Propuesta:</strong> {cand.propuesta}
                    </div>
                  </div>
                );
              })}

              {/* Opción VOTO EN BLANCO */}
              <div
                onClick={() => setCandidatoSeleccionadoId('BLANCO')}
                className={`p-4 rounded-xl border cursor-pointer transition-all relative flex flex-col justify-between ${
                  candidatoSeleccionadoId === 'BLANCO'
                    ? 'border-[#2F5D50] bg-[#2F5D50]/5 ring-2 ring-[#2F5D50]/20 shadow-xs'
                    : 'border-[#DCD6C8] bg-white hover:border-[#2F5D50]/50 hover:bg-[#FAF8F5]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-[#FAF8F5] border border-[#DCD6C8] text-[#1E2A24] text-xs font-bold flex items-center justify-center">
                        VB
                      </span>
                      <div>
                        <div className="font-bold text-xs text-[#1E2A24]">VOTO EN BLANCO</div>
                        <div className="text-[10px] text-[#5B6A62]">Opción legal reglamentaria</div>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      candidatoSeleccionadoId === 'BLANCO'
                        ? 'border-[#2F5D50] bg-[#2F5D50] text-white'
                        : 'border-[#DCD6C8] bg-white'
                    }`}>
                      {candidatoSeleccionadoId === 'BLANCO' && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <div className="text-[11px] text-[#5B6A62] bg-[#FAF8F5] p-2.5 rounded border border-[#DCD6C8]/60 mt-2 leading-relaxed">
                    Opción de desacuerdo o abstención con los candidatos postulados. Computa para quórum legal.
                  </div>
                </div>

                <div className="text-[10px] text-center text-[#8DA096] pt-2 font-medium">
                  Resolución 2013 de 1986
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#DCD6C8]">
              <button
                type="submit"
                disabled={!candidatoSeleccionadoId}
                className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  candidatoSeleccionadoId
                    ? 'bg-[#2F5D50] hover:bg-[#24493F] text-white shadow-xs cursor-pointer'
                    : 'bg-[#DCD6C8] text-[#8DA096] cursor-not-allowed'
                }`}
              >
                <Vote className="w-4 h-4" />
                <span>Confirmar y Depositar Voto Secreto</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* SECCIÓN 2: PANEL DE CONTROL Y ESCRUTINIO ADMINISTRATIVO */}
      <div className="bg-white rounded-xl border border-[#DCD6C8] p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCD6C8] pb-4">
          <div>
            <h3 className="font-bold text-base font-serif text-[#1E2A24] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#2F5D50]" />
              Escrutinio Oficial & Censo de Participación
            </h3>
            <p className="text-xs text-[#5B6A62] mt-0.5">
              Resultados en tiempo real, validación de quórum y actas oficiales de apertura y cierre para el MinTrabajo / ARL.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setModalActaAperturaOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-[#DCD6C8] text-xs font-semibold text-[#1E2A24] hover:bg-[#FAF8F5] flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-[#2F5D50]" />
              <span>Acta de Apertura</span>
            </button>

            <button
              onClick={() => setModalActaCierreOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-[#DCD6C8] text-xs font-semibold text-[#1E2A24] hover:bg-[#FAF8F5] flex items-center gap-1.5"
            >
              <Award className="w-3.5 h-3.5 text-[#B5842A]" />
              <span>Acta de Escrutinio y Cierre</span>
            </button>

            <button
              onClick={handleToggleEstadoUrna}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                procesoActual.estado === 'Abierta'
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {procesoActual.estado === 'Abierta' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{procesoActual.estado === 'Abierta' ? 'Cerrar Urna' : 'Reabrir Urna'}</span>
            </button>
          </div>
        </div>

        {/* Tarjetas de Métricas de Escrutinio */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-3.5 bg-[#FAF8F5] rounded-lg border border-[#DCD6C8]/70">
            <div className="text-[10px] font-semibold text-[#5B6A62] uppercase tracking-wider flex items-center justify-between">
              Censo Habilitado
              <Users className="w-3.5 h-3.5 text-[#2F5D50]" />
            </div>
            <div className="text-xl font-bold text-[#1E2A24] mt-0.5">
              {procesoActual.censoElectoralTotal} <span className="text-xs font-normal text-[#5B6A62]">votantes</span>
            </div>
            <div className="text-[10px] text-[#5B6A62]">Trabajadores con contrato vigente</div>
          </div>

          <div className="p-3.5 bg-[#FAF8F5] rounded-lg border border-[#DCD6C8]/70">
            <div className="text-[10px] font-semibold text-[#5B6A62] uppercase tracking-wider flex items-center justify-between">
              Votos Emitidos
              <Vote className="w-3.5 h-3.5 text-[#2F5D50]" />
            </div>
            <div className="text-xl font-bold text-[#2F5D50] mt-0.5">
              {procesoActual.totalVotosEmitidos}
            </div>
            <div className="text-[10px] text-[#5B6A62]">Sufragios depositados</div>
          </div>

          <div className="p-3.5 bg-[#FAF8F5] rounded-lg border border-[#DCD6C8]/70">
            <div className="text-[10px] font-semibold text-[#5B6A62] uppercase tracking-wider flex items-center justify-between">
              Participación
              <BarChart3 className="w-3.5 h-3.5 text-[#B5842A]" />
            </div>
            <div className="text-xl font-bold text-[#1E2A24] mt-0.5">
              {escrutinio.participacionPorcentaje}%
            </div>
            <div className="text-[10px] text-[#5B6A62]">Del total de la planta</div>
          </div>

          <div className="p-3.5 bg-[#FAF8F5] rounded-lg border border-[#DCD6C8]/70">
            <div className="text-[10px] font-semibold text-[#5B6A62] uppercase tracking-wider flex items-center justify-between">
              Quórum Legal
              <ShieldCheck className="w-3.5 h-3.5 text-[#2F5D50]" />
            </div>
            <div className="text-sm font-bold mt-1">
              {escrutinio.quorumValido ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Válido (≥ 50%)
                </span>
              ) : (
                <span className="text-amber-700 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> En curso (&lt; 50%)
                </span>
              )}
            </div>
            <div className="text-[10px] text-[#5B6A62]">Requisito de validez electoral</div>
          </div>
        </div>

        {/* Gráfico de Barras / Resultados por Candidato */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-[#1E2A24] uppercase tracking-wider">
            Votos Computados por Plancha / Candidato:
          </h4>

          <div className="space-y-2.5">
            {escrutinio.candidatosOrdenados.map((cand, idx) => {
              const pct =
                procesoActual.totalVotosEmitidos > 0
                  ? Math.round((cand.votosObtenidos / procesoActual.totalVotosEmitidos) * 100)
                  : 0;

              return (
                <div key={cand.id} className="p-3 bg-[#FAF8F5] rounded-lg border border-[#DCD6C8]/80 text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#1E2A24]">
                        #{cand.numeroTarjeton} {cand.nombre}
                      </span>
                      <span className="text-[10px] text-[#5B6A62]">({cand.cargo})</span>
                      {idx === 0 && cand.votosObtenidos > 0 && (
                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                          Principal Electo
                        </span>
                      )}
                      {idx === 1 && cand.votosObtenidos > 0 && (
                        <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                          Suplente Electo
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-[#1E2A24]">
                      {cand.votosObtenidos} votos <span className="text-[#5B6A62] font-normal">({pct}%)</span>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full h-2 bg-[#DCD6C8]/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2F5D50] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Votos en blanco */}
            <div className="p-3 bg-[#FAF8F5] rounded-lg border border-[#DCD6C8]/80 text-xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-bold text-[#5B6A62]">Voto en Blanco</span>
                <div className="font-bold text-[#5B6A62]">
                  {procesoActual.votosEnBlanco} votos (
                  {procesoActual.totalVotosEmitidos > 0
                    ? Math.round((procesoActual.votosEnBlanco / procesoActual.totalVotosEmitidos) * 100)
                    : 0}
                  %)
                </div>
              </div>
              <div className="w-full h-2 bg-[#DCD6C8]/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#8DA096] rounded-full"
                  style={{
                    width: `${
                      procesoActual.totalVotosEmitidos > 0
                        ? Math.round((procesoActual.votosEnBlanco / procesoActual.totalVotosEmitidos) * 100)
                        : 0
                    }%`
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabla del Censo Electoral de Trabajadores */}
        <div className="pt-3">
          <h4 className="text-xs font-bold text-[#1E2A24] uppercase tracking-wider mb-2">
            Registro del Censo Electoral y Constancias de Sufragio:
          </h4>

          <div className="overflow-x-auto border border-[#DCD6C8] rounded-lg">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#FAF8F5] text-[#5B6A62] border-b border-[#DCD6C8] text-[10px] font-semibold uppercase">
                  <th className="p-2.5">Trabajador Habilitado</th>
                  <th className="p-2.5">Documento</th>
                  <th className="p-2.5 text-center">Estado de Voto</th>
                  <th className="p-2.5">Fecha y Hora de Emisión</th>
                  <th className="p-2.5 text-right">Código Certificado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCD6C8]/60">
                {empleados.map(emp => {
                  const reg = procesoActual.votantesRegistrados.find(v => v.empleadoId === emp.id);
                  return (
                    <tr key={emp.id} className="hover:bg-[#FAF8F5]/50">
                      <td className="p-2.5 font-medium text-[#1E2A24]">{emp.nombre}</td>
                      <td className="p-2.5 text-[#5B6A62]">{emp.documento}</td>
                      <td className="p-2.5 text-center">
                        {reg ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[10px] border border-emerald-200">
                            Voto Emitido
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 text-[10px] border border-amber-200">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-[#5B6A62]">
                        {reg ? reg.fechaHoraVoto : '—'}
                      </td>
                      <td className="p-2.5 text-right font-mono text-[10px] text-[#2F5D50]">
                        {reg ? reg.codigoCertificado : '—'}
                      </td>
                    </tr>
                  );
                })}
                {empleados.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#5B6A62]">
                      <Users className="w-8 h-8 text-[#2F5D50] mx-auto mb-2 opacity-50" />
                      <p className="font-semibold text-sm text-[#1E2A24]">
                        No hay colaboradores en el censo electoral
                      </p>
                      <p className="text-xs text-[#5B6A62] max-w-md mx-auto mt-1">
                        La base de datos de producción está limpia. Registre o importe los colaboradores en el módulo de Empleados para habilitar el censo electoral con derecho a sufragio.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL CERTIFICADO DE VOTACIÓN */}
      {certificadoActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#DCD6C8] max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#DCD6C8] pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[#2F5D50]" />
                <h3 className="font-bold text-base text-[#1E2A24]">
                  Certificado Electoral de Votación SST
                </h3>
              </div>
              <button
                onClick={() => setCertificadoActivo(null)}
                className="text-[#5B6A62] hover:text-[#1E2A24]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificado con formato oficial imprimible */}
            <div className="p-5 border-2 border-[#2F5D50]/30 rounded-xl bg-[#FAF8F5] text-center space-y-3">
              <div className="text-xs font-bold tracking-widest text-[#2F5D50] uppercase">
                B GROUP INGENIERIA S.A.S. • SISTEMA DE GESTIÓN SST
              </div>

              <h4 className="text-base font-bold font-serif text-[#1E2A24]">
                CONSTANCIA DE SUFRAGIO ELECTORAL
              </h4>

              <div className="text-xs text-[#5B6A62] leading-relaxed max-w-md mx-auto">
                Se certifica formalmente que el(la) colaborador(a):
              </div>

              <div className="text-sm font-bold text-[#1E2A24]">
                {certificadoActivo.empleadoNombre}
              </div>
              <div className="text-xs text-[#5B6A62]">
                Cédula de Ciudadanía: <strong>{certificadoActivo.empleadoDocumento}</strong>
              </div>

              <p className="text-[11px] text-[#5B6A62] leading-relaxed pt-1">
                Ha ejercido su derecho y deber de votación libre, secreta y democrática para el{' '}
                <strong>{certificadoActivo.tipoProceso}</strong> correspondiente al periodo estatutario{' '}
                <strong>{certificadoActivo.periodo}</strong>, en cumplimiento de las Resoluciones 2013 de 1986, 652 de 2012 y 0312 de 2019.
              </p>

              <div className="pt-2 border-t border-[#DCD6C8] flex items-center justify-between text-left text-[10px] text-[#5B6A62]">
                <div>
                  <div><strong>Mesa:</strong> {certificadoActivo.mesaVotacion}</div>
                  <div><strong>Fecha/Hora:</strong> {certificadoActivo.fechaHoraVoto}</div>
                  <div><strong>Radicado:</strong> {certificadoActivo.codigoCertificado}</div>
                </div>
                <div className="w-12 h-12 bg-white border border-[#DCD6C8] rounded flex items-center justify-center text-[#2F5D50]">
                  <QrCode className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-[#2F5D50] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Certificado
              </button>
              <button
                onClick={() => setCertificadoActivo(null)}
                className="px-3.5 py-2 border border-[#DCD6C8] text-[#5B6A62] rounded-lg text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ACTA DE APERTURA */}
      {modalActaAperturaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#DCD6C8] max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-[#1E2A24]">
                Acta Oficial de Apertura del Proceso Electoral
              </h3>
              <button onClick={() => setModalActaAperturaOpen(false)}>
                <X className="w-5 h-5 text-[#5B6A62]" />
              </button>
            </div>

            <div className="text-xs space-y-3 text-[#5B6A62] leading-relaxed p-4 bg-[#FAF8F5] rounded-lg border">
              <div className="font-bold text-[#1E2A24] text-center border-b pb-2">
                ACTA DE APERTURA DE VOTACIONES - B GROUP INGENIERIA S.A.S.
              </div>
              <p>
                En la ciudad de Bogotá D.C., a las 08:00 horas del {procesoActual.fechaApertura}, se reunieron los jurados de votación designados por la Dirección de Gestión Humana y los representantes de los trabajadores para dar formal apertura al proceso electoral del <strong>{procesoActual.tipo} (Periodo {procesoActual.periodo})</strong>.
              </p>
              <p>
                Los jurados verificaron la urna digital electrónica encontrándola con contador en cero (0) votos y procedieron a validar el censo laboral compuesto por <strong>{procesoActual.censoElectoralTotal} trabajadores habilitados</strong>.
              </p>
              <div className="pt-2 font-semibold text-[#1E2A24]">
                Jurados Electorales Firmantes:
              </div>
              <ul className="list-disc pl-5">
                {procesoActual.juradosElectorales.map((j, idx) => (
                  <li key={idx}>{j}</li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-[#2F5D50] text-white rounded text-xs font-semibold flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Acta
              </button>
              <button
                onClick={() => setModalActaAperturaOpen(false)}
                className="px-3 py-1.5 border rounded text-xs text-[#5B6A62]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ACTA DE CIERRE Y ESCRUTINIO */}
      {modalActaCierreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-[#DCD6C8] max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-[#1E2A24]">
                Acta de Escrutinio y Declaración de Representantes Electos
              </h3>
              <button onClick={() => setModalActaCierreOpen(false)}>
                <X className="w-5 h-5 text-[#5B6A62]" />
              </button>
            </div>

            <div className="text-xs space-y-3 text-[#5B6A62] leading-relaxed p-4 bg-[#FAF8F5] rounded-lg border">
              <div className="font-bold text-[#1E2A24] text-center border-b pb-2">
                ACTA DE ESCRUTINIO FINAL - {procesoActual.tipo.toUpperCase()} 2026-2028
              </div>
              <p>
                Siendo las 17:00 horas, los jurados electorales procedieron al cierre de la urna digital y al cómputo y consolidación de los sufragios depositados por los trabajadores de B GROUP INGENIERIA S.A.S.
              </p>

              <div className="bg-white p-3 rounded border space-y-1">
                <div>• Total votos emitidos: <strong>{procesoActual.totalVotosEmitidos}</strong></div>
                <div>• Quórum alcanzado: <strong>{escrutinio.participacionPorcentaje}%</strong> (Válido conforme a la ley)</div>
                <div>• Votos en blanco: <strong>{procesoActual.votosEnBlanco}</strong></div>
              </div>

              <div className="pt-2 font-bold text-[#1E2A24]">
                Declaración Oficial de Ganadores:
              </div>

              <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-emerald-950 space-y-1">
                <div>
                  🏆 <strong>Representante Principal Electo:</strong>{' '}
                  {escrutinio.principalElecto?.nombre} ({escrutinio.principalElecto?.votosObtenidos} votos)
                </div>
                <div>
                  🥈 <strong>Representante Suplente Electo:</strong>{' '}
                  {escrutinio.suplenteElecto?.nombre} ({escrutinio.suplenteElecto?.votosObtenidos} votos)
                </div>
              </div>

              <div className="pt-4 grid grid-cols-2 gap-4 text-center text-[10px]">
                <div className="border-t pt-1">Firma Jurado Presidenta (GH)</div>
                <div className="border-t pt-1">Firma Veedor de los Trabajadores</div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-[#2F5D50] text-white rounded text-xs font-semibold flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Acta Final
              </button>
              <button
                onClick={() => setModalActaCierreOpen(false)}
                className="px-3 py-1.5 border rounded text-xs text-[#5B6A62]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
