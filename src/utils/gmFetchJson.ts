import { GM_xmlhttpRequest } from "$";

export function gmFetchJson<T>(
  url: string,
  opts: {
    method: "GET" | "POST" | "PUT" | "DELETE";
    headers?: Record<string, string>;
    data?: string;
    timeout?: number;
    signal?: AbortSignal;
  }
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const req = GM_xmlhttpRequest({
      url,
      method: opts.method,
      headers: opts.headers,
      data: opts.data,
      timeout: opts.timeout ?? 30000,
      onload: (res) => {
        if (res.status < 200 || res.status >= 300) {
          reject(
            new Error(
              `HTTP ${res.status}: ${res.responseText || res.statusText}`
            )
          );
          return;
        }
        try {
          resolve(JSON.parse(res.responseText || "{}") as T);
        } catch (e) {
          reject(e);
        }
      },
      onerror: () => reject(new Error("Network error")),
      ontimeout: () => reject(new Error("Request timed out")),
    });

    if (opts.signal) {
      if (opts.signal.aborted) {
        try {
          req.abort();
        } catch {}
        return reject(new Error("Aborted"));
      }
      const onAbort = () => {
        try {
          req.abort();
        } catch {}
        reject(new Error("Aborted"));
      };
      opts.signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}
