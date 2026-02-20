import { useState } from 'react';
import { useLedgerStore } from '@/stores/ledger';
import { useAIStore, ENV_DEFAULTS } from '@/stores/ai';
import { chatCompletion } from '@/lib/ai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sun, Moon, Monitor, Eye, EyeOff, Loader2 } from 'lucide-react';


export function Settings() {
  const ledgerData = useLedgerStore((state) => state.ledgerData);
  const { theme, setTheme } = useTheme();
  const { config, setConfig, getEffectiveConfig } = useAIStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [testStatus, setTestStatus] = useState<{
    state: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
  }>({ state: 'idle' });

  const themes = [
    { value: 'light' as const, label: '浅色', icon: Sun },
    { value: 'dark' as const, label: '深色', icon: Moon },
    { value: 'system' as const, label: '跟随系统', icon: Monitor },
  ];

  const handleTestConnection = async () => {
    setTestStatus({ state: 'loading' });
    try {
      const effective = getEffectiveConfig();
      await chatCompletion(
        [{ role: 'user', content: 'Hello' }],
        effective,
      );
      setTestStatus({ state: 'success', message: '连接成功' });
    } catch (e) {
      setTestStatus({
        state: 'error',
        message: e instanceof Error ? e.message : '连接失败',
      });
    }
  };

  const effective = getEffectiveConfig();

  function configSource(field: keyof typeof ENV_DEFAULTS) {
    if (config[field]) return '用户设置';
    if (ENV_DEFAULTS[field]) return '环境变量';
    return '内置默认';
  }

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
          <CardTitle className="text-lg">AI 配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">API Key *</label>
            <div className="flex gap-2">
              <Input
                type={showApiKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(e) => setConfig({ apiKey: e.target.value })}
                placeholder="sk-..."
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Base URL</label>
            <Input
              value={config.baseUrl}
              onChange={(e) => setConfig({ baseUrl: e.target.value })}
              placeholder={ENV_DEFAULTS.baseUrl}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Model</label>
            <Input
              value={config.model}
              onChange={(e) => setConfig({ model: e.target.value })}
              placeholder={ENV_DEFAULTS.model}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testStatus.state === 'loading'}
            >
              {testStatus.state === 'loading' && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              测试连接
            </Button>
            {testStatus.state === 'success' && (
              <span className="text-sm text-green-600 dark:text-green-400">{testStatus.message}</span>
            )}
            {testStatus.state === 'error' && (
              <span className="text-sm text-destructive">{testStatus.message}</span>
            )}
          </div>

          <div className="rounded-md border p-3 space-y-2">
            <p className="text-sm font-medium">当前生效配置</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">API Key</span>
              <span>
                {effective.apiKey ? '••••••' + effective.apiKey.slice(-4) : '未配置'}
                <Badge variant="secondary" className="text-xs ml-2">{configSource('apiKey')}</Badge>
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base URL</span>
              <span>
                {effective.baseUrl}
                <Badge variant="secondary" className="text-xs ml-2">{configSource('baseUrl')}</Badge>
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Model</span>
              <span>
                {effective.model}
                <Badge variant="secondary" className="text-xs ml-2">{configSource('model')}</Badge>
              </span>
            </div>
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
