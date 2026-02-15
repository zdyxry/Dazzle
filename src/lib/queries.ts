export function queryExpensesByCategory(timeFilter?: string): string {
  const where = timeFilter ? ` WHERE date >= ${timeFilter}` : '';
  return `SELECT account, sum(position) as total${where} GROUP BY account ORDER BY sum(position) DESC`;
}

export function queryByTag(tag: string): string {
  return `SELECT date, payee, narration, account, position WHERE '${tag}' IN tags ORDER BY date DESC`;
}

export function queryByPayee(payee: string): string {
  return `SELECT date, narration, account, position WHERE payee = '${payee}' ORDER BY date DESC`;
}

export function queryTagSummary(tag: string): string {
  return `SELECT account, sum(position) as total WHERE '${tag}' IN tags GROUP BY account ORDER BY sum(position) DESC`;
}
