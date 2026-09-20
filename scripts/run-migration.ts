import { migrarDocumentosConEmpresaId } from '../src/lib/migracionEmpresa';

async function main() {
  console.log('Iniciando migración de documentos y aprovisionamiento de cuentas de prueba...');
  try {
    const res = await migrarDocumentosConEmpresaId('empresa-a');
    console.log('Migración completada con éxito:');
    console.log('Documentos actualizados:', res.documentosActualizados);
    console.log('Colecciones procesadas:', res.coleccionesProcesadas.join(', '));
    console.log('Usuarios de prueba procesados:', res.usuariosCreados.join(', '));
    if (res.detalles.length > 0) {
      console.log('Detalles:', res.detalles);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error durante la migración:', err);
    process.exit(1);
  }
}

main();
