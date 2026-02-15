import { useIncomeStatement } from '@/hooks/useLedger';
import { AccountTreeTable } from '@/components/AccountTreeTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLedgerStore } from '@/stores/ledger';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function IncomeStatement() {
  const { data, isLoading, error } = useIncomeStatement();
  const ledgerData = useLedgerStore((state) => state.ledgerData);
  const navigate = useNavigate();
  
  const operatingCurrencies = ledgerData?.options.operating_currency || ['CNY'];
  
  const handleAccountClick = (account: string) => {
    navigate(`/account/${encodeURIComponent(account)}`);
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
  
  if (!data) {
    return null;
  }
  
  // 分离收入和支出
  const income = data.trees.filter(t => 
    t.account === ledgerData?.options.name_income
  );
  const expenses = data.trees.filter(t => 
    t.account === ledgerData?.options.name_expenses
  );
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">损益表</h1>
        <p className="text-muted-foreground mt-1">
          查看您的收入和支出情况
        </p>
      </div>
      
      {/* 收入部分 */}
      {income.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>收入</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AccountTreeTable 
              data={income}
              currencies={operatingCurrencies}
              primaryCurrency={operatingCurrencies[0]}
              onAccountClick={handleAccountClick}
            />
          </CardContent>
        </Card>
      )}
      
      {/* 支出部分 */}
      {expenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>支出</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AccountTreeTable 
              data={expenses}
              currencies={operatingCurrencies}
              primaryCurrency={operatingCurrencies[0]}
              onAccountClick={handleAccountClick}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
