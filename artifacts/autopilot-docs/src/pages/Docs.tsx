import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import { DocLayout } from '@/components/DocLayout';
import { components } from '@/components/MDXComponents';
import 'highlight.js/styles/github-dark.css';

interface DocMeta {
  title: string;
  description?: string;
  slug: string;
  route: string;
}

interface DocResponse {
  content: string;
  metadata: DocMeta;
}

export default function DocsPage() {
  const [, params] = useRoute('/docs/:slug*');
  const [location] = useLocation();
  // wouter exposes wildcard segments as "slug*" when using :slug* pattern
  const slug = (params as any)?.[`slug*`] || (params as any)?.slug || 'index';

  const [doc, setDoc] = useState<DocResponse | null>(null);
  const [docs, setDocs] = useState<DocMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [stats, setStats] = useState<{ version: string | null; downloads: number | null }>({ version: null, downloads: null });

  // Fetch all docs list for sidebar
  useEffect(() => {
    fetch('/api/docs')
      .then(r => r.json())
      .then(data => setDocs(data))
      .catch(() => {});
  }, []);

  // Fetch npm stats
  useEffect(() => {
    fetch('/api/version').then(r => r.json()).then(d => {
      setStats(prev => ({ ...prev, version: d.version }));
    }).catch(() => {});
    fetch('/api/downloads').then(r => r.json()).then(d => {
      setStats(prev => ({ ...prev, downloads: d.downloads }));
    }).catch(() => {});
  }, []);

  // Fetch current doc
  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    fetch(`/api/docs/${encodeURIComponent(slug)}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then(data => {
        if (data) { setDoc(data); setLoading(false); }
      })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  // Update page title
  useEffect(() => {
    if (doc) document.title = `${doc.metadata.title} | Autopilot CLI`;
    else document.title = 'Documentation | Autopilot CLI';
  }, [doc]);

  if (loading) {
    return (
      <DocLayout docs={docs} stats={stats}>
        <div className="animate-pulse space-y-4 py-8">
          <div className="h-10 bg-muted rounded-lg w-1/2" />
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-5/6" />
        </div>
      </DocLayout>
    );
  }

  if (notFound) {
    return (
      <DocLayout docs={docs} stats={stats}>
        <div className="py-12 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Page not found</h1>
          <p className="text-muted-foreground">The documentation page "{slug}" doesn't exist.</p>
        </div>
      </DocLayout>
    );
  }

  return (
    <DocLayout docs={docs} stats={stats}>
      <article className="prose max-w-none">
        {doc && (
          <>
            <h1>{doc.metadata.title}</h1>
            {doc.metadata.description && (
              <p className="lead text-xl text-muted-foreground">{doc.metadata.description}</p>
            )}
            <hr className="my-8 border-border" />
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeSlug]}
              components={components as any}
            >
              {doc.content}
            </ReactMarkdown>
          </>
        )}
      </article>
    </DocLayout>
  );
}
