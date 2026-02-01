import Link from 'next/link';
import { REPO_URL, ISSUES_URL, RELEASES_URL } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <p className="text-sm font-semibold text-foreground">
              Autopilot CLI
            </p>
            <p className="text-sm text-muted-foreground">
              Automated git operations for busy developers.
            </p>
          </div>
          
          <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/docs" className="hover:text-link transition-colors">Documentation</Link>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-link transition-colors">GitHub</a>
            <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer" className="hover:text-link transition-colors">Releases</a>
            <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer" className="hover:text-link transition-colors">Issues</a>
            <a href="https://www.npmjs.com/package/autopilot-cli" target="_blank" rel="noopener noreferrer" className="hover:text-link transition-colors">NPM</a>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Autopilot CLI. Released under MIT License.
          </p>
          <p>
            Built by <a href="https://github.com/PraiseTechzw" target="_blank" rel="noopener noreferrer" className="font-medium hover:text-foreground transition-colors">Praise Masunga (PraiseTechzw)</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
