import { describe, it, expect } from 'vitest';
import {
  extraerIdGoogleDrive,
  esUrlGoogleDrive,
  convertirUrlGoogleDriveAImagen,
  convertirUrlGoogleDriveAPdf,
  obtenerUrlDescargaGoogleDrive
} from '../src/utils/googleDriveUtils';
import { INITIAL_DOCUMENTOS_MURO, CATEGORIAS_DOCUMENTOS_MURO } from '../src/data/documentosMuroData';
import { DocumentoMuroPDF } from '../src/types';

describe('Suite de Pruebas: Utilidades de Google Drive y Muro de Documentos PDF', () => {
  describe('Utilidades de Google Drive (googleDriveUtils)', () => {
    it('Debe extraer el ID de Google Drive desde URLs estándar de vista /file/d/ID/view', () => {
      const url = 'https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view?usp=sharing';
      expect(extraerIdGoogleDrive(url)).toBe('1A2B3C4D5E6F7G8H9I0J');
    });

    it('Debe extraer el ID de Google Drive desde URLs con parámetro id=ID', () => {
      const url = 'https://drive.google.com/open?id=9Z8Y7X6W5V4U3T2S1R';
      expect(extraerIdGoogleDrive(url)).toBe('9Z8Y7X6W5V4U3T2S1R');

      const urlUc = 'https://drive.google.com/uc?export=view&id=abcdef12345';
      expect(extraerIdGoogleDrive(urlUc)).toBe('abcdef12345');
    });

    it('Debe extraer el ID de Google Drive desde URLs de googleusercontent', () => {
      const url = 'https://lh3.googleusercontent.com/d/file_id_test_99';
      expect(extraerIdGoogleDrive(url)).toBe('file_id_test_99');
    });

    it('Debe retornar null o la URL original para enlaces que no son de Google Drive', () => {
      expect(extraerIdGoogleDrive('https://images.unsplash.com/photo-1234')).toBeNull();
      expect(extraerIdGoogleDrive('')).toBeNull();
    });

    it('Debe identificar correctamente URLs de Google Drive vs URLs convencionales', () => {
      expect(esUrlGoogleDrive('https://drive.google.com/file/d/xyz/view')).toBe(true);
      expect(esUrlGoogleDrive('https://docs.google.com/document/d/xyz/edit')).toBe(true);
      expect(esUrlGoogleDrive('https://mi-empresa.co/imagenes/banner.png')).toBe(false);
      expect(esUrlGoogleDrive('')).toBe(false);
    });

    it('Debe convertir enlaces de Google Drive en imágenes directas optimizadas para <img>', () => {
      const driveUrl = 'https://drive.google.com/file/d/12345abcde/view?usp=sharing';
      const imagenUrl = convertirUrlGoogleDriveAImagen(driveUrl);
      expect(imagenUrl).toBe('https://drive.google.com/thumbnail?id=12345abcde&sz=w1600');

      // Si no es Drive, no modifica la URL
      const normalUrl = 'https://images.unsplash.com/photo-1504307651254';
      expect(convertirUrlGoogleDriveAImagen(normalUrl)).toBe(normalUrl);
    });

    it('Debe convertir enlaces de Google Drive en visor embebible PDF /preview para iframes', () => {
      const driveUrl = 'https://drive.google.com/file/d/98765fedcba/view?usp=sharing';
      const pdfPreviewUrl = convertirUrlGoogleDriveAPdf(driveUrl);
      expect(pdfPreviewUrl).toBe('https://drive.google.com/file/d/98765fedcba/preview');

      // Generación de descarga directa
      const descargaUrl = obtenerUrlDescargaGoogleDrive(driveUrl);
      expect(descargaUrl).toBe('https://drive.google.com/uc?export=download&id=98765fedcba');
    });
  });

  describe('Dataset y Modelo del Muro de Documentos (MuroDocumentos)', () => {
    it('Debe contar con categorías institucionales válidas de documentos', () => {
      expect(CATEGORIAS_DOCUMENTOS_MURO.length).toBeGreaterThanOrEqual(6);
      const nombresCat = CATEGORIAS_DOCUMENTOS_MURO.map(c => c.id);
      expect(nombresCat).toContain('Reglamentos & Políticas');
      expect(nombresCat).toContain('Seguridad & SG-SST');
      expect(nombresCat).toContain('Bienestar & Beneficios');
      expect(nombresCat).toContain('Procedimientos & Manuales');
      expect(nombresCat).toContain('Circulares & Comunicados');
      expect(nombresCat).toContain('Legal & Normativa');
    });

    it('Debe contener documentos iniciales representativos con metadatos completos y estado activo', () => {
      expect(INITIAL_DOCUMENTOS_MURO.length).toBeGreaterThan(0);

      const rit = INITIAL_DOCUMENTOS_MURO.find(d => d.codigoDocumento === 'RIT-BGROUP-001');
      expect(rit).toBeDefined();
      expect(rit?.titulo).toContain('Reglamento Interno de Trabajo');
      expect(rit?.obligatorioLectura).toBe(true);
      expect(rit?.activo).toBe(true);
      expect(rit?.urlPdf).toBeTruthy();

      const sst = INITIAL_DOCUMENTOS_MURO.find(d => d.codigoDocumento === 'POL-SST-002');
      expect(sst).toBeDefined();
      expect(sst?.categoria).toBe('Seguridad & SG-SST');
      expect(sst?.version).toBe('v3.2');
    });

    it('Debe permitir filtrar documentos activos para el perfil de colaborador/empleado', () => {
      const docsPrueba: DocumentoMuroPDF[] = [
        {
          id: 'doc-1',
          titulo: 'Documento Visible Empleado',
          descripcion: 'Prueba',
          categoria: 'Reglamentos & Políticas',
          urlPdf: 'https://example.com/doc1.pdf',
          fechaPublicacion: '2026-01-01',
          activo: true,
          autorNombre: 'GH'
        },
        {
          id: 'doc-2',
          titulo: 'Borrador Confidencial Admin',
          descripcion: 'Prueba',
          categoria: 'Reglamentos & Políticas',
          urlPdf: 'https://example.com/doc2.pdf',
          fechaPublicacion: '2026-01-01',
          activo: false,
          autorNombre: 'GH'
        }
      ];

      const visiblesParaEmpleado = docsPrueba.filter(d => d.activo);
      expect(visiblesParaEmpleado.length).toBe(1);
      expect(visiblesParaEmpleado[0].id).toBe('doc-1');
    });
  });
});
