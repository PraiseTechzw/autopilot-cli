import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Edit } from 'lucide-react';
import { DOCS_EDIT_URL } from '@/lib/constants';
import clsx from 'clsx';

interface FeedbackProps {
  title?: string;
}

export function Feedback({ title }: FeedbackProps) {
  const [voted, setVoted] = useState<'up' | 'down' | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const slug = typeof window !== 'undefined'
    ? window.location.pathname.replace(/^\/docs\/?/, '') || 'index'
    : 'index';
  const editUrl = `${DOCS_EDIT_URL}/${slug === '' ? 'index' : slug}.mdx`;

  const handleVote = (v: 'up' | 'down') => {
    setVoted(v);
    if (v === 'down') setShowForm(true);
    else setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setShowForm(false);
  };

  return (
    <div className="mt-12 pt-8 border-t border-border">
      {submitted ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-green-400">✓</span>
          <span>Thanks for your feedback!</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <p className="text-sm text-muted-foreground">Was this page helpful?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleVote('up')}
                  className={clsx(
                    "p-2 rounded-lg border transition-all",
                    voted === 'up'
                      ? "border-green-500/50 bg-green-500/10 text-green-400"
                      : "border-border text-muted-foreground hover:border-green-500/30 hover:text-green-400"
                  )}
                  aria-label="Yes"
                >
                  <ThumbsUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleVote('down')}
                  className={clsx(
                    "p-2 rounded-lg border transition-all",
                    voted === 'down'
                      ? "border-red-500/50 bg-red-500/10 text-red-400"
                      : "border-border text-muted-foreground hover:border-red-500/30 hover:text-red-400"
                  )}
                  aria-label="No"
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
            <form onSubmit={handleSubmit} className="animate-fade-in">
              <label htmlFor="feedback-comment" className="sr-only">Tell us what's missing (optional)</label>
              <textarea
                id="feedback-comment"
                rows={3}
                className="w-full text-sm p-3 rounded-lg border border-border bg-background focus:ring-2 focus:ring-link/20 focus:border-link outline-none resize-none placeholder:text-muted-foreground"
                placeholder="Tell us what's missing or how we can improve (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button type="submit" className="px-3 py-1.5 text-sm bg-link text-black rounded-md hover:bg-link-hover transition-colors font-medium">Submit Feedback</button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
