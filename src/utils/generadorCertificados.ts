/**
 * UTILIDAD DE AUTOGENERACIÓN DE CERTIFICADOS LABORALES OFICIALES (COLOMBIA)
 * Genera el documento con membrete institucional, firma digital, código QR de verificación
 * y formato legal conforme al Código Sustantivo del Trabajo (CST).
 */

import { Empleado, Cargo, ConfiguracionEmpresa } from '../types';
import { initialEmpresa } from '../data/initialData';
import { formatMonedaCOP, parseSalarioNumerico } from './formatters';

export interface CertificadoLaboralData {
  codigoVerificacion: string;
  fechaEmision: string;
  empresa: ConfiguracionEmpresa;
  empleado: Empleado;
  cargoNombre: string;
  centroTrabajoNombre?: string;
  centroTrabajoCiudad?: string;
  salarioBasicoTexto: string;
  salarioBasicoCOP: number;
  tipoContrato: string;
  fechaIngreso: string;
  motivoDestino: string;
  entidadDestino?: string;
  firmanteNombre: string;
  firmanteCargo: string;
}

export const formatMonedaCOPCertificado = formatMonedaCOP;

// Convertidor dinámico de números a letras en Pesos Colombianos M/CTE
export function numeroALetrasPesos(monto: number): string {
  if (!monto || isNaN(monto)) return 'CERO PESOS M/CTE';

  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const especiales: Record<number, string> = {
    11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE',
    16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE',
    21: 'VEINTIÚN', 22: 'VEINTIDÓS', 23: 'VEINTITRÉS', 24: 'VEINTICUATRO',
    25: 'VEINTICINCO', 26: 'VEINTISÉIS', 27: 'VEINTISIETE', 28: 'VEINTIOCHO', 29: 'VEINTINUEVE'
  };
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  function convertirGrupo(n: number): string {
    if (n === 0) return '';
    if (n === 100) return 'CIEN';
    const c = Math.floor(n / 100);
    const resto = n % 100;
    let texto = centenas[c] ? centenas[c] + ' ' : '';

    if (resto > 0) {
      if (especiales[resto]) {
        texto += especiales[resto];
      } else {
        const d = Math.floor(resto / 10);
        const u = resto % 10;
        if (d > 0 && u > 0) {
          texto += decenas[d] + ' Y ' + unidades[u];
        } else if (d > 0) {
          texto += decenas[d];
        } else if (u > 0) {
          texto += unidades[u];
        }
      }
    }
    return texto.trim();
  }

  const millones = Math.floor(monto / 1000000);
  const miles = Math.floor((monto % 1000000) / 1000);
  const cientos = Math.floor(monto % 1000);

  const partes: string[] = [];

  if (millones > 0) {
    if (millones === 1) {
      partes.push('UN MILLÓN');
    } else {
      partes.push(convertirGrupo(millones) + ' MILLONES');
    }
  }

  if (miles > 0) {
    if (miles === 1) {
      partes.push('MIL');
    } else {
      partes.push(convertirGrupo(miles) + ' MIL');
    }
  }

  if (cientos > 0) {
    partes.push(convertirGrupo(cientos));
  }

  const resultado = partes.join(' ').trim();
  return resultado ? `${resultado} PESOS M/CTE` : 'CERO PESOS M/CTE';
}

export function generarDatosCertificadoLaboral(
  empleado: Empleado,
  cargos: Cargo[],
  motivo: string,
  entidadDestino?: string,
  empresaConfig?: ConfiguracionEmpresa
): CertificadoLaboralData {
  let emp = empresaConfig;
  if (!emp || !emp.razonSocial) {
    try {
      const cached = localStorage.getItem('bgroup_empresa_config');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.razonSocial || parsed.nit)) {
          emp = parsed;
        }
      }
    } catch (e) {
      // fallback
    }
  }
  if (!emp || !emp.razonSocial) {
    emp = initialEmpresa;
  }

  const cargo = cargos.find(c => c.id === empleado.cargoId);
  const cargoNombre = cargo ? cargo.nombre : (empleado.laboral?.cargoNombre || 'Colaborador');
  const salario = parseSalarioNumerico(empleado.contrato?.salario, empleado.salarioBase || 2500000);

  // Centro de trabajo alineado con la empresa
  const lugarTrabajoEmp = empleado.laboral?.lugarTrabajo || '';
  const centroTrabajoAsignado = emp.centrosTrabajo?.find(
    ct => ct.id === lugarTrabajoEmp || ct.nombre?.toLowerCase() === lugarTrabajoEmp.toLowerCase() || ct.codigo === lugarTrabajoEmp
  ) || emp.centrosTrabajo?.find(ct => ct.esSedePrincipal) || emp.centrosTrabajo?.[0];

  const centroTrabajoNombre = centroTrabajoAsignado?.nombre || lugarTrabajoEmp || 'Sede Principal';
  const centroTrabajoCiudad = centroTrabajoAsignado?.ciudad || emp.contacto?.ciudad || 'Bogotá D.C.';

  const randomHash = Math.floor(100000 + Math.random() * 900000);
  const fechaHoy = new Date();
  const fechaEmision = `${fechaHoy.getDate()} de ${fechaHoy.toLocaleDateString('es-CO', { month: 'long' })} de ${fechaHoy.getFullYear()}`;

  const firmanteNombre = emp.representanteLegal?.nombre || emp.sst?.responsableSST || 'Dirección de Gestión Humana';
  const firmanteCargo = emp.representanteLegal?.cargo || 'Representante Legal y Director(a) de Gestión Humana';

  return {
    codigoVerificacion: `CERT-${(emp.nit || 'COL').replace(/\D/g, '').slice(-4) || '2026'}-${fechaHoy.getFullYear()}-${randomHash}`,
    fechaEmision,
    empresa: emp,
    empleado,
    cargoNombre,
    centroTrabajoNombre,
    centroTrabajoCiudad,
    salarioBasicoTexto: numeroALetrasPesos(salario),
    salarioBasicoCOP: salario,
    tipoContrato: empleado.laboral?.tipoContrato || empleado.contrato?.tipo || 'Término Indefinido',
    fechaIngreso: empleado.laboral?.fechaIngreso || empleado.laboral?.fechaInicioContrato || '2023-01-15',
    motivoDestino: motivo || 'Trámite Personal',
    entidadDestino: entidadDestino?.trim() || (motivo === 'Bancario' ? 'Entidad Financiera' : 'A quien corresponda'),
    firmanteNombre,
    firmanteCargo
  };
}
