import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookText, Plus, ArrowRight, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';

import type { LedgerData } from '@/types';

interface LedgerInfo {
  slug: string;
  title: string;
  isCurrent: boolean;
  data?: LedgerData;
  error?: string;
}

export function LedgerList() {
  const navigate = useNavigate();
  const [ledgers, setLedgers] = useState<LedgerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 尝试获取第一个可用的账本数据来发现所有账本
    const discoverLedgers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 首先尝试获取默认账本列表
        // Fava 的 API 结构是 /{ledger_slug}/api/ledger_data
        // 我们需要先知道有哪些账本可用
        
        // 尝试从 localStorage 获取已知的账本列表
        const savedLedgers = localStorage.getItem('fava_ledgers');
        let knownLedgers: string[] = [];
        
        if (savedLedgers) {
          try {
            knownLedgers = JSON.parse(savedLedgers);
          } catch {
            // ignore
          }
        }
        
        // 如果没有已知的账本，尝试一些常见的默认名称
        if (knownLedgers.length === 0) {
          // 尝试从环境变量或配置文件读取默认账本
          const envDefault = import.meta.env.VITE_DEFAULT_LEDGER;
          if (envDefault) {
            knownLedgers = [envDefault];
          } else {
            // 尝试一些通用的默认名称
            knownLedgers = ['main', 'default', 'ledger', 'primary'];
          }
        }
        
        const ledgerInfos: LedgerInfo[] = [];
        
        // 尝试获取每个账本的数据
        for (const slug of knownLedgers) {
          try {
            const response = await fetch(`/${slug}/api/ledger_data`);
            if (response.ok) {
              const result = await response.json();
              const data = result.data as LedgerData;
              
              // 添加当前账本
              ledgerInfos.push({
                slug,
                title: data.options.title || slug,
                isCurrent: true,
                data,
              });
              
              // 添加其他账本
              if (data.other_ledgers) {
                data.other_ledgers.forEach(([otherSlug, title]) => {
                  if (!ledgerInfos.find(l => l.slug === otherSlug)) {
                    ledgerInfos.push({
                      slug: otherSlug,
                      title,
                      isCurrent: false,
                    });
                  }
                });
              }
              
              // 保存发现的账本列表
              const allSlugs = ledgerInfos.map(l => l.slug);
              localStorage.setItem('fava_ledgers', JSON.stringify(allSlugs));
              
              break; // 成功获取到一个账本数据即可
            }
          } catch {
            // 继续尝试下一个
          }
        }
        
        if (ledgerInfos.length === 0) {
          setError('无法发现可用的账本。请确保 Fava 服务正在运行，并且至少有一个账本已加载。');
        } else {
          setLedgers(ledgerInfos);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setLoading(false);
      }
    };

    discoverLedgers();
  }, []);

  const handleSelectLedger = (slug: string) => {
    navigate(`/${slug}/`);
  };

  const handleManualAdd = () => {
    const slug = prompt('请输入账本标识符（slug）：\n例如：如果账本 URL 是 /my-ledger/，则输入 my-ledger');
    if (slug && slug.trim()) {
      const trimmedSlug = slug.trim();
      // 保存到 localStorage
      const savedLedgers = localStorage.getItem('fava_ledgers');
      let knownLedgers: string[] = [];
      if (savedLedgers) {
        try {
          knownLedgers = JSON.parse(savedLedgers);
        } catch {
          // ignore
        }
      }
      if (!knownLedgers.includes(trimmedSlug)) {
        knownLedgers.push(trimmedSlug);
        localStorage.setItem('fava_ledgers', JSON.stringify(knownLedgers));
      }
      navigate(`/${trimmedSlug}/`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">正在发现账本...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">F</span>
            </div>
            <span className="font-semibold">Fava UI</span>
          </div>
          <ThemeToggle />
        </header>
        
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h2 className="text-lg font-semibold mb-2">无法连接到 Fava</h2>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => window.location.reload()}>
                  重试
                </Button>
                <Button variant="outline" onClick={handleManualAdd}>
                  手动添加账本
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b bg-card flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">F</span>
          </div>
          <span className="font-semibold">Fava UI</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main content */}
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Title */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">选择账本</h1>
              <p className="text-muted-foreground mt-1">
                选择一个账本开始管理您的财务数据
              </p>
            </div>
            <Button variant="outline" onClick={handleManualAdd}>
              <Plus className="h-4 w-4 mr-2" />
              添加账本
            </Button>
          </div>

          {/* Ledger grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ledgers.map((ledger) => (
              <Card
                key={ledger.slug}
                className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
                onClick={() => handleSelectLedger(ledger.slug)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookText className="h-5 w-5 text-primary" />
                    </div>
                    {ledger.isCurrent && (
                      <Badge variant="secondary" className="text-xs">
                        当前
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-3 line-clamp-1">
                    {ledger.title}
                  </CardTitle>
                  <CardDescription className="text-xs font-mono">
                    /{ledger.slug}/
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {ledger.data ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-muted-foreground">
                        <span>账户</span>
                        <span className="font-medium text-foreground">
                          {ledger.data.accounts.length}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>货币</span>
                        <span className="font-medium text-foreground">
                          {ledger.data.currencies.length}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>年份</span>
                        <span className="font-medium text-foreground">
                          {ledger.data.years.length > 0 
                            ? `${ledger.data.years[0]} - ${ledger.data.years[ledger.data.years.length - 1]}`
                            : '-'}
                        </span>
                      </div>
                      {ledger.data.errors.length > 0 && (
                        <div className="flex justify-between">
                          <span className="text-destructive">错误</span>
                          <Badge variant="destructive" className="text-xs">
                            {ledger.data.errors.length}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      点击加载账本详情
                    </p>
                  )}
                  <Button 
                    variant="ghost" 
                    className="w-full mt-4 opacity-0 group-hover:opacity-100 transition-opacity"
                    size="sm"
                  >
                    进入账本
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Help text */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <strong className="text-foreground">提示：</strong>
                    账本由 Fava 后端服务提供。如果您没有看到预期的账本，请确保在启动 Fava 时指定了正确的账本文件路径。
                  </p>
                  <p>
                    例如：<code className="bg-muted px-1 py-0.5 rounded text-xs">fava file1.beancount file2.beancount</code>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
