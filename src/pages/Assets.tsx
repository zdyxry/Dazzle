import { useState } from 'react';
import { useBalanceSheet } from '@/hooks/useLedger';
import { useLedgerStore } from '@/stores/ledger';
import { AccountTreeTable } from '@/components/AccountTreeTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NetWorthChart } from '@/components/charts';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { BalancesChartData } from '@/types';

export function Assets() {
  const { data, isLoading, error } = useBalanceSheet();
  const ledgerData = useLedgerStore((state) => state.ledgerData);
  const navigate = useNavigate();
  const [startFromZero, setStartFromZero] = useState(true);

  const currency = ledgerData?.options.operating_currency?.[0] || 'CNY';

  const handleAccountClick = (account: string) => {
    navigate(`account/${encodeURIComponent(account)}`);
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

  const netWorthChart = data.charts.find(c => c.type === 'balances') as BalancesChartData | undefined;

  const assets = data.trees.filter(t => t.account === ledgerData?.options.name_assets);
  const liabilities = data.trees.filter(t => t.account === ledgerData?.options.name_liabilities);
  const equity = data.trees.filter(t => t.account === ledgerData?.options.name_equity);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">资产总览</h1>
        <p className="text-muted-foreground text-sm mt-1">查看资产、负债和净资产状况</p>
      </div>

      {netWorthChart && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base font-medium">走势图</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant={startFromZero ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setStartFromZero(true)}
              >
                从 0 开始
              </Button>
              <Button
                variant={!startFromZero ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setStartFromZero(false)}
              >
                累计余额
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <NetWorthChart
              data={netWorthChart}
              currency={currency}
              height="300px"
              startFromZero={startFromZero}
            />
          </CardContent>
        </Card>
      )}

      {assets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">资产</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AccountTreeTable
              data={assets}
              currencies={[currency]}
              primaryCurrency={currency}
              onAccountClick={handleAccountClick}
            />
          </CardContent>
        </Card>
      )}

      {liabilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">负债</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AccountTreeTable
              data={liabilities}
              currencies={[currency]}
              primaryCurrency={currency}
              onAccountClick={handleAccountClick}
            />
          </CardContent>
        </Card>
      )}

      {equity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">权益</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AccountTreeTable
              data={equity}
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
