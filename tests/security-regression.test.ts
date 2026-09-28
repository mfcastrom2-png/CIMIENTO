import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { INITIAL_EMPLEADOS } from '../src/data/initialData';
import { INITIAL_USUARIOS_SISTEMA } from '../src/data/usuariosYVotacionesData';
import { limpiarParaFirestore } from '../src/lib/firebase';

describe('Suite de Seguridad y Regresión: Verificación de Secretos y Privacidad (Habeas Data)', () => {
  it('No deben existir contraseñas por defecto predecibles en los datos fuente iniciales', () => {
    INITIAL_EMPLEADOS.forEach(emp => {
      expect((emp as any).password).toBeUndefined();
    });

    INITIAL_USUARIOS_SISTEMA.forEach(usr => {
      expect(usr.password).toBeUndefined();
    });
  });

  it('No deben existir correos electrónicos corporativos reales de personas naturales en los seeders', () => {
    INITIAL_USUARIOS_SISTEMA.forEach(usr => {
      expect(usr.email).toMatch(/@.+\..+/);
      expect(usr.email.toLowerCase()).not.toContain('@gmail.com.co');
    });
  });

  it('La función limpiarParaFirestore debe remover recursivamente campos "undefined" para prevenir errores y desbordes en Firestore', () => {
    const payloadInseguro = {
      nombre: 'Test',
      campoUndefined: undefined,
      metadatos: {
        valido: 123,
        invalido: undefined
      },
      lista: ['item1', undefined, 'item3']
    };

    const limpio = limpiarParaFirestore(payloadInseguro);
    expect(limpio.campoUndefined).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(limpio, 'campoUndefined')).toBe(false);
    expect(limpio.metadatos.invalido).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(limpio.metadatos, 'invalido')).toBe(false);
    expect(limpio.lista).toEqual(['item1', 'item3']);
  });
});

describe('Suite de Seguridad y Regresión: Análisis Estático de Reglas y Anti-Privilege Escalation', () => {
  const rulesPath = path.resolve(__dirname, '../firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  it('Las reglas de Firestore NO deben contener listas de correos electrónicos hardcodeados', () => {
    expect(rulesContent).not.toContain('@bgroup.com');
    expect(rulesContent).not.toContain('@empresa.com');
    expect(rulesContent).not.toContain('mf.castrom2@gmail.com');
    expect(rulesContent).not.toContain('admin@');
  });

  it('La regla catch-all final debe denegar lectura y escritura a cualquier colección no declarada', () => {
    expect(rulesContent).toMatch(/match\s*\/\{document=\*\*\}\s*\{\s*allow\s+read,\s*write:\s*if\s+false;\s*\}/);
  });

  it('Las colecciones de auditoria_sistema y logs_auditoria deben bloquear incondicionalmente update y delete', () => {
    expect(rulesContent).toContain('match /auditoria_sistema/{logId}');
    expect(rulesContent).toContain('match /logs_auditoria/{logId}');
    expect(rulesContent).toContain('allow update, delete: if false;');
  });

  it('La función sameCompany debe rechazar evaluaciones con empresaId vacía ("" == "") para evitar filtraciones de colecciones sin asignar', () => {
    expect(rulesContent).toContain("data.empresaId != ''");
    expect(rulesContent).toContain("currentUser().data.empresaId != ''");
  });

  it('El auto-registro de usuario solo debe permitir rol empleado y empresaId vacía', () => {
    expect(rulesContent).toContain("request.resource.data.rol == 'empleado'");
    expect(rulesContent).toContain("request.resource.data.empresaId == ''");
  });
});
