import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { Search as SearchIcon, FileText, Hash, CornerDownLeft } from 'lucide-react';
import { searchDocs, SearchResult } from '@/lib/search';
import clsx from 'clsx';

export function Search() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setIsOpen(prev => !prev); }
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (query.trim()) { setResults(searchDocs(query)); setSelectedIndex(0); }
    else setResults([]);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const navigateTo = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    navigate(result.route);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => (i + 1) % (results.length || 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => (i - 1 + (results.length || 1)) % (results.length || 1)); }
    else if (e.key === 'Enter' && results[selectedIndex]) { e.preventDefault(); navigateTo(results[selectedIndex]); }
  };

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="group relative flex items-center gap-2 w-full max-w-sm px-4 py-2 text-sm text-muted-foreground bg-muted/50 border border-border rounded-lg hover:border-foreground/20 transition-colors">
        <SearchIcon className="h-4 w-4" />
        <span className="mr-auto">Search documentation...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded border border-border">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-4 sm:pt-24">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} aria-hidden="true" />
      <div className="relative w-full max-w-2xl bg-background rounded-xl shadow-2xl ring-1 ring-border overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200" role="dialog" aria-modal="true">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <SearchIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documentation..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
          />
          <kbd className="hidden sm:flex items-center px-2 py-1 text-[10px] font-medium text-muted-foreground bg-muted rounded border border-border cursor-pointer" onClick={() => setIsOpen(false)}>ESC</kbd>
        </div>
        <div className="overflow-y-auto max-h-[60vh]">
          {query && results.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-muted-foreground">No results for "{query}"</div>
          )}
          {!query && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Start typing to search...</div>
          )}
          {results.length > 0 && (
            <ul>
              {results.map((result, i) => {
                const isSelected = i === selectedIndex;
                return (
                  <li
                    key={result.route}
                    onClick={() => navigateTo(result)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors',
                      isSelected ? 'bg-muted' : 'hover:bg-muted/50'
                    )}
                  >
                    <div className={clsx('flex-shrink-0 p-1.5 rounded-md', isSelected ? 'bg-link/20 text-link' : 'bg-muted text-muted-foreground')}>
                      {result.type === 'heading' ? <Hash className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{result.route}</span>
                        {result.heading && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                            <span className="truncate">{result.heading}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {isSelected && <CornerDownLeft className="h-4 w-4 text-link animate-in fade-in" />}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="px-4 py-3 border-t border-border bg-muted/50 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><kbd className="font-sans px-1.5 py-0.5 rounded bg-muted border border-border">↵</kbd> to select</span>
            <span className="flex items-center gap-1"><kbd className="font-sans px-1.5 py-0.5 rounded bg-muted border border-border">↑↓</kbd> to navigate</span>
            <span className="flex items-center gap-1"><kbd className="font-sans px-1.5 py-0.5 rounded bg-muted border border-border">esc</kbd> to close</span>
          </div>
          <div className="hidden sm:block opacity-50">Autopilot Docs</div>
        </div>
      </div>
    </div>
  );
}
