# Plan de Pruebas de QA - CIMIENTO Gestión Humana (Multi-Tenant & Security Audit)

**Proyecto:** CIMIENTO – Gestión Humana  
**Entorno:** Firebase Emulator (Auth + Firestore) & Vitest Automated Testing  
**Versión de Evaluación:** 1.0.0-QA  
**Fecha:** Septiembre 28, 2026  
**Responsable:** Senior QA Engineer & Security Auditor  

---

## Matriz del Plan de Pruebas (Fase 2)

| ID Caso | Módulo | Tipo | Precondiciones | Pasos de Ejecución | Resultado Esperado | Prioridad |
|---|---|---|---|---|---|---|
| **SEC-001** | Firestore Rules | Reglas / Seguridad | Emulador activo; usuario `emp-b` en `empresa-b`. | Intento de lectura de `/empleados/emp-a-1`, `/cargos/c1`, `/areas/a1`, `/procesos/p1` pertenecientes a `empresa-a`. | Acceso Denegado (`PERMISSION_DENIED`). Aislamiento Multi-Tenant garantizado. | **P0** |
| **SEC-002** | Auth & Perfiles | Seguridad / Reg来的 | Usuario autenticado en Firebase Auth sin documento en `/usuarios`. | Auto-registro enviando `rol: 'admin_gh'` o `empresaId: 'empresa-a'` en la petición de creación del documento de perfil. | Rechazo estricto por reglas de Firestore (`request.resource.data.rol == 'empleado'` y `empresaId == ''`). | **P0** |
| **SEC-003** | Auth & RBAC | Reglas / Seguridad | Usuario autenticado con rol `empleado`. | Intento de actualización de su propio documento `/usuarios/{uid}` modificando `rol: 'admin_gh'` o `empresaId`. | Operación denegada (`PERMISSION_DENIED`). Inmutabilidad de privilegios. | **P0** |
| **SEC-004** | Multi-Tenant | Reglas / Seguridad | Usuario sin empresa (`empresaId: ''`) y documento borrador sin empresa (`empresaId: ''`). | Ejecutar consulta `sameCompany(resource.data)` donde ambos valores son cadena vacía `''`. | Denegación explícita. Previene la vulnerabilidad de coincidencia `'' == ''`. | **P0** |
| **SEC-005** | Capacitaciones | Reglas / RBAC | Usuario con rol `empleado` de `empresa-a`. | Intentar actualizar la colección `/capacitaciones/{capId}` modificando los campos `titulo` o `contenido`. | Denegación (`PERMISSION_DENIED`). Solo se permite modificar `participantes` y `updatedAt`. | **P1** |
| **SEC-006** | Nómina | Reglas / Confidencialidad | Usuario con rol `empleado` intenta leer desprendibles en `/nominas/{id}` de otro colaborador o de otra empresa. | Ejecución de consulta directa `getDoc` sobre el desprendible ajeno. | Lectura denegada salvo que el `empleadoEmail` o `email` coincida exactamente con el token verificado del usuario. | **P0** |
| **SEC-007** | Auditoría | Reglas / Integridad | Usuario autenticado común. | Intento de realizar `update` o `delete` sobre `/auditoria_sistema` o `/logs_auditoria`, o `create` suplantando `usuarioId` ajeno. | Modificaciones y eliminaciones denegadas siempre (`allow update, delete: if false;`). Inserción suplantada denegada. | **P0** |
| **SEC-008** | Parámetros | Reglas / Seguridad | Usuario autenticado no administrador. | Intento de lectura/escritura en `/configuracion_nomina` o `/configuracion_empresa`. | Denegación para no administradores; acceso restringido al admin de la propia empresa. | **P1** |
| **SEC-009** | Email Verification | Reglas / Anti-Spoofing | Usuario autenticado con `email_verified = false`. | Intentar acceder a documentos protegidos por coincidencia de correo en nóminas o entregas EPP. | Denegación de acceso hasta tanto no se valide el token de correo verificado (`isEmailVerified()`). | **P1** |
| **SEC-010** | Catch-All Deny | Reglas / Security | Usuario autenticado o anónimo. | Intento de lectura/escritura en colecciones no declaradas en las reglas (ej. `/coleccion_inexistente/doc1`). | Denegado por defecto por regla final `match /{document=**} { allow read, write: if false; }`. | **P0** |
| **EV-001** | Evaluación Desempeño | Unitaria / Negocio | Items de resultados asignados. | Calcular subtotal de resultados del cargo con formula ponderada. | Retorna el subtotal exacto sobre 50 puntos máx. Ponderación de componentes suma 100%. | **P1** |
| **EV-002** | Evaluación Desempeño | Unitaria / Negocio | Datos de evaluación con calificaciones uniformes = 5. | Ejecutar detector de sesgos y alertas `detectarSesgosYAlertas`. | Detección de alerta por "Efecto Halo / Indulgencia" y "Falta de Evidencia". | **P1** |
| **NOM-001** | Nómina CST | Unitaria / Negocio | Empleado con 1 SMMLV ($1.750.905) y Aux. Transporte ($249.095). | Calcular liquidación ordinaria mensual para 30 días laborados. | Salud $70.036, Pensión $70.036, Neto $1.859.928, Exoneración Art 114-1 E.T. activa. | **P0** |
| **NOM-002** | Nómina CST | Unitaria / Negocio | Empleado con salario de $4.500.000 (> 2 SMMLV) o $7.000.000 (>= 4 SMMLV). | Calcular liquidación ordinaria mensual. | Descuento automático de auxilio de transporte en >2 SMMLV; cobro de FSP (1%) en >=4 SMMLV. | **P0** |
| **NOM-003** | Liquidación Definitiva | Unitaria / Negocio | Empleado retirado por despido sin justa causa en contrato indefinido. | Simular liquidación definitiva con `simularLiquidacionDefinitiva`. | Cálculo de indemnización Art. 64 CST + cesantías, intereses, prima y vacaciones. | **P0** |
| **VAC-001** | Vacaciones y Permisos | Unitaria / Negocio | Solicitud de 5 días hábiles a partir de jueves previo a festivo. | Autocalcular fecha final e hito de reintegro con `calcularFechaFinalPermisoRemunerado`. | Exclusión exacta de sábados, domingos y festivos de Ley Emiliani. | **P1** |
| **E2E-001** | Interfaz UI | E2E / Usabilidad | Emulador Firebase corriendo; rol `admin_gh`. | Crear área, cargo, empleado, correr nómina y verificar bitácora de auditoría. | Flujo completado sin excepciones, interfaz responsiva y sin fuga de datos. | **P1** |
| **E2E-002** | Interfaz UI | E2E / Usabilidad | Emulador Firebase corriendo; rol `empleado`. | Iniciar sesión, ver expediente, solicitar permiso, responder encuesta. | Acceso denegado a módulos administrativos por barra de navegación y protector de rutas. | **P1** |
| **REG-001** | Regresión Seguridad | Inspección Bundle | Compilación de producción en `dist/`. | Búsqueda estática de credenciales, tokens, palabras clave `Cimiento2026`, `pass:`. | Cero credenciales o contraseñas en texto plano expuestas en el bundle. | **P0** |
| **REG-002** | Regresión Privacidad | Inspección Código | Archivos de seeders en `src/data/`. | Inspección de datos personales de prueba en `initialData.ts`. | Datos ficticios o anonimizados conformes a la política de Habeas Data. | **P1** |
