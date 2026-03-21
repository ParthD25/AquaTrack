'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div style={{width: 108, height: 36}} />;

  return (
    <div style={{ display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, overflow: 'hidden' }}>
      <button 
        onClick={() => setTheme('light')} 
        style={{ padding: '8px', background: theme === 'light' ? 'var(--aqua-400)' : 'transparent', color: theme === 'light' ? '#000' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
        title="Light Mode"
      >
        <Sun size={18} />
      </button>
      <button 
        onClick={() => setTheme('system')} 
        style={{ padding: '8px', background: theme === 'system' ? 'var(--aqua-400)' : 'transparent', color: theme === 'system' ? '#000' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
        title="System Theme"
      >
        <Monitor size={18} />
      </button>
      <button 
        onClick={() => setTheme('dark')} 
        style={{ padding: '8px', background: theme === 'dark' ? 'var(--aqua-400)' : 'transparent', color: theme === 'dark' ? '#000' : 'var(--text-muted)', border: 'none', cursor: 'pointer' }}
        title="Dark Mode"
      >
        <Moon size={18} />
      </button>
    </div>
  );
}
