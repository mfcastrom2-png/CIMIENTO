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
