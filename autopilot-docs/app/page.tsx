import Link from 'next/link';
import { AlertCircle, ArrowRight, Download, Play, Terminal } from 'lucide-react';
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
      <section className="py-24 px-4 text-center">
        {/* Stats Badge */}
        <div className="flex justify-center mb-8">
          <a
            href={NPM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border hover:bg-secondary/80 hover:border-link/30 transition-all cursor-pointer animate-fade-in group"
          >
            <Download className="h-3.5 w-3.5 text-link group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-foreground">{displayDownloads.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">{downloadLabel}</span>
          </a>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
          An intelligent Git automation CLI that safely commits and pushes your code so you can focus on building.
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
          Focus on building. We'll handle the git.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link 
            href="/docs"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-link text-white font-semibold hover:bg-link-hover transition-all flex items-center justify-center gap-2 shadow-lg shadow-link/20 hover:shadow-link/30"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-background text-foreground font-semibold border border-border hover:bg-muted transition-all flex items-center justify-center gap-2"
          >
            GitHub Repo
          </Link>
        </div>

        <InstallCommand />
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
              description="Start the background daemon. Autopilot will now monitor your files and sync changes automatically."
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
