'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Shield, Zap, GitCommit, Terminal, Check, Copy, Play, Settings, AlertCircle } from 'lucide-react';
import { REPO_URL } from '@/lib/constants';

export default function Home() {
  const [copied, setCopied] = useState(false);

  const onCopy = () => {
    navigator.clipboard.writeText('npm install -g @traisetech/autopilot');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero */}
      <section className="py-24 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
          Autopilot CLI — Git automation with safety rails
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
          Automatic commits & pushes so you stay focused on coding.
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

        <div className="max-w-xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative bg-gray-900 rounded-lg p-4 text-left shadow-2xl flex items-center justify-between">
            <div className="flex gap-3 overflow-x-auto">
              <span className="text-green-400 select-none">$</span>
              <code className="font-mono text-sm text-gray-100 whitespace-nowrap">
                npm install -g @traisetech/autopilot
              </code>
            </div>
            <button
              onClick={onCopy}
              className="ml-4 p-2 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white transition-colors flex-shrink-0"
              aria-label="Copy install command"
            >
              {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<GitCommit className="h-6 w-6 text-white" />}
              iconBg="bg-blue-500"
              title="Smart Commits"
              description="Generates professional conventional commit messages automatically based on your changes."
            />
            <FeatureCard 
              icon={<Zap className="h-6 w-6 text-white" />}
              iconBg="bg-yellow-500"
              title="Watcher Engine"
              description="Real-time file monitoring with smart debouncing using chokidar to catch every save."
            />
            <FeatureCard 
              icon={<Shield className="h-6 w-6 text-white" />}
              iconBg="bg-green-500"
              title="Safety First"
              description="Blocks commits on protected branches and checks remote status to prevent conflicts."
            />
            <FeatureCard 
              icon={<Settings className="h-6 w-6 text-white" />}
              iconBg="bg-purple-500"
              title="Zero Config"
              description="Works out of the box, but fully configurable via .autopilotrc.json if needed."
            />
          </div>
        </div>
      </section>

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

      {/* Footer */}
      <footer className="py-12 border-t border-gray-200 dark:border-gray-800 mt-auto bg-gray-50 dark:bg-gray-900/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Built by <a href="https://github.com/PraiseTechzw" className="text-blue-600 dark:text-blue-400 hover:underline decoration-2 underline-offset-2 transition-colors">Praise Masunga (PraiseTechzw)</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, iconBg, title, description }: { icon: React.ReactNode, iconBg: string, title: string, description: string }) {
  return (
    <div className="bg-card p-8 rounded-2xl shadow-sm border border-border hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center mb-6 shadow-lg shadow-muted/50`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
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
