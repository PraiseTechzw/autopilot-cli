'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { X, Github, Trophy, FileText } from 'lucide-react';
import { useSidebar } from './SidebarProvider';
import { REPO_URL } from '@/lib/constants';

export function MobileMenu() {
    const { isOpen, close } = useSidebar();

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                onClick={close}
                aria-hidden="true"
            />

            {/* Mobile Menu Panel */}
            <div className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-background border-l border-border z-50 md:hidden overflow-y-auto mobile-menu-panel shadow-2xl">
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <h2 className="text-lg font-bold text-foreground">Menu</h2>
                        <button
                            onClick={close}
                            className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
                            aria-label="Close menu"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 p-6">
                        <div className="space-y-1">
                            <Link
                                href="/"
                                className="flex items-center gap-3 px-4 py-3 text-base font-medium text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                                onClick={close}
                            >
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                Home
                            </Link>

                            <Link
                                href="/leaderboard"
                                className="flex items-center gap-3 px-4 py-3 text-base font-medium text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                                onClick={close}
                            >
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                Leaderboard
                            </Link>

                            <Link
                                href="/docs"
                                className="flex items-center gap-3 px-4 py-3 text-base font-medium text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                                onClick={close}
                            >
                                <FileText className="h-5 w-5 text-muted-foreground" />
                                Documentation
                            </Link>
                        </div>

                        {/* Separator */}
                        <div className="my-6 border-t border-border" />

                        {/* External Links */}
                        <div className="space-y-1">
                            <Link
                                href={REPO_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-3 text-base font-medium text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                            >
                                <Github className="h-5 w-5 text-muted-foreground" />
                                <span>Star on GitHub</span>
                                <svg className="ml-auto h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </Link>
                        </div>
                    </nav>

                    {/* Footer */}
                    <div className="p-6 border-t border-border bg-muted/30">
                        <p className="text-sm text-muted-foreground text-center">
                            Built with ❤️ by{' '}
                            <a
                                href="https://github.com/PraiseTechzw"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-link hover:underline font-medium"
                            >
                                PraiseTech
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
