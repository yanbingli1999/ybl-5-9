import { create } from 'zustand';
import type {
  Material,
  GridConfig,
  BoundaryConditions,
  HeatSource,
  ExperimentConfig,
  TemperatureSnapshot,
  ExperimentResult,
  SimulationMode,
  ContrastAnalysis,
  ContrastResult,
} from '@shared/types';

interface SimulationState {
  mode: SimulationMode;
  currentStep: number;
  currentTemperature: number[][];
  temperatureHistory: number[][][];
  
  grid: GridConfig;
  boundaryConditions: BoundaryConditions;
  materialId: string;
  materials: Material[];
  diffusionCoefficient: number;
  initialHeatSources: HeatSource[];
  totalSteps: number;
  timeStep: number;
  playbackSpeed: number;
  minTemp: number;
  maxTemp: number;
  brushSize: number;
  brushTemperature: number;
  drawMode: 'heat' | 'erase' | 'none';
  
  snapshots: TemperatureSnapshot[];
  experiments: ExperimentConfig[];
  favorites: ExperimentResult[];
  analysisRecords: ContrastAnalysis[];
  
  currentExperimentId: string | null;
  hoveredCell: { x: number; y: number } | null;
  
  isContrastMode: boolean;
  selectedSnapshotA: TemperatureSnapshot | null;
  selectedSnapshotB: TemperatureSnapshot | null;
  contrastThreshold: number;
  contrastResult: ContrastResult | null;
  
  setMode: (mode: SimulationMode) => void;
  setCurrentStep: (step: number) => void;
  setCurrentTemperature: (temp: number[][]) => void;
  addTemperatureToHistory: (temp: number[][]) => void;
  clearHistory: () => void;
  
