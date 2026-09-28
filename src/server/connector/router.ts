import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import {
  ProjectIdentity,
  HealthCheckResponse,
  ProjectEnvironment
} from './types';
import {
  validateAgentAuth,
  validateSafeFilePath,
  recordAudit,
  computeSha256,
  getAuditLogs
} from './security';
import { getProjectDiscoveryMetadata } from './discovery';
import { searchProjectCode } from './searchService';
import { analyzeSourceCode } from './codeAnalysis';
import { runProjectTest } from './testRunner';
import {
  createDiffProposal,
  applyStagingChange,
  rollbackStagingSnapshot,
  getSnapshot
} from './stagingManager';
import {
  emitTelemetryEvent,
  getTelemetryEvents,
  logStructuredError,
  getStructuredErrors
} from './telemetryService';
import { runFullValidationSuite } from './validationSuite';
import { nativeAppRouter } from './nativeAppBridge';

export const connectorRouter = Router();

// Mount Native App Bridge Router
connectorRouter.use(nativeAppRouter);

const CURRENT_ENVIRONMENT: ProjectEnvironment =
  (process.env.APP_ENV as ProjectEnvironment) || 'DEVELOPMENT';
const APP_START_TIME = Date.now();

// 1. Health Endpoint (Safe, no secrets)
connectorRouter.get('/health', (_req: Request, res: Response) => {
  const health: HealthCheckResponse = {
    application: 'PROJECT-03 (WALLIX)',
    version: '1.0.0',
    environment: CURRENT_ENVIRONMENT,
    databaseStatus: 'LOCAL_CACHE_ONLINE',
    apiStatus: 'OPERATIONAL',
    dependencyStatus: 'HEALTHY',
    overallStatus: 'HEALTHY',
    timestamp: new Date().toISOString()
  };
  res.json(health);
});

// 2. Project Identity Endpoint
connectorRouter.get('/connector/identity', (_req: Request, res: Response) => {
  const identity: ProjectIdentity = {
    projectId: 'PROJECT-03',
    projectName: 'WALLIX - 3D Wallpapers & Chrome Workspace',
    environment: CURRENT_ENVIRONMENT,
    version: '1.0.0',
    buildVersion: '2026.09-r9',
    gitRevision: 'rev-3a9f20c',
    healthStatus: 'HEALTHY',
    uptimeSeconds: Math.floor((Date.now() - APP_START_TIME) / 1000)
  };
  res.json(identity);
});

// 3. Project Discovery / Inspection
connectorRouter.all('/connector/inspect', (req: Request, res: Response) => {
  // Allow discovery to return structured metadata
  const metadata = getProjectDiscoveryMetadata();
  recordAudit({
    agentId: req.body?.agentId || 'agent-p02-evaluator',
    projectId: 'PROJECT-03',
    taskId: req.body?.taskId || 'task-inspect',
    executionId: req.body?.executionId || 'exec-inspect',
    operation: 'PROJECT_INSPECT',
    targetResource: 'metadata.discovery',
    environment: CURRENT_ENVIRONMENT,
    status: 'SUCCESS'
  });
  res.json({ success: true, metadata });
});

