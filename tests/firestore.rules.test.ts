import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Firestore Security Rules CI/CD Test Suite - Multi-Tenant & Audit Trail', () => {
  const rulesPath = path.resolve(__dirname, '../firestore.rules');
  const rules = fs.readFileSync(rulesPath, 'utf8');

  it('1. Debe validar que la colección /auditoria_sistema sea estrictamente append-only', () => {
    expect(rules).toContain('match /auditoria_sistema/{logId}');
    expect(rules).toMatch(/match \/auditoria_sistema\/\{logId\}\s*\{\s*allow read:\s*if isAdmin\(\);\s*allow create:\s*if signedIn\(\);\s*allow update, delete:\s*if false;/);
  });

  it('2. Debe garantizar aislamiento Multi-Tenant mediante la función sameCompany', () => {
    expect(rules).toContain('function sameCompany(data)');
    expect(rules).toContain('data.empresaId == currentUser().data.empresaId');
  });

  it('3. Debe proteger confidencialidad salarial en /nominas con permisos restringidos al empleado o admin', () => {
    expect(rules).toContain('match /nominas/{nominaId}');
    expect(rules).toContain('allow write: if isAdmin()');
  });

  it('4. Debe aplicar Deny-by-Default (Regla Zero Trust) al final de las reglas', () => {
    expect(rules).toContain('match /{document=**}');
    expect(rules).toContain('allow read, write: if false;');
  });

  it('5. Debe proteger la inmutabilidad de roles en /usuarios impidiendo elevación de privilegios', () => {
    expect(rules).toContain('match /usuarios/{uid}');
    expect(rules).toContain('request.resource.data.rol == resource.data.rol');
    expect(rules).toContain('request.resource.data.permisos == resource.data.permisos');
  });
});
