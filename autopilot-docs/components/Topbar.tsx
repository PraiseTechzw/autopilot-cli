'use client';

import Link from 'next/link';
import { Github, Menu, Command } from 'lucide-react';
import { Search } from './Search';
import { ThemeToggle } from './ThemeToggle';
import { useSidebar } from './SidebarProvider';
import { REPO_URL } from '@/lib/constants';

interface TopbarProps {
  versionBadge?: React.ReactNode;
}

export function Topbar({ versionBadge }: TopbarProps) {
  const { toggle } = useSidebar();
  
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 transition-colors duration-500">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 group-hover:scale-105 transition-all duration-300">
              <Command className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white transition-colors">
              Autopilot<span className="text-blue-500">CLI</span>
            </span>
          </Link>
          {versionBadge}
        </div>

        <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
           <div className="w-full relative group">
             <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500" />
             <div className="relative">
               <Search />
             </div>
           </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors border border-gray-200/50 dark:border-gray-700/50 mr-2"
          >
            <Github className="h-4 w-4" />
            <span className="hidden lg:inline">Star on GitHub</span>
          </Link>
          
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1 hidden sm:block" />

          <ThemeToggle />
          
          <button 
            onClick={toggle} 
            className="md:hidden p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors ml-1"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}
