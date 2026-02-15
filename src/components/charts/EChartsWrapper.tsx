import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, PieChart, SunburstChart, SankeyChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { cn } from '@/lib/utils';

echarts.use([
  LineChart,
  BarChart,
  PieChart,
  SunburstChart,
  SankeyChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent,
  CanvasRenderer,
]);

interface EChartsWrapperProps {
  option: EChartsOption;
  className?: string;
  height?: string;
  theme?: 'light' | 'dark';
  onInit?: (chart: echarts.ECharts) => void;
}

export function EChartsWrapper({ option, className, height = '350px', theme, onInit }: EChartsWrapperProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const isDark = theme === 'dark' || 
      (!theme && document.documentElement.classList.contains('dark'));

    if (instanceRef.current) {
      instanceRef.current.dispose();
    }

    const chart = echarts.init(chartRef.current, isDark ? 'dark' : undefined, {
      renderer: 'canvas',
    });
    instanceRef.current = chart;
    onInit?.(chart);

    const observer = new ResizeObserver(() => {
      chart.resize();
    });
    observer.observe(chartRef.current);

    return () => {
      observer.disconnect();
      chart.dispose();
      instanceRef.current = null;
    };
  }, [theme, onInit]);

  useEffect(() => {
    if (instanceRef.current) {
      instanceRef.current.setOption(option, true);
    }
  }, [option]);

  return (
    <div
      ref={chartRef}
      className={cn('w-full', className)}
      style={{ height }}
    />
  );
}
