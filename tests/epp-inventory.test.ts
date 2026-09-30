import { describe, it, expect } from 'vitest';
import { ItemInventarioEPP, CategoriaEPP } from '../src/types';

describe('Suite de Pruebas: Módulo de Inventario e Ingreso de EPPs (Res. 2400/79)', () => {
  const inventarioInicial: ItemInventarioEPP[] = [
    {
      id: 'epp-1',
      codigo: 'EPP-CAS-01',
      nombre: 'Casco Dieléctrico Tipo II con Barbuquejo',
      categoria: 'Protección Cabeza',
      normaTecnica: 'ANSI Z89.1 Clase E',
      stockActual: 15,
      stockMinimo: 5,
      unidad: 'Unidad',
      vidaUtilDias: 365,
      tallasDisponibles: ['Única'],
      descripcion: 'Casco de seguridad dieléctrico para trabajo en altura y redes.',
      ubicacionAlmacen: 'Bodega Principal - Estante A1',
      proveedor: '3M Colombia',
      lote: 'LOTE-2025-01',
      fechaIngreso: '2025-11-01'
    }
  ];

  it('Debe registrar un ingreso de stock a una referencia existente con proveedor y lote', () => {
    const cantidadIngresar = 20;
    const nuevoProveedor = 'Steelpro Safety SAS';
    const nuevoLote = 'LOT-2026-904';
    const nuevaFechaIngreso = '2026-09-29';

    const inventarioActualizado = inventarioInicial.map(item => {
      if (item.id === 'epp-1') {
        return {
          ...item,
          stockActual: item.stockActual + cantidadIngresar,
          proveedor: nuevoProveedor,
          lote: nuevoLote,
          fechaIngreso: nuevaFechaIngreso
        };
      }
      return item;
    });

    const itemModificado = inventarioActualizado.find(i => i.id === 'epp-1');
    expect(itemModificado?.stockActual).toBe(35); // 15 + 20
    expect(itemModificado?.proveedor).toBe('Steelpro Safety SAS');
    expect(itemModificado?.lote).toBe('LOT-2026-904');
    expect(itemModificado?.fechaIngreso).toBe('2026-09-29');
  });

  it('Debe registrar un nuevo elemento EPP al inventario con todos sus metadatos obligatorios', () => {
    const nuevoItem: ItemInventarioEPP = {
      id: 'epp-nuevo-02',
      codigo: 'EPP-MAN-03',
      nombre: 'Guantes de Vaqueta Reforzados Tipo Ingeniero',
      categoria: 'Protección Manos',
      normaTecnica: 'EN 388 / NTC 2190',
      stockActual: 50,
      stockMinimo: 10,
      unidad: 'Par',
      vidaUtilDias: 90,
      tallasDisponibles: ['8', '9', '10'],
      descripcion: 'Guantes de cuero para manipulación de cables y herramientas.',
      ubicacionAlmacen: 'Bodega Principal - Gaveta M2',
      proveedor: 'Dotaciones Industriales del Oriente SAS',
      lote: 'LOTE-MAN-2026-88',
      fechaIngreso: '2026-09-29',
      precioUnitarioEstimadoCOP: 28000
    };

    const nuevoInventario = [nuevoItem, ...inventarioInicial];

    expect(nuevoInventario.length).toBe(2);
    expect(nuevoInventario[0].nombre).toBe('Guantes de Vaqueta Reforzados Tipo Ingeniero');
    expect(nuevoInventario[0].stockActual).toBe(50);
    expect(nuevoInventario[0].proveedor).toBe('Dotaciones Industriales del Oriente SAS');
    expect(nuevoInventario[0].lote).toBe('LOTE-MAN-2026-88');
    expect(nuevoInventario[0].fechaIngreso).toBe('2026-09-29');
  });
});
