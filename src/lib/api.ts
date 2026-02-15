import type { LedgerData, TreeReport, JournalPage, JournalEntry, Filters, QueryResult, TransactionEntry } from '@/types';

// 默认账本 slug，从 localStorage 读取或使用空字符串
const getDefaultLedgerSlug = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('fava_current_ledger');
    if (saved) return saved;
  }
  return '';
};

let currentLedgerSlug = getDefaultLedgerSlug();

export function setCurrentLedger(slug: string) {
  currentLedgerSlug = slug;
  // 保存到 localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('fava_current_ledger', slug);
  }
}

export function getCurrentLedger(): string {
  return currentLedgerSlug;
}

function buildUrl(endpoint: string, params?: Record<string, string | number | undefined>): string {
  const url = new URL(`/${currentLedgerSlug}/api/${endpoint}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.data as T;
}

async function putApi<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }
  const data = await response.json();
  return data.data as T;
}

export const api = {
  getLedgerData: (): Promise<LedgerData> => {
    return fetchApi<LedgerData>(buildUrl('ledger_data'));
  },

  getChanged: (): Promise<boolean> => {
    return fetchApi<boolean>(buildUrl('changed'));
  },

  getErrors: (): Promise<Array<{ type: string; message: string; source: unknown }>> => {
    return fetchApi(buildUrl('errors'));
  },

  getBalanceSheet: (filters: Filters = {}): Promise<TreeReport> => {
    return fetchApi<TreeReport>(buildUrl('balance_sheet', {
      account: filters.account,
      filter: filters.filter,
      time: filters.time,
      conversion: filters.conversion,
      interval: filters.interval,
    }));
  },

  getIncomeStatement: (filters: Filters = {}): Promise<TreeReport> => {
    return fetchApi<TreeReport>(buildUrl('income_statement', {
      account: filters.account,
      filter: filters.filter,
      time: filters.time,
      conversion: filters.conversion,
      interval: filters.interval,
    }));
  },

  getTrialBalance: (filters: Filters = {}): Promise<TreeReport> => {
    return fetchApi<TreeReport>(buildUrl('trial_balance', {
      account: filters.account,
      filter: filters.filter,
      time: filters.time,
      conversion: filters.conversion,
      interval: filters.interval,
    }));
  },

  getJournalPage: (filters: Filters & { page?: number; order?: 'asc' | 'desc' } = {}): Promise<JournalPage> => {
    return fetchApi<JournalPage>(buildUrl('journal_page', {
      account: filters.account,
      filter: filters.filter,
      time: filters.time,
      conversion: filters.conversion,
      interval: filters.interval,
      page: filters.page,
      order: filters.order,
    }));
  },

  getJournal: (filters: Filters = {}): Promise<JournalEntry[]> => {
    return fetchApi<JournalEntry[]>(buildUrl('journal', {
      account: filters.account,
      filter: filters.filter,
      time: filters.time,
      conversion: filters.conversion,
      interval: filters.interval,
    }));
  },

  getAccountReport: (account: string, subreport?: string, filters: Filters = {}): Promise<unknown> => {
    return fetchApi(buildUrl('account_report', {
      account: filters.account,
      filter: filters.filter,
      time: filters.time,
      conversion: filters.conversion,
      interval: filters.interval,
      a: account,
      r: subreport,
    }));
  },

  getQuery: (queryString: string): Promise<QueryResult> => {
    return fetchApi<QueryResult>(buildUrl('query', { query_string: queryString }));
  },

  getPayeeAccounts: (payee: string): Promise<string[]> => {
    return fetchApi<string[]>(buildUrl('payee_accounts', { payee }));
  },

  getPayeeTransaction: (payee: string): Promise<TransactionEntry | null> => {
    return fetchApi<TransactionEntry | null>(buildUrl('payee_transaction', { payee }));
  },

  getNarrations: (): Promise<string[]> => {
    return fetchApi<string[]>(buildUrl('narrations'));
  },

  addEntries: (entries: TransactionEntry[]): Promise<string> => {
    return putApi<string>(buildUrl('add_entries'), { entries });
  },

  getEvents: (): Promise<JournalEntry[]> => {
    return fetchApi<JournalEntry[]>(buildUrl('events'));
  },

  getOptions: (): Promise<{ fava_options: Record<string, unknown>; beancount_options: Record<string, unknown> }> => {
    return fetchApi(buildUrl('options'));
  },
};

export function formatAmount(amount: number, currency: string, precision = 2): string {
  try {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(amount);
  } catch {
    return `${amount.toFixed(precision)} ${currency}`;
  }
}

export function formatNumber(num: number, precision = 2): string {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(num);
}
