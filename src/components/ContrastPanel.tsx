import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Thermometer, 
  ArrowRight,
  Save,
  FileText,
  RefreshCw,
  AlertTriangle,
  MapPin,
  CheckCircle,
  XCircle
} from 'lucide-react';
import useSimulationStore from '../store/useSimulationStore';
import api from '../services/api';
import type { ContrastAnalysis } from '@shared/types';

type ToastType = 'success' | 'error' | null;

export const ContrastPanel: React.FC = () => {
  const {
    isContrastMode,
    contrastResult,
    selectedSnapshotA,
    selectedSnapshotB,
    contrastThreshold,
    currentExperimentId,
    addAnalysisRecord,
    clearContrastSelection,
  } = useSimulationStore();

  const [saving, setSaving] = useState(false);
  const [analysisName, setAnalysisName] = useState('');
  const [toast, setToast] = useState<{ type: ToastType; message: string }>({ type: null, message: '' });

  useEffect(() => {
    if (toast.type) {
      const timer = setTimeout(() => setToast({ type: null, message: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const generateId = () => `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const handleSaveAnalysis = async () => {
    if (!contrastResult || !selectedSnapshotA || !selectedSnapshotB || !currentExperimentId) {
      setToast({ type: 'error', message: '缺少必要信息，无法保存分析记录' });
      return;
    }

    const analysis: ContrastAnalysis = {
      id: generateId(),
      experimentId: currentExperimentId,
      snapshotAId: selectedSnapshotA.id,
      snapshotBId: selectedSnapshotB.id,
      snapshotAName: selectedSnapshotA.name || `第 ${selectedSnapshotA.step} 步`,
      snapshotBName: selectedSnapshotB.name || `第 ${selectedSnapshotB.step} 步`,
      threshold: contrastThreshold,
      result: contrastResult,
      createdAt: Date.now(),
      name: analysisName || `对比分析_${new Date().toLocaleString('zh-CN')}`,
    };

    try {
      setSaving(true);
      await api.analysis.create(analysis);
      addAnalysisRecord(analysis);
      setAnalysisName('');
      setToast({ type: 'success', message: `分析记录"${analysis.name}"已保存` });
    } catch (error) {
      const msg = error instanceof Error ? error.message : '未知错误';
      setToast({ type: 'error', message: `保存失败: ${msg}` });
      console.error('保存分析记录失败:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleRecompute = () => {
    clearContrastSelection();
  };

  if (!isContrastMode) {
    return null;
  }

  if (!contrastResult) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 px-6 py-3">
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>请选择两个快照并点击"计算对比"查看分析结果</span>
        </div>
      </div>
    );
  }

  const { 
    peakChange, 
    averageChange, 
    maxIncrease, 
    maxDecrease, 
    highlightedCells,
    diffusionDirection,
    heatZones
  } = contrastResult;

  const increaseCount = highlightedCells.filter(c => c.difference > 0).length;
  const decreaseCount = highlightedCells.filter(c => c.difference < 0).length;

  const getDirectionLabel = (dx: number, dy: number) => {
    const threshold = 0.5;
    if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return '无明显扩散';
    
    let direction = '';
    if (dy < -threshold) direction += '北';
    if (dy > threshold) direction += '南';
    if (dx < -threshold) direction += '西';
    if (dx > threshold) direction += '东';
    
    return direction + '方向';
  };

  return (
    <div className="bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 px-6 py-4 relative">
      {toast.type && (
        <div className={`absolute -top-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 text-sm font-medium animate-bounce z-50 ${
          toast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          {toast.message}
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-purple-400" />
            对比分析结果
          </h3>
          <div className="text-xs text-slate-400">
            {selectedSnapshotA?.name || `第 ${selectedSnapshotA?.step} 步`}
            <ArrowRight className="w-3 h-3 inline mx-1" />
            {selectedSnapshotB?.name || `第 ${selectedSnapshotB?.step} 步`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="分析记录名称"
              value={analysisName}
              onChange={(e) => setAnalysisName(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-800 border border-slate-600 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 w-48"
            />
            <button
              onClick={handleSaveAnalysis}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white rounded-lg transition-all text-xs font-medium shadow-lg shadow-green-500/20"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? '保存中...' : '保存分析'}
            </button>
          </div>
          <button
            onClick={handleRecompute}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all text-xs font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            重新计算
          </button>
        </div>
      </div>

      <div className="grid grid-cols-8 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
            <span>峰值变化</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ±{peakChange.toFixed(1)}°C
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
            <span>均温变化</span>
          </div>
          <div className={`text-2xl font-bold font-mono ${
            averageChange >= 0 ? 'text-orange-400' : 'text-blue-400'
          }`}>
            {averageChange >= 0 ? '+' : ''}{averageChange.toFixed(2)}°C
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-green-400" />
            <span>最大升温</span>
          </div>
          <div className="text-2xl font-bold text-green-400 font-mono">
            +{maxIncrease.value.toFixed(1)}°C
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            ({maxIncrease.x}, {maxIncrease.y})
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <TrendingDown className="w-3.5 h-3.5 text-purple-400" />
            <span>最大降温</span>
          </div>
          <div className="text-2xl font-bold text-purple-400 font-mono">
            {maxDecrease.value.toFixed(1)}°C
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            ({maxDecrease.x}, {maxDecrease.y})
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <ArrowRight className="w-3.5 h-3.5 text-white" />
            <span>热区扩散方向</span>
          </div>
          <div className="text-lg font-bold text-white font-mono">
            {getDirectionLabel(diffusionDirection.dx, diffusionDirection.dy)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            位移: ({diffusionDirection.dx.toFixed(1)}, {diffusionDirection.dy.toFixed(1)})
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <FileText className="w-3.5 h-3.5 text-red-400" />
            <span>升温超阈值</span>
          </div>
          <div className="text-2xl font-bold text-red-400 font-mono">
            {increaseCount} 格
          </div>
          <div className="text-xs text-slate-500 mt-1">
            阈值 &gt; +{contrastThreshold}°C
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>降温超阈值</span>
          </div>
          <div className="text-2xl font-bold text-blue-400 font-mono">
            {decreaseCount} 格
          </div>
          <div className="text-xs text-slate-500 mt-1">
            阈值 &lt; -{contrastThreshold}°C
          </div>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Thermometer className="w-3.5 h-3.5 text-yellow-400" />
            <span>热区数量</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400 font-mono">
            {heatZones.length} 个
          </div>
          <div className="text-xs text-slate-500 mt-1">
            扩散强度: {diffusionDirection.magnitude.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContrastPanel;
