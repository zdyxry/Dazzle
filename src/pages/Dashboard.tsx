import { useBalanceSheet, useIncomeStatement } from '@/hooks/useLedger';
import { useLedgerStore } from '@/stores/ledger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NetWorthChart, MonthlyBarChart, CategoryPieChart } from '@/components/charts';
import { Loader2, TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';
import { AIInsightCard } from '@/components/AIInsightCard';
import type { FinancialSummary } from '@/lib/ai';
import type { AccountTreeNode, BalancesChartData, BarChartData } from '@/types';

function getTreeTotal(node: AccountTreeNode, currency: string): number {
  return (node.balance[currency] || 0) + (node.balance_children[currency] || 0);
}

export function Dashboard() {
  const { data: balanceSheet, isLoading: bsLoading, error: bsError } = useBalanceSheet();
  const { data: incomeStatement, isLoading: isLoading, error: isError } = useIncomeStatement();
  const ledgerData = useLedgerStore((state) => state.ledgerData);

  const currency = ledgerData?.options.operating_currency?.[0] || 'CNY';

  if (bsLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (bsError || isError) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        加载失败: {(bsError || isError)?.message}
      </div>
    );
  }

  // Calculate metrics
  const assetsTotal = balanceSheet?.trees[0] ? getTreeTotal(balanceSheet.trees[0], currency) : 0;
  const liabilitiesTotal = balanceSheet?.trees[1] ? Math.abs(getTreeTotal(balanceSheet.trees[1], currency)) : 0;
  const netWorth = assetsTotal - liabilitiesTotal;

  // Income is typically negative in beancount (credit), so we take absolute value
  const incomeTotal = incomeStatement?.trees[0] ? Math.abs(getTreeTotal(incomeStatement.trees[0], currency)) : 0;
  const expenseTotal = incomeStatement?.trees[2] ? getTreeTotal(incomeStatement.trees[2], currency) : 0;
  const surplus = incomeTotal - expenseTotal;

  // Find chart data
  const netWorthChart = balanceSheet?.charts.find(c => c.type === 'balances') as BalancesChartData | undefined;
  const netProfitChart = incomeStatement?.charts.find(c => c.type === 'bar') as BarChartData | undefined;
  const expenseTree = incomeStatement?.trees[2]; // Expenses tree node

  // Build financial summary for AI insight card
  const monthlyTrend: FinancialSummary['monthlyTrend'] = [];
  if (netProfitChart) {
    for (const item of netProfitChart.data.slice(-6)) {
      const income = Object.values(item.balance).reduce((s, v) => s + Math.abs(Math.min(v, 0)), 0);
      const expense = Object.values(item.balance).reduce((s, v) => s + Math.max(v, 0), 0);
      monthlyTrend.push({ month: item.date, income, expense });
    }
  }

  const topExpenseCategories: FinancialSummary['topExpenseCategories'] = [];
  if (expenseTree) {
    for (const child of expenseTree.children) {
      const amount = (child.balance[currency] || 0) + (child.balance_children[currency] || 0);
      if (amount > 0) {
        topExpenseCategories.push({ category: child.account, amount });
      }
    }
    topExpenseCategories.sort((a, b) => b.amount - a.amount);
    topExpenseCategories.splice(5);
  }

  const financialSummary: FinancialSummary = {
    netWorth,
    totalAssets: assetsTotal,
    totalLiabilities: liabilitiesTotal,
    totalIncome: incomeTotal,
    totalExpenses: expenseTotal,
    surplus,
    currency,
    monthlyTrend,
    topExpenseCategories,
  };

  const metrics = [
    {
      label: '净资产',
      value: formatNumber(netWorth),
      currency,
      icon: Wallet,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: '支出',
      value: formatNumber(expenseTotal),
      currency,
      icon: TrendingDown,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
    },
    {
      label: '收入',
      value: formatNumber(incomeTotal),
      currency,
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      label: '结余',
      value: formatNumber(surplus),
      currency,
      icon: PiggyBank,
      color: surplus >= 0 ? 'text-emerald-600' : 'text-red-500',
      bgColor: surplus >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">财务概览</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {metrics.map((m) => (
          <Card key={m.label} className="overflow-hidden">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{m.label}</p>
                <div className={cn('p-1.5 sm:p-2 rounded-lg shrink-0', m.bgColor)}>
                  <m.icon className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4', m.color)} aria-hidden="true" />
                </div>
              </div>
              <p className={cn('text-lg sm:text-xl font-bold mt-2 font-mono tabular-nums', m.color)}>
                {m.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{m.currency}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Insight */}
      <AIInsightCard financialData={financialSummary} />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Net worth trend */}
        {netWorthChart && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">净资产走势</CardTitle>
            </CardHeader>
            <CardContent>
              <NetWorthChart data={netWorthChart} currency={currency} height="300px" />
            </CardContent>
          </Card>
        )}

        {/* Monthly income/expense */}
        {netProfitChart && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">月度收支</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyBarChart data={netProfitChart} currency={currency} height="300px" />
            </CardContent>
          </Card>
        )}

        {/* Expense categories */}
        {expenseTree && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">支出分类</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryPieChart treeNode={expenseTree} currency={currency} height="350px" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
