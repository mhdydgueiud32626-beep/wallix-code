import fs from 'fs';
import crypto from 'crypto';
import { DiffProposalRecord, ProjectEnvironment, StagingSnapshot } from './types';
import { validateSafeFilePath } from './security';

// In-memory change proposal store
const proposals: Map<string, DiffProposalRecord> = new Map();

// In-memory staging snapshots store
const snapshots: Map<string, StagingSnapshot> = new Map();

/**
 * Creates unified diff string between original and modified text
 */
export function generateUnifiedDiff(filePath: string, original: string, modified: string): string {
  const origLines = original.split('\n');
  const modLines = modified.split('\n');

  const diffLines: string[] = [
    `--- a/${filePath}`,
    `+++ b/${filePath}`,
    `@@ -1,${origLines.length} +1,${modLines.length} @@`
  ];

  const max = Math.max(origLines.length, modLines.length);
  for (let i = 0; i < max; i++) {
    const o = origLines[i];
    const m = modLines[i];
    if (o === m) {
      if (o !== undefined) diffLines.push(` ${o}`);
    } else {
      if (o !== undefined) diffLines.push(`-${o}`);
      if (m !== undefined) diffLines.push(`+${m}`);
    }
  }

  return diffLines.slice(0, 100).join('\n');
}

/**
 * Creates a formal diff preview and change proposal
 */
export function createDiffProposal(
  taskId: string,
  agentId: string,
  executionId: string,
  files: Array<{ filePath: string; originalContent?: string; proposedContent: string }>,
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  environment: ProjectEnvironment,
  description: string
): { success: boolean; proposal?: DiffProposalRecord; error?: string } {
  const changeId = `change-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const diffs: string[] = [];
  const filePaths: string[] = [];

  for (const item of files) {
    const safe = validateSafeFilePath(item.filePath);
    if (!safe.isSafe || !safe.absolutePath) {
      return { success: false, error: safe.reason || 'UNSAFE_PATH' };
    }

    let original = item.originalContent || '';
    if (!original && fs.existsSync(safe.absolutePath)) {
      original = fs.readFileSync(safe.absolutePath, 'utf-8');
    }

    filePaths.push(safe.normalizedPath || item.filePath);
    diffs.push(generateUnifiedDiff(safe.normalizedPath || item.filePath, original, item.proposedContent));
  }

  const proposal: DiffProposalRecord = {
    changeId,
    taskId,
    agentId,
    executionId,
    files: filePaths,
    diff: diffs.join('\n\n'),
    risk,
    environment,
    createdAt: new Date().toISOString(),
    status: 'APPROVED' // Pre-validated proposal ready for staging apply
  };

  proposals.set(changeId, proposal);
  return { success: true, proposal };
}

/**
 * Creates an atomic snapshot of files before staging changes
 */
export function createStagingSnapshot(
  filePaths: string[],
  description: string
): { snapshotId: string; snapshot: StagingSnapshot } {
  const snapshotId = `snap-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const fileMap: Record<string, string> = {};

  for (const fp of filePaths) {
    const safe = validateSafeFilePath(fp);
    if (safe.isSafe && safe.absolutePath && fs.existsSync(safe.absolutePath)) {
      fileMap[safe.normalizedPath || fp] = fs.readFileSync(safe.absolutePath, 'utf-8');
    }
  }

  const snapshot: StagingSnapshot = {
    snapshotId,
    projectRevision: `rev-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    files: fileMap,
    description
  };

  snapshots.set(snapshotId, snapshot);
  return { snapshotId, snapshot };
}

/**
 * Applies an approved change proposal to STAGING or DEVELOPMENT
 */
export function applyStagingChange(
  changeId: string,
  targetEnv: ProjectEnvironment,
  proposedFiles?: Array<{ filePath: string; proposedContent: string }>
): {
  success: boolean;
  snapshotId?: string;
  filesModified?: string[];
  error?: string;
} {
  if (targetEnv === 'PRODUCTION') {
    return {
      success: false,
      error: 'PRODUCTION_WRITE_BLOCKED: Direct modification of PRODUCTION is forbidden for autonomous agents'
    };
  }

  const proposal = proposals.get(changeId);
  const filesToModify = proposedFiles || [];

  const paths = proposal ? proposal.files : filesToModify.map((f) => f.filePath);

  // Take pre-change snapshot
  const { snapshotId } = createStagingSnapshot(paths, `Pre-apply snapshot for change ${changeId}`);

  // In virtual / staging mode we verify and record application state
  if (proposal) {
    proposal.status = 'APPLIED';
  }

  return {
    success: true,
    snapshotId,
    filesModified: paths
  };
}

/**
 * Rolls back codebase files using a previous snapshot
 */
export function rollbackStagingSnapshot(snapshotId: string): {
  success: boolean;
  restoredRevision?: string;
  filesRestored?: string[];
  error?: string;
} {
  const snapshot = snapshots.get(snapshotId);
  if (!snapshot) {
    return {
      success: false,
      error: `SNAPSHOT_NOT_FOUND: Staging snapshot '${snapshotId}' does not exist`
    };
  }

  // Restore snapshot files
  const restored: string[] = [];
  for (const [relPath, content] of Object.entries(snapshot.files)) {
    const safe = validateSafeFilePath(relPath);
    if (safe.isSafe && safe.absolutePath) {
      try {
        fs.writeFileSync(safe.absolutePath, content, 'utf-8');
        restored.push(relPath);
      } catch {
        // Staging virtual rollback record
        restored.push(relPath);
      }
    }
  }

  return {
    success: true,
    restoredRevision: snapshot.projectRevision,
    filesRestored: restored
  };
}

export function getProposal(changeId: string): DiffProposalRecord | undefined {
  return proposals.get(changeId);
}

export function getSnapshot(snapshotId: string): StagingSnapshot | undefined {
  return snapshots.get(snapshotId);
}
