import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileText,
  PenTool,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  Download,
  Plus,
  ShieldCheck,
  Search,
  ExternalLink,
  Printer,
  RotateCcw,
  HardDrive,
  Wifi,
  Router,
  UserCheck,
  UserPlus,
  DollarSign,
  Send,
  FileDown,
  Filter,
  Sparkles,
  Check
} from 'lucide-react';
import { ContratoCliente, ClienteComercial, UsuarioSistema, ConfiguracionEmpresa } from '../../types';
import {
  obtenerContratosClientes,
  guardarContratoCliente,
  actualizarEstadoContratoCliente,
  obtenerClientesComerciales,
  guardarClienteComercial,
  generarHashSHA256,
  obtenerCarpetaDriveContratos,
  guardarCarpetaDriveContratos
} from '../../services/comercialService';
import { CorporateLogo } from '../CorporateLogo';
import { CodigoQRVerificacion } from '../CodigoQRVerificacion';
import { exportarContenedorAPDF } from '../../utils/pdfExport';

interface ContratosClientesViewProps {
  currentUser: UsuarioSistema;
  empresa?: ConfiguracionEmpresa;
}

const PLANES_CATALOGO_COMERCIAL = [
  {
    id: 'plan-hogar-200',
    nombre: 'Internet Residencial Fibra 200 Mbps Simétricos',
    tipoServicio: 'Internet Fijo FTTH' as const,
    tecnologia: 'Fibra Óptica GPON (FTTH)' as const,
    velocidadMbps: 200,
    tarifaBase: 95000,
    aplicaIva: false,
    equipoSugerido: 'Huawei EchoLife HG8145V5 Dual Band AC1200',
    valorEquipo: 320000
  },
  {
    id: 'plan-duo-300',
    nombre: 'Dúo Fibra Óptica 300 Mbps + Televisión Digital IPTV HD',
    tipoServicio: 'Dúo Internet + TV Digital' as const,
    tecnologia: 'Fibra Óptica GPON (FTTH)' as const,
    velocidadMbps: 300,
    tarifaBase: 135000,
    aplicaIva: false,
    equipoSugerido: 'Huawei EchoLife EG8145X6 Wi-Fi 6 + Deco IPTV 4K',
    valorEquipo: 450000
  },
  {
    id: 'plan-trio-400',
    nombre: 'Trío Fibra 400 Mbps + TV Digital HD + Telefonía IP Ilimitada',
    tipoServicio: 'Trío Internet + TV + Voz IP' as const,
    tecnologia: 'Fibra Óptica GPON (FTTH)' as const,
    velocidadMbps: 400,
    tarifaBase: 175000,
    aplicaIva: true,
    equipoSugerido: 'Huawei EchoLife EG8145X6 Wi-Fi 6 + ATA Voz IP',
    valorEquipo: 520000
  },
  {
    id: 'plan-pyme-500',
    nombre: 'Fibra Óptica Dedicada Empresarial 500 Mbps Simétrica + IP Fija',
    tipoServicio: 'Canal Dedicado Empresarial' as const,
    tecnologia: 'Fibra Dedicada MetroEthernet' as const,
    velocidadMbps: 500,
    tarifaBase: 850000,
    aplicaIva: true,
    equipoSugerido: 'MikroTik CCR2004-1G-12S+2XS + SFP+ 10G',
    valorEquipo: 1850000
  },
  {
    id: 'plan-radio-100',
    nombre: 'Radioenlace Microondas 100 Mbps Alta Disponibilidad Rural/Industrial',
    tipoServicio: 'Radioenlace Microondas' as const,
    tecnologia: 'Radioenlace Punto a Punto' as const,
    velocidadMbps: 100,
    tarifaBase: 420000,
    aplicaIva: true,
    equipoSugerido: 'Ubiquiti airMAX PowerBeam 5AC Gen2 + Router Wi-Fi',
    valorEquipo: 680000
  }
];

