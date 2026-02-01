'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { DocMetadata } from '@/lib/mdx';

export function AppHeader({ docs }: { docs: DocMetadata[] }) {
  const pathname = usePathname();
  // Don't render global header on docs pages as they have their own layout
  if (pathname.startsWith('/docs')) {
    return null;
  }
  return <Header docs={docs} />;
}
