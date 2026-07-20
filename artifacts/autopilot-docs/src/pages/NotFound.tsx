import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="text-8xl font-black text-link mb-4">404</div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-4">
        <Link href="/" className="px-6 py-3 bg-link text-black font-semibold rounded-xl hover:bg-link-hover transition-colors">
          Go Home
        </Link>
        <Link href="/docs" className="px-6 py-3 bg-card border border-border text-foreground font-semibold rounded-xl hover:bg-muted transition-colors">
          Documentation
        </Link>
      </div>
    </div>
  );
}