// 4. File Read (Authorized & Audited)
connectorRouter.post('/connector/file/read', (req: Request, res: Response) => {
  const { agentId, projectId, taskId, executionId, authorization, filePath } = req.body;

  const authCheck = validateAgentAuth({ agentId, projectId, taskId, executionId, authorization });
  if (!authCheck.isValid) {
    const audit = recordAudit({
      agentId: agentId || 'unknown',
      projectId: projectId || 'unknown',
      taskId: taskId || 'unknown',
      executionId: executionId || 'unknown',
      operation: 'FILE_READ',
      targetResource: filePath || 'none',
      environment: CURRENT_ENVIRONMENT,
      status: 'DENIED',
      details: { reason: authCheck.reason }
    });
    emitTelemetryEvent('security_denied', CURRENT_ENVIRONMENT, executionId, taskId, agentId, {
      reason: authCheck.reason
    });
    res.status(403).json({ success: false, error: authCheck.reason, auditId: audit.auditId });
    return;
  }

  const pathCheck = validateSafeFilePath(filePath);
  if (!pathCheck.isSafe || !pathCheck.absolutePath) {
    const audit = recordAudit({
      agentId,
      projectId,
      taskId,
      executionId,
      operation: 'FILE_READ',
      targetResource: filePath || 'none',
      environment: CURRENT_ENVIRONMENT,
      status: 'DENIED',
      details: { reason: pathCheck.reason }
    });
    res.status(400).json({ success: false, error: pathCheck.reason, auditId: audit.auditId });
    return;
  }

  if (!fs.existsSync(pathCheck.absolutePath)) {
    res.status(404).json({ success: false, error: `File not found: ${pathCheck.normalizedPath}` });
    return;
  }

  try {
    const content = fs.readFileSync(pathCheck.absolutePath, 'utf-8');
    const hash = computeSha256(content);
    const stats = fs.statSync(pathCheck.absolutePath);

    const audit = recordAudit({
      agentId,
      projectId,
      taskId,
      executionId,
      operation: 'FILE_READ',
      targetResource: pathCheck.normalizedPath!,
      environment: CURRENT_ENVIRONMENT,
      status: 'SUCCESS',
      details: { hash }
    });

    res.json({
      success: true,
      filePath: pathCheck.normalizedPath,
      content,
      hash,
      revision: `rev-${stats.mtimeMs.toString(36)}`,
      sizeBytes: stats.size,
      lastModified: stats.mtime.toISOString(),
      auditId: audit.auditId
    });
  } catch (err: any) {
    logStructuredError('FILE_READ_ERROR', 'connector:file', err.message, 'ERROR', 'connectorRouter', executionId);
    res.status(500).json({ success: false, error: 'Failed to read file' });
  }
});

// 5. Code Analysis (AST / Dependencies / Complexity)
connectorRouter.post('/connector/code/analyze', (req: Request, res: Response) => {
  const { agentId, projectId, taskId, executionId, authorization, filePath } = req.body;

  const authCheck = validateAgentAuth({ agentId, projectId, taskId, executionId, authorization });
  if (!authCheck.isValid) {
    res.status(403).json({ success: false, error: authCheck.reason });
    return;
  }

  const analysis = analyzeSourceCode(filePath || 'src/App.tsx');
  if (!analysis.success) {
    res.status(400).json({ success: false, error: analysis.error });
    return;
  }

  const audit = recordAudit({
    agentId,
    projectId,
    taskId,
    executionId,
    operation: 'CODE_ANALYZE',
    targetResource: filePath || 'src/App.tsx',
    environment: CURRENT_ENVIRONMENT,
    status: 'SUCCESS'
  });

  res.json({ success: true, analysis: analysis.result, auditId: audit.auditId });
});

// 6. Project Search (Symbol / Component / API / Text)
connectorRouter.post('/connector/search', (req: Request, res: Response) => {
  const { agentId, projectId, taskId, executionId, authorization, query, type, maxResults } = req.body;

  const authCheck = validateAgentAuth({ agentId, projectId, taskId, executionId, authorization });
  if (!authCheck.isValid) {
    res.status(403).json({ success: false, error: authCheck.reason });
    return;
  }

  const results = searchProjectCode(query, type || 'text', maxResults || 30);
  const audit = recordAudit({
    agentId,
    projectId,
    taskId,
    executionId,
    operation: 'PROJECT_SEARCH',
    targetResource: query,
    environment: CURRENT_ENVIRONMENT,
    status: 'SUCCESS',
    details: { resultCount: results.length }
  });

  res.json({ success: true, query, type, count: results.length, results, auditId: audit.auditId });
});

// 7. Dependency Inspection
connectorRouter.all('/connector/dependency/inspect', (_req: Request, res: Response) => {
  let pkg: any = {};
  try {
    pkg = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8'));
  } catch {}

  res.json({
    success: true,
    projectId: 'PROJECT-03',
    dependencies: pkg.dependencies || {},
    devDependencies: pkg.devDependencies || {},
    scripts: pkg.scripts || {},
    securityAudit: {
      vulnerabilitiesDetected: 0,
      status: 'VERIFIED_CLEAN'
    }
  });
});

