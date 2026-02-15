import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLedgerStore } from '@/stores/ledger';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { QueryResult } from '@/types';

function QueryTable({ result, className }: { result: QueryResult; className?: string }) {
  if (result.t === 'string') {
    return <pre className="text-sm whitespace-pre-wrap">{result.contents}</pre>;
  }

  const headers = result.types.map(t => t.name);

  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {headers.map((h, i) => (
                <th key={i} className="text-left py-2 px-3 font-medium text-muted-foreground text-xs uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                {(row as unknown[]).map((cell, j) => {
                  const dtype = result.types[j]?.dtype;
                  const cellStr = formatCell(cell, dtype);
                  const isNumeric = dtype === 'Decimal' || dtype === 'int';
                  const isInventory = dtype === 'Inventory' || dtype === 'Position' || dtype === 'Amount';
                  return (
                    <td
                      key={j}
                      className={
                        `py-2 px-3 whitespace-nowrap ${
                          isNumeric || isInventory ? 'font-mono text-right' : ''
                        } ${dtype === 'date' ? 'text-muted-foreground text-xs' : ''}`
                      }
                    >
                      {cellStr}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatCell(cell: unknown, _dtype: string): string {
  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'object' && !Array.isArray(cell)) {
    const entries = Object.entries(cell as Record<string, unknown>);
    if (entries.length === 0) return '';
    return entries
      .map(([currency, amount]) => {
        const num = typeof amount === 'number' ? amount : Number(amount);
        if (isNaN(num)) return `${amount} ${currency}`;
        return `${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
      })
      .join('\n');
  }
  if (typeof cell === 'number') {
    return cell.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return String(cell);
}

export function TagAnalysis() {
  const ledgerData = useLedgerStore((state) => state.ledgerData);
  const filters = useLedgerStore((state) => state.filters);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const tags = ledgerData?.tags || [];
  const filteredTags = tags.filter(t =>
    t.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 构建 BQL 查询条件
  const buildWhereClause = () => {
    const conditions: string[] = [`'${selectedTag}' IN tags`];
    if (filters.time) {
      conditions.push(`year >= ${filters.time.split('-')[0]}`);
    }
    if (filters.account) {
      conditions.push(`account ~ '${filters.account}'`);
    }
    if (filters.filter) {
      // 简单处理 filter 条件，支持 payee 和 narration 过滤
      if (filters.filter.includes('payee:')) {
        const payee = filters.filter.replace('payee:', '').trim();
        conditions.push(`payee = '${payee}'`);
      }
    }
    return conditions.join(' AND ');
  };

  const { data: tagData, isLoading } = useQuery({
    queryKey: ['tagQuery', selectedTag, filters],
    queryFn: () => api.getQuery(
      `SELECT date, payee, narration, account, position WHERE ${buildWhereClause()} ORDER BY date DESC`
    ),
    enabled: !!selectedTag,
  });

  const { data: tagSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['tagSummary', selectedTag, filters],
    queryFn: () => api.getQuery(
      `SELECT account, sum(position) as total WHERE ${buildWhereClause()} GROUP BY account ORDER BY sum(position) DESC`
    ),
    enabled: !!selectedTag,
  });

  const transactionCount = tagData && tagData.t === 'table' ? tagData.rows.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">标签分析</h1>
        <p className="text-muted-foreground text-sm mt-1">按标签查看交易汇总（如旅行、项目等）</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Tag list */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">标签列表</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索标签..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
            <div className="max-h-[60vh] overflow-y-auto space-y-0.5">
              {filteredTags.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  {tags.length === 0 ? '账本中暂无标签' : '无匹配标签'}
                </p>
              )}
              {filteredTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? 'default' : 'ghost'}
                  size="sm"
                  className="w-full justify-start text-sm h-8"
                  onClick={() => setSelectedTag(tag)}
                >
                  <Tag className="h-3 w-3 mr-2 shrink-0" />
                  <span className="truncate">{tag}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tag detail */}
        <div className="lg:col-span-3 space-y-4">
          {!selectedTag && (
            <Card>
              <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Tag className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>选择一个标签查看详情</p>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedTag && (
            <>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-base px-3 py-1">
                  #{selectedTag}
                </Badge>
                {!isLoading && (
                  <span className="text-sm text-muted-foreground">{transactionCount} 条交易</span>
                )}
              </div>

              {/* Summary */}
              {summaryLoading ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </CardContent>
                </Card>
              ) : tagSummary && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">账户汇总</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QueryTable result={tagSummary} />
                  </CardContent>
                </Card>
              )}

              {/* Transactions */}
              {isLoading ? (
                <Card>
                  <CardContent className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </CardContent>
                </Card>
              ) : tagData && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">交易明细</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <QueryTable result={tagData} />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