  setGrid: (grid: GridConfig) => void;
  setBoundaryConditions: (bc: BoundaryConditions) => void;
  setMaterialId: (id: string) => void;
  setMaterials: (materials: Material[]) => void;
  setDiffusionCoefficient: (alpha: number) => void;
  setInitialHeatSources: (sources: HeatSource[]) => void;
  addHeatSource: (source: HeatSource) => void;
  removeHeatSource: (index: number) => void;
  clearHeatSources: () => void;
  setTotalSteps: (steps: number) => void;
  setTimeStep: (dt: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setBrushSize: (size: number) => void;
  setBrushTemperature: (temp: number) => void;
  setDrawMode: (mode: 'heat' | 'erase' | 'none') => void;
  setTempRange: (min: number, max: number) => void;
  
  setSnapshots: (snapshots: TemperatureSnapshot[]) => void;
  addSnapshot: (snapshot: TemperatureSnapshot) => void;
  removeSnapshot: (id: string) => void;
  setExperiments: (experiments: ExperimentConfig[]) => void;
  setFavorites: (favorites: ExperimentResult[]) => void;
  setCurrentExperimentId: (id: string | null) => void;
  setHoveredCell: (cell: { x: number; y: number } | null) => void;
  setAnalysisRecords: (records: ContrastAnalysis[]) => void;
  addAnalysisRecord: (record: ContrastAnalysis) => void;
  removeAnalysisRecord: (id: string) => void;
  
  setContrastMode: (enabled: boolean) => void;
  setSelectedSnapshotA: (snapshot: TemperatureSnapshot | null) => void;
  setSelectedSnapshotB: (snapshot: TemperatureSnapshot | null) => void;
  setContrastThreshold: (threshold: number) => void;
  setContrastResult: (result: ContrastResult | null) => void;
  clearContrastSelection: () => void;
  computeContrast: () => ContrastResult | null;
  
  reset: () => void;
}

const DEFAULT_GRID: GridConfig = {
  width: 50,
  height: 50,
  cellSize: 12,
};

const DEFAULT_BC: BoundaryConditions = {
  top: 25,
  bottom: 25,
  left: 25,
  right: 25,
  type: 'dirichlet',
};

function createEmptyTemperature(grid: GridConfig): number[][] {
  const data: number[][] = [];
  for (let y = 0; y < grid.height; y++) {
    data[y] = new Array(grid.width).fill(25);
  }
  return data;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  mode: 'idle',
  currentStep: 0,
  currentTemperature: createEmptyTemperature(DEFAULT_GRID),
  temperatureHistory: [],
  
  grid: DEFAULT_GRID,
  boundaryConditions: DEFAULT_BC,
  materialId: 'copper',
  materials: [],
  diffusionCoefficient: 117e-6,
  initialHeatSources: [],
  totalSteps: 500,
  timeStep: 0.1,
  playbackSpeed: 30,
  minTemp: 0,
  maxTemp: 100,
  brushSize: 2,
  brushTemperature: 100,
  drawMode: 'heat',
  
  snapshots: [],
  experiments: [],
  favorites: [],
  analysisRecords: [],
  
  currentExperimentId: null,
  hoveredCell: null,
  
  isContrastMode: false,
  selectedSnapshotA: null,
  selectedSnapshotB: null,
  contrastThreshold: 5,
  contrastResult: null,
  
  setMode: (mode) => set({ mode }),
  setCurrentStep: (step) => set({ currentStep: step }),
  setCurrentTemperature: (temp) => set({ currentTemperature: temp }),
  addTemperatureToHistory: (temp) =>
    set((state) => ({
      temperatureHistory: [...state.temperatureHistory, temp],
    })),
  clearHistory: () => set({ temperatureHistory: [], currentStep: 0 }),
  
  setGrid: (grid) =>
    set({
      grid,
      currentTemperature: createEmptyTemperature(grid),
      temperatureHistory: [],
      currentStep: 0,
    }),
  setBoundaryConditions: (bc) => set({ boundaryConditions: bc }),
  setMaterialId: (id) => {
    const material = get().materials.find(m => m.id === id);
    if (material) {
      set({
        materialId: id,
        diffusionCoefficient: material.diffusionCoefficient,
      });
    }
  },
  setMaterials: (materials) => set({ materials }),
  setDiffusionCoefficient: (alpha) => set({ diffusionCoefficient: alpha }),
  setInitialHeatSources: (sources) => set({ initialHeatSources: sources }),
  addHeatSource: (source) =>
    set((state) => ({
      initialHeatSources: [...state.initialHeatSources, source],
    })),
  removeHeatSource: (index) =>
    set((state) => ({
      initialHeatSources: state.initialHeatSources.filter((_, i) => i !== index),
    })),
  clearHeatSources: () => set({ initialHeatSources: [] }),
  setTotalSteps: (steps) => set({ totalSteps: steps }),
  setTimeStep: (dt) => set({ timeStep: dt }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setBrushSize: (size) => set({ brushSize: size }),
  setBrushTemperature: (temp) => set({ brushTemperature: temp }),
  setDrawMode: (mode) => set({ drawMode: mode }),
  setTempRange: (min, max) => set({ minTemp: min, maxTemp: max }),
  
  setSnapshots: (snapshots) => set({ snapshots }),
  addSnapshot: (snapshot) =>
    set((state) => ({
      snapshots: [...state.snapshots, snapshot],
    })),
  removeSnapshot: (id) =>
    set((state) => ({
      snapshots: state.snapshots.filter(s => s.id !== id),
    })),
  setExperiments: (experiments) => set({ experiments }),
  setFavorites: (favorites) => set({ favorites }),
  setCurrentExperimentId: (id) => set({ currentExperimentId: id }),
  setHoveredCell: (cell) => set({ hoveredCell: cell }),
  setAnalysisRecords: (records) => set({ analysisRecords: records }),
  addAnalysisRecord: (record) =>
    set((state) => ({
      analysisRecords: [...state.analysisRecords, record],
    })),
  removeAnalysisRecord: (id) =>
    set((state) => ({
      analysisRecords: state.analysisRecords.filter(r => r.id !== id),
    })),
  
  setContrastMode: (enabled) => set({ isContrastMode: enabled }),
  setSelectedSnapshotA: (snapshot) => set({ selectedSnapshotA: snapshot }),
  setSelectedSnapshotB: (snapshot) => set({ selectedSnapshotB: snapshot }),
  setContrastThreshold: (threshold) => set({ contrastThreshold: threshold }),
  setContrastResult: (result) => set({ contrastResult: result }),
  clearContrastSelection: () =>
    set({
      selectedSnapshotA: null,
      selectedSnapshotB: null,
      contrastResult: null,
    }),
  computeContrast: () => {
    const { selectedSnapshotA, selectedSnapshotB, contrastThreshold } = get();
    if (!selectedSnapshotA || !selectedSnapshotB) return null;
    
    const dataA = selectedSnapshotA.temperatureData;
    const dataB = selectedSnapshotB.temperatureData;
    const height = Math.min(dataA.length, dataB.length);
    const width = Math.min(dataA[0]?.length || 0, dataB[0]?.length || 0);
    
    const differenceData: number[][] = [];
    let peakChange = 0;
    let sumChange = 0;
    let count = 0;
    let maxIncrease = { x: 0, y: 0, value: -Infinity };
    let maxDecrease = { x: 0, y: 0, value: Infinity };
    const highlightedCells: { x: number; y: number; difference: number }[] = [];
    
    for (let y = 0; y < height; y++) {
      differenceData[y] = [];
      for (let x = 0; x < width; x++) {
        const diff = dataB[y][x] - dataA[y][x];
        differenceData[y][x] = diff;
        sumChange += diff;
        count++;
        
        const absDiff = Math.abs(diff);
        if (absDiff > peakChange) peakChange = absDiff;
        if (diff > maxIncrease.value) maxIncrease = { x, y, value: diff };
        if (diff < maxDecrease.value) maxDecrease = { x, y, value: diff };
        if (absDiff > contrastThreshold) {
          highlightedCells.push({ x, y, difference: diff });
        }
      }
    }
    
    const averageChange = count > 0 ? sumChange / count : 0;
    
    const hotSpotsA: { x: number; y: number; temp: number }[] = [];
    const hotSpotsB: { x: number; y: number; temp: number }[] = [];
    const tempThreshold = 50;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (dataA[y][x] > tempThreshold) hotSpotsA.push({ x, y, temp: dataA[y][x] });
        if (dataB[y][x] > tempThreshold) hotSpotsB.push({ x, y, temp: dataB[y][x] });
      }
    }
    
    const centerA = hotSpotsA.length > 0
      ? hotSpotsA.reduce((acc, p) => ({
          x: acc.x + p.x * p.temp,
          y: acc.y + p.y * p.temp,
          total: acc.total + p.temp,
        }), { x: 0, y: 0, total: 0 })
      : { x: width / 2, y: height / 2, total: 1 };
    
    const centerB = hotSpotsB.length > 0
      ? hotSpotsB.reduce((acc, p) => ({
          x: acc.x + p.x * p.temp,
          y: acc.y + p.y * p.temp,
          total: acc.total + p.temp,
        }), { x: 0, y: 0, total: 0 })
      : { x: width / 2, y: height / 2, total: 1 };
    
    const cx1 = centerA.x / centerA.total;
    const cy1 = centerA.y / centerA.total;
    const cx2 = centerB.x / centerB.total;
    const cy2 = centerB.y / centerB.total;
    const dx = cx2 - cx1;
    const dy = cy2 - cy1;
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    
    const heatZones = [];
    for (const cell of highlightedCells) {
      if (cell.difference > 0) {
        heatZones.push({
          x: cell.x,
          y: cell.y,
          temperature: cell.difference,
          radius: 2,
        });
      }
    }
    
    const result: ContrastResult = {
      differenceData,
      peakChange,
      averageChange,
      maxIncrease,
      maxDecrease,
      heatZones,
      diffusionDirection: { dx, dy, magnitude },
      highlightedCells,
    };
    
    set({ contrastResult: result });
    return result;
  },
  
  reset: () =>
    set((state) => ({
      mode: 'idle',
      currentStep: 0,
      currentTemperature: createEmptyTemperature(state.grid),
      temperatureHistory: [],
    })),
}));

export default useSimulationStore;
