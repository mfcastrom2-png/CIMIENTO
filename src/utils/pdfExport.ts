/**
 * SERVICIO GLOBAL DE EXPORTACIÓN A PDF (CIMIENTO / B GROUP INGENIERIA S.A.S.)
 *
 * Integra 'jspdf' y 'html2canvas' para capturar nodos por selector CSS,
 * garantizando la máxima fidelidad estética respecto a la interfaz del aplicativo,
 * preservando zonas grises, insignias, fondos, encabezados e información legible.
 *
 * Inyecta dinámicamente las reglas de impresión oficiales de 'src/index.css'
 * y neutraliza funciones CSS no soportadas (oklab, oklch) para evitar que
 * fondos claros o grises se conviertan en azul institucional.
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Genera el bloque de estilos CSS específicos de impresión que se inyectan
 * dinámicamente en el documento clonado durante la exportación a PDF.
 * Replica y adapta las reglas oficiales de 'src/index.css' para el contexto de captura.
 */
export function generarEstilosImpresionInyectados(): string {
  return `
    /* ================================================================= */
    /* ESTILOS DE IMPRESIÓN DINÁMICOS INYECTADOS PARA EXPORTACIÓN A PDF */
    /* ================================================================= */
    @page {
      size: letter portrait;
      margin: 10mm 12mm;
    }

    /* 1. Reset global del lienzo de captura */
    html, body {
      width: 100% !important;
      height: auto !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #FFFFFF !important;
      background-color: #FFFFFF !important;
      color: #0F172A !important;
      font-size: 11pt !important;
      line-height: 1.5 !important;
      overflow: visible !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* 2. Ocultar componentes de interacción y botones en la exportación */
    nav,
    aside,
    header,
    footer,
    .sidebar,
    .no-print,
    .print\\:hidden,
    button,
    .btn-print-hidden,
    input[type="button"],
    input[type="submit"],
    [data-print-hidden="true"],
    .seccion-excluida-impresion,
    [data-seccion-excluida="true"] {
      display: none !important;
      visibility: hidden !important;
    }

    /* 3. Neutralizar modales y contenedores fijos superpuestos */
    .fixed.inset-0,
    .fixed.inset-0:has(.documento-imprimible),
    .fixed.inset-0:has(#area-impresion-documento),
    .fixed.inset-0.modal-imprimible-activo {
      position: static !important;
      inset: auto !important;
      width: 100% !important;
      height: auto !important;
      min-height: auto !important;
      background: transparent !important;
      background-color: transparent !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: visible !important;
      display: block !important;
      z-index: auto !important;
    }

    /* 4. Hoja y contenedor base del documento imprimible */
    .documento-imprimible,
    #area-impresion-documento,
    .hoja-impresion-cst {
      position: relative !important;
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      padding: 0 !important;
      background: #FFFFFF !important;
      background-color: #FFFFFF !important;
      border: none !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      overflow: visible !important;
      display: block !important;
    }

    /* 5. Fidelidad de colores y deshabilitación de sombras que distorsionan */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }

    /* 6. Saltos de página y paginación limpia */
    .salto-pagina,
    .page-break {
      page-break-before: always !important;
      break-before: page !important;
    }

    .evitar-salto,
    .avoid-break,
    .card-imprimible,
    .documento-imprimible .evitar-salto,
    .documento-imprimible .card-imprimible {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    table,
    .documento-imprimible table {
      width: 100% !important;
      page-break-inside: auto !important;
      break-inside: auto !important;
      border-collapse: collapse !important;
    }

    tr, td, th,
    .documento-imprimible tr,
    .documento-imprimible td,
    .documento-imprimible th {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      page-break-after: auto !important;
    }

    thead {
      display: table-header-group !important;
    }

    tfoot {
      display: table-footer-group !important;
    }

    /* 7. Márgenes ajustables y personalizables para diferentes tipos de documentos (cartas vs contratos) */
    .margen-personalizado-cst {
      box-sizing: border-box !important;
      padding: var(--margen-impresion-top, 15mm) var(--margen-impresion-right, 18mm) var(--margen-impresion-bottom, 15mm) var(--margen-impresion-left, 18mm) !important;
      margin: 0 auto !important;
      width: 100% !important;
      max-width: 100% !important;
    }

    .margen-personalizado-cst.tipo-carta,
    .margen-personalizado-cst[data-tipo-documento="carta"] {
      padding: 20mm 20mm 15mm 20mm !important;
    }

    .margen-personalizado-cst.tipo-contrato,
    .margen-personalizado-cst[data-tipo-documento="contrato"] {
      padding: 12mm 15mm 12mm 15mm !important;
    }

    .margen-personalizado-cst.tipo-acta,
    .margen-personalizado-cst[data-tipo-documento="acta"] {
      padding: 15mm 18mm 15mm 18mm !important;
    }

    /* ================================================================= */
    /* PROTECCIÓN DE FONDOS: EVITA CONVERSIÓN INDESEADA A AZUL NAVAL     */
    /* ================================================================= */
    /* Fondos claros, neutros y grises institucionales */
    .bg-white, [class*="bg-white"] {
      background-color: #FFFFFF !important;
    }
    .bg-slate-50, [class*="bg-slate-50"],
    .bg-gray-50, [class*="bg-gray-50"],
    .bg-zinc-50, [class*="bg-zinc-50"] {
      background-color: #F8FAFC !important;
    }
    .bg-slate-100, [class*="bg-slate-100"],
    .bg-gray-100, [class*="bg-gray-100"],
    .bg-zinc-100, [class*="bg-zinc-100"] {
      background-color: #F1F5F9 !important;
    }
    .bg-slate-200, [class*="bg-slate-200"],
    .bg-gray-200, [class*="bg-gray-200"] {
      background-color: #E2E8F0 !important;
    }

    /* Fondos de estado y badges semánticos */
    .bg-emerald-50, [class*="bg-emerald-50"] {
      background-color: #ECFDF5 !important;
    }
    .bg-emerald-100, [class*="bg-emerald-100"] {
      background-color: #D1FAE5 !important;
    }
    .bg-rose-50, [class*="bg-rose-50"] {
      background-color: #FFF1F2 !important;
    }
    .bg-rose-100, [class*="bg-rose-100"] {
      background-color: #FEE2E2 !important;
    }
    .bg-amber-50, [class*="bg-amber-50"] {
      background-color: #FFFBEB !important;
    }
    .bg-amber-100, [class*="bg-amber-100"] {
      background-color: #FEF3C7 !important;
    }
    .bg-blue-50, [class*="bg-blue-50"] {
      background-color: #EFF6FF !important;
    }

    /* Gradients suaves hacia transparente -> fondo neutro claro */
    .bg-gradient-to-br, [class*="bg-gradient-to-br"] {
      background-image: none !important;
      background-color: #F8FAFC !important;
    }

    /* Fondos institucionales OSCUROS (ÚNICAMENTE cuando la clase lo especifica) */
    .bg-\\[\\#18235C\\], [class*="bg-[#18235C]"] {
      background-color: #18235C !important;
      color: #FFFFFF !important;
    }
    .bg-\\[\\#101740\\], [class*="bg-[#101740]"] {
      background-color: #101740 !important;
      color: #FFFFFF !important;
    }
    .bg-\\[\\#18235C\\]\\/5, [class*="bg-[#18235C]/5"] {
      background-color: #F8FAFC !important;
    }
    .bg-\\[\\#18235C\\]\\/10, [class*="bg-[#18235C]/10"] {
      background-color: #F1F5F9 !important;
    }
    .bg-\\[\\#8FA7D6\\]\\/15, [class*="bg-[#8FA7D6]/15"] {
      background-color: #EDF2FA !important;
    }
    .bg-\\[\\#8FA7D6\\]\\/20, [class*="bg-[#8FA7D6]/20"] {
      background-color: #E2EAF7 !important;
    }
    .bg-\\[\\#00FF00\\], [class*="bg-[#00FF00]"] {
      background-color: #00FF00 !important;
      color: #18235C !important;
    }

    /* Colores tipográficos garantizados */
    .text-\\[\\#18235C\\], [class*="text-[#18235C]"] {
      color: #18235C !important;
    }
    .text-\\[\\#101740\\], [class*="text-[#101740]"] {
      color: #101740 !important;
    }
    .text-\\[\\#282829\\], [class*="text-[#282829]"] {
      color: #282829 !important;
    }
    .text-\\[\\#282829\\]\\/70, [class*="text-[#282829]/70"] {
      color: rgba(40, 40, 41, 0.75) !important;
    }
    .text-\\[\\#282829\\]\\/80, [class*="text-[#282829]/80"] {
      color: rgba(40, 40, 41, 0.85) !important;
    }
    .text-white, [class*="text-white"] {
      color: #FFFFFF !important;
    }
    .text-slate-800, [class*="text-slate-800"] {
      color: #1E293B !important;
    }
    .text-slate-700, [class*="text-slate-700"] {
      color: #334155 !important;
    }
    .text-slate-600, [class*="text-slate-600"] {
      color: #475569 !important;
    }
    .text-slate-500, [class*="text-slate-500"] {
      color: #64748B !important;
    }
    .text-emerald-700, [class*="text-emerald-700"] {
      color: #047857 !important;
    }
    .text-rose-700, [class*="text-rose-700"] {
      color: #BE123C !important;
    }

    /* Bordes con contraste legible */
    .border-\\[\\#18235C\\], [class*="border-[#18235C]"] {
      border-color: #18235C !important;
    }
    .border-\\[\\#8FA7D6\\], [class*="border-[#8FA7D6]"] {
      border-color: #8FA7D6 !important;
    }
    .border-\\[\\#8FA7D6\\]\\/20, [class*="border-[#8FA7D6]/20"] {
      border-color: rgba(143, 167, 214, 0.25) !important;
    }
    .border-\\[\\#8FA7D6\\]\\/30, [class*="border-[#8FA7D6]/30"] {
      border-color: rgba(143, 167, 214, 0.35) !important;
    }
    .border-\\[\\#8FA7D6\\]\\/40, [class*="border-[#8FA7D6]/40"] {
      border-color: rgba(143, 167, 214, 0.45) !important;
    }
    .border-slate-200, [class*="border-slate-200"] {
      border-color: #E2E8F0 !important;
    }
    .border-slate-300, [class*="border-slate-300"] {
      border-color: #CBD5E1 !important;
    }
  `;
}

