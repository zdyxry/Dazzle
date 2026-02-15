import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { Button } from './ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const next = () => {
    const order = ['light', 'dark', 'system'] as const;
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  };

  const Icon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <Button variant="ghost" size="icon" onClick={next} title={`当前: ${theme}`}>
      <Icon className="h-4 w-4" />
    </Button>
  );
}
