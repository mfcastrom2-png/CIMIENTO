/**
 * UTILIDAD DE DÍAS FESTIVOS Y CÁLCULO DE DÍAS HÁBILES EN COLOMBIA (LEY EMILIANI 51 DE 1983)
 * Código Sustantivo del Trabajo (CST) - Calendario de Festivos Oficiales 2026 y 2027
 */

export interface FestivoColombia {
  fecha: string; // Formato YYYY-MM-DD
  nombre: string;
}

// Lista oficial de festivos en Colombia para 2026 y 2027
export const FESTIVOS_COLOMBIA_2026_2027: FestivoColombia[] = [
  // FESTIVOS 2026
  { fecha: '2026-01-01', nombre: 'Año Nuevo' },
  { fecha: '2026-01-12', nombre: 'Día de los Reyes Magos' },
  { fecha: '2026-03-23', nombre: 'Día de San José' },
  { fecha: '2026-04-02', nombre: 'Jueves Santo' },
  { fecha: '2026-04-03', nombre: 'Viernes Santo' },
  { fecha: '2026-05-01', nombre: 'Día del Trabajo' },
  { fecha: '2026-05-18', nombre: 'Ascensión del Señor' },
  { fecha: '2026-06-08', nombre: 'Corpus Christi' },
  { fecha: '2026-06-15', nombre: 'Sagrado Corazón de Jesús' },
  { fecha: '2026-06-29', nombre: 'San Pedro y San Pablo' },
  { fecha: '2026-07-20', nombre: 'Día de la Independencia' },
  { fecha: '2026-08-07', nombre: 'Batalla de Boyacá' },
  { fecha: '2026-08-17', nombre: 'La Asunción de la Virgen' },
  { fecha: '2026-10-12', nombre: 'Día de la Raza' },
  { fecha: '2026-11-02', nombre: 'Día de Todos los Santos' },
  { fecha: '2026-11-16', nombre: 'Independencia de Cartagena' },
  { fecha: '2026-12-08', nombre: 'Inmaculada Concepción' },
  { fecha: '2026-12-25', nombre: 'Navidad' },

  // FESTIVOS 2027
  { fecha: '2027-01-01', nombre: 'Año Nuevo' },
  { fecha: '2027-01-11', nombre: 'Día de los Reyes Magos' },
  { fecha: '2027-03-22', nombre: 'Día de San José' },
  { fecha: '2027-03-25', nombre: 'Jueves Santo' },
  { fecha: '2027-03-26', nombre: 'Viernes Santo' },
  { fecha: '2027-05-01', nombre: 'Día del Trabajo' },
  { fecha: '2027-05-10', nombre: 'Ascensión del Señor' },
  { fecha: '2027-05-31', nombre: 'Corpus Christi' },
  { fecha: '2027-06-07', nombre: 'Sagrado Corazón de Jesús' },
  { fecha: '2027-07-05', nombre: 'San Pedro y San Pablo' },
  { fecha: '2027-07-20', nombre: 'Día de la Independencia' },
  { fecha: '2027-08-07', nombre: 'Batalla de Boyacá' },
  { fecha: '2027-08-16', nombre: 'La Asunción de la Virgen' },
  { fecha: '2027-10-18', nombre: 'Día de la Raza' },
  { fecha: '2027-11-01', nombre: 'Día de Todos los Santos' },
  { fecha: '2027-11-15', nombre: 'Independencia de Cartagena' },
  { fecha: '2027-12-08', nombre: 'Inmaculada Concepción' },
  { fecha: '2027-12-25', nombre: 'Navidad' }
];

/**
 * Verifica si una fecha dada en formato YYYY-MM-DD o Date es festivo oficial en Colombia
 */
export function obtenerNombreFestivoColombia(fechaStr: string): string | null {
  const festivo = FESTIVOS_COLOMBIA_2026_2027.find(f => f.fecha === fechaStr);
  return festivo ? festivo.nombre : null;
}

/**
 * Determina si una fecha es sábado (6), domingo (0) o festivo oficial en Colombia
 */
export function esFinDeSemanaOFestivo(fecha: Date): boolean {
  const diaSemana = fecha.getDay();
  if (diaSemana === 0 || diaSemana === 6) {
    return true; // Sábado o Domingo
  }
  const isoStr = fecha.toISOString().slice(0, 10);
  return FESTIVOS_COLOMBIA_2026_2027.some(f => f.fecha === isoStr);
}

/**
 * Autocalcula la fecha final de un permiso laboral dado la fecha de inicio y la cantidad de días hábiles.
 * Excluye sábados, domingos y festivos oficiales de Colombia.
 */
export function calcularFechaFinalPermisoRemunerado(fechaInicioStr: string, diasHabiles: number): {
  fechaFinStr: string;
  fechaReintegroStr: string;
  diasCalendarioTranscurridos: number;
  diasFestivosInvolucrados: { fecha: string; nombre: string }[];
} {
  if (!fechaInicioStr || diasHabiles <= 0) {
    const hoy = fechaInicioStr || new Date().toISOString().slice(0, 10);
    return {
      fechaFinStr: hoy,
      fechaReintegroStr: hoy,
      diasCalendarioTranscurridos: 0,
      diasFestivosInvolucrados: []
    };
  }

  const [a, m, d] = fechaInicioStr.split('-').map(Number);
  const cursor = new Date(a, m - 1, d);

  let diasContados = 0;
  const festivosEfectivos: { fecha: string; nombre: string }[] = [];
  let fechaFinResult = new Date(cursor);

  // Iterar hasta acumular los días hábiles requeridos
  while (diasContados < diasHabiles) {
    const isoDate = cursor.toISOString().slice(0, 10);
    const nombreFestivo = obtenerNombreFestivoColombia(isoDate);

    if (nombreFestivo) {
      festivosEfectivos.push({ fecha: isoDate, nombre: nombreFestivo });
    }

    const esInhabil = esFinDeSemanaOFestivo(cursor);

    if (!esInhabil) {
      diasContados++;
      fechaFinResult = new Date(cursor);
    }

    // Avanzar un día en el calendario
    if (diasContados < diasHabiles) {
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  // Calcular la fecha hábil de reintegro (siguiente día hábil después de fechaFin)
  const reintegroCursor = new Date(fechaFinResult);
  reintegroCursor.setDate(reintegroCursor.getDate() + 1);
  while (esFinDeSemanaOFestivo(reintegroCursor)) {
    reintegroCursor.setDate(reintegroCursor.getDate() + 1);
  }

  const diffTime = Math.abs(fechaFinResult.getTime() - new Date(a, m - 1, d).getTime());
  const diasCalendario = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return {
    fechaFinStr: fechaFinResult.toISOString().slice(0, 10),
    fechaReintegroStr: reintegroCursor.toISOString().slice(0, 10),
    diasCalendarioTranscurridos: diasCalendario,
    diasFestivosInvolucrados: festivosEfectivos
  };
}
