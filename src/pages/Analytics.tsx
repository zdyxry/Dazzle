import { useLedgerStore } from '@/stores/ledger';
import type { Filters } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, TrendingDown, Wallet, PieChart, BarChart3, Globe, GitBranch } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { EChartsOption } from 'echarts';
import { EChartsWrapper } from '@/components/charts/EChartsWrapper';

// 构建 BQL WHERE 条件
function buildBQLWhereClause(baseCondition: string, filters: Filters): string {
  const conditions: string[] = [baseCondition];
  
  if (filters.time) {
    // 处理时间过滤，支持格式如: 2024, 2024-01, 2024-01-01 等
    const time = filters.time;
    if (/^\d{4}$/.test(time)) {
      // 年份格式: 2024
      conditions.push(`year = ${time}`);
    } else if (/^\d{4}-\d{2}$/.test(time)) {
      // 年月格式: 2024-01
      const [year, month] = time.split('-');
      conditions.push(`year = ${year} AND month = ${parseInt(month)}`);
    } else if (time === 'month') {
      conditions.push('month = MONTH(today())');
    } else if (time === 'year') {
      conditions.push('year = YEAR(today())');
    }
    // 其他复杂时间格式暂不处理
  }
  
  if (filters.account) {
    conditions.push(`account ~ '${filters.account}'`);
  }
  
  if (filters.filter) {
    // 简单处理 filter 条件
    const filter = filters.filter;
    if (filter.startsWith('#')) {
      conditions.push(`'${filter.slice(1)}' IN tags`);
    } else if (filter.startsWith('^')) {
      conditions.push(`'${filter.slice(1)}' IN links`);
    } else if (filter.includes('payee:')) {
      const payee = filter.replace('payee:', '').trim();
      conditions.push(`payee = '${payee}'`);
    }
  }
  
  return conditions.join(' AND ');
}

// 使用 BQL 查询数据（支持 filters）
function useBQLQuery(bql: string, filters: Filters, enabled = true) {
  // 将 filters 序列化到 queryKey 中，确保 filters 变化时重新查询
  return useQuery({
    queryKey: ['bql', bql, filters],
    queryFn: () => api.getQuery(bql),
    enabled,
    staleTime: 60000,
  });
}

// 概览指标卡片组件
function MetricCard({ 
  title, 
  value, 
  currency, 
  icon: Icon, 
  color,
  link 
}: { 
  title: string; 
  value: number; 
  currency: string; 
  icon: React.ElementType; 
  color: string;
  link?: string;
}) {

  const colorClass = color === 'green' 
    ? 'text-emerald-600' 
    : color === 'red' 
    ? 'text-red-600' 
    : 'text-blue-600';
  const bgClass = color === 'green' 
    ? 'bg-emerald-50 dark:bg-emerald-950/30' 
    : color === 'red' 
    ? 'bg-red-50 dark:bg-red-950/30' 
    : 'bg-blue-50 dark:bg-blue-950/30';

  return (
    <Card className={link ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className={cn('p-2 rounded-lg', bgClass)}>
            <Icon className={cn('h-4 w-4', colorClass)} />
          </div>
        </div>
        <p className={cn('text-2xl font-bold mt-2 font-mono', colorClass)}>
          {formatNumber(Math.abs(value))}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{currency}</p>
      </CardContent>
    </Card>
  );
}

// 收入支出趋势图
function IncomeExpenseChart({ currency, filters }: { currency: string; filters: Filters }) {
  const incomeWhere = buildBQLWhereClause("account ~ '^Income:'", filters);
  const expenseWhere = buildBQLWhereClause("account ~ '^Expenses:'", filters);
  
  const { data: incomeData } = useBQLQuery(
    `SELECT year, month, CONVERT(SUM(position), '${currency}') AS value WHERE ${incomeWhere} GROUP BY year, month`,
    filters
  );
  const { data: expenseData } = useBQLQuery(
    `SELECT year, month, CONVERT(SUM(position), '${currency}') AS value WHERE ${expenseWhere} GROUP BY year, month`,
    filters
  );

  const option: EChartsOption | null = (() => {
    if (!incomeData || !expenseData || incomeData.t !== 'table' || expenseData.t !== 'table') return null;

    const months: string[] = [];
    const income: number[] = [];
    const expenses: number[] = [];

    // 处理收入数据
    const incomeMap = new Map();
    incomeData.rows.forEach((row: unknown[]) => {
      const year = row[0] as number;
      const month = row[1] as number;
      const value = (row[2] as Record<string, number>)?.[currency] || 0;
      const key = `${year}-${String(month).padStart(2, '0')}`;
      incomeMap.set(key, -value); // 收入为负，取反
    });

    // 处理支出数据
    const expenseMap = new Map();
    expenseData.rows.forEach((row: unknown[]) => {
      const year = row[0] as number;
      const month = row[1] as number;
      const value = (row[2] as Record<string, number>)?.[currency] || 0;
      const key = `${year}-${String(month).padStart(2, '0')}`;
      expenseMap.set(key, value);
    });

    // 合并所有月份
    const allKeys = new Set([...incomeMap.keys(), ...expenseMap.keys()]);
    const sortedKeys = Array.from(allKeys).sort();

    sortedKeys.forEach(key => {
      months.push(key);
      income.push(incomeMap.get(key) || 0);
      expenses.push(expenseMap.get(key) || 0);
    });

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const p = params as Array<{ name: string; value: number; seriesName: string }>;
          let result = p[0].name + '<br/>';
          p.forEach(item => {
            result += `${item.seriesName}: ${formatNumber(item.value)} ${currency}<br/>`;
          });
          return result;
        },
      },
      legend: {
        data: ['收入', '支出'],
        bottom: 0,
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
        data: months,
        axisLabel: { rotate: 45, fontSize: 10 },
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
      series: [
        {
          name: '收入',
          type: 'bar',
          stack: 'total',
          data: income,
          itemStyle: { color: '#3daf46' },
        },
        {
          name: '支出',
          type: 'bar',
          stack: 'total',
          data: expenses.map(v => -v),
          itemStyle: { color: '#af3d3d' },
        },
      ],
    };
  })();

  if (!option) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <p>暂无支出数据</p>
          <p className="text-xs mt-1">请检查账本中是否包含 Expenses 账户</p>
        </div>
      </div>
    );
  }

  return <EChartsWrapper option={option} height="400px" />;
}