/**
 * Sanitiza cualquier cadena CSS eliminando funciones de color no soportadas por html2canvas
 * (oklab, oklch, color-mix) sin sobreescribir colores de fondo con el azul institucional.
 */
export function sanearTextoCssSinOklab(cssText: string): string {
  if (!cssText || (!cssText.includes('oklab') && !cssText.includes('oklch') && !cssText.includes('color-mix'))) {
    return cssText;
  }

  // Reemplazar funciones de color oklab/oklch/color-mix en las hojas de estilo por 'transparent' o 'inherit'
  let resultado = cssText.replace(
    /(oklab|oklch|color-mix)\s*\((?:[^()]+|\((?:[^()]+|\([^()]*\))*\))*\)/gi,
    'transparent'
  );

  resultado = resultado.replace(/\b(oklab|oklch)\b/gi, 'rgb');

  return resultado;
}

/**
 * Inyecta dinámicamente el bloque de estilos CSS específicos de impresión
 * dentro del clon del documento de html2canvas antes de capturar el lienzo.
 */
export function inyectarEstilosImpresionEnClon(clonedDoc: Document, clonedTarget: HTMLElement): void {
  // 1. Inyectar hoja de estilos de impresión dinámica
  let styleEl = clonedDoc.getElementById('pdf-export-dynamic-print-styles') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = clonedDoc.createElement('style');
    styleEl.id = 'pdf-export-dynamic-print-styles';
    styleEl.setAttribute('type', 'text/css');
    styleEl.textContent = generarEstilosImpresionInyectados();

    const parent = clonedDoc.head || clonedDoc.body || clonedTarget.parentElement || clonedTarget;
    parent.appendChild(styleEl);
  } else {
    styleEl.textContent = generarEstilosImpresionInyectados();
  }

  // 2. Ocultar botones e interfaces de interacción en el clon
  const elementosOcultar = clonedDoc.querySelectorAll(
    'button, .no-print, .print\\:hidden, .btn-print-hidden, nav, aside, header, footer, [data-print-hidden="true"], input[type="button"], input[type="submit"], .seccion-excluida-impresion, [data-seccion-excluida="true"]'
  );
  elementosOcultar.forEach(el => {
    if (el instanceof HTMLElement) {
      el.style.setProperty('display', 'none', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
    }
  });

  // 3. Fondo base limpio para el contenedor del documento
  clonedTarget.style.setProperty('background-color', '#FFFFFF', 'important');
  clonedTarget.style.setProperty('box-shadow', 'none', 'important');

  // 4. Sanitizar todas las etiquetas <style> existentes en la copia del documento (evita crash por oklab de Tailwind v4)
  const styles = clonedDoc.querySelectorAll('style:not(#pdf-export-dynamic-print-styles)');
  styles.forEach(style => {
    if (style.textContent) {
      style.textContent = sanearTextoCssSinOklab(style.textContent);
    }
  });
}

