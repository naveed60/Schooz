const SENSITIVE_KEY = /(password|secret|token|authorization|cookie|service.?role|api.?key|private.?key)/i;
const MAX_STRING_LENGTH = 2000;
const MAX_KEYS = 40;

function safeValue(value: unknown, depth = 0): unknown {
  if (depth > 3) return '[truncated]';
  if (typeof value === 'string') return value.slice(0, MAX_STRING_LENGTH);
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) return value;
  if (Array.isArray(value)) return value.slice(0, 20).map(item => safeValue(item, depth + 1));
  if (typeof value === 'object' && value) {
    return Object.fromEntries(
      Object.entries(value).slice(0, MAX_KEYS).map(([key, item]) => [
        key,
        SENSITIVE_KEY.test(key) ? '[redacted]' : safeValue(item, depth + 1),
      ])
    );
  }
  return String(value);
}

export type StructuredLogger = {
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
};

type LogOutput = Pick<Console, 'info' | 'warn' | 'error'>;

export function createLogger(requestId: string, output: LogOutput = console): StructuredLogger {
  const write = (level: string, message: string, fields?: Record<string, unknown>) => {
    const event = safeValue({ level, message, requestId, ...fields });
    output[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info'](
      JSON.stringify(event)
    );
  };
  return {
    info: (message, fields) => write('info', message, fields),
    warn: (message, fields) => write('warn', message, fields),
    error: (message, fields) => write('error', message, fields),
  };
}

export { safeValue as sanitizeLogValue };
