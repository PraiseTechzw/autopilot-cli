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
  parentTitle?: string;
  level?: number;
}

const index = searchIndex as IndexItem[];

export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

export function searchDocs(query: string): SearchResult[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  const terms = normalizedQuery.split(' ').filter(Boolean);
  const results: SearchResult[] = [];

  for (const item of index) {
    let score = 0;
    const normalizedTitle = normalizeText(item.title);
    const normalizedDesc = normalizeText(item.description || '');

    for (const term of terms) {
      if (normalizedTitle === term) score += 10;
      else if (normalizedTitle.startsWith(term)) score += 6;
      else if (normalizedTitle.includes(term)) score += 3;
      if (normalizedDesc.includes(term)) score += 1;
    }

    if (item.type === 'page') score *= 1.5;

    if (score > 0) {
      results.push({
        title: item.type === 'heading' ? (item.parentTitle || item.title) : item.title,
        heading: item.type === 'heading' ? item.title : undefined,
        route: item.route,
        type: item.type,
        score,
        snippet: item.description,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 8);
}
