# B GROUP INGENIERIA S.A.S. — Sistema Integral de Gestión Humana y SG-SST

[![React](https://img.shields.io/badge/React-19.0.1-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore%20%7C%20Auth-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Vitest-104%2F104%20Passed-44B78B?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Normativa](https://img.shields.io/badge/Normativa-CST%20%7C%20Res.%200312%2F2019%20%7C%20GTC%2045-18235C)](#marco-normativo-y-cumplimiento-legal-colombia)

Plataforma empresarial de nivel corporativo para la administración integral del talento humano, liquidación de nómina colombiana, gestión de prestaciones sociales y administración del Sistema de Gestión de Seguridad y Salud en el Trabajo (**SG-SST**), desarrollada para **B GROUP INGENIERIA S.A.S.** (NIT 900.995.99-2 / CIMIENTO).

---

## 📋 Tabla de Contenidos
- [Arquitectura Oficial: Empresa Única (Single-Tenant)](#-arquitectura-oficial-empresa-única-single-tenant)
- [Módulos Principales del Sistema](#-módulos-principales-del-sistema)
  - [1. Gestión Humana y Organización](#1-gestión-humana-y-organización)
  - [2. Nómina y Prestaciones Sociales (CST)](#2-nómina-y-prestaciones-sociales-cst)
  - [3. Seguridad y Salud en el Trabajo (SG-SST)](#3-seguridad-y-salud-en-el-trabajo-sg-sst)
  - [4. Evaluación del Desempeño 360°](#4-evaluación-del-desempeño-360)
  - [5. Plan Anual de Capacitaciones](#5-plan-anual-de-capacitaciones)
  - [6. Portal del Colaborador (Autoservicio)](#6-portal-del-colaborador-autoservicio)
  - [7. Auditoría Forense y Seguridad](#7-auditoría-forense-y-seguridad)
- [Parámetros Legales Oficiales 2026](#-parámetros-legales-oficiales-2026)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Seguridad de la Información e InfoSec](#-seguridad-de-la-información-e-infosec)
- [Instalación y Puesta en Marcha](#-instalación-y-puesta-en-marcha)
- [Suite de Pruebas Automatizadas](#-suite-de-pruebas-automatizadas)
- [Marco Normativo y Cumplimiento Legal](#-marco-normativo-y-cumplimiento-legal-colombia)

---

## 🏛 Arquitectura Oficial: Empresa Única (Single-Tenant)

El sistema opera bajo un **modelo institucional de Empresa Única (Single-Tenant)**:
* La base de datos Cloud Firestore y el servidor residen en una instancia dedicada exclusivamente a la entidad corporativa.
* **Estructura en Raíz:** Las colecciones de datos (`/empleados`, `/cargos`, `/nominas`, `/indicadores_sst`, `/matriz_riesgos_gtc45`, etc.) se estructuran directamente en la raíz de Firestore sin particiones innecesarias por tenant.
* **Control de Acceso:** La seguridad y confidencialidad se rigen mediante:
  1. **RBAC Estricto (Role-Based Access Control):** Perfiles `superadmin`, `admin_gh`, `responsable_sst`, `lider_area` y `empleado`.
  2. **Habeas Data (Ley 1581 de 2012):** Aislamiento de expediente, nómina y exámenes médicos restringido por verificación de correo (`request.auth.token.email`) o ID de colaborador (`empleadoId`).

---

## 🚀 Módulos Principales del Sistema

### 1. Gestión Humana y Organización
* **Estructura Organizacional:** Mapeo formal de procesos estratégicos, misionales, de apoyo y de control; organigramas y áreas con líderes asignados.
* **Manual de Cargos y Competencias:** Fichas de cargo con identificación, funciones por criticidad, educación, formación, experiencia, competencias corporativas y técnicas.
* **Expediente Digital 360° en 10 Pestañas:**
  1. Identificación y datos personales (Habeas Data).
  2. Contacto y residencia.
  3. Relación laboral y tipo de contrato.
  4. Historial y trayectoria de cargos.
  5. Esquema de compensación y beneficios.
  6. Seguridad social (EPS, AFP, ARL, CCF).
  7. Formación académica y certificaciones.
  8. Experiencia laboral previa comprobada.
  9. Perfil de Seguridad y Salud en el Trabajo (tallas EPP, aptitudes médicas).
  10. Repositorio de documentos digitalizados e historial de novedades laborales.

### 2. Nómina y Prestaciones Sociales (CST)
* **Motor Determinístico de Liquidación (`payrollEngine.ts`):**
  * Salario proporcional según días laborados (convención contable colombiana de 30 días/mes).
  * Auxilio legal de transporte automático (salarios $\le 2$ SMMLV).
  * Horas extras diurnas (25%), nocturnas (75%), dominicales/festivas diurnas (75%) y nocturnas (110%) con divisor mensual ordinario de **210 horas** (Ley 2101 de 2021).
  * Deducción legal de aportes de salud (4%) y pensión (4%) del colaborador.
  * Fondo de Solidaridad Pensional (FSP) progresivo para salarios $\ge 4$ SMMLV.
  * Aportes patronales con exoneración del Art. 114-1 del Estatuto Tributario (Salud, SENA, ICBF) para trabajadores que devenguen menos de 10 SMMLV.
* **Provisiones de Prestaciones Sociales:**
  * Cesantías (8.33% sobre base con auxilio).
  * Intereses sobre Cesantías (12% anual según Ley 52 de 1975).
  * Prima de Servicios (8.33% sobre base con auxilio).
  * Vacaciones (4.17% sobre salario básico sin auxilio de transporte).
* **Simulador de Liquidación Definitiva de Contrato:**
  * Cálculo de indemnización por despido sin justa causa según el Art. 64 del Código Sustantivo del Trabajo (contrato a término fijo e indefinido).
  * Consolidación de prestaciones pendientes acumuladas a la fecha de retiro.
* **Control de Vacaciones y Ausentismos:**
  * Calendario de días hábiles excluyendo sábados, domingos y festivos oficiales de Colombia (Ley 51 de 1983 - Ley Emiliani).

### 3. Seguridad y Salud en el Trabajo (SG-SST)
* **Autoevaluación de Estándares Mínimos (Resolución 0312 de 2019):**
  * Evaluación de cumplimiento por ciclo PHVA (Planear, Hacer, Verificar, Actuar) con cálculo automático de ponderaciones y plan de mejoramiento inmediato.
* **Matriz de Peligros y Valoración de Riesgos (Guía Técnica Colombiana GTC 45):**
  * Identificación sistemática por proceso, actividad rutinaria y clasificación de peligro.
  * Cálculo automático de Niveles de Deficiencia (ND), Exposición (NE), Probabilidad (NP = ND × NE), Consecuencia (NC) y Nivel de Riesgo (NR = NP × NC).
  * Determinación de aceptabilidad del riesgo y jerarquía de controles (Eliminación, Sustitución, Ingeniería, Administrativos y EPP).
  * Exportación de la matriz en CSV normalizado.
* **Módulo de Indicadores del SG-SST (Estructura, Proceso y Resultado):**
  * Catálogo de indicadores normativos preconfigurados (Resolución 0312/2019 y Decreto 1072/2015): Severidad, Frecuencia, Mortalidad, Prevalencia e Incidencia de Enfermedad Laboral, Ausentismo, Cobertura del Plan de Capacitación e Inspecciones.
  * **Motor de Cálculo Dinámico Seguro (`motorCalculoIndicadores.ts`):** Tokenizador aritmético y evaluador **Shunting-Yard con Notación Polaca Inversa (RPN)** sin uso de `eval()` ni constructores inseguros.
  * Semaforización en tiempo real (Verde, Amarillo, Rojo, No Calculable).
  * Gráficos SVG interactivos de tendencias históricas y desviaciones respecto a la meta.
  * Vinculación directa con planes de acción de mejora continua (PHVA).
* **Gestión de Elementos de Protección Personal (EPP):**
  * Inventario con especificación de normas técnicas (ANSI, NTC, OSHA) y control de stock mínimo.
  * Generación y visualización de actas de entrega digitales con firma de conformidad del colaborador.
* **Exámenes Médicos Ocupacionales:**
  * Registro confidencial de conceptos de aptitud laboral (ingreso, periódico, egreso, post-incapacidad).
  * Cumplimiento de reserva de la historia clínica (Resolución 2346 de 2007) y acceso exclusivo al titular y responsable SST.
* **Comités Paritarios (COPASST / Convivencia Laboral):**
  * Convocatorias de elecciones, padrón electoral, emisión de voto secreto y escrutinio digital en tiempo real.

### 4. Evaluación del Desempeño 360°
* **Motor de Calificación (`evaluationEngine.ts`):** Escala de 1 a 100 puntos con balance porcentual (Resultados del Cargo 50%, Competencias 25%, Valores 15%, Autoevaluación 10%).
* **Detector Algorítmico de Sesgos:** Detección automática de Efecto Halo, Indulgencia y Falta de Evidencia en evaluaciones atípicas.

### 5. Plan Anual de Capacitaciones
* Programación de cursos técnicos, normativos, de seguridad y habilidades blandas.
* Registro de asistencia y exámenes de conocimiento interactivos con retroalimentación automática y generación de certificados en PDF.

### 6. Portal del Colaborador (Autoservicio)
* Solicitudes laborales en línea: Vacaciones, permisos remunerados, licencias, cesantías y constancias.
* Generador de Certificados Laborales oficiales en PDF con firma digital institucional y código de verificación.
* Consulta privada de desprendibles de nómina y expediente personal.

### 7. Auditoría Forense y Seguridad
* **Bitácora Inmutable (`auditoria_sistema` y `logs_auditoria`):** Registro *append-only* de cada creación, modificación, eliminación o exportación de datos con marca de tiempo ISO, usuario, IP, entidad afectada y valores anteriores/nuevos.
* Reglas en Firestore que prohíben taxativamente la edición o borrado de registros de auditoría (`allow update, delete: if false;`).

---

## ⚖️ Parámetros Legales Oficiales 2026

Los parámetros aplicados en el motor de cálculo y validados mediante pruebas automatizadas corresponden a la vigencia **2026**:

| Parámetro | Valor Vigente 2026 | Fundamento Legal |
| :--- | :---: | :--- |
| **SMMLV** | **$ 1.750.905 COP** | Decreto 0159 de 2026 |
| **Auxilio Legal de Transporte** | **$ 249.095 COP** | Decreto Reglamentario 2026 ($\le 2$ SMMLV) |
| **Total Devengado Base (1 SMMLV)** | **$ 2.000.000 COP** | Básico ($1.750.905) + Auxilio ($249.095) |
| **Aporte Salud Colaborador** | **4%** ($70.036 COP) | Ley 100 de 1993 |
| **Aporte Pensión Colaborador** | **4%** ($70.036 COP) | Ley 100 de 1993 |
| **Neto a Pagar (1 SMMLV)** | **$ 1.859.928 COP** | $2.000.000 - $140.072 deducciones |
| **Tope Auxilio de Transporte** | **$ 3.501.810 COP** | 2 SMMLV |
| **Umbral Fondo de Solidaridad Pensional** | **$ 7.003.620 COP** | 4 SMMLV (Art. 27 Ley 100 de 1993) |
| **Tope Exoneración Parafiscales** | **$ 17.509.050 COP** | 10 SMMLV (Art. 114-1 Estatuto Tributario) |
| **Jornada Máxima Semanal** | **42 horas** | Ley 2101 de 2021 |
| **Divisor Mensual Ordinario de Horas** | **210 horas** | 42h / 6 días × 30 días comerciales |
| **Unidad de Valor Tributario (UVT)** | **$ 52.374 COP** | Resolución DIAN 2026 |

---

## 📁 Estructura del Proyecto

```
├── .env.example                       # Variables de entorno modelo
├── firebase-applet-config.json        # Configuración de conexión Firebase
├── firebase-blueprint.json            # Esquema de entidades de la base de datos
├── firestore.rules                    # Reglas de seguridad de Cloud Firestore
├── index.html                         # Punto de entrada HTML5
├── metadata.json                      # Metadatos del aplicativo en AI Studio
├── package.json                       # Dependencias y scripts de ejecución
├── server.ts                          # Servidor Express con Vite y transporte SMTP
├── tsconfig.json                      # Configuración de compilador TypeScript
├── vite.config.ts                     # Configuración del bundler Vite
├── qa-reports/                        # Reportes de auditoría y aseguramiento de calidad
│   ├── defectos.md                    # Matriz de defectos y seguimiento
│   ├── plan-de-pruebas.md             # Plan maestro de pruebas de QA
│   ├── resultados.md                  # Matriz de resultados de pruebas
│   └── resumen-ejecutivo.md           # Dictamen final de calidad
├── tests/                             # Pruebas automatizadas en Vitest
│   ├── business-logic.test.ts         # Pruebas de nómina, indemnizaciones y horas extras
│   ├── firestore.rules.test.ts        # Pruebas de reglas de seguridad Firestore
│   └── formatters-and-certificates.test.ts # Pruebas de formateo de moneda y certificados
└── src/
    ├── App.tsx                        # Enrutador principal y controlador de vistas
    ├── main.tsx                       # Montaje React 19
    ├── types.ts                       # Definiciones de tipo TypeScript unificadas
    ├── components/                    # Vistas y componentes de interfaz de usuario
    │   ├── AuditoriaView.tsx          # Visor de bitácora y trazabilidad forense
    │   ├── CapacitacionesView.tsx     # Plan de formación, asistencia y exámenes
    │   ├── ControlVacacionesView.tsx  # Control de vacaciones con Ley Emiliani
    │   ├── DashboardView.tsx          # Panel ejecutivo con métricas organizacionales
    │   ├── EmpleadosView.tsx          # Gestión integral y expediente de colaboradores
    │   ├── EppInventarioView.tsx      # Inventario y control de entregas de EPP
    │   ├── IndicadoresSstView.tsx     # Módulo completo de Indicadores SG-SST
    │   ├── MatrizRiesgosGTC45View.tsx # Matriz de riesgos bajo norma GTC 45
    │   ├── NominaView.tsx             # Liquidación periódica de nómina
    │   ├── ParametrosNominaView.tsx   # Configuración de parámetros laborales
    │   ├── SimuladorLiquidacionContratoView.tsx # Liquidaciones definitivas CST
    │   ├── SstView.tsx                # Estándares mínimos Resolución 0312/2019
    │   └── UsuariosView.tsx           # Gestión de roles, accesos y permisos RBAC
    ├── context/
    │   ├── AuthContext.tsx            # Contexto de autenticación y protección de roles
    │   └── SyncContext.tsx            # Sincronización y persistencia de datos
    ├── lib/
    │   ├── auditoria.ts               # Servicio de registro de eventos inmutables
    │   ├── firebase.ts                # Inicialización SDK Firebase con Long Polling
    │   └── sstIndicadoresUtils.ts     # Plantillas oficiales Res. 0312 y comparativas
    ├── services/
    │   ├── buzonCorreoService.ts      # Cliente de despacho de notificaciones SMTP
    │   ├── evaluationEngine.ts        # Motor de evaluación del desempeño y sesgos
    │   └── payrollEngine.ts           # Motor de cálculo y liquidación de nómina
    └── utils/
        ├── festivosColombia.ts        # Algoritmo de festivos Ley Emiliani
        ├── formatters.ts              # Formateadores de moneda COP y fechas
        ├── generadorCertificados.ts   # Generación de certificados laborales en PDF
        ├── motorCalculoIndicadores.ts # Motor dinámico seguro de evaluación de fórmulas (RPN)
        └── pdfExport.ts               # Exportación de reportes y fichas en PDF
```

---

## 🔒 Seguridad de la Información e InfoSec

1. **Evaluador Aritmético Seguro (CWE-95 / OWASP A03):** El motor `motorCalculoIndicadores.ts` no utiliza `eval()` ni constructores `Function()`. Se procesa mediante un árbol de tokens y notación polaca inversa determinística, previniendo ataques de inyección de código.
2. **Defensas en Servidor Express (`server.ts`):**
   * Encabezados de seguridad HTTP: `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 1; mode=block`, `Referrer-Policy: strict-origin-when-cross-origin`.
   * **Rate Limiting:** Control de tasa de despacho en memoria (máx. 30 solicitudes por minuto por IP) para mitigar abuso de retransmisión de correo (*Spam Relay*).
   * **Validación TLS Estricta:** Verificación de certificados en entornos de producción (`rejectUnauthorized: true`).
3. **Protección contra Escalación de Privilegios:** El setter `setUserRole` en `AuthContext.tsx` valida activamente en el cliente que ningún colaborador pueda asumir privilegios de administrador.
4. **Revocación Inmediata de Sesiones (SEC-B05):** Suscripción en tiempo real a `/usuarios/{uid}`; si el usuario es inactivado o eliminado por un administrador, la sesión se expulsa inmediatamente.
5. **Reserva Legal de Datos Médicos (Resolución 2346 de 2007):** La colección `/examenes_medicos_ocupacionales` está aislada en Firestore para acceso exclusivo del médico/responsable SST y del colaborador titular.

---

## 🛠 Instalación y Puesta en Marcha

### Prerrequisitos
* **Node.js** (versión 18 o superior recomendada).
* **NPM** o gestor de paquetes compatible.

### Pasos de Instalación

1. **Clonar o descargar el repositorio:**
   ```bash
   git clone <url-del-repositorio>
   cd applet
   ```

2. **Instalar dependencias del proyecto:**
   ```bash
   npm install
   ```

3. **Configuración de Variables de Entorno:**
   Cree o configure el archivo `.env` basado en `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. **Ejecutar el Servidor de Desarrollo:**
   ```bash
   npm run dev
   ```
   El sistema se iniciará en `http://localhost:3000` con Express y Vite operando de forma integrada.

5. **Compilar para Producción:**
   ```bash
   npm run build
   ```

---

## 🧪 Suite de Pruebas Automatizadas

El sistema cuenta con una batería de pruebas unitarias y de integración implementada con **Vitest**:

```bash
# Ejecutar todas las pruebas unitarias de negocio y formateadores
npx vitest run tests/business-logic.test.ts tests/formatters-and-certificates.test.ts

# Ejecutar verificación de tipos estáticos (Linter)
npm run lint

# Ejecutar pruebas sobre las reglas de Firestore (requiere emulador de Firebase)
npm run test:rules
```

**Resultado de Ejecución:**
```
✓ tests/rbac-permissions.test.ts (11 tests)
✓ tests/formatters-and-certificates.test.ts (8 tests)
✓ tests/business-logic.test.ts (31 tests)
✓ tests/sst-indicadores.test.ts (8 tests)
✓ tests/motor-calculo-indicadores.test.ts (6 tests)
✓ tests/security-regression.test.ts (8 tests)
✓ tests/auth-integration.test.ts (3 tests)
✓ tests/epp-inventory.test.ts (2 tests)
✓ tests/print-and-mailbox.test.ts (12 tests)
✓ tests/firestore.rules.test.ts (15 tests)
Test Files  10 passed (10)
     Tests  104 passed (104)
```

---

## 📜 Marco Normativo y Cumplimiento Legal (Colombia)

El aplicativo ha sido diseñado y parametrizado en estricta conformidad con el ordenamiento jurídico laboral colombiano:

* **Código Sustantivo del Trabajo (CST):**
  * Jornada ordinaria, recargos nocturnos, horas extras y trabajo en dominicales y festivos (Arts. 158 a 171).
  * Salario mínimo legal y auxilio de transporte (Arts. 127 a 132).
  * Indemnizaciones por terminación unilateral del contrato sin justa causa (Art. 64).
  * Régimen de prestaciones sociales: Cesantías (Art. 249), Intereses a las Cesantías (Ley 52 de 1975), Prima de Servicios (Art. 306) y Vacaciones remuneradas (Art. 186).
* **Decreto 1072 de 2015:** Decreto Único Reglamentario del Sector Trabajo (Título 4, Capítulo 6: SG-SST).
* **Resolución 0312 de 2019:** Estándares Mínimos del Sistema de Gestión de Seguridad y Salud en el Trabajo.
* **Guía Técnica Colombiana GTC 45 (Segunda Actualización):** Metodología para la identificación de peligros y valoración de riesgos.
* **Ley 2101 de 2021:** Reducción gradual de la jornada laboral en Colombia (42 horas semanales vigentes en 2026 con divisor mensual de 210 horas).
* **Ley 1581 de 2012 y Decreto 1377 de 2013:** Régimen General de Protección de Datos Personales (Habeas Data).
* **Resolución 2346 de 2007:** Regulación de las evaluaciones médicas ocupacionales y reserva legal de la historia clínica ocupacional.
* **Ley 51 de 1983 (Ley Emiliani):** Traslado y conmemoración de días festivos oficiales en Colombia.

---

<div align="center">
  <p><strong>B GROUP INGENIERIA S.A.S. — Sistema de Gestión Humana y SG-SST</strong></p>
  <p><em>Desarrollado para entornos de alta disponibilidad, auditoría y cumplimiento normativo.</em></p>
</div>