// 资产饼图
function AssetsPieChart({ currency, filters }: { currency: string; filters: Filters }) {
  const whereClause = buildBQLWhereClause("account_sortkey(account) ~ '^[01]'", filters);
  const { data } = useBQLQuery(
    `SELECT currency, CONVERT(SUM(position), '${currency}') as market_value WHERE ${whereClause} GROUP BY currency ORDER BY market_value`,
    filters
  );

  const option: EChartsOption | null = (() => {
    if (!data || data.t !== 'table') return null;

    const chartData = data.rows
      .map((row: unknown[]) => ({
        name: row[0] as string,
        value: (row[1] as Record<string, number>)?.[currency] || 0,
      }))
      .filter(item => item.value > 0);

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number; percent: number };
          return `${p.name}<br/>${formatNumber(p.value)} ${currency} (${p.percent.toFixed(1)}%)`;
        },
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}: {d}%',
          },
          data: chartData,
        },
      ],
    };
  })();

  if (!option) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <EChartsWrapper option={option} height="350px" />;
}

// 净值趋势图
function NetWorthTrendChart({ currency, filters }: { currency: string; filters: Filters }) {
  const whereClause = buildBQLWhereClause("account_sortkey(account) ~ '^[01]'", filters);
  const { data } = useBQLQuery(
    `SELECT year, month, CONVERT(LAST(balance), '${currency}') AS value WHERE ${whereClause} GROUP BY year, month`,
    filters
  );

  const option: EChartsOption | null = (() => {
    if (!data || data.t !== 'table') return null;

    const months: string[] = [];
    const values: number[] = [];

    data.rows.forEach((row: unknown[]) => {
      const year = row[0] as number;
      const month = row[1] as number;
      const value = (row[2] as Record<string, number>)?.[currency] || 0;
      months.push(`${year}-${String(month).padStart(2, '0')}`);
      values.push(value);
    });

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const p = (params as Array<{ name: string; value: number }>)[0];
          return `${p.name}<br/>净值: ${formatNumber(p.value)} ${currency}`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '5%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: months,
        boundaryGap: false,
        axisLabel: { fontSize: 10 },
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
      series: [
        {
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 3, color: '#6366f1' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(99, 102, 241, 0.3)' },
                { offset: 1, color: 'rgba(99, 102, 241, 0.05)' },
              ],
            },
          },
        },
      ],
    };
  })();

  if (!option) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <EChartsWrapper option={option} height="300px" />;
}

