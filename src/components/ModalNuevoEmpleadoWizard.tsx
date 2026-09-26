import React, { useState, useMemo } from 'react';
import {
  Cargo,
  Empleado,
  AreaOrganizacion,
  UsuarioSistema,
  PersonaEmpleado,
  ContactoResidenciaEmpleado,
  DatosLaboralesEmpleado,
  CompensacionEmpleado,
  SeguridadSocialEmpleado,
  EstudioAcademicoEmpleado,
  ExperienciaLaboralEmpleado,
  ExamenOcupacionalEmpleado,
  DocumentoExpedienteEmpleado,
  EventoHistorialLaboral,
  ProcesoOrganizacion
} from '../types';
import { obtenerParametrosConfigurados } from '../services/payrollEngine';
import {
  DEPARTAMENTOS_COLOMBIA,
  TIPOS_DOCUMENTO_COLOMBIA,
  EPS_COLOMBIA,
  AFP_COLOMBIA,
  ARL_COLOMBIA,
  NIVELES_RIESGO_ARL,
  CCF_COLOMBIA,
  CESANTIAS_COLOMBIA,
  BANCOS_COLOMBIA,
  TIPOS_CONTRATO_COLOMBIA,
  MODALIDADES_TRABAJO,
  JORNADAS_LABORALES,
  NIVELES_EDUCATIVOS,
  TIPOS_DOCUMENTOS_EXPEDIENTE,
  ESTADOS_CIVILES
} from '../data/colombiaData';
import {
  User,
  MapPin,
  Briefcase,
  Layers,
  DollarSign,
  ShieldCheck,
  GraduationCap,
  History,
  HardHat,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Lock,
  RefreshCw,
  Key,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Eye,
  Award,
  Upload,
  Calendar,
  Building,
  Check,
  X,
  Stethoscope,
  Edit3
} from 'lucide-react';
import { uid } from '../data/initialData';

interface ModalNuevoEmpleadoWizardProps {
  cargos: Cargo[];
  empleados: Empleado[];
  areas?: AreaOrganizacion[];
  procesos?: ProcesoOrganizacion[];
  currentUser?: UsuarioSistema | null;
  empleadoAEditar?: Empleado | null;
  onClose: () => void;
  onGuardar: (
    empleado: Empleado,
    opciones?: { crearUsuario?: boolean; passwordTemporal?: string }
  ) => Promise<void> | void;
  onVerExpediente?: (empleadoId: string) => void;
}

