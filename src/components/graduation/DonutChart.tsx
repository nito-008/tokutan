import {
  ArcElement,
  Chart,
  type ChartConfiguration,
  DoughnutController,
  Legend,
  Tooltip,
} from "chart.js";
import { type Component, createEffect, onCleanup, onMount } from "solid-js";
import type { CategoryStatus } from "~/lib/types";

// Chart.jsのコンポーネントを登録
Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

interface DonutChartProps {
  categoryStatuses: CategoryStatus[];
  totalEarned: number;
  totalRequired: number;
}

const categoryColors: Record<string, string> = {
  専門科目: "#0284c7", // sky-600 (濃い水色)
  専門基礎科目: "#0ea5e9", // sky-500 (水色)
  基礎科目共通科目: "#38bdf8", // sky-400 (明るい水色)
  基礎科目関連科目: "#7dd3fc", // sky-300 (薄い水色)
};

export const DonutChart: Component<DonutChartProps> = (props) => {
  let canvasRef: HTMLCanvasElement | undefined;
  let chartInstance: Chart | null = null;

  const getChartConfig = (): ChartConfiguration<"doughnut"> => {
    const labels = props.categoryStatuses.map((c) => c.categoryName);
    const data = props.categoryStatuses.map((c) => c.earnedCredits);
    const colors = props.categoryStatuses.map((c) => categoryColors[c.categoryName] || "#94a3b8");

    // 未取得分を計算して追加
    const remaining = Math.max(0, props.totalRequired - props.totalEarned);
    if (remaining > 0) {
      labels.push("未取得");
      data.push(remaining);
      colors.push("#e5e7eb"); // gray-200
    }

    return {
      type: "doughnut",
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderWidth: 0,
            hoverOffset: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: "70%",
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                // 未取得セグメントの場合
                if (context.dataIndex >= props.categoryStatuses.length) {
                  return `未取得: ${context.raw}単位`;
                }
                const category = props.categoryStatuses[context.dataIndex];
                return `${context.label}: ${category.earnedCredits}/${category.requiredCredits}単位`;
              },
            },
          },
        },
      },
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
  return categoryColors[name] || "#bae6fd"; // sky-200
}
