# Reporte de Defectos de Seguridad y Calidad - CIMIENTO Gestión Humana

**Proyecto:** CIMIENTO – Gestión Humana  
**Entorno de Pruebas:** Firebase Emulator / Vitest / Bundle Inspector  
**Fecha:** Septiembre 28, 2026  

---

### DEF-001: Desfase entre Revocación de Credenciales Local y Servidor de Firebase Auth

- **ID:** DEF-001
- **Título:** La función de rotación de credenciales genera una contraseña temporal local y envía un correo de restablecimiento, pero no revoca la sesión activa previa en Firebase Auth Server.
- **Severidad:** Media
- **Prioridad de Corrección:** P2
- **Módulo / Archivo / Línea:** `src/components/UsuariosView.tsx` (Línea 553) y `src/lib/firebase.ts` (Línea 760)
- **Precondiciones:** Usuario activo en el sistema con sesión iniciada en un dispositivo.
- **Pasos para reproducir:**
  1. Iniciar sesión como `admin_gh`.
  2. Ir al módulo "Gestión de Usuarios".
  3. Hacer clic en "Restablecer Credenciales" para un colaborador.
  4. Observar el modal de confirmación informando que "las credenciales anteriores fueron revocadas".
  5. Desde la sesión del colaborador en otro navegador, realizar una operación de lectura/escritura en Firestore.
- **Resultado Esperado:** La sesión previa debe ser invalidada inmediatamente enviando una señal de revocación o forzando la actualización de token.
- **Resultado Obtenido:** La sesión del colaborador permanece activa hasta que la contraseña se actualiza efectivamente mediante el enlace del correo electrónico. El mensaje del modal genera una falsa expectativa de revocación síncrona.
- **Evidencia:**
  ```typescript
  // src/components/UsuariosView.tsx:553
  const actualizado = { ...usr, password: tempPass };
  // Solo actualiza el estado local y despacha sendPasswordResetEmail(auth, email)
  ```
- **Impacto en el Negocio:** Un usuario cuya cuenta haya sido comprometida podría mantener acceso por unos minutos hasta que haga uso del enlace de restablecimiento.
- **Recomendación de Corrección:** Ajustar la redacción del modal para indicar "Correo de restablecimiento enviado" e invocar `signOut` o invalidación de tokens administrativos cuando esté disponible en el entorno servidor.
- **Estado:** Nuevo / Abierto

---

### DEF-002: Cálculo de Días Totales Laborados en Liquidación Definitiva Usando Días Calendario vs Año Comercial de 360 Días

- **ID:** DEF-002
- **Título:** La función `simularLiquidacionDefinitiva` calcula días laborados usando milisegundos de calendario (365 días) provocando una fracción de año superior al dividir por 360 días comerciales CST.
- **Severidad:** Media
- **Prioridad de Corrección:** P2
- **Módulo / Archivo / Línea:** `src/services/payrollEngine.ts` (Línea 317)
- **Precondiciones:** Empleado contratado el `2025-01-01` y retirado el `2025-12-31`.
- **Pasos para reproducir:**
  1. Ejecutar `simularLiquidacionDefinitiva` para un año completo (365 días reales).
  2. Evaluar `anosCompletos = diasTotalesLaborados / 360`.
  3. Resultado da `364 / 360 = 1.011` años completos.
- **Resultado Esperado:** Un año laboral comercial completo de 12 meses debe equivaler a 360 días de trabajo según la norma laboral colombiana.
- **Resultado Obtenido:** Da 1.0111 años, incrementando ligeramente el valor indemnizatorio ($1.571.556 COP en vez de $1.560.000 COP).
- **Evidencia:**
  ```typescript
  // src/services/payrollEngine.ts:317
  const diffTime = Math.max(0, fechaRetiro.getTime() - fechaIngreso.getTime());
  const diasTotalesLaborados = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)));
  ```
- **Impacto en el Negocio:** Pequeña variación de centavos/pesos en simulaciones de liquidación definitiva para años enteros.
- **Recomendación de Corrección:** Normalizar la diferencia de fechas mediante la conversión estándar de 30 días por mes comercial (360 días por año) para coincidir con la costumbre contable colombiana.
- **Estado:** Nuevo / Abierto

---

### DEF-003: Valor Predeterminado de Contraseña Temporal Hardcodeado en Estado Inicial de Modales de Creación

- **ID:** DEF-003
- **Título:** Los componentes `ModalNuevoEmpleadoWizard.tsx` y `UsuariosView.tsx` inicializan el estado de contraseña temporal con una cadena estática `"BGroup2026*"`.
- **Severidad:** Baja
- **Prioridad de Corrección:** P3
- **Módulo / Archivo / Línea:** `src/components/ModalNuevoEmpleadoWizard.tsx` (Línea 511) y `src/components/UsuariosView.tsx` (Línea 270)
- **Precondiciones:** Abrir el modal de creación de colaborador o usuario.
- **Pasos para reproducir:**
  1. Abrir la interfaz de creación de usuario.
  2. Si el administrador no modifica el campo opcional de clave temporal, el sistema asigna `"BGroup2026*"`.
- **Resultado Esperado:** La contraseña temporal debe ser generada dinámicamente con caracteres pseudoaleatorios aleatorios desde su inicialización (`BGroup` + aleatorio).
- **Resultado Obtenido:** Múltiples cuentas creadas sin tocar la clave comparten la misma clave temporal inicial si no usan el enlace de activación.
- **Evidencia:**
  ```typescript
  const [passwordTemporal, setPasswordTemporal] = useState('BGroup2026*');
  ```
- **Impacto en el Negocio:** Riesgo menor si el usuario no cambia su contraseña en el primer ingreso y se omite la activación por correo.
- **Recomendación de Corrección:** Inicializar el estado de la clave invocando un helper generador aleatorio `() => 'BG' + Math.floor(100000 + Math.random() * 900000) + '*'`.
- **Estado:** Nuevo / Abierto

---

### DEF-004: Registro de Advertencias en Consola (`console.warn`) en Flujos de Producción Sin Filtro Centralizado

- **ID:** DEF-004
- **Título:** Los servicios de sincronización con Firestore emiten advertencias en la consola del navegador ante demoras de red o modo offline.
- **Severidad:** Baja
- **Prioridad de Corrección:** P3
- **Módulo / Archivo / Línea:** `src/lib/firebase.ts` (Líneas 131, 246, 503)
- **Precondiciones:** Abrir las herramientas de desarrollador en el navegador.
- **Pasos para reproducir:**
  1. Simular desconexión temporal de red.
  2. Ejecutar una consulta a Firestore.
- **Resultado Esperado:** El manejo de errores debe ser silencioso en producción y canalizarse únicamente a través del sistema de auditoría inmutable o logger configurado.
- **Resultado Obtenido:** Se imprimen mensajes `[Firestore] Cliente operando en modo offline / caché local` en la consola.
- **Evidencia:**
  ```typescript
  console.warn('Diagnóstico Firestore: ', JSON.stringify(errInfo));
  ```
- **Impacto en el Negocio:** Ninguno operacional, meramente cosmético en el log del navegador.
- **Recomendación de Corrección:** Envolver los mensajes en `if (import.meta.env.DEV)` para evitar salidas en el paquete de producción.
- **Estado:** Nuevo / Abierto
