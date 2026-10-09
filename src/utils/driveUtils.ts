/**
 * Utilidades para integración y manejo de enlaces a Google Drive
 * Permite optimizar el almacenamiento sin incurrir en costos de hosting
 * Soporta renderizado de imágenes públicas sin requerir cuenta propietaria activa
 */

/**
 * Extrae el ID de un archivo de Google Drive desde varios formatos de URL
 */
export function extractDriveFileId(url: string): string | null {
  if (!url) return null;
  
  // Patrón 1: /file/d/{id}/view o /file/d/{id}
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) return fileMatch[1];

  // Patrón 2: id={id}
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];

  // Patrón 3: /open?id={id}
  const openMatch = url.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch && openMatch[1]) return openMatch[1];

  // Patrón 4: /d/{id} (incluye lh3.googleusercontent.com/d/{id})
  const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (dMatch && dMatch[1]) return dMatch[1];

  return null;
}

/**
 * Convierte un enlace de Google Drive en una URL directa de imagen que se visualiza
 * de forma universal para usuarios sin sesión activa de Google.
 * lh3.googleusercontent.com es el CDN público de Google Drive que no requiere cookies ni redirige al login.
 */
export function formatDriveDirectUrl(url: string): string {
  if (!url) return '';
  const fileId = extractDriveFileId(url);
  if (fileId) {
    // CDN de Google Drive de alta velocidad accesible públicamente sin sesión
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }
  return url;
}

/**
 * Obtiene una lista ordenada de URLs candidatas para intentar cargar una imagen de Google Drive.
 * Permite failover automático si el navegador o firewall bloquea un subdominio específico.
 */
export function getDriveImageCandidates(url: string): string[] {
  if (!url) return [];
  const fileId = extractDriveFileId(url);
  if (!fileId) return [url];

  return [
    `https://lh3.googleusercontent.com/d/${fileId}`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    url
  ];
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
 * Verifica si una URL corresponde a Google Drive o su CDN público
 */
export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false;
  return /drive\.google\.com|docs\.google\.com|googleusercontent\.com/i.test(url);
}
