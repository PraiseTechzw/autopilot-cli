'use client';

import { useState, useMemo } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { DocMetadata } from '@/lib/mdx';

interface SearchProps {
  docs: DocMetadata[];
}

export function Search({ docs }: SearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const results = useMemo(() => {
    if (!query) return [];
    return docs.filter((doc) =>
      doc.title.toLowerCase().includes(query.toLowerCase()) ||
      doc.description.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, docs]);

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search documentation..."
          className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-800 rounded-md bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        />
      </div>

      {isOpen && query && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-md shadow-lg overflow-hidden z-50">
          {results.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">No results found</div>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {results.map((doc) => (
                <li key={doc.slug}>
                  <Link
                    href={`/docs/${doc.slug === 'index' ? '' : doc.slug}`}
                    className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {doc.title}
                    </div>
                    <div className="text-xs text-gray-500 truncate">
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
