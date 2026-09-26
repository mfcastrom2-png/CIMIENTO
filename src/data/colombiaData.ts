/**
 * Catálogos normativos y territoriales de Colombia para Gestión del Talento Humano
 * Cumplimiento CST, Decreto 1072 de 2015 y estándares de nómina/seguridad social
 */

export interface DepartamentoColombia {
  nombre: string;
  municipios: string[];
}

export const DEPARTAMENTOS_COLOMBIA: DepartamentoColombia[] = [
  {
    nombre: 'Bogotá D.C.',
    municipios: ['Bogotá D.C.']
  },
  {
    nombre: 'Antioquia',
    municipios: ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Apartadó', 'Rionegro', 'Sabaneta', 'Caucasia', 'Chigorodó', 'Copacabana', 'La Estrella', 'Marinilla', 'Guarne']
  },
  {
    nombre: 'Atlántico',
    municipios: ['Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Baranoa', 'Puerto Colombia', 'Galapa']
  },
  {
    nombre: 'Bolívar',
    municipios: ['Cartagena', 'Magangué', 'El Carmen de Bolívar', 'Turbaco', 'Arjona', 'Mompós']
  },
  {
    nombre: 'Boyacá',
    municipios: ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Puerto Boyacá', 'Paipa', 'Villa de Leyva']
  },
  {
    nombre: 'Caldas',
    municipios: ['Manizales', 'La Dorada', 'Chinchiná', 'Villamaría', 'Anserma', 'Riosucio']
  },
  {
    nombre: 'Casanare',
    municipios: ['Yopal', 'Aguazul', 'Villanueva', 'Paz de Ariporo', 'Tauramena']
  },
  {
    nombre: 'Cauca',
    municipios: ['Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Patía', 'Piendamó']
  },
  {
    nombre: 'Cesar',
    municipios: ['Valledupar', 'Aguachica', 'Agustín Codazzi', 'Bosconia', 'Curumaní']
  },
  {
    nombre: 'Córdoba',
    municipios: ['Montería', 'Lorica', 'Sahagún', 'Cereté', 'Montelíbano', 'Planeta Rica']
  },
  {
    nombre: 'Cundinamarca',
    municipios: ['Soacha', 'Facatativá', 'Chía', 'Zipaquirá', 'Mosquera', 'Madrid', 'Funza', 'Fusagasugá', 'Girardot', 'Cajicá', 'Sopó', 'Cota', 'Tocancipá', 'Tenjo', 'Tabio']
  },
  {
    nombre: 'Huila',
    municipios: ['Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre']
  },
  {
    nombre: 'Magdalena',
    municipios: ['Santa Marta', 'Ciénaga', 'Fundación', 'El Banco', 'Plato']
  },
  {
    nombre: 'Meta',
    municipios: ['Villavicencio', 'Acacías', 'Granada', 'Puerto López', 'San Martín']
  },
  {
    nombre: 'Nariño',
    municipios: ['Pasto', 'Tumaco', 'Ipiales', 'Túquerres', 'La Unión']
  },
  {
    nombre: 'Norte de Santander',
    municipios: ['Cúcuta', 'Ocaña', 'Villa del Rosario', 'Los Patios', 'Pamplona', 'Tibú']
  },
  {
    nombre: 'Quindío',
    municipios: ['Armenia', 'Calarcá', 'La Tebaida', 'Montenegro', 'Quimbaya', 'Circasia']
  },
  {
    nombre: 'Risaralda',
    municipios: ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia']
  },
  {
    nombre: 'Santander',
    municipios: ['Bucaramanga', 'Floridablanca', 'Barrancabermeja', 'Girón', 'Piedecuesta', 'San Gil', 'Socorro']
  },
  {
    nombre: 'Sucre',
    municipios: ['Sincelejo', 'Corozal', 'San Marcos', 'Tolú', 'Sampués']
  },
  {
    nombre: 'Tolima',
    municipios: ['Ibagué', 'Espinal', 'Melgar', 'Chaparral', 'Líbano', 'Mariquita', 'Honda']
  },
  {
    nombre: 'Valle del Cauca',
    municipios: ['Cali', 'Buenaventura', 'Palmira', 'Tuluá', 'Yumbo', 'Cartago', 'Buga', 'Jamundí', 'Candelaria', 'Pradera']
  }
];

export const TIPOS_DOCUMENTO_COLOMBIA = [
  { codigo: 'CC', nombre: 'Cédula de Ciudadanía (C.C.)' },
  { codigo: 'CE', nombre: 'Cédula de Extranjería (C.E.)' },
  { codigo: 'PA', nombre: 'Pasaporte (PA)' },
  { codigo: 'PPT', nombre: 'Permiso por Protección Temporal (PPT)' },
  { codigo: 'PEP', nombre: 'Permiso Especial de Permanencia (PEP)' },
  { codigo: 'TI', nombre: 'Tarjeta de Identidad (T.I.)' }
];

