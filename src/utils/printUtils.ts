/**
 * UTILIDAD MAESTRA DE IMPRESIÓN Y EXPORTACIÓN A PDF (CIMIENTO / B GROUP INGENIERIA S.A.S.)
 */

import { exportarContenedorAPDF } from './pdfExport';

export { exportarContenedorAPDF };

export const exportarAPdf = (selector?: string | HTMLElement | null, nombreArchivo?: string) => {
  const selString = typeof selector === 'string' ? selector : '.documento-imprimible';
  return exportarContenedorAPDF(selString, nombreArchivo || 'documento.pdf');
};

export const descargarElementoComoPdf = exportarAPdf;

/**
 * Aplica temporalmente exclusión a las secciones que no hayan sido seleccionadas por el usuario,
 * y retorna una función de restauración para dejar el DOM en su estado original.
 */
export function aplicarExclusionSecciones(elementoId: string, seccionesActivas: string[]): () => void {
  if (typeof document === 'undefined') return () => {};

  const targetSelector = elementoId.startsWith('#') || elementoId.startsWith('.')
    ? elementoId
    : `#${elementoId}`;

  const container = document.querySelector(targetSelector) || document.querySelector('.documento-imprimible');
  if (!container) return () => {};

  const elementosSeccion = container.querySelectorAll('[data-seccion-id]');
  const estadosPrevios: { el: Element; excluida: boolean }[] = [];

  elementosSeccion.forEach(el => {
    const seccionId = el.getAttribute('data-seccion-id');
    const estaActiva = !seccionId || seccionesActivas.includes(seccionId);
    estadosPrevios.push({
      el,
      excluida: el.classList.contains('seccion-excluida-impresion')
    });

    if (!estaActiva) {
      el.classList.add('seccion-excluida-impresion');
      el.setAttribute('data-seccion-excluida', 'true');
    } else {
      el.classList.remove('seccion-excluida-impresion');
      el.removeAttribute('data-seccion-excluida');
    }
  });

  return () => {
    estadosPrevios.forEach(({ el, excluida }) => {
      if (!excluida) {
        el.classList.remove('seccion-excluida-impresion');
        el.removeAttribute('data-seccion-excluida');
      } else {
        el.classList.add('seccion-excluida-impresion');
        el.setAttribute('data-seccion-excluida', 'true');
      }
    });
  };
}

/**
 * Imprime el documento nativamente y si falla o se cancela ofrece descarga directa de PDF
 */
export function imprimirDocumento(tituloDocumento?: string, elementoId?: string): void {
  if (typeof window === 'undefined') return;

  const originalTitle = document.title;
  if (tituloDocumento) {
    document.title = tituloDocumento.replace(/[\\/:*?"<>|]/g, '_');
  }

  document.body.classList.add('imprimiendo-activo');

  const restaurar = () => {
    document.title = originalTitle;
    document.body.classList.remove('imprimiendo-activo');
    window.removeEventListener('afterprint', restaurar);
  };

  window.addEventListener('afterprint', restaurar);

  try {
    window.print();
  } catch (e) {
    console.warn('window.print no disponible, exportando a PDF directo...');
    exportarContenedorAPDF(elementoId || '.documento-imprimible', tituloDocumento || 'documento.pdf');
  }

  setTimeout(() => {
    document.title = originalTitle;
    document.body.classList.remove('imprimiendo-activo');
  }, 1000);
}

/**
 * Imprime el documento respetando la selección específica de secciones del usuario.
 */
export function imprimirDocumentoConSecciones(
  tituloDocumento?: string,
  elementoId?: string,
  seccionesActivas?: string[]
): void {
  if (typeof window === 'undefined') return;

  const elementoSelector = elementoId || 'area-impresion-repositorio-documentos';
  const restaurarSecciones = seccionesActivas && seccionesActivas.length > 0
    ? aplicarExclusionSecciones(elementoSelector, seccionesActivas)
    : () => {};

  const originalTitle = document.title;
  if (tituloDocumento) {
    document.title = tituloDocumento.replace(/[\\/:*?"<>|]/g, '_');
  }

  document.body.classList.add('imprimiendo-activo');

  const restaurar = () => {
    document.title = originalTitle;
    document.body.classList.remove('imprimiendo-activo');
    restaurarSecciones();
    window.removeEventListener('afterprint', restaurar);
  };

  window.addEventListener('afterprint', restaurar);

  try {
    window.print();
  } catch (e) {
    console.warn('window.print no disponible, exportando a PDF directo...');
    exportarContenedorAPDF(elementoSelector, tituloDocumento || 'documento.pdf');
  }

  setTimeout(() => {
    document.title = originalTitle;
    document.body.classList.remove('imprimiendo-activo');
    restaurarSecciones();
  }, 1000);
}

/**
 * Exporta el contenedor a PDF incluyendo únicamente las secciones seleccionadas por el usuario.
 */
export async function exportarAPdfConSecciones(
  elementoId: string = '.documento-imprimible',
  nombreArchivo: string = 'documento.pdf',
  seccionesActivas?: string[]
): Promise<boolean> {
  const restaurarSecciones = seccionesActivas && seccionesActivas.length > 0
    ? aplicarExclusionSecciones(elementoId, seccionesActivas)
    : () => {};

  try {
    return await exportarContenedorAPDF(elementoId, nombreArchivo);
  } finally {
    restaurarSecciones();
  }
}
