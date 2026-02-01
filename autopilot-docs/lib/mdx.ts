import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const DOCS_PATH = path.join(process.cwd(), 'content/docs');

export interface DocMetadata {
  title: string;
  description: string;
  slug: string;
}

export interface Doc {
  metadata: DocMetadata;
  content: string;
}

export function getDocSlugs(): string[] {
  if (!fs.existsSync(DOCS_PATH)) return [];
  return fs.readdirSync(DOCS_PATH).filter((file) => /\.mdx?$/.test(file));
}

export function getDocBySlug(slug: string): Doc | null {
  const realSlug = slug.replace(/\.mdx?$/, '');
  const fullPath = path.join(DOCS_PATH, `${realSlug}.mdx`);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    metadata: {
      ...data,
      slug: realSlug,
    } as DocMetadata,
    content,
  };
}

export function getAllDocs(): DocMetadata[] {
  const slugs = getDocSlugs();
  const docs = slugs
    .map((slug) => getDocBySlug(slug))
    .filter((doc): doc is Doc => doc !== null)
    .map((doc) => doc.metadata);
  return docs;
}
