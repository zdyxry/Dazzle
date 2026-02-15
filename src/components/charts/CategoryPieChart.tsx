import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { EChartsWrapper } from './EChartsWrapper';
import type { AccountTreeNode } from '@/types';

interface CategoryPieChartProps {
  treeNode: AccountTreeNode;
  currency: string;
  height?: string;
  className?: string;
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#2563eb',
];

export function CategoryPieChart({ treeNode, currency, height = '350px', className }: CategoryPieChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const items = treeNode.children
      .map(child => {
        const value = Math.abs(
          (child.balance[currency] || 0) + (child.balance_children[currency] || 0)
        );
        const name = child.account.split(':').pop() || child.account;
        return { name, value };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number; percent: number };
          return `${p.name}<br/>${currency}: ${p.value.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}<br/>占比: ${p.percent.toFixed(1)}%`;
        },
      },
      legend: {
        type: 'scroll',
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: { fontSize: 12 },
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 0,
          },
          label: { show: false },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          data: items.map((item, i) => ({
            ...item,
            itemStyle: { color: COLORS[i % COLORS.length] },
          })),
        },
      ],
    };
  }, [treeNode, currency]);

  return <EChartsWrapper option={option} height={height} className={className} />;
}
