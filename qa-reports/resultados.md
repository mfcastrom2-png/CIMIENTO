# Resultados de Ejecución de Pruebas - CIMIENTO Gestión Humana

**Fecha de Ejecución:** Septiembre 28, 2026  
**Entorno:** Vitest 5.0.1 + TypeScript Static Analysis (`tsc --noEmit`) + Vite Production Build  
**Total de Casos Evaluados:** 52 Casos Automatizados + 10 Verificaciones de Seguridad / UI  

---

## 1. Resumen de Cobertura por Módulo

| Módulo / Componente | Total Casos | Aprobados | Fallidos | Bloqueados | No Ejecutados | % Cobertura |
|---|---|---|---|---|---|---|
| **Aislamiento Multi-Tenant & Security Rules** | 17 | 17 | 0 | 0 | 0 | **100%** |
| **Seguridad, Regresión & Anti-Spoofing** | 8 | 8 | 0 | 0 | 0 | **100%** |
| **Control de Acceso, RBAC & AuthContext** | 3 | 3 | 0 | 0 | 0 | **100%** |
| **Motor de Evaluación de Desempeño** | 10 | 10 | 0 | 0 | 0 | **100%** |
| **Motor de Nómina, Prestaciones & CST** | 11 | 11 | 0 | 0 | 0 | **100%** |
| **Calendario Laboral & Ley Emiliani** | 3 | 3 | 0 | 0 | 0 | **100%** |
| **Auditoría de Bundles & Secretos en `/dist`** | 2 | 2 | 0 | 0 | 0 | **100%** |
| **Flujos UI & Accesibilidad Manual (Playwright Script)** | 8 | 8 | 0 | 0 | 0 | **100%** |
| **TOTAL GENERAL** | **62** | **62** | **0** | **0** | **0** | **100%** |

---

## 2. Matriz Detallada de Resultados por Caso

| ID Caso | Módulo | Resultado | Observaciones / Evidencia |
|---|---|---|---|
| **SEC-001** | Multi-Tenant | **APROBADO** | `sameCompany` bloquea lectura cruzada entre Empresa B y Empresa A. |
| **SEC-002** | Registro Usuarios | **APROBADO** | Bloqueo estricto de auto-asignación de roles `admin_gh` o `superadmin`. |
| **SEC-003** | Inmutabilidad Roles | **APROBADO** | `allow update` en `/usuarios/{uid}` impide alteración de `rol` o `empresaId`. |
| **SEC-004** | Anti-Gaps `'' == ''` | **APROBADO** | `data.empresaId != ''` previene lecturas accidentales de registros huérfanos. |
| **SEC-005** | Capacitaciones | **APROBADO** | `affectedKeys().hasOnly(['participantes', 'updatedAt'])` restringe ediciones. |
| **SEC-006** | Nómina Confidencial | **APROBADO** | Empleados solo leen su desprendible por coincidencia de correo verificado. |
| **SEC-007** | Auditoría Inmutable | **APROBADO** | Intento de `update` o `delete` sobre auditoría siempre denegado (`if false`). |
| **SEC-008** | Parámetros Ley | **APROBADO** | Solo los administradores leen/escriben configuraciones institucionales. |
| **SEC-009** | Email Verification | **APROBADO** | `request.auth.token.email_verified == true` verificado en accesos sensibles. |
| **SEC-010** | Catch-All Rules | **APROBADO** | Regla final deniega cualquier ruta no especificada en el archivo `.rules`. |
| **EV-001** | Ponderación Evaluación | **APROBADO** | La suma de componentes es exactamente 100% (50% + 25% + 15% + 10%). |
| **EV-002** | Detección Sesgos | **APROBADO** | Alerta por Efecto Halo e Indulgencia generada al detectar puntajes perfectos. |
| **NOM-001** | Nómina 1 SMMLV | **APROBADO** | Cálculo exacto de salud ($70.036), pensión ($70.036), aux. transporte ($249.095) y neto a pagar ($1.859.928) para SMMLV 2026 ($1.750.905). |
| **NOM-002** | Topes Ley Nómina | **APROBADO** | FSP del 1% aplicado correctamente a salarios >= 4 SMMLV. |
| **NOM-003** | Liquidación CST | **APROBADO** | Indemnización por despido injusto calculada conforme Art. 64 del CST. |
| **VAC-001** | Ley Emiliani | **APROBADO** | Exclusión precisa de festivos oficiales colombianos 2026/2027 y fines de semana. |
| **REG-001** | Secretos en Bundle | **APROBADO** | Búsqueda en `/dist` tras `npm run build` confirma 0 credenciales en texto plano. |
| **REG-002** | Habeas Data Seeders | **APROBADO** | Los datos predeterminados en `initialData.ts` son ficticios y seguros. |
| **E2E-001** | Flujo Admin GH | **APROBADO** | Creación de áreas, cargos, empleados y procesamiento de nómina sin fallos. |
| **E2E-002** | Flujo Colaborador | **APROBADO** | Acceso limitado exclusivamente a su ficha, solicitudes y capacitaciones. |

---

## 3. Registro de Ejecución de Comandos

```bash
> react-example@0.0.0 lint
> tsc --noEmit
# Resultado: Clean / 0 Type Errors

> react-example@0.0.0 build
> vite build
# Resultado: built in 16.18s (dist/ index.html, index.css, index.js)

> vitest run
# Resultado: 4 passed Test Files (52 passed Tests)
```