export const ModalNuevoEmpleadoWizard: React.FC<ModalNuevoEmpleadoWizardProps> = ({
  cargos,
  empleados,
  areas = [],
  procesos = [],
  currentUser,
  empleadoAEditar,
  onClose,
  onGuardar,
  onVerExpediente
}) => {
  const isEditing = Boolean(empleadoAEditar);

  // Pestaña activa (1 a 10)
  const [tabActual, setTabActual] = useState<number>(1);
  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [resumenExito, setResumenExito] = useState<Empleado | null>(null);

  // --- PESTAÑA 1: IDENTIFICACIÓN ---
  const [tipoDocumento, setTipoDocumento] = useState(empleadoAEditar?.persona?.tipoDocumento || empleadoAEditar?.tipoDocumento || 'CC');
  const [numeroDocumento, setNumeroDocumento] = useState(empleadoAEditar?.documento || '');
  const [primerNombre, setPrimerNombre] = useState(empleadoAEditar?.persona?.primerNombre || empleadoAEditar?.nombre.split(' ')[0] || '');
  const [segundoNombre, setSegundoNombre] = useState(empleadoAEditar?.persona?.segundoNombre || (empleadoAEditar?.nombre.split(' ').length > 2 ? empleadoAEditar?.nombre.split(' ')[1] : ''));
  const [primerApellido, setPrimerApellido] = useState(empleadoAEditar?.persona?.primerApellido || (empleadoAEditar?.nombre.split(' ').length > 1 ? empleadoAEditar?.nombre.split(' ').slice(-2, -1)[0] : ''));
  const [segundoApellido, setSegundoApellido] = useState(empleadoAEditar?.persona?.segundoApellido || (empleadoAEditar?.nombre.split(' ').length > 2 ? empleadoAEditar?.nombre.split(' ').slice(-1)[0] : ''));
  const [fechaNacimiento, setFechaNacimiento] = useState(empleadoAEditar?.persona?.fechaNacimiento || '1995-01-01');
  const [lugarNacimiento, setLugarNacimiento] = useState(empleadoAEditar?.persona?.lugarNacimiento || 'Bogotá D.C.');
  const [nacionalidad, setNacionalidad] = useState(empleadoAEditar?.persona?.nacionalidad || 'Colombiana');
  const [genero, setGenero] = useState(empleadoAEditar?.persona?.genero || 'Masculino');
  const [estadoCivil, setEstadoCivil] = useState(empleadoAEditar?.persona?.estadoCivil || 'Soltero(a)');
  const [fotoUrl, setFotoUrl] = useState(empleadoAEditar?.persona?.fotoUrl || '');

  // --- PESTAÑA 2: CONTACTO Y RESIDENCIA ---
  const [direccion, setDireccion] = useState(empleadoAEditar?.contacto?.direccion || '');
  const [departamento, setDepartamento] = useState(empleadoAEditar?.contacto?.departamento || 'Bogotá D.C.');
  const [ciudad, setCiudad] = useState(empleadoAEditar?.contacto?.ciudad || 'Bogotá D.C.');
  const [barrio, setBarrio] = useState(empleadoAEditar?.contacto?.barrio || '');
  const [codigoPostal, setCodigoPostal] = useState(empleadoAEditar?.contacto?.codigoPostal || '');
  const [telefonoFijo, setTelefonoFijo] = useState(empleadoAEditar?.contacto?.telefonoFijo || '');
  const [celular, setCelular] = useState(empleadoAEditar?.contacto?.celular || empleadoAEditar?.telefono || '');
  const [correoPersonal, setCorreoPersonal] = useState(empleadoAEditar?.contacto?.correoPersonal || '');
  const [correoCorporativo, setCorreoCorporativo] = useState(empleadoAEditar?.email || '');
  const [contactoEmergenciaNombre, setContactoEmergenciaNombre] = useState(empleadoAEditar?.contacto?.contactoEmergenciaNombre || '');
  const [contactoEmergenciaParentesco, setContactoEmergenciaParentesco] = useState(empleadoAEditar?.contacto?.contactoEmergenciaParentesco || '');
  const [contactoEmergenciaTelefono, setContactoEmergenciaTelefono] = useState(empleadoAEditar?.contacto?.contactoEmergenciaTelefono || '');

  // Municipios en cascada según departamento seleccionado
  const municipiosDisponibles = useMemo(() => {
    const depEncontrado = DEPARTAMENTOS_COLOMBIA.find(d => d.nombre === departamento);
    return depEncontrado ? depEncontrado.municipios : ['Bogotá D.C.'];
  }, [departamento]);

  // --- PESTAÑA 3: INFORMACIÓN LABORAL ---
  const generarCodigoSiguiente = () => {
    const numeros = empleados
      .map(e => {
        const m = (e.codigo || e.codigoInterno || '').match(/(\d+)$/);
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter(n => !isNaN(n));
    const max = numeros.length > 0 ? Math.max(...numeros) : 0;
    return `EMP-${String(max + 1).padStart(3, '0')}`;
  };

  const [codigoInterno, setCodigoInterno] = useState(
    empleadoAEditar?.codigo || empleadoAEditar?.codigoInterno || generarCodigoSiguiente()
  );
  const [fechaIngreso, setFechaIngreso] = useState(empleadoAEditar?.laboral?.fechaIngreso || empleadoAEditar?.contrato?.inicio || new Date().toISOString().slice(0, 10));
  const [fechaInicioLaboral, setFechaInicioLaboral] = useState(empleadoAEditar?.laboral?.fechaInicioLaboral || fechaIngreso);

  // Parámetros legales de nómina configurados
  const parametrosNominaConfig = useMemo(() => obtenerParametrosConfigurados(), []);
  const smmlvVigente = parametrosNominaConfig.smmlv || 1423500;
  const auxilioTransporteVigente = parametrosNominaConfig.auxilioTransporte || 200000;
  const topeAuxilioTransporte = smmlvVigente * (parametrosNominaConfig.topeSmmlvAuxilioTransporte || 2);

  const initialCargoId = empleadoAEditar?.cargoId || cargos[0]?.id || 'c1';
  const [cargoId, setCargoId] = useState(initialCargoId);

  // Conectar cargo con áreas creadas
  const resolverAreaInicial = (): string => {
    if (empleadoAEditar?.laboral?.areaId) return empleadoAEditar.laboral.areaId;
    if (empleadoAEditar?.areaId) return empleadoAEditar.areaId;
    const cObj = cargos.find(c => c.id === initialCargoId);
    if (cObj?.ficha?.identificacion?.area) {
      const match = areas.find(a =>
        a.id === cObj.ficha.identificacion.area ||
        a.nombre.toLowerCase().trim() === cObj.ficha.identificacion.area.toLowerCase().trim()
      );
      if (match) return match.id;
    }
    return areas[0]?.id || 'a1';
  };

  const [areaId, setAreaId] = useState(resolverAreaInicial);

  const handleCargoSelectChange = (nuevoCargoId: string) => {
    setCargoId(nuevoCargoId);
    const cObj = cargos.find(c => c.id === nuevoCargoId);
    if (cObj?.ficha?.identificacion?.area) {
      const match = areas.find(a =>
        a.id === cObj.ficha.identificacion.area ||
        a.nombre.toLowerCase().trim() === cObj.ficha.identificacion.area.toLowerCase().trim()
      );
      if (match) {
        setAreaId(match.id);
      }
    }
  };

  const handleAreaSelectChange = (nuevaAreaId: string) => {
    setAreaId(nuevaAreaId);
    const areaObj = areas.find(a => a.id === nuevaAreaId);
    if (areaObj) {
      const cargoMatch = cargos.find(c =>
        c.ficha?.identificacion?.area === areaObj.id ||
        (c.ficha?.identificacion?.area || '').toLowerCase().trim() === areaObj.nombre.toLowerCase().trim()
      );
      if (cargoMatch) {
        setCargoId(cargoMatch.id);
      }
    }
  };

  const [jefeInmediatoId, setJefeInmediatoId] = useState(empleadoAEditar?.laboral?.jefeInmediatoId || '');
  const [centroCostos, setCentroCostos] = useState(empleadoAEditar?.laboral?.centroCostos || 'CC-OPERACIONES');
  const [tipoContrato, setTipoContrato] = useState(empleadoAEditar?.laboral?.tipoContrato || empleadoAEditar?.contrato?.tipo || TIPOS_CONTRATO_COLOMBIA[0]);
  const [fechaInicioContrato, setFechaInicioContrato] = useState(empleadoAEditar?.laboral?.fechaInicioContrato || empleadoAEditar?.contrato?.inicio || fechaIngreso);
  const [fechaTerminacionContrato, setFechaTerminacionContrato] = useState(empleadoAEditar?.laboral?.fechaTerminacionContrato || empleadoAEditar?.contrato?.fin || '');

  // Jornada laboral legal vigente: 42 horas semanales (Ley 2101)
  const defaultJornada = JORNADAS_LABORALES[0] || 'Tiempo completo (42 hrs semanales - Ley 2101)';
  const [jornadaLaboral, setJornadaLaboral] = useState(() => {
    const j = empleadoAEditar?.laboral?.jornadaLaboral;
    if (!j || j.includes('46 hrs') || j.includes('47 hrs') || j.includes('48 hrs')) {
      return defaultJornada;
    }
    return j;
  });

  const [modalidadTrabajo, setModalidadTrabajo] = useState<'Presencial' | 'Híbrida' | 'Trabajo remoto' | 'Teletrabajo'>(
    empleadoAEditar?.laboral?.modalidadTrabajo || 'Presencial'
  );
  const [lugarTrabajo, setLugarTrabajo] = useState(empleadoAEditar?.laboral?.lugarTrabajo || 'Sede Central - Bogotá');
  const [estadoEmpleado, setEstadoEmpleado] = useState(
    (empleadoAEditar?.laboral?.estado || (empleadoAEditar?.activo === false ? 'Inactivo' : 'Activo')) as any
  );

  // --- PESTAÑA 4: CARGO Y ESTRUCTURA ORGANIZACIONAL ---
  const [subarea, setSubarea] = useState('Operaciones de Red FTTH');
  const [nivelJerarquico, setNivelJerarquico] = useState('Operativo / Técnico');
  const [fechaInicioCargo, setFechaInicioCargo] = useState(fechaIngreso);
  const [historialCargos, setHistorialCargos] = useState(empleadoAEditar?.historialCargos || []);

  // --- PESTAÑA 5: COMPENSACIÓN (Configurado con SMMLV de parámetros iniciales de nómina) ---
  const [salarioBasico, setSalarioBasico] = useState<number>(() => {
    if (empleadoAEditar?.compensacion?.salarioBasico && empleadoAEditar.compensacion.salarioBasico > 0) {
      return empleadoAEditar.compensacion.salarioBasico;
    }
    if (empleadoAEditar?.salarioBase && empleadoAEditar.salarioBase > 0) {
      return empleadoAEditar.salarioBase;
    }
    if (empleadoAEditar?.contrato?.salario) {
      const parsed = parseInt(empleadoAEditar.contrato.salario.replace(/\D/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return smmlvVigente;
  });
  const [tipoSalario, setTipoSalario] = useState(empleadoAEditar?.compensacion?.tipoSalario || 'Ordinario');
  const [periodicidadPago, setPeriodicidadPago] = useState<'Quincenal' | 'Mensual'>(empleadoAEditar?.compensacion?.periodicidadPago || 'Quincenal');
  const [auxilioTransporte, setAuxilioTransporte] = useState<boolean>(() => {
    if (empleadoAEditar?.compensacion !== undefined && empleadoAEditar.compensacion.auxilioTransporte !== undefined) {
      return empleadoAEditar.compensacion.auxilioTransporte;
    }
    return salarioBasico <= topeAuxilioTransporte;
  });
  const [bonificaciones, setBonificaciones] = useState<number>(empleadoAEditar?.compensacion?.bonificaciones || 0);
  const [comisiones, setComisiones] = useState<number>(empleadoAEditar?.compensacion?.comisiones || 0);
  const [formaPago, setFormaPago] = useState<'Transferencia bancaria' | 'Cheque' | 'Efectivo'>(empleadoAEditar?.compensacion?.formaPago || 'Transferencia bancaria');
  const [banco, setBanco] = useState(empleadoAEditar?.compensacion?.banco || BANCOS_COLOMBIA[0]);
  const [tipoCuenta, setTipoCuenta] = useState<'Ahorros' | 'Corriente'>(empleadoAEditar?.compensacion?.tipoCuenta || 'Ahorros');
  const [numeroCuenta, setNumeroCuenta] = useState(empleadoAEditar?.compensacion?.numeroCuenta || '');
  const [historialVigencias, setHistorialVigencias] = useState(empleadoAEditar?.compensacion?.historialVigencias || []);

  // --- PESTAÑA 6: SEGURIDAD SOCIAL ---
  const [eps, setEps] = useState(empleadoAEditar?.seguridadSocial?.eps || EPS_COLOMBIA[0]);
  const [fondoPensiones, setFondoPensiones] = useState(empleadoAEditar?.seguridadSocial?.fondoPensiones || AFP_COLOMBIA[0]);
  const [arl, setArl] = useState(empleadoAEditar?.seguridadSocial?.arl || ARL_COLOMBIA[0]);
  const [nivelRiesgoArl, setNivelRiesgoArl] = useState(empleadoAEditar?.seguridadSocial?.nivelRiesgoArl || 'V (6.960%)');
  const [cajaCompensacion, setCajaCompensacion] = useState(empleadoAEditar?.seguridadSocial?.cajaCompensacion || CCF_COLOMBIA[0]);
  const [fondoCesantias, setFondoCesantias] = useState(empleadoAEditar?.seguridadSocial?.fondoCesantias || CESANTIAS_COLOMBIA[0]);
  const [fechaAfiliacion, setFechaAfiliacion] = useState(empleadoAEditar?.seguridadSocial?.fechaAfiliacion || fechaIngreso);
  const [estadoAfiliacion, setEstadoAfiliacion] = useState<'Activa' | 'En trámite' | 'Retirada'>(empleadoAEditar?.seguridadSocial?.estadoAfiliacion || 'Activa');
  const [tipoAfiliacion, setTipoAfiliacion] = useState(empleadoAEditar?.seguridadSocial?.tipoAfiliacion || 'Cotizante Dependiente');

  // --- PESTAÑA 7: INFORMACIÓN ACADÉMICA ---
  const [estudios, setEstudios] = useState<EstudioAcademicoEmpleado[]>(
    empleadoAEditar?.estudios && empleadoAEditar.estudios.length > 0
      ? empleadoAEditar.estudios
      : [
          {
            id: uid(),
            nivelEducativo: 'Tecnólogo',
            programa: 'Telecomunicaciones y Redes Ópticas',
            tituloObtenido: 'Tecnólogo en Mantenimiento de Redes HFC y FTTH',
            institucion: 'SENA Regional Bogotá',
            ciudad: 'Bogotá D.C.',
            fechaInicio: '2020-02-01',
            fechaFin: '2022-11-30',
            fechaGraduacion: '2022-12-15',
            estado: 'Graduado',
            tarjetaProfesional: 'TP-98234-CST'
          }
        ]
  );

  // --- PESTAÑA 8: EXPERIENCIA LABORAL ---
  const [experiencias, setExperiencias] = useState<ExperienciaLaboralEmpleado[]>(
    empleadoAEditar?.experiencias && empleadoAEditar.experiencias.length > 0
      ? empleadoAEditar.experiencias
      : [
          {
            id: uid(),
            empresa: 'Soluciones Integrales de Conectividad SAS',
            cargo: 'Técnico de Cuadrilla FTTH',
            fechaIngreso: '2023-01-15',
            fechaRetiro: '2025-12-20',
            mesesExperiencia: 35,
            funcionesPrincipales: 'Instalación de acometidas de fibra óptica monomodo, fusión en NAP y manejo de OTDR y medidor de potencia.'
          }
        ]
  );

  // --- PESTAÑA 9: INFORMACIÓN SST ---
  const [examenesSst, setExamenesSst] = useState<ExamenOcupacionalEmpleado[]>(() => {
    if (empleadoAEditar?.sst?.examenesOcupacionales && empleadoAEditar.sst.examenesOcupacionales.length > 0) {
      return empleadoAEditar.sst.examenesOcupacionales;
    }
    if (estadoEmpleado === 'Preingreso') {
      return [
        {
          id: uid(),
          fecha: fechaIngreso || new Date().toISOString().slice(0, 10),
          tipoExamen: 'Ingreso',
          entidadIps: 'IPS Médica Laboral del Oriente SAS',
          conceptoAptitud: 'Pendiente',
          estado: 'Programado',
          recomendaciones: 'Programado para valoración de aptitud psicofísica y exámenes complementarios antes de inicio de labores.',
          confidencialMedico: true
        }
      ];
    }
    return [
      {
        id: uid(),
        fecha: fechaIngreso,
        tipoExamen: 'Ingreso',
        entidadIps: 'IPS Médica Laboral del Oriente SAS',
        conceptoAptitud: 'Apto',
        restricciones: 'Sin restricciones físicas ni biomecánicas para la labor.',
        recomendaciones: 'Uso obligatorio de EPP y pausas activas cada 2 horas.',
        fechaProximoExamen: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
        confidencialMedico: true
      }
    ];
  });
  const [restriccionesActivas, setRestriccionesActivas] = useState(empleadoAEditar?.sst?.restriccionesActivas || 'Ninguna');
  const [conceptoAptitudVigente, setConceptoAptitudVigente] = useState<'Apto' | 'Apto con recomendaciones' | 'Apto con restricciones' | 'No apto' | string>(() => {
    if (empleadoAEditar?.sst?.conceptoAptitudVigente) {
      return empleadoAEditar.sst.conceptoAptitudVigente;
    }
    return estadoEmpleado === 'Preingreso' ? 'Pendiente' : 'Apto';
  });

  // Estados para formulario manual de exámenes médicos ocupacionales (SST)
  const [mostrarFormExamenSst, setMostrarFormExamenSst] = useState(false);
  const [editExamenId, setEditExamenId] = useState<string | null>(null);
  const [formExamenTipo, setFormExamenTipo] = useState<string>('Ingreso');
  const [formExamenFecha, setFormExamenFecha] = useState<string>(fechaIngreso || new Date().toISOString().slice(0, 10));
  const [formExamenIps, setFormExamenIps] = useState<string>('IPS Médica Laboral del Oriente SAS');
  const [formExamenConcepto, setFormExamenConcepto] = useState<string>('Apto');
  const [formExamenRecomendaciones, setFormExamenRecomendaciones] = useState<string>('Mantener higiene postural, realizar pausas activas y uso continuo de EPP.');
  const [formExamenRestricciones, setFormExamenRestricciones] = useState<string>('');
  const [formExamenFechaProximo, setFormExamenFechaProximo] = useState<string>(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [formExamenMedico, setFormExamenMedico] = useState<string>('Dra. Claudia Marcela Gómez - Esp. SST');
  const [formExamenLicencia, setFormExamenLicencia] = useState<string>('Lic. SST-98234-Bogotá');

  const handleGuardarExamenManual = () => {
    if (!formExamenIps.trim()) return;

    if (editExamenId) {
      // Modificar examen existente
      setExamenesSst(prev => prev.map(ex => {
        if (ex.id !== editExamenId) return ex;
        return {
          ...ex,
          tipoExamen: formExamenTipo,
          fecha: formExamenFecha,
          entidadIps: formExamenIps.trim(),
          conceptoAptitud: formExamenConcepto as any,
          recomendaciones: formExamenRecomendaciones.trim(),
          restricciones: formExamenRestricciones.trim() || undefined,
          fechaProximoExamen: formExamenFechaProximo || undefined,
          medicoEvaluador: formExamenMedico.trim() || undefined,
          licenciaSst: formExamenLicencia.trim() || undefined
        };
      }));
    } else {
      // Agregar nuevo examen manual
      const nuevoEx: ExamenOcupacionalEmpleado = {
        id: uid(),
        fecha: formExamenFecha,
        tipoExamen: formExamenTipo,
        entidadIps: formExamenIps.trim(),
        conceptoAptitud: formExamenConcepto as any,
        recomendaciones: formExamenRecomendaciones.trim(),
        restricciones: formExamenRestricciones.trim() || undefined,
        fechaProximoExamen: formExamenFechaProximo || undefined,
        medicoEvaluador: formExamenMedico.trim() || undefined,
        licenciaSst: formExamenLicencia.trim() || undefined,
        confidencialMedico: true
      };
      setExamenesSst(prev => [nuevoEx, ...prev]);
    }

    // Actualizar restricciones activas y concepto vigente del colaborador automáticamente
    if (formExamenRestricciones.trim()) {
      setRestriccionesActivas(formExamenRestricciones.trim());
    }
    if (formExamenConcepto === 'Apto con restricciones') {
      setConceptoAptitudVigente('Apto con restricciones');
    } else if (formExamenConcepto === 'No apto') {
      setConceptoAptitudVigente('No apto');
    } else {
      setConceptoAptitudVigente('Apto');
    }

    // Resetear formulario
    setEditExamenId(null);
    setMostrarFormExamenSst(false);
  };

  const handleEditarExamenEnWizard = (ex: ExamenOcupacionalEmpleado) => {
    setEditExamenId(ex.id);
    setFormExamenTipo(ex.tipoExamen || 'Periódico');
    setFormExamenFecha(ex.fecha || new Date().toISOString().slice(0, 10));
    setFormExamenIps(ex.entidadIps || '');
    setFormExamenConcepto(ex.conceptoAptitud || 'Apto');
    setFormExamenRecomendaciones(ex.recomendaciones || '');
    setFormExamenRestricciones(ex.restricciones || '');
    setFormExamenFechaProximo(ex.fechaProximoExamen || '');
    setFormExamenMedico(ex.medicoEvaluador || '');
    setFormExamenLicencia(ex.licenciaSst || '');
    setMostrarFormExamenSst(true);
  };

  // --- PESTAÑA 10: DOCUMENTOS DEL EXPEDIENTE ---
  const [documentos, setDocumentos] = useState<DocumentoExpedienteEmpleado[]>(
    empleadoAEditar?.documentos && empleadoAEditar.documentos.length > 0
      ? empleadoAEditar.documentos
      : [
          {
            id: uid(),
            tipoDocumento: 'Documento de Identidad',
            nombreArchivo: `Cedula_${numeroDocumento || 'Colaborador'}.pdf`,
            fechaCarga: new Date().toISOString().slice(0, 10),
            usuarioCarga: currentUser?.nombre || 'Administrador GH',
            urlArchivo: '#',
            estado: 'Vigente',
            observaciones: 'Copia ampliada al 150% verificada con Registraduría'
          },
          {
            id: uid(),
            tipoDocumento: 'Contrato Laboral',
            nombreArchivo: `Contrato_${codigoInterno}.pdf`,
            fechaCarga: new Date().toISOString().slice(0, 10),
            usuarioCarga: currentUser?.nombre || 'Administrador GH',
            urlArchivo: '#',
            estado: 'Vigente',
            observaciones: 'Firmado digitalmente con constancia de recepción'
          }
        ]
  );

  // Nuevo documento temporal
  const [nuevoDocTipo, setNuevoDocTipo] = useState(TIPOS_DOCUMENTOS_EXPEDIENTE[0]);
  const [nuevoDocNombre, setNuevoDocNombre] = useState('');
  const [nuevoDocObs, setNuevoDocObs] = useState('');

  // Creación simultánea de usuario de sistema
  const [crearUsuarioSistema, setCrearUsuarioSistema] = useState(!isEditing);
  const [passwordTemporal, setPasswordTemporal] = useState('BGroup2026*');

  // Sugerir correo corporativo automáticamente
  const handleSugerirCorreo = () => {
    if (!primerNombre.trim() || !primerApellido.trim()) return;
    const cleanNombre = primerNombre.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cleanApellido = primerApellido.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const sugerido = `${cleanNombre}.${cleanApellido}@bgroup.com.co`;
    setCorreoCorporativo(sugerido);
  };

  // Autocalcular meses de experiencia
  const calcularMeses = (inicioStr: string, finStr: string) => {
    if (!inicioStr || !finStr) return 0;
    const d1 = new Date(inicioStr);
    const d2 = new Date(finStr);
    const diffMeses = (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth());
    return Math.max(1, diffMeses);
  };

  // Normalizar nombre completo
  const nombreCompletoNormalizado = useMemo(() => {
    return [primerNombre.trim(), segundoNombre.trim(), primerApellido.trim(), segundoApellido.trim()]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ');
  }, [primerNombre, segundoNombre, primerApellido, segundoApellido]);

  // Validación de unicidad de documento y código interno
  const validacionUnicidad = useMemo(() => {
    const docLimpio = (numeroDocumento || '').trim().replace(/\D/g, '');
    const existeDoc = empleados.find(
      e => e.id !== empleadoAEditar?.id && (e.documento || '').replace(/\D/g, '') === docLimpio && docLimpio.length > 0
    );
    const codLimpio = (codigoInterno || '').trim().toUpperCase();
    const existeCod = empleados.find(
      e => e.id !== empleadoAEditar?.id && (e.codigo || e.codigoInterno || '').toUpperCase() === codLimpio && codLimpio.length > 0
    );

    return {
      docDuplicado: Boolean(existeDoc),
      empleadoDocDuplicado: existeDoc,
      codDuplicado: Boolean(existeCod),
      empleadoCodDuplicado: existeCod
    };
  }, [numeroDocumento, codigoInterno, empleados, empleadoAEditar]);

  // Pestañas metadata
  const pestañas = [
    { num: 1, label: 'Identificación', icon: User },
    { num: 2, label: 'Contacto & Residencia', icon: MapPin },
    { num: 3, label: 'Información Laboral', icon: Briefcase },
    { num: 4, label: 'Estructura & Cargo', icon: Layers },
    { num: 5, label: 'Compensación', icon: DollarSign },
    { num: 6, label: 'Seguridad Social', icon: ShieldCheck },
    { num: 7, label: 'Información Académica', icon: GraduationCap },
    { num: 8, label: 'Experiencia Laboral', icon: History },
    { num: 9, label: 'Seguridad & Salud (SST)', icon: HardHat },
    { num: 10, label: 'Expediente Documental', icon: FileText }
  ];

  // Handler de guardado final
  const handleSubmitFinal = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setErrorValidacion(null);

    // 1. Normalización de Nombres y Apellidos
    let pNombre = primerNombre.trim();
    let sNombre = segundoNombre.trim();
    let pApellido = primerApellido.trim();
    let sApellido = segundoApellido.trim();

    // Si el usuario ingresó nombre completo en "Primer Nombre" y no colocó apellido
    if (pNombre && !pApellido) {
      const tokens = pNombre.split(/\s+/);
      if (tokens.length >= 2) {
        pNombre = tokens[0];
        pApellido = tokens.slice(1).join(' ');
      } else {
        pApellido = '—';
      }
      setPrimerNombre(pNombre);
      setPrimerApellido(pApellido);
    }

    const docLimpio = (numeroDocumento || '').trim().replace(/\D/g, '');
    if (!docLimpio) {
      setErrorValidacion('El número de documento de identidad es obligatorio. Por favor ingréselo en la Pestaña 1.');
      setTabActual(1);
      return;
    }
    if (validacionUnicidad.docDuplicado) {
      setErrorValidacion(`El documento ${numeroDocumento} ya se encuentra registrado con ${validacionUnicidad.empleadoDocDuplicado?.nombre}. Ingrese un número de documento diferente.`);
      setTabActual(1);
      return;
    }
    if (!pNombre) {
      setErrorValidacion('Debe ingresar el nombre del colaborador (Pestaña 1).');
      setTabActual(1);
      return;
    }

    // Auto-completar valores obligatorios con valores sensatos si faltan
    let codFinal = (codigoInterno || '').trim().toUpperCase();
    if (!codFinal) {
      codFinal = generarCodigoSiguiente();
      setCodigoInterno(codFinal);
    }
    if (validacionUnicidad.codDuplicado && !isEditing) {
      codFinal = `${codFinal}-${Math.floor(100 + Math.random() * 900)}`;
      setCodigoInterno(codFinal);
    }

    let fIngresoFinal = fechaIngreso || new Date().toISOString().slice(0, 10);
    if (!fechaIngreso) setFechaIngreso(fIngresoFinal);

    let fInicioLaboralFinal = fechaInicioLaboral || fIngresoFinal;
    if (!fechaInicioLaboral) setFechaInicioLaboral(fInicioLaboralFinal);

    let fInicioContratoFinal = fechaInicioContrato || fIngresoFinal;
    if (!fechaInicioContrato) setFechaInicioContrato(fInicioContratoFinal);

    let cargoFinal = cargoId || cargos[0]?.id || 'c1';
    if (!cargoId) setCargoId(cargoFinal);

    let areaFinal = areaId || areas[0]?.id || 'a1';
    if (!areaId) setAreaId(areaFinal);

    let contratoFinal = tipoContrato || TIPOS_CONTRATO_COLOMBIA[0] || 'Término indefinido';
    if (!tipoContrato) setTipoContrato(contratoFinal);

    if (fechaTerminacionContrato && fInicioContratoFinal && fechaTerminacionContrato < fInicioContratoFinal) {
      setErrorValidacion('La fecha de terminación del contrato no puede ser anterior a la fecha de inicio.');
      setTabActual(3);
      return;
    }

    setGuardando(true);
    try {
      const targetId = empleadoAEditar?.id || uid();
      const cargoSeleccionado = cargos.find(c => c.id === cargoFinal);
      const areaSeleccionada = areas.find(a => a.id === areaFinal);
      const jefeSeleccionado = empleados.find(e => e.id === jefeInmediatoId);

      const nombreFinal = [pNombre, sNombre, pApellido !== '—' ? pApellido : '', sApellido]
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ') || 'Nuevo Colaborador';

      // Evento de auditoría histórico
      const eventoRegistro: EventoHistorialLaboral = {
        id: uid(),
        fechaHora: new Date().toLocaleString('es-CO'),
        usuario: currentUser?.nombre || 'Administrador GH',
        accion: isEditing ? 'CAMBIO_DATOS' : 'CREACION',
        titulo: isEditing ? 'Actualización de Expediente Digital' : 'Vinculación y Creación de Expediente Digital',
        motivo: isEditing ? 'Actualización de ficha del trabajador' : 'Ingreso formal a la organización',
        valorAnterior: isEditing ? `Estado: ${empleadoAEditar?.estadoLaboral || 'Activo'}, Salario: $${empleadoAEditar?.salarioBase || 0}` : undefined,
        valorNuevo: `Estado: ${estadoEmpleado}, Cargo: ${cargoSeleccionado?.nombre || 'Cargo Asignado'}, Salario: $${salarioBasico.toLocaleString('es-CO')}`
      };

      const historialActualizado = [...(empleadoAEditar?.historialLaboral || []), eventoRegistro];

      let examenesFinales = [...examenesSst];
      let conceptoFinal = conceptoAptitudVigente;
      if (estadoEmpleado === 'Preingreso') {
        const tieneIngreso = examenesFinales.some(ex => (ex.tipoExamen || '').toLowerCase().includes('ingreso'));
        if (!tieneIngreso) {
          examenesFinales = [
            {
              id: uid(),
              fecha: fIngresoFinal,
              tipoExamen: 'Ingreso',
              entidadIps: formExamenIps || 'IPS Médica Laboral del Oriente SAS',
              conceptoAptitud: 'Pendiente',
              estado: 'Programado',
              recomendaciones: 'Programado para valoración médica ocupacional de ingreso previo a vinculación formal.',
              confidencialMedico: true
            },
            ...examenesFinales
          ];
        }
        const tieneRealizadoFavorable = examenesFinales.some(
          ex => ex.estado === 'Realizado' && (ex.conceptoAptitud === 'Apto' || (ex.conceptoAptitud || '').includes('restric') || (ex.conceptoAptitud || '').includes('recomenda'))
        );
        if (!tieneRealizadoFavorable && (conceptoFinal === 'Apto' || !conceptoFinal)) {
          conceptoFinal = 'Pendiente';
        }
      }

      const empleadoCompleto: Empleado = {
        id: targetId,
        empresaId: currentUser?.empresaId || 'empresa-a',
        codigo: codFinal,
        codigoInterno: codFinal,
        nombre: nombreFinal,
        documento: numeroDocumento.trim(),
        tipoDocumento,
        email: correoCorporativo.trim() || correoPersonal.trim(),
        telefono: celular.trim() || telefonoFijo.trim(),
        cargoId: cargoFinal,
        areaId: areaFinal,
        formacion: estudios[0]?.tituloObtenido || 'Formación Técnica / Profesional',
        experiencia: experiencias.map(e => `${e.cargo} en ${e.empresa}`).join(' • ') || 'Experiencia comprobada en telecomunicaciones',
        salarioBase: salarioBasico,
        contrato: {
          tipo: contratoFinal,
          inicio: fInicioContratoFinal,
          fin: fechaTerminacionContrato || '',
          salario: `$${salarioBasico.toLocaleString('es-CO')}`
        },
        familia: empleadoAEditar?.familia || [],
        activo: estadoEmpleado !== 'Inactivo' && estadoEmpleado !== 'Retirado',
        estadoLaboral: estadoEmpleado,
        fechaRetiro: estadoEmpleado === 'Retirado' ? (empleadoAEditar?.fechaRetiro || new Date().toISOString().slice(0, 10)) : '',

        // Subentidades conceptuales en expediente digital
        persona: {
          tipoDocumento,
          numeroDocumento: numeroDocumento.trim(),
          primerNombre: pNombre,
          segundoNombre: sNombre || '',
          primerApellido: pApellido,
          segundoApellido: sApellido || '',
          fechaNacimiento,
          lugarNacimiento,
          nacionalidad,
          genero,
          estadoCivil,
          fotoUrl: fotoUrl.trim() || ''
        },
        contacto: {
          direccion: direccion.trim(),
          departamento,
          ciudad,
          barrio: barrio.trim(),
          codigoPostal: codigoPostal.trim(),
          telefonoFijo: telefonoFijo.trim(),
          celular: celular.trim(),
          correoPersonal: correoPersonal.trim(),
          correoCorporativo: correoCorporativo.trim(),
          contactoEmergenciaNombre: contactoEmergenciaNombre.trim(),
          contactoEmergenciaParentesco: contactoEmergenciaParentesco.trim(),
          contactoEmergenciaTelefono: contactoEmergenciaTelefono.trim()
        },
        laboral: {
          codigoInterno: codFinal,
          fechaIngreso: fIngresoFinal,
          fechaInicioLaboral: fInicioLaboralFinal,
          areaId: areaFinal,
          areaNombre: areaSeleccionada?.nombre || 'Operaciones',
          cargoId: cargoFinal,
          cargoNombre: cargoSeleccionado?.nombre || 'Cargo Asignado',
          jefeInmediatoId,
          jefeInmediatoNombre: jefeSeleccionado?.nombre || '',
          centroCostos,
          tipoContrato: contratoFinal,
          fechaInicioContrato: fInicioContratoFinal,
          fechaTerminacionContrato: fechaTerminacionContrato || '',
          jornadaLaboral,
          modalidadTrabajo,
          lugarTrabajo,
          estado: estadoEmpleado
        },
        historialCargos,
        compensacion: {
          salarioBasico,
          tipoSalario,
          periodicidadPago,
          auxilioTransporte,
          bonificaciones,
          comisiones,
          formaPago,
          banco,
          tipoCuenta,
          numeroCuenta,
          historialVigencias
        },
        seguridadSocial: {
          eps,
          fondoPensiones,
          arl,
          nivelRiesgoArl: nivelRiesgoArl as any,
          cajaCompensacion,
          fondoCesantias,
          fechaAfiliacion,
          estadoAfiliacion,
          tipoAfiliacion
        },
        estudios,
        experiencias,
        sst: {
          examenesOcupacionales: examenesFinales,
          restriccionesActivas,
          conceptoAptitudVigente: conceptoFinal
        },
        documentos,
        historialLaboral: historialActualizado
      };

      await onGuardar(empleadoCompleto, {
        crearUsuario: crearUsuarioSistema && !isEditing,
        passwordTemporal: passwordTemporal || 'BGroup2026*'
      });

      setResumenExito(empleadoCompleto);
    } catch (err: any) {
      setErrorValidacion(err?.message || 'Error al persistir el expediente en el sistema.');
    } finally {
      setGuardando(false);
    }
  };

  // Agregar nuevo documento al expediente
  const handleAgregarDocumento = () => {
    if (!nuevoDocNombre.trim()) return;
    const nuevo: DocumentoExpedienteEmpleado = {
      id: uid(),
      tipoDocumento: nuevoDocTipo as any,
      nombreArchivo: nuevoDocNombre.trim(),
      fechaCarga: new Date().toISOString().slice(0, 10),
      usuarioCarga: currentUser?.nombre || 'Admin GH',
      urlArchivo: '#',
      estado: 'Vigente',
      observaciones: nuevoDocObs.trim() || undefined
    };
    setDocumentos(prev => [nuevo, ...prev]);
    setNuevoDocNombre('');
    setNuevoDocObs('');
  };

  // Pantalla de Resumen Exitoso
  if (resumenExito) {
    const cargoNombre = cargos.find(c => c.id === resumenExito.cargoId)?.nombre || 'Cargo Asignado';
    const areaNombre = areas.find(a => a.id === resumenExito.areaId)?.nombre || 'Área Organizacional';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#18235C]/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl border border-[#8FA7D6] max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-xl font-bold font-serif text-[#18235C]">
              {isEditing ? '¡Expediente Actualizado Exitosamente!' : '¡Empleado Registrado Exitosamente!'}
            </h3>
            <p className="text-xs text-[#282829] mt-1 max-w-md mx-auto">
              El expediente digital ha sido normalizado y sincronizado en la base de datos con trazabilidad histórica completa.
            </p>
          </div>

          {/* Tarjeta Resumen */}
          <div className="bg-slate-50 border border-[#8FA7D6] rounded-xl p-5 text-left grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-[#282829] uppercase font-bold block">Colaborador:</span>
              <strong className="text-sm text-[#18235C]">{resumenExito.nombre}</strong>
              <div className="text-[11px] text-[#282829] mt-0.5">
                {tipoDocumento}: <strong>{resumenExito.documento}</strong>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-[#282829] uppercase font-bold block">Código Interno:</span>
              <strong className="font-mono text-sm text-[#18235C] bg-white px-2 py-0.5 rounded border border-[#8FA7D6]">
                {resumenExito.codigo || resumenExito.codigoInterno}
              </strong>
            </div>

            <div>
              <span className="text-[10px] text-[#282829] uppercase font-bold block">Cargo & Área:</span>
              <div className="font-bold text-[#18235C]">{cargoNombre}</div>
              <div className="text-[#282829]">{areaNombre}</div>
            </div>

            <div>
              <span className="text-[10px] text-[#282829] uppercase font-bold block">Fecha Ingreso & Estado:</span>
              <div className="text-[#282829]">{resumenExito.laboral?.fechaIngreso || resumenExito.contrato.inicio}</div>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                {resumenExito.laboral?.estado || 'Activo'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                if (onVerExpediente) onVerExpediente(resumenExito.id);
                onClose();
              }}
              className="px-4 py-2.5 bg-[#18235C] hover:bg-[#101740] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Eye className="w-4 h-4 text-[#00FF00]" />
              <span>Ver Expediente Completo</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-[#8FA7D6] text-[#282829] text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              Finalizar y Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#18235C]/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#8FA7D6] max-w-5xl w-full my-6 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-fade-in">
        {/* Cabecera del Wizard */}
        <div className="bg-[#18235C] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#101740]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-500/20 text-[#00FF00] px-2 py-0.5 rounded border border-emerald-500/40">
                {isEditing ? 'Modificación de Expediente' : 'Nuevo Ingreso Laboral'}
              </span>
              <span className="text-[10px] text-[#8FA7D6]">
                Paso {tabActual} de 10 ({Math.round((tabActual / 10) * 100)}% completado)
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-serif">
              {isEditing ? `Expediente: ${nombreCompletoNormalizado || empleadoAEditar?.nombre}` : 'Expediente Digital Único del Empleado'}
            </h3>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleSubmitFinal()}
              disabled={guardando}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all disabled:opacity-50"
              title="Guardar todos los cambios del colaborador"
            >
              {guardando ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-[#00FF00]" />
                  <span>{isEditing ? 'Guardar Cambios' : 'Guardar Empleado'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white hover:bg-white/10 transition-colors text-lg font-bold cursor-pointer"
              title="Cerrar sin guardar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Barra de Progreso Superior */}
        <div className="w-full bg-slate-200 h-1.5">
          <div
            className="bg-[#00FF00] h-full transition-all duration-300"
            style={{ width: `${(tabActual / 10) * 100}%` }}
          />
        </div>

        {/* Barra de 10 Pestañas Navegables */}
        <div className="bg-slate-50 border-b border-[#8FA7D6] overflow-x-auto flex text-xs font-semibold scrollbar-thin">
          {pestañas.map(p => {
            const Icon = p.icon;
            const esActiva = tabActual === p.num;
            const esPasada = tabActual > p.num;

            return (
              <button
                key={p.num}
                type="button"
                onClick={() => setTabActual(p.num)}
                className={`px-3 py-2.5 whitespace-nowrap flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  esActiva
                    ? 'border-[#18235C] text-[#18235C] bg-white font-bold shadow-2xs'
                    : esPasada
                    ? 'border-transparent text-emerald-700 hover:text-[#18235C]'
                    : 'border-transparent text-[#282829]/70 hover:text-[#18235C]'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  esActiva
                    ? 'bg-[#18235C] text-white'
                    : esPasada
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-[#282829]'
                }`}>
                  {esPasada ? '✓' : p.num}
                </span>
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Banner de error de validación */}
        {errorValidacion && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorValidacion}</span>
          </div>
        )}

        {/* Cuerpo del Formulario por Pestañas */}
        <form onSubmit={handleSubmitFinal} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
          {/* ========================================================================= */}
          {/* PESTAÑA 1: IDENTIFICACIÓN */}
          {/* ========================================================================= */}
          {tabActual === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-[#8FA7D6]/40 pb-2">
                <h4 className="font-bold text-sm text-[#18235C] flex items-center gap-1.5">
                  <User className="w-4 h-4 text-[#18235C]" />
                  Datos Personales y de Identificación Ciudadana
                </h4>
                <p className="text-[11px] text-[#282829]">
                  Documento de identidad único, nombres oficiales y filiación legal en Colombia.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Tipo de Documento *</label>
                  <select
                    value={tipoDocumento}
                    onChange={e => setTipoDocumento(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold text-[#18235C]"
                  >
                    {TIPOS_DOCUMENTO_COLOMBIA.map(t => (
                      <option key={t.codigo} value={t.codigo}>{t.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Número de Documento *</label>
                  <input
                    type="text"
                    placeholder="Ej: 1019034789"
                    value={numeroDocumento}
                    onChange={e => setNumeroDocumento(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg font-mono font-bold ${
                      validacionUnicidad.docDuplicado
                        ? 'border-2 border-rose-500 bg-rose-50 text-rose-900'
                        : 'border border-[#8FA7D6] bg-slate-50 text-[#18235C]'
                    }`}
                  />
                  {validacionUnicidad.docDuplicado && (
                    <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                      ⚠️ Este documento ya está registrado ({validacionUnicidad.empleadoDocDuplicado?.nombre})
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Nacionalidad</label>
                  <input
                    type="text"
                    value={nacionalidad}
                    onChange={e => setNacionalidad(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Primer Nombre *</label>
                  <input
                    type="text"
                    placeholder="Carlos"
                    value={primerNombre}
                    onChange={e => setPrimerNombre(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Segundo Nombre</label>
                  <input
                    type="text"
                    placeholder="Andrés (opcional)"
                    value={segundoNombre}
                    onChange={e => setSegundoNombre(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Primer Apellido *</label>
                  <input
                    type="text"
                    placeholder="Mendivelso"
                    value={primerApellido}
                    onChange={e => setPrimerApellido(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Segundo Apellido</label>
                  <input
                    type="text"
                    placeholder="Castro (opcional)"
                    value={segundoApellido}
                    onChange={e => setSegundoApellido(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Fecha de Nacimiento</label>
                  <input
                    type="date"
                    value={fechaNacimiento}
                    onChange={e => setFechaNacimiento(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Lugar de Nacimiento</label>
                  <input
                    type="text"
                    placeholder="Ciudad / Municipio"
                    value={lugarNacimiento}
                    onChange={e => setLugarNacimiento(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Sexo / Género</label>
                  <select
                    value={genero}
                    onChange={e => setGenero(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  >
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro / Prefiero no decir</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Estado Civil</label>
                  <select
                    value={estadoCivil}
                    onChange={e => setEstadoCivil(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  >
                    {ESTADOS_CIVILES.map(ec => (
                      <option key={ec} value={ec}>{ec}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Foto o Avatar URL</label>
                  <input
                    type="text"
                    placeholder="https://... o en blanco para avatar oficial"
                    value={fotoUrl}
                    onChange={e => setFotoUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-[#18235C] flex items-center justify-between">
                <span>Nombre completo normalizado para expedición legal:</span>
                <strong className="font-bold text-sm">{nombreCompletoNormalizado || '—'}</strong>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 2: CONTACTO Y RESIDENCIA */}
          {/* ========================================================================= */}
          {tabActual === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-[#8FA7D6]/40 pb-2">
                <h4 className="font-bold text-sm text-[#18235C] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#18235C]" />
                  Ubicación Residencial, Contacto Personal y Corporativo
                </h4>
                <p className="text-[11px] text-[#282829]">
                  Dirección domiciliaria para notificación judicial y datos de contacto de emergencia.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div className="md:col-span-2">
                  <label className="block font-bold text-[#18235C] mb-1">Dirección de Residencia *</label>
                  <input
                    type="text"
                    placeholder="Calle 127 # 45 - 20 Apto 402"
                    value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Barrio</label>
                  <input
                    type="text"
                    placeholder="Prado Veraniego"
                    value={barrio}
                    onChange={e => setBarrio(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Departamento (Colombia) *</label>
                  <select
                    value={departamento}
                    onChange={e => {
                      const nuevoDep = e.target.value;
                      setDepartamento(nuevoDep);
                      const depObj = DEPARTAMENTOS_COLOMBIA.find(d => d.nombre === nuevoDep);
                      setCiudad(depObj?.municipios[0] || 'Bogotá D.C.');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold"
                  >
                    {DEPARTAMENTOS_COLOMBIA.map(d => (
                      <option key={d.nombre} value={d.nombre}>{d.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Ciudad / Municipio (Colombia) *</label>
                  <select
                    value={ciudad}
                    onChange={e => setCiudad(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold"
                  >
                    {municipiosDisponibles.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Código Postal</label>
                  <input
                    type="text"
                    placeholder="110111"
                    value={codigoPostal}
                    onChange={e => setCodigoPostal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Número de Celular *</label>
                  <input
                    type="text"
                    placeholder="318 000 0000"
                    value={celular}
                    onChange={e => setCelular(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Teléfono Fijo / Respaldo</label>
                  <input
                    type="text"
                    placeholder="601 000 0000"
                    value={telefonoFijo}
                    onChange={e => setTelefonoFijo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Correo Electrónico Personal *</label>
                  <input
                    type="email"
                    placeholder="personal@gmail.com"
                    value={correoPersonal}
                    onChange={e => setCorreoPersonal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                <div className="md:col-span-3 p-3.5 bg-slate-50 rounded-xl border border-[#8FA7D6] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[#18235C]">Correo Electrónico Corporativo Institucional:</label>
                    <button
                      type="button"
                      onClick={handleSugerirCorreo}
                      className="text-[11px] font-bold text-[#18235C] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 text-[#18235C]" />
                      <span>Generar según política corporativa</span>
                    </button>
                  </div>
                  <input
                    type="email"
                    placeholder="nombre.apellido@bgroup.com.co"
                    value={correoCorporativo}
                    onChange={e => setCorreoCorporativo(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#8FA7D6] rounded-lg font-semibold text-[#18235C]"
                  />
                </div>

                {/* Contacto de Emergencia */}
                <div className="md:col-span-3 p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 space-y-2.5">
                  <div className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-rose-700" />
                    <span>Contacto Autorizado en Caso de Emergencia (Obligatorio SG-SST)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-rose-900 mb-1">Nombre Completo:</label>
                      <input
                        type="text"
                        placeholder="Nombre del acudiente / contacto"
                        value={contactoEmergenciaNombre}
                        onChange={e => setContactoEmergenciaNombre(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-rose-900 mb-1">Parentesco:</label>
                      <input
                        type="text"
                        placeholder="Cónyuge, Madre, Padre, Hermano(a)"
                        value={contactoEmergenciaParentesco}
                        onChange={e => setContactoEmergenciaParentesco(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-rose-900 mb-1">Teléfono de Urgencias:</label>
                      <input
                        type="text"
                        placeholder="310 000 0000"
                        value={contactoEmergenciaTelefono}
                        onChange={e => setContactoEmergenciaTelefono(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 3: INFORMACIÓN LABORAL */}
          {/* ========================================================================= */}
          {tabActual === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-[#8FA7D6]/40 pb-2">
                <h4 className="font-bold text-sm text-[#18235C] flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-[#18235C]" />
                  Vinculación Laboral y Ciclo de Vida del Trabajador
                </h4>
                <p className="text-[11px] text-[#282829]">
                  Tipo de vinculación contractual, modalidad y centro de imputación de costos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Código Interno de Empleado *</label>
                  <input
                    type="text"
                    required
                    placeholder="EMP-001"
                    value={codigoInterno}
                    onChange={e => setCodigoInterno(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg font-mono font-bold ${
                      validacionUnicidad.codDuplicado
                        ? 'border-2 border-rose-500 bg-rose-50 text-rose-900'
                        : 'border border-[#8FA7D6] bg-slate-50 text-[#18235C]'
                    }`}
                  />
                  {validacionUnicidad.codDuplicado && (
                    <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                      ⚠️ Código ya asignado a {validacionUnicidad.empleadoCodDuplicado?.nombre}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Fecha de Ingreso a la Empresa *</label>
                  <input
                    type="date"
                    required
                    value={fechaIngreso}
                    onChange={e => {
                      setFechaIngreso(e.target.value);
                      if (!fechaInicioLaboral) setFechaInicioLaboral(e.target.value);
                      if (!fechaInicioContrato) setFechaInicioContrato(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Fecha de Inicio Laboral</label>
                  <input
                    type="date"
                    value={fechaInicioLaboral}
                    onChange={e => setFechaInicioLaboral(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Área / Dependencia *</label>
                  <select
                    value={areaId}
                    onChange={e => handleAreaSelectChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold"
                  >
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Cargo a Asignar *</label>
                  <select
                    value={cargoId}
                    onChange={e => handleCargoSelectChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
                  >
                    {cargos.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.ficha?.identificacion?.codigo || 'S/C'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Alineación interactiva con Manual de Funciones y Estructura Orgánica */}
                <div className="sm:col-span-2 md:col-span-3 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#18235C] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#18235C]" />
                        Alineación con Manual de Funciones & Organigrama
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#18235C] text-white">
                        {cargos.find(c => c.id === cargoId)?.ficha?.identificacion?.codigo || 'CAR-001'}
                      </span>
                    </div>
                    <span className="text-[11px] text-blue-900 font-semibold">
                      Proceso:{' '}
                      {(() => {
                        const a = areas.find(x => x.id === areaId);
                        const p = procesos.find(pr => pr.id === a?.procesoId);
                        return p?.nombre || a?.procesoNombre || 'Operativo / Misional';
                      })()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-white rounded-lg border border-blue-100">
                      <span className="font-bold text-[#18235C] block text-[11px]">Misión del Cargo (Manual de Funciones):</span>
                      <p className="text-[11px] text-slate-700 italic line-clamp-2 mt-0.5">
                        {cargos.find(c => c.id === cargoId)?.ficha?.proposito ||
                          'Garantizar la correcta ejecución de los procesos operacionales conforme a la normatividad y estándares de calidad.'}
                      </p>
                    </div>

                    <div className="p-2 bg-white rounded-lg border border-blue-100">
                      <span className="font-bold text-[#18235C] block text-[11px]">Perfil y Requisitos Mínimos:</span>
                      <div className="text-[11px] text-slate-700 space-y-0.5 mt-0.5">
                        <div>
                          <strong>Educación:</strong>{' '}
                          {cargos.find(c => c.id === cargoId)?.ficha?.requisitos?.formacion || 'Técnico o Tecnólogo en el área'}
                        </div>
                        <div>
                          <strong>Experiencia:</strong>{' '}
                          {cargos.find(c => c.id === cargoId)?.ficha?.requisitos?.experiencia || 'Mínimo 1 año en cargos similares'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Jefe Inmediato Directo</label>
                  <select
                    value={jefeInmediatoId}
                    onChange={e => setJefeInmediatoId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  >
                    <option value="">— Sin jefe asignado / Gerencia —</option>
                    {empleados.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.nombre} — {cargos.find(c => c.id === emp.cargoId)?.nombre || 'Cargo'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Tipo de Contrato *</label>
                  <select
                    value={tipoContrato}
                    onChange={e => setTipoContrato(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold"
                  >
                    {TIPOS_CONTRATO_COLOMBIA.map(tc => (
                      <option key={tc} value={tc}>{tc}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Fecha Inicio Contrato *</label>
                  <input
                    type="date"
                    required
                    value={fechaInicioContrato}
                    onChange={e => setFechaInicioContrato(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Fecha Terminación Contrato</label>
                  <input
                    type="date"
                    value={fechaTerminacionContrato}
                    onChange={e => setFechaTerminacionContrato(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                  <span className="text-[10px] text-[#282829] block mt-0.5">En blanco si es a término indefinido</span>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Jornada Laboral</label>
                  <select
                    value={jornadaLaboral}
                    onChange={e => setJornadaLaboral(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  >
                    {JORNADAS_LABORALES.map(j => (
                      <option key={j} value={j}>{j}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Modalidad de Trabajo</label>
                  <select
                    value={modalidadTrabajo}
                    onChange={e => setModalidadTrabajo(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold"
                  >
                    {MODALIDADES_TRABAJO.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Estado del Trabajador *</label>
                  <select
                    value={estadoEmpleado}
                    onChange={e => {
                      const val = e.target.value as any;
                      setEstadoEmpleado(val);
                      if (val === 'Preingreso' && !empleadoAEditar) {
                        setConceptoAptitudVigente('Pendiente');
                        setExamenesSst(prev => {
                          const tieneIngreso = prev.some(x => (x.tipoExamen || '').toLowerCase().includes('ingreso'));
                          if (!tieneIngreso) {
                            return [
                              {
                                id: uid(),
                                fecha: fechaIngreso || new Date().toISOString().slice(0, 10),
                                tipoExamen: 'Ingreso',
                                entidadIps: 'IPS Médica Laboral del Oriente SAS',
                                conceptoAptitud: 'Pendiente',
                                estado: 'Programado',
                                recomendaciones: 'Programado para valoración de aptitud psicofísica de ingreso.',
                                confidencialMedico: true
                              },
                              ...prev
                            ];
                          }
                          return prev;
                        });
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
                  >
                    <option value="Preingreso">Preingreso (Trámite de contratación)</option>
                    <option value="Activo">Activo (En funciones operativas)</option>
                    <option value="Vacaciones">Vacaciones (Disfrute de descanso legal)</option>
                    <option value="Licencia">Licencia (Maternidad / Luto / No remunerada)</option>
                    <option value="Suspensión">Suspensión (Medida disciplinaria)</option>
                    <option value="Inactivo">Inactivo (Temporalmente sin asignación)</option>
                    <option value="Retirado">Retirado (Contrato finalizado / Liquidado)</option>
                  </select>
                </div>

                {estadoEmpleado === 'Preingreso' && (
                  <div className="sm:col-span-2 md:col-span-3 p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 animate-fade-in shadow-xs">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <span className="font-bold text-sm text-amber-950 block">
                        Flujo de Preingreso & Conexión con Examen Médico SST:
                      </span>
                      <p className="text-[11px] text-amber-900 leading-relaxed">
                        Al encontrarse en etapa de <strong>Preingreso</strong>, se programará automáticamente la orden de <strong>Examen Médico de Ingreso (Preocupacional)</strong>. Podrá gestionar la remisión a la IPS y asentar los resultados clínicos (concepto, restricciones y recomendaciones) en el módulo de <strong>Exámenes Médicos SST</strong>, actualizando la Pestaña 9 del expediente y habilitando la promoción a <strong>Activo</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 4: CARGO Y ESTRUCTURA ORGANIZACIONAL */}
          {/* ========================================================================= */}
          {tabActual === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-[#8FA7D6]/40 pb-2">
                <h4 className="font-bold text-sm text-[#18235C] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#18235C]" />
                  Alineación con la Estructura Orgánica y Manual de Funciones
                </h4>
                <p className="text-[11px] text-[#282829]">
                  Posicionamiento en el organigrama empresarial e historial de promociones y traslados.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Cargo Vigente:</label>
                  <input
                    type="text"
                    disabled
                    value={cargos.find(c => c.id === cargoId)?.nombre || 'Cargo'}
                    className="w-full px-3 py-2 bg-slate-100 border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Código del Cargo:</label>
                  <input
                    type="text"
                    disabled
                    value={cargos.find(c => c.id === cargoId)?.ficha?.identificacion?.codigo || 'CAR-001'}
                    className="w-full px-3 py-2 bg-slate-100 border border-[#8FA7D6] rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Nivel Jerárquico</label>
                  <select
                    value={nivelJerarquico}
                    onChange={e => setNivelJerarquico(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  >
                    <option value="Estratégico / Directivo">Estratégico / Directivo</option>
                    <option value="Táctico / Coordinación">Táctico / Coordinación</option>
                    <option value="Operativo / Técnico">Operativo / Técnico</option>
                    <option value="Asistencial / Apoyo">Asistencial / Apoyo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Subárea o Sección</label>
                  <input
                    type="text"
                    value={subarea}
                    onChange={e => setSubarea(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Centro de Costos Imputado</label>
                  <input
                    type="text"
                    value={centroCostos}
                    onChange={e => setCentroCostos(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Fecha de Inicio en el Cargo</label>
                  <input
                    type="date"
                    value={fechaInicioCargo}
                    onChange={e => setFechaInicioCargo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>
              </div>

              {/* Registro Histórico de Cambios de Cargo */}
              <div className="p-4 bg-slate-50 rounded-xl border border-[#8FA7D6] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#18235C]">Historial de Cargos Anteriores en la Empresa:</span>
                  <span className="text-[11px] text-[#282829]">{historialCargos.length} movimientos</span>
                </div>
                {historialCargos.length === 0 ? (
                  <p className="text-[11px] text-[#282829] italic">
                    Este colaborador se encuentra en su cargo inicial de vinculación. Al cambiar de cargo desde la ficha, se conservará la trazabilidad automáticamente sin sobrescribir el historial.
                  </p>
                ) : (
                  <div className="divide-y divide-[#8FA7D6]/40">
                    {historialCargos.map((hc, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <strong>{hc.cargoNombre}</strong> ({hc.areaNombre})
                          <div className="text-[10px] text-[#282829]">Motivo: {hc.motivoCambio}</div>
                        </div>
                        <div className="text-right text-[11px] font-mono">
                          {hc.fechaInicio} ➔ {hc.fechaFin || 'Presente'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 5: COMPENSACIÓN */}
          {/* ========================================================================= */}
          {tabActual === 5 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-[#8FA7D6]/40 pb-2">
                <h4 className="font-bold text-sm text-[#18235C] flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-[#18235C]" />
                  Información Salarial, Prestacional y Dispersión Bancaria
                </h4>
                <p className="text-[11px] text-[#282829]">
                  Salario básico con manejo estricto de vigencias en el tiempo, auxilios y cuentas de nómina.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-[#18235C]">Salario Básico Mensual (COP) *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setSalarioBasico(smmlvVigente);
                        setAuxilioTransporte(true);
                      }}
                      className="text-[10px] text-blue-700 hover:text-blue-900 underline font-semibold cursor-pointer"
                    >
                      Asignar SMMLV
                    </button>
                  </div>
                  <input
                    type="number"
                    min={0}
                    required
                    value={salarioBasico}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setSalarioBasico(val);
                      if (val <= topeAuxilioTransporte) setAuxilioTransporte(true);
                      else setAuxilioTransporte(false);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono font-extrabold text-sm text-[#18235C]"
                  />
                  <div className="flex items-center justify-between text-[10px] text-[#282829] mt-0.5">
                    <span>${salarioBasico.toLocaleString('es-CO')} COP</span>
                    <span className="font-semibold text-emerald-800">
                      SMMLV Nómina: ${smmlvVigente.toLocaleString('es-CO')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Tipo de Salario</label>
                  <select
                    value={tipoSalario}
                    onChange={e => setTipoSalario(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold"
                  >
                    <option value="Ordinario">Ordinario (Con prestaciones de ley)</option>
                    <option value="Integral">Integral (≥ 13 SMMLV - Art. 132 CST)</option>
                    <option value="Por comisión">Por comisión / Destajo</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Periodicidad de Pago</label>
                  <select
                    value={periodicidadPago}
                    onChange={e => setPeriodicidadPago(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  >
                    <option value="Quincenal">Quincenal (Días 15 y 30)</option>
                    <option value="Mensual">Mensual (Fin de mes)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="chk-auxilio"
                    checked={auxilioTransporte}
                    onChange={e => setAuxilioTransporte(e.target.checked)}
                    className="w-4 h-4 rounded text-[#18235C]"
                  />
                  <label htmlFor="chk-auxilio" className="font-bold text-xs text-[#18235C] cursor-pointer">
                    Aplica Auxilio Legal de Transporte (Ley 15 de 1959)
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Bonificaciones Habituales</label>
                  <input
                    type="number"
                    min={0}
                    value={bonificaciones}
                    onChange={e => setBonificaciones(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Comisiones Promedio</label>
                  <input
                    type="number"
                    min={0}
                    value={comisiones}
                    onChange={e => setComisiones(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Forma de Pago de Nómina</label>
                  <select
                    value={formaPago}
                    onChange={e => setFormaPago(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold"
                  >
                    <option value="Transferencia bancaria">Transferencia Bancaria</option>
                    <option value="Cheque">Cheque de Gerencia</option>
                    <option value="Efectivo">Efectivo en Caja</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Entidad Bancaria</label>
                  <select
                    value={banco}
                    onChange={e => setBanco(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  >
                    {BANCOS_COLOMBIA.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Tipo de Cuenta</label>
                  <select
                    value={tipoCuenta}
                    onChange={e => setTipoCuenta(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  >
                    <option value="Ahorros">Cuenta de Ahorros</option>
                    <option value="Corriente">Cuenta Corriente</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block font-bold text-[#18235C] mb-1">Número de Cuenta para Dispersión PILA / ACH</label>
                  <input
                    type="text"
                    placeholder="Ej: 912-876543-21"
                    value={numeroCuenta}
                    onChange={e => setNumeroCuenta(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-mono font-bold text-[#18235C]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 6: SEGURIDAD SOCIAL */}
          {/* ========================================================================= */}
          {tabActual === 6 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-[#8FA7D6]/40 pb-2">
                <h4 className="font-bold text-sm text-[#18235C] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#18235C]" />
                  Afiliaciones a la Seguridad Social Integral (Ley 100 de 1993)
                </h4>
                <p className="text-[11px] text-[#282829]">
                  Registro de EPS, Fondo de Pensiones, ARL, Caja de Compensación Familiar y Fondo de Cesantías.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Entidad Promotora de Salud (EPS) *</label>
                  <select
                    value={eps}
                    onChange={e => setEps(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold text-[#18235C]"
                  >
                    {EPS_COLOMBIA.map(item => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Fondo de Pensiones (AFP) *</label>
                  <select
                    value={fondoPensiones}
                    onChange={e => setFondoPensiones(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold text-[#18235C]"
                  >
                    {AFP_COLOMBIA.map(item => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Administradora de Riesgos Laborales (ARL) *</label>
                  <select
                    value={arl}
                    onChange={e => setArl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold text-[#18235C]"
                  >
                    {ARL_COLOMBIA.map(item => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Nivel de Riesgo ARL (Decreto 1295 / 768) *</label>
                  <select
                    value={nivelRiesgoArl}
                    onChange={e => setNivelRiesgoArl(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
                  >
                    {NIVELES_RIESGO_ARL.map(nr => (
                      <option key={nr.nivel} value={nr.nivel}>Clase {nr.nivel} - {nr.descripcion}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Caja de Compensación Familiar (CCF) *</label>
                  <select
                    value={cajaCompensacion}
                    onChange={e => setCajaCompensacion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold"
                  >
                    {CCF_COLOMBIA.map(item => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Fondo de Cesantías *</label>
                  <select
                    value={fondoCesantias}
                    onChange={e => setFondoCesantias(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-semibold"
                  >
                    {CESANTIAS_COLOMBIA.map(item => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Fecha de Afiliación</label>
                  <input
                    type="date"
                    value={fechaAfiliacion}
                    onChange={e => setFechaAfiliacion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Estado de Afiliación</label>
                  <select
                    value={estadoAfiliacion}
                    onChange={e => setEstadoAfiliacion(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold text-emerald-800"
                  >
                    <option value="Activa">Activa</option>
                    <option value="En trámite">En trámite</option>
                    <option value="Retirada">Retirada</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Tipo de Cotizante PILA</label>
                  <input
                    type="text"
                    value={tipoAfiliacion}
                    onChange={e => setTipoAfiliacion(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 7: INFORMACIÓN ACADÉMICA */}
          {/* ========================================================================= */}
          {tabActual === 7 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-[#8FA7D6]/40 pb-2 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#18235C] flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#18235C]" />
                    Estudios, Títulos y Formación Profesional
                  </h4>
                  <p className="text-[11px] text-[#282829]">
                    Permite registrar múltiples títulos (técnico, profesional, posgrado) con soportes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEstudios(prev => [
                      ...prev,
                      {
                        id: uid(),
                        nivelEducativo: 'Profesional',
                        programa: '',
                        tituloObtenido: '',
                        institucion: '',
                        fechaInicio: '',
                        fechaFin: '',
                        estado: 'Graduado'
                      }
                    ]);
                  }}
                  className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#00FF00]" />
                  <span>Agregar Estudio</span>
                </button>
              </div>

              <div className="space-y-3">
                {estudios.map((est, idx) => (
                  <div key={est.id} className="p-3.5 rounded-xl border border-[#8FA7D6] bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#18235C]">Estudio #{idx + 1}</span>
                      {estudios.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setEstudios(prev => prev.filter(x => x.id !== est.id))}
                          className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#18235C] mb-1">Nivel Educativo</label>
                        <select
                          value={est.nivelEducativo}
                          onChange={e => {
                            const val = e.target.value;
                            setEstudios(prev => prev.map(x => x.id === est.id ? { ...x, nivelEducativo: val } : x));
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#8FA7D6] rounded text-xs"
                        >
                          {NIVELES_EDUCATIVOS.map(ne => (
                            <option key={ne} value={ne}>{ne}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#18235C] mb-1">Título Obtenido</label>
                        <input
                          type="text"
                          placeholder="Ingeniero de Telecomunicaciones"
                          value={est.tituloObtenido}
                          onChange={e => {
                            const val = e.target.value;
                            setEstudios(prev => prev.map(x => x.id === est.id ? { ...x, tituloObtenido: val } : x));
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#8FA7D6] rounded text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#18235C] mb-1">Institución Educativa</label>
                        <input
                          type="text"
                          placeholder="Universidad / SENA"
                          value={est.institucion}
                          onChange={e => {
                            const val = e.target.value;
                            setEstudios(prev => prev.map(x => x.id === est.id ? { ...x, institucion: val } : x));
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#8FA7D6] rounded text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#18235C] mb-1">Estado</label>
                        <select
                          value={est.estado}
                          onChange={e => {
                            const val = e.target.value as any;
                            setEstudios(prev => prev.map(x => x.id === est.id ? { ...x, estado: val } : x));
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#8FA7D6] rounded text-xs font-semibold"
                        >
                          <option value="Graduado">Graduado</option>
                          <option value="En curso">En curso</option>
                          <option value="Aplazado">Aplazado</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#18235C] mb-1">Tarjeta Profesional (si aplica)</label>
                        <input
                          type="text"
                          placeholder="TP-00000-CST"
                          value={est.tarjetaProfesional || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setEstudios(prev => prev.map(x => x.id === est.id ? { ...x, tarjetaProfesional: val } : x));
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#8FA7D6] rounded text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 8: EXPERIENCIA LABORAL */}
          {/* ========================================================================= */}
          {tabActual === 8 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-[#8FA7D6]/40 pb-2 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-[#18235C] flex items-center gap-1.5">
                    <History className="w-4 h-4 text-[#18235C]" />
                    Trayectoria Laboral y Experiencias Previas
                  </h4>
                  <p className="text-[11px] text-[#282829]">
                    Cálculo automático de experiencia acumulada en el sector.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setExperiencias(prev => [
                      ...prev,
                      {
                        id: uid(),
                        empresa: '',
                        cargo: '',
                        fechaIngreso: '',
                        fechaRetiro: '',
                        funcionesPrincipales: ''
                      }
                    ]);
                  }}
                  className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#00FF00]" />
                  <span>Agregar Experiencia</span>
                </button>
              </div>

              <div className="space-y-3">
                {experiencias.map((exp, idx) => (
                  <div key={exp.id} className="p-3.5 rounded-xl border border-[#8FA7D6] bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#18235C]">
                        Experiencia #{idx + 1} — {exp.mesesExperiencia ? `${Math.floor(exp.mesesExperiencia / 12)} años y ${exp.mesesExperiencia % 12} meses` : 'En cálculo'}
                      </span>
                      {experiencias.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setExperiencias(prev => prev.filter(x => x.id !== exp.id))}
                          className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-[#18235C] mb-1">Empresa</label>
                        <input
                          type="text"
                          placeholder="Nombre de la empresa"
                          value={exp.empresa}
                          onChange={e => {
                            const val = e.target.value;
                            setExperiencias(prev => prev.map(x => x.id === exp.id ? { ...x, empresa: val } : x));
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#8FA7D6] rounded text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#18235C] mb-1">Cargo Desempeñado</label>
                        <input
                          type="text"
                          placeholder="Cargo"
                          value={exp.cargo}
                          onChange={e => {
                            const val = e.target.value;
                            setExperiencias(prev => prev.map(x => x.id === exp.id ? { ...x, cargo: val } : x));
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#8FA7D6] rounded text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#18235C] mb-1">Fecha Ingreso</label>
                        <input
                          type="date"
                          value={exp.fechaIngreso}
                          onChange={e => {
                            const val = e.target.value;
                            const meses = calcularMeses(val, exp.fechaRetiro);
                            setExperiencias(prev => prev.map(x => x.id === exp.id ? { ...x, fechaIngreso: val, mesesExperiencia: meses } : x));
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#8FA7D6] rounded text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#18235C] mb-1">Fecha Retiro</label>
                        <input
                          type="date"
                          value={exp.fechaRetiro}
                          onChange={e => {
                            const val = e.target.value;
                            const meses = calcularMeses(exp.fechaIngreso, val);
                            setExperiencias(prev => prev.map(x => x.id === exp.id ? { ...x, fechaRetiro: val, mesesExperiencia: meses } : x));
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#8FA7D6] rounded text-xs"
                        />
                      </div>

                      <div className="md:col-span-4">
                        <label className="block text-[11px] font-bold text-[#18235C] mb-1">Funciones Principales</label>
                        <textarea
                          rows={2}
                          placeholder="Descripción resumida de actividades..."
                          value={exp.funcionesPrincipales}
                          onChange={e => {
                            const val = e.target.value;
                            setExperiencias(prev => prev.map(x => x.id === exp.id ? { ...x, funcionesPrincipales: val } : x));
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#8FA7D6] rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 9: INFORMACIÓN SST */}
          {/* ========================================================================= */}
          {tabActual === 9 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-[#8FA7D6]/40 pb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-[#18235C] flex items-center gap-1.5">
                    <HardHat className="w-4 h-4 text-[#18235C]" />
                    Información de Seguridad y Salud en el Trabajo (SG-SST)
                  </h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Confidencialidad Médica (Res. 2346 / 0312)
                  </span>
                </div>
                <p className="text-[11px] text-[#282829]">
                  Conceptos de aptitud psicofísica laboral, restricciones médicas e historial de exámenes ocupacionales.
                </p>
              </div>

              {estadoEmpleado === 'Preingreso' && (
                <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 animate-fade-in shadow-xs">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-amber-950 block">
                      Colaborador en Etapa de Preingreso — Examen Médico Ocupacional Programado:
                    </span>
                    <p className="text-[11px] text-amber-900 leading-relaxed">
                      El <strong>Examen Médico de Ingreso</strong> se encuentra programado. Tan pronto reciba el certificado de aptitud emitido por la IPS, puede asentar los resultados clínicos aquí o en el módulo <strong>Exámenes Médicos SST</strong>. Al registrar aptitud favorable, el expediente se habilitará para su paso formal a <strong>Activo</strong>.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Concepto de Aptitud Ocupacional Vigente</label>
                  <select
                    value={conceptoAptitudVigente}
                    onChange={e => setConceptoAptitudVigente(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg font-bold text-[#18235C]"
                  >
                    <option value="Pendiente">Pendiente de Examen de Ingreso / Valoración</option>
                    <option value="Apto">Apto (Sin restricciones para el cargo)</option>
                    <option value="Apto con recomendaciones">Apto con Recomendaciones (Medidas ergonómicas/preventivas)</option>
                    <option value="Apto con restricciones">Apto con Restricciones (Requiere adaptaciones)</option>
                    <option value="No apto">No Apto (Incompatible con el perfil de riesgo)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#18235C] mb-1">Restricciones Médicas / Laborales Activas</label>
                  <input
                    type="text"
                    placeholder="Ej: No realizar levantamiento de cargas superiores a 15 kg..."
                    value={restriccionesActivas}
                    onChange={e => setRestriccionesActivas(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-[#8FA7D6] rounded-lg"
                  />
                </div>
              </div>

              {/* Registro y Gestión Manual de Exámenes Médicos Ocupacionales */}
              <div className="p-4 bg-slate-50 rounded-xl border border-[#8FA7D6] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-[#18235C] block">
                      Exámenes Médicos Ocupacionales (Ingreso, Periódico, Retiro):
                    </span>
                    <span className="text-[11px] text-[#282829]">
                      Ingreso manual de IPS, concepto de aptitud, recomendaciones y restricciones laborales.
                    </span>
                  </div>
                  {!mostrarFormExamenSst && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditExamenId(null);
                        setFormExamenTipo('Ingreso');
                        setFormExamenFecha(fechaIngreso || new Date().toISOString().slice(0, 10));
                        setFormExamenIps('IPS Médica Laboral del Oriente SAS');
                        setFormExamenConcepto('Apto');
                        setFormExamenRecomendaciones('Mantener higiene postural, realizar pausas activas y uso continuo de EPP.');
                        setFormExamenRestricciones('');
                        setMostrarFormExamenSst(true);
                      }}
                      className="px-3 py-1.5 text-xs font-bold bg-[#18235C] hover:bg-[#101740] text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#00FF00]" />
                      <span>+ Ingresar Examen Manual</span>
                    </button>
                  )}
                </div>

                {/* Formulario manual interactivo */}
                {mostrarFormExamenSst && (
                  <div className="p-4 bg-white border-2 border-[#18235C]/30 rounded-xl space-y-3 animate-fade-in shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-xs text-[#18235C] flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-[#18235C]" />
                        {editExamenId ? 'Editar Examen Médico Ocupacional' : 'Ingresar Nuevo Examen Médico Manualmente'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditExamenId(null);
                          setMostrarFormExamenSst(false);
                        }}
                        className="text-slate-400 hover:text-slate-700 text-xs font-bold cursor-pointer"
                      >
                        ✕ Cancelar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="block text-[11px] font-bold text-[#18235C] mb-1">Tipo de Examen *</label>
                        <select
                          value={formExamenTipo}
                          onChange={e => setFormExamenTipo(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded text-xs font-bold text-[#18235C]"
                        >
                          <option value="Ingreso">Ingreso (Preocupacional)</option>
                          <option value="Periódico">Periódico Programado</option>
                          <option value="Retiro">Retiro / Egreso</option>
                          <option value="Posincapacidad">Posincapacidad / Reintegro</option>
                          <option value="Reubicación">Reubicación Laboral</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#18235C] mb-1">Fecha de Realización *</label>
                        <input
                          type="date"
                          value={formExamenFecha}
                          onChange={e => setFormExamenFecha(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#18235C] mb-1">Concepto de Aptitud *</label>
                        <select
                          value={formExamenConcepto}
                          onChange={e => setFormExamenConcepto(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded text-xs font-bold text-[#18235C]"
                        >
                          <option value="Apto">Apto (Sin restricciones)</option>
                          <option value="Apto con recomendaciones">Apto con recomendaciones</option>
                          <option value="Apto con restricciones">Apto con restricciones</option>
                          <option value="No apto">No apto</option>
                          <option value="Pendiente">Pendiente de valoración</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 md:col-span-3">
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-bold text-[#18235C]">
                            Entidad IPS Evaluadora (Nombre Manual de la IPS) *
                          </label>
                          <span className="text-[10px] text-slate-500">Escriba libremente la IPS autorizada</span>
                        </div>
                        <input
                          type="text"
                          required
                          placeholder="Ej: IPS Médica Laboral del Oriente SAS, Colsanitas Ocupacional..."
                          value={formExamenIps}
                          onChange={e => setFormExamenIps(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#8FA7D6] rounded text-xs font-semibold"
                        />
                      </div>

                      <div className="sm:col-span-2 md:col-span-3">
                        <label className="block text-[11px] font-bold text-[#18235C] mb-1">
                          Recomendaciones Médicas Ocupacionales *
                        </label>
                        <textarea
                          rows={2}
                          required
                          placeholder="Pausas activas cada 2 horas, hábitos posturales saludables, uso continuo de EPP, examen optométrico periódico..."
                          value={formExamenRecomendaciones}
                          onChange={e => setFormExamenRecomendaciones(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#8FA7D6] rounded text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2 md:col-span-3">
                        <label className="block text-[11px] font-bold text-[#18235C] mb-1">
                          Restricciones Laborales (si aplican)
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: No levantar cargas >15kg, evitar trabajo en alturas, limitar bipedestación prolongada..."
                          value={formExamenRestricciones}
                          onChange={e => setFormExamenRestricciones(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-[#8FA7D6] rounded text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#18235C] mb-1">Fecha Próximo Examen</label>
                        <input
                          type="date"
                          value={formExamenFechaProximo}
                          onChange={e => setFormExamenFechaProximo(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#18235C] mb-1">Médico Especialista SST</label>
                        <input
                          type="text"
                          placeholder="Dra. Claudia Marcela Gómez"
                          value={formExamenMedico}
                          onChange={e => setFormExamenMedico(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded text-xs"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#18235C] mb-1">Licencia SST</label>
                        <input
                          type="text"
                          placeholder="Lic. SST-98234-Bogotá"
                          value={formExamenLicencia}
                          onChange={e => setFormExamenLicencia(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-50 border border-[#8FA7D6] rounded text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setEditExamenId(null);
                          setMostrarFormExamenSst(false);
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleGuardarExamenManual}
                        disabled={!formExamenIps.trim()}
                        className="px-4 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5 text-[#00FF00]" />
                        <span>{editExamenId ? 'Actualizar Examen' : 'Guardar Examen en Expediente'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Lista de exámenes registrados con edición y eliminación */}
                <div className="space-y-2">
                  {examenesSst.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 italic bg-white rounded-lg border border-dashed border-slate-300">
                      No hay exámenes médicos registrados aún. Haga clic en "+ Ingresar Examen Manual" para registrar el examen de ingreso.
                    </div>
                  ) : (
                    examenesSst.map((ex, i) => (
                      <div key={ex.id || i} className="p-3 bg-white border border-[#8FA7D6]/60 rounded-xl text-xs space-y-2 hover:border-[#18235C] transition-colors shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#18235C]">
                              Examen #{i + 1} — {ex.tipoExamen}
                            </span>
                            <span className="font-mono text-slate-500 text-[11px]">({ex.fecha})</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              (ex.conceptoAptitud || '').includes('restric')
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : (ex.conceptoAptitud || '').includes('No')
                                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}>
                              {ex.conceptoAptitud || 'Apto'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditarExamenEnWizard(ex)}
                              className="p-1 text-amber-700 hover:bg-amber-50 rounded cursor-pointer"
                              title="Editar este examen"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setExamenesSst(prev => prev.filter(x => x.id !== ex.id))}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                              title="Eliminar este examen"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-[#282829] bg-slate-50 p-2 rounded-lg">
                          <div>
                            <strong>IPS Evaluadora:</strong> {ex.entidadIps || 'IPS Médica Laboral'}
                          </div>
                          {ex.fechaProximoExamen && (
                            <div>
                              <strong>Próximo Periódico:</strong> {ex.fechaProximoExamen}
                            </div>
                          )}
                          {ex.recomendaciones && (
                            <div className="sm:col-span-2">
                              <strong>Recomendaciones:</strong> {ex.recomendaciones}
                            </div>
                          )}
                          {ex.restricciones && (
                            <div className="sm:col-span-2 text-amber-800 font-medium">
                              <strong>Restricciones:</strong> {ex.restricciones}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PESTAÑA 10: EXPEDIENTE DOCUMENTAL */}
          {/* ========================================================================= */}
          {tabActual === 10 && (
            <div className="space-y-4 animate-fade-in">
              <div className="border-b border-[#8FA7D6]/40 pb-2">
                <h4 className="font-bold text-sm text-[#18235C] flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#18235C]" />
                  Expediente Digital del Trabajador y Gestión Documental
                </h4>
                <p className="text-[11px] text-[#282829]">
                  Repositorio digital con trazabilidad y fecha de vigencia de certificados y contratos.
                </p>
              </div>

              {/* Formulario para agregar soporte documental */}
              <div className="p-4 bg-slate-50 border border-[#8FA7D6] rounded-xl space-y-3">
                <span className="font-bold text-xs text-[#18235C]">Adjuntar Nuevo Documento al Expediente:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#18235C] mb-1">Tipo de Documento</label>
                    <select
                      value={nuevoDocTipo}
                      onChange={e => setNuevoDocTipo(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#8FA7D6] rounded text-xs"
                    >
                      {TIPOS_DOCUMENTOS_EXPEDIENTE.map(td => (
                        <option key={td} value={td}>{td}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#18235C] mb-1">Nombre o Título del Archivo</label>
                    <input
                      type="text"
                      placeholder="Ej: Certificado_SENA_2025.pdf"
                      value={nuevoDocNombre}
                      onChange={e => setNuevoDocNombre(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#8FA7D6] rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#18235C] mb-1">Observaciones / Radicado</label>
                    <input
                      type="text"
                      placeholder="Foliado / Verificado con original"
                      value={nuevoDocObs}
                      onChange={e => setNuevoDocObs(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#8FA7D6] rounded text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAgregarDocumento}
                    disabled={!nuevoDocNombre.trim()}
                    className="px-3 py-1.5 bg-[#18235C] hover:bg-[#101740] text-white rounded text-xs font-bold disabled:opacity-50 cursor-pointer"
                  >
                    + Vincular Documento
                  </button>
                </div>
              </div>

              {/* Lista de Documentos del Expediente */}
              <div className="space-y-2">
                <span className="font-bold text-xs text-[#18235C]">
                  Documentos Custodiados en el Expediente ({documentos.length}):
                </span>
                <div className="overflow-x-auto border border-[#8FA7D6] rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#18235C] text-white text-[11px]">
                      <tr>
                        <th className="p-2.5">Tipo Documento</th>
                        <th className="p-2.5">Nombre Archivo</th>
                        <th className="p-2.5">Fecha Carga</th>
                        <th className="p-2.5">Estado</th>
                        <th className="p-2.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#8FA7D6]/40">
                      {documentos.map(doc => (
                        <tr key={doc.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-[#18235C]">{doc.tipoDocumento}</td>
                          <td className="p-2.5 font-mono text-[11px] text-[#282829]">{doc.nombreArchivo}</td>
                          <td className="p-2.5 text-[#282829]">{doc.fechaCarga}</td>
                          <td className="p-2.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {doc.estado}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => setDocumentos(prev => prev.filter(x => x.id !== doc.id))}
                              className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                              title="Eliminar del expediente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Opción simultánea de usuario de sistema (solo en creación) */}
              {!isEditing && (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 space-y-3">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={crearUsuarioSistema}
                      onChange={e => setCrearUsuarioSistema(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-[#18235C]"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-[#18235C]">
                        Crear simultáneamente cuenta de usuario con Rol "Empleado"
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Habilita credenciales inmediatas para que el colaborador ingrese a sus capacitaciones, dotaciones y autoservicio.
                      </p>
                    </div>
                  </label>

                  {crearUsuarioSistema && (
                    <div className="pl-6 space-y-2">
                      <label className="block text-[11px] font-bold text-slate-700">Contraseña Inicial Temporal:</label>
                      <input
                        type="text"
                        value={passwordTemporal}
                        onChange={e => setPasswordTemporal(e.target.value)}
                        className="w-64 px-3 py-1.5 font-mono text-xs border border-blue-300 rounded bg-white"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Banner de error de validación en pie de modal */}
          {errorValidacion && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center justify-between gap-2 shadow-xs animate-fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{errorValidacion}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorValidacion(null)}
                className="text-rose-500 hover:text-rose-800 font-bold px-2 py-0.5"
                title="Descartar aviso"
              >
                ✕
              </button>
            </div>
          )}

          {/* Pie de navegación con botones Anterior / Siguiente / Guardar */}
          <div className="pt-4 border-t border-[#8FA7D6] flex flex-wrap items-center justify-between gap-3">
            <div>
              {tabActual > 1 && (
                <button
                  type="button"
                  onClick={() => setTabActual(prev => Math.max(1, prev - 1))}
                  className="px-4 py-2 border border-[#8FA7D6] text-[#18235C] font-bold text-xs rounded-lg hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Anterior</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-[#282829] font-semibold text-xs rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>

              {/* Botón Guardar disponible en cualquier pestaña */}
              <button
                type="button"
                onClick={() => handleSubmitFinal()}
                disabled={guardando}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-60 transition-colors"
                title="Guardar todos los cambios del colaborador en el expediente digital"
              >
                {guardando ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando Expediente...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-[#00FF00]" />
                    <span>{isEditing ? 'Guardar Cambios' : 'Guardar Empleado'}</span>
                  </>
                )}
              </button>

              {tabActual < 10 && (
                <button
                  type="button"
                  onClick={() => setTabActual(prev => Math.min(10, prev + 1))}
                  className="px-5 py-2 bg-[#18235C] hover:bg-[#101740] text-white font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <span>Siguiente Paso</span>
                  <ChevronRight className="w-4 h-4 text-[#00FF00]" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
