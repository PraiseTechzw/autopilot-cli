import { DocLayout } from '@/components/DocLayout';
import { getAllDocs } from '@/lib/mdx';
import { getLatestVersion, getWeeklyDownloads } from '@/lib/npm';

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const docs = getAllDocs();
  const [version, downloads] = await Promise.all([
    getLatestVersion(),
    getWeeklyDownloads(),
  ]);

  return (
    <DocLayout docs={docs} stats={{ version, downloads }}>
      {children}
    </DocLayout>
  );
}
