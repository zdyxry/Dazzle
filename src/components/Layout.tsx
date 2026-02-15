import { useState, useEffect } from 'react';
import { NavLink, Outlet, useParams, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  BookOpen,
  Tag,
  PenSquare,
  Settings,
  Menu,
  X,
  ChevronRight,
  BarChart3,
  BookText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useLedgerData, usePollChanges } from '@/hooks/useLedger';
import { Badge } from './ui/badge';
import { setCurrentLedger } from '@/lib/api';
import { ThemeToggle } from './ThemeToggle';
import { FilterBar } from './FilterBar';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

const navItems = [
  { path: '', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'analytics', label: '财务分析', icon: BarChart3 },
  { path: 'assets', label: '资产总览', icon: Wallet },
  { path: 'income-expense', label: '收支分析', icon: TrendingUp },
  { path: 'journal', label: '交易流水', icon: BookOpen },
  { path: 'tags', label: '标签分析', icon: Tag },
  { path: 'entry', label: '快速记账', icon: PenSquare },
];

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { data: ledgerData, isLoading } = useLedgerData();
  const { ledger } = useParams<{ ledger: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (ledger) {
      setCurrentLedger(ledger);
    }
  }, [ledger]);

  // 处理账本切换
  const handleLedgerChange = (newLedger: string) => {
    if (newLedger === 'manage') {
      navigate('/');
    } else if (newLedger !== ledger) {
      navigate(`/${newLedger}/`);
    }
  };

  // 构建账本选项列表
  const getLedgerOptions = () => {
    const options: Array<{ value: string; label: string; isCurrent?: boolean }> = [];
    
    // 当前账本
    if (ledgerData?.options.title) {
      options.push({
        value: ledger!,
        label: ledgerData.options.title,
        isCurrent: true,
      });
    }
    
    // 其他账本
    if (ledgerData?.other_ledgers) {
      ledgerData.other_ledgers.forEach(([slug, title]) => {
        options.push({ value: slug, label: title });
      });
    }
    
    return options;
  };

  usePollChanges(5000);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-60 bg-card border-r flex flex-col transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0',
          !sidebarOpen && '-translate-x-full lg:hidden'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">F</span>
            </div>
            <span className="font-semibold">Fava UI</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => setSidebarOpen(false)}
            aria-label="关闭侧边栏"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Ledger selector */}
        <div className="px-3 py-3 border-b">
          <p className="text-xs text-muted-foreground mb-1.5">当前账本</p>
          {isLoading ? (
            <p className="text-sm font-medium truncate">加载中...</p>
          ) : (
            <Select value={ledger} onValueChange={handleLedgerChange}>
              <SelectTrigger className="h-9 text-sm">
                <BookText className="h-4 w-4 mr-2 shrink-0 text-muted-foreground" />
                <SelectValue placeholder="选择账本">
                  {ledgerData?.options.title || '未命名账本'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {getLedgerOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <span className={cn(option.isCurrent && 'font-medium')}>
                      {option.label}
                    </span>
                    {option.isCurrent && (
                      <span className="ml-2 text-xs text-muted-foreground">(当前)</span>
                    )}
                  </SelectItem>
                ))}
                {ledgerData?.other_ledgers && ledgerData.other_ledgers.length > 0 && (
                  <>
                    <div className="h-px bg-border my-1" />
                    <SelectItem value="manage" className="text-muted-foreground">
                      管理账本...
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === ''}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
              onClick={() => {
                if (window.innerWidth < 1024) setSidebarOpen(false);
              }}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t space-y-2">
          {ledgerData && ledgerData.errors.length > 0 && (
            <Badge variant="destructive" className="w-full justify-center text-xs">
              {ledgerData.errors.length} 个错误
            </Badge>
          )}
          <NavLink
            to="settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <Settings className="h-4 w-4 shrink-0" />
            设置
          </NavLink>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden mr-2 h-8 w-8"
              onClick={() => setSidebarOpen(true)}
              aria-label="打开侧边栏"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </Button>
            <div className="flex items-center text-sm text-muted-foreground">
              <span>Fava</span>
              <ChevronRight className="h-3 w-3 mx-1" />
              <span className="text-foreground font-medium">
                {ledgerData?.options.title || 'Modern UI'}
              </span>
            </div>
          </div>
          <ThemeToggle />
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 lg:p-6 space-y-4">
            <FilterBar />
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