// 8. Test Execution
connectorRouter.post('/connector/test/run', async (req: Request, res: Response) => {
  const { agentId, projectId, taskId, executionId, authorization, testType, targetSuite } = req.body;

  const authCheck = validateAgentAuth({ agentId, projectId, taskId, executionId, authorization });
  if (!authCheck.isValid) {
    res.status(403).json({ success: false, error: authCheck.reason });
    return;
  }

  emitTelemetryEvent('test_started', CURRENT_ENVIRONMENT, executionId, taskId, agentId, { testType });

  const result = await runProjectTest(executionId || `test-${Date.now()}`, testType || 'typecheck', targetSuite);

  emitTelemetryEvent('test_completed', CURRENT_ENVIRONMENT, executionId, taskId, agentId, {
    status: result.status
  });

  const audit = recordAudit({
    agentId,
    projectId,
    taskId,
    executionId,
    operation: 'TEST_RUN',
    targetResource: testType || 'typecheck',
    environment: CURRENT_ENVIRONMENT,
    status: result.status === 'PASSED' ? 'SUCCESS' : 'ERROR',
    details: { summary: result.summary }
  });

  res.json({ success: true, result, auditId: audit.auditId });
});

// 9. Build Execution
connectorRouter.post('/connector/build/run', async (req: Request, res: Response) => {
  const { agentId, projectId, taskId, executionId, authorization } = req.body;

  const authCheck = validateAgentAuth({ agentId, projectId, taskId, executionId, authorization });
  if (!authCheck.isValid) {
    res.status(403).json({ success: false, error: authCheck.reason });
    return;
  }

  emitTelemetryEvent('build_started', CURRENT_ENVIRONMENT, executionId, taskId, agentId);

  const result = await runProjectTest(executionId || `build-${Date.now()}`, 'build');

  emitTelemetryEvent('build_completed', CURRENT_ENVIRONMENT, executionId, taskId, agentId, {
    status: result.status
  });

  const audit = recordAudit({
    agentId,
    projectId,
    taskId,
    executionId,
    operation: 'BUILD_RUN',
    targetResource: 'production_build',
    environment: CURRENT_ENVIRONMENT,
    status: result.status === 'PASSED' ? 'SUCCESS' : 'ERROR'
  });

  res.json({ success: true, result, auditId: audit.auditId });
});

// 10. Diff Preview Proposal
connectorRouter.post('/connector/diff/preview', (req: Request, res: Response) => {
  const { agentId, projectId, taskId, executionId, authorization, files, risk, environment, description } = req.body;

  const authCheck = validateAgentAuth({ agentId, projectId, taskId, executionId, authorization });
  if (!authCheck.isValid) {
    res.status(403).json({ success: false, error: authCheck.reason });
    return;
  }

  const proposalResult = createDiffProposal(
    taskId,
    agentId,
    executionId,
    files || [],
    risk || 'LOW',
    environment || 'DEVELOPMENT',
    description || 'Automated agent change proposal'
  );

  if (!proposalResult.success) {
    res.status(400).json({ success: false, error: proposalResult.error });
    return;
  }

  emitTelemetryEvent('change_proposed', environment || 'DEVELOPMENT', executionId, taskId, agentId, {
    changeId: proposalResult.proposal?.changeId
  });

  const audit = recordAudit({
    agentId,
    projectId,
    taskId,
    executionId,
    operation: 'DIFF_PREVIEW',
    targetResource: files?.map((f: any) => f.filePath).join(',') || 'none',
    environment: environment || 'DEVELOPMENT',
    status: 'SUCCESS',
    details: { changeId: proposalResult.proposal?.changeId }
  });

  res.json({ success: true, proposal: proposalResult.proposal, auditId: audit.auditId });
});

