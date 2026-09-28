/**
 * PROJECT-03 Target Application Development Connector Types
 * Compliant with PROJECT-02 Agent Control Center Integration Specification
 */

export type ProjectEnvironment = 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';

export type ConnectorOperation =
  | 'PROJECT_INSPECT'
  | 'PROJECT_SEARCH'
  | 'FILE_READ'
  | 'CODE_ANALYZE'
  | 'DEPENDENCY_INSPECT'
  | 'TEST_RUN'
  | 'BUILD_RUN'
  | 'DIFF_PREVIEW'
  | 'STAGING_APPLY'
  | 'STAGING_ROLLBACK';

export interface ProjectIdentity {
  projectId: 'PROJECT-03';
  projectName: string;
  environment: ProjectEnvironment;
  version: string;
  buildVersion: string;
  gitRevision: string;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  uptimeSeconds: number;
}

export interface AgentAuthPayload {
  agentId: string;
  projectId: string;
  taskId: string;
  executionId: string;
  authorization: string; // Token signature e.g. p02-auth-token-...
}

export interface FileReadRequest extends AgentAuthPayload {
  filePath: string;
}

export interface FileReadResult {
  filePath: string;
  content: string;
  hash: string;
  revision: string;
  sizeBytes: number;
  lastModified: string;
  auditId: string;
}

export interface AuditRecord {
  auditId: string;
  timestamp: string;
  agentId: string;
  projectId: string;
  taskId: string;
  executionId: string;
  operation: string;
  targetResource: string;
  environment: ProjectEnvironment;
  status: 'SUCCESS' | 'DENIED' | 'ERROR';
  details?: Record<string, unknown>;
}

export interface CodeAnalysisResult {
  filePath: string;
  imports: string[];
  exports: string[];
  componentRelationships: {
    componentsDeclared: string[];
    subcomponentsUsed: string[];
  };
  apiRelationships: {
    endpointsReferenced: string[];
    storageInteractions: string[];
  };
  dependencyGraph: {
    internalDeps: string[];
    externalDeps: string[];
  };
  complexityIndicators: {
    linesOfCode: number;
    estimatedCyclomaticComplexity: number;
    dependencyFanOut: number;
    exportedSymbolsCount: number;
  };
}

export interface SearchQueryRequest extends AgentAuthPayload {
  query: string;
  type: 'symbol' | 'component' | 'api' | 'text';
  maxResults?: number;
}

export interface SearchResultItem {
  filePath: string;
  lineNumber: number;
  matchSnippet: string;
  matchType: 'symbol' | 'component' | 'api' | 'text';
}

export interface TestExecutionRequest extends AgentAuthPayload {
  testType: 'unit' | 'integration' | 'e2e' | 'typecheck' | 'lint' | 'build';
  targetSuite?: string;
}

export type ExecutionState = 'QUEUED' | 'RUNNING' | 'PASSED' | 'FAILED';

export interface TestExecutionResult {
  executionId: string;
  testType: string;
  status: ExecutionState;
  durationMs: number;
  startedAt: string;
  completedAt: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  logs: string[];
}

export interface DiffProposalRequest extends AgentAuthPayload {
  files: Array<{
    filePath: string;
    originalContent?: string;
    proposedContent: string;
  }>;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  environment: ProjectEnvironment;
  description: string;
}

export interface DiffProposalRecord {
  changeId: string;
  taskId: string;
  agentId: string;
  executionId: string;
  files: string[];
  diff: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  environment: ProjectEnvironment;
  createdAt: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'APPLIED' | 'REJECTED';
}

export interface StagingApplyRequest extends AgentAuthPayload {
  changeId: string;
  targetEnvironment: ProjectEnvironment;
}

export interface StagingSnapshot {
  snapshotId: string;
  projectRevision: string;
  createdAt: string;
  files: Record<string, string>;
  description: string;
}

export interface TelemetryEvent {
  eventId: string;
  eventType:
    | 'application_started'
    | 'application_health'
    | 'test_started'
    | 'test_completed'
    | 'build_started'
    | 'build_completed'
    | 'change_proposed'
    | 'change_applied'
    | 'rollback_completed'
    | 'security_denied'
    | 'deployment_blocked';
  timestamp: string;
  projectId: 'PROJECT-03';
  environment: ProjectEnvironment;
  executionId: string;
  taskId: string;
  agentId: string;
  payload?: Record<string, unknown>;
}

export interface StructuredAppError {
  errorId: string;
  type: string;
  service: string;
  message: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  timestamp: string;
  stackReference: string;
  relatedExecutionId?: string;
}

export interface HealthCheckResponse {
  application: string;
  version: string;
  environment: ProjectEnvironment;
  databaseStatus: 'CONNECTED' | 'LOCAL_CACHE_ONLINE' | 'DEGRADED';
  apiStatus: 'OPERATIONAL' | 'DEGRADED';
  dependencyStatus: 'HEALTHY' | 'AUDIT_FLAGGED';
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  timestamp: string;
}

export interface ValidationTestItem {
  id: string;
  name: string;
  executionId: string;
  auditId: string;
  status: 'PASS' | 'FAIL' | 'CONTROLLED';
  durationMs: number;
  details: string;
}

export interface ValidationSuiteResult {
  suiteExecutionId: string;
  timestamp: string;
  tests: Record<string, ValidationTestItem>;
  overallStatus: 'PASS' | 'PARTIAL' | 'FAIL';
  readinessScore: number;
  summary: string;
}
