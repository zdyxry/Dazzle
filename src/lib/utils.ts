import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 格式化数字
export function formatNumber(num: number, precision = 2): string {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(num);
}

// 格式化货币金额
export function formatCurrency(amount: number, currency?: string): string {
  if (currency) {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency,
    }).format(amount);
  }
  return new Intl.NumberFormat('zh-CN').format(amount);
}

// 格式化日期
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

// 计算账户层级
export function getAccountLevel(account: string): number {
  return account.split(':').length;
}

// 获取账户短名称
export function getShortAccountName(account: string): string {
  const parts = account.split(':');
  return parts[parts.length - 1];
}

// 计算树的总余额
export function calculateTreeBalance(
  node: { balance: Record<string, number>; children: unknown[] },
  currency: string
): number {
  const directBalance = node.balance[currency] || 0;
  return directBalance;
}
