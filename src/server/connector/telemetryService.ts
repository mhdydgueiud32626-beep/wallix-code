import crypto from 'crypto';
import { ProjectEnvironment, StructuredAppError, TelemetryEvent } from './types';

const telemetryEvents: TelemetryEvent[] = [];
const errorLogs: StructuredAppError[] = [];

/**
 * Emits a structured telemetry event
 */
export function emitTelemetryEvent(
  eventType: TelemetryEvent['eventType'],
  environment: ProjectEnvironment,
  executionId: string,
  taskId: string,
  agentId: string,
  payload?: Record<string, unknown>
): TelemetryEvent {
  const event: TelemetryEvent = {
    eventId: `evt-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    eventType,
    timestamp: new Date().toISOString(),
    projectId: 'PROJECT-03',
    environment,
    executionId: executionId || 'system-init',
    taskId: taskId || 'task-root',
    agentId: agentId || 'agent-system',
    payload
  };

  telemetryEvents.unshift(event);

  if (telemetryEvents.length > 500) {
    telemetryEvents.length = 500;
  }

  return event;
}

export function getTelemetryEvents(limit = 100): TelemetryEvent[] {
  return telemetryEvents.slice(0, limit);
}

/**
 * Records a structured application error without secrets
 */
export function logStructuredError(
  type: string,
  service: string,
  message: string,
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'ERROR',
  stackReference = 'connector:internal',
  relatedExecutionId?: string
): StructuredAppError {
  // Sanitize message to strip any potential secret values
  const cleanMsg = message
    .replace(/(key|token|password|secret)=([^& ]+)/gi, '$1=[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED]');

  const errorItem: StructuredAppError = {
    errorId: `err-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
    type,
    service,
    message: cleanMsg,
    severity,
    timestamp: new Date().toISOString(),
    stackReference,
    relatedExecutionId
  };

  errorLogs.unshift(errorItem);
  if (errorLogs.length > 200) {
    errorLogs.length = 200;
  }

  return errorItem;
}

export function getStructuredErrors(limit = 50): StructuredAppError[] {
  return errorLogs.slice(0, limit);
}
