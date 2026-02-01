import Link from 'next/link';
import { Home, Book } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-6xl font-bold text-blue-600 dark:text-blue-500 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Page not found
      </h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
        Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          href="/"
          className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
        >
          <Home className="h-4 w-4" />
          Go Home
        </Link>
        <Link 
          href="/docs"
          className="flex items-center gap-2 px-6 py-3 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        >
          <Book className="h-4 w-4" />
          Browse Docs
        </Link>
      </div>
    </div>
  );
}
