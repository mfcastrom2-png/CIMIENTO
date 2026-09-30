/**
 * SERVICIO GLOBAL DE EXPORTACIÓN A PDF (CIMIENTO / B GROUP INGENIERIA S.A.S.)
 *
 * Integra 'jspdf' y 'html2canvas' para capturar nodos por selector CSS,
 * garantizando la máxima fidelidad estética respecto a la interfaz del aplicativo,
 * preservando zonas grises, insignias, fondos, encabezados e información legible.
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Sanitiza cualquier cadena CSS eliminando funciones de color no soportadas por html2canvas
 * sin sobreescribir colores de fondo con el azul institucional.
 */
function sanearTextoCssSinOklab(cssText: string): string {
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
 * Copia los colores computados (convertidos por el navegador a RGB/RGBA) desde el DOM original
 * hacia el clon que captura html2canvas, preservando fondos grises, insignias y legibilidad de textos.
 */
function copiarEstilosComputadosOriginales(targetOriginal: HTMLElement, clonedTarget: HTMLElement) {
  const originalNodes = Array.from(targetOriginal.querySelectorAll('*')).concat([targetOriginal]);
  const clonedNodes = Array.from(clonedTarget.querySelectorAll('*')).concat([clonedTarget]);

  for (let i = 0; i < originalNodes.length; i++) {
    const orig = originalNodes[i] as HTMLElement;
    const clone = clonedNodes[i] as HTMLElement;

    if (!orig || !clone) continue;

    try {
      const comp = window.getComputedStyle(orig);

      // 1. Color de Texto
      if (comp.color && !comp.color.includes('oklab') && !comp.color.includes('oklch')) {
        clone.style.color = comp.color;
      } else {
        const className = orig.className || '';
        if (typeof className === 'string') {
          if (className.includes('text-white')) {
            clone.style.color = 'rgb(255, 255, 255)';
          } else if (className.includes('text-emerald-700') || className.includes('text-emerald-800') || className.includes('text-emerald-900')) {
            clone.style.color = 'rgb(6, 95, 70)';
          } else if (className.includes('text-rose-700') || className.includes('text-rose-800')) {
            clone.style.color = 'rgb(190, 18, 60)';
          } else if (className.includes('text-amber-700') || className.includes('text-amber-800')) {
            clone.style.color = 'rgb(180, 83, 9)';
          } else if (className.includes('text-[#18235C]') || className.includes('text-[#101740]')) {
            clone.style.color = 'rgb(24, 35, 92)';
          } else if (className.includes('text-slate-500') || className.includes('text-slate-600') || className.includes('text-[#282829]/70')) {
            clone.style.color = 'rgb(71, 85, 105)';
          } else if (className.includes('text-[#282829]') || className.includes('text-slate-800') || className.includes('text-slate-900')) {
            clone.style.color = 'rgb(15, 23, 42)';
          }
        }
      }

      // 2. Color de Fondo (Mantiene fondos grises bg-slate-50, bg-gray-100, etc.)
      if (comp.backgroundColor && !comp.backgroundColor.includes('oklab') && !comp.backgroundColor.includes('oklch') && comp.backgroundColor !== 'rgba(0, 0, 0, 0)' && comp.backgroundColor !== 'transparent') {
        clone.style.backgroundColor = comp.backgroundColor;
      } else {
        const className = orig.className || '';
        if (typeof className === 'string') {
          if (className.includes('bg-[#18235C]') || className.includes('bg-[#101740]')) {
            clone.style.backgroundColor = 'rgb(24, 35, 92)';
          } else if (className.includes('bg-slate-50') || className.includes('bg-gray-50') || className.includes('bg-zinc-50')) {
            clone.style.backgroundColor = 'rgb(248, 250, 252)'; // Gris claro de la app
          } else if (className.includes('bg-slate-100') || className.includes('bg-gray-100')) {
            clone.style.backgroundColor = 'rgb(241, 245, 249)'; // Gris suave de la app
          } else if (className.includes('bg-slate-200') || className.includes('bg-gray-200')) {
            clone.style.backgroundColor = 'rgb(226, 232, 240)';
          } else if (className.includes('bg-emerald-100')) {
            clone.style.backgroundColor = 'rgb(209, 250, 229)';
          } else if (className.includes('bg-emerald-50')) {
            clone.style.backgroundColor = 'rgb(236, 253, 245)';
          } else if (className.includes('bg-rose-100')) {
            clone.style.backgroundColor = 'rgb(254, 226, 226)';
          } else if (className.includes('bg-rose-50')) {
            clone.style.backgroundColor = 'rgb(255, 241, 242)';
          } else if (className.includes('bg-amber-100') || className.includes('bg-amber-50')) {
            clone.style.backgroundColor = 'rgb(254, 243, 199)';
          } else if (className.includes('bg-white')) {
            clone.style.backgroundColor = 'rgb(255, 255, 255)';
          }
        }
      }

      // 3. Color de Borde
      if (comp.borderColor && !comp.borderColor.includes('oklab') && !comp.borderColor.includes('oklch')) {
        clone.style.borderColor = comp.borderColor;
      } else {
        const className = orig.className || '';
        if (typeof className === 'string' && className.includes('border-')) {
          if (className.includes('border-[#18235C]')) {
            clone.style.borderColor = 'rgb(24, 35, 92)';
          } else if (className.includes('border-[#8FA7D6]')) {
            clone.style.borderColor = 'rgb(143, 167, 214)';
          } else if (className.includes('border-slate-200') || className.includes('border-slate-100')) {
            clone.style.borderColor = 'rgb(226, 232, 240)';
          }
        }
      }
    } catch {}
  }
}

/**
 * Aplica reglas de preparación para la captura en el clon del DOM de html2canvas.
 */
function aplicarReglasImpresionEnClon(clonedDoc: Document, clonedTarget: HTMLElement) {
  // 1. Ocultar botones e interfaces de interacción
  const elementosOcultar = clonedDoc.querySelectorAll(
    'button, .no-print, .print\\:hidden, .btn-print-hidden, nav, aside, header, footer, [data-print-hidden="true"]'
  );
  elementosOcultar.forEach(el => {
    if (el instanceof HTMLElement) {
      el.style.setProperty('display', 'none', 'important');
    }
  });

  // 2. Fondo base limpio para el contenedor del documento
  clonedTarget.style.setProperty('background-color', '#FFFFFF', 'important');
  clonedTarget.style.setProperty('box-shadow', 'none', 'important');

  // 3. Sanitizar todas las etiquetas <style> presentes en la copia del documento (evita crash por oklab)
  const styles = clonedDoc.querySelectorAll('style');
  styles.forEach(style => {
    if (style.textContent) {
      style.textContent = sanearTextoCssSinOklab(style.textContent);
    }
  });
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
        aplicarReglasImpresionEnClon(clonedDoc, clonedElement as HTMLElement);
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
