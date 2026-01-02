import type { ABRAE } from '@/types';

// Por ahora, datos de demostración. Luego se obtendrán desde Supabase o GEE
const MOCK_ABRAES: ABRAE[] = [
  {
    id: 'pn-canaima',
    name: 'Parque Nacional Canaima',
    type: 'Parque Nacional',
    iucnCategory: 'II',
    geometry: {
      type: 'Polygon',
      coordinates: [[[-61.5, 4.5], [-61.5, 6.5], [-60.5, 6.5], [-60.5, 4.5], [-61.5, 4.5]]],
    },
    area: 3000000,
    country: 'VEN',
  },
  {
    id: 'pn-henri-pittier',
    name: 'Parque Nacional Henri Pittier',
    type: 'Parque Nacional',
    iucnCategory: 'II',
    geometry: {
      type: 'Polygon',
      coordinates: [[[-67.7, 10.3], [-67.7, 10.5], [-67.5, 10.5], [-67.5, 10.3], [-67.7, 10.3]]],
    },
    area: 107800,
    country: 'VEN',
  },
  {
    id: 'pn-morrocoy',
    name: 'Parque Nacional Morrocoy',
    type: 'Parque Nacional',
    iucnCategory: 'II',
    geometry: {
      type: 'Polygon',
      coordinates: [[[-68.3, 10.8], [-68.3, 11.0], [-68.1, 11.0], [-68.1, 10.8], [-68.3, 10.8]]],
    },
    area: 32090,
    country: 'VEN',
  },
  {
    id: 'mn-cueva-guacharo',
    name: 'Monumento Natural Cueva del Guácharo',
    type: 'Monumento Natural',
    iucnCategory: 'III',
    geometry: {
      type: 'Polygon',
      coordinates: [[[-63.5, 10.1], [-63.5, 10.2], [-63.4, 10.2], [-63.4, 10.1], [-63.5, 10.1]]],
    },
    area: 15500,
    country: 'VEN',
  },
  {
    id: 'rfs-sierra-san-luis',
    name: 'Reserva Forestal Sierra de San Luis',
    type: 'Reserva Forestal',
    iucnCategory: 'VI',
    geometry: {
      type: 'Polygon',
      coordinates: [[[-68.5, 11.1], [-68.5, 11.3], [-68.3, 11.3], [-68.3, 11.1], [-68.5, 11.1]]],
    },
    area: 20000,
    country: 'VEN',
  },
];

export const abraeService = {
  async getTypes(): Promise<string[]> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 300));
    const types = [...new Set(MOCK_ABRAES.map(a => a.type))];
    return types;
  },

  async getNamesByType(type: string): Promise<string[]> {
    await new Promise(resolve => setTimeout(resolve, 300));
    const names = MOCK_ABRAES
      .filter(a => a.type === type)
      .map(a => a.name);
    return names;
  },

  async getABRAE(type: string, name: string): Promise<ABRAE> {
    await new Promise(resolve => setTimeout(resolve, 500));
    const abrae = MOCK_ABRAES.find(a => a.type === type && a.name === name);
    if (!abrae) throw new Error('ABRAE no encontrado');
    return abrae;
  },
};
