import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import GithubSlugger from 'github-slugger';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'docs');
const OUTPUT_FILE = path.join(process.cwd(), 'lib', 'search-index.json');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.mdx')) {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function generateIndex() {
  console.log('Building search index...');
  
  if (!fs.existsSync(CONTENT_DIR)) {
      console.warn(`Content directory not found: ${CONTENT_DIR}`);
      fs.writeFileSync(OUTPUT_FILE, '[]');
      return;
  }

  const files = getAllFiles(CONTENT_DIR);
  const index = [];

  files.forEach((filePath) => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(fileContent);
    const slugger = new GithubSlugger();
    
    // Calculate route
    const relativePath = path.relative(CONTENT_DIR, filePath);
    // Normalize windows paths to web paths
    const normalizedPath = relativePath.split(path.sep).join('/');
    
    let route = '/docs/' + normalizedPath.replace(/\.mdx$/, '');
    
    // Handle index routes
    if (route.endsWith('/index')) {
      route = route.slice(0, -6);
    }
    
    // Ensure root /docs is handled correctly (if generated as empty string by slice)
    if (route === '') route = '/docs';

    // 1. Index the page itself
    index.push({
      title: data.title || 'Untitled',
      description: data.description || '',
      route: route,
      type: 'page'
    });

    // 2. Index headings
    // Match #, ##, ###
    const headingRegex = /^(#{1,3})\s+(.+)$/gm;
    let match;
    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2].trim();
      const slug = slugger.slug(text);
      const headingRoute = `${route}#${slug}`;

      index.push({
        title: text,
        route: headingRoute,
        type: 'heading',
        parentTitle: data.title,
        level: level
      });
    }
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(index, null, 2));
  console.log(`Search index generated with ${index.length} entries at ${OUTPUT_FILE}`);
}

generateIndex();
