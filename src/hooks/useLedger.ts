import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useLedgerStore } from '@/stores/ledger';

// 获取账本数据
export function useLedgerData() {
  const setLedgerData = useLedgerStore((state) => state.setLedgerData);
  
  const query = useQuery({
    queryKey: ['ledgerData'],
    queryFn: api.getLedgerData,
    staleTime: 5000,
  });
  
  useEffect(() => {
    if (query.data) {
      setLedgerData(query.data);
    }
  }, [query.data, setLedgerData]);
  
  return query;
}

// 获取资产负债表
export function useBalanceSheet() {
  const filters = useLedgerStore((state) => state.filters);
  
  return useQuery({
    queryKey: ['balanceSheet', filters],
    queryFn: () => api.getBalanceSheet(filters),
    staleTime: 5000,
  });
}

// 获取损益表
export function useIncomeStatement() {
  const filters = useLedgerStore((state) => state.filters);
  
  return useQuery({
    queryKey: ['incomeStatement', filters],
    queryFn: () => api.getIncomeStatement(filters),
    staleTime: 5000,
  });
}

// 获取试算平衡表
export function useTrialBalance() {
  const filters = useLedgerStore((state) => state.filters);
  
  return useQuery({
    queryKey: ['trialBalance', filters],
    queryFn: () => api.getTrialBalance(filters),
    staleTime: 5000,
  });
}

// 获取日记账
export function useJournalPage(page = 1, order: 'asc' | 'desc' = 'desc') {
  const filters = useLedgerStore((state) => state.filters);
  
  return useQuery({
    queryKey: ['journal', filters, page, order],
    queryFn: () => api.getJournalPage({ ...filters, page, order }),
    staleTime: 5000,
  });
}

// 轮询文件变化
export function usePollChanges(interval = 5000) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const changed = await api.getChanged();
        if (changed) {
          // 文件变化了，刷新所有查询
          queryClient.invalidateQueries();
        }
      } catch (error) {
        console.error('Failed to check for changes:', error);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [queryClient, interval]);
}
