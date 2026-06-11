import { useEffect, useCallback } from 'react';
import { differenceToColor, drawDifferenceColorBar } from '../engine/ColorMap';
import useSimulationStore from '../store/useSimulationStore';
import type { ContrastResult } from '@shared/types';

interface RenderOptions {
  showGrid?: boolean;
  showCellValues?: boolean;
  showColorBar?: boolean;
  showHighlight?: boolean;
  showDiffusionArrow?: boolean;
}

export function useContrastHeatRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  options: RenderOptions = {}
) {
  const {
    grid,
    contrastResult,
    contrastThreshold,
    selectedSnapshotA,
    selectedSnapshotB,
    hoveredCell,
    isContrastMode,
  } = useSimulationStore();

  const {
    showGrid = true,
    showCellValues = true,
    showColorBar = true,
    showHighlight = true,
    showDiffusionArrow = true,
  } = options;

  const renderDiffusionArrow = useCallback(
    (ctx: CanvasRenderingContext2D, result: ContrastResult, canvasWidth: number, canvasHeight: number) => {
      const { diffusionDirection } = result;
      if (diffusionDirection.magnitude < 0.1) return;

      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const maxArrowLength = Math.min(canvasWidth, canvasHeight) * 0.3;
      const scale = maxArrowLength / Math.max(Math.abs(diffusionDirection.dx), Math.abs(diffusionDirection.dy), 1);
      
      const endX = centerX + diffusionDirection.dx * scale;
      const endY = centerY + diffusionDirection.dy * scale;

      ctx.save();
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      const headLength = 15;
      const angle = Math.atan2(endY - centerY, endX - centerX);
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle - Math.PI / 6),
        endY - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headLength * Math.cos(angle + Math.PI / 6),
        endY - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      const dirText = `扩散方向: (${diffusionDirection.dx.toFixed(1)}, ${diffusionDirection.dy.toFixed(1)})`;
      ctx.fillText(dirText, centerX, centerY - 25);

      ctx.restore();
    },
    []
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height, cellSize } = grid;
    const canvasWidth = width * cellSize;
    const canvasHeight = height * cellSize;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    if (!isContrastMode || !contrastResult || !selectedSnapshotA || !selectedSnapshotB) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
      ctx.font = '16px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (!isContrastMode) {
        ctx.fillText('当前为正常模式', canvasWidth / 2, canvasHeight / 2);
      } else if (!selectedSnapshotA || !selectedSnapshotB) {
        ctx.fillText('请选择两个快照进行对比', canvasWidth / 2, canvasHeight / 2);
      } else {
        ctx.fillText('正在计算对比结果...', canvasWidth / 2, canvasHeight / 2);
      }
      return;
    }

    const { differenceData, peakChange, highlightedCells, maxIncrease, maxDecrease } = contrastResult;
    const maxAbsValue = Math.max(peakChange, 1);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const diff = differenceData[y]?.[x] ?? 0;
        ctx.fillStyle = differenceToColor(diff, maxAbsValue);
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }

    if (showHighlight) {
      for (const cell of highlightedCells) {
        const isPositive = cell.difference > 0;
        ctx.strokeStyle = isPositive ? 'rgba(239, 68, 68, 0.9)' : 'rgba(59, 130, 246, 0.9)';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          cell.x * cellSize + 1,
          cell.y * cellSize + 1,
          cellSize - 2,
          cellSize - 2
        );
      }

      ctx.strokeStyle = 'rgba(34, 197, 94, 1)';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        maxIncrease.x * cellSize - 1,
        maxIncrease.y * cellSize - 1,
        cellSize + 2,
        cellSize + 2
      );

      ctx.strokeStyle = 'rgba(168, 85, 247, 1)';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        maxDecrease.x * cellSize - 1,
        maxDecrease.y * cellSize - 1,
        cellSize + 2,
        cellSize + 2
      );
    }

    if (showGrid && cellSize >= 6) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 0.5;
      
      for (let x = 0; x <= width; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, canvasHeight);
        ctx.stroke();
      }
      
      for (let y = 0; y <= height; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(canvasWidth, y * cellSize);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = 'rgba(168, 85, 247, 0.8)';
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, canvasWidth - 2, canvasHeight - 2);

    if (showDiffusionArrow) {
      renderDiffusionArrow(ctx, contrastResult, canvasWidth, canvasHeight);
    }

    if (hoveredCell && showCellValues) {
      const { x, y } = hoveredCell;
      if (x >= 0 && x < width && y >= 0 && y < height) {
        const diff = differenceData[y]?.[x] ?? 0;
        const tempA = selectedSnapshotA.temperatureData[y]?.[x] ?? 0;
        const tempB = selectedSnapshotB.temperatureData[y]?.[x] ?? 0;
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          x * cellSize + 1,
          y * cellSize + 1,
          cellSize - 2,
          cellSize - 2
        );

        if (cellSize >= 25) {
          ctx.font = 'bold 10px JetBrains Mono, monospace';
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const sign = diff >= 0 ? '+' : '';
          ctx.fillText(
            `${sign}${diff.toFixed(1)}°`,
            x * cellSize + cellSize / 2,
            y * cellSize + cellSize / 2
          );
        }

        const tooltipX = x * cellSize + cellSize;
        const tooltipY = y * cellSize;
        const tooltipWidth = 140;
        const tooltipHeight = 60;

        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.fillRect(tooltipX + 5, tooltipY, tooltipWidth, tooltipHeight);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(tooltipX + 5, tooltipY, tooltipWidth, tooltipHeight);

        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
        ctx.fillText(`快照A: ${tempA.toFixed(1)}°C`, tooltipX + 10, tooltipY + 8);
        ctx.fillText(`快照B: ${tempB.toFixed(1)}°C`, tooltipX + 10, tooltipY + 24);
        const diffColor = diff >= 0 ? 'rgba(251, 146, 60, 1)' : 'rgba(96, 165, 250, 1)';
        ctx.fillStyle = diffColor;
        const sign = diff >= 0 ? '+' : '';
        ctx.fillText(`差值: ${sign}${diff.toFixed(2)}°C`, tooltipX + 10, tooltipY + 40);
      }
    }

    if (showColorBar) {
      const barWidth = 200;
      const barHeight = 16;
      const barX = canvasWidth - barWidth - 16;
      const barY = canvasHeight - barHeight - 16;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(barX - 8, barY - 28, barWidth + 16, barHeight + 40);

      drawDifferenceColorBar(ctx, barX, barY, barWidth, barHeight, maxAbsValue);

      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = 'rgba(96, 165, 250, 0.9)';
      ctx.textAlign = 'left';
      ctx.fillText(`${(-maxAbsValue).toFixed(0)}°`, barX, barY - 8);
      ctx.fillStyle = 'rgba(251, 146, 60, 0.9)';
      ctx.textAlign = 'right';
      ctx.fillText(`+${maxAbsValue.toFixed(0)}°`, barX + barWidth, barY - 8);
      ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
      ctx.textAlign = 'center';
      ctx.fillText('温度差值 (°C)', barX + barWidth / 2, barY + barHeight + 14);
    }

    if (showHighlight) {
      const legendY = 16;
      const legendX = 16;
      const legendItemHeight = 20;
      const items = [
        { color: 'rgba(34, 197, 94, 1)', label: '最大升温点' },
        { color: 'rgba(168, 85, 247, 1)', label: '最大降温点' },
        { color: 'rgba(239, 68, 68, 0.9)', label: `升温 > ${contrastThreshold}°C` },
        { color: 'rgba(59, 130, 246, 0.9)', label: `降温 > ${contrastThreshold}°C` },
      ];

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(legendX - 8, legendY - 8, 160, items.length * legendItemHeight + 16);

      items.forEach((item, i) => {
        const y = legendY + i * legendItemHeight;
        ctx.fillStyle = item.color;
        ctx.fillRect(legendX, y, 12, 12);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(item.label, legendX + 20, y);
      });
    }
  }, [
    canvasRef,
    grid,
    contrastResult,
    contrastThreshold,
    selectedSnapshotA,
    selectedSnapshotB,
    hoveredCell,
    isContrastMode,
    showGrid,
    showCellValues,
    showColorBar,
    showHighlight,
    showDiffusionArrow,
    renderDiffusionArrow,
  ]);

  useEffect(() => {
    render();
  }, [render]);

  return { render };
}

export default useContrastHeatRenderer;
