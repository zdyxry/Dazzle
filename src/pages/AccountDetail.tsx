import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLedgerStore } from '@/stores/ledger';
import { api } from '@/lib/api';
import { AccountBalanceChart, MonthlyBarChart } from '@/components/charts';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { BalancesChartData, BarChartData } from '@/types';

export function AccountDetail() {
  const { account } = useParams<{ account: string }>();
  const navigate = useNavigate();
  const setSelectedAccount = useLedgerStore((state) => state.setSelectedAccount);
  const ledgerData = useLedgerStore((state) => state.ledgerData);
  const filters = useLedgerStore((state) => state.filters);

  const currency = ledgerData?.options.operating_currency?.[0] || 'CNY';
  const decodedAccount = account ? decodeURIComponent(account) : '';

  useEffect(() => {
    if (decodedAccount) {
      setSelectedAccount(decodedAccount);
    }
    return () => setSelectedAccount(null);
  }, [decodedAccount, setSelectedAccount]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['accountReport', decodedAccount, filters],
    queryFn: () => api.getAccountReport(decodedAccount, undefined, filters),
    enabled: !!decodedAccount,
  });

  const accountDetail = decodedAccount ? ledgerData?.account_details[decodedAccount] : null;

  if (!account) {
    return <div>账户不存在</div>;
  }

  const report = data as { charts?: Array<{ type: string; label: string; data: unknown[] }>; journal?: string } | undefined;
  const balanceChart = report?.charts?.find(c => c.type === 'balances') as BalancesChartData | undefined;
  const changesChart = report?.charts?.find(c => c.type === 'bar') as BarChartData | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight font-mono">{decodedAccount}</h1>
          <p className="text-muted-foreground text-sm">账户详情</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">当前余额</p>
            <p className="text-lg font-bold font-mono mt-1">
              {accountDetail?.balance_string || '-'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">更新状态</p>
            <div className="flex items-center gap-2 mt-1">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  accountDetail?.uptodate_status === 'green' ? 'bg-emerald-500' :
                  accountDetail?.uptodate_status === 'yellow' ? 'bg-yellow-500' :
                  accountDetail?.uptodate_status === 'red' ? 'bg-red-500' :
                  'bg-gray-300'
                }`}
              />
              <span className="text-sm font-medium">
                {accountDetail?.uptodate_status === 'green' ? '已更新' :
                 accountDetail?.uptodate_status === 'yellow' ? '需要关注' :
                 accountDetail?.uptodate_status === 'red' ? '已过期' :
                 '未知'}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">最近交易</p>
            <p className="text-sm font-medium mt-1">
              {accountDetail?.last_entry?.date || '无交易记录'}
            </p>
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="text-sm text-destructive text-center py-8">
          加载失败: {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {balanceChart && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">余额走势</CardTitle>
              </CardHeader>
              <CardContent>
                <AccountBalanceChart data={balanceChart} currency={currency} height="300px" />
              </CardContent>
            </Card>
          )}

          {changesChart && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">区间变动</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyBarChart data={changesChart} currency={currency} height="300px" />
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {report?.journal && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">交易流水</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="text-sm overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: report.journal }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
