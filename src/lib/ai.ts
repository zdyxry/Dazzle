import type { AIConfig } from '@/stores/ai';
import type { LedgerData } from '@/types';

// ── Interfaces ──────────────────────────────────────────────

export interface ParsedEntry {
  date: string;
  payee: string | null;
  narration: string;
  tags: string[];
  postings: Array<{ account: string; amount: string; currency: string }>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  entry: ParsedEntry;
}

export interface FinancialSummary {
  netWorth: number;
  totalAssets: number;
  totalLiabilities: number;
  totalIncome: number;
  totalExpenses: number;
  surplus: number;
  currency: string;
  monthlyTrend: Array<{ month: string; income: number; expense: number }>;
  topExpenseCategories: Array<{ category: string; amount: number }>;
}

export interface Insight {
  icon: string;
  text: string;
}

// ── Core API ────────────────────────────────────────────────

export async function chatCompletion(
  messages: Array<{ role: 'system' | 'user'; content: string }>,
  config: AIConfig,
  options?: { temperature?: number },
): Promise<string> {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: options?.temperature ?? 0.3,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `AI 请求失败 (${response.status}): ${text || response.statusText}`,
    );
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:json|jsonc)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
}

// ── Helpers ─────────────────────────────────────────────────

function deduplicateByPrefix(accounts: string[], levels: number): string[] {
  const seen = new Set<string>();
  for (const account of accounts) {
    const prefix = account.split(':').slice(0, levels).join(':');
    seen.add(prefix);
  }
  return Array.from(seen).sort();
}

export function buildLedgerContext(
  ledgerData: LedgerData,
  feature: 'entry' | 'query' | 'insight',
): string {
  const sections: string[] = [];

  sections.push(
    `主要货币: ${ledgerData.options.operating_currency.join(', ')}`,
  );

  const accounts =
    feature === 'entry'
      ? ledgerData.accounts
      : deduplicateByPrefix(ledgerData.accounts, 2);
  sections.push(`可用账户:\n${accounts.join('\n')}`);

  if (feature === 'entry') {
    sections.push(`可用收款方:\n${ledgerData.payees.join(', ')}`);
  }

  sections.push(`可用标签: ${ledgerData.tags.join(', ')}`);
  sections.push(`可用货币: ${ledgerData.currencies.join(', ')}`);

  return sections.join('\n\n');
}

export function resolveDate(llmDate: string, clientDate: string): string {
  const llm = Date.parse(llmDate);
  const client = Date.parse(clientDate);

  if (isNaN(llm)) {
    return clientDate;
  }

  const diffDays = Math.abs(llm - client) / (1000 * 60 * 60 * 24);
  if (diffDays > 365) {
    return clientDate;
  }

  return llmDate;
}

export function validateBQL(bql: string): { safe: boolean; reason?: string } {
  const upper = bql.toUpperCase().trim();

  if (!upper.startsWith('SELECT')) {
    return { safe: false, reason: '仅允许 SELECT 查询' };
  }

  const forbidden = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE'];
  for (const keyword of forbidden) {
    if (new RegExp(`\\b${keyword}\\b`).test(upper)) {
      return { safe: false, reason: `禁止使用 ${keyword} 语句` };
    }
  }

  return { safe: true };
}

// ── Fuzzy matching ──────────────────────────────────────────

function segmentOverlap(a: string, b: string): number {
  const segsA = a.split(':');
  const segsB = b.split(':');
  let overlap = 0;
  for (const seg of segsA) {
    if (segsB.includes(seg)) overlap++;
  }
  return overlap;
}

function findClosestAccount(
  account: string,
  knownAccounts: string[],
): string | null {
  let best: string | null = null;
  let bestScore = 0;
  for (const known of knownAccounts) {
    const score = segmentOverlap(account, known);
    if (score > bestScore) {
      bestScore = score;
      best = known;
    }
  }
  return best;
}

// ── Natural entry parsing ───────────────────────────────────

