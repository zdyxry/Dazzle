import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { EChartsWrapper } from './EChartsWrapper';
import type { BarChartData } from '@/types';

interface MonthlyBarChartProps {
  data: BarChartData;
  currency: string;
  height?: string;
  className?: string;
}

export function MonthlyBarChart({ data, currency, height = '350px', className }: MonthlyBarChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const dates = data.data.map(d => d.date);
    const values = data.data.map(d => d.balance[currency] || 0);
    const colors = values.map(v => v >= 0 ? '#22c55e' : '#ef4444');

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const p = (params as Array<{ axisValue: string; value: number }>)[0];
          return `${p.axisValue}<br/>${currency}: ${p.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '5%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: { rotate: 30 },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (v: number) => {
            if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(0)}万`;
            return v.toLocaleString();
          },
        },
      },
      dataZoom: [
        { type: 'inside', start: 0, end: 100 },
      ],
      series: [
        {
          type: 'bar',
          data: values.map((v, i) => ({
            value: v,
            itemStyle: { color: colors[i] },
          })),
          barMaxWidth: 30,
        },
      ],
    };
  }, [data, currency]);

  return <EChartsWrapper option={option} height={height} className={className} />;
}
