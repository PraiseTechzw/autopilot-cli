import { DocLayout } from '@/components/DocLayout';
import { getAllDocs } from '@/lib/mdx';
import { getLatestVersion, getTotalDownloads } from '@/lib/npm';

export default async function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const docs = getAllDocs();
  const [version, downloads] = await Promise.all([
    getLatestVersion(),
    getTotalDownloads(),
  ]);

  return (
    <DocLayout docs={docs} stats={{ version, downloads }}>
      {children}
    </DocLayout>
  );
}
