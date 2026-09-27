/**
 * Utilidades para integración y manejo de enlaces a Google Drive
 * Permite optimizar el almacenamiento sin incurrir en costos de hosting
 */

/**
 * Extrae el ID de un archivo de Google Drive desde varios formatos de URL
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  
  // Patrón 1: /file/d/{id}/view
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) return fileMatch[1];

  // Patrón 2: id={id}
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];

  // Patrón 3: /open?id={id}
  const openMatch = url.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch && openMatch[1]) return openMatch[1];

  // Patrón 4: /d/{id}
  const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) return dMatch[1];

  return null;
}

/**
 * Convierte un enlace de Google Drive en un enlace de visualización directa o vista previa
 */
export function formatDriveDirectUrl(url: string): string {
  if (!url) return '';
  const fileId = extractDriveFileId(url);
  if (fileId) {
    // Enlace de previsualización directa de imagen / documento en Google Drive
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
  }
  return url;
}

/**
 * Convierte un enlace de Google Drive a URL de apertura segura en nueva pestaña
 */
export function formatDriveViewUrl(url: string): string {
  if (!url) return '';
  const fileId = extractDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  }
  return url;
}

/**
 * Verifica si una URL corresponde a Google Drive
 */
export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  return /drive\.google\.com|docs\.google\.com/i.test(url);
}
