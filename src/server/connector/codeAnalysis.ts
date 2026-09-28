import fs from 'fs';
import path from 'path';
import { CodeAnalysisResult } from './types';
import { validateSafeFilePath } from './security';

/**
 * Performs lightweight AST & dependency analysis on a project source file.
 */
export function analyzeSourceCode(filePathInput: string): {
  success: boolean;
  result?: CodeAnalysisResult;
  error?: string;
} {
  const safeCheck = validateSafeFilePath(filePathInput);
  if (!safeCheck.isSafe || !safeCheck.absolutePath) {
    return { success: false, error: safeCheck.reason || 'UNSAFE_PATH' };
  }

  if (!fs.existsSync(safeCheck.absolutePath)) {
    return { success: false, error: `FILE_NOT_FOUND: File '${safeCheck.normalizedPath}' does not exist` };
  }

  const content = fs.readFileSync(safeCheck.absolutePath, 'utf-8');
  const lines = content.split('\n');

  const imports: string[] = [];
  const exports: string[] = [];
  const internalDeps: string[] = [];
  const externalDeps: string[] = [];
  const componentsDeclared: string[] = [];
  const subcomponentsUsed: string[] = [];
  const endpointsReferenced: string[] = [];
  const storageInteractions: string[] = [];

  let complexityScore = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Imports detection: import ... from '...'
    const importMatch = line.match(/^import\s+(?:(?:[\w*\s{},]+)\s+from\s+)?['"]([^'"]+)['"]/);
    if (importMatch) {
      const dep = importMatch[1];
      imports.push(line);
      if (dep.startsWith('.') || dep.startsWith('/')) {
        internalDeps.push(dep);
      } else {
        externalDeps.push(dep);
      }
    }

    // Exports detection
    const exportMatch = line.match(/^export\s+(?:default\s+)?(?:const|function|class|interface|type|enum)\s+([a-zA-Z0-9_$]+)/);
    if (exportMatch) {
      exports.push(exportMatch[1]);
    } else if (line.startsWith('export {')) {
      exports.push(line);
    }

    // React component declaration detection: const Foo: React.FC ... or function Foo(
    const compDeclMatch = line.match(/(?:export\s+)?(?:const|function)\s+([A-Z][a-zA-Z0-9_$]+)(?:\s*:\s*React\.FC|\s*\([^)]*\)\s*:\s*JSX\.Element|\s*\([^)]*\)\s*=>)/);
    if (compDeclMatch) {
      componentsDeclared.push(compDeclMatch[1]);
    }

    // JSX subcomponent usages: <FooBar or <MyWidget
    const jsxMatches = line.matchAll(/<([A-Z][a-zA-Z0-9]+)(?:\s|>|\/)/g);
    for (const m of jsxMatches) {
      if (m[1] && !componentsDeclared.includes(m[1]) && !subcomponentsUsed.includes(m[1])) {
        subcomponentsUsed.push(m[1]);
      }
    }

    // API endpoints referenced: fetch('/api/...' or axios.get('/api/...'
    const apiMatch = line.match(/['"`](\/api\/[^'"`]+)['"`]/);
    if (apiMatch && !endpointsReferenced.includes(apiMatch[1])) {
      endpointsReferenced.push(apiMatch[1]);
    }

    // Storage interactions
    if (line.includes('localStorage.') || line.includes('sessionStorage.') || line.includes('chrome.storage.')) {
      storageInteractions.push(line.slice(0, 80));
    }

    // Cyclomatic complexity estimations: if, else if, for, while, case, &&, ||, ?
    if (/\b(if|while|for|catch)\b/.test(line) || line.includes('&&') || line.includes('||') || line.includes(' ? ')) {
      complexityScore++;
    }
  }

  const result: CodeAnalysisResult = {
    filePath: safeCheck.normalizedPath || filePathInput,
    imports: Array.from(new Set(imports)),
    exports: Array.from(new Set(exports)),
    componentRelationships: {
      componentsDeclared: Array.from(new Set(componentsDeclared)),
      subcomponentsUsed: Array.from(new Set(subcomponentsUsed)).slice(0, 20)
    },
    apiRelationships: {
      endpointsReferenced: Array.from(new Set(endpointsReferenced)),
      storageInteractions: Array.from(new Set(storageInteractions)).slice(0, 10)
    },
    dependencyGraph: {
      internalDeps: Array.from(new Set(internalDeps)),
      externalDeps: Array.from(new Set(externalDeps))
    },
    complexityIndicators: {
      linesOfCode: lines.length,
      estimatedCyclomaticComplexity: complexityScore,
      dependencyFanOut: internalDeps.length + externalDeps.length,
      exportedSymbolsCount: exports.length
    }
  };

  return { success: true, result };
}
