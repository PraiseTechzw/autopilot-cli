import Link from 'next/link';
import { AlertCircle, ArrowRight, Download, Play, Terminal, Shield, Eye, Lock, Laptop } from 'lucide-react';
import { FeatureShowcase } from '@/components/FeatureShowcase';
import { InstallCommand } from '@/components/InstallCommand';
import { REPO_URL, NPM_URL } from '@/lib/constants';
import { getWeeklyDownloads, getTotalDownloads } from '@/lib/npm';

export default async function Home() {
  const [weeklyDownloads, totalDownloads] = await Promise.all([
    getWeeklyDownloads(),
    getTotalDownloads()
  ]);

  const displayDownloads = totalDownloads || weeklyDownloads || 0;
  const downloadLabel = totalDownloads ? 'Total Downloads' : 'Weekly Downloads';

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
    description: 'An intelligent Git automation CLI that safely commits and pushes your code so you can focus on building.',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5.0',
      ratingCount: '1',
    },
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
      <section className="relative py-32 px-4 text-center overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(99,102,241,0.05),transparent_50%)]" />

        <div className="container mx-auto max-w-5xl relative z-10">
          {/* Stats Badge */}
          <div className="flex justify-center mb-8 animate-fade-in">
            <a
              href={NPM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border hover:bg-secondary/80 hover:border-link/30 transition-all cursor-pointer group"
            >
              <Download className="h-4 w-4 text-link group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold text-foreground">{displayDownloads.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">{downloadLabel}</span>
            </a>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.08] animate-fade-in">
            Git automation that
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
              respects your control
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed animate-fade-in">
            An intelligent CLI that safely commits and pushes your code,
            <br className="hidden md:block" />
            so you can stay in your flow state.
          </p>

          <p className="text-base text-muted-foreground/80 mb-12 max-w-2xl mx-auto font-medium animate-fade-in">
            Local-first • Privacy-focused • Developer-trust-first
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in">
            <Link
              href="/docs"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-link text-white font-bold hover:bg-link-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-link/20 hover:shadow-link/30 hover:scale-105 active:scale-100"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-background text-foreground font-bold border border-border hover:bg-muted transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-100"
            >
              GitHub Repo
            </Link>
          </div>

          <InstallCommand />
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-24 px-4 bg-secondary/30 border-y border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Built on Trust & Transparency</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Autopilot CLI is designed with hard guarantees that protect your code, your workflow, and your peace of mind.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PrincipleCard
              icon={Shield}
              title="Safety First"
              description="Never force-pushes. Never commits secrets. Never operates during merge conflicts. Automation stops when ambiguity starts."
              color="text-green-500"
              bg="bg-green-500/10"
            />
            <PrincipleCard
              icon={Eye}
              title="Full Transparency"
              description="Every commit is explainable and reversible via undo. AI assists, but never decides. You stay in control."
              color="text-blue-500"
              bg="bg-blue-500/10"
            />
            <PrincipleCard
              icon={Lock}
              title="Privacy Guaranteed"
              description="Your source code never leaves your machine. Metrics are opt-in, anonymized, and contain zero code or diffs."
              color="text-purple-500"
              bg="bg-purple-500/10"
            />
            <PrincipleCard
              icon={Laptop}
              title="Local First"
              description="100% local operation. No external dependencies required. Works offline. Your workflow, your machine, your rules."
              color="text-orange-500"
              bg="bg-orange-500/10"
            />
          </div>

          {/* Hard Guarantees */}
          <div className="mt-16 p-8 rounded-2xl border-2 border-destructive/20 bg-destructive/5">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
              <Shield className="h-5 w-5 text-destructive" />
              Hard Guarantees (Non-Negotiable)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {[
                'Never force-push',
                'Never commit ignored files',
                'Never commit .env or secrets',
                'Never operate during merge/rebase',
                'Never send code externally without opt-in',
                'All automation is reversible via undo'
              ].map((guarantee, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-destructive mt-0.5">✗</span>
                  <span className="text-muted-foreground font-medium">{guarantee}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <FeatureShowcase />

      {/* How it works */}
      <section className="py-24 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center mb-16 text-foreground">How it works</h2>

          <div className="space-y-12 relative before:absolute before:inset-0 before:ml-5 md:before:ml-[50%] before:-translate-x-px md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            <Step
              number="1"
              title="Initialize"
              description="Navigate to your project and run init. This sets up the configuration and ignore files."
              command="autopilot init"
              icon={<Terminal className="h-5 w-5" />}
            />
            <Step
              number="2"
              title="Start Watching"
              description="Start the foreground watcher. Autopilot will now monitor your files and sync changes automatically."
              command="autopilot start"
              icon={<Play className="h-5 w-5" />}
              reverse
            />
            <Step
              number="3"
              title="Manage"
              description="Check status or stop the watcher when you're done for the day."
              command="autopilot status"
              icon={<AlertCircle className="h-5 w-5" />}
            />
          </div>
        </div>
      </section>

      {/* Footer is handled by layout */}
    </div>
  );
}

function Step({ number, title, description, command, icon, reverse }: { number: string, title: string, description: string, command: string, icon: React.ReactNode, reverse?: boolean }) {
  return (
    <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group ${reverse ? 'md:flex-row-reverse' : ''}`}>
      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-blue-500/10 text-link font-bold z-10 shrink-0 md:absolute md:left-1/2 md:-translate-x-1/2 shadow-sm">
        {number}
      </div>

      <div className={`w-[calc(100%-3.5rem)] md:w-[calc(50%-2rem)] p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow ml-4 md:ml-0`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-muted rounded-lg text-muted-foreground">
            {icon}
          </div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
        </div>
        <p className="text-muted-foreground mb-4 text-sm leading-relaxed">{description}</p>
        <div className="bg-[#1c1c1c] rounded-lg p-3 font-mono text-xs text-gray-300 flex items-center gap-2">
          <span className="text-green-400">$</span> {command}
        </div>
      </div>
    </div>
  );
}

function PrincipleCard({ icon: Icon, title, description, color, bg }: { icon: any, title: string, description: string, color: string, bg: string }) {
  return (
    <div className="group p-6 bg-card rounded-2xl border border-border hover:border-border/60 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className={`inline-flex p-3 rounded-xl ${bg} ${color} mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

