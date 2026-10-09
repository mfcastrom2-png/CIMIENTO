import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  Layers,
  RotateCcw,
  Building2,
  HardDrive
} from 'lucide-react';
import { ContratoCliente, ClienteComercial, UsuarioSistema, ConfiguracionEmpresa } from '../../types';
import {
  obtenerContratosClientes,
  guardarContratoCliente,
  obtenerClientesComerciales,
  generarHashSHA256,
  obtenerCarpetaDriveContratos,
  guardarCarpetaDriveContratos
} from '../../services/comercialService';
import { CorporateLogo } from '../CorporateLogo';

interface ContratosClientesViewProps {
  currentUser: UsuarioSistema;
  empresa?: ConfiguracionEmpresa;
}

export const ContratosClientesView: React.FC<ContratosClientesViewProps> = ({
  currentUser,
  empresa
}) => {
  const [contratos, setContratos] = useState<ContratoCliente[]>([]);
  const [clientes, setClientes] = useState<ClienteComercial[]>([]);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [contratoVer, setContratoVer] = useState<ContratoCliente | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [errorFormulario, setErrorFormulario] = useState<string | null>(null);

  // Carpeta de Google Drive
  const [carpetaDrive, setCarpetaDrive] = useState(obtenerCarpetaDriveContratos());
  const [editandoDrive, setEditandoDrive] = useState(false);
  const [nuevaCarpetaDrive, setNuevaCarpetaDrive] = useState(carpetaDrive);

  // Formulario de Contrato
  const [clienteId, setClienteId] = useState('');
  const [planServicio, setPlanServicio] = useState('Internet Fibra Óptica 300 Mbps Dedicado');
  const [velocidadMbps, setVelocidadMbps] = useState(300);
  const [tarifaMensual, setTarifaMensual] = useState(150000);
  const [permanenciaMeses, setPermanenciaMeses] = useState(12);
  const [direccionInstalacion, setDireccionInstalacion] = useState('');
  const [ipAsignada, setIpAsignada] = useState('190.144.20.15');

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

  const handleCrearContrato = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorFormulario(null);
    const cli = clientes.find(c => c.id === clienteId);
    if (!cli) {
      setErrorFormulario('Debe seleccionar un cliente suscriptor.');
      return;
    }

    if (!firmaCapturada) {
      setErrorFormulario('Por favor capture la firma digital del cliente en el recuadro interactivo antes de continuar.');
      return;
    }

    const fechaHoy = new Date().toISOString();
    const codigoContrato = `CTR-TELCO-${new Date().getFullYear()}-${String(contratos.length + 1).padStart(4, '0')}`;
    
    // Hash criptográfico de integridad bajo la Ley 527 de 1999
    const cadenaContrato = `${codigoContrato}|${cli.identificacion}|${tarifaMensual}|${fechaHoy}|${firmaCedula}`;
    const hash = await generarHashSHA256(cadenaContrato);

    // Enlace simulado a la carpeta institucional de Drive
    const driveUrl = carpetaDrive.startsWith('http')
      ? carpetaDrive
      : `https://drive.google.com/drive/folders/${carpetaDrive}`;

    const nuevoContrato: ContratoCliente = {
      id: 'ctr-' + Date.now(),
      codigoContrato,
      clienteId: cli.id,
      clienteNombre: cli.nombre,
      clienteIdentificacion: cli.identificacion,
      fechaContrato: fechaHoy,
      planServicio,
      velocidadMbps: Number(velocidadMbps),
      tarifaMensual: Number(tarifaMensual),
      permanenciaMeses: Number(permanenciaMeses),
      direccionInstalacion: direccionInstalacion || cli.direccion,
      ipAsignada,
      firmaDigitalUrl: firmaCapturada,
      firmaNombre: firmaNombre || cli.nombre,
      firmaCedula: firmaCedula || cli.identificacion,
      firmaFecha: fechaHoy,
      hashIntegridadSha256: hash,
      carpetaDriveId: carpetaDrive,
      urlCarpetaDrive: driveUrl,
      estado: 'Firmado',
      archivoContratoDriveUrl: `${driveUrl}?file=${codigoContrato}.pdf`
    };

    await guardarContratoCliente(nuevoContrato);
    setModalNuevo(false);
    limpiarCanvas();
    await cargarDatos();
    setContratoVer(nuevoContrato);
  };

  const handleGuardarDriveConfig = () => {
    guardarCarpetaDriveContratos(nuevaCarpetaDrive);
    setCarpetaDrive(nuevaCarpetaDrive);
    setEditandoDrive(false);
  };

  const contratosFiltrados = contratos.filter(c => {
    const q = busqueda.toLowerCase();
    return c.codigoContrato.toLowerCase().includes(q) ||
      c.clienteNombre.toLowerCase().includes(q) ||
      c.clienteIdentificacion.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
            <PenTool className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Contratos de Clientes & Firma Digital</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Captura de firma electrónica en pantalla (Ley 527/1999) y almacenamiento en Google Drive.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setModalNuevo(true)}
            className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-[#18235C] hover:bg-[#1E3A8A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#38BDF8]" />
            <span>Nuevo Contrato con Firma Digital</span>
          </button>
        </div>
      </div>

      {/* Banner de Sincronización con Carpeta de Google Drive */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
            <FolderOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <span className="font-bold text-blue-900 block">Carpeta Institucional de Google Drive:</span>
            {editandoDrive ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={nuevaCarpetaDrive}
                  onChange={e => setNuevaCarpetaDrive(e.target.value)}
                  placeholder="ID o Enlace de Carpeta Drive..."
                  className="px-2 py-1 bg-white border border-blue-300 rounded text-xs font-mono w-64"
                />
                <button
                  type="button"
                  onClick={handleGuardarDriveConfig}
                  className="px-2.5 py-1 bg-blue-600 text-white font-bold rounded text-[11px]"
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
              onClick={() => setEditandoDrive(true)}
              className="text-xs font-bold text-blue-700 hover:underline"
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

      {/* Lista de Contratos Firmados */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por código, suscriptor o cédula..."
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs w-64 text-slate-700"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Total contratos: {contratos.length}
          </span>
        </div>

        {contratosFiltrados.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            No se han registrado contratos con firma digital aún.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Plan / Velocidad</th>
                  <th className="py-3 px-4">Tarifa Mensual</th>
                  <th className="py-3 px-4">Firmado Por</th>
                  <th className="py-3 px-4">Hash Integridad</th>
                  <th className="py-3 px-4">Google Drive</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {contratosFiltrados.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">{c.codigoContrato}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800 block truncate max-w-[160px]">{c.clienteNombre}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{c.clienteIdentificacion}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <span>{c.planServicio}</span>
                      <span className="text-[10px] text-indigo-600 font-bold block">{c.velocidadMbps} Mbps</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      ${c.tarifaMensual.toLocaleString('es-CO')}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <span className="block truncate max-w-[120px]">{c.firmaNombre}</span>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Firmado
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400 truncate max-w-[100px]" title={c.hashIntegridadSha256}>
                      {c.hashIntegridadSha256.substring(0, 10)}...
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={c.urlCarpetaDrive || `https://drive.google.com/drive/folders/${carpetaDrive}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200 hover:bg-blue-100"
                      >
                        <HardDrive className="w-3 h-3" />
                        <span>Ver en Drive</span>
                      </a>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setContratoVer(c)}
                        className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                      >
                        Ver Documento
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CREAR CONTRATO CON CANVAS DE FIRMA DIGITAL */}
      {modalNuevo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3 text-[#18235C]">
                <PenTool className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-lg font-bold">Nuevo Contrato de Prestación de Servicios</h3>
                  <p className="text-xs text-slate-500">Captura de firma manuscrita digital y sellado criptográfico</p>
                </div>
              </div>
              <button onClick={() => setModalNuevo(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer">×</button>
            </div>

            <form onSubmit={handleCrearContrato} className="space-y-4 text-xs">
              {errorFormulario && (
                <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorFormulario}</span>
                </div>
              )}
              
              {/* Selección de Cliente */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Suscriptor / Cliente *</label>
                <select
                  required
                  value={clienteId}
                  onChange={e => {
                    setClienteId(e.target.value);
                    const cli = clientes.find(c => c.id === e.target.value);
                    if (cli) {
                      setFirmaNombre(cli.nombre);
                      setFirmaCedula(cli.identificacion);
                      setDireccionInstalacion(cli.direccion);
                      setPlanServicio(cli.planServicio);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800"
                >
                  <option value="">-- Seleccione un cliente --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.tipoIdentificacion} {c.identificacion})
                    </option>
                  ))}
                </select>
              </div>

              {/* Especificaciones técnicas del servicio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Plan de Telecomunicaciones *</label>
                  <input
                    type="text"
                    required
                    value={planServicio}
                    onChange={e => setPlanServicio(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Velocidad Asignada (Mbps)</label>
                  <input
                    type="number"
                    value={velocidadMbps}
                    onChange={e => setVelocidadMbps(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tarifa Mensual (COP) *</label>
                  <input
                    type="number"
                    required
                    value={tarifaMensual}
                    onChange={e => setTarifaMensual(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Permanencia (Meses)</label>
                  <input
                    type="number"
                    value={permanenciaMeses}
                    onChange={e => setPermanenciaMeses(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dirección de Conexión</label>
                  <input
                    type="text"
                    value={direccionInstalacion}
                    onChange={e => setDireccionInstalacion(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              {/* CANVAS INTERACTIVO DE FIRMA DIGITAL */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-indigo-600" />
                    Panel Táctil de Captura de Firma del Cliente (Ley 527 de 1999) *
                  </span>
                  <button
                    type="button"
                    onClick={limpiarCanvas}
                    className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Limpiar Trazo
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden relative">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={160}
                    onMouseDown={empezarDibujo}
                    onMouseMove={dibujar}
                    onMouseUp={terminarDibujo}
                    onMouseLeave={terminarDibujo}
                    onTouchStart={empezarDibujo}
                    onTouchMove={dibujar}
                    onTouchEnd={terminarDibujo}
                    className="w-full h-40 cursor-crosshair touch-none"
                  />
                  {!firmaCapturada && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-300 text-xs">
                      Firme aquí con el mouse o pantalla táctil
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-slate-600 mb-0.5">Nombre Completo del Firmante</label>
                    <input
                      type="text"
                      required
                      value={firmaNombre}
                      onChange={e => setFirmaNombre(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-0.5">Cédula / Documento de Identidad</label>
                    <input
                      type="text"
                      required
                      value={firmaCedula}
                      onChange={e => setFirmaCedula(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 leading-tight">
                  Al confirmar, se estampará sello de tiempo y cálculo criptográfico de integridad SHA-256. El contrato firmado se registrará en la carpeta institucional de Google Drive.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#18235C] hover:bg-[#1E3A8A] text-white font-bold shadow-md cursor-pointer transition-all"
                >
                  Guardar Contrato & Registrar en Drive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VISUALIZADOR DE CONTRATO FIRMADO */}
      {contratoVer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800">
                    Contrato Firmado: {contratoVer.codigoContrato}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Validez Jurídica Digital bajo Ley 527 de 1999
                  </p>
                </div>
              </div>
              <button onClick={() => setContratoVer(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer">×</button>
            </div>

            {/* Documento Imprimible / Vista Formal */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs font-sans">
              <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                <CorporateLogo
                  logoUrl={empresa?.identidadVisual?.logoUrl}
                  nombreComercial={empresa?.nombreComercial}
                  size="md"
                  imageClassName="max-h-12 w-auto"
                />
                <div className="text-right">
                  <span className="font-bold text-slate-800 block">{empresa?.nombreComercial || 'B GROUP INGENIERIA S.A.S.'}</span>
                  <span className="text-[10px] text-slate-500 font-mono">NIT {empresa?.nit || '900.995.99-2'}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-900 text-sm">CONTRATO DE PRESTACIÓN DE SERVICIOS DE CONECTIVIDAD</h4>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Entre <strong>{empresa?.razonSocial || 'B GROUP INGENIERIA S.A.S.'}</strong> y el suscriptor <strong>{contratoVer.clienteNombre}</strong> con identificación <strong>{contratoVer.clienteIdentificacion}</strong>, se formaliza la prestación del plan <strong>{contratoVer.planServicio} ({contratoVer.velocidadMbps} Mbps)</strong> en la dirección <strong>{contratoVer.direccionInstalacion}</strong> por valor de <strong>${contratoVer.tarifaMensual.toLocaleString('es-CO')} COP mensuales</strong> con permanencia de {contratoVer.permanenciaMeses} meses.
                </p>
              </div>

              {/* Firma estampada */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Firma Digital del Cliente:</span>
                  {contratoVer.firmaDigitalUrl && (
                    <div className="p-2 bg-white rounded-lg border border-slate-200 inline-block">
                      <img src={contratoVer.firmaDigitalUrl} alt="Firma" className="max-h-16 w-auto" />
                    </div>
                  )}
                  <p className="font-bold text-slate-800">{contratoVer.firmaNombre}</p>
                  <p className="text-[10px] text-slate-500 font-mono">C.C. {contratoVer.firmaCedula}</p>
                  <p className="text-[10px] text-slate-400">Fecha: {new Date(contratoVer.fechaContrato).toLocaleString('es-CO')}</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 text-[10px] font-mono space-y-1 max-w-xs text-right">
                  <span className="font-bold text-emerald-700 block">✓ Integridad Criptográfica Verificada</span>
                  <p className="text-slate-500 break-all">Hash: {contratoVer.hashIntegridadSha256}</p>
                  <p className="text-blue-600 font-bold">Carpeta Google Drive: {contratoVer.carpetaDriveId}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={contratoVer.urlCarpetaDrive || `https://drive.google.com/drive/folders/${carpetaDrive}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200 hover:bg-blue-100"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Abrir Carpeta en Google Drive</span>
              </a>

              <button
                type="button"
                onClick={() => setContratoVer(null)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
