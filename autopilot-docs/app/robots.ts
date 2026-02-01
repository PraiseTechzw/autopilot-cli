import { MetadataRoute } from 'next';

const BASE_URL = 'https://autopilot-cli.com'; // Replace with actual domain

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
