'use client';

import { useState, useEffect } from 'react';
import { GitCommit, Zap, Shield, Settings } from 'lucide-react';
import { TerminalDemo, TerminalStep } from './TerminalDemo';
import clsx from 'clsx';

const features = [
  {
    id: 'commits',
    title: 'Smart Commits',
    description: 'Generates professional conventional commit messages automatically based on your changes.',
    icon: GitCommit,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    steps: [
      { text: 'autopilot start', type: 'command' },
      { text: '[Watcher] Listening for changes in .', type: 'info', delay: 500 },
      { text: '[Change] Detected modification in src/auth.ts', type: 'warning', delay: 1500 },
      { text: '[AI] Analyzing diff...', type: 'info', delay: 1000 },
      { text: '[Commit] Generated: "feat: add jwt token refresh"', type: 'success', delay: 800 },
      { text: '[Push] Pushing to origin/main...', type: 'info', delay: 1200 },
      { text: '[Success] Changes synced!', type: 'success' }
    ] as TerminalStep[]
  },
  {
    id: 'watcher',
    title: 'Watcher Engine',
    description: 'Real-time file monitoring with smart debouncing using chokidar to catch every save.',
    icon: Zap,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    steps: [
      { text: 'autopilot start', type: 'command' },
      { text: '[Watcher] Monitoring 42 files...', type: 'info', delay: 600 },
      { text: '[Watcher] Ignore rules loaded from .gitignore', type: 'info', delay: 400 },
      { text: '[Change] src/components/Button.tsx modified', type: 'warning', delay: 2000 },
      { text: '[Debounce] Waiting for file stability...', type: 'info', delay: 800 },
      { text: '[Action] Triggering auto-commit workflow', type: 'success', delay: 600 },
      { text: '[Success] Synced in 1.2s', type: 'success' }
    ] as TerminalStep[]
  },
  {
    id: 'safety',
    title: 'Safety First',
    description: 'Blocks commits on protected branches and checks remote status to prevent conflicts.',
    icon: Shield,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    steps: [
      { text: 'autopilot start', type: 'command' },
      { text: '[Watcher] Branch: production (PROTECTED)', type: 'warning', delay: 800 },
      { text: '[Warning] Auto-push is disabled on protected branch', type: 'error', delay: 600 },
      { text: '[Change] Detected change in config.json', type: 'info', delay: 2000 },
      { text: '[Commit] Created commit a1b2c3d', type: 'success', delay: 1000 },
      { text: '[Info] Changes committed locally. Push manually when ready.', type: 'info' }
    ] as TerminalStep[]
  },
  {
    id: 'config',
    title: 'Zero Config',
    description: 'Works out of the box, but fully configurable via .autopilotrc.json if needed.',
    icon: Settings,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    steps: [
      { text: 'autopilot init', type: 'command' },
      { text: '[Config] Created .autopilotrc.json', type: 'success', delay: 800 },
      { text: '[Config] Added .autopilot to .gitignore', type: 'success', delay: 600 },
      { text: '[Info] Ready to go! Run "autopilot start"', type: 'info', delay: 1000 },
      { text: 'autopilot start', type: 'command' },
      { text: '[Watcher] Started with default settings', type: 'info' }
    ] as TerminalStep[]
  }
];

export function FeatureShowcase() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-switch features every 8 seconds if user hasn't interacted
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleFeatureClick = (index: number) => {
    setActiveFeature(index);
    setIsAutoPlaying(false);
  };

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          
          {/* Left Side: Feature List */}
          <div className="w-full lg:w-1/2 space-y-4">
            <h2 className="text-3xl font-bold mb-8">Powerful features, <br/>simple interface.</h2>
            
            <div className="space-y-2">
              {features.map((feature, index) => (
                <button
                  key={feature.id}
                  onClick={() => handleFeatureClick(index)}
                  className={clsx(
                    "w-full text-left p-4 rounded-xl transition-all duration-300 border-2",
                    activeFeature === index 
                      ? "bg-card border-primary/20 shadow-lg scale-[1.02]" 
                      : "hover:bg-card/50 border-transparent hover:border-border"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={clsx("p-2 rounded-lg shrink-0 transition-colors", activeFeature === index ? feature.bg : "bg-muted")}>
                      <feature.icon className={clsx("w-6 h-6", activeFeature === index ? feature.color : "text-muted-foreground")} />
                    </div>
                    <div>
                      <h3 className={clsx("font-semibold mb-1", activeFeature === index ? "text-foreground" : "text-muted-foreground")}>
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Side: Terminal Demo */}
          <div className="w-full lg:w-1/2">
            <div className="relative">
              {/* Glow Effect */}
              <div className={clsx(
                "absolute -inset-4 bg-gradient-to-r rounded-2xl blur-2xl opacity-30 transition-all duration-1000",
                activeFeature === 0 ? "from-blue-500 to-cyan-500" :
                activeFeature === 1 ? "from-yellow-500 to-orange-500" :
                activeFeature === 2 ? "from-green-500 to-emerald-500" :
                "from-purple-500 to-pink-500"
              )} />
              
              <TerminalDemo 
                steps={features[activeFeature].steps} 
                className="relative z-10 h-[400px]"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
