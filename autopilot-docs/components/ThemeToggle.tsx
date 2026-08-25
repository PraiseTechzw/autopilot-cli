'use client';

import { Moon, Sun, Laptop } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-9 h-9 rounded-full bg-muted/50 animate-pulse" />
    );
  }

  const cycleTheme = () => {
    if (theme === 'system') setTheme('light');
    else if (theme === 'light') setTheme('dark');
    else setTheme('system');
  };

  return (
    <button
      onClick={cycleTheme}
      className={clsx(
        "relative inline-flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent hover:border-border"
      )}
      aria-label="Toggle theme"
      title={`Current theme: ${theme}`}
    >
      <Sun className={clsx("h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0", theme === 'system' && "scale-0")} />
      <Moon className={clsx("absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100", theme === 'system' && "scale-0")} />
      <Laptop className={clsx("absolute h-[1.2rem] w-[1.2rem] scale-0 transition-all", theme === 'system' && "scale-100")} />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
