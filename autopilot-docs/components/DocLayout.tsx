'use client';

import { useState } from 'react';
import { DocMetadata } from '@/lib/mdx';
import { Header } from './Header';
import { SidebarNav } from './Sidebar';
import { X } from 'lucide-react';

interface DocLayoutProps {
  children: React.ReactNode;
  docs: DocMetadata[];
}

export function DocLayout({ children, docs }: DocLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      <Header docs={docs} onMenuClick={() => setSidebarOpen(true)} />
      
      <div className="flex-1 container mx-auto flex items-start">
         {/* Desktop Sidebar */}
         <SidebarNav className="hidden md:block w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-800 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto py-6 pr-4" />

         {/* Mobile Sidebar (Drawer) */}
         {sidebarOpen && (
           <div className="fixed inset-0 z-50 md:hidden">
             {/* Backdrop */}
             <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
                onClick={() => setSidebarOpen(false)} 
             />
             
             {/* Drawer Content */}
             <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-950 shadow-xl border-r border-gray-200 dark:border-gray-800 p-4 flex flex-col transform transition-transform animate-in slide-in-from-left">
               <div className="flex justify-end mb-4">
                 <button 
                   onClick={() => setSidebarOpen(false)}
                   className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                   aria-label="Close sidebar"
                 >
                   <X className="h-5 w-5" />
                 </button>
               </div>
               <div className="flex-1 overflow-y-auto">
                 <SidebarNav onLinkClick={() => setSidebarOpen(false)} />
               </div>
             </div>
           </div>
         )}

         {/* Main Content */}
         <main className="flex-1 w-full min-w-0 py-6 px-4 md:px-8">
            {children}
         </main>
      </div>
    </div>
  );
}
