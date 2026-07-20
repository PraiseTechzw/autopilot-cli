import Link from 'next/link';
import { Home, Book } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-6xl font-bold text-link mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-foreground mb-4">
        Page not found
      </h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/"
          className="flex items-center gap-2 px-6 py-3 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Home className="h-4 w-4" />
          Go Home
        </Link>
        <Link 
          href="/docs"
          className="flex items-center gap-2 px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-colors"
        >
          <Book className="h-4 w-4" />
          Browse Docs
        </Link>
      </div>
    </div>
  );
}
