// In-browser JavaScript sandbox. Runs user code inside a dedicated Web Worker
// (no DOM access), captures console output, and hard-kills on timeout. This
// keeps RUN CODE and Arena scoring instant with zero backend configuration.

const WORKER_SOURCE = `
  const logs = [];
  const format = (args) => args.map((value) => {
    if (typeof value === "string") return value;
    if (value instanceof Error) return value.stack || String(value);
    try { return JSON.stringify(value); } catch { return String(value); }
  }).join(" ");
  ["log", "info", "warn", "error", "debug"].forEach((level) => {
    console[level] = (...args) => logs.push(format(args));
  });
  onmessage = (event) => {
    try {
      new Function(event.data)();
      postMessage({ ok: true, output: logs.join("\\n") });
    } catch (error) {
      postMessage({
        ok: false,
        output: logs.join("\\n"),
        error: error && error.stack ? String(error.stack) : String(error),
      });
    }
  };
`;

export function runJavaScriptLocally(sourceCode: string, timeoutMs = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([WORKER_SOURCE], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    const cleanup = () => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };

    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Execution timed out after ${timeoutMs / 1000}s. Check for infinite loops.`));
    }, timeoutMs);

    worker.onmessage = (event) => {
      window.clearTimeout(timeout);
      cleanup();
      const { ok, output, error } = event.data as { ok: boolean; output: string; error?: string };

      if (ok) {
        resolve(output);
      } else {
        reject(new Error([error, output].filter(Boolean).join("\n")));
      }
    };

    worker.onerror = (event) => {
      window.clearTimeout(timeout);
      cleanup();
      reject(new Error(event.message || "Sandbox worker failed."));
    };

    worker.postMessage(sourceCode);
  });
}
