'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { navigation } from '@/lib/navigation';
import clsx from 'clsx';

export function SidebarNav({ className, onLinkClick }: { className?: string; onLinkClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className={className}>
      {navigation.map((section, i) => (
        <div key={i} className="mb-8">
          {section.title && (
            <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              {section.title}
            </h4>
          )}
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
                      'block px-2 py-1.5 text-sm rounded-md transition-colors',
                      isActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar() {
  return (
    <SidebarNav className="w-64 flex-shrink-0 py-6 px-4 border-r border-gray-200 dark:border-gray-800 hidden md:block h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto" />
  );
}
