// ============================================================================
// CONTEXTO DEL MAPA
// ============================================================================

import React, { createContext, useContext, useState } from 'react';
import { MapLayer, AOI, ABRAE, EnvironmentalMetrics } from '@/types';

interface MapContextType {
  // Estado existente del mapa
  layers: MapLayer[];
  toggleLayer: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  selectedThreatId: string | null;
  setSelectedThreatId: (id: string | null) => void;
  mapCenter: [number, number];
  setMapCenter: (center: [number, number]) => void;
  mapZoom: number;
  setMapZoom: (zoom: number) => void;
  
  // NUEVO: Estado para AOI y métricas ambientales
  aoi: AOI | null;
  setAOI: (aoi: AOI | null) => void;
  aoiSelectionMode: 'draw' | 'abrae' | null;
  setAOISelectionMode: (mode: 'draw' | 'abrae' | null) => void;
  drawnGeometry: GeoJSON.Geometry | null;
  setDrawnGeometry: (geometry: GeoJSON.Geometry | null) => void;
  selectedABRAE: ABRAE | null;
  setSelectedABRAE: (abrae: ABRAE | null) => void;
  environmentalMetrics: EnvironmentalMetrics | null;
  setEnvironmentalMetrics: (metrics: EnvironmentalMetrics | null) => void;
  isLoadingMetrics: boolean;
  setIsLoadingMetrics: (loading: boolean) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

const defaultLayers: MapLayer[] = [
  {
    id: 'threats',
    name: 'Amenazas Ambientales',
    type: 'THREATS',
    visible: true,
    opacity: 1,
  },
  {
    id: 'ndvi',
    name: 'Índice de Vegetación (NDVI)',
    type: 'NDVI',
    visible: false,
    opacity: 0.7,
  },
  {
    id: 'water-bodies',
    name: 'Cuerpos de Agua',
    type: 'WATER_BODIES',
    visible: true,
    opacity: 0.6,
  },
  {
    id: 'protected-areas',
    name: 'Áreas Protegidas',
    type: 'PROTECTED_AREAS',
    visible: true,
    opacity: 0.5,
  },
  {
    id: 'communities',
    name: 'Comunidades',
    type: 'COMMUNITIES',
    visible: true,
    opacity: 1,
  },
  // NUEVAS CAPAS AMBIENTALES
  {
    id: 'forest-cover',
    name: 'Cobertura Forestal (Dynamic World)',
    type: 'FOREST_COVER',
    visible: false,
    opacity: 0.7,
  },
  {
    id: 'deforestation',
    name: 'Deforestación (Hansen/Dynamic World)',
    type: 'DEFORESTATION',
    visible: false,
    opacity: 0.8,
  },
  {
    id: 'fire-risk',
    name: 'Riesgo de Incendios (FIRMS + NDWI)',
    type: 'FIRE_RISK',
    visible: false,
    opacity: 0.6,
  },
  {
    id: 'flood-risk',
    name: 'Riesgo de Inundaciones (AHP)',
    type: 'FLOOD_RISK',
    visible: false,
    opacity: 0.6,
  },
  {
    id: 'aoi-boundary',
    name: 'Límite del AOI',
    type: 'AOI_BOUNDARY',
    visible: true,
    opacity: 1,
  },
];

export const MapProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Estados existentes
  const [layers, setLayers] = useState<MapLayer[]>(defaultLayers);
  const [selectedThreatId, setSelectedThreatId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([6.5, -62.5]);
  const [mapZoom, setMapZoom] = useState(8);

  // NUEVOS estados para AOI y métricas
  const [aoi, setAOI] = useState<AOI | null>(null);
  const [aoiSelectionMode, setAOISelectionMode] = useState<'draw' | 'abrae' | null>(null);
  const [drawnGeometry, setDrawnGeometry] = useState<GeoJSON.Geometry | null>(null);
  const [selectedABRAE, setSelectedABRAE] = useState<ABRAE | null>(null);
  const [environmentalMetrics, setEnvironmentalMetrics] =  useState<EnvironmentalMetrics | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);

  const toggleLayer = (layerId: string) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };

  const setLayerOpacity = (layerId: string, opacity: number) => {
    setLayers(prev =>
      prev.map(layer =>
        layer.id === layerId ? { ...layer, opacity } : layer
      )
    );
  };

  return (
    <MapContext.Provider
      value={{
        // Existentes
        layers,
        toggleLayer,
        setLayerOpacity,
        selectedThreatId,
        setSelectedThreatId,
        mapCenter,
        setMapCenter,
        mapZoom,
        setMapZoom,
       // NUEVOS
        aoi,
        setAOI,
        aoiSelectionMode,
        setAOISelectionMode,
        drawnGeometry,
        setDrawnGeometry,
        selectedABRAE,
        setSelectedABRAE,
        environmentalMetrics,
        setEnvironmentalMetrics,
        isLoadingMetrics,
        setIsLoadingMetrics,
      }}
    >
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within MapProvider');
  }
  return context;
};