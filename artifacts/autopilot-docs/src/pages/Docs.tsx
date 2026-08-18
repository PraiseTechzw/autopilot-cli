import { useState, useEffect, useMemo } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSlug from 'rehype-slug';
import { DocLayout } from '@/components/DocLayout';
import { Feedback } from '@/components/Feedback';
import { components } from '@/components/MDXComponents';
import { getDocBySlug, getAllDocs, ALL_DOCS } from '@/lib/docs-content';
import { ArrowLeft, ArrowRight, Terminal, Sparkles, Compass } from 'lucide-react';
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
  const rawSlug = (params as any)?.[`slug*`] || (params as any)?.slug || 'index';
  const slug = rawSlug.replace(/^\//, '').replace(/\/$/, '') || 'index';

  // Seed with instant local doc data for 0-latency offline-first load
  const initialDoc = useMemo(() => {
    const local = getDocBySlug(slug);
    if (!local) return null;
    return {
      content: local.content,
      metadata: {
        title: local.title,
        description: local.description,
        slug: local.slug,
        route: local.route,
      },
    };
  }, [slug]);

  const [doc, setDoc] = useState<DocResponse | null>(initialDoc);
  const [docs, setDocs] = useState<DocMeta[]>(() =>
    getAllDocs().map(d => ({
      title: d.title,
      description: d.description,
      slug: d.slug,
      route: d.route,
    }))
  );
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(!initialDoc);
  const [stats, setStats] = useState<{ version: string | null; downloads: number | null }>({ version: '4.0.2', downloads: null });

  // Calculate prev and next documentation links
  const { prevDoc, nextDoc } = useMemo(() => {
    const currentIndex = ALL_DOCS.findIndex(d => d.slug === slug);
    return {
      prevDoc: currentIndex > 0 ? ALL_DOCS[currentIndex - 1] : null,
      nextDoc: currentIndex >= 0 && currentIndex < ALL_DOCS.length - 1 ? ALL_DOCS[currentIndex + 1] : null,
    };
  }, [slug]);

  // Fetch API docs list for sidebar if API is online
  useEffect(() => {
    fetch('/api/docs')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setDocs(data);
      })
      .catch(() => {});
  }, []);

  // Fetch npm stats
  useEffect(() => {
    fetch('/api/version')
      .then(r => r.json())
      .then(d => {
        if (d.version) setStats(prev => ({ ...prev, version: d.version }));
      })
      .catch(() => {});

    fetch('/api/downloads')
      .then(r => r.json())
      .then(d => {
        const count = d.total || d.weekly || null;
        if (count) setStats(prev => ({ ...prev, downloads: count }));
      })
      .catch(() => {});
  }, []);

  // Refresh current doc from API if available, else use local data
  useEffect(() => {
    const local = getDocBySlug(slug);
    if (local) {
      setDoc({
        content: local.content,
        metadata: {
          title: local.title,
          description: local.description,
          slug: local.slug,
          route: local.route,
        },
      });
      setNotFound(false);
      setLoading(false);
    } else {
      setLoading(true);
      fetch(`/api/docs/${encodeURIComponent(slug)}`)
        .then(r => {
          if (!r.ok) {
            setNotFound(true);
            setLoading(false);
            return null;
          }
          return r.json();
        })
        .then(data => {
          if (data) {
            setDoc(data);
            setNotFound(false);
          }
          setLoading(false);
        })
        .catch(() => {
          setNotFound(true);
          setLoading(false);
        });
    }
  }, [slug]);

  // Update page title
  useEffect(() => {
    if (doc) document.title = `${doc.metadata.title} | Autopilot CLI`;
    else document.title = 'Documentation | Autopilot CLI';
  }, [doc]);

  if (loading && !doc) {
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

  if (notFound && !doc) {
    return (
      <DocLayout docs={docs} stats={stats}>
        <div className="py-16 text-center max-w-md mx-auto">
          <div className="inline-flex p-4 rounded-2xl bg-muted border border-border text-muted-foreground mb-4">
            <Compass className="h-8 w-8 text-link" />
          </div>
          <h1 className="text-3xl font-black text-foreground mb-3">Topic not found</h1>
          <p className="text-muted-foreground mb-6">The documentation article "{slug}" does not exist.</p>
          <div className="flex justify-center gap-3">
            <Link href="/docs" className="px-5 py-2.5 bg-link text-black font-bold rounded-xl text-sm hover:bg-link-hover transition-colors">
              Go to Docs Home
            </Link>
            <Link href="/playground" className="px-5 py-2.5 bg-card border border-border text-foreground font-semibold rounded-xl text-sm hover:bg-muted transition-colors">
              Open Web Tool
            </Link>
          </div>
        </div>
      </DocLayout>
    );
  }

  return (
    <DocLayout docs={docs} stats={stats}>
      <article className="prose max-w-none">
        {doc && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 not-prose mb-6 pb-6 border-b border-border">
              <div>
                <span className="text-[11px] font-bold text-link uppercase tracking-widest block mb-1">Documentation</span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight m-0">{doc.metadata.title}</h1>
                {doc.metadata.description && (
                  <p className="text-base text-muted-foreground mt-2 mb-0 leading-relaxed">{doc.metadata.description}</p>
                )}
              </div>
              <Link
                href="/playground"
                className="inline-flex items-center gap-2 px-4 py-2 bg-link/10 border border-link/30 hover:bg-link/20 text-link text-xs font-bold rounded-xl transition-all self-start sm:self-center flex-shrink-0 group shadow-sm shadow-link/5"
              >
                <Terminal className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                <span>Test in Web Tool</span>
                <Sparkles className="h-3 w-3" />
              </Link>
            </div>

            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight, rehypeSlug]}
              components={components as any}
            >
              {doc.content}
            </ReactMarkdown>

            {/* Next / Previous Pagination */}
            <div className="not-prose mt-12 pt-8 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-4">
              {prevDoc ? (
                <Link
                  href={prevDoc.route}
                  className="flex flex-col p-4 rounded-xl border border-border bg-card hover:border-link/40 hover:bg-muted/40 transition-all group"
                >
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground group-hover:text-link transition-colors mb-1 font-medium">
                    <ArrowLeft className="h-3.5 w-3.5" /> Previous
                  </span>
                  <span className="text-sm font-bold text-foreground truncate">{prevDoc.title}</span>
                </Link>
              ) : <div />}

              {nextDoc ? (
                <Link
                  href={nextDoc.route}
                  className="flex flex-col p-4 rounded-xl border border-border bg-card hover:border-link/40 hover:bg-muted/40 transition-all text-right sm:text-right group"
                >
                  <span className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground group-hover:text-link transition-colors mb-1 font-medium">
                    Next <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm font-bold text-foreground truncate">{nextDoc.title}</span>
                </Link>
              ) : <div />}
            </div>

            <Feedback title={doc.metadata.title} />
          </>
        )}
      </article>
    </DocLayout>
  );
}