export const EPS_COLOMBIA = [
  'EPS Sanitas',
  'EPS Sura',
  'Nueva EPS',
  'Compensar EPS',
  'Salud Total EPS',
  'Famisanar EPS',
  'Coosalud EPS',
  'Mutual Ser EPS',
  'Capital Salud EPS',
  'Asmet Salud EPS',
  'Savia Salud EPS',
  'Servicio Occidental de Salud (SOS)',
  'Aliansalud EPS',
  'Anas Wayuu EPSI'
];

export const AFP_COLOMBIA = [
  'Porvenir (Fondo Privado)',
  'Protección (Fondo Privado)',
  'Colfondos (Fondo Privado)',
  'Skandia (Fondo Privado)',
  'Colpensiones (Régimen de Prima Media)'
];

export const ARL_COLOMBIA = [
  'Positiva Compañía de Seguros (ARL Estatal)',
  'ARL Sura',
  'Seguros Bolívar ARL',
  'Colmena Seguros ARL',
  'AXA Colpatria ARL',
  'La Equidad Seguros ARL',
  'Chubb Seguros Colombia'
];

export const NIVELES_RIESGO_ARL = [
  { nivel: 'I (0.522%)', descripcion: 'Riesgo Mínimo (Oficinas, Comercio, Administrativo, Docencia)' },
  { nivel: 'II (1.044%)', descripcion: 'Riesgo Bajo (Manufactura ligera, Almacenes, Restaurantes)' },
  { nivel: 'III (2.436%)', descripcion: 'Riesgo Medio (Procesos industriales, Hospitales, Transporte liviano)' },
  { nivel: 'IV (4.350%)', descripcion: 'Riesgo Alto (Transporte pesado, Producción de vidrio, Agroindustria)' },
  { nivel: 'V (6.960%)', descripcion: 'Riesgo Máximo (Alturas, Minería, Construcción, Eléctrico, ISP/Redes)' }
];

export const CCF_COLOMBIA = [
  'Compensar (Cundinamarca / Bogotá)',
  'Colsubsidio (Cundinamarca / Bogotá)',
  'Cafam (Cundinamarca / Bogotá)',
  'Comfama (Antioquia)',
  'Comfenalco Antioquia',
  'Comfenalco Valle del Cauca',
  'Comfandi (Valle del Cauca)',
  'Cajasan (Santander)',
  'Combarranquilla (Atlántico)',
  'Comfamiliar Risaralda',
  'Comfamiliar Huila',
  'Comfacundi (Cundinamarca)'
];

export const CESANTIAS_COLOMBIA = [
  'Porvenir Cesantías',
  'Protección Cesantías',
  'Colfondos Cesantías',
  'Fondo Nacional del Ahorro (FNA)',
  'Skandia Cesantías'
];

export const BANCOS_COLOMBIA = [
  'Bancolombia',
  'Banco de Bogotá',
  'Davivienda',
  'BBVA Colombia',
  'Banco de Occidente',
  'Banco Popular',
  'Scotiabank Colpatria',
  'Banco AV Villas',
  'Banco Caja Social',
  'Banco Agrario de Colombia',
  'Banco Itaú',
  'Banco Falabella',
  'Nequi',
  'DaviPlata',
  'Dale!'
];

export const TIPOS_CONTRATO_COLOMBIA = [
  'Término indefinido',
  'Término fijo (1 a 3 años)',
  'Término fijo inferior a un año',
  'Obra o labor determinada',
  'Aprendizaje (Etapa Lectiva/Productiva)',
  'Prácticas Universitarias',
  'Prestación de servicios',
  'Ocasional, accidental o transitorio'
];

export const MODALIDADES_TRABAJO = [
  'Presencial',
  'Híbrida',
  'Trabajo remoto',
  'Teletrabajo'
];

export const JORNADAS_LABORALES = [
  'Tiempo completo (42 hrs semanales - Ley 2101)',
  'Medio tiempo (21 hrs semanales)',
  'Jornada flexible (42 hrs semanales)',
  'Por turnos rotativos',
  'Jornada especial'
];

export const NIVELES_EDUCATIVOS = [
  'Primaria',
  'Bachillerato / Secundaria',
  'Técnico Laboral',
  'Tecnólogo',
  'Profesional Universitario',
  'Especialización',
  'Maestría',
  'Doctorado'
];

export const TIPOS_DOCUMENTOS_EXPEDIENTE = [
  'Documento de Identidad',
  'Hoja de Vida',
  'Contrato Laboral',
  'Otrosí / Modificatorio',
  'Certificado Académico',
  'Certificación Laboral',
  'Afiliación EPS',
  'Afiliación AFP',
  'Afiliación ARL',
  'Examen Ocupacional',
  'Certificación Bancaria',
  'RUT Actualizado',
  'Antecedentes Judiciales/Fiscales',
  'Certificado de Dotación / EPP',
  'Otro Documento'
];

export const ESTADOS_CIVILES = [
  'Soltero(a)',
  'Casado(a)',
  'Unión Libre',
  'Divorciado(a)',
  'Viudo(a)'
];
