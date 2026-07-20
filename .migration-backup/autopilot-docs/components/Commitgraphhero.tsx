'use client';

import { useEffect, useRef, useState } from 'react';

const COMMITS = [
  'feat: add rate limiter',
  'fix: null check on init',
  'docs: update quick start',
  'chore: bump dependencies',
  'feat: openrouter fallback',
];

const BRANCH_INDEX = 2; // which commit visually branches off, for team-mode flavor

export function CommitGraphHero() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typedLabel, setTypedLabel] = useState('');
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion.current) {
      setVisibleCount(COMMITS.length);
      setTypedLabel(COMMITS[COMMITS.length - 1]);
      return;
    }

    let i = 0;
    const nodeTimer = setInterval(() => {
      i += 1;
      setVisibleCount(i);
      if (i >= COMMITS.length) clearInterval(nodeTimer);
    }, 550);

    return () => clearInterval(nodeTimer);
  }, []);

  useEffect(() => {
    if (reducedMotion.current || visibleCount === 0) return;
    const current = COMMITS[visibleCount - 1];
    setTypedLabel('');
    let i = 0;
    const typeTimer = setInterval(() => {
      i += 1;
      setTypedLabel(current.slice(0, i));
      if (i >= current.length) clearInterval(typeTimer);
    }, 28);
    return () => clearInterval(typeTimer);
  }, [visibleCount]);

  const nodeX = (i: number) => 40 + i * 110;

  return (
    <div
      className="relative w-full max-w-3xl mx-auto mt-4"
      aria-hidden="true"
      style={
        {
          '--rail': '#2A313D',
          '--accent': '#E8A33D',
          '--node-bg': '#0E1116',
          '--muted': '#8B93A1',
        } as React.CSSProperties
      }
    >
      <svg viewBox="0 0 620 160" className="w-full h-auto overflow-visible">
        <line x1="20" y1="80" x2="600" y2="80" stroke="var(--rail)" strokeWidth="2" />
        <path
          d={`M ${nodeX(BRANCH_INDEX - 1)} 80 C ${nodeX(BRANCH_INDEX - 1) + 40} 80, ${nodeX(BRANCH_INDEX - 1) + 40} 128, ${nodeX(BRANCH_INDEX)} 128 C ${nodeX(BRANCH_INDEX) + 70} 128, ${nodeX(BRANCH_INDEX) + 70} 80, ${nodeX(BRANCH_INDEX + 1)} 80`}
          fill="none"
          stroke="var(--rail)"
          strokeWidth="2"
          strokeDasharray="4 6"
          opacity="0.6"
        />

        {COMMITS.map((_, i) => {
          const shown = i < visibleCount;
          const y = i === BRANCH_INDEX ? 128 : 80;
          return (
            <circle
              key={i}
              className={shown ? 'commit-node-in' : ''}
              cx={nodeX(i)}
              cy={y}
              r="7"
              fill={shown ? 'var(--accent)' : 'var(--rail)'}
              stroke="var(--node-bg)"
              strokeWidth="3"
              style={{ opacity: shown ? 1 : 0.4 }}
            />
          );
        })}
      </svg>

      <div className="mt-6 flex items-center justify-center gap-2 font-mono text-xs text-[var(--muted)] h-5">
        <span>$ autopilot log --oneline -1</span>
      </div>
      <div className="mt-1 flex items-center justify-center gap-1 font-mono text-sm text-foreground h-6">
        <span>{typedLabel}</span>
        <span className="cursor-blink text-[var(--accent)]">▌</span>
      </div>

      <style jsx>{`
        circle {
          transform-box: fill-box;
          transform-origin: 50% 50%;
        }
        .commit-node-in {
          animation: nodeIn 0.4s ease-out;
        }
        @keyframes nodeIn {
          from {
            opacity: 0;
            transform: scale(0.3);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .cursor-blink {
          animation: blink 1s steps(1) infinite;
        }
        @keyframes blink {
          50% {
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .commit-node-in {
            animation: none;
          }
          .cursor-blink {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}