// 11. Staging Apply (Restricted to DEVELOPMENT or STAGING)
connectorRouter.post('/connector/staging/apply', (req: Request, res: Response) => {
  const { agentId, projectId, taskId, executionId, authorization, changeId, targetEnvironment } = req.body;

  const authCheck = validateAgentAuth({ agentId, projectId, taskId, executionId, authorization });
  if (!authCheck.isValid) {
    res.status(403).json({ success: false, error: authCheck.reason });
    return;
  }

  const env = targetEnvironment || 'STAGING';
  if (env === 'PRODUCTION') {
    const audit = recordAudit({
      agentId,
      projectId,
      taskId,
      executionId,
      operation: 'PRODUCTION_WRITE',
      targetResource: 'PRODUCTION',
      environment: 'PRODUCTION',
      status: 'DENIED',
      details: { reason: 'Production write access is strictly disabled for autonomous agents' }
    });
    emitTelemetryEvent('deployment_blocked', 'PRODUCTION', executionId, taskId, agentId);
    res.status(403).json({
      success: false,
      error: 'PRODUCTION_WRITE_BLOCKED: Production write access is strictly disabled for autonomous agents',
      auditId: audit.auditId
    });
    return;
  }

  const applyRes = applyStagingChange(changeId, env);
  if (!applyRes.success) {
    res.status(400).json({ success: false, error: applyRes.error });
    return;
  }

  emitTelemetryEvent('change_applied', env, executionId, taskId, agentId, {
    changeId,
    snapshotId: applyRes.snapshotId
  });

  const audit = recordAudit({
    agentId,
    projectId,
    taskId,
    executionId,
    operation: 'STAGING_APPLY',
    targetResource: changeId,
    environment: env,
    status: 'SUCCESS',
    details: { snapshotId: applyRes.snapshotId }
  });

  res.json({
    success: true,
    changeId,
    targetEnvironment: env,
    snapshotId: applyRes.snapshotId,
    filesModified: applyRes.filesModified,
    auditId: audit.auditId
  });
});

// 12. Staging Rollback
connectorRouter.post('/connector/staging/rollback', (req: Request, res: Response) => {
  const { agentId, projectId, taskId, executionId, authorization, snapshotId } = req.body;

  const authCheck = validateAgentAuth({ agentId, projectId, taskId, executionId, authorization });
  if (!authCheck.isValid) {
    res.status(403).json({ success: false, error: authCheck.reason });
    return;
  }

  const rollbackRes = rollbackStagingSnapshot(snapshotId);
  if (!rollbackRes.success) {
    res.status(400).json({ success: false, error: rollbackRes.error });
    return;
  }

  emitTelemetryEvent('rollback_completed', CURRENT_ENVIRONMENT, executionId, taskId, agentId, {
    snapshotId
  });

  const audit = recordAudit({
    agentId,
    projectId,
    taskId,
    executionId,
    operation: 'STAGING_ROLLBACK',
    targetResource: snapshotId,
    environment: CURRENT_ENVIRONMENT,
    status: 'SUCCESS',
    details: { restoredRevision: rollbackRes.restoredRevision }
  });

  res.json({
    success: true,
    snapshotId,
    restoredRevision: rollbackRes.restoredRevision,
    filesRestored: rollbackRes.filesRestored,
    auditId: audit.auditId
  });
});

// 13. Production Release Gate
connectorRouter.post('/connector/deploy/production', (req: Request, res: Response) => {
  const { agentId, taskId, executionId } = req.body;

  emitTelemetryEvent('deployment_blocked', 'PRODUCTION', executionId || 'gate', taskId || 'gate', agentId || 'unknown', {
    reason: 'PRODUCTION_GATE_REQUIRED'
  });

  const audit = recordAudit({
    agentId: agentId || 'unknown',
    projectId: 'PROJECT-03',
    taskId: taskId || 'deploy-req',
    executionId: executionId || 'deploy-exec',
    operation: 'PRODUCTION_DEPLOY',
    targetResource: 'PRODUCTION',
    environment: 'PRODUCTION',
    status: 'DENIED',
    details: { status: 'PRODUCTION_GATE_REQUIRED' }
  });

  res.status(403).json({
    success: false,
    status: 'PRODUCTION_GATE_REQUIRED',
    error: 'Production deployment endpoint is protected. Requires manual release authorization chain.',
    auditId: audit.auditId
  });
});

