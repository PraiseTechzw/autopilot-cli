export interface NavItem {
  title: string;
  href: string;
  external?: boolean;
  badge?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Introduction', href: '/docs' },
      { title: 'Installation', href: '/docs/installation' },
      { title: 'Quick Start', href: '/docs/quick-start' },
      { title: 'Interactive Web Tool', href: '/playground', badge: 'Live' },
    ],
  },
  {
    title: 'Guides',
    items: [
      { title: 'Configuration', href: '/docs/configuration' },
      { title: 'Productivity & Leaderboard', href: '/docs/productivity' },
      { title: 'Safety Rails', href: '/docs/safety' },
      { title: 'Advanced Usage', href: '/docs/advanced-usage' },
      { title: 'Troubleshooting', href: '/docs/troubleshooting' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { title: 'CLI Reference', href: '/docs/commands' },
      { title: 'Security', href: '/docs/security' },
      { title: 'Benchmarks', href: '/docs/benchmarks' },
      { title: 'Extensibility', href: '/docs/extensibility' },
    ],
  },
  {
    title: 'Community & Standards',
    items: [
      { title: 'Contributing', href: '/docs/contributing' },
      { title: 'Changelog', href: '/docs/changelog' },
      { title: 'Roadmap', href: '/docs/roadmap' },
      { title: 'Localization', href: '/docs/localization' },
      { title: 'Accessibility', href: '/docs/accessibility' },
      { title: 'GitHub Repository', href: 'https://github.com/PraiseTechzw/autopilot-cli', external: true },
    ],
  },
];
