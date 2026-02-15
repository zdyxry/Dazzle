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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">交易流水</h1>
          <p className="text-muted-foreground text-sm mt-1">
            查看所有交易记录
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
        >
          {order === 'asc' ? '最早优先' : '最新优先'}
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">交易记录</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* 日记账内容 - 使用 HTML 渲染 */}
              <div
                className="journal max-w-none overflow-x-auto"
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
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    第 {page} 页，共 {totalPages} 页
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
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
