import { useState } from 'react';
import { GitCommit, Zap, Shield, Settings } from 'lucide-react';
import { TerminalDemo, TerminalStep } from './TerminalDemo';
import clsx from 'clsx';

const features = [
  {
    id: 'commits',
    title: 'Smart Commits',
    description: 'Generates professional conventional commit messages automatically based on your changes.',
    icon: GitCommit,
    color: 'text-link',
    bg: 'bg-link/10',
    steps: [
      { text: 'autopilot start', type: 'command' },
      { text: 'Starting Autopilot', type: 'section', delay: 200 },
      { text: 'Press Ctrl+C to stop, or run "autopilot stop" in another terminal.', type: 'info', delay: 400 },
      { text: 'Starting Autopilot watcher...', type: 'info', delay: 800 },
      { text: 'Autopilot is watching /Users/demo/project', type: 'success', delay: 400 },
      { text: 'Logs: /Users/demo/project/autopilot.log', type: 'info', delay: 2000 },
      { text: 'Committing changes...', type: 'info', delay: 1500 },
      { text: 'Commit done', type: 'success', delay: 800 },
      { text: 'Pushing to remote...', type: 'info', delay: 1200 },
      { text: 'Push complete', type: 'success' },
    ] as TerminalStep[],
  },
  {
    id: 'productivity',
    title: 'Productivity',
    description: 'Track your focus time, streaks, and coding habits with the built-in insights engine.',
    icon: Zap,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    steps: [
      { text: 'autopilot insights', type: 'command' },
      { text: '📊 Autopilot Productivity Insights', type: 'section', delay: 200 },
      { text: '----------------------------------------', type: 'info', delay: 100 },
      { text: 'Session Duration: 2h 15m', type: 'info', delay: 200 },
      { text: 'Active Focus Time: 1h 45m (78%)', type: 'success', delay: 200 },
      { text: 'Files Modified: 12', type: 'info', delay: 200 },
      { text: 'Commits Created: 8', type: 'info', delay: 200 },
      { text: 'Current Streak: 5 days 🔥', type: 'warning', delay: 200 },
      { text: 'Most Active Hour: 14:00 - 15:00', type: 'info', delay: 200 },
      { text: 'Commit Quality Score: 92/100', type: 'success', delay: 200 },
    ] as TerminalStep[],
  },
  {
    id: 'safety',
    title: 'Safety & Team',
    description: 'Undo accidental commits and enforce team standards with preset configurations.',
    icon: Shield,
    color: 'text-link',
    bg: 'bg-link/10',
    steps: [
      { text: 'autopilot undo', type: 'command' },
      { text: '⚠️  Undo Last Commit', type: 'section', delay: 200 },
      { text: 'Last commit: "feat: update user profile styling"', type: 'info', delay: 400 },
      { text: 'Reverting commit...', type: 'processing', delay: 600 },
      { text: 'Changes unstaged and preserved in working directory.', type: 'success', delay: 400 },
      { text: 'autopilot preset safe-team', type: 'command', delay: 1000 },
      { text: 'Applying preset: safe-team', type: 'info', delay: 400 },
      { text: '✓ Pull before push enabled', type: 'success', delay: 200 },
      { text: '✓ Secret scanning enabled', type: 'success', delay: 200 },
      { text: '✓ Large file prevention enabled', type: 'success', delay: 200 },
    ] as TerminalStep[],
  },
  {
    id: 'config',
    title: 'Zero Config',
    description: 'Works out of the box, but fully configurable via .autopilotrc.json if needed.',
    icon: Settings,
    color: 'text-slate-300',
    bg: 'bg-slate-500/10',
    steps: [
      { text: 'autopilot init', type: 'command' },
      { text: '🚀 Autopilot Init', type: 'section', delay: 400 },
      { text: 'Built by Praise Masunga (PraiseTechzw)', type: 'info', delay: 200 },
      { text: 'Initializing git automation...', type: 'processing', delay: 400 },
      { text: 'Git repository detected', type: 'success', delay: 400 },
      { text: 'Created .autopilotignore', type: 'success', delay: 200 },
      { text: 'Autopilot ready! Run "autopilot start" to begin.', type: 'success', delay: 300 },
    ] as TerminalStep[],
  },
];

export function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState(features[0].id);
  const current = features.find(f => f.id === activeFeature) || features[0];
  const Icon = current.icon;

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <div className="space-y-3">
        {features.map(f => {
          const FIcon = f.icon;
          const isActive = f.id === activeFeature;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFeature(f.id)}
              className={clsx(
                'w-full text-left p-4 rounded-xl border transition-all duration-300 group',
                isActive
                  ? 'bg-card border-link/50 shadow-lg shadow-link/5'
                  : 'bg-card/30 border-border hover:border-border/80 hover:bg-card/50'
              )}
            >
              <div className="flex items-center gap-3">
                <div className={clsx('inline-flex p-2 rounded-lg transition-colors', f.bg)}>
                  <FIcon className={clsx('h-5 w-5', f.color)} />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm">{f.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{f.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="lg:sticky lg:top-24">
        <div className="flex items-center gap-2 mb-3">
          <div className={clsx('p-1.5 rounded-lg', current.bg)}>
            <Icon className={clsx('h-4 w-4', current.color)} />
          </div>
          <span className="text-sm font-medium text-foreground">{current.title}</span>
        </div>
        <TerminalDemo key={activeFeature} steps={current.steps} />
      </div>
    </div>
  );
}