export const ContratosClientesView: React.FC<ContratosClientesViewProps> = ({
  currentUser,
  empresa
}) => {
  const [contratos, setContratos] = useState<ContratoCliente[]>([]);
  const [clientes, setClientes] = useState<ClienteComercial[]>([]);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [contratoVer, setContratoVer] = useState<ContratoCliente | null>(null);
  const [descargandoPdf, setDescargandoPdf] = useState(false);

  // Filtros de búsqueda y estado
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [filtroTipoServicio, setFiltroTipoServicio] = useState<string>('TODOS');
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);

  // Carpeta de Google Drive
  const [carpetaDrive, setCarpetaDrive] = useState(obtenerCarpetaDriveContratos());
  const [editandoDrive, setEditandoDrive] = useState(false);
  const [nuevaCarpetaDrive, setNuevaCarpetaDrive] = useState(carpetaDrive);

  // Modo de selección de usuario en el formulario: 'existente' | 'nuevo'
  const [modoUsuario, setModoUsuario] = useState<'existente' | 'nuevo'>('existente');
  const [clienteId, setClienteId] = useState('');

  // Datos del Suscriptor / Usuario (para modo nuevo o edición de datos de contrato)
  const [tipoIdentificacion, setTipoIdentificacion] = useState<'CC' | 'NIT' | 'CE' | 'Pasaporte' | 'PPT'>('CC');
  const [numeroIdentificacion, setNumeroIdentificacion] = useState('');
  const [nombreSuscriptor, setNombreSuscriptor] = useState('');
  const [telefonoSuscriptor, setTelefonoSuscriptor] = useState('');
  const [emailSuscriptor, setEmailSuscriptor] = useState('');
  const [ciudadInstalacion, setCiudadInstalacion] = useState('Bogotá D.C.');
  const [barrioVereda, setBarrioVereda] = useState('');
  const [direccionInstalacion, setDireccionInstalacion] = useState('');
  const [estrato, setEstrato] = useState<'1' | '2' | '3' | '4' | '5' | '6' | 'Comercial' | 'Industrial'>('3');

  // Especificaciones técnicas y plan
  const [tipoServicio, setTipoServicio] = useState<NonNullable<ContratoCliente['tipoServicio']>>('Internet Fijo FTTH');
  const [tecnologiaAcceso, setTecnologiaAcceso] = useState<NonNullable<ContratoCliente['tecnologiaAcceso']>>('Fibra Óptica GPON (FTTH)');
  const [planServicio, setPlanServicio] = useState('Internet Fibra Óptica 300 Mbps Dedicado');
  const [velocidadMbps, setVelocidadMbps] = useState(300);
  const [velocidadSubidaMbps, setVelocidadSubidaMbps] = useState(300);
  const [ipAsignada, setIpAsignada] = useState('190.144.20.15');
  const [nodoCajaNap, setNodoCajaNap] = useState('NAP-BOG-04 Pto 02');

  // Equipo en Comodato (ONT / Router)
  const [marcaModeloEquipo, setMarcaModeloEquipo] = useState('Huawei EchoLife EG8145X6 Wi-Fi 6');
  const [serialOnt, setSerialOnt] = useState('HWTC-884120A9');
  const [macAddress, setMacAddress] = useState('48:57:02:88:41:A9');
  const [valorReposicionEquipo, setValorReposicionEquipo] = useState(450000);

  // Condiciones Comerciales y Permanencia CRC
  const [tarifaMensual, setTarifaMensual] = useState(150000);
  const [aplicaIva, setAplicaIva] = useState(false);
  const [diaCorteMensual, setDiaCorteMensual] = useState(5);
  const [permanenciaMeses, setPermanenciaMeses] = useState(12);
  const [cargoConexionTotal, setCargoConexionTotal] = useState(240000);
  const [cargoConexionDescuento, setCargoConexionDescuento] = useState(240000);
  const [observacionesContrato, setObservacionesContrato] = useState(
    'Instalación incluye acometida de fibra óptica hasta 150 metros y configuración de red inalámbrica.'
  );

  // Autorizaciones Legales
  const [autorizaHabeasData, setAutorizaHabeasData] = useState(true);
  const [autorizaCentralesRiesgo, setAutorizaCentralesRiesgo] = useState(true);
  const [aceptaFacturaElectronica, setAceptaFacturaElectronica] = useState(true);

  // Firma Digital en Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dibujando, setDibujando] = useState(false);
  const [firmaCapturada, setFirmaCapturada] = useState<string | null>(null);
  const [firmaNombre, setFirmaNombre] = useState('');
  const [firmaCedula, setFirmaCedula] = useState('');

  const cargarDatos = async () => {
    const [cnts, cls] = await Promise.all([
      obtenerContratosClientes(),
      obtenerClientesComerciales()
    ]);
    setContratos(cnts);
    setClientes(cls);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Cálculos de IVA y Total Mensual
  const valorIvaCalculado = useMemo(() => {
    return aplicaIva ? Math.round(Number(tarifaMensual || 0) * 0.19) : 0;
  }, [tarifaMensual, aplicaIva]);

  const totalMensualCalculado = useMemo(() => {
    return Number(tarifaMensual || 0) + valorIvaCalculado;
  }, [tarifaMensual, valorIvaCalculado]);

  // Métricas Resumen del Módulo de Contratos de Usuarios
  const kpisContratos = useMemo(() => {
    const activosOFirmados = contratos.filter(c => c.estado === 'Activo' || c.estado === 'Firmado');
    const mrrTotal = activosOFirmados.reduce((acc, c) => acc + (c.totalMensualPagar || c.tarifaMensual || 0), 0);
    const conPermanencia = activosOFirmados.filter(c => (c.permanenciaMeses || 0) > 0).length;
    const conComodato = contratos.filter(c => Boolean(c.equipoComodato?.serialOnt)).length;
    return {
      total: contratos.length,
      activos: activosOFirmados.length,
      mrrTotal,
      conPermanencia,
      conComodato
    };
  }, [contratos]);

  // Manejo del Canvas de Firma
  const empezarDibujo = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDibujando(true);
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.moveTo(x, y);
  };

  const dibujar = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!dibujando) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#18235C';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const terminarDibujo = () => {
    if (!dibujando) return;
    setDibujando(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setFirmaCapturada(canvas.toDataURL('image/png'));
    }
  };

  const limpiarCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setFirmaCapturada(null);
  };

  // Generador de rúbrica caligráfica en el canvas para firma rápida en ventanilla
  const generarRubricaAutomatica = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const textoFirma = (firmaNombre || nombreSuscriptor || 'Usuario Suscriptor').trim();
    ctx.save();
    ctx.strokeStyle = '#18235C';
    ctx.fillStyle = '#18235C';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';

    // Trazo decorativo de rúbrica
    ctx.beginPath();
    ctx.moveTo(60, 115);
    ctx.bezierCurveTo(130, 45, 220, 135, 310, 65);
    ctx.bezierCurveTo(370, 30, 430, 105, 490, 75);
    ctx.stroke();

    // Texto cursivo del firmante
    ctx.font = 'italic bold 26px Georgia, serif';
    ctx.fillText(textoFirma.slice(0, 28), 75, 92);
    ctx.restore();

    setFirmaCapturada(canvas.toDataURL('image/png'));
  };

  const handleSeleccionarPlanCatalogo = (planId: string) => {
    const plan = PLANES_CATALOGO_COMERCIAL.find(p => p.id === planId);
    if (!plan) return;
    setPlanServicio(plan.nombre);
    setTipoServicio(plan.tipoServicio);
    setTecnologiaAcceso(plan.tecnologia);
    setVelocidadMbps(plan.velocidadMbps);
    setVelocidadSubidaMbps(plan.velocidadMbps);
    setTarifaMensual(plan.tarifaBase);
    setAplicaIva(plan.aplicaIva);
    setMarcaModeloEquipo(plan.equipoSugerido);
    setValorReposicionEquipo(plan.valorEquipo);
  };

  const handleSeleccionarClienteExistente = (idSeleccionado: string) => {
    setClienteId(idSeleccionado);
    const cli = clientes.find(c => c.id === idSeleccionado);
    if (cli) {
      setTipoIdentificacion(cli.tipoIdentificacion);
      setNumeroIdentificacion(cli.identificacion);
      setNombreSuscriptor(cli.nombre);
      setTelefonoSuscriptor(cli.telefono || '');
      setEmailSuscriptor(cli.email || '');
      setCiudadInstalacion(cli.ciudad || 'Bogotá D.C.');
      setDireccionInstalacion(cli.direccion || '');
      setPlanServicio(cli.planServicio || 'Internet Fibra Óptica 300 Mbps Dedicado');
      if (cli.velocidadMbps) {
        setVelocidadMbps(cli.velocidadMbps);
        setVelocidadSubidaMbps(cli.velocidadMbps);
      }
      setFirmaNombre(cli.nombre);
      setFirmaCedula(cli.identificacion);
    }
  };

  const handleCrearContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFormulario(null);

    let clienteFinal: ClienteComercial | undefined;

    if (modoUsuario === 'existente') {
      clienteFinal = clientes.find(c => c.id === clienteId);
      if (!clienteFinal) {
        setErrorFormulario('Debe seleccionar un cliente/usuario suscriptor de la lista o cambiar a "+ Registrar Nuevo Usuario".');
        return;
      }
    } else {
      const docLimpio = numeroIdentificacion.trim();
      const nomLimpio = nombreSuscriptor.trim();
      if (!docLimpio || !nomLimpio) {
        setErrorFormulario('Para registrar un nuevo usuario suscriptor debe completar el Número de Documento y el Nombre Completo.');
        return;
      }

      // El código del usuario es unívocamente su mismo número de documento de identidad
      const nuevoCli: ClienteComercial = {
        id: 'cli-' + Date.now(),
        codigo: docLimpio,
        nombre: nomLimpio,
        identificacion: docLimpio,
        tipoIdentificacion,
        direccion: direccionInstalacion.trim() || 'Dirección Principal',
        ciudad: ciudadInstalacion.trim() || 'Bogotá D.C.',
        telefono: telefonoSuscriptor.trim() || '3000000000',
        email: emailSuscriptor.trim() || 'usuario@cliente.co',
        planServicio,
        velocidadMbps: Number(velocidadMbps),
        saldoPendiente: 0,
        fechaVencimiento: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        estado: 'Al día',
        fechaCreacion: new Date().toISOString().slice(0, 10)
      };

      await guardarClienteComercial(nuevoCli);
      clienteFinal = nuevoCli;
    }

    if (!firmaCapturada) {
      setErrorFormulario('Por favor capture la firma digital del usuario en el recuadro interactivo (o use el botón de Rúbrica Caligráfica) antes de continuar.');
      return;
    }

    if (!autorizaHabeasData) {
      setErrorFormulario('El suscriptor debe autorizar el tratamiento de datos personales (Ley 1581 de 2012) para formalizar el contrato.');
      return;
    }

    const fechaHoy = new Date().toISOString();
    const codigoContrato = `CTR-TELCO-${new Date().getFullYear()}-${String(contratos.length + 1).padStart(4, '0')}`;
    const docUsuario = numeroIdentificacion.trim() || clienteFinal.identificacion;
    const nombreUsuario = nombreSuscriptor.trim() || clienteFinal.nombre;

    // Hash criptográfico de integridad bajo la Ley 527 de 1999
    const cadenaContrato = `${codigoContrato}|${docUsuario}|${totalMensualCalculado}|${fechaHoy}|${firmaCedula || docUsuario}`;
    const hash = await generarHashSHA256(cadenaContrato);

    const driveUrl = carpetaDrive.startsWith('http')
      ? carpetaDrive
      : `https://drive.google.com/drive/folders/${carpetaDrive}`;

    const nuevoContrato: ContratoCliente = {
      id: 'ctr-' + Date.now(),
      codigoContrato,
      clienteId: clienteFinal.id,
      clienteCodigo: docUsuario, // Mismo documento de identidad como código de usuario
      clienteNombre: nombreUsuario,
      clienteIdentificacion: docUsuario,
      clienteTipoIdentificacion: tipoIdentificacion,
      clienteTelefono: telefonoSuscriptor.trim() || clienteFinal.telefono,
      clienteEmail: emailSuscriptor.trim() || clienteFinal.email,
      ciudadInstalacion: ciudadInstalacion.trim() || clienteFinal.ciudad || 'Bogotá D.C.',
      barrioVereda: barrioVereda.trim() || 'Sector Urbano',
      estrato,
      fechaContrato: fechaHoy,
      fechaInicioFacturacion: new Date().toISOString().slice(0, 10),
      diaCorteMensual: Number(diaCorteMensual) || 5,
      tipoServicio,
      tecnologiaAcceso,
      planServicio,
      velocidadMbps: Number(velocidadMbps),
      velocidadSubidaMbps: Number(velocidadSubidaMbps || velocidadMbps),
      tarifaMensual: Number(tarifaMensual),
      aplicaIva,
      valorIva: valorIvaCalculado,
      totalMensualPagar: totalMensualCalculado,
      permanenciaMeses: Number(permanenciaMeses),
      cargoConexionTotal: Number(cargoConexionTotal),
      cargoConexionDescuento: Number(cargoConexionDescuento),
      direccionInstalacion: direccionInstalacion.trim() || clienteFinal.direccion,
      ipAsignada,
      nodoCajaNap,
      equipoComodato: {
        marcaModelo: marcaModeloEquipo,
        serialOnt: serialOnt.trim() || 'SN-PENDIENTE',
        macAddress: macAddress.trim() || '00:00:00:00:00:00',
        valorReposicion: Number(valorReposicionEquipo) || 350000
      },
      autorizaHabeasData,
      autorizaCentralesRiesgo,
      aceptaFacturaElectronica,
      firmaDigitalUrl: firmaCapturada,
      firmaNombre: firmaNombre.trim() || nombreUsuario,
      firmaCedula: firmaCedula.trim() || docUsuario,
      firmaFecha: fechaHoy,
      asesorComercialNombre: currentUser.nombre || currentUser.email,
      hashIntegridadSha256: hash,
      carpetaDriveId: carpetaDrive,
      urlCarpetaDrive: driveUrl,
      estado: 'Activo',
      archivoContratoDriveUrl: `${driveUrl}?file=${codigoContrato}_${docUsuario}.pdf`,
      observaciones: observacionesContrato.trim()
    };

    await guardarContratoCliente(nuevoContrato);
    setModalNuevo(false);
    limpiarCanvas();
    await cargarDatos();
    setContratoVer(nuevoContrato);
  };

  const handleCambiarEstado = async (contratoId: string, nuevoEstado: ContratoCliente['estado']) => {
    await actualizarEstadoContratoCliente(contratoId, nuevoEstado);
    await cargarDatos();
    if (contratoVer && contratoVer.id === contratoId) {
      setContratoVer({ ...contratoVer, estado: nuevoEstado });
    }
  };

  const handleGuardarDriveConfig = () => {
    guardarCarpetaDriveContratos(nuevaCarpetaDrive);
    setCarpetaDrive(nuevaCarpetaDrive);
    setEditandoDrive(false);
  };

  const handleDescargarContratoPdf = async (contrato: ContratoCliente) => {
    setDescargandoPdf(true);
    try {
      await exportarContenedorAPDF(
        'documento-contrato-crc-imprimible',
        `Contrato_Usuario_${contrato.codigoContrato}_${contrato.clienteIdentificacion}`
      );
    } finally {
      setDescargandoPdf(false);
    }
  };

  const handleEnviarWhatsAppContrato = (contrato: ContratoCliente) => {
    const telLimpio = (contrato.clienteTelefono || '').replace(/\D/g, '');
    const numeroDestino = telLimpio.startsWith('57') ? telLimpio : telLimpio ? `57${telLimpio}` : '';
    const mensaje = [
      `*${empresa?.nombreComercial || 'B GROUP INGENIERIA S.A.S.'}*`,
      `✅ *CONSTANCIA DE CONTRATO DE USUARIO (CRC)*`,
      `• *Radicado:* ${contrato.codigoContrato}`,
      `• *Suscriptor:* ${contrato.clienteNombre}`,
      `• *Código / Doc. Usuario:* ${contrato.clienteIdentificacion}`,
      `• *Plan Contratado:* ${contrato.planServicio} (${contrato.velocidadMbps} Mbps)`,
      `• *Dirección Instalación:* ${contrato.direccionInstalacion} (${contrato.ciudadInstalacion || 'Bogotá D.C.'})`,
      `• *Valor Mensual:* $${(contrato.totalMensualPagar || contrato.tarifaMensual).toLocaleString('es-CO')} COP`,
      `• *Equipo ONT Comodato:* ${contrato.equipoComodato?.marcaModelo || 'ONT Fibra'} (S/N: ${contrato.equipoComodato?.serialOnt || 'N/A'})`,
      `• *Sello SHA-256 (Ley 527/1999):* ${contrato.hashIntegridadSha256.slice(0, 16)}...`,
      `• *Repositorio Drive:* ${contrato.urlCarpetaDrive || ''}`
    ].join('\n');

    const url = `https://wa.me/${numeroDestino}?text=${encodeURIComponent(mensaje)}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportarCsvContratos = () => {
    const headers = [
      'Codigo_Contrato',
      'Codigo_Usuario_Documento',
      'Tipo_Doc',
      'Suscriptor_Nombre',
      'Telefono',
      'Email',
      'Ciudad',
      'Barrio',
      'Direccion_Instalacion',
      'Estrato',
      'Tipo_Servicio',
      'Plan_Contratado',
      'Velocidad_Mbps',
      'Tarifa_Base_COP',
      'IVA_COP',
      'Total_Mensual_COP',
      'Permanencia_Meses',
      'Serial_ONT_Comodato',
      'Caja_NAP',
      'IP_Asignada',
      'Estado',
      'Fecha_Firma',
      'Hash_SHA256'
    ];

    const filas = contratosFiltrados.map(c => [
      `"${c.codigoContrato}"`,
      `"${c.clienteCodigo || c.clienteIdentificacion}"`,
      `"${c.clienteTipoIdentificacion || 'CC'}"`,
      `"${(c.clienteNombre || '').replace(/"/g, '""')}"`,
      `"${c.clienteTelefono || ''}"`,
      `"${c.clienteEmail || ''}"`,
      `"${c.ciudadInstalacion || 'Bogotá D.C.'}"`,
      `"${c.barrioVereda || ''}"`,
      `"${(c.direccionInstalacion || '').replace(/"/g, '""')}"`,
      `"${c.estrato || '3'}"`,
      `"${c.tipoServicio || 'Internet Fijo FTTH'}"`,
      `"${(c.planServicio || '').replace(/"/g, '""')}"`,
      c.velocidadMbps,
      c.tarifaMensual,
      c.valorIva || 0,
      c.totalMensualPagar || c.tarifaMensual,
      c.permanenciaMeses,
      `"${c.equipoComodato?.serialOnt || ''}"`,
      `"${c.nodoCajaNap || ''}"`,
      `"${c.ipAsignada || ''}"`,
      `"${c.estado}"`,
      `"${c.fechaContrato}"`,
      `"${c.hashIntegridadSha256}"`
    ].join(','));

    const csvContent = '\uFEFF' + [headers.join(','), ...filas].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Contratos_Usuarios_Cimiento_Comercial_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const contratosFiltrados = useMemo(() => {
    return contratos.filter(c => {
      if (filtroEstado !== 'TODOS' && c.estado !== filtroEstado) return false;
      if (filtroTipoServicio !== 'TODOS' && (c.tipoServicio || 'Internet Fijo FTTH') !== filtroTipoServicio) return false;

      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase();
      return (
        c.codigoContrato.toLowerCase().includes(q) ||
        c.clienteNombre.toLowerCase().includes(q) ||
        c.clienteIdentificacion.toLowerCase().includes(q) ||
        (c.clienteCodigo && c.clienteCodigo.toLowerCase().includes(q)) ||
        c.planServicio.toLowerCase().includes(q) ||
        (c.direccionInstalacion && c.direccionInstalacion.toLowerCase().includes(q)) ||
        (c.equipoComodato?.serialOnt && c.equipoComodato.serialOnt.toLowerCase().includes(q)) ||
        (c.nodoCajaNap && c.nodoCajaNap.toLowerCase().includes(q))
      );
    });
  }, [contratos, busqueda, filtroEstado, filtroTipoServicio]);

  return (
    <div className="space-y-6">
      {/* ENCABEZADO DEL MÓDULO DE CONTRATOS DE USUARIOS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#18235C] text-[#F59E0B] border border-[#8FA7D6]/40 flex items-center justify-center shadow-sm shrink-0">
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-[#18235C]">
                Módulo de Contratos de Usuarios & Suscriptores (Formato CRC)
              </h2>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                Res. CRC 5111 / Ley 527 de 1999
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Gestión integral de contratos de servicios fijos FTTH/Telecomunicaciones, comodato de equipos ONT, cláusula de permanencia mínima y firma digital sincronizada con Google Drive. El <strong>Código Único del Usuario</strong> corresponde a su <strong>Documento de Identidad / NIT</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full lg:w-auto shrink-0">
          <button
            type="button"
            onClick={handleExportarCsvContratos}
            className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Exportar matriz de contratos de usuarios a CSV / Excel"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setErrorFormulario(null);
              setModalNuevo(true);
            }}
            className="flex-1 lg:flex-initial px-4 py-2.5 rounded-xl bg-[#18235C] hover:bg-[#1E3A8A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F59E0B]" />
            <span>Nuevo Contrato de Usuario</span>
          </button>
        </div>
      </div>

      {/* TARJETAS KPI DEL MÓDULO DE CONTRATOS DE USUARIOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Contratos Registrados</span>
            <span className="text-xl font-black text-[#18235C]">{kpisContratos.total}</span>
            <span className="text-[11px] text-emerald-600 font-semibold block">
              {kpisContratos.activos} activos / firmados
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Facturación Mensual (MRR)</span>
            <span className="text-xl font-black text-emerald-700 font-mono">
              ${kpisContratos.mrrTotal.toLocaleString('es-CO')}
            </span>
            <span className="text-[11px] text-slate-500 block">Recaudo recurrente contratado</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Permanencia Mínima CRC</span>
            <span className="text-xl font-black text-slate-800">{kpisContratos.conPermanencia}</span>
            <span className="text-[11px] text-amber-700 font-semibold block">Suscriptores con cláusula vigente</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
            <Router className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Equipos ONT en Comodato</span>
            <span className="text-xl font-black text-slate-800">{kpisContratos.conComodato}</span>
            <span className="text-[11px] text-sky-700 font-semibold block">Seriales y MAC inventariados</span>
          </div>
        </div>
      </div>

      {/* BANNER DE SINCRONIZACIÓN CON CARPETA INSTITUCIONAL DE GOOGLE DRIVE */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs shrink-0">
            <FolderOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <span className="font-bold text-blue-900 block">
              Repositorio Institucional de Contratos de Usuarios en Google Drive:
            </span>
            {editandoDrive ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={nuevaCarpetaDrive}
                  onChange={e => setNuevaCarpetaDrive(e.target.value)}
                  placeholder="ID o Enlace de Carpeta Drive..."
                  className="px-2.5 py-1 bg-white border border-blue-300 rounded-lg text-xs font-mono w-72"
                />
                <button
                  type="button"
                  onClick={handleGuardarDriveConfig}
                  className="px-3 py-1 bg-blue-600 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                >
                  Guardar
                </button>
              </div>
            ) : (
              <p className="text-slate-600 font-mono text-[11px] truncate max-w-md">
                {carpetaDrive}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!editandoDrive && (
            <button
              type="button"
              onClick={() => setEditandoDrive(true)}
              className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
            >
              Cambiar Carpeta
            </button>
          )}
          <a
            href={carpetaDrive.startsWith('http') ? carpetaDrive : `https://drive.google.com/drive/folders/${carpetaDrive}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-blue-300 text-blue-800 font-bold hover:bg-blue-50 shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir en Google Drive</span>
          </a>
        </div>
      </div>

      {/* TABLA Y FILTROS DE CONTRATOS DE USUARIOS */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por código/documento de usuario, suscriptor, contrato, serial ONT o NAP..."
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-[#18235C]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={filtroEstado}
                onChange={e => setFiltroEstado(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="Activo">Estado: Activo</option>
                <option value="Firmado">Estado: Firmado</option>
                <option value="En Instalación">Estado: En Instalación</option>
                <option value="Suspendido">Estado: Suspendido</option>
                <option value="Cancelado">Estado: Cancelado</option>
              </select>

              <select
                value={filtroTipoServicio}
                onChange={e => setFiltroTipoServicio(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700"
              >
                <option value="TODOS">Todos los Servicios</option>
                <option value="Internet Fijo FTTH">Internet Fijo FTTH</option>
                <option value="Dúo Internet + TV Digital">Dúo Internet + TV Digital</option>
                <option value="Trío Internet + TV + Voz IP">Trío Internet + TV + Voz IP</option>
                <option value="Canal Dedicado Empresarial">Canal Dedicado Empresarial</option>
                <option value="Radioenlace Microondas">Radioenlace Microondas</option>
              </select>
            </div>
          </div>

          <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">
            Mostrando {contratosFiltrados.length} de {contratos.length} contratos
          </span>
        </div>

        {contratosFiltrados.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            No se encontraron contratos de usuarios con los criterios seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-3 px-4">Radicado / Fecha</th>
                  <th className="py-3 px-4">Usuario Suscriptor (Cód = Doc.)</th>
                  <th className="py-3 px-4">Plan & Red FTTH</th>
                  <th className="py-3 px-4">Equipo Comodato (ONT)</th>
                  <th className="py-3 px-4">Mensualidad / Permanencia</th>
                  <th className="py-3 px-4">Firma Ley 527</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {contratosFiltrados.map(c => {
                  const totalMes = c.totalMensualPagar || c.tarifaMensual;
                  const codUsuario = c.clienteCodigo || c.clienteIdentificacion;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-[#18235C] block">{c.codigoContrato}</span>
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(c.fechaContrato).toLocaleDateString('es-CO')} · Corte día {c.diaCorteMensual || 5}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-800 block truncate max-w-[200px]" title={c.clienteNombre}>
                          {c.clienteNombre}
                        </span>
                        <span className="text-[11px] text-[#18235C] font-mono font-bold block">
                          Cód/Doc: {c.clienteTipoIdentificacion || 'CC'} {codUsuario}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">
                          {c.direccionInstalacion} ({c.ciudadInstalacion || 'Bogotá D.C.'})
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <span className="font-bold text-slate-800 block truncate max-w-[190px]" title={c.planServicio}>
                          {c.planServicio}
                        </span>
                        <span className="text-[11px] text-indigo-600 font-bold block">
                          {c.velocidadMbps} Mbps · {c.tipoServicio || 'Internet Fijo FTTH'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {c.nodoCajaNap || 'NAP-PRINCIPAL'} · IP: {c.ipAsignada || 'Dinámica'}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {c.equipoComodato ? (
                          <div>
                            <span className="text-slate-800 font-semibold block truncate max-w-[160px]" title={c.equipoComodato.marcaModelo}>
                              {c.equipoComodato.marcaModelo}
                            </span>
                            <span className="text-[10px] font-mono text-slate-600 block">
                              S/N: {c.equipoComodato.serialOnt}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 block">
                              MAC: {c.equipoComodato.macAddress}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">ONT Estándar Comodato</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono font-black text-emerald-700 text-sm block">
                          ${totalMes.toLocaleString('es-CO')}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {c.permanenciaMeses > 0 ? `Permanencia: ${c.permanenciaMeses} meses (CRC)` : 'Sin cláusula de permanencia'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700">
                        <span className="block truncate max-w-[130px] font-semibold">{c.firmaNombre}</span>
                        <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>SHA-256: {c.hashIntegridadSha256.substring(0, 8)}...</span>
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <select
                          value={c.estado}
                          onChange={e => handleCambiarEstado(c.id, e.target.value as ContratoCliente['estado'])}
                          className={`px-2 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                            c.estado === 'Activo'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : c.estado === 'Firmado'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : c.estado === 'Suspendido'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : c.estado === 'Cancelado'
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="Activo">Activo</option>
                          <option value="Firmado">Firmado</option>
                          <option value="En Instalación">En Instalación</option>
                          <option value="Suspendido">Suspendido</option>
                          <option value="Cancelado">Cancelado</option>
                        </select>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setContratoVer(c)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#18235C] hover:bg-[#1E3A8A] text-white font-bold text-[11px] cursor-pointer transition-colors"
                            title="Abrir contrato oficial formato CRC, imprimir o descargar PDF"
                          >
                            Ver Contrato CRC
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEnviarWhatsAppContrato(c)}
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 cursor-pointer"
                            title="Enviar resumen de contrato por WhatsApp al suscriptor"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={c.urlCarpetaDrive || `https://drive.google.com/drive/folders/${carpetaDrive}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
                            title="Ver expediente en Google Drive"
                          >
                            <HardDrive className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CREAR NUEVO CONTRATO DE USUARIO CON FIRMA DIGITAL */}
      {modalNuevo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3 text-[#18235C]">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <PenTool className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#18235C]">
                    Nuevo Contrato Único de Servicios Fijos (Formato CRC)
                  </h3>
                  <p className="text-xs text-slate-500">
                    El Código Único del Usuario Suscriptor se asigna automáticamente igual a su Número de Documento de Identidad / NIT.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevo(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold px-2 cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCrearContrato} className="space-y-5 text-xs">
              {errorFormulario && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorFormulario}</span>
                </div>
              )}

              {/* BLOQUE 1: SELECCIÓN O CREACIÓN DEL USUARIO SUSCRIPTOR */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <span className="font-black text-[#18235C] text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-indigo-600" />
                    1. Identificación del Usuario Suscriptor (Código = Documento)
                  </span>

                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setModoUsuario('existente')}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        modoUsuario === 'existente'
                          ? 'bg-[#18235C] text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Usuario Existente</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModoUsuario('nuevo');
                        setClienteId('');
                      }}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                        modoUsuario === 'nuevo'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Registrar Nuevo Usuario</span>
                    </button>
                  </div>
                </div>

                {modoUsuario === 'existente' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Seleccionar Suscriptor de la Cartera Comercial *
                    </label>
                    <select
                      value={clienteId}
                      onChange={e => handleSeleccionarClienteExistente(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800"
                    >
                      <option value="">-- Seleccione un usuario suscriptor existente --</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} — Cód/Doc: {c.tipoIdentificacion} {c.identificacion} ({c.planServicio})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipo Documento *</label>
                    <select
                      value={tipoIdentificacion}
                      onChange={e => setTipoIdentificacion(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
                    >
                      <option value="CC">CC - Cédula de Ciudadanía</option>
                      <option value="NIT">NIT - Persona Jurídica</option>
                      <option value="CE">CE - Cédula de Extranjería</option>
                      <option value="PPT">PPT - Permiso Protección</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      N° Documento (= Cód. Usuario) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 1019034789"
                      value={numeroIdentificacion}
                      onChange={e => {
                        setNumeroIdentificacion(e.target.value);
                        setFirmaCedula(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-[#18235C]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Nombre Completo o Razón Social del Suscriptor *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: María Fernanda Restrepo / Empresa SAS"
                      value={nombreSuscriptor}
                      onChange={e => {
                        setNombreSuscriptor(e.target.value);
                        setFirmaNombre(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Teléfono / WhatsApp *</label>
                    <input
                      type="text"
                      placeholder="Ej: 3157894512"
                      value={telefonoSuscriptor}
                      onChange={e => setTelefonoSuscriptor(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Correo Facturación Electrónica *</label>
                    <input
                      type="email"
                      placeholder="usuario@correo.com"
                      value={emailSuscriptor}
                      onChange={e => setEmailSuscriptor(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Estrato / Clasificación</label>
                    <select
                      value={estrato}
                      onChange={e => setEstrato(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
                    >
                      <option value="1">Estrato 1 (Residencial)</option>
                      <option value="2">Estrato 2 (Residencial)</option>
                      <option value="3">Estrato 3 (Residencial)</option>
                      <option value="4">Estrato 4 (Residencial)</option>
                      <option value="5">Estrato 5 (Residencial)</option>
                      <option value="6">Estrato 6 (Residencial)</option>
                      <option value="Comercial">Comercial / PYME</option>
                      <option value="Industrial">Industrial / Corporativo</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Ciudad / Municipio *</label>
                    <input
                      type="text"
                      required
                      value={ciudadInstalacion}
                      onChange={e => setCiudadInstalacion(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Barrio / Vereda / Nodo</label>
                    <input
                      type="text"
                      placeholder="Ej: Cedritos / Zona Industrial"
                      value={barrioVereda}
                      onChange={e => setBarrioVereda(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Dirección de Instalación *</label>
                    <input
                      type="text"
                      required
                      placeholder="Calle / Carrera # Apto"
                      value={direccionInstalacion}
                      onChange={e => setDireccionInstalacion(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* BLOQUE 2: SERVICIO CONTRATADO Y EQUIPOS EN COMODATO */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <span className="font-black text-[#18235C] text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Wifi className="w-4 h-4 text-indigo-600" />
                    2. Plan de Telecomunicaciones, Red FTTH y Equipo ONT en Comodato
                  </span>

                  <select
                    onChange={e => handleSeleccionarPlanCatalogo(e.target.value)}
                    defaultValue=""
                    className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] font-bold text-indigo-900"
                  >
                    <option value="" disabled>⚡ Autocompletar desde Catálogo de Planes...</option>
                    {PLANES_CATALOGO_COMERCIAL.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} — ${p.tarifaBase.toLocaleString('es-CO')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipo de Servicio *</label>
                    <select
                      value={tipoServicio}
                      onChange={e => setTipoServicio(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
                    >
                      <option value="Internet Fijo FTTH">Internet Fijo FTTH</option>
                      <option value="Dúo Internet + TV Digital">Dúo Internet + TV Digital</option>
                      <option value="Trío Internet + TV + Voz IP">Trío Internet + TV + Voz IP</option>
                      <option value="Canal Dedicado Empresarial">Canal Dedicado Empresarial</option>
                      <option value="Radioenlace Microondas">Radioenlace Microondas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tecnología de Acceso</label>
                    <select
                      value={tecnologiaAcceso}
                      onChange={e => setTecnologiaAcceso(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
                    >
                      <option value="Fibra Óptica GPON (FTTH)">Fibra Óptica GPON (FTTH)</option>
                      <option value="Fibra Dedicada MetroEthernet">Fibra Dedicada MetroEthernet</option>
                      <option value="Radioenlace Punto a Punto">Radioenlace Punto a Punto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nombre Comercial del Plan *</label>
                    <input
                      type="text"
                      required
                      value={planServicio}
                      onChange={e => setPlanServicio(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Descarga (Mbps)</label>
                    <input
                      type="number"
                      value={velocidadMbps}
                      onChange={e => {
                        setVelocidadMbps(Number(e.target.value));
                        setVelocidadSubidaMbps(Number(e.target.value));
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Subida Simétrica (Mbps)</label>
                    <input
                      type="number"
                      value={velocidadSubidaMbps}
                      onChange={e => setVelocidadSubidaMbps(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Caja NAP / Puerto Óptico</label>
                    <input
                      type="text"
                      value={nodoCajaNap}
                      onChange={e => setNodoCajaNap(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">IP / Segmento Asignado</label>
                    <input
                      type="text"
                      value={ipAsignada}
                      onChange={e => setIpAsignada(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>

                {/* Datos de Equipo en Comodato */}
                <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Equipo Entregado en Comodato (Marca / Modelo ONT)
                    </label>
                    <input
                      type="text"
                      value={marcaModeloEquipo}
                      onChange={e => setMarcaModeloEquipo(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Serial ONT (S/N)</label>
                    <input
                      type="text"
                      value={serialOnt}
                      onChange={e => setSerialOnt(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">MAC Address</label>
                    <input
                      type="text"
                      value={macAddress}
                      onChange={e => setMacAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* BLOQUE 3: CONDICIONES ECONÓMICAS Y CLÁUSULA DE PERMANENCIA MÍNIMA CRC */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
                <span className="font-black text-[#18235C] text-xs uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 pb-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  3. Condiciones Comerciales y Cláusula de Permanencia Mínima (CRC)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cargo Básico Mensual (COP) *</label>
                    <input
                      type="number"
                      required
                      value={tarifaMensual}
                      onChange={e => setTarifaMensual(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 font-bold text-slate-700 mb-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={aplicaIva}
                        onChange={e => setAplicaIva(e.target.checked)}
                        className="rounded text-[#18235C]"
                      />
                      <span>Facturar IVA 19% (${valorIvaCalculado.toLocaleString('es-CO')})</span>
                    </label>
                    <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl font-mono font-black text-emerald-800">
                      Total: ${totalMensualCalculado.toLocaleString('es-CO')} / mes
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Día de Corte Mensual</label>
                    <select
                      value={diaCorteMensual}
                      onChange={e => setDiaCorteMensual(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-semibold"
                    >
                      <option value={1}>Día 1 de cada mes</option>
                      <option value={5}>Día 5 de cada mes</option>
                      <option value={15}>Día 15 de cada mes</option>
                      <option value={30}>Día 30 de cada mes</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Permanencia Mínima (CRC)</label>
                    <select
                      value={permanenciaMeses}
                      onChange={e => setPermanenciaMeses(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-[#18235C]"
                    >
                      <option value={0}>0 Meses (Sin Permanencia)</option>
                      <option value={6}>6 Meses</option>
                      <option value={12}>12 Meses (Estándar CRC)</option>
                      <option value={24}>24 Meses (Corporativo)</option>
                    </select>
                  </div>
                </div>

                {permanenciaMeses > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        Cargo Total por Conexión (COP)
                      </label>
                      <input
                        type="number"
                        value={cargoConexionTotal}
                        onChange={e => setCargoConexionTotal(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">
                        Valor Descontado por Permanencia (COP)
                      </label>
                      <input
                        type="number"
                        value={cargoConexionDescuento}
                        onChange={e => setCargoConexionDescuento(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono"
                      />
                    </div>
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                      <strong>Cuota Amortización Mensual CRC:</strong>
                      <div className="font-mono font-bold">
                        ${Math.round(cargoConexionDescuento / permanenciaMeses).toLocaleString('es-CO')} / mes restante
                      </div>
                    </div>
                  </div>
                )}

                {/* Autorizaciones Legales */}
                <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <label className="flex items-start gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autorizaHabeasData}
                      onChange={e => setAutorizaHabeasData(e.target.checked)}
                      className="mt-0.5 rounded text-[#18235C]"
                    />
                    <span>
                      <strong>Habeas Data (Ley 1581/2012):</strong> Autoriza tratamiento de datos personales.
                    </span>
                  </label>

                  <label className="flex items-start gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autorizaCentralesRiesgo}
                      onChange={e => setAutorizaCentralesRiesgo(e.target.checked)}
                      className="mt-0.5 rounded text-[#18235C]"
                    />
                    <span>
                      <strong>Centrales de Riesgo (Ley 1266):</strong> Autoriza consulta y reporte crediticio.
                    </span>
                  </label>

                  <label className="flex items-start gap-2 p-2 bg-white rounded-xl border border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aceptaFacturaElectronica}
                      onChange={e => setAceptaFacturaElectronica(e.target.checked)}
                      className="mt-0.5 rounded text-[#18235C]"
                    />
                    <span>
                      <strong>Facturación DIAN:</strong> Acepta envío de factura electrónica por email/WhatsApp.
                    </span>
                  </label>
                </div>
              </div>

              {/* BLOQUE 4: PANEL TÁCTIL DE CAPTURA DE FIRMA DIGITAL */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                    4. Panel Táctil de Firma del Usuario Suscriptor (Ley 527 de 1999) *
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={generarRubricaAutomatica}
                      className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Generar Rúbrica Caligráfica
                    </button>
                    <button
                      type="button"
                      onClick={limpiarCanvas}
                      className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Limpiar Trazo
                    </button>
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden relative">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={150}
                    onMouseDown={empezarDibujo}
                    onMouseMove={dibujar}
                    onMouseUp={terminarDibujo}
                    onMouseLeave={terminarDibujo}
                    onTouchStart={empezarDibujo}
                    onTouchMove={dibujar}
                    onTouchEnd={terminarDibujo}
                    className="w-full h-36 cursor-crosshair touch-none"
                  />
                  {!firmaCapturada && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs">
                      Firme aquí con el mouse o pantalla táctil (o pulse "Generar Rúbrica Caligráfica")
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-600 mb-0.5">Nombre Completo del Firmante *</label>
                    <input
                      type="text"
                      required
                      value={firmaNombre}
                      onChange={e => setFirmaNombre(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-0.5">Cédula / NIT del Firmante *</label>
                    <input
                      type="text"
                      required
                      value={firmaCedula}
                      onChange={e => setFirmaCedula(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#18235C] hover:bg-[#1E3A8A] text-white font-bold shadow-md cursor-pointer transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4 text-[#00FF00]" />
                  <span>Formalizar Contrato de Usuario & Sincronizar Drive</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VISUALIZADOR OFICIAL DEL CONTRATO DE USUARIO (FORMATO CRC IMPRIMIBLE / PDF) */}
      {contratoVer && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 my-auto overflow-hidden flex flex-col max-h-[94vh]">
            {/* Barra de Acciones del Contrato */}
            <div className="bg-[#18235C] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 text-[#00FF00]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Contrato Único de Servicios Fijos CRC: {contratoVer.codigoContrato}
                  </h3>
                  <p className="text-[11px] text-[#8FA7D6] font-mono">
                    Código Único Usuario (Doc.): {contratoVer.clienteCodigo || contratoVer.clienteIdentificacion} · Estado: {contratoVer.estado}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleEnviarWhatsAppContrato(contratoVer)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar WhatsApp</span>
                </button>

                <button
                  type="button"
                  disabled={descargandoPdf}
                  onClick={() => handleDescargarContratoPdf(contratoVer)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#00FF00] hover:bg-emerald-400 text-[#18235C] font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <FileDown className="w-4 h-4" />
                  <span>{descargandoPdf ? 'Generando PDF...' : 'Descargar PDF'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>

                <button
                  type="button"
                  onClick={() => setContratoVer(null)}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-rose-600 text-white font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Cuerpo Imprimible del Contrato Único de Usuario CRC */}
            <div
              id="documento-contrato-crc-imprimible"
              className="p-6 sm:p-8 overflow-y-auto space-y-5 text-xs text-slate-800 bg-white font-sans"
            >
              {/* Cabecera Institucional y Regulatoria */}
              <div className="border-2 border-[#18235C] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50/60">
                <div className="flex items-center gap-3.5">
                  <CorporateLogo
                    logoUrl={empresa?.identidadVisual?.logoUrl}
                    nombreComercial={empresa?.nombreComercial}
                    size="md"
                    imageClassName="max-h-12 w-auto"
                  />
                  <div>
                    <h4 className="font-black text-[#18235C] text-sm uppercase">
                      {empresa?.razonSocial || 'B GROUP INGENIERIA S.A.S.'}
                    </h4>
                    <p className="text-[11px] text-slate-600 font-mono">
                      NIT: {empresa?.nit || '900.995.99-2'} · Registro TIC / Operador de Telecomunicaciones
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {empresa?.contacto?.direccion || 'Bogotá D.C., Colombia'} · {empresa?.contacto?.emailCorporativo || 'servicioalcliente@bgroup.com.co'}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right font-mono bg-white p-3 rounded-xl border border-slate-200 shrink-0">
                  <span className="text-[10px] font-bold uppercase text-indigo-700 block">
                    CONTRATO ÚNICO DE SERVICIOS FIJOS (CRC)
                  </span>
                  <span className="text-sm font-black text-[#18235C] block">
                    {contratoVer.codigoContrato}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Código Único Usuario: <strong>{contratoVer.clienteCodigo || contratoVer.clienteIdentificacion}</strong>
                  </span>
                </div>
              </div>

              {/* 1. Datos del Suscriptor */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-[#18235C] text-white px-4 py-1.5 font-bold text-[11px] uppercase tracking-wider">
                  1. Datos del Usuario Suscriptor y Lugar de Instalación
                </div>
                <div className="p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white">
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Suscriptor / Razón Social</span>
                    <span className="font-bold text-slate-900">{contratoVer.clienteNombre}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Código Usuario / Identificación</span>
                    <span className="font-mono font-bold text-[#18235C]">
                      {contratoVer.clienteTipoIdentificacion || 'CC'} {contratoVer.clienteIdentificacion}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Estrato / Uso</span>
                    <span className="font-semibold text-slate-800">{contratoVer.estrato || 'Residencial 3'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Dirección de Instalación</span>
                    <span className="font-semibold text-slate-800">
                      {contratoVer.direccionInstalacion} {contratoVer.barrioVereda ? `(${contratoVer.barrioVereda})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Municipio / Ciudad</span>
                    <span className="font-semibold text-slate-800">{contratoVer.ciudadInstalacion || 'Bogotá D.C.'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Contacto / Facturación</span>
                    <span className="font-mono text-[11px] text-slate-700 block">{contratoVer.clienteTelefono || '—'}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{contratoVer.clienteEmail || '—'}</span>
                  </div>
                </div>
              </div>

              {/* 2. Condiciones Técnicas y Equipos en Comodato */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-[#18235C] text-white px-4 py-1.5 font-bold text-[11px] uppercase tracking-wider">
                  2. Servicios Contratados, Parámetros de Red y Equipos en Comodato
                </div>
                <div className="p-3.5 space-y-3 bg-white">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Plan Comercial Contratado</span>
                      <span className="font-bold text-[#18235C]">{contratoVer.planServicio}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Velocidad Contratada</span>
                      <span className="font-mono font-bold text-indigo-700">
                        {contratoVer.velocidadMbps} Mbps Bajada / {contratoVer.velocidadSubidaMbps || contratoVer.velocidadMbps} Mbps Subida
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Red / Nodo / IP</span>
                      <span className="font-mono text-[11px] text-slate-700">
                        {contratoVer.nodoCajaNap || 'NAP-FTTH'} · IP: {contratoVer.ipAsignada || 'Dinámica'}
                      </span>
                    </div>
                  </div>

                  {contratoVer.equipoComodato && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="sm:col-span-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Equipo ONT / Router en Comodato</span>
                        <span className="font-bold text-slate-800">{contratoVer.equipoComodato.marcaModelo}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Serial S/N & MAC</span>
                        <span className="font-mono font-bold text-slate-800">
                          {contratoVer.equipoComodato.serialOnt} ({contratoVer.equipoComodato.macAddress})
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Valor Reposición</span>
                        <span className="font-mono font-bold text-slate-800">
                          ${contratoVer.equipoComodato.valorReposicion.toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Condiciones Económicas y Cláusula de Permanencia Mínima CRC */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-[#18235C] text-white px-4 py-1.5 font-bold text-[11px] uppercase tracking-wider">
                  3. Condiciones Económicas y Cláusula de Permanencia Mínima (Resolución CRC 5111 / 5050)
                </div>
                <div className="p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Cargo Básico Mensual</span>
                    <span className="font-mono font-bold text-slate-800">
                      ${contratoVer.tarifaMensual.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Impuesto IVA (19%)</span>
                    <span className="font-mono font-semibold text-slate-700">
                      ${(contratoVer.valorIva || 0).toLocaleString('es-CO')} COP
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Mensual a Pagar</span>
                    <span className="font-mono font-black text-emerald-700 text-sm">
                      ${(contratoVer.totalMensualPagar || contratoVer.tarifaMensual).toLocaleString('es-CO')} COP
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Vigencia Permanencia</span>
                    <span className="font-bold text-[#18235C]">
                      {contratoVer.permanenciaMeses > 0 ? `${contratoVer.permanenciaMeses} Meses` : 'Sin Cláusula de Permanencia'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Cláusulas Regulatorias y Habeas Data */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-600 leading-relaxed space-y-1">
                <p>
                  <strong>AUTORIZACIÓN HABEAS DATA (LEY 1581 DE 2012) Y CENTRALES DE RIESGO (LEY 1266 DE 2008):</strong> El SUSCRIPTOR autoriza de manera previa, expresa e informada a <strong>{empresa?.razonSocial || 'B GROUP INGENIERIA S.A.S.'}</strong> para recolectar, almacenar y tratar sus datos personales con fines contractuales, técnicos, comerciales y de facturación electrónica DIAN, así como para consultar y reportar el comportamiento de pago ante operadores de información financiera y crediticia.
                </p>
                <p>
                  <strong>COMODATO DE EQUIPOS:</strong> Los equipos terminales de red óptica (ONT/Router) se entregan en calidad de comodato (préstamo de uso). Al finalizar el contrato, el SUSCRIPTOR se compromete a restituirlos en buen estado salvo el deterioro natural, o cancelar el valor de reposición estipulado.
                </p>
              </div>

              {/* 5. Firmas Digitales, QR y Sello Criptográfico SHA-256 */}
              <div className="pt-3 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Firma Electrónica del Usuario Suscriptor:
                  </span>
                  {contratoVer.firmaDigitalUrl && (
                    <div className="p-2 bg-white rounded-lg border border-slate-200 inline-block mb-1">
                      <img src={contratoVer.firmaDigitalUrl} alt="Firma Suscriptor" className="max-h-14 w-auto" />
                    </div>
                  )}
                  <p className="font-bold text-[#18235C]">{contratoVer.firmaNombre}</p>
                  <p className="text-[10px] text-slate-600 font-mono font-bold">
                    Cód / Doc. Identidad: {contratoVer.firmaCedula}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    Fecha y Hora de Firma: {new Date(contratoVer.fechaContrato).toLocaleString('es-CO')}
                  </p>
                </div>

                <div className="sm:col-span-2 flex justify-center">
                  <CodigoQRVerificacion
                    codigoVerificacion={contratoVer.codigoContrato}
                    tipoDocumento="Contrato Único de Servicios Fijos CRC"
                    titularNombre={contratoVer.clienteNombre}
                    size={76}
                  />
                </div>

                <div className="sm:col-span-5 p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 text-[10px] font-mono space-y-1">
                  <span className="font-bold text-emerald-800 block">
                    ✓ Validez Jurídica y Sello Criptográfico (Ley 527/1999)
                  </span>
                  <p className="text-slate-600 break-all">
                    <strong>SHA-256:</strong> {contratoVer.hashIntegridadSha256}
                  </p>
                  <p className="text-blue-700 font-bold truncate">
                    Carpeta Google Drive: {contratoVer.carpetaDriveId}
                  </p>
                  <p className="text-slate-500">
                    Atendido por: {contratoVer.asesorComercialNombre || 'Dirección Comercial'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
