/**
 * Módulo Centralizado de Formateo y Parsing para CIMIENTO (DRY)
 * Cumple con los estándares contables y laborales de Colombia (CST / COP)
 */

import { PARAMETROS_COLOMBIA_2026 } from '../services/payrollEngine';

/**
 * Formatea un valor numérico a Pesos Colombianos (COP) sin decimales.
 * Ejemplo: 1750905 -> "$ 1.750.905"
 */
export function formatMonedaCOP(valor: number | undefined | null): string {
  if (valor === undefined || valor === null || isNaN(valor)) {
    return '$ 0';
  }
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(valor);
}

/**
 * Parsea un salario numérico o formateado a entero positivo en COP.
 * Si no es válido o está vacío, recurre a `valorPorDefecto` o al SMMLV vigente 2026.
 */
export function parseSalarioNumerico(
  salario: number | string | undefined | null,
  valorPorDefecto: number = PARAMETROS_COLOMBIA_2026.smmlv
): number {
  if (typeof salario === 'number') {
    return isNaN(salario) || salario <= 0 ? valorPorDefecto : Math.round(salario);
  }
  if (!salario) return valorPorDefecto;
  const limpio = String(salario).replace(/[^0-9]/g, '');
  const parsed = parseInt(limpio, 10);
  return isNaN(parsed) || parsed <= 0 ? valorPorDefecto : parsed;
}

/**
 * Formatea un porcentaje numérico con decimales configurables.
 * Ejemplo: 0.12 -> "12.0%" o 8.33 -> "8.33%"
 */
export function formatPorcentaje(valor: number, decimales = 1): string {
  if (isNaN(valor)) return '0%';
  const num = valor <= 1 && valor > 0 ? valor * 100 : valor;
  return `${num.toFixed(decimales)}%`;
}

/**
 * Convierte de manera segura cualquier excepción capturada (`unknown`) a un mensaje de error legible.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Ocurrió un error inesperado en la operación.';
}
