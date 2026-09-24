/**
 * Utilidades para generación de códigos secuenciales institucionales.
 * Garantiza que los códigos para Procesos, Áreas y Cargos inicien siempre en 001
 * y continúen de manera estrictamente secuencial (PR-001, AR-001, CAR-001, etc.),
 * evitando números aleatorios.
 */

export function generarSiguienteCodigo(
  prefijo: string,
  codigosExistentes: (string | undefined | null)[]
): string {
  const prefijoNormalizado = prefijo.trim().toUpperCase();
  const numerosOcupados = new Set<number>();

  // Regex 1: Formato con prefijo, ej. "PR-001", "PR_002", "PR 003", "PR004"
  const regexConPrefijo = new RegExp(`^${prefijoNormalizado}[-_\\s]*(\\d+)$`, 'i');
  // Regex 2: Formato que contiene el prefijo y termina en dígitos
  const regexPrefijoLargo = new RegExp(`^${prefijoNormalizado}.*?[-_\\s]*(\\d+)$`, 'i');
  // Regex 3: Formato puramente numérico, ej. "001", "002", "1"
  const regexPuroNumero = /^(\d+)$/;

  for (const c of codigosExistentes) {
    if (!c || typeof c !== 'string') continue;
    const clean = c.trim();
    if (!clean) continue;

    const matchPref = clean.match(regexConPrefijo);
    if (matchPref) {
      const num = parseInt(matchPref[1], 10);
      if (!isNaN(num) && num > 0) {
        numerosOcupados.add(num);
        continue;
      }
    }

    const matchLargo = clean.match(regexPrefijoLargo);
    if (matchLargo) {
      const num = parseInt(matchLargo[1], 10);
      if (!isNaN(num) && num > 0) {
        numerosOcupados.add(num);
        continue;
      }
    }

    const matchPuro = clean.match(regexPuroNumero);
    if (matchPuro) {
      const num = parseInt(matchPuro[1], 10);
      if (!isNaN(num) && num > 0) {
        numerosOcupados.add(num);
      }
    }
  }

  // Encuentra el primer número secuencial no ocupado iniciando en 1 (001)
  let siguienteNumero = 1;
  while (numerosOcupados.has(siguienteNumero)) {
    siguienteNumero++;
  }

  return `${prefijoNormalizado}-${String(siguienteNumero).padStart(3, '0')}`;
}
