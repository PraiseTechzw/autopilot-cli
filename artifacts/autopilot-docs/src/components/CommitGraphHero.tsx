import { useEffect, useRef, useState } from 'react';

const COMMITS = [
  { hash: 'a1b2c3d', message: 'feat: add smart commit generation', branch: 'main', color: '#b8ff1f' },
  { hash: 'e4f5g6h', message: 'fix: resolve push retry logic', branch: 'fix/push', color: '#60a5fa' },
  { hash: 'i7j8k9l', message: 'docs: update configuration guide', branch: 'main', color: '#b8ff1f' },
  { hash: 'm0n1o2p', message: 'feat: productivity insights engine', branch: 'feat/insights', color: '#34d399' },
  { hash: 'q3r4s5t', message: 'chore: bump version to 4.0.2', branch: 'main', color: '#b8ff1f' },
];

const LABELS = [
  'feat: smart commit',
  'fix: push retry',
  'docs: configuration',
  'feat: insights',
  'chore: v4.0.2',
];

export function CommitGraphHero() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typedLabel, setTypedLabel] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      setVisibleCount(Math.min(i, COMMITS.length));
      if (i >= COMMITS.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 400);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (visibleCount === 0) return;
    const label = LABELS[visibleCount - 1] || '';
    let charIdx = 0;
    setTypedLabel('');
    const t = setInterval(() => {
      charIdx++;
      setTypedLabel(label.slice(0, charIdx));
      if (charIdx >= label.length) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [visibleCount]);

  const W = 320, H = 180;
  const nodeR = 7;
  const mainX = 60;
  const branchX = 130;
  const rowH = H / (COMMITS.length + 1);

  const nodes = COMMITS.map((c, i) => {
    const isBranch = c.branch !== 'main';
    return { x: isBranch ? branchX : mainX, y: rowH * (i + 1), ...c, isBranch };
  });

  return (
    <div className="relative flex flex-col items-center justify-center bg-[#050816] rounded-2xl border border-[#263244] p-6 shadow-2xl">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {/* Main branch line */}
        <line x1={mainX} y1={rowH * 0.5} x2={mainX} y2={rowH * (COMMITS.length + 0.5)} stroke="#263244" strokeWidth={2} />
        {/* Branch lines */}
        {nodes.filter(n => n.isBranch).map((n, i) => (
          <g key={`branch-line-${i}`}>
            <line x1={mainX} y1={n.y} x2={n.x} y2={n.y} stroke={n.color} strokeWidth={1.5} opacity={0.5} strokeDasharray="4 2" />
          </g>
        ))}
        {/* Commit nodes */}
        {nodes.map((n, i) => (
          <g key={n.hash}>
            {i < visibleCount && (
              <>
                <circle
                  cx={n.x} cy={n.y} r={nodeR}
                  fill={n.color}
                  opacity={0.15}
                  className="commit-node-in"
                />
                <circle
                  cx={n.x} cy={n.y} r={nodeR / 2}
                  fill={n.color}
                  className="commit-node-in"
                />
                <text
                  x={n.isBranch ? n.x + 16 : n.x + 16}
                  y={n.y + 4}
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {n.hash.slice(0, 7)}
                </text>
                <text
                  x={n.isBranch ? n.x + 70 : n.x + 70}
                  y={n.y + 4}
                  fill="#e2e8f0"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {n.message.length > 22 ? n.message.slice(0, 22) + '…' : n.message}
                </text>
              </>
            )}
          </g>
        ))}
      </svg>
      <div className="mt-4 flex items-center justify-center gap-2 font-mono text-xs text-muted-foreground h-5">
        <span>$ autopilot log --oneline -1</span>
      </div>
      <div className="mt-1 flex items-center justify-center gap-1 font-mono text-sm text-foreground h-6">
        <span>{typedLabel}</span>
        <span className="cursor-blink text-link">▌</span>
      </div>
    </div>
  );
}
