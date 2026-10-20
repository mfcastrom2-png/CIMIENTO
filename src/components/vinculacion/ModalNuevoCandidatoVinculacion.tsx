import React, { useState } from 'react';
import {
  Cargo,
  Empleado,
  ConfiguracionEmpresa
} from '../../types';
import {
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  FileText,
  AlertTriangle,
  X,
  Check,
  Send,
  Building2
} from 'lucide-react';
import { uid } from '../../data/initialData';
import { DEPARTAMENTOS_COLOMBIA, TIPOS_DOCUMENTO_COLOMBIA } from '../../data/colombiaData';
import { inicializarFlujoVinculacion, despacharNotificacionVinculacion } from '../../services/vinculacionService';
import { validarCedulaDocumentoDian, validarCorreoElectronicoDian } from '../../utils/validadorDianEmpleado';

interface ModalNuevoCandidatoVinculacionProps {
  cargos: Cargo[];
  empresa?: ConfiguracionEmpresa;
  onClose: () => void;
  onCandidatoCreado: (nuevoEmpleado: Empleado) => Promise<void> | void;
}

export const ModalNuevoCandidatoVinculacion: React.FC<ModalNuevoCandidatoVinculacionProps> = ({
  cargos,
  empresa,
  onClose,
  onCandidatoCreado
}) => {
  const [tipoDocumento, setTipoDocumento] = useState('CC');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [primerNombre, setPrimerNombre] = useState('');
  const [segundoNombre, setSegundoNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [cargoId, setCargoId] = useState('');
  const [departamento, setDepartamento] = useState('Bogotá D.C.');
  const [ciudad, setCiudad] = useState('Bogotá D.C.');
  const [notasSeleccion, setNotasSeleccion] = useState('');
  const [despacharNotificacion, setDespacharNotificacion] = useState(true);

  const [guardando, setGuardando] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  const cargoSeleccionado = cargos.find(c => c.id === cargoId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    const docLimpio = numeroDocumento.trim().replace(/\D/g, '');
    if (!docLimpio || docLimpio.length < 5) {
      setErrorValidacion('Debe ingresar un número de documento de identidad válido (mínimo 5 dígitos).');
      return;
    }

    if (!primerNombre.trim() || !primerApellido.trim()) {
      setErrorValidacion('El Primer Nombre y el Primer Apellido son obligatorios.');
      return;
    }

    const valEmail = validarCorreoElectronicoDian(email);
    if (!valEmail.esValido) {
      setErrorValidacion(valEmail.mensaje || 'Ingrese un correo electrónico válido.');
      return;
    }

    const celLimpio = celular.trim().replace(/\D/g, '');
    if (!celLimpio || celLimpio.length < 10) {
      setErrorValidacion('Debe ingresar un número celular válido (mínimo 10 dígitos) para contacto y notificaciones.');
      return;
    }

    setGuardando(true);

    try {
      const nombreCompleto = [primerNombre.trim(), segundoNombre.trim(), primerApellido.trim(), segundoApellido.trim()]
        .filter(Boolean)
        .join(' ');

      const fechaHoy = new Date().toISOString();
      const fechaCorta = fechaHoy.slice(0, 10);

      // El código del empleado es unívocamente su número de documento de identidad
      const candidatoBase: Partial<Empleado> = {
        id: uid(),
        codigo: docLimpio,
        codigoInterno: docLimpio,
        nombre: nombreCompleto,
        documento: docLimpio,
        tipoDocumento,
        email: email.trim().toLowerCase(),
        telefono: celLimpio,
        cargoId: cargoId || (cargos.length > 0 ? cargos[0].id : ''),
        areaId: cargoSeleccionado?.areaId || '',
        formacion: 'Pendiente diligenciamiento en Hoja de Vida',
        experiencia: 'Pendiente diligenciamiento en Hoja de Vida',
        salarioBase: cargoSeleccionado?.salarioReferencia || 1423500,
        activo: false,
        estadoLaboral: 'Pre-selección',
        contrato: {
          tipo: 'Pendiente de definición contractual',
          inicio: fechaCorta,
          fin: '',
          salario: String(cargoSeleccionado?.salarioReferencia || 1423500)
        },
        familia: [],
        persona: {
          tipoDocumento,
          numeroDocumento: docLimpio,
          primerNombre: primerNombre.trim(),
          segundoNombre: segundoNombre.trim() || undefined,
          primerApellido: primerApellido.trim(),
          segundoApellido: segundoApellido.trim() || undefined,
          fechaNacimiento: '1995-01-01',
          lugarNacimiento: ciudad,
          nacionalidad: 'Colombiana',
          genero: 'No especificado',
          estadoCivil: 'Soltero(a)'
        },
        contacto: {
          direccion: 'Pendiente por candidato',
          departamento,
          ciudad,
          celular: celLimpio,
          correoPersonal: email.trim().toLowerCase(),
          contactoEmergenciaNombre: 'Pendiente por candidato',
          contactoEmergenciaParentesco: 'Familiar',
          contactoEmergenciaTelefono: celLimpio
        },
        laboral: {
          codigoInterno: docLimpio,
          fechaIngreso: fechaCorta,
          fechaInicioLaboral: fechaCorta,
          areaId: cargoSeleccionado?.areaId || '',
          areaNombre: cargoSeleccionado?.areaId || 'Por definir',
          cargoId: cargoId || '',
          cargoNombre: cargoSeleccionado?.nombre || 'Perfil en pre-selección',
          tipoContrato: 'Por definir en vinculación',
          fechaInicioContrato: fechaCorta,
          jornadaLaboral: 'Tiempo completo (46 hrs Ley 2101)',
          modalidadTrabajo: 'Presencial',
          lugarTrabajo: ciudad,
          estado: 'Pre-selección'
        },
        compensacion: {
          salarioBasico: cargoSeleccionado?.salarioReferencia || 1423500,
          tipoSalario: 'Ordinario',
          periodicidadPago: 'Quincenal',
          auxilioTransporte: true,
          formaPago: 'Transferencia bancaria',
          banco: 'Bancolombia',
          tipoCuenta: 'Ahorros',
          numeroCuenta: '',
          historialVigencias: []
        },
        seguridadSocial: {
          eps: 'Pendiente afiliación',
          fondoPensiones: 'Pendiente afiliación',
          arl: 'Seguros Bolívar S.A.',
          nivelRiesgoArl: 'I (0.522%)',
          cajaCompensacion: 'Compensar',
          fondoCesantias: 'Por definir',
          fechaAfiliacion: fechaCorta,
          estadoAfiliacion: 'En trámite',
          tipoAfiliacion: 'Cotizante Dependiente'
        },
        estudios: [],
        experiencias: [],
        sst: {
          examenesOcupacionales: [],
          conceptoAptitudVigente: 'Pendiente'
        },
        documentos: [],
        historialLaboral: [
          {
            id: uid(),
            fechaHora: fechaHoy,
            usuario: 'Administrador GH',
            accion: 'CREACION',
            titulo: 'Registro de Candidato en Etapa de Pre-selección',
            motivo: 'Inicio del flujo de vinculación laboral y emisión de invitación para diligenciamiento de Hoja de Vida.',
            valorNuevo: `Estado: Pre-selección / Preingreso. Código = C.C. ${docLimpio}`
          }
        ]
      };

      // Inicializar el flujo de vinculación en Etapa 1: Pre-selección
      const flujoVinculacion = inicializarFlujoVinculacion({
        candidato: candidatoBase,
        cargoPropuestoNombre: cargoSeleccionado?.nombre,
        empresa
      });

      const nuevoEmpleadoFinal: Empleado = {
        ...(candidatoBase as Empleado),
        vinculacion: flujoVinculacion
      };

      // Despachar notificación institucional al candidato
      if (despacharNotificacion && flujoVinculacion.notificaciones[0]) {
        const notif = flujoVinculacion.notificaciones[0];
        await despacharNotificacionVinculacion({
          destinatarioEmail: notif.destinatarioEmail,
          destinatarioNombre: notif.destinatarioNombre,
          asunto: notif.asunto,
          cuerpo: notif.mensaje,
          tipo: 'invitacion_hoja_vida'
        });
      }

      await onCandidatoCreado(nuevoEmpleadoFinal);
      onClose();
    } catch (err: any) {
      console.error('Error al registrar candidato:', err);
      setErrorValidacion(err?.message || 'Ocurrió un error inesperado al registrar el candidato.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-fadeIn my-6 max-h-[92vh] flex flex-col">
        {/* Cabecera */}
        <div className="bg-[#18235C] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#F59E0B] border border-white/10">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">
                  Nuevo Candidato — Etapa de Pre-selección
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Flujo de Vinculación
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Registre los datos básicos del aspirante para despachar la invitación y habilitar su Hoja de Vida.
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

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs text-slate-700">
          {errorValidacion && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* Banner Explicativo del Paso 1 */}
          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-900 flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
              1
            </div>
            <div className="text-[11px] leading-relaxed">
              <strong className="block text-blue-950 font-bold">Paso 1 del Flujo de Vinculación Laboral:</strong>
              Al registrar al candidato, el sistema creará automáticamente su expediente en <strong>Etapa de Pre-selección</strong> y le despachará un correo electrónico institucional con un enlace seguro para que diligencie su <strong>Hoja de Vida</strong> (estudios, experiencia y datos personales).
            </div>
          </div>

          {/* Documento de Identidad (= Código Único) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tipo de Documento *</label>
              <select
                value={tipoDocumento}
                onChange={e => setTipoDocumento(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
              >
                {TIPOS_DOCUMENTO_COLOMBIA.map(t => (
                  <option key={t.codigo} value={t.codigo}>
                    {t.codigo} — {t.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">
                Número de Documento (= Código de Empleado) *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. 1019034890"
                value={numeroDocumento}
                onChange={e => setNumeroDocumento(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-[#18235C]"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                El número de identificación será asignado unívocamente como su código interno.
              </span>
            </div>
          </div>

          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Primer Nombre *</label>
              <input
                type="text"
                required
                placeholder="Ej. Carlos"
                value={primerNombre}
                onChange={e => setPrimerNombre(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Segundo Nombre (Opcional)</label>
              <input
                type="text"
                placeholder="Ej. Eduardo"
                value={segundoNombre}
                onChange={e => setSegundoNombre(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Primer Apellido *</label>
              <input
                type="text"
                required
                placeholder="Ej. Ramírez"
                value={primerApellido}
                onChange={e => setPrimerApellido(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Segundo Apellido (Opcional)</label>
              <input
                type="text"
                placeholder="Ej. Peña"
                value={segundoApellido}
                onChange={e => setSegundoApellido(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>

          {/* Canales de Notificación: Correo y Celular */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-600" />
                <span>Correo Electrónico del Candidato *</span>
              </label>
              <input
                type="email"
                required
                placeholder="candidato@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Se enviará la invitación institucional a este buzón.
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Celular / WhatsApp *</span>
              </label>
              <input
                type="tel"
                required
                placeholder="Ej. 3157894512"
                value={celular}
                onChange={e => setCelular(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Para contacto inmediato y recordatorio por WhatsApp.
              </span>
            </div>
          </div>

          {/* Cargo o Perfil al que aspira y Ubicación */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-600" />
                <span>Cargo o Perfil al que Aspira</span>
              </label>
              <select
                value={cargoId}
                onChange={e => setCargoId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
              >
                <option value="">-- Seleccionar perfil preliminar --</option>
                {cargos.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.nivel ? `(${c.nivel})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-600" />
                <span>Ciudad / Municipio Principal</span>
              </label>
              <input
                type="text"
                value={ciudad}
                onChange={e => setCiudad(e.target.value)}
                placeholder="Ej. Bogotá D.C."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
              />
            </div>
          </div>

          {/* Notas preliminares de selección */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Notas u Observaciones Preliminares de Selección (Interno GH)
            </label>
            <textarea
              rows={2}
              value={notasSeleccion}
              onChange={e => setNotasSeleccion(e.target.value)}
              placeholder="Ej. Postulación recibida a través de convocatoria institucional. Cumple con los requisitos del perfil inicial..."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs"
            />
          </div>

          {/* Checkbox de envío de notificación */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={despacharNotificacion}
                onChange={e => setDespacharNotificacion(e.target.checked)}
                className="rounded text-[#18235C] w-4 h-4"
              />
              <span>
                Despachar automáticamente la notificación y correo electrónico de invitación para diligenciar la Hoja de Vida.
              </span>
            </label>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-4 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2.5 rounded-xl bg-[#18235C] hover:bg-[#1E3A8A] text-white font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-[#F59E0B]" />
              <span>{guardando ? 'Registrando Candidato...' : 'Crear en Pre-selección & Enviar Invitación'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
