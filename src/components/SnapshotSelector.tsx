import React, { useState } from 'react';
import { Camera, Check, X, ArrowRightLeft, FileText, Trash2, RotateCcw, List } from 'lucide-react';
import useSimulationStore from '../store/useSimulationStore';
import api from '../services/api';
import type { TemperatureSnapshot, ContrastAnalysis } from '@shared/types';

type TabType = 'snapshots' | 'analysis';

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
    setContrastResult,
    isContrastMode,
    analysisRecords,
    removeAnalysisRecord,
  } = useSimulationStore();

  const [activeTab, setActiveTab] = useState<TabType>('snapshots');
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

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

  const handleLoadAnalysis = (record: ContrastAnalysis) => {
    const snapA = snapshots.find(s => s.id === record.snapshotAId);
    const snapB = snapshots.find(s => s.id === record.snapshotBId);
    
    if (!snapA || !snapB) {
      alert('关联的快照不存在，无法加载此分析记录');
      return;
    }
    
    setSelectedSnapshotA(snapA);
    setSelectedSnapshotB(snapB);
    setContrastThreshold(record.threshold);
    setContrastResult(record.result);
    setActiveTab('snapshots');
  };

  const handleDeleteAnalysis = async (record: ContrastAnalysis, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`确定删除分析记录"${record.name}"吗？`)) return;
    
    try {
      await api.analysis.delete(record.id);
      removeAnalysisRecord(record.id);
      setDeleteToast(`已删除"${record.name}"`);
      setTimeout(() => setDeleteToast(null), 2000);
    } catch (error) {
      console.error('删除分析记录失败:', error);
    }
  };

  const canCompute = selectedSnapshotA && selectedSnapshotB;

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
    <div className="w-80 bg-slate-900/95 backdrop-blur-sm border-l border-slate-700 h-full flex flex-col relative">
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
            onChange={(e) => {
              const newThreshold = Number(e.target.value);
              setContrastThreshold(newThreshold);
              if (selectedSnapshotA && selectedSnapshotB) {
                setTimeout(() => computeContrast(), 0);
              }
            }}
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
                ? contrastResult
                  ? 'bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-purple-500 hover:bg-purple-400 text-white shadow-lg shadow-purple-500/30'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            {contrastResult ? '重新计算' : '计算对比'}
          </button>
        </div>
      </div>

      <div className="px-4 pt-3 pb-2 border-b border-slate-700">
        <div className="flex gap-1 p-1 bg-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('snapshots')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'snapshots'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            快照列表
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'analysis'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            分析记录 ({analysisRecords.length})
          </button>
        </div>
      </div>

      {deleteToast && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg shadow-lg z-50 animate-bounce">
          {deleteToast}
        </div>
      )}

      {activeTab === 'snapshots' && (
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
      )}

      {activeTab === 'analysis' && (
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <div className="text-xs font-medium text-slate-400 mb-2 flex items-center justify-between">
          <span>已保存分析记录 ({analysisRecords.length})</span>
        </div>
        
        {analysisRecords.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">暂无分析记录</p>
            <p className="text-xs mt-1">计算对比后保存分析即可记录</p>
          </div>
        ) : (
          analysisRecords.map((record) => {
            const hasSnapshots = 
              snapshots.some(s => s.id === record.snapshotAId) &&
              snapshots.some(s => s.id === record.snapshotBId);
            
            return (
              <div
                key={record.id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all relative group ${
                  hasSnapshots
                    ? 'bg-slate-800/50 border-slate-700 hover:border-green-500/50'
                    : 'bg-slate-800/30 border-slate-800 opacity-60 cursor-not-allowed'
                }`}
                onClick={() => hasSnapshots && handleLoadAnalysis(record)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-white truncate">
                        {record.name}
                      </h4>
                      {!hasSnapshots && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-500/30 text-red-400 rounded">
                          快照缺失
                        </span>
                      )}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                      <div className="flex items-center gap-1 text-blue-400">
                        <span className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center text-[10px] font-bold text-white">A</span>
                        <span className="truncate text-slate-400">{record.snapshotAName}</span>
                      </div>
                      <div className="flex items-center gap-1 text-orange-400">
                        <span className="w-4 h-4 bg-orange-500 rounded flex items-center justify-center text-[10px] font-bold text-white">B</span>
                        <span className="truncate text-slate-400">{record.snapshotBName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                      <span>阈值: {record.threshold}°C</span>
                      <span>·</span>
                      <span>峰值: ±{record.result.peakChange.toFixed(1)}°C</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {formatDate(record.createdAt)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteAnalysis(record, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded"
                    title="删除记录"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {hasSnapshots && (
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                      <RotateCcw className="w-3 h-3" />
                      点击复用
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      )}
    </div>
  );
};

export default SnapshotSelector;
