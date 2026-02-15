export interface BeancountError {
  type: string;
  message: string;
  source: {
    filename: string;
    lineno: number;
  } | null;
}

export interface AccountDetail {
  balance_string?: string;
  close_date?: string;
  last_entry?: { date: string; entry_hash: string };
  uptodate_status?: 'green' | 'yellow' | 'red';
}

export interface FavaOptions {
  auto_reload: boolean;
  currency_column: number;
  conversion_currencies: string[];
  collapse_pattern: string[];
  import_config?: string;
  indent: number;
  invert_gains_losses_colors: boolean;
  invert_income_liabilities_equity: boolean;
  show_closed_accounts: boolean;
  show_accounts_with_zero_balance: boolean;
  show_accounts_with_zero_transactions: boolean;
  locale?: string;
  uptodate_indicator_grey_lookback_days: number;
  insert_entry: Array<{
    date: string;
    filename: string;
    lineno: number;
    re: string;
  }>;
  use_external_editor: boolean;
}

export interface BeancountOptions {
  documents: string[];
  filename: string;
  include: string[];
  name_assets: string;
  name_equity: string;
  name_expenses: string;
  name_income: string;
  name_liabilities: string;
  operating_currency: string[];
  title: string;
}

export interface Extension {
  name: string;
  report_title?: string;
  has_js_module: boolean;
}

export interface LedgerData {
  account_details: Record<string, AccountDetail>;
  accounts: string[];
  base_url: string;
  currencies: string[];
  currency_names: Record<string, string>;
  errors: BeancountError[];
  extensions: Extension[];
  fava_options: FavaOptions;
  have_excel: boolean;
  incognito: boolean;
  links: string[];
  options: BeancountOptions;
  other_ledgers: Array<[string, string]>;
  payees: string[];
  precisions: Record<string, number>;
  sidebar_links: Array<[string, string]>;
  tags: string[];
  upcoming_events_count: number;
  user_queries: Array<{ name: string; query_string: string }>;
  years: string[];
}

export interface DateRange {
  begin: string;
  end: string;
}

export interface AccountTreeNode {
  account: string;
  balance: Record<string, number>;
  balance_children: Record<string, number>;
  cost: Record<string, number> | null;
  cost_children: Record<string, number> | null;
  has_txns: boolean;
  children: AccountTreeNode[];
}

export interface BalancesChartData {
  type: 'balances';
  label: string | null;
  data: Array<{
    date: string;
    balance: Record<string, number>;
  }>;
}

export interface BarChartData {
  type: 'bar';
  label: string | null;
  data: Array<{
    date: string;
    balance: Record<string, number>;
    budgets: Record<string, number>;
  }>;
}

export interface HierarchyChartData {
  type: 'hierarchy';
  label: string | null;
  data: AccountTreeNode;
}

export type ChartData = BalancesChartData | BarChartData | HierarchyChartData;

export interface TreeReport {
  charts: ChartData[];
  trees: AccountTreeNode[];
  date_range?: DateRange;
}

export interface JournalEntry {
  type: string;
  date: string;
  flag?: string;
  payee?: string;
  narration?: string;
  tags?: string[];
  links?: string[];
  meta: Record<string, unknown>;
  entry_hash: string;
  postings?: Array<{
    account: string;
    amount: string;
    currency: string;
  }>;
}

export interface JournalPage {
  journal: string;
  total_pages: number;
}

export interface Filters {
  account?: string;
  filter?: string;
  time?: string;
  conversion?: string;
  interval?: string;
}

export interface QueryResultTable {
  t: 'table';
  types: Array<{ name: string; dtype: string }>;
  rows: unknown[][];
}

export interface QueryResultText {
  t: 'string';
  contents: string;
}

export type QueryResult = QueryResultTable | QueryResultText;

export interface TransactionEntry {
  type: 'Transaction';
  date: string;
  flag: string;
  payee?: string;
  narration: string;
  tags?: string[];
  links?: string[];
  meta: Record<string, unknown>;
  postings: Array<{
    account: string;
    amount: string;
    currency: string;
  }>;
}
