import { useState, useEffect, useCallback } from 'react';
import { useAIStore } from '@/stores/ai';
import { useLedgerStore } from '@/stores/ledger';
import { generateInsights } from '@/lib/ai';
import type { FinancialSummary, Insight } from '@/lib/ai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const CACHE_KEY = 'dazzle-ai-insights';

interface AIInsightCardProps {
  financialData: FinancialSummary;
}

export function AIInsightCard({ financialData }: AIInsightCardProps) {
  const { isConfigured, getEffectiveConfig } = useAIStore();
  const ledgerData = useLedgerStore((s) => s.ledgerData);

  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(
    async (useCache: boolean) => {
      if (useCache) {
        try {
          const cached = sessionStorage.getItem(CACHE_KEY);
          if (cached) {
            setInsights(JSON.parse(cached) as Insight[]);
            return;
          }
        } catch {
          // ignore parse errors
        }
      }

      if (!ledgerData) return;

      setLoading(true);
      setError(null);
      try {
        const config = getEffectiveConfig();
        const result = await generateInsights(financialData, ledgerData, config);
        setInsights(result);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(result));
      } catch (e) {
        setError(e instanceof Error ? e.message : '生成洞察失败');
      } finally {
        setLoading(false);
      }
    },
    [financialData, ledgerData, getEffectiveConfig],
  );

  useEffect(() => {
    if (!isConfigured() || !ledgerData) return;
    fetchInsights(true);
  }, [isConfigured, ledgerData, fetchInsights]);

  if (!isConfigured()) return null;

  const handleRefresh = () => {
    sessionStorage.removeItem(CACHE_KEY);
    fetchInsights(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold">
          <Lightbulb className="mr-2 inline-block h-4 w-4" aria-hidden="true" />
          AI 洞察
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          aria-label="刷新 AI 洞察"
        >
          <RefreshCw
            className={cn('mr-1 h-3.5 w-3.5', loading && 'animate-spin')}
            aria-hidden="true"
          />
          刷新
        </Button>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            正在生成洞察…
          </div>
        )}

        {error && !loading && (
          <div className="space-y-2 py-4 text-center text-sm text-destructive">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              重试
            </Button>
          </div>
        )}

        {!loading && !error && insights.length > 0 && (
          <ul className="space-y-3">
            {insights.map((insight, i) => (
              <li key={i} className="text-sm leading-relaxed">
                <span className="mr-2">{insight.icon}</span>
                {insight.text}
              </li>
            ))}
          </ul>
        )}

        {!loading && !error && insights.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            暂无洞察
          </p>
        )}
      </CardContent>
    </Card>
  );
}