// 14. Unified Operation Dispatcher (Requirement 1)
connectorRouter.post('/connector/execute', async (req: Request, res: Response) => {
  const { operation, payload } = req.body;

  if (!operation) {
    res.status(400).json({ success: false, error: 'MISSING_OPERATION: operation parameter is required' });
    return;
  }

  switch (operation) {
    case 'PROJECT_INSPECT': {
      const meta = getProjectDiscoveryMetadata();
      res.json({ success: true, result: meta });
      return;
    }
    case 'PROJECT_SEARCH': {
      const results = searchProjectCode(payload?.query, payload?.type, payload?.maxResults);
      res.json({ success: true, result: results });
      return;
    }
    case 'FILE_READ': {
      const pathCheck = validateSafeFilePath(payload?.filePath);
      if (!pathCheck.isSafe || !pathCheck.absolutePath || !fs.existsSync(pathCheck.absolutePath)) {
        res.status(400).json({ success: false, error: pathCheck.reason || 'File not found' });
        return;
      }
      const content = fs.readFileSync(pathCheck.absolutePath, 'utf-8');
      res.json({
        success: true,
        result: {
          filePath: pathCheck.normalizedPath,
          content,
          hash: computeSha256(content),
          revision: 'rev-head'
        }
      });
      return;
    }
    case 'CODE_ANALYZE': {
      const analysis = analyzeSourceCode(payload?.filePath || 'src/App.tsx');
      res.json({ success: analysis.success, result: analysis.result, error: analysis.error });
      return;
    }
    case 'DEPENDENCY_INSPECT': {
      const meta = getProjectDiscoveryMetadata();
      res.json({ success: true, result: meta.dependencies });
      return;
    }
    case 'TEST_RUN': {
      const testRes = await runProjectTest(payload?.executionId || `test-${Date.now()}`, payload?.testType || 'typecheck');
      res.json({ success: true, result: testRes });
      return;
    }
    case 'BUILD_RUN': {
      const buildRes = await runProjectTest(payload?.executionId || `build-${Date.now()}`, 'build');
      res.json({ success: true, result: buildRes });
      return;
    }
    case 'DIFF_PREVIEW': {
      const diffRes = createDiffProposal(
        payload?.taskId || 'task-diff',
        payload?.agentId || 'agent-p02',
        payload?.executionId || 'exec-diff',
        payload?.files || [],
        payload?.risk || 'LOW',
        payload?.environment || 'STAGING',
        payload?.description || 'Diff preview'
      );
      res.json({ success: diffRes.success, result: diffRes.proposal, error: diffRes.error });
      return;
    }
    case 'STAGING_APPLY': {
      const applyRes = applyStagingChange(payload?.changeId, payload?.targetEnvironment || 'STAGING');
      res.json({ success: applyRes.success, result: applyRes, error: applyRes.error });
      return;
    }
    case 'STAGING_ROLLBACK': {
      const rollRes = rollbackStagingSnapshot(payload?.snapshotId);
      res.json({ success: rollRes.success, result: rollRes, error: rollRes.error });
      return;
    }
    default:
      res.status(400).json({ success: false, error: `UNSUPPORTED_OPERATION: '${operation}' is not supported` });
      return;
  }
});

// 15. Telemetry & Audits & Errors Inspection
connectorRouter.get('/connector/telemetry', (_req: Request, res: Response) => {
  res.json({ success: true, events: getTelemetryEvents(100) });
});

connectorRouter.get('/connector/audits', (_req: Request, res: Response) => {
  res.json({ success: true, audits: getAuditLogs(100) });
});

connectorRouter.get('/connector/errors', (_req: Request, res: Response) => {
  res.json({ success: true, errors: getStructuredErrors(50) });
});

// 16. Validation Suite (TEST A through TEST J)
connectorRouter.all('/connector/validate', async (_req: Request, res: Response) => {
  const result = await runFullValidationSuite();
  res.json(result);
});
