/**
 * Safe production logger that redacts API keys, tokens, and sensitive secrets.
 */

const SENSITIVE_PATTERNS = [
  /AIza[0-9A-Za-z-_]{35}/g, // Google API keys
  /sk-[a-zA-Z0-9_-]{20,}/g, // OpenAI / Groq / Anthropic keys
  /gsk_[a-zA-Z0-9_-]{20,}/g, // Groq keys
  /Bearer\s+[A-Za-z0-9-_.]+/gi, // Bearer tokens
  /password=["'][^"']*["']/gi,
  /apiKey=["'][^"']*["']/gi,
];

function sanitize(input: unknown): unknown {
  if (typeof input === "string") {
    let sanitized = input;
    for (const pattern of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pattern, "[REDACTED_SECRET]");
    }
    return sanitized;
  }
  if (typeof input === "object" && input !== null) {
    if (Array.isArray(input)) {
      return input.map(sanitize);
    }
    const sanitizedObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes("key") ||
        lowerKey.includes("secret") ||
        lowerKey.includes("token") ||
        lowerKey.includes("password") ||
        lowerKey.includes("authorization")
      ) {
        if (typeof value === "string" && value.length > 8) {
          sanitizedObj[key] = `${value.slice(0, 3)}••••${value.slice(-3)}`;
        } else {
          sanitizedObj[key] = "[REDACTED]";
        }
      } else {
        sanitizedObj[key] = sanitize(value);
      }
    }
    return sanitizedObj;
  }
  return input;
}

export const safeLogger = {
  info(tag: string, message: string, meta?: unknown) {
    const timestamp = new Date().toISOString();
    if (meta !== undefined) {
      console.log(`[${timestamp}] [INFO] [${tag}] ${String(sanitize(message))}`, sanitize(meta));
    } else {
      console.log(`[${timestamp}] [INFO] [${tag}] ${String(sanitize(message))}`);
    }
  },

  warn(tag: string, message: string, meta?: unknown) {
    const timestamp = new Date().toISOString();
    if (meta !== undefined) {
      console.warn(`[${timestamp}] [WARN] [${tag}] ${String(sanitize(message))}`, sanitize(meta));
    } else {
      console.warn(`[${timestamp}] [WARN] [${tag}] ${String(sanitize(message))}`);
    }
  },

  error(tag: string, message: string, errorObj?: unknown) {
    const timestamp = new Date().toISOString();
    const sanitizedError = errorObj instanceof Error ? {
      message: errorObj.message,
      name: errorObj.name,
      stack: errorObj.stack ? sanitize(errorObj.stack) : undefined,
    } : sanitize(errorObj);

    if (sanitizedError !== undefined) {
      console.error(`[${timestamp}] [ERROR] [${tag}] ${String(sanitize(message))}`, sanitizedError);
    } else {
      console.error(`[${timestamp}] [ERROR] [${tag}] ${String(sanitize(message))}`);
    }
  },
};
