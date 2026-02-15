import { useBalanceSheet } from '@/hooks/useLedger';
import { AccountTreeTable } from '@/components/AccountTreeTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLedgerStore } from '@/stores/ledger';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function BalanceSheet() {
  const { data, isLoading, error } = useBalanceSheet();
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
  
  // 分离资产和负债
  const assets = data.trees.filter(t => 
    t.account === ledgerData?.options.name_assets
  );
  const liabilities = data.trees.filter(t => 
    t.account === ledgerData?.options.name_liabilities
  );
  const equity = data.trees.filter(t => 
    t.account === ledgerData?.options.name_equity
  );
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">资产负债表</h1>
        <p className="text-muted-foreground mt-1">
          查看您的资产、负债和净资产状况
        </p>
      </div>
      
      {/* 资产部分 */}
      {assets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>资产</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AccountTreeTable 
              data={assets}
              currencies={operatingCurrencies}
              primaryCurrency={operatingCurrencies[0]}
              onAccountClick={handleAccountClick}
            />
          </CardContent>
        </Card>
      )}
      
      {/* 负债部分 */}
      {liabilities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>负债</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AccountTreeTable 
              data={liabilities}
              currencies={operatingCurrencies}
              primaryCurrency={operatingCurrencies[0]}
              onAccountClick={handleAccountClick}
            />
          </CardContent>
        </Card>
      )}
      
      {/* 权益部分 */}
      {equity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>权益</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AccountTreeTable 
              data={equity}
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
