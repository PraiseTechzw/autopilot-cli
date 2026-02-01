'use client';

import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Edit, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { ISSUES_URL, DOCS_EDIT_URL } from '@/lib/constants';
import { usePathname } from 'next/navigation';

interface FeedbackProps {
  title?: string;
  slug?: string; // e.g. "getting-started" or "index"
}

export function Feedback({ title, slug }: FeedbackProps) {
  const pathname = usePathname();
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Derive the actual slug from pathname if not provided
  // pathname is like "/docs/getting-started"
  const currentSlug = slug || pathname?.replace(/^\/docs\/?/, '') || 'index';
  
  // Storage key per route
  const storageKey = `feedback-${pathname}`;

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      setSubmitted(true);
      setFeedback(stored as 'yes' | 'no');
    }
  }, [storageKey]);

  const handleFeedback = (value: 'yes' | 'no') => {
    setFeedback(value);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct GitHub Issue URL
    const issueTitle = encodeURIComponent(`Docs Feedback: ${title || currentSlug}`);
    const feedbackText = feedback === 'yes' ? 'Helpful' : 'Not helpful';
    const bodyContent = `
**Page**: ${pathname}
**Helpful**: ${feedbackText}
**Feedback**:
${comment}
    `.trim();
    
    const issueBody = encodeURIComponent(bodyContent);
    const url = `${ISSUES_URL}/new?title=${issueTitle}&body=${issueBody}&labels=documentation,feedback`;
    
    window.open(url, '_blank');
    
    // Save state
    localStorage.setItem(storageKey, feedback!);
    setSubmitted(true);
    setShowForm(false);
  };

  const editUrl = `${DOCS_EDIT_URL}/${currentSlug === 'index' ? 'index' : currentSlug}.mdx`;

  if (submitted && !showForm) {
    return (
      <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Thanks for your feedback!
        </div>
        <a 
          href={editUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground hover:text-link flex items-center gap-2 transition-colors"
        >
          <Edit className="h-4 w-4" />
          <span>Edit this page</span>
        </a>
      </div>
    );
  }

  return (
    <div className="mt-16 pt-8 border-t border-border">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-foreground">
              Was this page helpful?
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFeedback('yes')}
                className={clsx(
                  "p-2 rounded-full transition-colors",
                  feedback === 'yes'
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "text-muted-foreground hover:bg-muted"
                )}
                aria-label="Yes, this page was helpful"
              >
                <ThumbsUp className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleFeedback('no')}
                className={clsx(
                  "p-2 rounded-full transition-colors",
                  feedback === 'no'
                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                    : "text-muted-foreground hover:bg-muted"
                )}
                aria-label="No, this page was not helpful"
              >
                <ThumbsDown className="h-4 w-4" />
              </button>
            </div>
          </div>

          <a 
            href={editUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-link flex items-center gap-2 transition-colors"
          >
            <Edit className="h-4 w-4" />
            <span>Edit this page</span>
          </a>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-top-2">
            <label htmlFor="feedback-comment" className="sr-only">
              Tell us what’s missing (optional)
            </label>
            <textarea
              id="feedback-comment"
              rows={3}
              className="w-full text-sm p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-link/20 focus:border-link outline-none resize-none placeholder:text-muted-foreground"
              placeholder="Tell us what’s missing or how we can improve (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 text-sm bg-link text-white rounded-md hover:bg-link-hover transition-colors font-medium"
              >
                Submit Feedback
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
