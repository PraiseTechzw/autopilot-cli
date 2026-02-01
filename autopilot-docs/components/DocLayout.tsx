'use client';

import { DocMetadata } from '@/lib/mdx';
import { SidebarNav, SidebarStats } from './Sidebar';
import { X } from 'lucide-react';
import { useSidebar } from './SidebarProvider';
import { Feedback } from './Feedback';
import { usePathname } from 'next/navigation';

interface DocLayoutProps {
  children: React.ReactNode;
  docs: DocMetadata[];
  stats?: SidebarStats;
}

export function DocLayout({ children, docs, stats }: DocLayoutProps) {
  const { isOpen, close } = useSidebar();
  const pathname = usePathname();
  
  // Find current doc to pass title to Feedback
  // Normalize pathname to match route (e.g. remove trailing slash if needed, though Next.js handles this)
  const currentDoc = docs.find(doc => doc.route === pathname) || docs.find(doc => doc.route === pathname?.replace(/\/$/, ''));

  return (
    <div className="flex-1 container mx-auto flex items-start">
      {/* Desktop Sidebar */}
      <SidebarNav stats={stats} className="hidden md:block w-64 flex-shrink-0 border-r border-border h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto py-6 pr-4" />

      {/* Mobile Sidebar (Drawer) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={close} 
          />
          
          {/* Drawer Content */}
          <div className="fixed inset-y-0 left-0 w-72 bg-background shadow-xl border-r border-border p-4 flex flex-col transform transition-transform animate-in slide-in-from-left">
            <div className="flex justify-end mb-4">
              <button 
                onClick={close}
                className="p-2 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarNav stats={stats} onLinkClick={close} />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full min-w-0 py-6 px-4 md:px-8">
        {children}
        <Feedback title={currentDoc?.title} />
      </main>
    </div>
  );
}
