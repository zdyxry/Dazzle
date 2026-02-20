import { useState, useEffect } from 'react';
import { useLedgerStore } from '@/stores/ledger';
import { useAIStore } from '@/stores/ai';
import { generateBQL, validateBQL } from '@/lib/ai';
import { api } from '@/lib/api';
import type { QueryResult } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Play, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SmartQuery() {
  const ledgerData = useLedgerStore((state) => state.ledgerData);
  const { isConfigured, getEffectiveConfig } = useAIStore();

  const [question, setQuestion] = useState('');
  const [bql, setBql] = useState('');
  const [generating, setGenerating] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bqlValidation, setBqlValidation] = useState<{ safe: boolean; reason?: string } | null>(null);

  useEffect(() => {
    if (bql.trim()) {
      setBqlValidation(validateBQL(bql));
    } else {
      setBqlValidation(null);
    }
  }, [bql]);

  const handleGenerate = async () => {
    if (!question.trim() || !ledgerData) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const config = getEffectiveConfig();
      const generated = await generateBQL(question, ledgerData, config);
      setBql(generated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'BQL 生成失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleExecute = async () => {
    if (!bql.trim() || !bqlValidation?.safe) return;
    setExecuting(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.getQuery(bql);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : '查询执行失败');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">智能查询</h1>
        <p className="text-muted-foreground text-sm mt-1">
          用自然语言描述你的查询需求，AI 将生成对应的 BQL 查询语句
        </p>
      </div>

      {!isConfigured() && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          AI 功能未配置，请前往
          <a href="settings" className="underline font-medium">
            设置页面
          </a>
          配置 API 密钥
        </div>
      )}

      {isConfigured() && (
        <>
          {/* Query input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                自然语言查询
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="例如：今年每月支出汇总、最近10笔餐饮消费..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                  className="flex-1"
                  disabled={generating}
                />
                <Button
                  onClick={handleGenerate}
                  disabled={generating || !question.trim()}
                  size="icon"
                >
                  {generating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Generated BQL */}
          {bql && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">生成的 BQL 查询</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <textarea
                  value={bql}
                  onChange={(e) => setBql(e.target.value)}
                  rows={4}
                  className={cn(
                    'w-full rounded-md border bg-muted px-3 py-2 font-mono text-sm',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    'resize-y',
                  )}
                />

                {bqlValidation && !bqlValidation.safe && (
                  <div className="flex items-center gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    {bqlValidation.reason}
                  </div>
                )}

                <Button
                  onClick={handleExecute}
                  disabled={executing || !bqlValidation?.safe}
                  className="gap-2"
                >
                  {executing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  执行查询
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">查询结果</CardTitle>
          </CardHeader>
          <CardContent>
            {result.t === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {result.types.map((col) => (
                        <th
                          key={col.name}
                          className="px-3 py-2 text-left font-medium text-muted-foreground"
                        >
                          {col.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, i) => (
                      <tr
                        key={i}
                        className={cn(
                          'border-b last:border-0',
                          i % 2 === 0 ? 'bg-transparent' : 'bg-muted/50',
                        )}
                      >
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 font-mono text-xs">
                            {cell == null ? '' : String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {result.rows.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-4">
                    无结果
                  </p>
                )}
              </div>
            ) : (
              <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 font-mono text-sm">
                {result.contents}
              </pre>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
