'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigation, NavSection } from '@/lib/navigation';
import clsx from 'clsx';
import { ChevronDown, ChevronRight, Package, ExternalLink, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { NPM_URL } from '@/lib/constants';

function SidebarGroup({ section, pathname, onLinkClick }: { section: NavSection; pathname: string; onLinkClick?: () => void }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-8">
      {section.title && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full text-left mb-3 group"
        >
          <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
            {section.title}
          </span>
          {isOpen ? (
            <ChevronDown className="h-3 w-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
          ) : (
            <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
          )}
        </button>
      )}
      
      <div className={clsx("space-y-0.5 transition-all duration-300 ease-in-out", isOpen ? "opacity-100 max-h-[1000px]" : "opacity-0 max-h-0 overflow-hidden")}>
        {section.items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              className={clsx(
                'group flex items-center gap-2 px-3 py-2 text-sm transition-all duration-200 border-l-2 relative',
                isActive
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-gradient-to-r from-blue-50/80 to-transparent dark:from-blue-900/20'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:border-gray-300 dark:hover:border-gray-700'
              )}
            >
              {isActive && (
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] rounded-full" />
              )}
              <span className="relative z-10">{item.title}</span>
              {item.external && <ExternalLink className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity ml-auto" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export interface SidebarStats {
  version: string | null;
  downloads: number | null;
}

export function SidebarNav({ className, onLinkClick, stats }: { className?: string; onLinkClick?: () => void; stats?: SidebarStats }) {
  const pathname = usePathname();

  return (
    <nav className={clsx(className, "flex flex-col h-full")}>
      <div className="flex-1">
        {navigation.map((section, i) => (
          <SidebarGroup key={i} section={section} pathname={pathname} onLinkClick={onLinkClick} />
        ))}
      </div>
      
      <div className="mt-auto pt-6 pb-4">
        <div className="rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">Latest Release</p>
              <p className="text-[10px] text-gray-500">{stats?.version ? `v${stats.version}` : 'v—'}{stats?.downloads ? ` • ${stats.downloads.toLocaleString()} / week` : ''}</p>
            </div>
          </div>
          <a
            href={NPM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-medium text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
          >
            <Package className="h-3 w-3" />
            <span>View on npm</span>
          </a>
        </div>
      </div>
    </nav>
  );
}

export function Sidebar({ stats }: { stats?: SidebarStats }) {
  return (
    <SidebarNav stats={stats} className="w-64 flex-shrink-0 py-8 px-4 border-r border-gray-200/50 dark:border-gray-800/50 hidden md:flex h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto scrollbar-none" />
  );
}