// 投资组合图
function PortfolioChart({ currency, filters }: { currency: string; filters: Filters }) {
  const whereClause = buildBQLWhereClause(`account ~ '^Assets:' AND currency != '${currency}'`, filters);
  const { data } = useBQLQuery(
    `SELECT year, month, CONVERT(LAST(balance), '${currency}') AS market_value, CONVERT(COST(LAST(balance)), '${currency}') AS book_value WHERE ${whereClause} GROUP BY year, month`,
    filters
  );

  const option: EChartsOption | null = (() => {
    if (!data || data.t !== 'table') return null;

    const months: string[] = [];
    const marketValues: number[] = [];
    const bookValues: number[] = [];

    data.rows.forEach((row: unknown[]) => {
      const year = row[0] as number;
      const month = row[1] as number;
      const marketValue = (row[2] as Record<string, number>)?.[currency] || 0;
      const bookValue = (row[3] as Record<string, number>)?.[currency] || 0;
      months.push(`${year}-${String(month).padStart(2, '0')}`);
      marketValues.push(marketValue);
      bookValues.push(bookValue);
    });

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const p = params as Array<{ name: string; value: number; seriesName: string }>;
          let result = p[0].name + '<br/>';
          p.forEach(item => {
            result += `${item.seriesName}: ${formatNumber(item.value)} ${currency}<br/>`;
          });
          return result;
        },
      },
      legend: {
        data: ['市值', '成本'],
        bottom: 0,
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
        data: months,
        axisLabel: { fontSize: 10 },
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
      series: [
        {
          name: '市值',
          type: 'line',
          data: marketValues,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2 },
        },
        {
          name: '成本',
          type: 'line',
          data: bookValues,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2, type: 'dashed' },
        },
      ],
    };
  })();

  if (!option) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <EChartsWrapper option={option} height="300px" />;
}

// 支出分类旭日图
function ExpenseSunburstChart({ currency, filters }: { currency: string; filters: Filters }) {
  const whereClause = buildBQLWhereClause("account ~ '^Expenses:'", filters);
  const { data } = useBQLQuery(
    `SELECT account, CONVERT(SUM(position), '${currency}') AS value WHERE ${whereClause} GROUP BY account`,
    filters
  );

  const option: EChartsOption | null = (() => {
    if (!data || data.t !== 'table') return null;

    // 构建树形结构 - 聚合到第3级
    const root: Record<string, { name: string; children: Array<{ name: string; value: number }> }> = {};
    
    data.rows.forEach((row: unknown[]) => {
      const account = row[0] as string;
      // CONVERT 返回的是对象格式: { CNY: 123.45 }
      const value = (row[1] as Record<string, number>)?.[currency] || 0;
      
      if (value <= 0) return;

      const parts = account.split(':');
      // 只处理到第3层: Expenses:Category:Subcategory
      if (parts.length < 2) return;

      const category = parts[1];
      const subcategory = parts[2] || '(未分类)';
      
      // 聚合同一分类下的值
      if (!root[category]) {
        root[category] = { name: category, children: [] };
      }
      
      const existingChild = root[category].children.find(c => c.name === subcategory);
      if (existingChild) {
        existingChild.value += value;
      } else {
        root[category].children.push({ name: subcategory, value });
      }
    });
    
    // 如果没有数据，返回 null
    if (Object.keys(root).length === 0) {
      return null;
    }

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number; treePathInfo: Array<{ name: string }> };
          const path = p.treePathInfo.map(i => i.name).filter(n => n).join(' > ');
          return `${path}<br/>${formatNumber(p.value)} ${currency}`;
        },
      },
      series: [
        {
          type: 'sunburst',
          radius: [0, '90%'],
          label: {
            rotate: 'radial',
            minAngle: 5,
          },
          data: Object.values(root),
        },
      ],
    };
  })();

  if (!option) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <EChartsWrapper option={option} height="400px" />;
}

// 旅行支出图
function TravelExpensesChart({ currency, filters }: { currency: string; filters: Filters }) {
  const whereClause = buildBQLWhereClause("account ~ '^Expenses:' AND 'travel' IN tags", filters);
  const { data } = useBQLQuery(
    `SELECT year, CONVERT(SUM(position), '${currency}') AS value WHERE ${whereClause} GROUP BY year`,
    filters
  );

  const option: EChartsOption | null = (() => {
    if (!data || data.t !== 'table') return null;

    const years: string[] = [];
    const values: number[] = [];

    data.rows.forEach((row: unknown[]) => {
      years.push(String(row[0]));
      values.push((row[1] as Record<string, number>)?.[currency] || 0);
    });

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const p = (params as Array<{ name: string; value: number }>)[0];
          return `${p.name}年<br/>旅行支出: ${formatNumber(p.value)} ${currency}`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '5%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: years,
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
      series: [
        {
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3, color: '#8b5cf6' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(139, 92, 246, 0.3)' },
                { offset: 1, color: 'rgba(139, 92, 246, 0.05)' },
              ],
            },
          },
        },
      ],
    };
  })();

  if (!option) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <EChartsWrapper option={option} height="300px" />;
}

