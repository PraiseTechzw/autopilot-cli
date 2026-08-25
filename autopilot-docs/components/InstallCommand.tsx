'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export function InstallCommand() {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText('npm install -g @traisetech/autopilot');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-[#b8ff1f] to-[#16a34a] rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative bg-[#050816] rounded-lg p-4 text-left shadow-2xl flex items-center justify-between border border-[#263244]">
        <div className="flex gap-3 overflow-x-auto">
          <span className="text-link select-none">$</span>
          <code className="font-mono text-sm text-gray-100 whitespace-nowrap">
            npm install -g @traisetech/autopilot
          </code>
        </div>
        <button
          onClick={onCopy}
          className="ml-4 p-2 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition-colors flex-shrink-0"
          aria-label="Copy install command"
        >
          {copied ? <Check className="h-4 w-4 text-link" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
