import { useIncomeStatement } from '@/hooks/useLedger';
import { useLedgerStore } from '@/stores/ledger';
import { AccountTreeTable } from '@/components/AccountTreeTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MonthlyBarChart, CategoryPieChart } from '@/components/charts';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { BarChartData } from '@/types';

export function IncomeExpense() {
  const { data, isLoading, error } = useIncomeStatement();
  const ledgerData = useLedgerStore((state) => state.ledgerData);
  const navigate = useNavigate();

  const currency = ledgerData?.options.operating_currency?.[0] || 'CNY';

  const handleAccountClick = (account: string) => {
    navigate(`../account/${encodeURIComponent(account)}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        加载失败: {error.message}
      </div>
    );
  }

  if (!data) return null;

  // charts[0] = net profit (bar), charts[1] = income (bar), charts[2] = expenses (bar)
  const netProfitChart = data.charts.find(c => c.type === 'bar') as BarChartData | undefined;
  const incomeChart = data.charts[1]?.type === 'bar' ? data.charts[1] as BarChartData : undefined;
  const expenseChart = data.charts[2]?.type === 'bar' ? data.charts[2] as BarChartData : undefined;

  const incomeTree = data.trees[0]; // Income
  const expenseTree = data.trees[2]; // Expenses

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">收支分析</h1>
        <p className="text-muted-foreground text-sm mt-1">收入与支出趋势分析</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {netProfitChart && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">月度收支净值</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyBarChart data={netProfitChart} currency={currency} height="300px" />
            </CardContent>
          </Card>
        )}

        {expenseTree && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">支出分类占比</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryPieChart treeNode={expenseTree} currency={currency} height="300px" />
            </CardContent>
          </Card>
        )}

        {incomeChart && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">收入趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyBarChart data={incomeChart} currency={currency} height="300px" />
            </CardContent>
          </Card>
        )}

        {expenseChart && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">支出趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyBarChart data={expenseChart} currency={currency} height="300px" />
            </CardContent>
          </Card>
        )}
      </div>

      {incomeTree && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">收入明细</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AccountTreeTable
              data={[incomeTree]}
              currencies={[currency]}
              primaryCurrency={currency}
              onAccountClick={handleAccountClick}
            />
          </CardContent>
        </Card>
      )}

      {expenseTree && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">支出明细</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AccountTreeTable
              data={[expenseTree]}
              currencies={[currency]}
              primaryCurrency={currency}
              onAccountClick={handleAccountClick}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
