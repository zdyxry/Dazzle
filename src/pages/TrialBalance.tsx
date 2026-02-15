import { useTrialBalance } from '@/hooks/useLedger';
import { AccountTreeTable } from '@/components/AccountTreeTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLedgerStore } from '@/stores/ledger';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TrialBalance() {
  const { data, isLoading, error } = useTrialBalance();
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
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">试算平衡表</h1>
        <p className="text-muted-foreground mt-1">
          验证借贷是否平衡
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>所有账户</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <AccountTreeTable 
            data={data.trees}
            currencies={operatingCurrencies}
            primaryCurrency={operatingCurrencies[0]}
            onAccountClick={handleAccountClick}
          />
        </CardContent>
      </Card>
    </div>
  );
}