/**
 * Copia los colores computados (convertidos por el navegador a RGB/RGBA) desde el DOM original
 * hacia el clon que captura html2canvas, preservando fondos grises, insignias y legibilidad de textos.
 */
export function copiarEstilosComputadosOriginales(targetOriginal: HTMLElement, clonedTarget: HTMLElement): void {
  const originalNodes = Array.from(targetOriginal.querySelectorAll('*')).concat([targetOriginal]);
  const clonedNodes = Array.from(clonedTarget.querySelectorAll('*')).concat([clonedTarget]);

  for (let i = 0; i < originalNodes.length; i++) {
    const orig = originalNodes[i] as HTMLElement;
    const clone = clonedNodes[i] as HTMLElement;

    if (!orig || !clone) continue;

    try {
      const comp = window.getComputedStyle(orig);
      const className = orig.className || '';
      const classStr = typeof className === 'string' ? className : '';

      // 1. Color de Texto
      if (comp.color && !comp.color.includes('oklab') && !comp.color.includes('oklch')) {
        clone.style.color = comp.color;
      } else if (classStr) {
        if (classStr.includes('text-white')) {
          clone.style.color = 'rgb(255, 255, 255)';
        } else if (classStr.includes('text-emerald-700') || classStr.includes('text-emerald-800') || classStr.includes('text-emerald-900')) {
          clone.style.color = 'rgb(4, 120, 87)';
        } else if (classStr.includes('text-rose-700') || classStr.includes('text-rose-800')) {
          clone.style.color = 'rgb(190, 18, 60)';
        } else if (classStr.includes('text-amber-700') || classStr.includes('text-amber-800')) {
          clone.style.color = 'rgb(180, 83, 9)';
        } else if (classStr.includes('text-[#18235C]') || classStr.includes('text-[#101740]')) {
          clone.style.color = 'rgb(24, 35, 92)';
        } else if (classStr.includes('text-slate-500') || classStr.includes('text-slate-600') || classStr.includes('text-[#282829]/70')) {
          clone.style.color = 'rgb(71, 85, 105)';
        } else if (classStr.includes('text-[#282829]') || classStr.includes('text-slate-800') || classStr.includes('text-slate-900')) {
          clone.style.color = 'rgb(15, 23, 42)';
        }
      }

      // 2. Color de Fondo (Garantiza fondos grises bg-slate-50, bg-gray-100, etc. y NUNCA azul indeseado)
      const isExplicitDarkNavy = classStr.includes('bg-[#18235C]') || classStr.includes('bg-[#101740]');
      const isExplicitNavyTint = classStr.includes('bg-[#18235C]/5') || classStr.includes('bg-[#18235C]/10');
      const isGreyBackground = classStr.includes('bg-slate-50') || classStr.includes('bg-gray-50') ||
                                classStr.includes('bg-slate-100') || classStr.includes('bg-gray-100') ||
                                classStr.includes('bg-slate-200') || classStr.includes('bg-gray-200');

      if (isExplicitDarkNavy) {
        clone.style.backgroundColor = 'rgb(24, 35, 92)';
      } else if (isExplicitNavyTint) {
        clone.style.backgroundColor = classStr.includes('bg-[#18235C]/10') ? 'rgb(241, 245, 249)' : 'rgb(248, 250, 252)';
      } else if (isGreyBackground) {
        if (classStr.includes('bg-slate-100') || classStr.includes('bg-gray-100')) {
          clone.style.backgroundColor = 'rgb(241, 245, 249)'; // Gris suave
        } else if (classStr.includes('bg-slate-200') || classStr.includes('bg-gray-200')) {
          clone.style.backgroundColor = 'rgb(226, 232, 240)';
        } else {
          clone.style.backgroundColor = 'rgb(248, 250, 252)'; // Gris claro
        }
      } else if (classStr.includes('bg-white')) {
        clone.style.backgroundColor = 'rgb(255, 255, 255)';
      } else if (classStr.includes('bg-emerald-50') || classStr.includes('bg-emerald-100')) {
        clone.style.backgroundColor = classStr.includes('bg-emerald-100') ? 'rgb(209, 250, 229)' : 'rgb(236, 253, 245)';
      } else if (classStr.includes('bg-rose-50') || classStr.includes('bg-rose-100')) {
        clone.style.backgroundColor = classStr.includes('bg-rose-100') ? 'rgb(254, 226, 226)' : 'rgb(255, 241, 242)';
      } else if (classStr.includes('bg-amber-50') || classStr.includes('bg-amber-100')) {
        clone.style.backgroundColor = 'rgb(254, 243, 199)';
      } else if (
        comp.backgroundColor &&
        !comp.backgroundColor.includes('oklab') &&
        !comp.backgroundColor.includes('oklch') &&
        comp.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
        comp.backgroundColor !== 'transparent'
      ) {
        // Protección adicional: Si el color computado es erróneamente azul navy pero la clase no lo declara, neutralizar a blanco/gris
        if (comp.backgroundColor === 'rgb(24, 35, 92)' || comp.backgroundColor === '#18235C') {
          clone.style.backgroundColor = 'rgb(255, 255, 255)';
        } else {
          clone.style.backgroundColor = comp.backgroundColor;
        }
      }

      // 3. Color de Borde
      if (comp.borderColor && !comp.borderColor.includes('oklab') && !comp.borderColor.includes('oklch')) {
        clone.style.borderColor = comp.borderColor;
      } else if (classStr.includes('border-')) {
        if (classStr.includes('border-[#18235C]')) {
          clone.style.borderColor = 'rgb(24, 35, 92)';
        } else if (classStr.includes('border-[#8FA7D6]')) {
          clone.style.borderColor = 'rgb(143, 167, 214)';
        } else if (classStr.includes('border-slate-200') || classStr.includes('border-slate-100')) {
          clone.style.borderColor = 'rgb(226, 232, 240)';
        }
      }
    } catch {}
  }
}

