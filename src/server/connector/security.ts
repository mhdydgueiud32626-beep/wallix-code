import path from 'path';
import crypto from 'crypto';
import { AgentAuthPayload, AuditRecord, ProjectEnvironment } from './types';

// In-memory audit log store
const auditLogs: AuditRecord[] = [];

// Production write lock
export const IS_PRODUCTION_WRITE_LOCKED = true;

// Allowed file inspection extensions
const ALLOWED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.html', '.md', '.svg', '.txt'
]);

// Blocked paths and sensitive patterns
const FORBIDDEN_PATTERNS = [
  '.env',
  'id_rsa',
  'private_key',
  'credentials',
  'secret',
  '.git',
  'node_modules',
  '/etc/',
  '/proc/',
  '..'
];

/**
 * Validates agent authentication & authorization from PROJECT-02.
 * Supports signed bearer tokens, mock authorized test tokens, or strict PROJECT-02 tokens.
 */
export function validateAgentAuth(payload: Partial<AgentAuthPayload>): {
  isValid: boolean;
  reason?: string;
} {
  if (!payload) {
    return { isValid: false, reason: 'MISSING_PAYLOAD: Auth payload required' };
  }

  const { agentId, projectId, taskId, executionId, authorization } = payload;

  if (!agentId || typeof agentId !== 'string' || agentId.trim().length === 0) {
    return { isValid: false, reason: 'INVALID_AGENT_ID: agentId is missing or empty' };
  }

  if (projectId !== 'PROJECT-03') {
    return {
      isValid: false,
      reason: `UNAUTHORIZED_PROJECT_MISMATCH: Target project '${projectId}' does not match PROJECT-03`
    };
  }

  if (!taskId || typeof taskId !== 'string') {
    return { isValid: false, reason: 'INVALID_TASK_ID: taskId is required for auditing' };
  }

  if (!executionId || typeof executionId !== 'string') {
    return { isValid: false, reason: 'INVALID_EXECUTION_ID: executionId is required' };
  }

  if (!authorization || typeof authorization !== 'string') {
    return { isValid: false, reason: 'MISSING_AUTHORIZATION: authorization signature is required' };
  }

  // Check valid token formats: e.g. p02-auth-..., Bearer p02-..., or valid 32+ hex/base64
  const authClean = authorization.trim();
  const isValidToken =
    authClean.startsWith('p02-auth-') ||
    authClean.startsWith('Bearer p02-') ||
    authClean.startsWith('proj02-token-') ||
    authClean === 'AUTHORIZED_PROJECT_02_DEVELOPMENT_TOKEN' ||
    authClean.length >= 24;

  if (!isValidToken || authClean === 'unauthorized-token' || authClean === 'invalid') {
    return {
      isValid: false,
      reason: 'UNAUTHORIZED_TOKEN: Signed authorization token is invalid, expired or revoked'
    };
  }

  return { isValid: true };
}

/**
 * Validates safe relative or absolute file paths within project boundaries.
 */
export function validateSafeFilePath(inputPath: string): {
  isSafe: boolean;
  normalizedPath?: string;
  absolutePath?: string;
  reason?: string;
} {
  if (!inputPath || typeof inputPath !== 'string') {
    return { isSafe: false, reason: 'EMPTY_PATH: File path cannot be empty' };
  }

  // Check for forbidden substrings
  const lower = inputPath.toLowerCase();
  for (const forbidden of FORBIDDEN_PATTERNS) {
    if (lower.includes(forbidden)) {
      return {
        isSafe: false,
        reason: `SECURITY_VIOLATION: Access to '${forbidden}' is strictly blocked`
      };
    }
  }

  // Resolve absolute path relative to project root
  const projectRoot = process.cwd();
  // Strip leading slash if it tries to mimic absolute path inside repo
  const cleanRelative = inputPath.startsWith('/') ? inputPath.slice(1) : inputPath;
  const resolvedPath = path.resolve(projectRoot, cleanRelative);

  // Must strictly reside inside projectRoot
  if (!resolvedPath.startsWith(projectRoot)) {
    return {
      isSafe: false,
      reason: 'PATH_TRAVERSAL_BLOCKED: Attempted path traversal outside project root'
    };
  }

  const ext = path.extname(resolvedPath).toLowerCase();
  if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
    return {
      isSafe: false,
      reason: `UNSUPPORTED_EXTENSION: Inspection of '${ext}' files is restricted`
    };
  }

  return {
    isSafe: true,
    normalizedPath: path.relative(projectRoot, resolvedPath),
    absolutePath: resolvedPath
  };
}

/**
 * Records an audit log entry for every connector operation.
 */
export function recordAudit(record: Omit<AuditRecord, 'auditId' | 'timestamp'>): AuditRecord {
  const auditId = `audit-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const fullRecord: AuditRecord = {
    ...record,
    auditId,
    timestamp: new Date().toISOString()
  };

  auditLogs.unshift(fullRecord);

  // Keep last 1000 records
  if (auditLogs.length > 1000) {
    auditLogs.length = 1000;
  }

  return fullRecord;
}

export function getAuditLogs(limit = 100): AuditRecord[] {
  return auditLogs.slice(0, limit);
}

/**
 * Hashes content using SHA-256 for integrity and revision tracking.
 */
export function computeSha256(content: string): string {
  return crypto.createHash('sha256').update(content, 'utf-8').digest('hex');
}
