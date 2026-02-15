import { create } from 'zustand';
import type { LedgerData, Filters } from '@/types';

interface LedgerState {
  // 账本数据
  ledgerData: LedgerData | null;
  setLedgerData: (data: LedgerData) => void;
  
  // 过滤器状态
  filters: Filters;
  setFilter: (key: keyof Filters, value: string | undefined) => void;
  clearFilters: () => void;
  
  // 选中的账户
  selectedAccount: string | null;
  setSelectedAccount: (account: string | null) => void;
  
  // 加载状态
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // 错误
  error: string | null;
  setError: (error: string | null) => void;
}

export const useLedgerStore = create<LedgerState>((set) => ({
  ledgerData: null,
  setLedgerData: (data) => set({ ledgerData: data }),
  
  filters: {},
  setFilter: (key, value) => set((state) => ({
    filters: { ...state.filters, [key]: value }
  })),
  clearFilters: () => set({ filters: {} }),
  
  selectedAccount: null,
  setSelectedAccount: (account) => set({ selectedAccount: account }),
  
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  error: null,
  setError: (error) => set({ error }),
}));
