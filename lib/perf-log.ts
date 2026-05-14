const enabled = process.env.NODE_ENV !== "production";

/**
 * Wraps an async function with a high-resolution dev-only timing log.
 * No-op in production builds. Use for `/projects/[id]` instrumentation.
 */
export async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  if (!enabled) return fn();
  const start = performance.now();
  try {
    const out = await fn();
    const ms = performance.now() - start;
    // eslint-disable-next-line no-console
    console.log(`[perf] ${label} ${ms.toFixed(1)}ms`);
    return out;
  } catch (err) {
    const ms = performance.now() - start;
    // eslint-disable-next-line no-console
    console.log(`[perf] ${label} ${ms.toFixed(1)}ms (error)`);
    throw err;
  }
}

export function timedSync<T>(label: string, fn: () => T): T {
  if (!enabled) return fn();
  const start = performance.now();
  try {
    const out = fn();
    const ms = performance.now() - start;
    // eslint-disable-next-line no-console
    console.log(`[perf] ${label} ${ms.toFixed(1)}ms`);
    return out;
  } catch (err) {
    const ms = performance.now() - start;
    // eslint-disable-next-line no-console
    console.log(`[perf] ${label} ${ms.toFixed(1)}ms (error)`);
    throw err;
  }
}
