import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { EChartsWrapper } from './EChartsWrapper';
import type { BalancesChartData } from '@/types';

interface NetWorthChartProps {
  data: BalancesChartData;
  currency: string;
  height?: string;
  className?: string;
  startFromZero?: boolean;
}

export function NetWorthChart({ data, currency, height = '350px', className, startFromZero = false }: NetWorthChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const dates = data.data.map(d => d.date);
    let values = data.data.map(d => d.balance[currency] || 0);

    // 处理数据为空的情况
    if (values.length === 0) {
      return {
        title: {
          text: '暂无数据',
          left: 'center',
          top: 'center',
          textStyle: { color: '#999' },
        },
        series: [],
      };
    }

    // 计算原始值范围
    const maxValue = Math.max(...values);

    if (startFromZero && values.length > 0) {
      const offset = values[0];
      values = values.map(v => v - offset);
    }



    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const p = (params as Array<{ axisValue: string; value: number; dataIndex: number }>)[0];
          const originalValue = data.data[p.dataIndex]?.balance[currency] || 0;
          const lines = [`${p.axisValue}`];
          if (startFromZero) {
            lines.push(`期间变动: ${p.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} ${currency}`);
            lines.push(`累计余额: ${originalValue.toLocaleString('zh-CN', { minimumFractionDigits: 2 })} ${currency}`);
          } else {
            lines.push(`${currency}: ${p.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`);
          }
          return lines.join('<br/>');
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
        axisLabel: { rotate: 0 },
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        // 当原始数据全为负数时，min为undefined让ECharts自动计算
        // 当原始数据有正有负或全为正时，min为0
        min: startFromZero && maxValue > 0 ? 0 : undefined,
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
          symbol: 'none',
          lineStyle: { width: 2 },
          areaStyle: {
            opacity: 0.15,
          },
          itemStyle: {
            color: '#6366f1',
          },
        },
      ],
    };
  }, [data, currency, startFromZero]);

  return <EChartsWrapper option={option} height={height} className={className} />;
}
