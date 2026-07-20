import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import {
  ArrowRight, Download, Play, Terminal, ShieldCheck, Eye, Lock, Laptop, CheckCircle2
} from 'lucide-react';
import { FeatureShowcase } from '@/components/FeatureShowcase';
import { InstallCommand } from '@/components/InstallCommand';
import { CommitGraphHero } from '@/components/CommitGraphHero';
import { ScrollReveal } from '@/components/ScrollReveal';
import { REPO_URL, NPM_URL } from '@/lib/constants';

const principles = [
  {
    icon: ShieldCheck, title: 'Safety First',
    description: 'Every commit is reviewed before push. Secret scanning, large-file checks, and merge-conflict detection built in.',
    color: 'text-link', bg: 'bg-link/10',
  },
  {
    icon: Eye, title: 'Full Transparency',
    description: 'Every action is logged. You always know exactly what Autopilot did, when, and why.',
    color: 'text-sky-400', bg: 'bg-sky-500/10',
  },
  {
    icon: Lock, title: 'Privacy Respected',
    description: 'Your code never leaves your machine. AI features are opt-in and clearly disclosed.',
    color: 'text-violet-400', bg: 'bg-violet-500/10',
  },
  {
    icon: Laptop, title: 'Local-First',
    description: 'Works offline. No accounts required. Everything runs on your machine by default.',
    color: 'text-emerald-400', bg: 'bg-emerald-500/10',
  },
];

const commands = [
  { command: 'autopilot start', description: 'Start the background watcher — it commits and pushes automatically as you work.', group: 'Core' },
  { command: 'autopilot stop', description: 'Gracefully stop the watcher and push any pending changes.', group: 'Core' },
  { command: 'autopilot undo', description: 'Revert the last autopilot commit, unstaging changes back to your working directory.', group: 'Safety' },
  { command: 'autopilot insights', description: 'View your productivity stats: focus time, streak, commit quality score, and more.', group: 'Productivity' },
  { command: 'autopilot preset safe-team', description: 'Apply a team preset that enforces pull-before-push, secret scanning, and large-file guards.', group: 'Config' },
  { command: 'autopilot leaderboard', description: 'Sync your stats to the global leaderboard and see where you rank.', group: 'Community' },
];

