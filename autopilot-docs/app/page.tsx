import Link from 'next/link';
import { ArrowRight, Download, Play, Terminal, ShieldCheck, Eye, Lock, Laptop, CheckCircle2 } from 'lucide-react';
import { FeatureShowcase } from '@/components/FeatureShowcase';
import { InstallCommand } from '@/components/InstallCommand';

import { REPO_URL, NPM_URL } from '@/lib/constants';
import { getWeeklyDownloads, getTotalDownloads } from '@/lib/npm';
import { CommitGraphHero } from '@/components/Commitgraphhero';
import { ScrollReveal } from '@/components/Scrollreveal';

export default async function Home() {
  const [weeklyDownloads, totalDownloads] = await Promise.all([
    getWeeklyDownloads(),
    getTotalDownloads(),
  ]);

  const displayDownloads = totalDownloads || weeklyDownloads || 0;
  const downloadLabel = totalDownloads ? 'Total Downloads' : 'Weekly Downloads';

  // Note: aggregateRating was intentionally removed. A single self-reported
  // rating in structured data reads as manipulated and risks a Google
  // manual action. Re-add once there's real, multi-source review data.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Autopilot CLI',
    operatingSystem: 'Windows, macOS, Linux',
    applicationCategory: 'DeveloperApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'An intelligent Git automation CLI that safely commits and pushes your code so you can focus on building.',
    author: {
      '@type': 'Person',
      name: 'Praise Masunga',
    },
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative py-28 px-4 text-center overflow-hidden">
        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="flex justify-center mb-8 animate-fade-in">
            <a
              href={NPM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border hover:bg-secondary/80 hover:border-link/30 transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Download className="h-4 w-4 text-link group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-foreground">
                {displayDownloads.toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">{downloadLabel}</span>
            </a>
          </div>

          <div className="flex justify-center mb-8 animate-fade-in">
            <Link
              href="/docs/changelog"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-link/10 border border-link/20 text-link text-sm font-semibold hover:bg-link/15 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="inline-block h-2 w-2 rounded-full bg-link" />
              v4.0.0 is live
            </Link>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.08] animate-fade-in">
            Git automation that
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-link via-lime-400 to-emerald-500 dark:from-link dark:via-lime-400 dark:to-emerald-400">
              respects your control
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in">
            Autopilot watches your files, writes the commit, and pushes it —
            <br className="hidden md:block" />
            so you stay in flow instead of context-switching to Git.
          </p>

          {/* Signature element: the tool's own output, animated */}
          <CommitGraphHero />

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-14 mb-10 animate-fade-in">
            <Link
              href="/docs"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-link text-white font-bold hover:bg-link-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-link/20 hover:shadow-link/30 hover:scale-105 active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-background text-foreground font-bold border border-border hover:bg-muted transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              GitHub Repo
            </Link>
          </div>

          <div className="flex flex-col items-center gap-3 animate-fade-in mb-12">
            <div className="px-4 py-2 rounded-lg bg-link/10 border border-link/20 text-link text-sm font-mono flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              <span>npx @traisetech/autopilot guide</span>
            </div>
            <p className="text-xs text-muted-foreground italic">
              New to Git entirely? The interactive guide explains each step in plain language.
            </p>
          </div>

          <InstallCommand />

          <p className="mt-6 font-mono text-xs text-muted-foreground/70 tracking-wide">
            <span className="text-link">●</span> local-first &nbsp;
            <span className="text-link">●</span> privacy-focused &nbsp;
            <span className="text-link">●</span> developer-trust-first
          </p>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-24 px-4 bg-secondary/30 border-y border-border">
        <div className="container mx-auto max-w-6xl">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
                Built on trust and transparency
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Autopilot is designed with hard guarantees that protect your code, your workflow,
                and your peace of mind.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: 'Safety first',
                description:
                  'Never force-pushes. Never commits secrets. Never operates during merge conflicts. Automation stops the moment anything is ambiguous.',
                color: 'text-link',
                bg: 'bg-link/10',
              },
              {
                icon: Eye,
                title: 'Full transparency',
                description:
                  'Every commit is explainable and reversible with undo. AI assists — it never decides on your behalf.',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10',
              },
              {
                icon: Lock,
                title: 'Privacy guaranteed',
                description:
                  'Your source code never leaves your machine unless you opt in to AI commit messages. Productivity metrics are anonymized and contain zero code.',
                color: 'text-lime-400',
                bg: 'bg-lime-500/10',
              },
              {
                icon: Laptop,
                title: 'Local first',
                description:
                  'Runs entirely on your machine. Works offline for everything except AI-generated messages. Your workflow, your rules.',
                color: 'text-slate-300',
                bg: 'bg-slate-500/10',
              },
            ].map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 80}>
                <PrincipleCard {...p} />
              </ScrollReveal>
            ))}
          </div>

          {/* Guarantees, styled after a verified commit trailer block */}
          <ScrollReveal delay={200}>
            <div className="mt-16 rounded-2xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-border bg-secondary/40">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="font-mono text-xs text-muted-foreground">
                  commit --verify · non-negotiable guarantees
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 px-6 py-6">
                {[
                  'No force-pushes, ever',
                  'Ignored files are never committed',
                  '.env files and secrets are never committed',
                  'Nothing runs during an active merge or rebase',
                  'Code is never sent externally without explicit opt-in',
                  'Every automated action can be undone',
                ].map((guarantee) => (
                  <div key={guarantee} className="flex items-start gap-2 font-mono text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-foreground/90">{guarantee}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Commands Reference */}
      <section className="py-24 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Command reference</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Everything Autopilot can do, in nine commands.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { command: 'autopilot init', description: 'Set up safety rails and configuration for your repository.', group: 'Setup' },
              { command: 'autopilot start', description: 'Start the intelligent background watcher.', group: 'Core' },
              { command: 'autopilot dashboard', description: 'Open the real-time terminal dashboard.', group: 'Visibility' },
              { command: 'autopilot insights', description: 'View productivity metrics and commit quality scores.', group: 'Analytics' },
              { command: 'autopilot leaderboard', description: 'Sync and view your global ranking.', group: 'Social' },
              { command: 'autopilot undo', description: 'Safely revert the last automated commit.', group: 'Safety' },
              { command: 'autopilot doctor', description: 'Diagnose environment and setup issues.', group: 'Maintenance' },
              { command: 'autopilot guide', description: 'An interactive walkthrough of the tool.', group: 'Education' },
              { command: 'autopilot config', description: 'Manage local and global configuration.', group: 'Advanced' },
            ].map((c, i) => (
              <ScrollReveal key={c.command} delay={(i % 3) * 80}>
                <CommandCard {...c} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <FeatureShowcase />

      {/* How it works */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-center mb-16 text-foreground">How it works</h2>
          </ScrollReveal>

          <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 md:before:ml-[50%] before:-translate-x-px md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            <ScrollReveal>
              <Step
                number="01"
                title="Initialize"
                description="Navigate to your project and run init. This sets up configuration and ignore files — and creates a git repo for you if you don't have one yet."
                command="autopilot init"
                icon={<Terminal className="h-5 w-5" />}
              />
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <Step
                number="02"
                title="Start watching"
                description="Start the watcher. Autopilot monitors your files and syncs changes automatically, in the background."
                command="autopilot start"
                icon={<Play className="h-5 w-5" />}
                reverse
              />
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <Step
                number="03"
                title="Check in anytime"
                description="See what's happening, or stop the watcher when you're done for the day."
                command="autopilot status"
                icon={<Eye className="h-5 w-5" />}
              />
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  command,
  icon,
  reverse,
}: {
  number: string;
  title: string;
  description: string;
  command: string;
  icon: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div
      className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group ${reverse ? 'md:flex-row-reverse' : ''}`}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-link/10 text-link font-mono font-bold text-xs z-10 shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2 shadow-sm">
        {number}
      </div>

      <div className="w-[calc(100%-3.5rem)] md:w-[calc(50%-2rem)] p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md hover:border-link/30 transition-all ml-4 md:ml-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-muted rounded-lg text-muted-foreground">{icon}</div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>
        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">{description}</p>
        <div className="bg-[#050816] rounded-lg p-3 font-mono text-xs text-gray-300 flex items-center gap-2 border border-[#263244]">
          <span className="text-link">$</span> {command}
        </div>
      </div>
    </div>
  );
}

function PrincipleCard({
  icon: Icon,
  title,
  description,
  color,
  bg,
}: {
  icon: any;
  title: string;
  description: string;
  color: string;
  bg: string;
}) {
  return (
    <div className="group h-full p-6 bg-card rounded-2xl border border-border hover:border-border/60 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div
        className={`inline-flex p-3 rounded-xl ${bg} ${color} mb-4 group-hover:scale-110 transition-transform`}
      >
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function CommandCard({
  command,
  description,
  group,
}: {
  command: string;
  description: string;
  group: string;
}) {
  return (
    <div className="group relative h-full p-8 bg-card rounded-2xl border border-border hover:border-link/50 transition-all duration-500 flex flex-col justify-between overflow-hidden">
      <div className="absolute -right-12 -top-12 h-24 w-24 bg-link/10 blur-3xl group-hover:bg-link/20 transition-all duration-500 rounded-full" />

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <span className="px-3 py-1 rounded-full bg-link/10 text-[10px] font-black uppercase tracking-widest text-link border border-link/20">
            {group}
          </span>
          <Terminal className="h-4 w-4 text-muted-foreground/30 group-hover:text-link/50 transition-colors" />
        </div>

        <div className="font-mono text-sm bg-secondary/50 dark:bg-black/40 p-4 rounded-xl mb-6 border border-border group-hover:border-link/30 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all duration-300">
          <div className="flex items-center gap-2">
            <span className="text-link font-bold select-none">$</span>
            <span className="text-foreground font-medium">{command}</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors">
          {description}
        </p>
      </div>

      <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-link to-emerald-500 group-hover:w-full transition-all duration-700" />
    </div>
  );
}