// 每次旅行支出对比图
function TravelTripsChart({ currency, filters }: { currency: string; filters: Filters }) {
  const whereClause = buildBQLWhereClause("account ~ '^Expenses:' AND 'travel' IN tags", filters);
  const { data } = useBQLQuery(
    `SELECT date, narration, tags, CONVERT(position, '${currency}') AS value WHERE ${whereClause}`,
    filters
  );

  const option: EChartsOption | null = (() => {
    if (!data || data.t !== 'table') return null;

    // 调试：打印数据结构
    console.log('TravelTripsChart data:', data);
    if (data.rows.length > 0) {
      console.log('First row:', data.rows[0]);
      console.log('First row[3] (value):', data.rows[0][3]);
    }

    // 提取旅行标签并聚合支出
    const tripsMap = new Map<string, number>();
    
    data.rows.forEach((row: unknown[], index: number) => {
      const tags = row[2] as string[];
      const valueData = row[3];
      
      // 处理 value 数据 - 可能是多种格式
      let rawValue = 0;
      if (typeof valueData === 'number') {
        rawValue = valueData;
      } else if (valueData && typeof valueData === 'object') {
        // 尝试获取当前货币的值
        const amountObj = valueData as Record<string, unknown>;
        if (currency in amountObj) {
          rawValue = Number(amountObj[currency]) || 0;
        } else if ('number' in amountObj) {
          rawValue = Number(amountObj.number) || 0;
        }
      }
      
      const value = Math.abs(rawValue);
      
      if (index < 3) {
        console.log(`Row ${index}: tags=${JSON.stringify(tags)}, rawValue=${rawValue}, value=${value}`);
      }
      
      // 查找旅行标签（格式: YYYY-MM-DD-目的地）
      const travelTag = tags.find(tag => /^\d{4}-\d{2}-\d{2}-/.test(tag));
      if (!travelTag) return;
      
      // 提取日期和目的地
      const match = travelTag.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
      if (!match) return;
      
      const [, date, destination] = match;
      const tripKey = `${date} ${destination}`;
      
      // 累加同一旅行的支出
      const currentValue = tripsMap.get(tripKey) || 0;
      tripsMap.set(tripKey, currentValue + value);
    });
    
    console.log('Trips map:', Array.from(tripsMap.entries()));

    // 按日期排序
    const sortedTrips = Array.from(tripsMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));

    if (sortedTrips.length === 0) return null;

    // 反转数据，让最新的旅行显示在最上面
    const reversedTrips = [...sortedTrips].reverse();
    const reversedNames = reversedTrips.map(([name]) => name);
    const reversedValues = reversedTrips.map(([, value]) => value);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const p = (params as Array<{ name: string; value: number }>)[0];
          return `${p.name}<br/>支出: ${formatNumber(p.value)} ${currency}`;
        },
      },
      grid: {
        left: '3%',
        right: '15%',
        bottom: '5%',
        top: '5%',
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          formatter: (v: number) => {
            if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(0)}万`;
            return v.toLocaleString();
          },
        },
      },
      yAxis: {
        type: 'category',
        data: reversedNames,
        axisLabel: { 
          fontSize: 10,
          formatter: (value: string) => {
            // 显示日期和目的地，格式: YYYY-MM-DD 目的地
            const parts = value.split(' ');
            if (parts.length > 1) {
              const date = parts[0];
              const destination = parts.slice(1).join(' ');
              return `${date} ${destination}`;
            }
            return value;
          },
        },
      },
      series: [
        {
          type: 'bar',
          data: reversedValues,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#a78bfa' },
                { offset: 1, color: '#8b5cf6' },
              ],
            },
          },
          label: {
            show: true,
            position: 'right',
            formatter: (params: unknown) => {
              const p = params as { value: number };
              if (p.value >= 10000) {
                return `${(p.value / 10000).toFixed(1)}万`;
              }
              return p.value.toLocaleString();
            },
            fontSize: 10,
          },
        },
      ],
    };
  })();

  if (!option) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        暂无旅行数据
      </div>
    );
  }

  return <EChartsWrapper option={option} height="400px" />;
}

// Sankey 资金流图
function SankeyChart({ currency, filters }: { currency: string; filters: Filters }) {
  const incomeWhere = buildBQLWhereClause("account ~ '^Income:'", filters);
  const expenseWhere = buildBQLWhereClause("account ~ '^Expenses:'", filters);
  
  const { data: incomeData } = useBQLQuery(
    `SELECT account, CONVERT(SUM(position), '${currency}') AS value WHERE ${incomeWhere} GROUP BY account`,
    filters
  );
  const { data: expenseData } = useBQLQuery(
    `SELECT account, CONVERT(SUM(position), '${currency}') AS value WHERE ${expenseWhere} GROUP BY account`,
    filters
  );

  const option: EChartsOption | null = (() => {
    if (!incomeData || !expenseData || incomeData.t !== 'table' || expenseData.t !== 'table') return null;

    const nodes: Array<{ name: string; itemStyle?: { color?: string } }> = [{ name: 'Income', itemStyle: { color: '#3daf46' } }];
    const links: Array<{ source: string; target: string; value: number }> = [];
    const nodeSet = new Set<string>(['Income']);

    // 处理收入数据
    incomeData.rows.forEach((row: unknown[]) => {
      const account = row[0] as string;
      const value = Math.abs((row[1] as Record<string, number>)?.[currency] || 0);
      if (value <= 0) return;

      const parts = account.split(':');
      const category = parts[1] || account;
      
      if (!nodeSet.has(category)) {
        nodes.push({ name: category, itemStyle: { color: '#3daf46' } });
        nodeSet.add(category);
      }
      links.push({ source: 'Income', target: category, value });
    });

    // 处理支出数据
    expenseData.rows.forEach((row: unknown[]) => {
      const account = row[0] as string;
      const value = (row[1] as Record<string, number>)?.[currency] || 0;
      if (value <= 0) return;

      const parts = account.split(':');
      const category = parts[1] || account;
      const subcategory = parts[2];
      
      if (!nodeSet.has(category)) {
        nodes.push({ name: category, itemStyle: { color: '#af3d3d' } });
        nodeSet.add(category);
      }
      
      // 连接到收入节点或支出主节点
      links.push({ source: 'Income', target: category, value });
      
      // 如果有子分类，添加子节点
      if (subcategory) {
        const fullName = `${category}:${subcategory}`;
        if (!nodeSet.has(fullName)) {
          nodes.push({ name: fullName, itemStyle: { color: '#d97706' } });
          nodeSet.add(fullName);
        }
        links.push({ source: category, target: fullName, value });
      }
    });

    if (links.length === 0) return null;

    return {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: (params: unknown) => {
          const p = params as { name: string; value: number; dataType: string };
          if (p.dataType === 'edge') {
            return `${p.name}: ${formatNumber(p.value)} ${currency}`;
          }
          return `${p.name}: ${formatNumber(p.value)} ${currency}`;
        },
      },
      series: [
        {
          type: 'sankey',
          layout: 'none',
          emphasis: {
            focus: 'adjacency',
          },
          data: nodes,
          links: links,
          lineStyle: {
            color: 'gradient',
            curveness: 0.5,
          },
          label: {
            fontSize: 11,
            formatter: (params: unknown) => {
              const p = params as { name: string };
              // 简化显示名称
              return p.name.split(':').pop() || p.name;
            },
          },
        },
      ],
    };
  })();

  if (!option) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        暂无数据
      </div>
    );
  }

  return <EChartsWrapper option={option} height="600px" />;
}

// 年度收入对比图（按主要分类）
function YearlyIncomeChart({ currency, filters }: { currency: string; filters: Filters }) {
  const whereClause = buildBQLWhereClause("account ~ '^Income:'", filters);
  const { data } = useBQLQuery(
    `SELECT year, root(account, 2) AS account, CONVERT(SUM(position), '${currency}') AS value WHERE ${whereClause} GROUP BY year, account`,
    filters
  );

  const option: EChartsOption | null = (() => {
    if (!data || data.t !== 'table') return null;

    // 收集所有年份和账户
    const yearsSet = new Set<number>();
    const accountsMap = new Map<string, Map<number, number>>();
    
    data.rows.forEach((row: unknown[]) => {
      const year = row[0] as number;
      const account = row[1] as string;
      const value = Math.abs((row[2] as Record<string, number>)?.[currency] || 0);
      
      if (value <= 0) return;
      
      yearsSet.add(year);
      
      if (!accountsMap.has(account)) {
        accountsMap.set(account, new Map());
      }
      accountsMap.get(account)!.set(year, value);
    });

    const years = Array.from(yearsSet).sort();
    const accounts = Array.from(accountsMap.keys());
    
    // 只保留前6个最大的收入分类
    const sortedAccounts = accounts
      .map(acc => {
        const total = Array.from(accountsMap.get(acc)!.values()).reduce((a, b) => a + b, 0);
        return { account: acc, total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map(a => a.account);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const p = params as Array<{ name: string; value: number; seriesName: string }>;
          let result = p[0].name + '年<br/>';
          p.forEach(item => {
            result += `${item.seriesName}: ${formatNumber(item.value)} ${currency}<br/>`;
          });
          return result;
        },
      },
      legend: {
        data: sortedAccounts.map(a => a.split(':').pop() || a),
        bottom: 0,
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
        data: years.map(String),
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
      series: sortedAccounts.map(account => ({
        name: account.split(':').pop() || account,
        type: 'bar',
        stack: 'total',
        data: years.map(year => accountsMap.get(account)?.get(year) || 0),
      })),
    };
  })();

  if (!option) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        暂无数据
      </div>
    );
  }

  return <EChartsWrapper option={option} height="350px" />;
}

// 年度支出对比图（按主要分类）
function YearlyExpenseChart({ currency, filters }: { currency: string; filters: Filters }) {
  const whereClause = buildBQLWhereClause("account ~ '^Expenses:'", filters);
  const { data } = useBQLQuery(
    `SELECT year, root(account, 2) AS account, CONVERT(SUM(position), '${currency}') AS value WHERE ${whereClause} GROUP BY year, account`,
    filters
  );

  const option: EChartsOption | null = (() => {
    if (!data || data.t !== 'table') return null;

    // 收集所有年份和账户
    const yearsSet = new Set<number>();
    const accountsMap = new Map<string, Map<number, number>>();
    
    data.rows.forEach((row: unknown[]) => {
      const year = row[0] as number;
      const account = row[1] as string;
      const value = (row[2] as Record<string, number>)?.[currency] || 0;
      
      if (value <= 0) return;
      
      yearsSet.add(year);
      
      if (!accountsMap.has(account)) {
        accountsMap.set(account, new Map());
      }
      accountsMap.get(account)!.set(year, value);
    });

    const years = Array.from(yearsSet).sort();
    const accounts = Array.from(accountsMap.keys());
    
    // 只保留前6个最大的支出分类
    const sortedAccounts = accounts
      .map(acc => {
        const total = Array.from(accountsMap.get(acc)!.values()).reduce((a, b) => a + b, 0);
        return { account: acc, total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
      .map(a => a.account);

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: unknown) => {
          const p = params as Array<{ name: string; value: number; seriesName: string }>;
          let result = p[0].name + '年<br/>';
          p.forEach(item => {
            result += `${item.seriesName}: ${formatNumber(item.value)} ${currency}<br/>`;
          });
          return result;
        },
      },
      legend: {
        data: sortedAccounts.map(a => a.split(':').pop() || a),
        bottom: 0,
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
        data: years.map(String),
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
      series: sortedAccounts.map(account => ({
        name: account.split(':').pop() || account,
        type: 'bar',
        stack: 'total',
        data: years.map(year => accountsMap.get(account)?.get(year) || 0),
      })),
    };
  })();

  if (!option) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        暂无数据
      </div>
    );
  }

  return <EChartsWrapper option={option} height="350px" />;
}

// 历史最大支出表格
function TopExpensesTable({ currency, filters }: { currency: string; filters: Filters }) {
  const whereClause = buildBQLWhereClause("account ~ '^Expenses:'", filters);
  const { data } = useBQLQuery(
    `SELECT date, payee, narration, CONVERT(position, '${currency}') AS amount WHERE ${whereClause} ORDER BY amount DESC LIMIT 10`,
    filters
  );

  if (!data || data.t !== 'table') {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const expenses = data.rows.map((row: unknown[]) => ({
    date: row[0] as string,
    payee: row[1] as string,
    narration: row[2] as string,
    amount: (row[3] as Record<string, number>)?.[currency] || 0,
  }));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">日期</th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">商家</th>
            <th className="text-left py-2 px-3 font-medium text-muted-foreground">说明</th>
            <th className="text-right py-2 px-3 font-medium text-muted-foreground">金额</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense, index) => (
            <tr key={index} className="border-b border-border/50 hover:bg-muted/30">
              <td className="py-2 px-3 font-mono text-xs">{expense.date}</td>
              <td className="py-2 px-3">{expense.payee || '-'}</td>
              <td className="py-2 px-3 text-muted-foreground">{expense.narration || '-'}</td>
              <td className="py-2 px-3 text-right font-mono text-red-600">
                {formatNumber(expense.amount)} {currency}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 投资组合收益图
function PortfolioGainsChart({ currency, filters }: { currency: string; filters: Filters }) {
  const whereClause = buildBQLWhereClause(`account ~ '^Assets:' AND currency != '${currency}'`, filters);
  const { data } = useBQLQuery(
    `SELECT year, month, CONVERT(LAST(balance), '${currency}') AS market_value, CONVERT(COST(LAST(balance)), '${currency}') AS book_value WHERE ${whereClause} GROUP BY year, month`,
    filters
  );

  const option: EChartsOption | null = (() => {
    if (!data || data.t !== 'table') return null;

    const months: string[] = [];
    const gains: number[] = [];

    data.rows.forEach((row: unknown[]) => {
      const year = row[0] as number;
      const month = row[1] as number;
      const marketValue = (row[2] as Record<string, number>)?.[currency] || 0;
      const bookValue = (row[3] as Record<string, number>)?.[currency] || 0;
      months.push(`${year}-${String(month).padStart(2, '0')}`);
      gains.push(marketValue - bookValue);
    });

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const p = (params as Array<{ name: string; value: number }>)[0];
          return `${p.name}<br/>收益: ${formatNumber(p.value)} ${currency}`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        top: '5%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: months,
        axisLabel: { fontSize: 10 },
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
      series: [
        {
          type: 'line',
          data: gains,
          smooth: true,
          symbol: 'none',
          lineStyle: { width: 2 },
          areaStyle: { opacity: 0.2 },
        },
      ],
    };
  })();

  if (!option) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        暂无数据
      </div>
    );
  }

  return <EChartsWrapper option={option} height="300px" />;
}

// 月度平均指标卡片
function MonthlyAvgCard({ 
  title, 
  bql, 
  currency, 
  icon: Icon, 
  color,
  filters,
}: { 
  title: string; 
  bql: string;
  currency: string; 
  icon: React.ElementType; 
  color: string;
  isIncome?: boolean;
  filters: Filters;
}) {
  const { data: ledgerData } = useLedgerStore((state) => ({ data: state.ledgerData }));
  const { data } = useBQLQuery(bql, filters);

  const value = (() => {
    if (!data || data.t !== 'table' || !ledgerData) return 0;
    const rawValue = (data.rows[0]?.[0] as Record<string, number>)?.[currency] || 0;
    
    // 计算月数
    const years = ledgerData.years;
    if (years.length === 0) return 0;
    const firstYear = parseInt(years[0]);
    const lastYear = parseInt(years[years.length - 1]);
    const months = (lastYear - firstYear + 1) * 12;
    
    if (months === 0) return 0;
    return Math.abs(rawValue) / months;
  })();

  const colorClass = color === 'green' ? 'text-emerald-600' : 'text-red-600';
  const bgClass = color === 'green' ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30';

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className={cn('p-2 rounded-lg', bgClass)}>
            <Icon className={cn('h-4 w-4', colorClass)} />
          </div>
        </div>
        <p className={cn('text-2xl font-bold mt-2 font-mono', colorClass)}>
          {formatNumber(value)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{currency}</p>
      </CardContent>
    </Card>
  );
}

// 主页面
export function Analytics() {
  const ledgerData = useLedgerStore((state) => state.ledgerData);
  const filters = useLedgerStore((state) => state.filters);
  const currency = ledgerData?.options.operating_currency?.[0] || 'CNY';

  // 概览数据查询
  const assetsWhere = buildBQLWhereClause("account ~ '^Assets:'", filters);
  const liabilitiesWhere = buildBQLWhereClause("account ~ '^Liabilities:'", filters);
  const incomeWhere = buildBQLWhereClause("account ~ '^Income:'", filters);
  const expenseWhere = buildBQLWhereClause("account ~ '^Expenses:'", filters);

  const { data: assetsData } = useBQLQuery(
    `SELECT CONVERT(SUM(position), '${currency}') AS value WHERE ${assetsWhere}`,
    filters
  );
  const { data: liabilitiesData } = useBQLQuery(
    `SELECT CONVERT(SUM(position), '${currency}') AS value WHERE ${liabilitiesWhere}`,
    filters
  );
  const { data: incomeData } = useBQLQuery(
    `SELECT CONVERT(SUM(position), '${currency}') AS value WHERE ${incomeWhere}`,
    filters
  );
  const { data: expenseData } = useBQLQuery(
    `SELECT CONVERT(SUM(position), '${currency}') AS value WHERE ${expenseWhere}`,
    filters
  );

  const assets = assetsData?.t === 'table' 
    ? ((assetsData.rows[0]?.[0] as Record<string, number>)?.[currency] || 0) 
    : 0;
  const liabilities = liabilitiesData?.t === 'table' 
    ? Math.abs((liabilitiesData.rows[0]?.[0] as Record<string, number>)?.[currency] || 0) 
    : 0;
  const income = incomeData?.t === 'table' 
    ? Math.abs((incomeData.rows[0]?.[0] as Record<string, number>)?.[currency] || 0) 
    : 0;
  const expenses = expenseData?.t === 'table' 
    ? ((expenseData.rows[0]?.[0] as Record<string, number>)?.[currency] || 0) 
    : 0;

  const isLoading = !assetsData || !liabilitiesData || !incomeData || !expenseData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">财务分析</h1>
        <p className="text-muted-foreground text-sm mt-1">深度分析您的财务状况</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-fit">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">概览</span>
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">资产</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">收支</span>
          </TabsTrigger>
          <TabsTrigger value="travel" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">旅行</span>
          </TabsTrigger>
          <TabsTrigger value="sankey" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            <span className="hidden sm:inline">资金流</span>
          </TabsTrigger>
        </TabsList>

        {/* 概览 Tab */}
        <TabsContent value="overview" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="资产" value={assets} currency={currency} icon={Wallet} color="green" />
                <MetricCard title="负债" value={liabilities} currency={currency} icon={TrendingDown} color="red" />
                <MetricCard title="收入" value={income} currency={currency} icon={TrendingUp} color="green" />
                <MetricCard title="支出" value={expenses} currency={currency} icon={TrendingDown} color="red" />
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium">收入支出趋势</CardTitle>
                </CardHeader>
                <CardContent>
                  <IncomeExpenseChart currency={currency} filters={filters} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">资产分布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AssetsPieChart currency={currency} filters={filters} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">支出分类</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ExpenseSunburstChart currency={currency} filters={filters} />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* 资产 Tab */}
        <TabsContent value="assets" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">净值趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <NetWorthTrendChart currency={currency} filters={filters} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">投资组合</CardTitle>
              </CardHeader>
              <CardContent>
                <PortfolioChart currency={currency} filters={filters} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">投资组合收益</CardTitle>
              </CardHeader>
              <CardContent>
                <PortfolioGainsChart currency={currency} filters={filters} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">资产分布</CardTitle>
              </CardHeader>
              <CardContent>
                <AssetsPieChart currency={currency} filters={filters} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 收支 Tab */}
        <TabsContent value="expenses" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <MonthlyAvgCard 
              title="月均收入" 
              bql={`SELECT CONVERT(SUM(position), '${currency}') AS value WHERE ${buildBQLWhereClause("account ~ '^Income:'", filters)}`}
              currency={currency} 
              icon={TrendingUp} 
              color="green"
              filters={filters}
            />
            <MonthlyAvgCard 
              title="月均支出" 
              bql={`SELECT CONVERT(SUM(position), '${currency}') AS value WHERE ${buildBQLWhereClause("account ~ '^Expenses:'", filters)}`}
              currency={currency} 
              icon={TrendingDown} 
              color="red"
              filters={filters}
            />
            <MonthlyAvgCard 
              title="月均结余" 
              bql={`SELECT CONVERT(SUM(position), '${currency}') AS value WHERE ${buildBQLWhereClause("account ~ '^Income:' OR account ~ '^Expenses:'", filters)}`}
              currency={currency} 
              icon={Wallet} 
              color="green"
              filters={filters}
            />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">收入支出趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <IncomeExpenseChart currency={currency} filters={filters} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">年度收入对比（按分类）</CardTitle>
              </CardHeader>
              <CardContent>
                <YearlyIncomeChart currency={currency} filters={filters} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">年度支出对比（按分类）</CardTitle>
              </CardHeader>
              <CardContent>
                <YearlyExpenseChart currency={currency} filters={filters} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">支出分类</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseSunburstChart currency={currency} filters={filters} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">历史最大 10 笔支出</CardTitle>
            </CardHeader>
            <CardContent>
              <TopExpensesTable currency={currency} filters={filters} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 旅行 Tab */}
        <TabsContent value="travel" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">年度旅行支出</CardTitle>
            </CardHeader>
            <CardContent>
              <TravelExpensesChart currency={currency} filters={filters} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">每次旅行支出对比</CardTitle>
            </CardHeader>
            <CardContent>
              <TravelTripsChart currency={currency} filters={filters} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sankey 资金流 Tab */}
        <TabsContent value="sankey" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">资金流动图 (Sankey)</CardTitle>
            </CardHeader>
            <CardContent>
              <SankeyChart currency={currency} filters={filters} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
