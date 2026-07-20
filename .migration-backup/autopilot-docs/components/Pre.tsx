'use client';

import { useState, useRef } from 'react';
import { Check, Copy } from 'lucide-react';

export function Pre({ children, ...props }: any) {
  const [copied, setCopied] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);

  const onCopy = () => {
    if (preRef.current) {
      const text = preRef.current.textContent || '';
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative group not-prose mb-4">
      <pre
        ref={preRef}
        {...props}
        className="overflow-x-auto rounded-lg bg-code-bg p-4 text-sm text-foreground border border-code-border transition-colors"
      >
        {children}
      </pre>
      <button
        onClick={onCopy}
        className="absolute top-2 right-2 p-2 rounded-md bg-background text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted hover:text-foreground border border-border shadow-sm"
        aria-label="Copy code"
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}
