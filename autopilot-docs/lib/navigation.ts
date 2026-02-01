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
    title: 'Usage',
    items: [
      { title: 'Commands', href: '/docs/commands' },
      { title: 'Configuration', href: '/docs/configuration' },
      { title: 'Safety Features', href: '/docs/safety' },
      { title: 'Troubleshooting', href: '/docs/troubleshooting' },
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
