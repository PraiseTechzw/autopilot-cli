'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigation, NavSection } from '@/lib/navigation';
import clsx from 'clsx';
import { ChevronDown, ChevronRight, Package, ExternalLink } from 'lucide-react';
import { useState } from 'react';

function SidebarGroup({ section, pathname, onLinkClick }: { section: NavSection; pathname: string; onLinkClick?: () => void }) {
  const isActiveGroup = section.items.some((item) => pathname === item.href);
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="mb-4">
      {section.title && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full text-left mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {section.title}
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      )}
      {isOpen && (
        <ul className="space-y-1">
          {section.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onLinkClick}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  className={clsx(
                    'block px-2 py-1.5 text-sm rounded-md transition-colors flex items-center gap-2',
                    isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                  )}
                >
                  {item.title}
                  {item.external && <ExternalLink className="h-3 w-3 opacity-50" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function SidebarNav({ className, onLinkClick }: { className?: string; onLinkClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className={clsx(className, "flex flex-col justify-between")}>
      <div>
        {navigation.map((section, i) => (
          <SidebarGroup key={i} section={section} pathname={pathname} onLinkClick={onLinkClick} />
        ))}
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Release
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
            v1.0.0
          </span>
        </div>
        <a
          href="https://www.npmjs.com/package/autopilot-cli"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
        >
          <Package className="h-4 w-4" />
          <span>View on npm</span>
        </a>
      </div>
    </nav>
  );
}

export function Sidebar() {
  return (
    <SidebarNav className="w-64 flex-shrink-0 py-6 px-4 border-r border-gray-200 dark:border-gray-800 hidden md:block h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto" />
  );
}
