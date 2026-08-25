'use client';

import clsx from 'clsx';
import { AlertTriangle, Info, Lightbulb, CheckCircle2, XCircle } from 'lucide-react';
import { Pre } from './Pre';
import Link from 'next/link';

function Callout({ type = 'default', title, children }: { type?: 'default' | 'info' | 'warning' | 'error' | 'success'; title?: string; children: React.ReactNode }) {
  const icons = {
    default: Lightbulb,
    info: Info,
    warning: AlertTriangle,
    error: XCircle,
    success: CheckCircle2
  };
  const Icon = icons[type] || Lightbulb;
  
  return (
    <div className={clsx("my-6 flex gap-3 rounded-lg border p-4 shadow-sm", {
      'border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-900/10 dark:text-emerald-100': type === 'info',
      'border-yellow-200 bg-yellow-50/50 text-yellow-900 dark:border-yellow-900/50 dark:bg-yellow-900/10 dark:text-yellow-100': type === 'warning',
      'border-red-200 bg-red-50/50 text-red-900 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-100': type === 'error',
      'border-green-200 bg-green-50/50 text-green-900 dark:border-green-900/50 dark:bg-green-900/10 dark:text-green-100': type === 'success',
      'border-gray-200 bg-gray-50/50 text-gray-900 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-100': type === 'default',
    })}>
      <div className="select-none mt-0.5">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 text-sm leading-relaxed">
        {title && <p className="mb-2 font-semibold">{title}</p>}
        <div className="prose-sm dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{children}</div>
      </div>
    </div>
  );
}

function CustomLink(props: any) {
  const href = props.href;

  if (href.startsWith('/')) {
    return (
      <Link href={href} className="font-medium text-link underline decoration-link/30 underline-offset-4 hover:decoration-link transition-colors">
        {props.children}
      </Link>
    );
  }

  if (href.startsWith('#')) {
    return <a {...props} className="font-medium text-link underline decoration-link/30 underline-offset-4 hover:decoration-link transition-colors" />;
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} className="font-medium text-link underline decoration-link/30 underline-offset-4 hover:decoration-link transition-colors" />;
}

export const components = {
  h1: (props: any) => <h1 {...props} className="mt-2 scroll-m-20 text-4xl font-bold tracking-tight text-foreground" />,
  h2: (props: any) => <h2 {...props} className="mt-12 scroll-m-20 border-b border-border pb-2 text-2xl font-semibold tracking-tight text-foreground first:mt-0" />,
  h3: (props: any) => <h3 {...props} className="mt-8 scroll-m-20 text-xl font-semibold tracking-tight text-foreground" />,
  h4: (props: any) => <h4 {...props} className="mt-8 scroll-m-20 text-lg font-semibold tracking-tight text-foreground" />,
  p: (props: any) => <p {...props} className="leading-7 [&:not(:first-child)]:mt-6 text-foreground/90" />,
  ul: (props: any) => <ul {...props} className="my-6 ml-6 list-disc [&>li]:mt-2 text-foreground/90" />,
  ol: (props: any) => <ol {...props} className="my-6 ml-6 list-decimal [&>li]:mt-2 text-foreground/90" />,
  li: (props: any) => <li {...props} />,
  blockquote: (props: any) => <blockquote {...props} className="mt-6 border-l-2 border-border pl-6 italic text-muted-foreground" />,
  table: (props: any) => <div className="my-6 w-full overflow-y-auto rounded-lg border border-border"><table {...props} className="w-full text-sm" /></div>,
  tr: (props: any) => <tr {...props} className="m-0 border-t border-border p-0 even:bg-muted/50" />,
  th: (props: any) => <th {...props} className="border-0 px-4 py-2 text-left font-bold text-foreground [&[align=center]]:text-center [&[align=right]]:text-right bg-muted" />,
  td: (props: any) => <td {...props} className="border-0 px-4 py-2 text-left text-foreground/90 [&[align=center]]:text-center [&[align=right]]:text-right" />,
  pre: Pre,
  code: (props: any) => <code {...props} className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-foreground" />,
  a: CustomLink,
  Callout,
};
