import searchIndex from './search-index.json';

export type SearchResult = {
  title: string;
  heading?: string;
  route: string;
  type: 'page' | 'heading';
  score: number;
  snippet?: string;
};

interface IndexItem {
  title: string;
  description?: string;
  route: string;
  type: 'page' | 'heading';
  parentTitle?: string; // Present if type is heading
  level?: number;
}

// Ensure the imported JSON is treated as IndexItem[]
const index = searchIndex as IndexItem[];

/**
 * Normalizes text for search:
 * - Converts to lowercase
 * - Removes punctuation
 * - Collapses whitespace
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Searches the documentation index for the given query.
 * Returns top 8 results sorted by relevance.
 */
export function searchDocs(query: string): SearchResult[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  const results: SearchResult[] = [];

  for (const item of index) {
    let score = 0;
    const normalizedTitle = normalizeText(item.title);
    const normalizedDesc = item.description ? normalizeText(item.description) : '';
    
    // 1. Title Matching (Highest Priority)
    if (normalizedTitle === normalizedQuery) {
      score += 100; // Exact match
    } else if (normalizedTitle.startsWith(normalizedQuery)) {
      score += 80; // Prefix match
    } else if (normalizedTitle.includes(normalizedQuery)) {
      score += 60; // Substring match
    }

    // 2. Description Matching (Lower Priority)
    // Only check description if it exists and we haven't already found a perfect title match (optimization)
    // or always check to boost score? Let's add to score.
    if (normalizedDesc && normalizedDesc.includes(normalizedQuery)) {
      score += 20;
    }

    // 3. Apply Boosts based on Item Type
    if (score > 0) {
      if (item.type === 'page') {
        score *= 1.5; // Boost pages over headings
      } else {
        // Headings
        score *= 1.0; 
      }

      // Construct result
      results.push({
        title: item.type === 'heading' ? (item.parentTitle || item.title) : item.title,
        heading: item.type === 'heading' ? item.title : undefined,
        route: item.route,
        type: item.type,
        score,
        snippet: item.description
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Return top 8
  return results.slice(0, 8);
}
