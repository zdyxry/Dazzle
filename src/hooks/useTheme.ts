import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('dazzle-theme') as Theme;
    return stored || 'system';
  });

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (t: Theme) => {
      const isDark = t === 'system' 
        ? window.matchMedia('(prefers-color-scheme: dark)').matches 
        : t === 'dark';
      
      root.classList.toggle('dark', isDark);
      
      // 设置 color-scheme 以支持原生表单元素
      root.style.colorScheme = isDark ? 'dark' : 'light';
      
      // 更新 theme-color meta 标签
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', isDark ? '#0f172a' : '#ffffff');
      }
    };

    applyTheme(theme);
    localStorage.setItem('dazzle-theme', theme);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  return { theme, setTheme };
}