interface BoundaryInfo {
  top: number;
  bottom: number;
  forceBreakBefore?: boolean;
}

/**
 * Busca un contenedor por selector CSS y genera un archivo PDF descargable
 * manteniendo de forma 100% fiel la estética visual, incluyendo fondos grises,
 * insignias y legibilidad de datos.
 *
 * @param selector Selector CSS (ej. '.documento-imprimible', '#area-impresion-certificado')
 * @param nombreArchivo Nombre del archivo PDF resultante (ej. 'Certificado_Laboral.pdf')
 */
export async function exportarContenedorAPDF(
  selector: string = '.documento-imprimible',
  nombreArchivo: string = 'documento.pdf'
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    let targetElement: HTMLElement | null = null;

    if (selector) {
      const selectorLimpio = selector.startsWith('#') || selector.startsWith('.')
        ? selector
        : `#${selector}`;

      const candidatos = document.querySelectorAll(selectorLimpio);
      if (candidatos.length > 0) {
        // Seleccionar el último elemento coincidente (ideal para modales activos)
        targetElement = candidatos[candidatos.length - 1] as HTMLElement;
      }

      if (!targetElement && !selector.startsWith('#') && !selector.startsWith('.')) {
        targetElement = document.getElementById(selector);
      }
    }

    // Fallback al primer .documento-imprimible si el selector inicial no tuvo coincidencias
    if (!targetElement) {
      const fallbackContenedores = document.querySelectorAll('.documento-imprimible');
      if (fallbackContenedores.length > 0) {
        targetElement = fallbackContenedores[fallbackContenedores.length - 1] as HTMLElement;
      }
    }

    if (!targetElement) {
      console.warn(`[pdfExport] No se encontró ningún nodo HTML con el selector: "${selector}" o la clase ".documento-imprimible".`);
      return false;
    }

    // Registrar posiciones de los bloques protegidos antes/durante la captura
    const targetRect = targetElement.getBoundingClientRect();
    const protectedNodes = Array.from(
      targetElement.querySelectorAll('.evitar-salto, .avoid-break, .card-imprimible, tr, .salto-pagina, .page-break')
    );

    // Sanitización del nombre de archivo
    const fileName = nombreArchivo.endsWith('.pdf') ? nombreArchivo : `${nombreArchivo}.pdf`;
    const cleanFileName = fileName.replace(/[\\/:*?"<>|]/g, '_');

    // Elemento original de referencia para copiar colores exactos
    const originalRefElement = targetElement;

    // Captura con html2canvas manteniendo fielmente la estética visual
    const canvas = await html2canvas(targetElement, {
      scale: 2, // Alta nitidez (300 DPI equivalente)
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      windowWidth: targetElement.scrollWidth,
      windowHeight: targetElement.scrollHeight,
      onclone: (clonedDoc, clonedElement) => {
        // 1. Inyectar dinámicamente estilos de impresión específicos de 'src/index.css'
        inyectarEstilosImpresionEnClon(clonedDoc, clonedElement as HTMLElement);
        // 2. Copiar colores computados y proteger fondos grises contra conversiones indeseadas
        copiarEstilosComputadosOriginales(originalRefElement, clonedElement as HTMLElement);
      }
    });

    // Calcular escala de pixeles del canvas respecto al rect DOM
    const scaleY = canvas.height / (targetElement.scrollHeight || 1);

    const boundaries: BoundaryInfo[] = protectedNodes.map(node => {
      const rect = node.getBoundingClientRect();
      const topPx = (rect.top - targetRect.top) * scaleY;
      const bottomPx = (rect.bottom - targetRect.top) * scaleY;
      const isForce = node.classList.contains('salto-pagina') || node.classList.contains('page-break');
      return { top: topPx, bottom: bottomPx, forceBreakBefore: isForce };
    }).sort((a, b) => a.top - b.top);

    // Configuración PDF Formato Carta (Letter: 215.9mm x 279.4mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10; // Margen editorial de 10mm
    const contentWidth = pdfWidth - margin * 2;
    const contentHeight = pdfHeight - margin * 2;

    // Altura del área imprimible expresada en píxeles del canvas
    const pageContentHeightPx = (canvas.width * contentHeight) / contentWidth;

    const yBreaks: number[] = [0];
    let currentY = 0;
    const totalHeight = canvas.height;

    // Algoritmo de cálculo de saltos respetando 'evitar-salto' y filas 'tr'
    while (currentY < totalHeight) {
      const idealNextY = currentY + pageContentHeightPx;

      if (idealNextY >= totalHeight - 10) {
        yBreaks.push(totalHeight);
        break;
      }

      let adjustedNextY = idealNextY;

      // 1. Forzar salto inmediato si existe 'salto-pagina'
      const forceBreak = boundaries.find(b => b.forceBreakBefore && b.top > currentY + 20 && b.top <= idealNextY);
      if (forceBreak) {
        adjustedNextY = forceBreak.top;
      } else {
        // 2. Si el punto ideal de corte parte un elemento con 'evitar-salto' o 'tr', recortar antes del elemento
        const intersecting = boundaries.find(
          b => b.top < idealNextY && b.bottom > idealNextY && b.top > currentY + 30
        );
        if (intersecting) {
          adjustedNextY = intersecting.top;
        }
      }

      // Evitar bucles infinitos si un elemento es más alto que una página entera
      if (adjustedNextY <= currentY + 40) {
        adjustedNextY = idealNextY;
      }

      yBreaks.push(adjustedNextY);
      currentY = adjustedNextY;
    }

    // Renderizado multipágina dinámico con cortes limpios
    for (let i = 0; i < yBreaks.length - 1; i++) {
      const startY = yBreaks[i];
      const endY = yBreaks[i + 1];
      const sliceHeight = endY - startY;

      if (sliceHeight <= 0) continue;

      // Crear lienzo secundario para el trozo de página
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeight;

      const ctx = sliceCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceHeight);
        ctx.drawImage(
          canvas,
          0, startY, canvas.width, sliceHeight,
          0, 0, canvas.width, sliceHeight
        );
      }

      const sliceImgData = sliceCanvas.toDataURL('image/png');
      const slicePdfHeight = (sliceHeight * contentWidth) / canvas.width;

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(sliceImgData, 'PNG', margin, margin, contentWidth, slicePdfHeight);
    }

    // Disparar la descarga en el navegador
    pdf.save(cleanFileName);
    return true;
  } catch (error) {
    console.error('[pdfExport] Error generando el archivo PDF:', error);
    return false;
  }
}
