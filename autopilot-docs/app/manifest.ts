import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Autopilot CLI',
    short_name: 'Autopilot',
    description: 'Intelligent Git automation with safety rails',
    start_url: '/',
    display: 'standalone',
    background_color: '#050816',
    theme_color: '#b8ff1f',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
