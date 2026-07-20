import clsx from 'clsx';
import { AlertTriangle, Info, Lightbulb, CheckCircle2, XCircle } from 'lucide-react';
import { Pre } from './Pre';
import { Link } from 'wouter';

function Callout({ type = 'default', title, children }: { type?: 'default' | 'info' | 'warning' | 'error' | 'success'; title?: string; children: React.ReactNode }) {
  const icons = { default: Lightbulb, info: Info, warning: AlertTriangle, error: XCircle, success: CheckCircle2 };
  const Icon = icons[type] || Lightbulb;
  return (
    <div className={clsx("my-6 flex gap-3 rounded-lg border p-4 shadow-sm", {
      'border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-900/10 dark:text-emerald-100': type === 'info',
      'border-yellow-200 bg-yellow-50/50 text-yellow-900 dark:border-yellow-900/50 dark:bg-yellow-900/10 dark:text-yellow-100': type === 'warning',
      'border-red-200 bg-red-50/50 text-red-900 dark:border-red-900/50 dark:bg-red-900/10 dark:text-red-100': type === 'error',
      'border-green-200 bg-green-50/50 text-green-900 dark:border-green-900/50 dark:bg-green-900/10 dark:text-green-100': type === 'success',
      'border-gray-200 bg-gray-50/50 text-gray-900 dark:border-gray-800 dark:bg-gray-800/50 dark:text-gray-100': type === 'default',
    })}>
      <div className="select-none mt-0.5"><Icon className="h-5 w-5" /></div>
      <div className="flex-1 text-sm leading-relaxed">
        {title && <p className="mb-2 font-semibold">{title}</p>}
        <div className="prose-sm dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{children}</div>
      </div>
    </div>
  );
}

function CustomLink(props: any) {
  const href = props.href || '';
  const cls = "font-medium text-link underline decoration-link/30 underline-offset-4 hover:decoration-link transition-colors";
  if (href.startsWith('/')) return <Link href={href} className={cls}>{props.children}</Link>;
  if (href.startsWith('#')) return <a {...props} className={cls} />;
  return <a target="_blank" rel="noopener noreferrer" {...props} className={cls} />;
}

export const components = {
  h1: (props: any) => <h1 {...props} className="mt-2 scroll-m-20 text-4xl font-bold tracking-tight text-foreground" />,
  h2: (props: any) => <h2 {...props} className="mt-12 scroll-m-20 border-b border-border pb-2 text-2xl font-semibold tracking-tight text-foreground first:mt-0" />,
  h3: (props: any) => <h3 {...props} className="mt-8 scroll-m-20 text-xl font-semibold tracking-tight text-foreground" />,
  h4: (props: any) => <h4 {...props} className="mt-6 scroll-m-20 text-lg font-semibold tracking-tight text-foreground" />,
  p: (props: any) => <p {...props} className="leading-7 text-foreground/90 [&:not(:first-child)]:mt-4" />,
  ul: (props: any) => <ul {...props} className="my-4 ml-6 list-disc [&>li]:mt-2 text-foreground/90" />,
  ol: (props: any) => <ol {...props} className="my-4 ml-6 list-decimal [&>li]:mt-2 text-foreground/90" />,
  li: (props: any) => <li {...props} className="leading-7" />,
  blockquote: (props: any) => <blockquote {...props} className="mt-6 border-l-4 border-link pl-6 italic text-muted-foreground" />,
  code: (props: any) => {
    if (props.className) return <code {...props} />;
    return <code {...props} className="relative rounded bg-[var(--code-bg)] px-[0.3rem] py-[0.1rem] font-mono text-sm border border-[var(--code-border)] text-foreground" />;
  },
  pre: (props: any) => <Pre {...props} />,
  a: CustomLink,
  table: (props: any) => <div className="my-6 w-full overflow-y-auto"><table {...props} className="w-full border-collapse text-sm" /></div>,
  th: (props: any) => <th {...props} className="border border-border px-4 py-2 text-left font-bold bg-muted text-foreground [&[align=center]]:text-center [&[align=right]]:text-right" />,
  td: (props: any) => <td {...props} className="border border-border px-4 py-2 text-left text-foreground/90 [&[align=center]]:text-center [&[align=right]]:text-right" />,
  tr: (props: any) => <tr {...props} className="m-0 border-t border-border p-0 even:bg-muted/30" />,
  hr: (props: any) => <hr {...props} className="my-8 border-border" />,
  img: (props: any) => <img {...props} className="rounded-lg border border-border my-6" />,
  Callout,
};
