import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { EChartsWrapper } from './EChartsWrapper';
import type { BalancesChartData } from '@/types';

interface AccountBalanceChartProps {
  data: BalancesChartData;
  currency: string;
  height?: string;
  className?: string;
}

export function AccountBalanceChart({ data, currency, height = '350px', className }: AccountBalanceChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const dates = data.data.map(d => d.date);
    const values = data.data.map(d => d.balance[currency] || 0);

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
        boundaryGap: false,
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
        { type: 'slider', start: 0, end: 100, height: 20, bottom: 0 },
      ],
      series: [
        {
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { width: 2 },
          areaStyle: { opacity: 0.1 },
          itemStyle: { color: '#3b82f6' },
        },
      ],
    };
  }, [data, currency]);

  return <EChartsWrapper option={option} height={height} className={className} />;
}
