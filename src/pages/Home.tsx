import { useEffect } from 'react';
import ConfigPanel from '@/components/ConfigPanel';
import HeatCanvas from '@/components/HeatCanvas';
import ControlBar from '@/components/ControlBar';
import Timeline from '@/components/Timeline';
import ExperimentPanel from '@/components/ExperimentPanel';
import SnapshotSelector from '@/components/SnapshotSelector';
import ContrastPanel from '@/components/ContrastPanel';
import useSimulationStore from '@/store/useSimulationStore';
import api from '@/services/api';
import { Flame, ArrowRightLeft } from 'lucide-react';

export default function Home() {
  const {
    setMaterials,
    setExperiments,
    setFavorites,
    setSnapshots,
    setAnalysisRecords,
    currentExperimentId,
    isContrastMode,
    setContrastMode,
  } = useSimulationStore();

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [materials, experiments, favorites] = await Promise.all([
          api.materials.getAll(),
          api.experiments.getAll(),
          api.favorites.getAll(),
        ]);
        
        setMaterials(materials);
        setExperiments(experiments);
        setFavorites(favorites);
      } catch (error) {
        console.error('加载初始数据失败:', error);
      }
    };

    loadInitialData();
  }, [setMaterials, setExperiments, setFavorites]);

  useEffect(() => {
    if (currentExperimentId) {
      const loadSnapshots = async () => {
        try {
          const snapshots = await api.snapshots.getByExperiment(currentExperimentId);
          setSnapshots(snapshots);
        } catch (error) {
          console.error('加载快照失败:', error);
        }
      };
      const loadAnalysis = async () => {
        try {
          const records = await api.analysis.getByExperiment(currentExperimentId);
          setAnalysisRecords(records);
        } catch (error) {
          console.error('加载分析记录失败:', error);
        }
      };
      loadSnapshots();
      loadAnalysis();
    }
  }, [currentExperimentId, setSnapshots, setAnalysisRecords]);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 overflow-hidden">
      <header className="h-14 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">热扩散实验室</h1>
            <p className="text-xs text-slate-400">Heat Diffusion Simulator</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setContrastMode(!isContrastMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              isContrastMode
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            对比模式
          </button>
          <span className="text-xs text-slate-400 px-2 py-1 bg-slate-800 rounded-md">v1.0.0</span>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <ConfigPanel />

        <div className="flex-1 flex flex-col overflow-hidden">
          <HeatCanvas />
          {isContrastMode && <ContrastPanel />}
          <Timeline />
          <ControlBar />
        </div>

        {isContrastMode ? <SnapshotSelector /> : <ExperimentPanel />}
      </div>
    </div>
  );
}
