/**
 * Utilidades para detección, parseo y conversión de URLs de Google Drive
 * para imágenes embebibles y visores interactivos de documentos PDF.
 */

/**
 * Extrae el ID único del archivo de Google Drive desde diversos formatos de URL compartida:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 * - https://drive.google.com/uc?export=view&id=FILE_ID
 * - https://docs.google.com/file/d/FILE_ID/...
 * - https://lh3.googleusercontent.com/d/FILE_ID
 */
export function extraerIdGoogleDrive(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();

  // Caso 1: /file/d/ID/... o /d/ID/...
  const matchFileD = cleanUrl.match(/\/(?:file\/d|d|document\/d|presentation\/d|spreadsheets\/d)\/([a-zA-Z0-9_-]+)/i);
  if (matchFileD && matchFileD[1]) {
    return matchFileD[1];
  }

  // Caso 2: id=ID o id=ID&...
  const matchIdParam = cleanUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/i);
  if (matchIdParam && matchIdParam[1]) {
    return matchIdParam[1];
  }

  // Caso 3: googleusercontent.com/d/ID
  const matchUserContent = cleanUrl.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i);
  if (matchUserContent && matchUserContent[1]) {
    return matchUserContent[1];
  }

  return null;
}

/**
 * Verifica si una URL corresponde a un recurso alojado en Google Drive o Google Docs
 */
export function esUrlGoogleDrive(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase().trim();
  return (
    lower.includes('drive.google.com') ||
    lower.includes('docs.google.com') ||
    lower.includes('googleusercontent.com/d/')
  );
}

/**
 * Transforma una URL de Google Drive en una URL directa de imagen de alta resolución
 * optimizada para etiquetas <img> y fondos visuales sin bloqueo de CORS.
 */
export function convertirUrlGoogleDriveAImagen(url: string, anchoMax: number = 1600): string {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();

  if (!esUrlGoogleDrive(cleanUrl)) {
    return cleanUrl;
  }

  const fileId = extraerIdGoogleDrive(cleanUrl);
  if (!fileId) {
    return cleanUrl;
  }

  // Google Drive thumbnail endpoint entrega la imagen renderizable con parámetros de tamaño
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${anchoMax}`;
}

/**
 * Transforma una URL de Google Drive en un visor embebible de PDF listo para <iframe>
 * (modo /preview de Google Drive).
 */
export function convertirUrlGoogleDriveAPdf(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();

  if (!esUrlGoogleDrive(cleanUrl)) {
    return cleanUrl;
  }

  const fileId = extraerIdGoogleDrive(cleanUrl);
  if (!fileId) {
    return cleanUrl;
  }

  return `https://drive.google.com/file/d/${fileId}/preview`;
}

/**
 * Obtiene la URL de descarga directa de un archivo de Google Drive
 */
export function obtenerUrlDescargaGoogleDrive(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const cleanUrl = url.trim();

  if (!esUrlGoogleDrive(cleanUrl)) {
    return cleanUrl;
  }

  const fileId = extraerIdGoogleDrive(cleanUrl);
  if (!fileId) {
    return cleanUrl;
  }

  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}
