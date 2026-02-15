import { useState } from 'react';
import { useJournalPage } from '@/hooks/useLedger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export function Journal() {
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const { data, isLoading, error } = useJournalPage(page, order);
  
  const totalPages = data?.total_pages || 1;
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-destructive">
        加载失败: {error.message}
      </div>
    );
  }
  
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">交易流水</h1>
          <p className="text-muted-foreground text-sm mt-1">
            查看所有交易记录
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
          className="shrink-0"
        >
          {order === 'asc' ? '最早优先' : '最新优先'}
        </Button>
      </div>
      
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 px-3 sm:px-6">
          <CardTitle className="text-base font-medium">交易记录</CardTitle>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* 日记账内容 - 使用 HTML 渲染 */}
              <div
                className="journal max-w-none overflow-x-auto px-2 sm:px-0"
                dangerouslySetInnerHTML={{ __html: data?.journal || '' }}
              />
              
              {/* 分页 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    aria-label="上一页"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    第 {page} 页，共 {totalPages} 页
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    aria-label="下一页"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
