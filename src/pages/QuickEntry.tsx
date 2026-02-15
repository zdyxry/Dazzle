import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLedgerStore } from '@/stores/ledger';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X, Check, Clock } from 'lucide-react';
import { AccountPicker } from '@/components/AccountPicker';

interface Posting {
  account: string;
  amount: string;
  currency: string;
}

const RECENT_ACCOUNTS_KEY = 'dazzle-recent-accounts';
const MAX_RECENT = 8;

function getRecentAccounts(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_ACCOUNTS_KEY) || '[]');
  } catch {
    return [];
  }
}

function addRecentAccount(account: string) {
  const recent = getRecentAccounts().filter(a => a !== account);
  recent.unshift(account);
  localStorage.setItem(RECENT_ACCOUNTS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
}

function getPostingLabel(account: string, index: number, total: number): { text: string; color: string; placeholder: string } {
  const prefix = account.split(':')[0]?.toLowerCase() || '';
  if (prefix === 'expenses' || prefix === '支出') {
    return { text: '支出', color: 'text-red-500', placeholder: '支出分类...' };
  }
  if (prefix === 'income' || prefix === '收入') {
    return { text: '收入', color: 'text-emerald-600', placeholder: '收入来源...' };
  }
  if (prefix === 'assets' || prefix === '资产') {
    return { text: '资产', color: 'text-blue-600', placeholder: '资产账户...' };
  }
  if (prefix === 'liabilities' || prefix === '负债') {
    return { text: '负债', color: 'text-orange-500', placeholder: '负债账户...' };
  }
  if (prefix === 'equity' || prefix === '权益') {
    return { text: '权益', color: 'text-purple-500', placeholder: '权益账户...' };
  }
  if (total === 2) {
    return index === 0
      ? { text: '支出/转入', color: 'text-muted-foreground', placeholder: '选择去向账户...' }
      : { text: '付款/转出', color: 'text-muted-foreground', placeholder: '选择来源账户...' };
  }
  return { text: `行 ${index + 1}`, color: 'text-muted-foreground', placeholder: '选择账户...' };
}

export function QuickEntry() {
  const ledgerData = useLedgerStore((state) => state.ledgerData);
  const queryClient = useQueryClient();
  const currency = ledgerData?.options.operating_currency?.[0] || 'CNY';
  const accounts = ledgerData?.accounts || [];
  const payees = ledgerData?.payees || [];
  const tags = ledgerData?.tags || [];

  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [payee, setPayee] = useState('');
  const [narration, setNarration] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagSearch, setTagSearch] = useState('');
  const [postings, setPostings] = useState<Posting[]>([
    { account: '', amount: '', currency },
    { account: '', amount: '', currency },
  ]);
  const [payeeSearch, setPayeeSearch] = useState('');
  const [showPayeeDropdown, setShowPayeeDropdown] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recentAccounts, setRecentAccounts] = useState<string[]>(getRecentAccounts);

  const { data: payeeAccounts } = useQuery({
    queryKey: ['payeeAccounts', payee],
    queryFn: () => api.getPayeeAccounts(payee),
    enabled: payee.length > 0,
  });

  const { data: lastTransaction } = useQuery({
    queryKey: ['payeeTransaction', payee],
    queryFn: () => api.getPayeeTransaction(payee),
    enabled: payee.length > 0,
  });

  useEffect(() => {
    if (lastTransaction && lastTransaction.postings && lastTransaction.postings.length >= 2) {
      const newPostings = lastTransaction.postings.map((p: { account: string; amount: string; currency: string }) => ({
        account: p.account,
        amount: '',
        currency: p.currency || currency,
      }));
      setPostings(newPostings);
      if (lastTransaction.narration) {
        setNarration(lastTransaction.narration);
      }
    }
  }, [lastTransaction, currency]);

  const mutation = useMutation({
    mutationFn: (entry: unknown) => api.addEntries([entry as never]),
    onSuccess: () => {
      postings.forEach(p => {
        if (p.account) addRecentAccount(p.account);
      });
      setRecentAccounts(getRecentAccounts());

      setSuccess(true);
      setPayee('');
      setPayeeSearch('');
      setNarration('');
      setSelectedTags([]);
      setPostings([
        { account: '', amount: '', currency },
        { account: '', amount: '', currency },
      ]);
      queryClient.invalidateQueries();
      setTimeout(() => setSuccess(false), 3000);
    },
  });

  const updatePosting = useCallback((index: number, field: keyof Posting, value: string) => {
    setPostings(prev => {
      const newPostings = [...prev];
      newPostings[index] = { ...newPostings[index], [field]: value };
      return newPostings;
    });
  }, []);

  const addPosting = () => {
    setPostings(prev => [...prev, { account: '', amount: '', currency }]);
  };

  const removePosting = (index: number) => {
    if (postings.length <= 2) return;
    setPostings(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const entry = {
      type: 'Transaction',
      date,
      flag: '*',
      payee: payee || undefined,
      narration,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      meta: {},
      postings: postings.map(p => ({
        account: p.account,
        amount: p.amount || '',
        currency: p.currency,
      })),
    };
    mutation.mutate(entry);
  };

  const filteredPayees = payeeSearch
    ? payees.filter(p => p.toLowerCase().includes(payeeSearch.toLowerCase())).slice(0, 10)
    : [];

  const isValid = narration.trim().length > 0 &&
    postings.every(p => p.account.trim().length > 0) &&
    postings.some(p => p.amount.trim().length > 0);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">快速记账</h1>
        <p className="text-muted-foreground text-sm mt-1">添加新的交易记录</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-400 text-sm">
          <Check className="h-4 w-4" />
          记账成功
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">新建交易</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">日期</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Payee */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">收款方 (Payee)</label>
            <div className="relative">
              <Input
                placeholder="输入或搜索收款方..."
                value={payee}
                onChange={(e) => {
                  setPayee(e.target.value);
                  setPayeeSearch(e.target.value);
                  setShowPayeeDropdown(true);
                }}
                onFocus={() => setShowPayeeDropdown(true)}
                onBlur={() => setTimeout(() => setShowPayeeDropdown(false), 200)}
                className="h-9"
              />
              {showPayeeDropdown && payeeSearch && filteredPayees.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-card border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredPayees.map(p => (
                    <button
                      key={p}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setPayee(p);
                        setPayeeSearch('');
                        setShowPayeeDropdown(false);
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Narration */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">描述 (Narration)</label>
            <Input
              placeholder="交易描述..."
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              className="h-9"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">标签</label>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {selectedTags.map(t => (
                  <Badge key={t} variant="secondary" className="text-xs cursor-pointer" onClick={() => setSelectedTags(prev => prev.filter(x => x !== t))}>
                    #{t} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            )}
            <div className="relative">
              <Input
                placeholder="搜索标签..."
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                className="h-9"
              />
              {tagSearch && (
                <div className="absolute z-50 w-full mt-1 bg-card border rounded-md shadow-lg max-h-32 overflow-y-auto">
                  {tags.filter(t => t.toLowerCase().includes(tagSearch.toLowerCase()) && !selectedTags.includes(t)).slice(0, 8).map(t => (
                    <button
                      key={t}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted"
                      onClick={() => { setSelectedTags(prev => [...prev, t]); setTagSearch(''); }}
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Postings */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">记账行</label>
              <Button variant="ghost" size="sm" onClick={addPosting} className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                添加行
              </Button>
            </div>

            {/* Recent accounts quick access */}
            {recentAccounts.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                {recentAccounts.slice(0, 5).map(a => (
                  <button
                    key={a}
                    className="text-xs px-2 py-0.5 rounded-full border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => {
                      const emptyIdx = postings.findIndex(p => !p.account);
                      if (emptyIdx >= 0) {
                        updatePosting(emptyIdx, 'account', a);
                      }
                    }}
                    title={a}
                  >
                    {a.split(':').slice(-2).join(':')}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-2">
              {postings.map((posting, index) => {
                const label = getPostingLabel(posting.account, index, postings.length);
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium w-16 shrink-0 ${label.color}`}>
                        {label.text}
                      </span>
                      <AccountPicker
                        accounts={accounts}
                        value={posting.account}
                        onChange={(v) => updatePosting(index, 'account', v)}
                        placeholder={label.placeholder}
                        className="flex-1"
                      />
                      <Input
                        placeholder="金额"
                        value={posting.amount}
                        onChange={(e) => updatePosting(index, 'amount', e.target.value)}
                        className="w-28 h-8 text-sm font-mono text-right"
                      />
                      <span className="text-xs text-muted-foreground w-10">{posting.currency}</span>
                      {postings.length > 2 && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removePosting(index)}>
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {payeeAccounts && payeeAccounts.length > 0 && !postings.some(p => p.account) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                推荐: {payeeAccounts.slice(0, 3).map(a => (
                  <button
                    key={a}
                    className="underline hover:text-primary"
                    onClick={() => {
                      const emptyIdx = postings.findIndex(p => !p.account);
                      if (emptyIdx >= 0) updatePosting(emptyIdx, 'account', a);
                    }}
                  >
                    {a.split(':').slice(-2).join(':')}
                  </button>
                ))}
              </p>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!isValid || mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />提交中...</>
            ) : (
              '提交交易'
            )}
          </Button>

          {mutation.isError && (
            <p className="text-sm text-destructive">
              提交失败: {mutation.error?.message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
