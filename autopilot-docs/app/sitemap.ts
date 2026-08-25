import { MetadataRoute } from 'next';
import { getAllDocs } from '@/lib/mdx';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://autopilot-cli.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const docs = getAllDocs();

  const docUrls = docs.filter((doc) => doc.route !== '/docs').map((doc) => ({
    url: `${BASE_URL}${doc.route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/docs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/leaderboard`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    ...docUrls,
  ];
}
