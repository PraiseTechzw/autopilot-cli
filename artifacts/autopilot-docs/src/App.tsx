import { Route, Switch } from 'wouter';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SidebarProvider } from '@/components/SidebarProvider';
import { Topbar } from '@/components/Topbar';
import { Footer } from '@/components/Footer';
import { MobileMenu } from '@/components/MobileMenu';
import { VersionBadge } from '@/components/VersionBadge';
import HomePage from '@/pages/Home';
import DocsPage from '@/pages/Docs';
import LeaderboardPage from '@/pages/Leaderboard';
import NotFound from '@/pages/NotFound';

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/docs" component={DocsPage} />
      <Route path="/docs/:slug*" component={DocsPage} />
      <Route path="/leaderboard" component={LeaderboardPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="autopilot-theme">
      <SidebarProvider>
        <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
          <Topbar versionBadge={<VersionBadge />} />
          <MobileMenu />
          <div className="flex-1 flex flex-col">
            <Router />
          </div>
          <Footer />
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
}
