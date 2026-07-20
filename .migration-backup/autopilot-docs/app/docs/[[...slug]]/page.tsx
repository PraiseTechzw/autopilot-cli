import { getDocBySlug, getDocSlugs } from '@/lib/mdx';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Pre } from '@/components/Pre';
import { AlertCircle, Edit } from 'lucide-react';
import { DOCS_EDIT_URL, ISSUES_URL } from '@/lib/constants';
import { components } from '@/components/MDXComponents';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

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

  const editUrl = `${DOCS_EDIT_URL}/${slug === 'index' ? 'index' : slug}.mdx`;
  const issueTitle = encodeURIComponent(`Issue with docs: ${doc.metadata.title}`);
  const issueBody = encodeURIComponent(`\n\n**Route**: /docs/${slug}\n**What happened?**\n\n**Expected behavior?**\n\n**Screenshots?**`);
  const issueUrl = `${ISSUES_URL}/new?title=${issueTitle}&body=${issueBody}`;

  return (
    <article className="prose max-w-none">
      <h1>{doc.metadata.title}</h1>
      {doc.metadata.description && (
        <p className="lead text-xl text-muted-foreground">
          {doc.metadata.description}
        </p>
      )}
      <hr className="my-8 border-border" />
      <MDXRemote 
        source={doc.content} 
        components={components} 
        options={{
          blockJS: true,
          blockDangerousJS: true,
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [
              rehypeHighlight,
              rehypeSlug,
            ],
          },
        }}
      />
    </article>
  );
}
