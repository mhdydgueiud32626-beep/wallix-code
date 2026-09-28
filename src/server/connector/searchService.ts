import fs from 'fs';
import path from 'path';
import { SearchResultItem } from './types';

// Allowed search roots
const SEARCH_ROOT_DIRS = ['src', 'extension', 'public'];

function walkDirectory(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === 'dist' ||
        entry.name.startsWith('.')
      ) {
        continue;
      }
      walkDirectory(fullPath, fileList);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html'].includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }

  return fileList;
}

export function searchProjectCode(
  query: string,
  searchType: 'symbol' | 'component' | 'api' | 'text' = 'text',
  maxResults = 30
): SearchResultItem[] {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return [];
  }

  const cleanQuery = query.trim();
  const lowerQuery = cleanQuery.toLowerCase();
  const root = process.cwd();

  const allFiles: string[] = [];
  for (const dirName of SEARCH_ROOT_DIRS) {
    walkDirectory(path.join(root, dirName), allFiles);
  }

  // Also include top-level project config files
  for (const topFile of ['package.json', 'tsconfig.json', 'vite.config.ts', 'index.html']) {
    const full = path.join(root, topFile);
    if (fs.existsSync(full)) allFiles.push(full);
  }

  const results: SearchResultItem[] = [];

  for (const filePath of allFiles) {
    if (results.length >= maxResults) break;

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const relativePath = path.relative(root, filePath);

      for (let i = 0; i < lines.length; i++) {
        if (results.length >= maxResults) break;

        const line = lines[i];
        const lowerLine = line.toLowerCase();

        let isMatch = false;

        switch (searchType) {
          case 'component':
            // Look for Component declaration or usage
            if (
              lowerLine.includes(lowerQuery) &&
              (line.includes('<' + cleanQuery) ||
                line.includes('const ' + cleanQuery) ||
                line.includes('function ' + cleanQuery) ||
                line.includes('interface ' + cleanQuery) ||
                line.includes('export const ' + cleanQuery))
            ) {
              isMatch = true;
            }
            break;

          case 'symbol':
            // Look for exported or declared symbols
            if (
              lowerLine.includes(lowerQuery) &&
              (line.includes(`export const ${cleanQuery}`) ||
                line.includes(`export function ${cleanQuery}`) ||
                line.includes(`interface ${cleanQuery}`) ||
                line.includes(`type ${cleanQuery}`) ||
                line.includes(`class ${cleanQuery}`) ||
                line.includes(`enum ${cleanQuery}`))
            ) {
              isMatch = true;
            }
            break;

          case 'api':
            // Look for endpoint paths, fetch, router, or API names
            if (
              lowerLine.includes(lowerQuery) &&
              (line.includes('/api/') ||
                line.includes('app.get') ||
                line.includes('app.post') ||
                line.includes('fetch(') ||
                line.includes('router.'))
            ) {
              isMatch = true;
            }
            break;

          case 'text':
          default:
            if (lowerLine.includes(lowerQuery)) {
              isMatch = true;
            }
            break;
        }

        if (isMatch) {
          results.push({
            filePath: relativePath,
            lineNumber: i + 1,
            matchSnippet: line.trim().slice(0, 160),
            matchType: searchType
          });
        }
      }
    } catch {
      // Ignore unreadable files
    }
  }

  return results;
}
