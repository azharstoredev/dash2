// API diagnostics utility to help debug network issues

export interface DiagnosticResult {
  endpoint: string;
  success: boolean;
  status?: number;
  error?: string;
  responseTime: number;
}

export async function runApiDiagnostics(): Promise<DiagnosticResult[]> {
  const endpoints = [
    "/api/ping",
    "/api/customers",
    "/api/products",
    "/api/orders",
    "/api/categories",
  ];

  const results: DiagnosticResult[] = [];

  for (const endpoint of endpoints) {
    const startTime = Date.now();
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        results.push({
          endpoint,
          success: true,
          status: response.status,
          responseTime,
        });
      } else {
        results.push({
          endpoint,
          success: false,
          status: response.status,
          error: response.statusText,
          responseTime,
        });
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      results.push({
        endpoint,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        responseTime,
      });
    }
  }

  return results;
}

export function logDiagnostics(results: DiagnosticResult[]) {
  console.group("🔍 API Diagnostics");

  results.forEach((result) => {
    const icon = result.success ? "✅" : "❌";
    const timing = `${result.responseTime}ms`;

    if (result.success) {
      console.log(`${icon} ${result.endpoint} - ${result.status} (${timing})`);
    } else {
      console.error(`${icon} ${result.endpoint} - ${result.error} (${timing})`);
    }
  });

  const successCount = results.filter((r) => r.success).length;
  const avgResponseTime =
    results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

  console.log(
    `\n📊 Summary: ${successCount}/${results.length} endpoints working`,
  );
  console.log(`⏱️ Average response time: ${avgResponseTime.toFixed(0)}ms`);

  console.groupEnd();
}

// Helper to run diagnostics and log results
export async function diagnoseApiHealth() {
  const results = await runApiDiagnostics();
  logDiagnostics(results);
  return results;
}
