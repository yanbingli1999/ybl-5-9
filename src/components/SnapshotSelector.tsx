import React from 'react';
import { Camera, Check, X, ArrowRightLeft } from 'lucide-react';
import useSimulationStore from '../store/useSimulationStore';
import type { TemperatureSnapshot } from '@shared/types';

export const SnapshotSelector: React.FC = () => {
  const {
    snapshots,
    selectedSnapshotA,
    selectedSnapshotB,
    setSelectedSnapshotA,
    setSelectedSnapshotB,
    clearContrastSelection,
    computeContrast,
    contrastResult,
    contrastThreshold,
    setContrastThreshold,
    isContrastMode,
  } = useSimulationStore();

  const handleSnapshotClick = (snapshot: TemperatureSnapshot) => {
    if (!isContrastMode) return;
    
    if (!selectedSnapshotA) {
      setSelectedSnapshotA(snapshot);
    } else if (!selectedSnapshotB && snapshot.id !== selectedSnapshotA.id) {
      setSelectedSnapshotB(snapshot);
    } else if (snapshot.id === selectedSnapshotA.id) {
      setSelectedSnapshotA(null);
    } else if (snapshot.id === selectedSnapshotB?.id) {
      setSelectedSnapshotB(null);
    } else {
      setSelectedSnapshotA(snapshot);
      setSelectedSnapshotB(null);
    }
  };

  const canCompute = selectedSnapshotA && selectedSnapshotB && !contrastResult;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isContrastMode) {
    return (
      <div className="w-80 bg-slate-900/95 backdrop-blur-sm border-l border-slate-700 h-full flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-purple-400" />
            快照对比
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-slate-500 text-center">
            点击下方"对比模式"按钮开启快照对比功能
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-slate-900/95 backdrop-blur-sm border-l border-slate-700 h-full flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-purple-400" />
          快照对比
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          选择两个快照进行温度差值分析
        </p>
      </div>

      <div className="p-4 border-b border-slate-700 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className={`p-3 rounded-lg border-2 transition-all ${
            selectedSnapshotA 
              ? 'bg-blue-500/20 border-blue-500' 
              : 'bg-slate-800/50 border-slate-700 border-dashed'
          }`}>
            <div className="text-xs font-medium text-blue-400 mb-1">快照 A</div>
            {selectedSnapshotA ? (
              <div>
                <div className="text-sm font-semibold text-white truncate">
                  {selectedSnapshotA.name || `第 ${selectedSnapshotA.step} 步`}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  第 {selectedSnapshotA.step} 步
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">请选择...</div>
            )}
          </div>
          <div className={`p-3 rounded-lg border-2 transition-all ${
            selectedSnapshotB 
              ? 'bg-orange-500/20 border-orange-500' 
              : 'bg-slate-800/50 border-slate-700 border-dashed'
          }`}>
            <div className="text-xs font-medium text-orange-400 mb-1">快照 B</div>
            {selectedSnapshotB ? (
              <div>
                <div className="text-sm font-semibold text-white truncate">
                  {selectedSnapshotB.name || `第 ${selectedSnapshotB.step} 步`}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  第 {selectedSnapshotB.step} 步
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">请选择...</div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">差值阈值</span>
            <span className="text-xs font-mono text-purple-400">{contrastThreshold}°C</span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            step="1"
            value={contrastThreshold}
            onChange={(e) => setContrastThreshold(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={clearContrastSelection}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-all text-xs font-medium"
          >
            <X className="w-3.5 h-3.5" />
            清除
          </button>
          <button
            onClick={() => computeContrast()}
            disabled={!canCompute}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg transition-all text-xs font-medium ${
              canCompute
                ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-lg shadow-purple-500/30'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            计算对比
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <div className="text-xs font-medium text-slate-400 mb-2">
          可选快照 ({snapshots.length})
        </div>
        
        {snapshots.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Camera className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">暂无快照</p>
            <p className="text-xs mt-1">运行模拟后保存快照</p>
          </div>
        ) : (
          snapshots.map((snapshot) => {
            const isSelectedA = snapshot.id === selectedSnapshotA?.id;
            const isSelectedB = snapshot.id === selectedSnapshotB?.id;
            const isSelected = isSelectedA || isSelectedB;
            
            return (
              <div
                key={snapshot.id}
                onClick={() => handleSnapshotClick(snapshot)}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  isSelectedA
                    ? 'bg-blue-500/20 border-blue-500'
                    : isSelectedB
                    ? 'bg-orange-500/20 border-orange-500'
                    : 'bg-slate-800/50 border-slate-700 hover:border-purple-500/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                          isSelectedA ? 'bg-blue-500' : 'bg-orange-500'
                        }`}>
                          {isSelectedA ? 'A' : 'B'}
                        </div>
                      )}
                      <h4 className="text-sm font-medium text-white truncate">
                        {snapshot.name || `第 ${snapshot.step} 步`}
                      </h4>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                      <span>第 {snapshot.step} 步</span>
                      <span>·</span>
                      <span>{formatDate(snapshot.timestamp)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    {isSelected && (
                      <div className={`w-2 h-2 rounded-full ${
                        isSelectedA ? 'bg-blue-500' : 'bg-orange-500'
                      }`} />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SnapshotSelector;
