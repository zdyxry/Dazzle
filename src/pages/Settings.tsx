import { useLedgerStore } from '@/stores/ledger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Sun, Moon, Monitor } from 'lucide-react';


export function Settings() {
  const ledgerData = useLedgerStore((state) => state.ledgerData);
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light' as const, label: '浅色', icon: Sun },
    { value: 'dark' as const, label: '深色', icon: Moon },
    { value: 'system' as const, label: '跟随系统', icon: Monitor },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">设置</h1>
        <p className="text-muted-foreground text-sm mt-1">应用配置</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">主题</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {themes.map(t => (
              <Button
                key={t.value}
                variant={theme === t.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme(t.value)}
                className="gap-2"
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">账本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">标题</span>
            <span className="font-medium">{ledgerData?.options.title || '-'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">主要货币</span>
            <span className="font-mono">{ledgerData?.options.operating_currency?.join(', ') || '-'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">账户数量</span>
            <span>{ledgerData?.accounts.length || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">货币数量</span>
            <span>{ledgerData?.currencies.length || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">收款方数量</span>
            <span>{ledgerData?.payees.length || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">标签数量</span>
            <span>{ledgerData?.tags.length || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">错误</span>
            <span>
              {ledgerData?.errors.length ? (
                <Badge variant="destructive" className="text-xs">{ledgerData.errors.length}</Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">无</Badge>
              )}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">关于</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>Dazzle v0.1.0</p>
          <p>基于 Beancount/Fava 构建的现代化记账前端</p>
        </CardContent>
      </Card>
    </div>
  );
}
