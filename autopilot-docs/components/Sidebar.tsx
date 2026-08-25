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
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] group-hover:text-foreground transition-colors">
            {section.title}
          </span>
          {isOpen ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
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
                  ? 'border-link text-link bg-link/5'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              {isActive && (
                 <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-link shadow-[0_0_8px] shadow-link/50 rounded-full" />
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
        <div className="rounded-xl bg-card p-4 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-link/10 text-link">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Latest Release</p>
              <p className="text-[10px] text-muted-foreground">{stats?.version ? `v${stats.version}` : 'v—'}{stats?.downloads ? ` • ${stats.downloads.toLocaleString()} downloads` : ''}</p>
            </div>
          </div>
          <a
            href={NPM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-medium text-primary-foreground bg-primary rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
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
    <SidebarNav stats={stats} className="w-64 flex-shrink-0 py-8 px-4 border-r border-border hidden md:flex h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto scrollbar-none" />
  );
}
