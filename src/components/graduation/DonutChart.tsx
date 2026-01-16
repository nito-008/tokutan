import { Component, onMount, onCleanup, createEffect } from 'solid-js';
import { Chart, type ChartConfiguration, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
import type { CategoryStatus } from '~/lib/types';

// Chart.jsのコンポーネントを登録
Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

interface DonutChartProps {
  categoryStatuses: CategoryStatus[];
  totalEarned: number;
  totalRequired: number;
}

const categoryColors: Record<string, string> = {
  '専門科目': '#3b82f6',
  '専門基礎科目': '#8b5cf6',
  '共通科目': '#22c55e',
  '基礎科目': '#f97316',
};

export const DonutChart: Component<DonutChartProps> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  let chartInstance: Chart | null = null;

  const getChartConfig = (): ChartConfiguration<'doughnut'> => {
    const labels = props.categoryStatuses.map(c => c.categoryName);
    const data = props.categoryStatuses.map(c => c.earnedCredits);
    const colors = props.categoryStatuses.map(c =>
      categoryColors[c.categoryName] || '#94a3b8'
    );

    return {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '70%',
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const category = props.categoryStatuses[context.dataIndex];
                return `${context.label}: ${category.earnedCredits}/${category.requiredCredits}単位`;
              }
            }
          }
        }
      }
    };
  };

  onMount(() => {
    if (canvasRef) {
      chartInstance = new Chart(canvasRef, getChartConfig());
    }
  });

  createEffect(() => {
    if (chartInstance) {
      const config = getChartConfig();
      chartInstance.data = config.data;
      chartInstance.update();
    }
  });

  onCleanup(() => {
    chartInstance?.destroy();
  });

  const percentage = () => Math.round((props.totalEarned / props.totalRequired) * 100);

  return (
    <div class="relative w-64 h-64 mx-auto">
      <canvas ref={canvasRef} />
      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span class="text-3xl font-bold">{percentage()}%</span>
        <span class="text-sm text-muted-foreground">
          {props.totalEarned}/{props.totalRequired}単位
        </span>
      </div>
    </div>
  );
};

export function getCategoryColor(name: string): string {
  return categoryColors[name] || '#94a3b8';
}
