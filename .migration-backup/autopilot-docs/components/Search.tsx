'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon, FileText, Hash, CornerDownLeft } from 'lucide-react';
import { searchDocs, SearchResult } from '@/lib/search';
import { DocMetadata } from '@/lib/mdx';
import clsx from 'clsx';

interface SearchProps {
  docs?: DocMetadata[]; // Kept for compatibility, but unused
}

export function Search({ docs }: SearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Toggle Logic (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Search Logic
  useEffect(() => {
    if (query.trim()) {
      const hits = searchDocs(query);
      setResults(hits);
      setSelectedIndex(0);
    } else {
      setResults([]);
    }
  }, [query]);

  // Focus Management & Scroll Lock
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 10);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery(''); // Reset query on close? User said "ESC closes modal and clears query". 
      // If simply toggled closed, maybe keep query? But "ESC... clears query" implies reset.
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Navigation
  const navigateTo = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    router.push(result.route);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => (i + 1) % (results.length || 1));
      // Scroll into view logic could be added here
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => (i - 1 + (results.length || 1)) % (results.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        navigateTo(results[selectedIndex]);
      }
    }
  };

  if (!isOpen) {
    return (
    <button
        onClick={() => setIsOpen(true)}
        className="group relative flex items-center gap-2 w-full max-w-sm px-4 py-2 text-sm text-muted-foreground bg-muted/50 border border-border rounded-lg hover:border-foreground/20 transition-colors"
      >
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
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl bg-background rounded-xl shadow-2xl ring-1 ring-border overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Search Input */}
        <div className="flex items-center px-4 border-b border-border">
          <SearchIcon className="h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search documentation..."
            className="flex-1 h-14 px-4 bg-transparent border-0 focus:ring-0 text-foreground placeholder:text-muted-foreground text-lg outline-none"
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 text-muted-foreground hover:text-foreground rounded-md"
            aria-label="Close search"
          >
            <kbd className="text-xs border border-border rounded px-1.5 py-0.5 font-sans">ESC</kbd>
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border">
          {!query && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <p>Type to search...</p>
            </div>
          )}

          {query && results.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <p>No results found for <span className="text-foreground">"{query}"</span></p>
            </div>
          )}

          {results.length > 0 && (
            <ul ref={listRef} role="listbox">
              {results.map((result, index) => {
                 const isSelected = index === selectedIndex;
                 return (
                   <li
                     key={`${result.route}-${index}`}
                     role="option"
                     aria-selected={isSelected}
                     onMouseEnter={() => setSelectedIndex(index)}
                     onClick={() => navigateTo(result)}
                     className={clsx(
                       "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors scroll-m-2",
                       isSelected ? "bg-link/10" : "hover:bg-muted/50"
                     )}
                   >
                     <div className={clsx(
                       "flex-shrink-0 p-2 rounded-md",
                       isSelected ? "bg-link/20 text-link" : "bg-muted text-muted-foreground"
                     )}>
                       {result.type === 'page' ? <FileText className="h-5 w-5" /> : <Hash className="h-5 w-5" />}
                     </div>
                     
                     <div className="flex-1 min-w-0">
                       <div className={clsx("font-medium truncate", isSelected ? "text-link" : "text-foreground")}>
                         {result.title}
                       </div>
                       <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                         <span>{result.type === 'heading' ? 'Section' : 'Page'}</span>
                         {result.heading && (
                           <>
                             <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                             <span className="truncate">{result.heading}</span>
                           </>
                         )}
                         {result.snippet && !result.heading && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                                <span className="truncate opacity-75">{result.snippet}</span>
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

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-muted/50 text-xs text-muted-foreground flex items-center justify-between">
           <div className="flex gap-4">
             <span className="flex items-center gap-1"><kbd className="font-sans px-1.5 py-0.5 rounded bg-muted border border-border">↵</kbd> to select</span>
             <span className="flex items-center gap-1"><kbd className="font-sans px-1.5 py-0.5 rounded bg-muted border border-border">↑↓</kbd> to navigate</span>
             <span className="flex items-center gap-1"><kbd className="font-sans px-1.5 py-0.5 rounded bg-muted border border-border">esc</kbd> to close</span>
           </div>
           <div className="hidden sm:block opacity-50">
             Autopilot Docs
           </div>
        </div>
      </div>
    </div>
  );
}
