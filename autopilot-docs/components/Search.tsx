'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Search as SearchIcon, Command } from 'lucide-react';
import Link from 'next/link';
import { DocMetadata } from '@/lib/mdx';

interface SearchProps {
  docs: DocMetadata[];
}

export function Search({ docs }: SearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const results = useMemo(() => {
    if (!query) return [];
    return docs.filter((doc) =>
      doc.title.toLowerCase().includes(query.toLowerCase()) ||
      doc.description.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, docs]);

  return (
    <div className="relative w-full">
      <div className="relative group">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search documentation..."
          className="w-full pl-10 pr-12 py-2 text-sm border border-gray-200/50 dark:border-gray-800/50 rounded-lg bg-gray-50/50 dark:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 pointer-events-none">
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800 px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:text-gray-400 opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>

      {isOpen && query && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          {results.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">No results found</div>
          ) : (
            <ul className="max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
              {results.map((doc) => (
                <li key={doc.slug}>
                  <Link
                    href={`/docs/${doc.slug === 'index' ? '' : doc.slug}`}
                    className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-l-2 border-transparent hover:border-blue-500"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {doc.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {doc.description}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
