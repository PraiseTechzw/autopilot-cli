export interface NavItem {
  title: string;
  href: string;
  external?: boolean;
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
    ],
  },
  {
    title: 'Guides',
    items: [
      { title: 'Configuration', href: '/docs/configuration' },
      { title: 'Productivity & Leaderboard', href: '/docs/productivity' },
      { title: 'Safety Features', href: '/docs/safety' },
      { title: 'Troubleshooting', href: '/docs/troubleshooting' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { title: 'Commands', href: '/docs/commands' },
    ],
  },
  {
    title: 'Community',
    items: [
      { title: 'Contributing', href: '/docs/contributing' },
      { title: 'Changelog', href: '/docs/changelog' },
      { title: 'GitHub', href: 'https://github.com/PraiseTechzw/autopilot-cli', external: true },
    ],
  },
];