export async function parseNaturalEntry(
  input: string,
  ledgerData: LedgerData,
  config: AIConfig,
): Promise<ParsedEntry> {
  const clientDate = new Date().toISOString().slice(0, 10);
  const context = buildLedgerContext(ledgerData, 'entry');

  const systemPrompt = `你是一个记账助手，将用户的自然语言描述转换为结构化记账条目。

${context}

当前日期: ${clientDate}

请严格遵守以下约束:
- 账户必须从"可用账户"中选择
- 收款方从"可用收款方"中选择
- 标签从"可用标签"中选择
- 货币默认使用主要货币
- 日期格式为 YYYY-MM-DD

请返回 JSON 格式:
{
  "date": "YYYY-MM-DD",
  "payee": "收款方或null",
  "narration": "描述",
  "tags": ["标签"],
  "postings": [
    { "account": "账户", "amount": "金额", "currency": "货币" }
  ]
}

仅返回 JSON，不要包含其他文字。`;

  const content = await chatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: input },
    ],
    config,
  );

  const parsed: ParsedEntry = JSON.parse(stripCodeFences(content));
  parsed.date = resolveDate(parsed.date, clientDate);
  return parsed;
}

// ── Entry validation ────────────────────────────────────────

export function validateParsedEntry(
  entry: ParsedEntry,
  ledgerData: LedgerData,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const corrected = { ...entry, postings: [...entry.postings] };

  // Validate accounts
  for (let i = 0; i < corrected.postings.length; i++) {
    const posting = corrected.postings[i];
    if (!ledgerData.accounts.includes(posting.account)) {
      const closest = findClosestAccount(posting.account, ledgerData.accounts);
      if (closest) {
        warnings.push(
          `账户 "${posting.account}" 不存在，已修正为 "${closest}"`,
        );
        corrected.postings[i] = { ...posting, account: closest };
      } else {
        errors.push(`账户 "${posting.account}" 不存在`);
      }
    }
  }

  // Validate currencies
  for (let i = 0; i < corrected.postings.length; i++) {
    const posting = corrected.postings[i];
    if (!ledgerData.currencies.includes(posting.currency)) {
      const fallback = ledgerData.options.operating_currency[0];
      warnings.push(
        `货币 "${posting.currency}" 不存在，已修正为 "${fallback}"`,
      );
      corrected.postings[i] = { ...posting, currency: fallback };
    }
  }

  // Warn on unknown payees
  if (
    corrected.payee &&
    !ledgerData.payees.includes(corrected.payee)
  ) {
    warnings.push(`收款方 "${corrected.payee}" 不在已知列表中`);
  }

  // Filter tags
  const knownTags = new Set(ledgerData.tags);
  const originalTags = corrected.tags;
  corrected.tags = originalTags.filter((t) => knownTags.has(t));
  const removed = originalTags.filter((t) => !knownTags.has(t));
  if (removed.length > 0) {
    warnings.push(`已移除未知标签: ${removed.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    entry: corrected,
  };
}

// ── BQL generation ──────────────────────────────────────────

export async function generateBQL(
  question: string,
  ledgerData: LedgerData,
  config: AIConfig,
): Promise<string> {
  const context = buildLedgerContext(ledgerData, 'query');

  const systemPrompt = `你是一个 Beancount 查询助手，将用户的自然语言问题转换为 BQL (Beancount Query Language) 查询。

${context}

BQL 语法要点:
- SELECT 语句查询交易数据
- 常用字段: date, account, payee, narration, position, balance, number, currency
- WHERE 子句过滤条件
- GROUP BY 分组
- ORDER BY 排序
- 支持函数: sum(), count(), year(), month(), day(), root(account, n)
- 账户匹配: account ~ "pattern"

仅返回 BQL 查询语句，不要包含其他文字。`;

  const content = await chatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question },
    ],
    config,
  );

  // Strip markdown code fences
  return content
    .replace(/^```(?:sql|bql)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
}

// ── Insights generation ─────────────────────────────────────

export async function generateInsights(
  financialData: FinancialSummary,
  ledgerData: LedgerData,
  config: AIConfig,
): Promise<Insight[]> {
  const context = buildLedgerContext(ledgerData, 'insight');

  const systemPrompt = `你是一个财务分析助手，根据用户的财务数据提供有价值的洞察。

${context}

请根据以下财务数据，生成 3-5 条财务洞察。

请返回 JSON 数组格式:
[
  { "icon": "emoji图标", "text": "洞察内容" }
]

仅返回 JSON 数组，不要包含其他文字。`;

  const content = await chatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(financialData) },
    ],
    config,
  );

  return JSON.parse(stripCodeFences(content)) as Insight[];
}
