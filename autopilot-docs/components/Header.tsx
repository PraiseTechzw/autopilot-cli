import Link from 'next/link';
import { Github, Menu } from 'lucide-react';
import { Search } from './Search';
import { DocMetadata } from '@/lib/mdx';

interface HeaderProps {
  docs: DocMetadata[];
}

export function Header({ docs }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <span className="text-blue-600">Autopilot</span>
            <span>CLI</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4 flex-1 justify-center max-w-lg mx-auto">
           <Search docs={docs} />
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="https://github.com/PraiseTechzw/autopilot-cli"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <Github className="h-5 w-5" />
          </Link>
          <button onClick={onMenuClick} className="md:hidden p-2 text-gray-500">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
