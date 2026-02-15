import { useState } from 'react';
import { Calendar, Filter, X, Wallet } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { useLedgerStore } from '@/stores/ledger';
import { AccountPicker } from './AccountPicker';

export function FilterBar() {
  const { filters, setFilter, clearFilters, ledgerData } = useLedgerStore();
  const [timeFilter, setTimeFilter] = useState(filters.time || '');
  const [accountFilter, setAccountFilter] = useState(filters.account || '');
  const [advancedFilter, setAdvancedFilter] = useState(filters.filter || '');

  const accounts = ledgerData?.accounts || [];
  const hasFilters = filters.time || filters.account || filters.filter;

  const applyFilters = () => {
    setFilter('time', timeFilter || undefined);
    setFilter('account', accountFilter || undefined);
    setFilter('filter', advancedFilter || undefined);
  };

  const handleClear = () => {
    setTimeFilter('');
    setAccountFilter('');
    setAdvancedFilter('');
    clearFilters();
  };

  const handleClearSingle = (key: 'time' | 'account' | 'filter') => {
    setFilter(key, undefined);
    if (key === 'time') setTimeFilter('');
    if (key === 'account') setAccountFilter('');
    if (key === 'filter') setAdvancedFilter('');
  };

  return (
    <div className="space-y-2">
      {/* 已应用的筛选条件标签 */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">已应用筛选:</span>
          {filters.time && (
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              时间: {filters.time}
              <button 
                onClick={() => handleClearSingle('time')}
                className="ml-1 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded p-0.5"
                aria-label="清除时间筛选"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
          {filters.account && (
            <Badge variant="secondary" className="gap-1">
              账户: {filters.account.split(':').pop()}
              <button 
                onClick={() => handleClearSingle('account')}
                className="ml-1 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded p-0.5"
                aria-label="清除账户筛选"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
          {filters.filter && (
            <Badge variant="secondary" className="gap-1">
              <Filter className="h-3 w-3" />
              {filters.filter}
              <button 
                onClick={() => handleClearSingle('filter')}
                className="ml-1 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded p-0.5"
                aria-label="清除高级筛选"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-xs text-muted-foreground"
            onClick={handleClear}
          >
            清除全部
          </Button>
        </div>
      )}

      {/* 筛选输入区 - 始终展开 */}
      <div className="flex flex-wrap items-center gap-2 p-2 sm:p-3 bg-card border rounded-lg">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="时间 (如: 2024, 2024-01, month)"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="h-8"
            autoComplete="off"
          />
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Wallet className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <AccountPicker
            accounts={accounts}
            value={accountFilter}
            onChange={(v) => { setAccountFilter(v); }}
            placeholder="选择账户过滤..."
            className="flex-1"
          />
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="高级过滤 (payee, tag...)"
            value={advancedFilter}
            onChange={(e) => setAdvancedFilter(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            className="h-8"
            autoComplete="off"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button size="sm" onClick={applyFilters} className="w-full sm:w-auto">
            应用
          </Button>
        </div>
      </div>
    </div>
  );
}