export default function HomePage() {
  const [displayDownloads, setDisplayDownloads] = useState<number>(0);
  const [downloadLabel, setDownloadLabel] = useState('Weekly Downloads');

  useEffect(() => {
    document.title = 'Autopilot CLI — Intelligent Git Automation';
    fetch('/api/downloads')
      .then(r => r.json())
      .then((d: { weekly?: number; total?: number }) => {
        if (d.total && d.total > 0) { setDisplayDownloads(d.total); setDownloadLabel('Total Downloads'); }
        else if (d.weekly && d.weekly > 0) { setDisplayDownloads(d.weekly); setDownloadLabel('Weekly Downloads'); }
      })
      .catch(() => {});
  }, []);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Autopilot CLI',
    operatingSystem: 'Windows, macOS, Linux',
    applicationCategory: 'DeveloperApplication',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: 'An intelligent Git automation CLI that safely commits and pushes your code so you can focus on building.',
    author: { '@type': 'Person', name: 'Praise Masunga' },
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative py-28 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(184,255,31,0.08),transparent_60%)]" />
        <div className="container mx-auto max-w-5xl relative z-10">
          {displayDownloads > 0 && (
            <div className="flex justify-center mb-8 animate-fade-in">
              <a href={NPM_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border hover:bg-secondary/80 hover:border-link/30 transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link">
                <Download className="h-4 w-4 text-link group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold text-foreground">{displayDownloads.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">{downloadLabel}</span>
              </a>
            </div>
          )}

          <div className="flex justify-center mb-8 animate-fade-in">
            <Link href="/docs/changelog"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-link/10 border border-link/20 text-link text-sm font-semibold hover:bg-link/15 transition-all">
              <span className="inline-block h-2 w-2 rounded-full bg-link" />
              v4.0.2 is live
            </Link>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.08] animate-fade-in">
            Git automation that
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-link via-lime-400 to-emerald-500">
              respects your control
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in">
            Autopilot CLI watches your files and commits + pushes automatically — with safety rails, full transparency, and zero lock-in.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in">
            <Link href="/docs/quick-start"
              className="inline-flex items-center gap-2 px-8 py-4 bg-link text-black font-bold rounded-2xl hover:bg-link-hover transition-all hover:scale-105 shadow-lg shadow-link/20">
              <Play className="h-5 w-5" />
              Quick Start
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/docs"
              className="inline-flex items-center gap-2 px-8 py-4 bg-card text-foreground font-bold rounded-2xl border border-border hover:border-link/30 hover:bg-card/80 transition-all">
              <Terminal className="h-5 w-5" />
              Documentation
            </Link>
          </div>

          <div className="animate-fade-in max-w-xl mx-auto">
            <InstallCommand />
          </div>
        </div>
      </section>

      {/* Commit Graph Hero */}
      <section className="py-16 px-4 bg-gradient-to-b from-transparent to-card/30">
        <div className="container mx-auto max-w-5xl">
          <ScrollReveal className="text-center mb-12">
            <span className="text-xs font-bold text-link uppercase tracking-widest mb-3 block">Live Preview</span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Watch it work in real time</h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <CommitGraphHero />
          </ScrollReveal>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <ScrollReveal className="text-center mb-16">
            <span className="text-xs font-bold text-link uppercase tracking-widest mb-3 block">What it does</span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Everything Git, handled</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From smart commit messages to productivity insights — Autopilot handles the ceremony so you can focus on building.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <FeatureShowcase />
          </ScrollReveal>
        </div>
      </section>

      {/* Principles */}
      <section className="py-24 px-4 bg-card/20">
        <div className="container mx-auto max-w-5xl">
          <ScrollReveal className="text-center mb-16">
            <span className="text-xs font-bold text-link uppercase tracking-widest mb-3 block">Our principles</span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Built on trust</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Automation shouldn't mean losing control. Autopilot is designed around four non-negotiable principles.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {principles.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 80}>
                <FeatureCard {...p} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Commands */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-5xl">
          <ScrollReveal className="text-center mb-16">
            <span className="text-xs font-bold text-link uppercase tracking-widest mb-3 block">Full control</span>
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Every command you need</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {commands.map((cmd, i) => (
              <ScrollReveal key={cmd.command} delay={i * 60}>
                <CommandCard {...cmd} />
              </ScrollReveal>
            ))}
          </div>
          <ScrollReveal delay={200} className="text-center mt-12">
            <Link href="/docs/commands" className="inline-flex items-center gap-2 text-link font-semibold hover:underline">
              View all commands <ArrowRight className="h-4 w-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 border-t border-border">
        <div className="container mx-auto max-w-3xl text-center">
          <ScrollReveal>
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-6 leading-tight">
              Start shipping,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-link to-emerald-400">stop stressing about commits</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-10">
              Free forever. Open source. No account required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Link href="/docs/installation"
                className="inline-flex items-center gap-2 px-8 py-4 bg-link text-black font-bold rounded-2xl hover:bg-link-hover transition-all hover:scale-105">
                <Download className="h-5 w-5" />Install now
              </Link>
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-card text-foreground font-bold rounded-2xl border border-border hover:border-link/30 transition-all">
                <CheckCircle2 className="h-5 w-5" />Star on GitHub
              </a>
            </div>
            <InstallCommand />
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color, bg }: {
  icon: React.ElementType; title: string; description: string; color: string; bg: string;
}) {
  return (
    <div className="group h-full p-6 bg-card rounded-2xl border border-border hover:border-border/60 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className={`inline-flex p-3 rounded-xl ${bg} ${color} mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function CommandCard({ command, description, group }: { command: string; description: string; group: string }) {
  return (
    <div className="group relative h-full p-6 bg-card rounded-2xl border border-border hover:border-link/50 transition-all duration-500 flex flex-col justify-between overflow-hidden">
      <div className="absolute -right-12 -top-12 h-24 w-24 bg-link/10 blur-3xl group-hover:bg-link/20 transition-all duration-500 rounded-full" />
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <span className="px-3 py-1 rounded-full bg-link/10 text-[10px] font-black uppercase tracking-widest text-link border border-link/20">{group}</span>
          <Terminal className="h-4 w-4 text-muted-foreground/30 group-hover:text-link/50 transition-colors" />
        </div>
        <div className="font-mono text-sm bg-secondary/50 dark:bg-black/40 p-3 rounded-xl mb-4 border border-border group-hover:border-link/30 transition-all duration-300">
          <div className="flex items-center gap-2">
            <span className="text-link font-bold select-none">$</span>
            <span className="text-foreground font-medium">{command}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">{description}</p>
      </div>
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-link to-emerald-500 group-hover:w-full transition-all duration-700" />
    </div>
  );
}
