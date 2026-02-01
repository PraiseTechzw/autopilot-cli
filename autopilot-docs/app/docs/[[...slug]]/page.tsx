import { getDocBySlug, getDocSlugs } from '@/lib/mdx';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Pre } from '@/components/Pre';

export async function generateStaticParams() {
  const files = getDocSlugs();
  return files.map((file) => {
    const slug = file.replace(/\.mdx?$/, '');
    return {
      slug: slug === 'index' ? [] : [slug],
    };
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug ? resolvedParams.slug.join('/') : 'index';
  const doc = getDocBySlug(slug);

  if (!doc) {
    return {
      title: 'Not Found',
    };
  }

  return {
    title: `${doc.metadata.title} - Autopilot CLI`,
    description: doc.metadata.description,
  };
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug ? resolvedParams.slug.join('/') : 'index';
  const doc = getDocBySlug(slug);

  if (!doc) {
    notFound();
  }

  const editUrl = `https://github.com/PraiseTechzw/autopilot-cli/edit/main/autopilot-docs/content/docs/${slug === 'index' ? 'index' : slug}.mdx`;

  return (
    <article className="prose prose-blue dark:prose-invert max-w-none">
      <h1>{doc.metadata.title}</h1>
      {doc.metadata.description && (
        <p className="lead text-xl text-gray-500 dark:text-gray-400">
          {doc.metadata.description}
        </p>
      )}
      <hr className="my-8 border-gray-200 dark:border-gray-800" />
      <MDXRemote source={doc.content} components={{ pre: Pre }} />
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
        <a 
          href={editUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2"
        >
          Edit this page on GitHub
        </a>
      </div>
    </article>
  );
}
